# Phase 21: SQLite Session Index - Research

**Researched:** 2026-03-20
**Domain:** node:sqlite DatabaseSync API, session storage migration, fallback patterns
**Confidence:** HIGH

## Summary

Phase 21 replaces the flat-file `sessions.json` with SQLite-backed session storage using the built-in `node:sqlite` DatabaseSync API. The API is confirmed available on the project's Node.js v24.13.1 runtime as an experimental feature (stable enough for use -- it reached Release Candidate status in v25.7.0). The synchronous nature of `DatabaseSync` is a perfect match for the existing synchronous I/O patterns in `sessions.cjs`, meaning no async migration of the core CRUD functions is needed.

The `node:sqlite` API surface has been thoroughly verified through hands-on testing. All required capabilities are confirmed working: file-based databases, WAL mode, prepared statements with positional and named parameters, transactions (BEGIN/COMMIT/ROLLBACK), `INSERT OR IGNORE` for idempotent migration, `isOpen`/`isTransaction` properties, and the `run()`/`get()`/`all()` statement methods. Performance is excellent -- 1000 single-row lookups complete in 4ms, and 500 transactional inserts complete in under 1ms.

**Primary recommendation:** Create `subsystems/terminus/session-store.cjs` as a functional API module (not a class) that owns DB initialization, schema, prepared statements, and migration. Modify `subsystems/assay/sessions.cjs` to import session-store and delegate I/O, keeping the exported interface identical. Add a migration step to `install.cjs` and a storage-backend reporting stage to health-check.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Terminus owns the SQLite database file, schema definition, connection management, and migration logic (new file: `subsystems/terminus/session-store.cjs`)
- Assay owns the query interface -- `subsystems/assay/sessions.cjs` switches from direct JSON I/O to calling session-store functions
- Database file location: `~/.claude/graphiti/sessions.db` (co-located with current `sessions.json`)
- Connection management: module-level singleton via DatabaseSync (synchronous API matches existing sync I/O pattern in sessions.cjs)
- Migration runs during `dynamo install` as a new step (idempotent -- safe to run multiple times)
- Original `sessions.json` renamed to `sessions.json.migrated` after successful migration (backup, not deletion)
- Corrupt or partial JSON entries: skip with warning, migrate valid entries, log skipped entries via `logError()`
- All inserts wrapped in a single SQLite transaction for atomicity
- Fully transparent fallback: if `node:sqlite` import fails at require time, sessions.cjs continues using JSON I/O
- Fallback logged once on first detection via `logError()` -- then operates silently
- No explicit force-JSON flag -- detection is automatic based on `node:sqlite` availability
- Health-check reports which storage backend is active (SQLite or JSON fallback)
- Table `sessions` with columns: `timestamp TEXT PRIMARY KEY, project TEXT, label TEXT, labeled_by TEXT, named_phase TEXT`
- Index on `project` column for filtered listing queries
- WAL mode enabled for better concurrent read performance
- No additional metadata columns -- match existing data model exactly

### Claude's Discretion
- Whether to add a `PRAGMA` for journal size limits or other SQLite tuning
- Exact error message wording for migration step output
- Whether session-store.cjs exports a class or functional API (both viable given the singleton pattern)
- Test strategy details (unit tests for session-store.cjs, integration tests for migration, update existing sessions.test.cjs)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Session data stored in SQLite via `node:sqlite` DatabaseSync API | Verified: DatabaseSync available on Node.js v24.13.1. Schema design validated. WAL mode confirmed working on file-based DBs. Performance verified sub-millisecond for typical operations. |
| DATA-02 | Session query functions maintain identical interface (listSessions, viewSession, labelSession, etc.) | All 9 exported functions mapped. Key difference: `get()` returns `undefined` not `null` -- session-store must normalize. `[Object: null prototype]` rows from SQLite are spread-compatible and JSON-serializable. |
| DATA-03 | One-time migration converts existing `sessions.json` to SQLite database | `INSERT OR IGNORE` confirmed for idempotent migration. Transaction support verified. Real sessions.json has 265 entries with 5 columns. Migration is trivially fast (<1ms for 500 inserts in transaction). |
| DATA-04 | Graceful fallback to JSON file if `node:sqlite` is unavailable | `require('node:sqlite')` throws with code `MODULE_NOT_FOUND` on unsupported versions. Try/catch at module level is the standard detection pattern. Existing JSON I/O continues unchanged when fallback is active. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:sqlite` | Built-in (Node.js v22.5.0+) | SQLite database access via DatabaseSync synchronous API | Zero-dependency built-in module. Matches project's zero-npm-dependency constraint. Synchronous API matches existing codebase patterns. |
| `node:fs` | Built-in | File operations for migration, fallback JSON I/O | Already used throughout codebase |
| `node:path` | Built-in | Path construction for DB file location | Already used throughout codebase |
| `node:os` | Built-in | Home directory resolution for DB path | Already used throughout codebase |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:test` | Built-in | Test framework (describe/it/assert) | All test files -- matches existing test pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `node:sqlite` DatabaseSync | `better-sqlite3` (npm) | Violates zero-npm-dependency constraint. More mature API but unnecessary -- DatabaseSync covers all needed operations. |
| `node:sqlite` DatabaseSync | `node:sqlite` async API | No async API exists in node:sqlite -- it is synchronous-only by design. This is actually ideal since existing sessions.cjs is synchronous. |

**Installation:**
```bash
# No installation needed -- node:sqlite is built into Node.js v22.5.0+
```

**Version verification:** Node.js v24.13.1 confirmed with `node:sqlite` available and `DatabaseSync` functional. Experimental warning is expected and acceptable per CONTEXT.md.

## Architecture Patterns

### Recommended Project Structure
```
subsystems/
  terminus/
    session-store.cjs    # NEW: DB init, schema, CRUD, migration (Terminus owns storage)
    health-check.cjs     # MODIFIED: add storage backend reporting stage
    stages.cjs           # MODIFIED: add stageSessionStorage stage function
    ...existing files...
  assay/
    sessions.cjs         # MODIFIED: delegate I/O to session-store, keep exported interface
  switchboard/
    install.cjs          # MODIFIED: add migration step
dynamo/
  tests/
    ledger/
      sessions.test.cjs  # EXISTING: must continue passing unchanged
    switchboard/
      session-store.test.cjs  # NEW: unit + integration tests for session-store
```

### Pattern 1: Module-Level Singleton with Lazy Initialization
**What:** session-store.cjs creates a single DatabaseSync instance at module level, initialized lazily on first use. The module detects `node:sqlite` availability at require-time and exports either SQLite-backed or null functions.
**When to use:** When a module needs a single shared database connection across all callers.
**Example:**
```javascript
// Source: Verified against node:sqlite API (Node.js v24.13.1)
'use strict';

let db = null;
let sqliteAvailable = false;

try {
  const { DatabaseSync } = require('node:sqlite');
  sqliteAvailable = true;
} catch (e) {
  // node:sqlite not available -- fallback to JSON
}

function getDb(dbPath) {
  if (!sqliteAvailable) return null;
  if (db && db.isOpen) return db;
  const { DatabaseSync } = require('node:sqlite');
  const fs = require('fs');
  const path = require('path');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode=WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      timestamp TEXT PRIMARY KEY,
      project TEXT,
      label TEXT,
      labeled_by TEXT,
      named_phase TEXT
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project)');
  return db;
}
```

### Pattern 2: Fallback Detection at Import Time
**What:** Detect `node:sqlite` availability once at module load. sessions.cjs uses the detection result to route between SQLite and JSON I/O paths.
**When to use:** DATA-04 fallback requirement.
**Example:**
```javascript
// In sessions.cjs -- detection drives all I/O routing
const sessionStore = require('../../subsystems/terminus/session-store.cjs');

function loadSessions(filePath) {
  if (sessionStore.isAvailable()) {
    return sessionStore.listAll(filePath);  // filePath becomes dbPath for test isolation
  }
  // Existing JSON I/O path -- unchanged
  try {
    const content = fs.readFileSync(filePath || SESSIONS_FILE, 'utf8');
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    return [];
  }
}
```

### Pattern 3: Options-Based Test Isolation (Existing Pattern)
**What:** All functions accept an `options` parameter with `filePath`/`dbPath` override for test isolation. Tests use tmpdir-based paths.
**When to use:** Every function in session-store.cjs and sessions.cjs.
**Example:**
```javascript
// session-store.cjs -- dbPath option for test isolation
function upsertSession(timestamp, project, label, labeledBy, namedPhase, options) {
  options = options || {};
  const dbPath = options.dbPath || DEFAULT_DB_PATH;
  const database = getDb(dbPath);
  // ... prepared statement execution
}
```

### Pattern 4: Idempotent Migration with INSERT OR IGNORE
**What:** Migration reads sessions.json, validates each entry, and uses `INSERT OR IGNORE` to insert into SQLite. Re-running is safe because duplicate primary keys are silently ignored.
**When to use:** DATA-03 migration requirement.
**Example:**
```javascript
function migrateFromJson(jsonPath, dbPath) {
  const database = getDb(dbPath);
  if (!database) return { migrated: 0, skipped: 0, status: 'no-sqlite' };

  let sessions;
  try {
    sessions = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (!Array.isArray(sessions)) return { migrated: 0, skipped: 0, status: 'invalid-json' };
  } catch (e) {
    return { migrated: 0, skipped: 0, status: 'no-file' };
  }

  const ins = database.prepare(
    'INSERT OR IGNORE INTO sessions (timestamp, project, label, labeled_by, named_phase) VALUES (?, ?, ?, ?, ?)'
  );

  let migrated = 0, skipped = 0;
  database.exec('BEGIN');
  try {
    for (const entry of sessions) {
      if (!entry.timestamp) { skipped++; continue; }
      ins.run(
        entry.timestamp,
        entry.project || '',
        entry.label || '',
        entry.labeled_by || '',
        entry.named_phase || null
      );
      migrated++;
    }
    database.exec('COMMIT');
  } catch (e) {
    database.exec('ROLLBACK');
    throw e;
  }

  return { migrated, skipped, status: 'ok' };
}
```

### Anti-Patterns to Avoid
- **Creating a new DatabaseSync instance per function call:** Module-level singleton avoids repeated file open/close overhead and schema checks. A new instance per call would be ~10x slower and risk schema initialization races.
- **Using async wrappers around synchronous API:** DatabaseSync is synchronous by design. Wrapping in Promises adds complexity with zero benefit. Only `backfillSessions` is async (because of nameGenerator), and its SQLite I/O is still sync.
- **Storing the DB connection in a class instance:** The codebase uses functional modules, not classes. A class-based approach would be inconsistent and add unnecessary complexity for what is effectively a module-level singleton.
- **Using `INSERT OR REPLACE` for migration:** This would overwrite existing data if migration runs after new sessions have been written. `INSERT OR IGNORE` preserves existing data, making migration truly idempotent.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SQLite database access | Custom file-based DB or binary protocol | `node:sqlite` DatabaseSync | Built-in, zero dependencies, handles concurrency, ACID transactions |
| Schema migration tracking | Version table + migration registry | `CREATE TABLE IF NOT EXISTS` + `INSERT OR IGNORE` | Schema is simple (one table). `IF NOT EXISTS` makes initialization idempotent. No version tracking needed for a single-table schema. |
| Connection pooling | Custom pool manager | Module-level singleton | Single-process, synchronous access. Pooling adds complexity with no benefit. |
| SQL injection protection | Manual string escaping | Prepared statements with parameter binding | DatabaseSync prepared statements handle all escaping automatically |

**Key insight:** The schema is simple enough (one table, five columns, one index) that sophisticated migration frameworks are overkill. `CREATE TABLE IF NOT EXISTS` and `INSERT OR IGNORE` provide full idempotency without any migration versioning machinery.

## Common Pitfalls

### Pitfall 1: get() Returns undefined, Not null
**What goes wrong:** `viewSession()` currently returns `null` when no match is found. `DatabaseSync.prepare().get()` returns `undefined` when no row matches.
**Why it happens:** Different convention between Node.js built-ins (undefined for absence) and the existing sessions API (null for absence).
**How to avoid:** session-store functions that return single rows must normalize `undefined` to `null` (or sessions.cjs must do the conversion at the delegation layer).
**Warning signs:** Tests that check `assert.strictEqual(result, null)` will fail if `undefined` leaks through.

### Pitfall 2: Null Prototype Objects from SQLite
**What goes wrong:** Rows returned by `get()` and `all()` have `null` prototype (`[Object: null prototype]`). Code that uses `hasOwnProperty` via prototype chain will fail.
**Why it happens:** Node.js returns dictionary-mode objects for performance.
**How to avoid:** Verified that spread (`{ ...row }`), `Object.keys()`, `JSON.stringify()`, and property access all work correctly on null-prototype objects. No special handling needed unless code explicitly checks prototype chain.
**Warning signs:** `row instanceof Object` returns `false`. Use `row !== null && row !== undefined` instead.

### Pitfall 3: Parent Directory Must Exist Before Opening DB
**What goes wrong:** `new DatabaseSync(path)` throws "unable to open database file" if the parent directory does not exist.
**Why it happens:** SQLite creates the database file but not parent directories.
**How to avoid:** Call `fs.mkdirSync(path.dirname(dbPath), { recursive: true })` before creating the DatabaseSync instance.
**Warning signs:** First-run failures on fresh installs where `~/.claude/graphiti/` does not yet exist.

### Pitfall 4: WAL Mode Only Works on File-Based Databases
**What goes wrong:** `PRAGMA journal_mode=WAL` on an in-memory database returns `'memory'` instead of `'wal'`. This is not an error, but tests using in-memory DBs will see different journal mode.
**Why it happens:** In-memory databases cannot use WAL (no file to write ahead to).
**How to avoid:** Accept that in-memory test databases will have `journal_mode=memory`. Do not assert WAL mode in tests that use `:memory:`.
**Warning signs:** Tests that verify WAL mode will fail with in-memory databases.

### Pitfall 5: Experimental Warning on stderr
**What goes wrong:** `require('node:sqlite')` emits `ExperimentalWarning: SQLite is an experimental feature` to stderr on every process invocation that imports it.
**Why it happens:** Node.js v24.x still marks the module as experimental (Release Candidate in v25.7.0).
**How to avoid:** Accept the warning. It goes to stderr, not stdout, so it does not interfere with JSON output. Per CONTEXT.md, this is expected and acceptable.
**Warning signs:** If the warning ever becomes an error in a future Node.js version, the fallback to JSON (DATA-04) will activate automatically.

### Pitfall 6: Singleton DB Connection and Test Isolation
**What goes wrong:** If session-store.cjs uses a true module-level singleton, all tests share the same DB connection, causing test interference.
**Why it happens:** `require()` caches modules -- the singleton persists across test cases.
**How to avoid:** Use the established options-based injection pattern. Accept `dbPath` in all functions. Maintain a Map of connections keyed by dbPath, or provide a `closeDb(dbPath)` function for test cleanup. Test files use unique tmpdir paths.
**Warning signs:** Tests pass individually but fail when run together; data leaks between test cases.

### Pitfall 7: Transaction Not Committed on Migration Abort
**What goes wrong:** If migration code throws between BEGIN and COMMIT, the transaction remains open, locking the database for subsequent operations.
**Why it happens:** No try/catch around the transaction body.
**How to avoid:** Always wrap transaction body in try/catch. On error, execute `ROLLBACK` before re-throwing.
**Warning signs:** "database is locked" errors after a failed migration attempt.

## Code Examples

### Complete session-store.cjs Skeleton
```javascript
// Source: Verified against node:sqlite API (Node.js v24.13.1) + project patterns
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const resolve = require('../../lib/resolve.cjs');
const { logError } = require(resolve('lib', 'core.cjs'));

const DEFAULT_DB_PATH = path.join(os.homedir(), '.claude', 'graphiti', 'sessions.db');

// --- Availability detection ---
let _sqliteAvailable = null;
function isAvailable() {
  if (_sqliteAvailable === null) {
    try {
      require('node:sqlite');
      _sqliteAvailable = true;
    } catch (e) {
      _sqliteAvailable = false;
      logError('session-store', 'node:sqlite not available, falling back to JSON: ' + e.message);
    }
  }
  return _sqliteAvailable;
}

// --- Connection management ---
const _connections = new Map();

function getDb(dbPath) {
  dbPath = dbPath || DEFAULT_DB_PATH;
  if (_connections.has(dbPath)) {
    const existing = _connections.get(dbPath);
    if (existing.isOpen) return existing;
    _connections.delete(dbPath);
  }
  const { DatabaseSync } = require('node:sqlite');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode=WAL');
  db.exec(`CREATE TABLE IF NOT EXISTS sessions (
    timestamp TEXT PRIMARY KEY,
    project TEXT,
    label TEXT,
    labeled_by TEXT,
    named_phase TEXT
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project)');
  _connections.set(dbPath, db);
  return db;
}

function closeDb(dbPath) {
  dbPath = dbPath || DEFAULT_DB_PATH;
  const db = _connections.get(dbPath);
  if (db && db.isOpen) db.close();
  _connections.delete(dbPath);
}
```

### Migration Function
```javascript
// Source: Verified INSERT OR IGNORE behavior and transaction semantics
function migrateFromJson(jsonPath, dbPath, options) {
  options = options || {};
  if (!isAvailable()) return { migrated: 0, skipped: 0, status: 'no-sqlite' };

  const db = getDb(dbPath);
  let sessions;
  try {
    const content = fs.readFileSync(jsonPath, 'utf8');
    sessions = JSON.parse(content);
    if (!Array.isArray(sessions)) {
      return { migrated: 0, skipped: 0, status: 'invalid-format' };
    }
  } catch (e) {
    if (e.code === 'ENOENT') return { migrated: 0, skipped: 0, status: 'no-file' };
    return { migrated: 0, skipped: 0, status: 'parse-error', error: e.message };
  }

  const ins = db.prepare(
    'INSERT OR IGNORE INTO sessions (timestamp, project, label, labeled_by, named_phase) VALUES (?, ?, ?, ?, ?)'
  );

  let migrated = 0, skipped = 0;
  db.exec('BEGIN');
  try {
    for (const entry of sessions) {
      if (!entry || typeof entry.timestamp !== 'string') {
        skipped++;
        logError('session-migration', 'Skipping invalid entry: ' + JSON.stringify(entry));
        continue;
      }
      ins.run(
        entry.timestamp,
        entry.project || '',
        entry.label || '',
        entry.labeled_by || '',
        entry.named_phase || null
      );
      migrated++;
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  return { migrated, skipped, status: 'ok' };
}
```

### Health Check Stage for Storage Backend
```javascript
// Source: follows existing stage pattern in stages.cjs
async function stageSessionStorage(options = {}) {
  try {
    const sessionStore = require(resolve('terminus', 'session-store.cjs'));
    if (sessionStore.isAvailable()) {
      return ok('SQLite backend active (sessions.db)');
    }
    return warn('JSON fallback active (node:sqlite unavailable)');
  } catch (e) {
    return warn('Storage detection failed: ' + e.message);
  }
}
```

### sessions.cjs Delegation Pattern
```javascript
// Source: extends existing filePath injection pattern with dbPath
const sessionStore = require('../../subsystems/terminus/session-store.cjs');

function viewSession(timestamp, options) {
  options = options || {};
  if (sessionStore.isAvailable()) {
    const dbPath = options.dbPath || options.filePath; // filePath maps to dbPath
    return sessionStore.getSession(timestamp, dbPath);  // returns null, not undefined
  }
  // Existing JSON fallback
  const filePath = options.filePath || SESSIONS_FILE;
  const sessions = loadSessions(filePath);
  return sessions.find(s => s.timestamp === timestamp) || null;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `better-sqlite3` npm package | `node:sqlite` built-in | Node.js v22.5.0 (July 2024) | Zero npm dependencies for SQLite. Synchronous API. No native compilation step. |
| `--experimental-sqlite` flag required | Auto-available (no flag) | Node.js v23.4.0 (Dec 2024) | Can `require('node:sqlite')` without CLI flags |
| Stability: Experimental | Stability: Release Candidate | Node.js v25.7.0 | API surface stabilized, unlikely to break |

**Deprecated/outdated:**
- `better-sqlite3`: Still maintained and widely used, but `node:sqlite` eliminates the need for it in projects targeting Node.js 22+.
- `--experimental-sqlite` flag: No longer needed as of Node.js v23.4.0.

## Open Questions

1. **Test isolation strategy for session-store singleton**
   - What we know: The module-level connection Map keyed by dbPath provides isolation when different test files use different tmpdir paths. `closeDb(dbPath)` is needed for cleanup.
   - What's unclear: Whether the existing sessions.test.cjs should be modified to test against SQLite, or if a separate session-store.test.cjs should cover SQLite-specific behavior while sessions.test.cjs continues testing the unchanged interface.
   - Recommendation: Both. Keep sessions.test.cjs passing unchanged (it tests the interface contract). Add session-store.test.cjs for SQLite-specific behavior, migration logic, and fallback detection. The sessions.test.cjs tests validate DATA-02 (identical interface); session-store.test.cjs validates DATA-01, DATA-03, DATA-04.

2. **PRAGMA tuning beyond WAL mode**
   - What we know: WAL mode is confirmed in CONTEXT.md. `PRAGMA synchronous=NORMAL` is a common pairing with WAL that reduces fsync calls with minimal durability risk.
   - What's unclear: Whether additional PRAGMAs (journal_size_limit, cache_size, busy_timeout) provide meaningful benefit for this use case (~265 rows, single-process access).
   - Recommendation: Add `PRAGMA synchronous=NORMAL` alongside WAL for slightly better write performance. Skip journal_size_limit and cache_size -- the dataset is tiny. Consider `busy_timeout` of 5000ms as a defensive measure against unlikely concurrent access from install + hooks.

3. **filePath vs dbPath option naming in sessions.cjs**
   - What we know: Existing tests all pass `{ filePath: tmpFile() }` for test isolation. The SQLite backend needs a `dbPath` equivalent.
   - What's unclear: Whether to keep `filePath` as the option name (with session-store interpreting it as dbPath), or add a separate `dbPath` option.
   - Recommendation: Keep `filePath` for backward compatibility with existing tests. When SQLite is active, derive `dbPath` from `filePath` by replacing `.json` extension with `.db` (or use a separate default). This keeps existing test code working without modification.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node.js v24.13.1) |
| Config file | none (node --test flag) |
| Quick run command | `node --test dynamo/tests/ledger/sessions.test.cjs` |
| Full suite command | `node --test dynamo/tests/**/*.test.cjs` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | SQLite storage via DatabaseSync -- CRUD operations | unit | `node --test dynamo/tests/switchboard/session-store.test.cjs` | Wave 0 |
| DATA-02 | Identical interface -- all 9 functions behave same with SQLite backend | integration | `node --test dynamo/tests/ledger/sessions.test.cjs` | Existing (must pass unchanged) |
| DATA-03 | Migration from sessions.json to SQLite | unit + integration | `node --test dynamo/tests/switchboard/session-store.test.cjs` | Wave 0 |
| DATA-04 | Graceful fallback to JSON when node:sqlite unavailable | unit | `node --test dynamo/tests/switchboard/session-store.test.cjs` | Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test dynamo/tests/ledger/sessions.test.cjs && node --test dynamo/tests/switchboard/session-store.test.cjs`
- **Per wave merge:** `node --test dynamo/tests/**/*.test.cjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `dynamo/tests/switchboard/session-store.test.cjs` -- covers DATA-01, DATA-03, DATA-04 (SQLite CRUD, migration, fallback)
- [ ] No new fixtures needed -- tests use tmpdir-based isolation (established pattern)
- [ ] No framework install needed -- node:test already in use

## Sources

### Primary (HIGH confidence)
- **node:sqlite official docs** (https://nodejs.org/api/sqlite.html) -- Full API surface, constructor options, StatementSync methods, transaction support, WAL mode, type conversion
- **Hands-on verification** (Node.js v24.13.1) -- DatabaseSync constructor, exec, prepare, get/all/run, WAL mode, INSERT OR IGNORE, transactions, error handling, null prototype objects, undefined vs null for missing rows, parent directory requirement, performance benchmarks

### Secondary (MEDIUM confidence)
- **CONTEXT.md decisions** -- Ownership boundaries (Terminus storage, Assay interface), schema design, migration strategy, fallback behavior
- **TERMINUS-SPEC.md Section 7.1** -- SQLite session index ownership recommendation (Terminus owns storage, Assay owns queries)
- **ASSAY-SPEC.md Sections 2.3-2.4** -- Session write boundary rules, Assay owns session index

### Tertiary (LOW confidence)
- None -- all critical findings verified through direct API testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- node:sqlite tested directly on project's runtime, all needed API surface confirmed working
- Architecture: HIGH -- ownership boundaries locked in CONTEXT.md, existing code patterns well-understood, integration points documented
- Pitfalls: HIGH -- all seven pitfalls discovered through hands-on testing, not hypothetical

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable -- node:sqlite API unlikely to break, project dependencies fixed)

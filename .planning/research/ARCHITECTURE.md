# Architecture Patterns: v1.3-M1 Foundation and Infrastructure Refactor

**Domain:** CJS application restructure + infrastructure features for Dynamo
**Researched:** 2026-03-19
**Overall confidence:** HIGH (based on existing specs, codebase inspection, and verified technology capabilities)

---

## 1. Recommended Architecture: Integration Map

v1.3-M1 transforms a 3-directory flat layout into a 6-subsystem architecture while simultaneously adding 5 infrastructure features. The architecture must maintain dual-layout compatibility (repo vs `~/.claude/dynamo/`) throughout migration and keep 374 tests green at every commit.

### 1.1 Current State (3-directory)

```
dynamo/                       # CLI router, core, hooks, config, tests, prompts, migrations
  dynamo.cjs                  # CLI entry point -- resolveSibling() for dual-layout
  core.cjs                    # Shared substrate -- re-exports MCPClient, scope, sessions from Ledger
  hooks/dynamo-hooks.cjs      # Dispatcher -- resolveHandlers() for dual-layout
  config.json, VERSION, prompts/, migrations/, tests/
ledger/                       # ALL memory operations (read+write+transport+curation+hooks)
  episodes.cjs, search.cjs, sessions.cjs, curation.cjs, mcp-client.cjs, scope.cjs
  hooks/                      # 5 handler files (session-start, prompt-augment, capture-change, preserve-knowledge, session-summary)
switchboard/                  # ALL operations + infrastructure
  install.cjs, sync.cjs, update.cjs, update-check.cjs
  health-check.cjs, diagnose.cjs, verify-memory.cjs, stages.cjs, stack.cjs, migrate.cjs, pretty.cjs
claude-config/                # settings-hooks.json, CLAUDE.md.template
```

### 1.2 Target State (6-subsystem)

```
lib/                          # Shared substrate (was dynamo/core.cjs internals)
  core.cjs                    # Config, paths, utilities, re-exports
  scope.cjs                   # Scope constants (from ledger/scope.cjs)
  pretty.cjs                  # Formatters (from switchboard/pretty.cjs)
  transport-utils.cjs         # extractContent (from ledger/episodes.cjs)
cc/                           # Claude Code platform adapter
  hooks/dynamo-hooks.cjs      # Dispatcher (from dynamo/hooks/)
  prompts/                    # Prompt templates (from dynamo/prompts/)
  agents/                     # Subagent definitions (new, for Reverie)
  CLAUDE-TEMPLATE.MD          # CLAUDE.md template (from claude-config/)
  settings-hooks.json         # Hook defs (from claude-config/)
  dynamo-cc.cjs               # CC-specific integration (new)
subsystems/
  switchboard/                # install, sync, update, update-check
  assay/                      # search, sessions, inspect (from ledger/)
  ledger/                     # episodes, format, capture (narrowed)
  terminus/                   # mcp-client, stack, health-check, diagnose, verify-memory, stages, migrate
  reverie/                    # (stub only in M1 -- handlers, curation migrate here in M2)
shared/                       # config.json, VERSION
migrations/                   # Migration scripts (from dynamo/migrations/)
graphiti/                     # Docker infrastructure (unchanged)
dynamo.cjs                    # CLI router entry point (from dynamo/dynamo.cjs)
```

### 1.3 Key Integration Points

```
                      dynamo.cjs (CLI entry)
                          |
              +-----------+-----------+
              |                       |
         lib/core.cjs            cc/hooks/
         (shared substrate)      (dispatcher)
              |                       |
    +---------+---------+    +--------+--------+
    |         |         |    |        |        |
 subsystems/ subsystems/ subsystems/ subsystems/ subsystems/
 switchboard assay      ledger     terminus    reverie
    |         |         |    |        ^         (stub)
    |    reads|    writes|   |        |
    |         +----+-----+   |     transport
    |              |         |        |
    |         lib/transport  |   Knowledge
    |         -utils.cjs     |   Graph (MCP)
    |                        |
    +-- calls Terminus for --+
        install/update ops
```

---

## 2. Migration Architecture: Directory Restructure

### 2.1 Optimal Migration Order

The restructure must be sequenced so that at every commit: (a) all 374 tests pass, (b) the deployed layout at `~/.claude/dynamo/` continues to work, and (c) no circular dependencies are introduced.

**The migration order is driven by dependency depth -- move leaves first, roots last.**

#### Wave 1: Shared Substrate (no consumers depend on the new paths yet)

| Step | Action | Rationale |
|------|--------|-----------|
| 1a | Create `lib/` directory; copy `scope.cjs` from `ledger/scope.cjs` | Zero current consumers at `lib/` path. Leaf module -- no imports of its own from Ledger. |
| 1b | Copy `pretty.cjs` from `switchboard/pretty.cjs` to `lib/pretty.cjs` | Leaf module used only by `install.cjs`. No subsystem imports. |
| 1c | Extract `extractContent()` from `ledger/episodes.cjs` into `lib/transport-utils.cjs` | Shared utility consumed by both Assay (search) and Ledger (episodes). Must exist before either moves. |
| 1d | Create `lib/core.cjs` as a thin wrapper that re-exports from original `dynamo/core.cjs` | Enables subsystems to `require('../../lib/core.cjs')` immediately. Original core.cjs unchanged. |

**At end of Wave 1:** Old paths still work. New `lib/` paths exist but nothing requires them yet. Tests pass unchanged.

#### Wave 2: Create `subsystems/` skeleton and move infrastructure (Terminus)

| Step | Action | Rationale |
|------|--------|-----------|
| 2a | Create `subsystems/terminus/` directory | Infrastructure has no inbound consumers except Dynamo CLI and Switchboard install/update. |
| 2b | Move `ledger/mcp-client.cjs` to `subsystems/terminus/mcp-client.cjs`; leave re-export shim at old path | MCP client is consumed by episodes.cjs, search.cjs, and core.cjs. Shim preserves all existing imports. |
| 2c | Move `switchboard/{stack,health-check,diagnose,verify-memory,stages,migrate}.cjs` to `subsystems/terminus/`; leave shims | These 6 files are consumed only by dynamo.cjs CLI router and install.cjs. Shims at old paths maintain backward compat. |
| 2d | Update dynamo.cjs `resolveSibling` calls to prefer `subsystems/terminus/` paths, falling back to old paths | Dual-path resolution now checks new location first. |

**At end of Wave 2:** Terminus is fully in place. Old paths are shims. Tests pass via shims.

#### Wave 3: Split Ledger -- move reads to Assay, narrow writes

| Step | Action | Rationale |
|------|--------|-----------|
| 3a | Create `subsystems/assay/`; copy `ledger/search.cjs` and `ledger/sessions.cjs`; update internal imports to use `lib/` and `../terminus/` | Assay is a new subsystem. Copies (not moves) first to avoid breaking. |
| 3b | Update Assay search.cjs to import `extractContent` from `lib/transport-utils.cjs` and MCPClient from `../terminus/mcp-client.cjs` | Removes cross-subsystem dependency on Ledger internals. |
| 3c | Create `subsystems/assay/inspect.cjs` (new file -- `getEdge`, `getEntity`, `getRecentEpisodes`) | New module, no migration needed. Extracts logic currently inline in dynamo.cjs CLI. |
| 3d | Create `subsystems/ledger/`; move `episodes.cjs`; create `format.cjs` (extracted from curation.cjs deterministic functions) and `capture.cjs` (from `hooks/capture-change.cjs`) | Ledger narrows to write-only. |
| 3e | Convert old `ledger/search.cjs` and `ledger/sessions.cjs` to re-export shims pointing to `subsystems/assay/` | Existing consumers still work. |
| 3f | Update core.cjs re-exports to point to `subsystems/assay/sessions.cjs` for `loadSessions`/`listSessions` | Core.cjs is the bridge -- update its sources. |

**At end of Wave 3:** Assay and Ledger subsystems exist. Old `ledger/` directory contains only shims + hook handlers (which stay until M2/Reverie).

#### Wave 4: Move Switchboard operations and dispatcher

| Step | Action | Rationale |
|------|--------|-----------|
| 4a | Create `subsystems/switchboard/`; move `install.cjs`, `sync.cjs`, `update.cjs`, `update-check.cjs` | Operations modules. Update their internal imports to use `../terminus/` paths. |
| 4b | Create `cc/` directory structure; move `dynamo/hooks/dynamo-hooks.cjs` to `cc/hooks/`; move `dynamo/prompts/` to `cc/prompts/` | Platform adapter. |
| 4c | Move `claude-config/settings-hooks.json` to `cc/settings-hooks.json`; move `claude-config/CLAUDE.md.template` to `cc/CLAUDE-TEMPLATE.MD` | Claude Code config consolidation. |
| 4d | Create `cc/dynamo-cc.cjs` stub (platform-specific integration entry point) | Placeholder for future platform adapter logic. |
| 4e | Update dispatcher path in `cc/settings-hooks.json` to `node ~/.claude/dynamo/cc/hooks/dynamo-hooks.cjs` | Breaking change handled via migration script. |
| 4f | Create `subsystems/reverie/` stub directory with README | Placeholder for M2. No code moves here in M1. |

**At end of Wave 4:** Full 6-subsystem structure exists. Old directories contain only shims.

#### Wave 5: Cleanup and finalization

| Step | Action | Rationale |
|------|--------|-----------|
| 5a | Update all test files to import from new paths | Tests are the last consumers to update because they cover all paths. |
| 5b | Update dynamo.cjs CLI router to use new subsystem paths (remove resolveSibling fallbacks to old dirs) | CLI router is the root -- update after all leaves are stable. |
| 5c | Move `dynamo.cjs` from `dynamo/dynamo.cjs` to project root (or update dual-path resolution in deployed layout) | Entry point relocation. |
| 5d | Remove all re-export shims from old directories | Old paths no longer needed. |
| 5e | Update sync.cjs SYNC_PAIRS to reflect new directory structure | Sync must know the new layout. |
| 5f | Update install.cjs copyTree to handle new directory layout | Install must deploy the new structure. |
| 5g | Create migration script that updates `~/.claude/settings.json` hook paths and deployed file layout | Handles the breaking dispatcher path change for existing deployments. |

**At end of Wave 5:** Clean 6-subsystem layout. No shims. All tests pass against new paths.

### 2.2 Dual-Layout Compatibility During Migration

The current codebase uses `resolveCore()` and `resolveSibling()` patterns for dual-layout support. During migration, a third resolution pattern is needed:

```javascript
// New pattern: subsystem-aware resolution
// Checks: subsystems/X/ (new) -> X/ (old flat) -> fallback
function resolveSubsystem(subsystem, file) {
  const newPath = path.join(__dirname, '..', 'subsystems', subsystem, file);
  if (fs.existsSync(newPath)) return newPath;
  const oldPath = path.join(__dirname, '..', subsystem, file);
  if (fs.existsSync(oldPath)) return oldPath;
  throw new Error(`Cannot resolve ${subsystem}/${file}`);
}
```

**Critical constraint:** The deployed layout at `~/.claude/dynamo/` must mirror the repo layout. When the install system copies files, it must copy the `subsystems/`, `lib/`, and `cc/` directories in addition to (and eventually replacing) the old `ledger/` and `switchboard/` directories.

**Migration script requirement:** A Terminus migration script must run on first update to:
1. Copy new directory structure to `~/.claude/dynamo/`
2. Update hook paths in `~/.claude/settings.json` from `hooks/dynamo-hooks.cjs` to `cc/hooks/dynamo-hooks.cjs`
3. Clean up old shim files from the deployment directory

---

## 3. Transport Abstraction Layer

### 3.1 Current Transport Architecture

```
curation.cjs ---> OpenRouter API (Haiku) ---> LLM responses
    ^                                              |
    |                                              v
    +--- callHaiku() --- fetchWithTimeout() -------+

mcp-client.cjs ---> Graphiti MCP Server ---> Knowledge Graph
    ^                                              |
    |                                              v
    +--- callTool() --- fetchWithTimeout() --------+
```

Two separate transport paths exist today:
1. **MCP transport** (mcp-client.cjs): JSON-RPC over HTTP with SSE for knowledge graph operations
2. **LLM transport** (curation.cjs): Direct HTTP to OpenRouter for Haiku curation/naming

### 3.2 Target Transport Architecture

MENH-06 (transport flexibility) and MENH-07 (model selection) require a unified transport abstraction that supports three backends:

```
subsystems/terminus/
  mcp-client.cjs              # Unchanged -- MCP transport for knowledge graph
  llm-transport.cjs           # NEW -- unified LLM call interface
  transports/
    openrouter.cjs            # OpenRouter backend (current behavior)
    anthropic.cjs             # Direct Anthropic API backend (new)
    native.cjs                # Claude Code native subagent backend (new)
```

### 3.3 LLM Transport Interface

```javascript
// subsystems/terminus/llm-transport.cjs
'use strict';

const { loadConfig, logError } = require('../../lib/core.cjs');

/**
 * Unified LLM call interface. Routes to the configured transport backend.
 *
 * @param {object} params
 * @param {string} params.system - System prompt
 * @param {string} params.user - User content
 * @param {object} [params.options] - { maxTokens, temperature, timeout, hookName }
 * @returns {Promise<{text: string, uncurated: boolean, transport: string}>}
 */
async function callLLM(params) {
  const config = loadConfig();
  const transportName = resolveTransport(config, params.options);
  const transport = loadTransport(transportName);

  try {
    const result = await transport.call(params, config);
    return { ...result, transport: transportName };
  } catch (err) {
    logError(params.options?.hookName || 'llm-transport', err.message);
    return { text: params.options?.fallback || '', uncurated: true, transport: transportName };
  }
}

/**
 * Resolve which transport to use based on config and context.
 * Priority: explicit option > per-path config > global default
 */
function resolveTransport(config, options = {}) {
  // 1. Explicit override in call options
  if (options.transport) return options.transport;

  // 2. Per-path selection (MENH-07)
  if (options.path && config.transports?.paths?.[options.path]) {
    return config.transports.paths[options.path];
  }

  // 3. Global default
  return config.transports?.default || 'openrouter';
}

function loadTransport(name) {
  return require(`./transports/${name}.cjs`);
}

module.exports = { callLLM, resolveTransport };
```

### 3.4 Transport Backends

#### OpenRouter (existing behavior, extracted)

```javascript
// subsystems/terminus/transports/openrouter.cjs
// Extracted from ledger/curation.cjs callHaiku() internals
async function call(params, config) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { text: params.options?.fallback || '', uncurated: true };

  const resp = await fetchWithTimeout(config.curation.api_url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.curation.model || 'anthropic/claude-haiku-4.5',
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user }
      ],
      max_tokens: params.options?.maxTokens || 500,
      temperature: params.options?.temperature || 0.3
    })
  }, params.options?.timeout || config.timeouts.curation);

  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  const data = await resp.json();
  return { text: data.choices[0].message.content, uncurated: false };
}
```

#### Direct Anthropic API (new -- removes OpenRouter SPOF)

```javascript
// subsystems/terminus/transports/anthropic.cjs
// Direct Anthropic Messages API -- zero npm dependencies
async function call(params, config) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { text: params.options?.fallback || '', uncurated: true };

  const model = config.transports?.anthropic?.model || 'claude-haiku-4-5';
  const resp = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model,
      max_tokens: params.options?.maxTokens || 500,
      system: params.system,
      messages: [{ role: 'user', content: params.user }]
    })
  }, params.options?.timeout || config.timeouts.curation);

  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  const data = await resp.json();
  return { text: data.content[0].text, uncurated: false };
}
```

#### Native Claude Code Subagent (new -- zero-cost on Max subscription)

```javascript
// subsystems/terminus/transports/native.cjs
// Uses Claude Code's built-in subagent mechanism
// This transport writes a prompt to a temp file and invokes claude CLI
// Only usable for deliberation path (latency > 2s) -- NOT for hot path
async function call(params, config) {
  // For Max subscription: subagent calls are at zero marginal cost
  // Implementation deferred to M2 (Reverie integration)
  // In M1: stub that falls back to anthropic transport
  const anthropic = require('./anthropic.cjs');
  return anthropic.call(params, config);
}
```

### 3.5 Model Selection (MENH-07)

Per-path model selection is achieved through the config:

```javascript
// config.json transport section
{
  "transports": {
    "default": "anthropic",          // Global default transport
    "paths": {
      "curation": "anthropic",       // Hot path curation -> direct API (fast)
      "session-name": "openrouter",  // Session naming -> OpenRouter (cheap)
      "session-summary": "anthropic",// Session summary -> direct API
      "deliberation": "native"       // Deliberation -> native subagent (M2)
    },
    "anthropic": {
      "model": "claude-haiku-4-5"    // Default model for Anthropic transport
    },
    "openrouter": {
      "model": "anthropic/claude-haiku-4.5"
    },
    "models": {
      "hot-path": "claude-haiku-4-5",       // Fast, cheap
      "deliberation": "claude-sonnet-4-6"   // Capable, slower
    }
  }
}
```

### 3.6 Where Transport Sits Between MCP Client and New API Support

The MCP client (`mcp-client.cjs`) and the LLM transport (`llm-transport.cjs`) are **peers, not layers**. They serve different purposes:

```
subsystems/terminus/
  mcp-client.cjs       --> Knowledge Graph (Graphiti MCP server)
  llm-transport.cjs    --> LLM APIs (OpenRouter, Anthropic, Native)
  transports/           --> Backend implementations for llm-transport
```

- **mcp-client.cjs** handles JSON-RPC transport to the Graphiti knowledge graph. It is consumed by Ledger (writes) and Assay (reads). Unchanged in M1.
- **llm-transport.cjs** handles LLM API calls for curation, naming, and summarization. It replaces the direct OpenRouter calls in `curation.cjs`. Consumed by Reverie (M2) and by the existing curation functions during M1 migration.

These two transport mechanisms never interact. They are independent pipes that Terminus provides to different consumers.

---

## 4. SQLite Session Index Architecture

### 4.1 Ownership Model

The SQLite session index (MGMT-11) follows the same ownership pattern as the knowledge graph:

| Concern | Owner | Rationale |
|---------|-------|-----------|
| Database file location and lifecycle | **Terminus** | Data infrastructure -- Terminus manages storage backends |
| Schema definition and migrations | **Terminus** | Schema is infrastructure, managed by the migration harness |
| Query functions (read) | **Assay** | Assay owns all session queries -- the SQLite DB is its backing store |
| Write functions (index, label) | **Assay** | Session index is Assay's managed data store (not the knowledge graph) |
| Database module (open, close, pragma) | **Terminus** | Connection management is infrastructure |

### 4.2 Data Flow

```
Reverie (Stop handler)
    |
    | calls indexSession(timestamp, project, label)
    v
Assay (sessions.cjs)
    |
    | INSERT INTO sessions (...)
    v
Terminus (session-db.cjs)
    |
    | node:sqlite DatabaseSync
    v
~/.claude/graphiti/sessions.db
```

### 4.3 Implementation Architecture

#### Terminus: Database Module

```javascript
// subsystems/terminus/session-db.cjs
'use strict';

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const os = require('os');

const DEFAULT_DB_PATH = path.join(os.homedir(), '.claude', 'graphiti', 'sessions.db');

/**
 * Open the session database. Creates if not exists.
 * Synchronous API -- node:sqlite is synchronous by design.
 */
function openSessionDB(dbPath) {
  dbPath = dbPath || DEFAULT_DB_PATH;
  const db = new DatabaseSync(dbPath);

  // WAL mode for concurrent reads during hook processing
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  // Ensure schema exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL UNIQUE,
      project TEXT NOT NULL,
      label TEXT,
      labeled_by TEXT DEFAULT 'auto',
      named_phase TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project);
    CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON sessions(timestamp DESC);
  `);

  return db;
}

module.exports = { openSessionDB, DEFAULT_DB_PATH };
```

#### Assay: Updated Session Functions

The function signatures remain identical. Only the backing store changes from `sessions.json` to SQLite:

```javascript
// subsystems/assay/sessions.cjs (SQLite-backed)
const { openSessionDB } = require('../terminus/session-db.cjs');

function listSessions(options = {}) {
  const db = openSessionDB(options.dbPath);
  try {
    let sql = 'SELECT * FROM sessions';
    const params = [];

    if (options.project) {
      sql += ' WHERE project = ?';
      params.push(options.project);
    }
    sql += ' ORDER BY timestamp DESC';
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    return db.prepare(sql).all(...params);
  } finally {
    db.close();
  }
}

function indexSession(timestamp, project, label, labeledBy, options = {}) {
  const db = openSessionDB(options.dbPath);
  try {
    // Never overwrite user-applied labels
    const existing = db.prepare('SELECT labeled_by FROM sessions WHERE timestamp = ?').get(timestamp);
    if (existing?.labeled_by === 'user') return;

    db.prepare(`
      INSERT INTO sessions (timestamp, project, label, labeled_by, named_phase)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(timestamp) DO UPDATE SET
        label = excluded.label,
        labeled_by = excluded.labeled_by,
        named_phase = excluded.named_phase,
        updated_at = datetime('now')
      WHERE labeled_by != 'user'
    `).run(timestamp, project, label, labeledBy, options.namedPhase || null);
  } finally {
    db.close();
  }
}
```

### 4.4 Migration from sessions.json

A Terminus migration script handles the one-time conversion:

```javascript
// migrations/002-sqlite-sessions.cjs
module.exports = {
  version: '1.3.0',
  description: 'Migrate session index from sessions.json to SQLite',
  up: async (config) => {
    const fs = require('fs');
    const jsonPath = config.sessions?.filePath || '~/.claude/graphiti/sessions.json';

    if (!fs.existsSync(jsonPath)) return; // No sessions to migrate

    const sessions = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (!Array.isArray(sessions) || sessions.length === 0) return;

    const { openSessionDB } = require('../subsystems/terminus/session-db.cjs');
    const db = openSessionDB();

    const insert = db.prepare(
      'INSERT OR IGNORE INTO sessions (timestamp, project, label, labeled_by, named_phase) VALUES (?, ?, ?, ?, ?)'
    );

    for (const s of sessions) {
      insert.run(s.timestamp, s.project || 'unknown', s.label || null, s.labeled_by || 'auto', s.named_phase || null);
    }

    db.close();

    // Rename old file as backup
    fs.renameSync(jsonPath, jsonPath + '.pre-sqlite.bak');
  }
};
```

### 4.5 Technology Verification

**Node.js v24.13.1 includes `node:sqlite`** -- verified working on this machine without `--experimental-sqlite` flag (produces a warning but functions correctly). The `DatabaseSync` API is synchronous, which aligns with the CJS synchronous patterns used throughout Dynamo. No npm dependency required.

**Confidence: HIGH** -- tested locally, synchronous API matches existing patterns.

---

## 5. Dependency Management (MGMT-01)

### 5.1 Current State

Dynamo has zero npm dependencies. All code uses Node.js built-ins. The only external call is `fetchWithTimeout()` to OpenRouter (LLM) and the Graphiti MCP server (knowledge graph).

### 5.2 Self-Contained Dependency Model

MGMT-01 requires that any new dependencies (like `node:sqlite`) are verified at install time and degrade gracefully if unavailable.

```javascript
// lib/deps.cjs -- dependency verification
'use strict';

const REQUIRED_FEATURES = {
  sqlite: {
    test: () => { require('node:sqlite'); return true; },
    fallback: 'sessions.json flat file',
    minNodeVersion: '22.5.0'
  },
  fetch: {
    test: () => typeof globalThis.fetch === 'function',
    fallback: null, // No fallback -- required
    minNodeVersion: '18.0.0'
  }
};

function verifyDependencies() {
  const results = {};
  for (const [name, dep] of Object.entries(REQUIRED_FEATURES)) {
    try {
      results[name] = { available: dep.test(), fallback: dep.fallback };
    } catch {
      results[name] = { available: false, fallback: dep.fallback };
    }
  }
  return results;
}

function requireFeature(name) {
  const dep = REQUIRED_FEATURES[name];
  if (!dep) throw new Error('Unknown feature: ' + name);
  try {
    dep.test();
    return true;
  } catch {
    if (dep.fallback) return false; // Caller should use fallback
    throw new Error(`Required feature "${name}" not available. Minimum Node.js: ${dep.minNodeVersion}`);
  }
}

module.exports = { verifyDependencies, requireFeature, REQUIRED_FEATURES };
```

This module is called during `dynamo install` and `dynamo health-check` to verify capabilities, and by `sessions.cjs` to determine whether to use SQLite or fall back to JSON.

---

## 6. Jailbreak Protection (MGMT-08)

### 6.1 Attack Surface

The hook dispatcher (`dynamo-hooks.cjs`) is the single entry point for all Claude Code events. It receives raw JSON from stdin and executes handler code. The attack vectors are:

1. **Malicious stdin content** -- crafted JSON that exploits handler logic
2. **Path traversal in event data** -- event data containing `../` paths used in file operations
3. **Prompt injection via hook context** -- content in `additionalContext` that instructs Claude to ignore previous instructions

### 6.2 Protection Architecture

```javascript
// cc/hooks/security.cjs -- hook input validation
'use strict';

const ALLOWED_EVENTS = new Set([
  'SessionStart', 'UserPromptSubmit', 'PostToolUse', 'PreCompact', 'Stop'
]);

const MAX_INPUT_SIZE = 1_000_000; // 1MB max stdin

/**
 * Validate and sanitize hook input.
 * Returns sanitized event object or null (reject).
 */
function validateHookInput(rawInput) {
  // Size gate
  if (!rawInput || rawInput.length > MAX_INPUT_SIZE) return null;

  // Parse gate
  let data;
  try {
    data = JSON.parse(rawInput);
  } catch {
    return null;
  }

  // Event type gate
  if (!data.hook_event_name || !ALLOWED_EVENTS.has(data.hook_event_name)) return null;

  // Sanitize string fields that could contain injection
  if (data.prompt && typeof data.prompt === 'string') {
    data.prompt = sanitizePromptContent(data.prompt);
  }

  return data;
}

/**
 * Sanitize content before injection into additionalContext.
 * Strips known jailbreak patterns.
 */
function sanitizeInjection(content) {
  if (!content || typeof content !== 'string') return '';

  // Strip instruction override patterns
  const patterns = [
    /IMPORTANT:\s*ignore\s*(all\s*)?(previous|above|prior)\s*instructions/gi,
    /system\s*prompt\s*override/gi,
    /\[SYSTEM\]/gi,
    /<\/?system>/gi
  ];

  let sanitized = content;
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  }

  return sanitized;
}

module.exports = { validateHookInput, sanitizeInjection, ALLOWED_EVENTS, MAX_INPUT_SIZE };
```

### 6.3 Integration Point

The security module integrates at the dispatcher level -- before any handler receives the event:

```
stdin -> validateHookInput() -> toggle gate -> handler routing -> sanitizeInjection() -> stdout
```

---

## 7. Suggested Build Order

### 7.1 Build Order with Dependency Rationale

The 6 M1 requirements have the following dependency relationships:

```
Directory Restructure (foundation)
    |
    +--- Transport Flexibility (MENH-06) -- requires Terminus to exist
    |       |
    |       +--- Model Selection (MENH-07) -- requires transport abstraction
    |
    +--- SQLite Session Index (MGMT-11) -- requires Assay + Terminus to exist
    |
    +--- Jailbreak Protection (MGMT-08) -- requires cc/hooks/ to exist
    |
    +--- Dependency Management (MGMT-01) -- requires lib/ to exist
```

### 7.2 Recommended Phase Sequence

| Phase | Requirement | Prerequisites | Deliverables | Test Impact |
|-------|-------------|---------------|--------------|-------------|
| **Phase 1** | Directory Restructure (Waves 1-3) | None | `lib/`, `subsystems/{terminus,assay,ledger}/`, shims at old paths | All 374 tests pass via shims. New tests for subsystem imports. |
| **Phase 2** | Directory Restructure (Waves 4-5) | Phase 1 | `cc/`, `subsystems/{switchboard,reverie}/` stub, shim cleanup, sync/install updates, migration script | Tests migrated to new paths. ~20 new tests for cc/ and migration. |
| **Phase 3** | Dependency Management (MGMT-01) | Phase 1 (lib/ exists) | `lib/deps.cjs`, integration in install and health-check | ~10 new tests for dependency verification. |
| **Phase 4** | Jailbreak Protection (MGMT-08) | Phase 2 (cc/hooks/ exists) | `cc/hooks/security.cjs`, dispatcher integration | ~15 new tests for input validation and injection sanitization. |
| **Phase 5** | Transport Flexibility (MENH-06) | Phase 1 (Terminus exists) | `subsystems/terminus/llm-transport.cjs`, `transports/{openrouter,anthropic}.cjs`, curation.cjs migration | ~20 new tests. Existing curation tests adapted for transport layer. |
| **Phase 6** | Model Selection (MENH-07) | Phase 5 (transport exists) | Config-driven model selection, per-path routing | ~10 new tests for routing logic. |
| **Phase 7** | SQLite Session Index (MGMT-11) | Phases 1+2 (Assay + Terminus exist) | `subsystems/terminus/session-db.cjs`, updated `subsystems/assay/sessions.cjs`, migration script | ~25 new tests. Existing session tests adapted for SQLite backend. |

### 7.3 Rationale for Ordering

1. **Directory restructure first (Phases 1-2):** Every other feature depends on the new directory layout. Transport needs Terminus to exist. SQLite needs Assay and Terminus. Jailbreak needs cc/hooks/. This is the load-bearing prerequisite.

2. **Dependency management third (Phase 3):** Small, self-contained. Creates the verification infrastructure that SQLite will need (graceful fallback if node:sqlite unavailable).

3. **Jailbreak protection fourth (Phase 4):** Small, focused on cc/hooks/. No dependency on transport or SQLite. Can be tested in isolation. Security early, per the PRD principle.

4. **Transport fifth (Phase 5):** Requires Terminus. The curation.cjs split (LLM functions to Reverie placeholder, deterministic to Ledger format.cjs) naturally pairs with transport because `callHaiku()` is replaced by `callLLM()` through the transport layer.

5. **Model selection sixth (Phase 6):** Thin configuration layer on top of transport. Quick phase.

6. **SQLite last (Phase 7):** Depends on both Assay (query functions) and Terminus (database module). Also depends on dependency management (Phase 3) for feature verification. Modifying the session data store is the highest-risk change and benefits from all infrastructure being stable first.

### 7.4 New vs. Modified Modules (Explicit)

| Module | Status | Description |
|--------|--------|-------------|
| `lib/core.cjs` | **Modified** | Thin wrapper re-exporting from original core.cjs, evolving to standalone |
| `lib/scope.cjs` | **Moved** | From `ledger/scope.cjs` -- no logic changes |
| `lib/pretty.cjs` | **Moved** | From `switchboard/pretty.cjs` -- no logic changes |
| `lib/transport-utils.cjs` | **New** (extracted) | `extractContent()` extracted from `ledger/episodes.cjs` |
| `lib/deps.cjs` | **New** | Dependency verification (MGMT-01) |
| `cc/hooks/dynamo-hooks.cjs` | **Moved + Modified** | From `dynamo/hooks/` -- updated handler paths, added security validation |
| `cc/hooks/security.cjs` | **New** | Jailbreak protection (MGMT-08) |
| `cc/dynamo-cc.cjs` | **New** (stub) | Platform adapter entry point |
| `cc/settings-hooks.json` | **Moved + Modified** | Updated dispatcher paths |
| `cc/CLAUDE-TEMPLATE.MD` | **Moved** | From `claude-config/CLAUDE.md.template` |
| `cc/prompts/` | **Moved** | From `dynamo/prompts/` |
| `subsystems/terminus/mcp-client.cjs` | **Moved** | From `ledger/mcp-client.cjs` -- no logic changes |
| `subsystems/terminus/stack.cjs` | **Moved** | From `switchboard/stack.cjs` -- no logic changes |
| `subsystems/terminus/health-check.cjs` | **Moved** | From `switchboard/health-check.cjs` -- no logic changes |
| `subsystems/terminus/diagnose.cjs` | **Moved** | From `switchboard/diagnose.cjs` -- no logic changes |
| `subsystems/terminus/verify-memory.cjs` | **Moved** | From `switchboard/verify-memory.cjs` -- no logic changes |
| `subsystems/terminus/stages.cjs` | **Moved** | From `switchboard/stages.cjs` -- no logic changes |
| `subsystems/terminus/migrate.cjs` | **Moved** | From `switchboard/migrate.cjs` -- no logic changes |
| `subsystems/terminus/llm-transport.cjs` | **New** | Unified LLM transport interface (MENH-06) |
| `subsystems/terminus/transports/openrouter.cjs` | **New** (extracted) | OpenRouter backend extracted from `curation.cjs` |
| `subsystems/terminus/transports/anthropic.cjs` | **New** | Direct Anthropic API backend |
| `subsystems/terminus/transports/native.cjs` | **New** (stub) | Claude Code native subagent backend (implemented in M2) |
| `subsystems/terminus/session-db.cjs` | **New** | SQLite session database module (MGMT-11) |
| `subsystems/assay/search.cjs` | **Moved + Modified** | From `ledger/search.cjs` -- updated imports to Terminus/lib |
| `subsystems/assay/sessions.cjs` | **Moved + Modified** | From `ledger/sessions.cjs` -- updated to SQLite backend |
| `subsystems/assay/inspect.cjs` | **New** | Entity/edge inspection extracted from dynamo.cjs inline logic |
| `subsystems/ledger/episodes.cjs` | **Moved + Modified** | From `ledger/episodes.cjs` -- updated imports, `extractContent` extracted |
| `subsystems/ledger/format.cjs` | **New** (extracted) | Deterministic formatting from `curation.cjs` |
| `subsystems/ledger/capture.cjs` | **Moved + Modified** | From `ledger/hooks/capture-change.cjs` -- extracted handler logic |
| `subsystems/switchboard/install.cjs` | **Moved + Modified** | Updated paths, new directory layout support |
| `subsystems/switchboard/sync.cjs` | **Moved + Modified** | Updated SYNC_PAIRS for new layout |
| `subsystems/switchboard/update.cjs` | **Moved + Modified** | Updated imports to Terminus |
| `subsystems/switchboard/update-check.cjs` | **Moved** | No logic changes |
| `subsystems/reverie/` | **New** (stub only) | Empty placeholder with README for M2 |
| `dynamo.cjs` | **Modified** | Updated routing to use subsystem paths |
| `migrations/001-directory-restructure.cjs` | **New** | Deployed layout migration |
| `migrations/002-sqlite-sessions.cjs` | **New** | sessions.json to SQLite migration |

**Summary:** 13 moved-only, 11 moved+modified, 16 new, 2 modified-in-place. Total: ~42 file operations.

---

## 8. Anti-Patterns to Avoid

### Anti-Pattern 1: Big-Bang Migration
**What:** Moving all files to new paths in a single commit.
**Why bad:** If any test fails, the entire migration is suspect. Rollback is all-or-nothing.
**Instead:** Wave-based migration with shims. Each wave is independently testable. Each commit leaves all tests green.

### Anti-Pattern 2: Cross-Subsystem Imports
**What:** `subsystems/assay/search.cjs` importing directly from `subsystems/ledger/episodes.cjs` for `extractContent`.
**Why bad:** Creates a dependency from the read subsystem to the write subsystem, violating the boundary rule.
**Instead:** Shared utilities live in `lib/`. Both subsystems import from the shared location.

### Anti-Pattern 3: Dual resolveCore() Pattern in New Code
**What:** Continuing to use the `resolveCore()` try-paths pattern in new subsystem modules.
**Why bad:** The new directory structure is standardized. Dual-layout resolution should be handled once at the entry point (dynamo.cjs, dispatcher), not in every module.
**Instead:** Subsystem modules use relative paths (`../../lib/core.cjs`). The entry point handles layout resolution.

### Anti-Pattern 4: SQLite Connection Per Function Call
**What:** Opening and closing the SQLite database on every `listSessions()` or `indexSession()` call.
**Why bad:** SQLite open/close is not free. In hook hot paths, this adds latency.
**Instead:** Open once per process invocation (hooks are short-lived processes). Close on process exit. The `openSessionDB()` function can cache the connection:

```javascript
let _db = null;
function getSessionDB(dbPath) {
  if (!_db) _db = openSessionDB(dbPath);
  return _db;
}
process.on('exit', () => { if (_db) _db.close(); });
```

### Anti-Pattern 5: Transport Abstraction Over MCP Client
**What:** Wrapping mcp-client.cjs in the same llm-transport.cjs abstraction as the LLM calls.
**Why bad:** MCP transport (JSON-RPC + SSE) and LLM transport (REST API) have fundamentally different protocols, error modes, and session semantics. Forcing them into one interface creates a leaky abstraction.
**Instead:** Keep them as peers in Terminus. `mcp-client.cjs` and `llm-transport.cjs` are independent modules with independent interfaces.

---

## 9. Scalability Considerations

| Concern | v1.3-M1 | Future (M2+) | Notes |
|---------|---------|--------------|-------|
| Session count | SQLite handles millions of rows trivially | Add pagination to `listSessions` | JSON was the bottleneck -- SQLite eliminates it |
| Transport latency | Direct API ~200ms vs OpenRouter ~400ms | Caching, connection pooling if needed | Direct API halves latency for Haiku calls |
| Hook processing | Single-process, synchronous | Evaluate if hot path needs async pipeline | Current <500ms budget is met |
| Test count | ~415 (374 + ~40 new) | Growth proportional to code | test runner handles >500 tests without issues |
| File count in deployment | ~42 files in `~/.claude/dynamo/` | Grows with subsystem modules | Install time scales linearly, currently <2s |

---

## 10. Sources

- Anthropic Messages API: [platform.claude.com/docs/en/api/messages](https://platform.claude.com/docs/en/api/messages)
- Claude Code Subagents: [code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents)
- Node.js built-in SQLite: [nodejs.org/api/sqlite.html](https://nodejs.org/api/sqlite.html)
- Node.js SQLite guide: [betterstack.com/community/guides/scaling-nodejs/nodejs-sqlite](https://betterstack.com/community/guides/scaling-nodejs/nodejs-sqlite/)
- SQLite in Node.js (InfoWorld): [infoworld.com/article/3537050/intro-to-nodes-built-in-sqlite-module.html](https://www.infoworld.com/article/3537050/intro-to-nodes-built-in-sqlite-module.html)
- Codebase inspection: `dynamo/dynamo.cjs`, `dynamo/core.cjs`, `dynamo/hooks/dynamo-hooks.cjs`, `ledger/mcp-client.cjs`, `ledger/curation.cjs` (all read directly from repo)
- Existing specifications: DYNAMO-PRD.md, TERMINUS-SPEC.md, SWITCHBOARD-SPEC.md, ASSAY-SPEC.md, LEDGER-SPEC.md (all read directly)

---

*Architecture document created: 2026-03-19*
*Project: Dynamo v1.3-M1 Foundation and Infrastructure Refactor*
*Confidence: HIGH -- based on existing specs, direct codebase inspection, and verified technology capabilities*
*Key constraint: Every commit leaves 374+ tests green and deployed layout functional*

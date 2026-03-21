# Testing

**Generated:** 2026-03-20
**Context:** v1.3-M1 shipped -- six-subsystem architecture

## Framework

- **Test runner:** `node:test` (built-in, zero dependencies)
- **Assertions:** `node:assert` (strict mode)
- **Pattern:** `describe()` / `it()` blocks
- **Execution:** `node --test dynamo/tests/**/*.test.cjs dynamo/tests/*.test.cjs`
- **CLI shortcut:** `dynamo test`

## Test Suite Stats

| Metric | Value |
|--------|-------|
| Total tests | 515 |
| Passing | 514 |
| Skipped | 1 (Docker daemon integration -- requires running Docker) |
| Failing | 0 |
| Test files | 28 |
| Duration | ~10-12s |

## Test Organization

```
dynamo/tests/
  boundary.test.cjs          # Subsystem import boundary enforcement
  circular-deps.test.cjs     # Static circular dependency detection
  core.test.cjs              # lib/core.cjs utilities
  dep-graph.test.cjs         # Dependency graph analyzer
  integration.test.cjs       # End-to-end integration tests
  m1-verification.test.cjs   # M1 requirement validation suite (36 tests)
  regression.test.cjs        # v1.1+ regression guards (deployed layout checks)
  resolve.test.cjs           # Path resolver tests
  router.test.cjs            # CLI router command dispatch
  toggle.test.cjs            # Global toggle behavior
  ledger/
    curation.test.cjs        # Haiku curation pipeline
    dispatcher.test.cjs      # Hook dispatcher (input validation, boundary markers)
    episodes.test.cjs        # Episode add/extract
    mcp-client.test.cjs      # MCPClient + SSE parsing
    scope.test.cjs           # Scope validation
    search.test.cjs          # Search operations
    sessions.test.cjs        # Session management + SQLite delegation
  switchboard/
    diagnose.test.cjs        # Diagnostics stages
    health-check.test.cjs    # Health check pipeline
    install.test.cjs         # Installer pipeline
    migrate.test.cjs         # Migration harness
    session-store.test.cjs   # SQLite session storage (30 tests)
    stack.test.cjs           # Docker stack management
    stages.test.cjs          # Stage runner framework
    sync.test.cjs            # Bidirectional sync
    update-check.test.cjs    # Update checker
    update.test.cjs          # Update pipeline
    verify-memory.test.cjs   # Memory pipeline verification
```

## Test Isolation Pattern

**Every test uses tmpdir isolation** -- no shared state, no real filesystem side effects.

```javascript
const { describe, it, before, after } = require('node:test');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('feature', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dynamo-test-'));
    // Set up test fixtures in tmpDir
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('does something', () => {
    // All file operations use tmpDir, never real ~/.claude/
  });
});
```

## Options-Based Injection

Modules accept options overrides for test isolation:

```javascript
// Production module
function runInstall(options = {}) {
  const targetDir = options.targetDir || path.join(os.homedir(), '.claude', 'dynamo');
  const configPath = options.configPath || path.join(targetDir, 'config.json');
  // ...
}

// Test
it('installs to tmpdir', () => {
  runInstall({ targetDir: tmpDir, configPath: path.join(tmpDir, 'config.json') });
  assert.ok(fs.existsSync(path.join(tmpDir, 'config.json')));
});
```

## Key Test Categories

### Boundary Tests (`boundary.test.cjs`)

Verify subsystem import isolation:
- Each subsystem only imports from `lib/` or its own directory
- No cross-subsystem imports
- Documents which symbols are exported from `lib/core.cjs` (only MCPClient)

### Circular Dependency Tests (`circular-deps.test.cjs`)

Static analysis scanning all production `.cjs` files:
- Builds require() graph
- Detects cycles
- Allowlist: `core<->mcp-client`, `install<->update`
- Fails if any non-allowlisted cycle found

### Regression Tests (`regression.test.cjs`)

Guards against known bugs from v1.1:
- No silent `.catch(() => {})` patterns
- No `GRAPHITI_GROUP_ID` override in config
- Colon rejection in scope validation
- Log rotation at 1MB
- ppid-based health guard
- Deployed directory structure verification

### M1 Verification Tests (`m1-verification.test.cjs`)

End-to-end validation of all 14 M1 requirements:
- Tmpdir sandbox install and structure verification
- Sync pair completeness
- Hook dispatcher validation (input validation, boundary markers)
- SQLite session storage smoke test

## Running Tests

```bash
# All tests
node --test dynamo/tests/**/*.test.cjs dynamo/tests/*.test.cjs

# Specific subsystem
node --test dynamo/tests/ledger/*.test.cjs

# Single file
node --test dynamo/tests/switchboard/session-store.test.cjs

# Via CLI
dynamo test
```

## Test Exceptions

- `regression.test.cjs` reads from deployed `~/.claude/dynamo/` (not tmpdir) -- tests the actual deployment
- `integration.test.cjs` makes real MCP calls if Docker is running (skipped otherwise)
- Docker daemon test in `stack.test.cjs` skipped if Docker not running

---
*Testing analysis for: Dynamo v1.3-M1*

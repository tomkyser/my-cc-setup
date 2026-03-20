# Coding Conventions

**Generated:** 2026-03-20
**Context:** v1.3-M1 shipped -- six-subsystem architecture

## Module Structure

Every production module follows the same pattern:

```javascript
// Dynamo > Subsystem > module-name.cjs
'use strict';

const path = require('path');
const fs = require('fs');
// ... other requires

// --- Section Header ---

function publicFunction(args, options = {}) {
  // Implementation
}

// --- Another Section ---

function anotherFunction() {
  // Implementation
}

module.exports = { publicFunction, anotherFunction };
```

### Key Conventions

1. **`'use strict';`** -- required in every file
2. **Branding header** -- `// Dynamo > Subsystem > filename.cjs` on line 1
3. **Section separators** -- `// --- Section Name ---` comments
4. **Options parameter** -- public functions accept `options = {}` for test injection
5. **Explicit exports** -- `module.exports = { ... }` at file end
6. **No default exports** -- always named exports

## Error Handling

### Production Code (Hooks)

```javascript
// Hooks ALWAYS exit 0 -- never block Claude Code
try {
  await doWork();
  process.exit(0);
} catch (err) {
  core.logError(hookName, err.message);
  process.exit(0); // Still exit 0
}
```

### Production Code (CLI)

```javascript
// CLI commands report errors via output, never throw
try {
  const result = await operation();
  if (!result) {
    console.error('[FAIL] Operation failed');
    return;
  }
  console.log(JSON.stringify(result));
} catch (err) {
  console.error('[ERROR] ' + err.message);
}
```

### Error Logging

All errors logged via `core.logError(hookName, message)`:
- Format: `[ISO-8601Z] [hookName] message`
- File: `~/.claude/dynamo/hook-errors.log`
- Auto-rotates at 1MB (old log preserved as `.old`)

## Import Patterns

### Subsystem Imports

```javascript
// Correct: import from lib/ shared substrate
const core = require(path.join(__dirname, '..', '..', 'lib', 'core.cjs'));
const { SCOPE } = require(path.join(__dirname, '..', '..', 'lib', 'scope.cjs'));

// Correct: import within same subsystem
const stages = require(path.join(__dirname, 'stages.cjs'));

// WRONG: cross-subsystem import (violates boundaries)
// const search = require('../assay/search.cjs'); // Never do this
```

### Resolver Usage

For dynamic path resolution (deployment context):
```javascript
const { resolveSubsystem } = require(path.join(__dirname, '..', '..', 'lib', 'resolve.cjs'));
const healthCheck = require(resolveSubsystem('terminus', 'health-check.cjs'));
```

## Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Files | kebab-case | `session-store.cjs`, `health-check.cjs` |
| Functions | camelCase | `getSession()`, `runStages()` |
| Constants | UPPER_SNAKE | `SCOPE`, `SYNC_EXCLUDES`, `BOUNDARY_OPEN` |
| Scope values | dash-separated | `project-myapp`, `session-1710000000` |
| CLI commands | kebab-case | `health-check`, `check-update`, `verify-memory` |
| Test files | module.test.cjs | `sessions.test.cjs`, `install.test.cjs` |

## Configuration Access

```javascript
// Config loaded once via core.loadConfig()
const config = core.loadConfig();
const mcp_url = config.graphiti?.mcp_url || 'http://localhost:8100/mcp';
```

Always use optional chaining and defaults for config values.

## Output Patterns

### CLI Output

- **JSON format:** `--format json` sends to stdout
- **Raw format:** `--format raw` sends to stdout
- **Human-readable:** Default, sends to stderr (so Claude reads it)

### Stage/Pipeline Output

```javascript
// Stage results use consistent shape
{ stage: 'name', status: 'OK'|'FAIL'|'WARN'|'SKIP', details: '...' }
```

## Toggle Gate Pattern

Every entry point (CLI + hooks) checks the toggle:

```javascript
const { enabled, devMode, effective } = core.getToggleState();
if (!effective) {
  console.error('Dynamo is disabled. Run: dynamo toggle on');
  process.exit(0);
}
```

## Atomic File Operations

For critical file writes (settings.json, config.json):

```javascript
// Write to temp, then rename (atomic on most filesystems)
const tmpPath = filePath + '.tmp';
fs.writeFileSync(tmpPath, content, 'utf8');
fs.renameSync(tmpPath, filePath);
```

---
*Conventions analysis for: Dynamo v1.3-M1*

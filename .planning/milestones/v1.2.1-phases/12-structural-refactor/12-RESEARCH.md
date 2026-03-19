# Phase 12: Structural Refactor - Research

**Researched:** 2026-03-18
**Domain:** CJS codebase restructuring, import boundary enforcement, feature toggles, CLI-wrapped MCP access
**Confidence:** HIGH

## Summary

Phase 12 restructures the Dynamo repo from its current `dynamo/` monolith into three root-level component directories (`dynamo/`, `ledger/`, `switchboard/`), enforces import boundaries so Ledger and Switchboard never cross-import, adds a global on/off toggle with dev mode override, and wraps all 9 Graphiti MCP tools as CLI commands so the toggle controls both hooks and manual memory operations. The deployed path (`~/.claude/dynamo/`) keeps the same root but gains the new internal layout.

The current codebase is well-organized under `dynamo/lib/ledger/` and `dynamo/lib/switchboard/` -- this phase promotes those to root-level siblings while extracting shared infrastructure (`core.cjs`) into `dynamo/` as the orchestrator's shared substrate. The most technically challenging aspect is wrapping all 9 MCP tools as CLI commands while maintaining correct Graphiti payload serialization/deserialization, and updating the installer/sync to deploy the new directory structure. The boundary test is straightforward static analysis via `require()` scanning.

**Primary recommendation:** Execute as three logical waves: (1) directory restructure + require path fixes + boundary test, (2) toggle mechanism + hook/CLI gate, (3) CLI memory commands + MCP deregistration + CLAUDE.md update. Each wave ends with all tests green.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Restructure applies to the **repo only** -- deployed path remains `~/.claude/dynamo/` with the new internal layout (ledger/, switchboard/ as subdirs, no lib/ wrapper)
- Repo gets three root-level dirs: `dynamo/`, `ledger/`, `switchboard/`
- Shared substrate (`core.cjs`) lives under `dynamo/` -- Dynamo owns shared infra as the orchestrator
- CLI entry point (`dynamo.cjs`), config, hooks dispatcher, prompts, and tests all under `dynamo/`
- `graphiti/` moves under `ledger/graphiti/` -- Docker infra only (docker-compose.yml, .env, config.yaml, start/stop scripts). CJS code that talks to Graphiti stays directly under `ledger/`
- Tests centralized under `dynamo/tests/` with `ledger/` and `switchboard/` subdirs for organization
- Convention + automated test enforcement: `boundary.test.cjs` scans all require() statements and fails if Ledger imports Switchboard or vice versa
- **Allowed:** Dynamo imports from all three (it's the orchestrator). Ledger and Switchboard import from `dynamo/core.cjs` (shared substrate)
- **Blocked:** Ledger <-> Switchboard cross-imports
- Hook dispatcher stays at `dynamo/hooks/dynamo-hooks.cjs`, routes to `ledger/hooks/` modules
- **Global on/off** via `config.json` field `"enabled": true/false`
- CLI commands: `dynamo toggle off`, `dynamo toggle on`, `dynamo status`
- Hook dispatcher checks `enabled` first -- exits immediately if false
- **Dev mode override** via `DYNAMO_DEV=1` environment variable in current shell
- When global is OFF but `DYNAMO_DEV=1`, hooks still fire for that process tree
- Toggle check: `if (!cfg.enabled && !process.env.DYNAMO_DEV) process.exit(0);`
- Toggle OFF disables **both hooks AND MCP/memory operations** -- full blackout
- Achieved by wrapping all Graphiti MCP access through Dynamo CLI commands
- **Deregister Graphiti as direct MCP server** from `~/.claude.json`
- Claude uses Dynamo CLI for all memory ops: `dynamo search`, `dynamo remember`, `dynamo forget`, `dynamo recall`
- CLI commands go through Ledger -> mcp-client.cjs -> HTTP -> Graphiti (same code path as hooks)
- Toggle gate in shared code applies to ALL paths -- hooks and CLI commands alike
- Docker service (`localhost:8100/mcp`) stays running -- it's infrastructure that hooks and CLI both use
- **Feature parity is mandatory** -- all 9 current MCP tools must have CLI equivalents
- Human-readable text by default, `--format json` for structured output, `--format raw` for full source content
- Move files first, then fix all require() paths, then run tests until green
- One atomic commit per logical group (structure move -> path fixes -> test pass)
- Update `install.cjs` and `sync.cjs` to deploy the new internal layout
- Run `dynamo install` to push new structure to `~/.claude/dynamo/`
- Use toggle to safely migrate: toggle OFF -> restructure -> install -> test -> toggle ON

### Claude's Discretion
- Exact CLI subcommand naming for memory operations (the mapping in CONTEXT.md is suggestive, not prescriptive)
- Internal module organization within each component
- How the boundary test discovers and scans files
- Exact JSON structure for CLI output format
- How `--format raw` determines what "full source" means per command

### Deferred Ideas (OUT OF SCOPE)
- **Dynamo as native MCP server** -- Register Dynamo itself as a stdio-based MCP server wrapping Graphiti. Would restore native tool call UX while keeping toggle control. Significant work -- consider for v1.3+.
- **Per-component test runners** -- Each component could have its own test entry point. Currently centralized under dynamo/tests/ which is sufficient.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STAB-08 | Directory structure refactor -- dynamo/, ledger/, switchboard/ as root-level directories | Directory mapping section provides exact before/after file locations; installer/sync update patterns documented |
| STAB-09 | Component scope refactor -- honor Dynamo/Ledger/Switchboard boundaries in code | Boundary enforcement patterns, cross-import analysis, `boundary.test.cjs` design all documented |
| STAB-10 | Global on/off and dev mode toggles -- disable hooks globally, dev override per-thread | Toggle mechanism, config schema, CLI commands, shared gate pattern, MCP deregistration all documented |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins | 18+ | fs, path, os, crypto, child_process | Zero npm dependency philosophy -- project principle since Phase 8 |
| node:test | built-in | Test framework | Already used by all 17 existing test files |
| node:assert | built-in | Assertions | Paired with node:test across all tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| MCPClient (internal) | 0.1.0 | JSON-RPC over HTTP to Graphiti | All CLI memory commands and hook operations |
| core.cjs (internal) | 0.1.0 | Shared substrate (config, env, output, logging) | Every module in every component imports from here |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static require() scanning | ESLint import plugin | Would add npm dependency; static scan is simpler and sufficient for this codebase size |
| JSON config for toggle | Environment variable only | Config file persists across sessions; env var is ephemeral (good for dev override only) |

**No installation needed** -- zero npm dependencies philosophy applies. All tools are Node.js built-ins or internal modules.

## Architecture Patterns

### Current Directory Structure (Before)
```
my-cc-setup/                          # Repo root
├── dynamo/                           # Everything lives here
│   ├── dynamo.cjs                    # CLI entry point
│   ├── config.json                   # Config
│   ├── VERSION                       # Version file
│   ├── hooks/
│   │   └── dynamo-hooks.cjs          # Hook dispatcher
│   ├── lib/
│   │   ├── core.cjs                  # Shared substrate
│   │   ├── ledger/                   # Ledger modules
│   │   │   ├── mcp-client.cjs
│   │   │   ├── scope.cjs
│   │   │   ├── search.cjs
│   │   │   ├── episodes.cjs
│   │   │   ├── curation.cjs
│   │   │   ├── sessions.cjs
│   │   │   └── hooks/                # Hook handlers
│   │   │       ├── session-start.cjs
│   │   │       ├── prompt-augment.cjs
│   │   │       ├── capture-change.cjs
│   │   │       ├── preserve-knowledge.cjs
│   │   │       └── session-summary.cjs
│   │   └── switchboard/              # Switchboard modules
│   │       ├── health-check.cjs
│   │       ├── diagnose.cjs
│   │       ├── verify-memory.cjs
│   │       ├── install.cjs
│   │       ├── sync.cjs
│   │       ├── stack.cjs
│   │       ├── stages.cjs
│   │       └── pretty.cjs
│   ├── prompts/                      # Curation prompt templates
│   └── tests/                        # All tests
├── graphiti/                         # Docker infra + legacy Python
├── claude-config/                    # Settings templates
└── install.sh                        # Legacy installer
```

### Target Directory Structure (After)
```
my-cc-setup/                          # Repo root
├── dynamo/                           # Orchestrator (shared infra + CLI + tests)
│   ├── dynamo.cjs                    # CLI entry point (extended with memory commands + toggle)
│   ├── core.cjs                      # Shared substrate (moved from lib/core.cjs, gains toggle gate)
│   ├── config.json                   # Config (gains "enabled" field)
│   ├── VERSION
│   ├── hooks/
│   │   └── dynamo-hooks.cjs          # Hook dispatcher (gains toggle check at top)
│   ├── prompts/                      # Curation prompt templates
│   └── tests/                        # All tests (centralized)
│       ├── core.test.cjs
│       ├── router.test.cjs
│       ├── boundary.test.cjs         # NEW: import boundary enforcement
│       ├── toggle.test.cjs           # NEW: toggle mechanism tests
│       ├── ledger/                   # Ledger-specific tests
│       │   ├── mcp-client.test.cjs
│       │   ├── scope.test.cjs
│       │   ├── search.test.cjs
│       │   ├── episodes.test.cjs
│       │   ├── curation.test.cjs
│       │   ├── sessions.test.cjs
│       │   └── dispatcher.test.cjs
│       └── switchboard/              # Switchboard-specific tests
│           ├── health-check.test.cjs
│           ├── diagnose.test.cjs
│           ├── install.test.cjs
│           ├── sync.test.cjs
│           ├── stack.test.cjs
│           ├── stages.test.cjs
│           └── verify-memory.test.cjs
├── ledger/                           # Memory system (hooks, MCP client, search, curation)
│   ├── mcp-client.cjs
│   ├── scope.cjs
│   ├── search.cjs
│   ├── episodes.cjs
│   ├── curation.cjs
│   ├── sessions.cjs
│   ├── hooks/                        # Hook handler modules
│   │   ├── session-start.cjs
│   │   ├── prompt-augment.cjs
│   │   ├── capture-change.cjs
│   │   ├── preserve-knowledge.cjs
│   │   └── session-summary.cjs
│   └── graphiti/                     # Docker infra only (moved from repo root graphiti/)
│       ├── docker-compose.yml
│       ├── .env
│       ├── .env.example
│       ├── config.yaml
│       ├── start-graphiti.sh
│       └── stop-graphiti.sh
├── switchboard/                      # Operations (health, diagnostics, install, sync, stack)
│   ├── health-check.cjs
│   ├── diagnose.cjs
│   ├── verify-memory.cjs
│   ├── install.cjs
│   ├── sync.cjs
│   ├── stack.cjs
│   ├── stages.cjs
│   └── pretty.cjs
├── claude-config/                    # Settings templates (updated for CLI memory ops)
└── install.sh                        # Legacy (may be retired or updated)
```

### Deployed Structure (at ~/.claude/dynamo/)
```
~/.claude/dynamo/
├── dynamo.cjs
├── core.cjs
├── config.json                       # Has "enabled": true field
├── VERSION
├── hooks/
│   └── dynamo-hooks.cjs
├── prompts/
├── ledger/
│   ├── mcp-client.cjs
│   ├── scope.cjs
│   ├── search.cjs
│   ├── episodes.cjs
│   ├── curation.cjs
│   ├── sessions.cjs
│   └── hooks/
│       └── (5 hook handler files)
├── switchboard/
│   ├── health-check.cjs
│   ├── diagnose.cjs
│   ├── (etc.)
│   └── pretty.cjs
└── tests/                            # NOT deployed (excluded by installer)
```

### Pattern 1: Toggle Gate (Shared)
**What:** A function in `core.cjs` that checks config + env and exits/returns early if Dynamo is disabled.
**When to use:** At the top of the hook dispatcher AND at the start of every CLI memory command.
**Example:**
```javascript
// In dynamo/core.cjs
function isEnabled() {
  const config = loadConfig();
  if (config.enabled === false && !process.env.DYNAMO_DEV) {
    return false;
  }
  return true;
}

// In dynamo/hooks/dynamo-hooks.cjs (top of stdin handler)
if (!isEnabled()) {
  process.exit(0);  // Silent exit -- no error, no output
}

// In CLI memory commands (dynamo.cjs switch cases)
if (!isEnabled()) {
  error('Dynamo is disabled. Use "dynamo toggle on" or set DYNAMO_DEV=1');
}
```

### Pattern 2: Boundary Enforcement Test
**What:** Static analysis test that scans all `require()` calls and validates component isolation.
**When to use:** Runs as part of the standard test suite.
**Example:**
```javascript
// In dynamo/tests/boundary.test.cjs
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

function scanRequires(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const requires = [];
  const regex = /require\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    requires.push(match[1]);
  }
  return requires;
}

function getAllCjsFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...getAllCjsFiles(full));
    else if (entry.name.endsWith('.cjs')) files.push(full);
  }
  return files;
}

describe('Import boundary enforcement', () => {
  const repoRoot = path.join(__dirname, '..', '..');
  const ledgerDir = path.join(repoRoot, 'ledger');
  const switchboardDir = path.join(repoRoot, 'switchboard');

  it('ledger files never import from switchboard', () => {
    for (const file of getAllCjsFiles(ledgerDir)) {
      const requires = scanRequires(file);
      for (const req of requires) {
        assert.ok(
          !req.includes('switchboard'),
          `${path.relative(repoRoot, file)} imports from switchboard: ${req}`
        );
      }
    }
  });

  it('switchboard files never import from ledger', () => {
    for (const file of getAllCjsFiles(switchboardDir)) {
      const requires = scanRequires(file);
      for (const req of requires) {
        assert.ok(
          !req.includes('ledger'),
          `${path.relative(repoRoot, file)} imports from ledger: ${req}`
        );
      }
    }
  });
});
```

### Pattern 3: CLI Memory Command (wrapping MCP tool)
**What:** Each CLI memory command calls through Ledger modules (mcp-client, search, episodes) with toggle gate.
**When to use:** For the 9 CLI commands replacing direct MCP tool access.
**Example:**
```javascript
// In dynamo.cjs -- new 'search' command
case 'search': {
  if (!isEnabled()) error('Dynamo is disabled');
  const query = restArgs.filter(a => !a.startsWith('--')).join(' ');
  if (!query) error('Usage: dynamo search <query> [--facts|--nodes] [--scope <scope>]');
  const scope = extractFlag(restArgs, '--scope') || 'global';
  const format = extractFlag(restArgs, '--format') || 'text';

  const search = require(path.join(__dirname, '..', 'ledger', 'search.cjs'));
  let result;
  if (restArgs.includes('--nodes')) {
    result = await search.searchNodes(query, scope);
  } else if (restArgs.includes('--facts')) {
    result = await search.searchFacts(query, scope);
  } else {
    result = await search.combinedSearch(query, scope);
  }

  if (format === 'json') output({ command: 'search', query, scope, result });
  else if (format === 'raw') output(null, true, result);
  else process.stderr.write(result + '\n');
  break;
}
```

### Pattern 4: Toggle CLI Commands
**What:** `dynamo toggle on|off` and `dynamo status` for managing the enabled state.
**When to use:** User or migration script needs to enable/disable Dynamo.
**Example:**
```javascript
// In dynamo.cjs
case 'toggle': {
  const configPath = path.join(DYNAMO_DIR, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const action = restArgs[0];

  if (action === 'on') {
    config.enabled = true;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    output({ command: 'toggle', enabled: true });
  } else if (action === 'off') {
    config.enabled = false;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    output({ command: 'toggle', enabled: false });
  } else {
    error('Usage: dynamo toggle <on|off>');
  }
  break;
}

case 'status': {
  const config = loadConfig();
  const devMode = process.env.DYNAMO_DEV === '1';
  output({
    command: 'status',
    enabled: config.enabled !== false,
    dev_mode: devMode,
    effective: (config.enabled !== false) || devMode
  });
  break;
}
```

### Anti-Patterns to Avoid
- **Circular dependency between components:** Ledger modules must never `require()` from Switchboard and vice versa. If both need shared functionality, it goes in `dynamo/core.cjs`.
- **Relative path assumptions:** All `require()` calls use `path.join(__dirname, ...)` -- never bare relative strings. This is already enforced by existing tests and must be maintained after the move.
- **Testing with live MCP server:** All tests mock the MCPClient or use stub HTTP servers. Never make real MCP calls in tests.
- **Editing `~/.claude.json` directly from code:** Use `claude mcp remove` for deregistration, not raw JSON manipulation. If the `claude` CLI is not available, document manual steps.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MCP JSON-RPC transport | New HTTP client | Existing MCPClient in ledger/mcp-client.cjs | Already handles initialize handshake, SSE parsing, session management |
| Graphiti search/write | Raw HTTP calls to MCP | Existing search.cjs + episodes.cjs | Already handle extractContent, error logging, scope validation |
| Pretty CLI output | Console.log formatting | Existing pretty.cjs formatter | Already handles ANSI colors, TTY detection, stage result formatting |
| Config file manipulation | JSON string building | fs.readFileSync + JSON.parse + JSON.stringify | Atomic write pattern already established in install.cjs |
| Test runner | Custom runner | `node --test tests/**/*.test.cjs` | node:test already used by all 17 test files |

**Key insight:** The existing Ledger modules (mcp-client.cjs, search.cjs, episodes.cjs, scope.cjs, sessions.cjs) are already well-factored for direct use by CLI commands. The CLI memory commands are thin wrappers that call existing Ledger functions, format output, and apply the toggle gate. No new Graphiti protocol code needed.

## Common Pitfalls

### Pitfall 1: Broken require() Paths After Move
**What goes wrong:** Moving files changes `__dirname`, breaking every relative `path.join(__dirname, ...)` call.
**Why it happens:** The current codebase has 50+ require() calls using `path.join(__dirname, '..', ...)` patterns. When `dynamo/lib/ledger/search.cjs` moves to `ledger/search.cjs`, the path to `core.cjs` changes from `require(path.join(__dirname, '..', 'core.cjs'))` to `require(path.join(__dirname, '..', 'dynamo', 'core.cjs'))`.
**How to avoid:** Build a complete mapping of every require() path that needs updating BEFORE moving files. Move files first, then update all paths in one pass, then test.
**Warning signs:** `MODULE_NOT_FOUND` errors when running any test or command.

### Pitfall 2: Current Cross-Boundary Imports (Switchboard -> Ledger)
**What goes wrong:** The boundary test would immediately fail because Switchboard currently imports from Ledger.
**Why it happens:** Three Switchboard files currently import Ledger modules:
  - `stages.cjs` imports `MCPClient` from `ledger/mcp-client.cjs`
  - `diagnose.cjs` imports `MCPClient` from `ledger/mcp-client.cjs`
  - `verify-memory.cjs` imports `MCPClient`, `SCOPE`, `validateGroupId` from `ledger/`; `loadSessions`, `listSessions` from `ledger/sessions.cjs`
**How to avoid:** Per the CONTEXT decision, Switchboard can import from `dynamo/core.cjs` (shared substrate) but NOT from Ledger. The solution: route these imports through Dynamo. Two approaches:
  1. Move MCP client creation and scope validation into `dynamo/core.cjs` as shared infrastructure (since both Ledger and Switchboard need MCP access)
  2. Have Switchboard diagnostic modules accept MCP client/scope as injected dependencies passed by `dynamo.cjs`
  Approach 1 is simpler and matches the "Dynamo owns shared infra" decision.
**Warning signs:** Boundary test failing for `stages.cjs`, `diagnose.cjs`, `verify-memory.cjs`.

### Pitfall 3: Installer/Sync Path Breakage
**What goes wrong:** The installer and sync commands deploy a broken directory structure because their path constants are stale.
**Why it happens:** `install.cjs` uses `REPO_DIR = path.join(__dirname, '..', '..')` to find the repo root. After moving from `dynamo/lib/switchboard/install.cjs` to `switchboard/install.cjs`, this path changes from `dynamo/` to the repo root.
**How to avoid:** After move, update REPO_DIR, LIVE_DIR, and all path constants in install.cjs and sync.cjs. The INSTALL_EXCLUDES list also needs updating (currently excludes `tests` -- in the new layout, tests are under `dynamo/tests/` which is fine, but the exclude pattern must still work).
**Warning signs:** `dynamo install` copies files to wrong location or misses the new ledger/switchboard dirs.

### Pitfall 4: Deployed Path vs Repo Path Confusion
**What goes wrong:** The repo structure (3 root dirs) differs from the deployed structure (everything under `~/.claude/dynamo/` with ledger/ and switchboard/ as subdirs).
**Why it happens:** CONTEXT.md specifies: repo has `dynamo/`, `ledger/`, `switchboard/` at root level. But deployed path is `~/.claude/dynamo/` with `ledger/` and `switchboard/` as subdirectories. The installer must map repo root to `~/.claude/dynamo/`.
**How to avoid:** The installer needs to copy from three source directories (repo `dynamo/`, `ledger/`, `switchboard/`) into one destination (`~/.claude/dynamo/`), mapping `dynamo/*` to `~/.claude/dynamo/*`, `ledger/*` to `~/.claude/dynamo/ledger/*`, `switchboard/*` to `~/.claude/dynamo/switchboard/*`. At runtime, require() paths must use the deployed layout (everything relative to `~/.claude/dynamo/`).
**Warning signs:** Code works in repo but breaks after `dynamo install` because repo `require('../dynamo/core.cjs')` would be wrong at deploy time.

### Pitfall 5: MCP Deregistration Breaking Other Sessions
**What goes wrong:** Removing `graphiti` from `~/.claude.json` while other Claude sessions are running means those sessions lose MCP access mid-conversation.
**Why it happens:** `~/.claude.json` is shared across all Claude sessions.
**How to avoid:** The toggle mechanism handles this: toggle OFF first (hooks exit silently), then deregister MCP server, then add CLI commands to CLAUDE.md. Other sessions will not have the MCP tool available, but they also won't try to use it because hooks are off. The brief blackout period (2-5 min) is by design per CONTEXT.md.
**Warning signs:** Error messages in other Claude sessions about missing MCP tools.

### Pitfall 6: Test Path Reorganization
**What goes wrong:** Tests fail because they reference modules by old paths.
**Why it happens:** Tests use paths like `path.join(__dirname, '..', 'lib', 'core.cjs')`. After restructuring tests into subdirectories, the relative path depth changes.
**How to avoid:** When moving tests into `dynamo/tests/ledger/` and `dynamo/tests/switchboard/`, update every test file's module path references. The `__dirname` for a test in `dynamo/tests/ledger/mcp-client.test.cjs` to reach `ledger/mcp-client.cjs` would be `path.join(__dirname, '..', '..', '..', 'ledger', 'mcp-client.cjs')` in repo or `path.join(__dirname, '..', '..', 'ledger', 'mcp-client.cjs')` at deploy time.
**Warning signs:** Tests failing with MODULE_NOT_FOUND even though source modules are fine.

### Pitfall 7: Dual-Layout require() Problem
**What goes wrong:** Code that works in repo layout breaks in deployed layout (or vice versa) because the directory structures differ.
**Why it happens:** In repo: `ledger/mcp-client.cjs` requires `../dynamo/core.cjs`. In deployed: `ledger/mcp-client.cjs` requires `../core.cjs` (because `core.cjs` is at the `~/.claude/dynamo/` root).
**How to avoid:** This is the critical architectural decision. Two viable approaches:
  1. **Match deployed layout in requires:** Write all require() paths assuming the deployed structure (e.g., `require(path.join(__dirname, '..', 'core.cjs'))` from `ledger/`). Tests run from within `dynamo/` dir by adding `dynamo/` to the module resolution root.
  2. **Environment-aware path resolution:** Have a small bootstrap that detects whether running from repo or deployed location.
  Approach 1 is strongly recommended. All code should be written to the deployed layout. The test runner and `dynamo.cjs` execute from within `dynamo/` which is the equivalent of the `~/.claude/dynamo/` root.
**Warning signs:** CODE_MODULE_NOT_FOUND that appears only in one context (repo vs deployed).

## Code Examples

### Example 1: Updated require() paths (Ledger module after restructure)
```javascript
// ledger/mcp-client.cjs -- require core from parent dir (works in both repo and deployed)
// In repo: ledger/mcp-client.cjs -> ../dynamo/core.cjs (repo root + dynamo/)
// Deployed: ledger/mcp-client.cjs -> ../core.cjs (because core.cjs is at ~/.claude/dynamo/ root)
//
// SOLUTION: At deploy time, installer copies dynamo/core.cjs to ~/.claude/dynamo/core.cjs
// At run time (both repo and deployed), code is always running from the "dynamo/" equivalent root.
// The require path from ledger/mcp-client.cjs to core.cjs is: path.join(__dirname, '..', 'core.cjs')
const { fetchWithTimeout, loadConfig } = require(path.join(__dirname, '..', 'core.cjs'));
```

### Example 2: Config schema with toggle field
```json
{
  "version": "0.1.0",
  "enabled": true,
  "graphiti": {
    "mcp_url": "http://localhost:8100/mcp",
    "health_url": "http://localhost:8100/health"
  },
  "curation": {
    "model": "anthropic/claude-haiku-4.5",
    "api_url": "https://openrouter.ai/api/v1/chat/completions"
  },
  "timeouts": {
    "health": 3000,
    "mcp": 5000,
    "curation": 10000,
    "summarization": 15000
  },
  "logging": {
    "max_size_bytes": 1048576,
    "file": "hook-errors.log"
  }
}
```

### Example 3: MCP tool -> CLI command mapping
```javascript
// Recommended CLI subcommand naming (Claude's discretion per CONTEXT.md)
const MEMORY_COMMANDS = {
  'remember':    { tool: 'add_memory',            args: ['content', '--scope'] },
  'search':      { tool: 'search_memory_facts',   args: ['query', '--scope', '--facts', '--nodes'] },
  'recall':      { tool: 'get_episodes',           args: ['--scope'] },
  'edge':        { tool: 'get_entity_edge',        args: ['uuid'] },
  'forget':      { tool: 'delete_episode',         args: ['uuid', '--edge'] },
  'clear':       { tool: 'clear_graph',            args: ['--scope', '--confirm'] },
  'health-check':{ tool: 'get_status',             args: [] }  // already exists
};
```

### Example 4: Updated installer for new structure
```javascript
// install.cjs -- updated to copy from three repo dirs to one deployed dir
const REPO_ROOT = path.join(__dirname, '..');  // From switchboard/ to repo root
const DYNAMO_SRC = path.join(REPO_ROOT, 'dynamo');
const LEDGER_SRC = path.join(REPO_ROOT, 'ledger');
const SWITCHBOARD_SRC = path.join(REPO_ROOT, 'switchboard');
const LIVE_DIR = path.join(os.homedir(), '.claude', 'dynamo');

// Copy dynamo/* -> ~/.claude/dynamo/*  (core.cjs, dynamo.cjs, hooks/, prompts/, config.json, VERSION)
// Copy ledger/* -> ~/.claude/dynamo/ledger/*
// Copy switchboard/* -> ~/.claude/dynamo/switchboard/*
```

### Example 5: MCP deregistration
```bash
# Remove graphiti MCP server registration
claude mcp remove --scope user graphiti
# Verify removal
cat ~/.claude.json | grep graphiti  # Should return nothing
```

## Critical Implementation Detail: Require Path Strategy

The single most important architectural decision for this phase is how `require()` paths work across the repo-vs-deployed duality.

**Recommendation:** All source code require() paths should be written relative to the **deployed** layout (`~/.claude/dynamo/` as root). In the repo, the `dynamo/` directory is the equivalent root:

| From (repo) | To (repo) | require() path |
|-------------|-----------|----------------|
| `ledger/mcp-client.cjs` | `dynamo/core.cjs` | `path.join(__dirname, '..', 'dynamo', 'core.cjs')` |
| `switchboard/install.cjs` | `dynamo/core.cjs` | `path.join(__dirname, '..', 'dynamo', 'core.cjs')` |
| `dynamo/dynamo.cjs` | `ledger/search.cjs` | `path.join(__dirname, '..', 'ledger', 'search.cjs')` |
| `dynamo/hooks/dynamo-hooks.cjs` | `ledger/hooks/session-start.cjs` | `path.join(__dirname, '..', '..', 'ledger', 'hooks', 'session-start.cjs')` |

**At deploy time**, the installer copies:
- `dynamo/*` -> `~/.claude/dynamo/*` (root level files)
- `ledger/*` -> `~/.claude/dynamo/ledger/*`
- `switchboard/*` -> `~/.claude/dynamo/switchboard/*`

**In deployed layout**, the same require() paths resolve correctly:
- From `~/.claude/dynamo/ledger/mcp-client.cjs`, `path.join(__dirname, '..', 'dynamo', 'core.cjs')` resolves to `~/.claude/dynamo/dynamo/core.cjs` -- **WRONG!**

**This reveals the problem:** If repo layout has `dynamo/core.cjs` and deployed layout has `~/.claude/dynamo/core.cjs`, the path from `ledger/` to `core.cjs` differs:
- Repo: `../dynamo/core.cjs`
- Deployed: `../core.cjs`

**Resolution:** The `dynamo/` directory files (core.cjs, dynamo.cjs, config.json, VERSION, hooks/, prompts/) must be deployed to `~/.claude/dynamo/` root level, NOT into a `dynamo/` subdirectory. So the installer must:
- Copy `dynamo/core.cjs` -> `~/.claude/dynamo/core.cjs`
- Copy `dynamo/dynamo.cjs` -> `~/.claude/dynamo/dynamo.cjs`
- Copy `dynamo/hooks/` -> `~/.claude/dynamo/hooks/`
- Copy `ledger/*` -> `~/.claude/dynamo/ledger/*`
- Copy `switchboard/*` -> `~/.claude/dynamo/switchboard/*`

**This means require paths from ledger/ and switchboard/ files should use `path.join(__dirname, '..', 'core.cjs')` which works in BOTH layouts:**
- Repo: `ledger/../core.cjs` -- does NOT exist at repo root. This is the problem.

**Final resolution -- recommended approach:** In the repo, `core.cjs` lives at `dynamo/core.cjs`. Ledger and Switchboard reference it as `path.join(__dirname, '..', 'dynamo', 'core.cjs')`. The installer then creates a small shim OR copies `dynamo/core.cjs` to `~/.claude/dynamo/core.cjs` AND rewrites paths... This is getting complex.

**Simplest approach (recommended):** Have `core.cjs` at the repo root level alongside `dynamo/`, `ledger/`, `switchboard/`. Then both repo and deployed layouts use `path.join(__dirname, '..', 'core.cjs')`. But CONTEXT.md says "Shared substrate (core.cjs) lives under dynamo/" -- so it must stay there.

**Actual simplest approach:** Keep `core.cjs` in `dynamo/` in the repo. The installer copies it to `~/.claude/dynamo/core.cjs` (root of deployed dir). All `require()` paths in ledger/ and switchboard/ use a helper function:

```javascript
// At the top of every ledger/ and switchboard/ module:
const CORE = require(
  // Works in deployed: ~/.claude/dynamo/ledger/../core.cjs = ~/.claude/dynamo/core.cjs
  // Works in repo:     ledger/../dynamo/core.cjs (via fallback)
  (() => {
    try { return require.resolve(path.join(__dirname, '..', 'core.cjs')); }
    catch { return require.resolve(path.join(__dirname, '..', 'dynamo', 'core.cjs')); }
  })()
);
```

**However, this is inelegant.** The truly cleanest approach given the constraints:

**The CONTEXT.md says "no lib/ wrapper"** -- meaning in the deployed layout, `ledger/` and `switchboard/` are direct children of `~/.claude/dynamo/`, and `core.cjs` is also a direct child. So the deployed layout is:
```
~/.claude/dynamo/
  core.cjs        (from dynamo/core.cjs)
  dynamo.cjs      (from dynamo/dynamo.cjs)
  ledger/         (from ledger/)
  switchboard/    (from switchboard/)
```

In the **repo**, `dynamo/core.cjs` is the source file. All require() paths should target the deployed layout: `path.join(__dirname, '..', 'core.cjs')`. To make this work in the repo during development and testing, add a symlink or have tests run with a working directory or `NODE_PATH` that resolves correctly.

**Recommended final pattern:** Store `core.cjs` at `dynamo/core.cjs` in repo. Have the **test runner** cd into `dynamo/` before running tests, or use `NODE_PATH`. All source files in `ledger/` and `switchboard/` use `path.join(__dirname, '..', 'core.cjs')`. This works deployed. For repo development, the test command becomes `node --test dynamo/tests/**/*.test.cjs` run from within `dynamo/` (since tests are under `dynamo/tests/`). Since tests import via absolute `path.join(__dirname, ...)`, and __dirname resolves to the actual location, this works as long as the repo `dynamo/` directory mirrors the deployed root.

To make `path.join(__dirname, '..', 'core.cjs')` work from `ledger/mcp-client.cjs` in the repo: `ledger/../core.cjs` would need `core.cjs` at the repo root. It does NOT exist there in the repo layout.

**DEFINITIVE SOLUTION:** Use `__dirname`-based path resolution with the **repo root** as the common ancestor. Every file knows it's either in `dynamo/`, `ledger/`, or `switchboard/`. Core is at `dynamo/core.cjs`. The require path from any component is always relative to the repo root:

```javascript
// Detect the base directory (repo root OR deployed root)
// In repo: __dirname for ledger/mcp-client.cjs is <repo>/ledger
// In deployed: __dirname is ~/.claude/dynamo/ledger
// core.cjs is at <repo>/dynamo/core.cjs OR ~/.claude/dynamo/core.cjs

// From ledger/ or switchboard/:
const corePath = (() => {
  // Try deployed layout first (core.cjs as sibling of parent)
  const deployed = path.join(__dirname, '..', 'core.cjs');
  if (fs.existsSync(deployed)) return deployed;
  // Fall back to repo layout (core.cjs in dynamo/ sibling)
  return path.join(__dirname, '..', 'dynamo', 'core.cjs');
})();
```

This is robust but adds filesystem checks. The simpler alternative: **always use the repo-relative path** `path.join(__dirname, '..', 'dynamo', 'core.cjs')` and have the installer create a `dynamo/` subdirectory at `~/.claude/dynamo/dynamo/` containing just `core.cjs` (or a symlink). But that contradicts the "no lib/ wrapper" intent.

**RECOMMENDED DEFINITIVE APPROACH:** Accept the pragmatic solution of a `resolveCore()` helper at the top of core.cjs that both layouts can find. OR, even simpler: **make the deployed layout match the repo layout**. Deploy `dynamo/` as a subdirectory: `~/.claude/dynamo/dynamo/core.cjs`. All paths are identical. The `dynamo.cjs` entry point is still at `~/.claude/dynamo/dynamo.cjs` (the hooks config already points there). The only "extra" nesting is `dynamo/dynamo/core.cjs` vs `dynamo/core.cjs` but this is the price of consistent paths.

HOWEVER -- the CONTEXT.md says "no lib/ wrapper" and the deployed path remains `~/.claude/dynamo/`. This strongly implies the deployed root should NOT have a nested `dynamo/` subdir.

**FINAL RECOMMENDATION for planner:** This is the one area where Claude's discretion should be exercised carefully. The planner should choose ONE of:

1. **Symlink approach:** In repo, create `core.cjs` symlink at repo root pointing to `dynamo/core.cjs`. All require paths use `path.join(__dirname, '..', 'core.cjs')`. Installer copies the actual file (not symlink).
2. **Dual-path with fs.existsSync:** Small helper in each file. Slightly more code but guaranteed correct.
3. **Copy core.cjs to repo root:** Actual file at repo root AND under `dynamo/`. Installer deploys from repo root. Source of truth is `dynamo/core.cjs`, copy is maintained by convention or build step.

Option 1 (symlink) is cleanest. Symlinks work on macOS and are resolved by `require()`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct MCP tool calls from Claude | CLI-wrapped MCP access via `dynamo` | Phase 12 | Toggle can disable ALL memory ops; single interface for Claude |
| Graphiti registered as MCP server | Graphiti stays running but not registered | Phase 12 | Claude accesses memory only through Dynamo CLI |
| No kill switch for memory system | Global toggle + dev mode override | Phase 12 | Safe development, safe migration, per-thread control |
| Flat `dynamo/lib/` structure | Three root-level component dirs | Phase 12 | Clear architectural boundaries, enforced import isolation |

## Open Questions

1. **Symlink vs dual-path for core.cjs resolution**
   - What we know: Repo layout has `dynamo/core.cjs`, deployed has `~/.claude/dynamo/core.cjs`. Ledger/Switchboard need to `require()` it from both contexts.
   - What's unclear: Whether symlinks at repo root are acceptable to the user (they work technically but add a non-obvious file).
   - Recommendation: Start with symlink approach. If it causes issues, fall back to dual-path fs.existsSync helper. The planner should make this call.

2. **MCP deregistration method**
   - What we know: `claude mcp remove --scope user graphiti` should work. The entry in `~/.claude.json` is `mcpServers.graphiti`.
   - What's unclear: Whether the `claude` CLI command is available in all environments or if manual JSON editing of `~/.claude.json` is needed as a fallback.
   - Recommendation: Try `claude mcp remove` first. If it fails, fall back to reading/writing `~/.claude.json` directly (removing `mcpServers.graphiti` key).

3. **Existing Switchboard -> Ledger imports**
   - What we know: `stages.cjs`, `diagnose.cjs`, and `verify-memory.cjs` currently import from Ledger (MCPClient, SCOPE, validateGroupId, sessions).
   - What's unclear: Whether these should be moved to `dynamo/core.cjs` (expanding shared substrate) or if Switchboard should receive them via dependency injection from `dynamo.cjs`.
   - Recommendation: Expand `dynamo/core.cjs` to re-export MCPClient and scope utilities. This is consistent with "Dynamo owns shared infra as the orchestrator." Switchboard modules import from `core.cjs`, which internally delegates to Ledger modules. This keeps the boundary clean: Switchboard only imports from Dynamo, not Ledger.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node 18+) |
| Config file | none -- uses `node --test` CLI directly |
| Quick run command | `node --test dynamo/tests/*.test.cjs` |
| Full suite command | `node --test dynamo/tests/*.test.cjs dynamo/tests/ledger/*.test.cjs dynamo/tests/switchboard/*.test.cjs` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAB-08 | Directory structure matches target layout | unit | `node --test dynamo/tests/boundary.test.cjs` | Wave 0 |
| STAB-08 | Installer deploys new structure correctly | unit | `node --test dynamo/tests/switchboard/install.test.cjs` | Exists (update needed) |
| STAB-08 | Sync handles new directory layout | unit | `node --test dynamo/tests/switchboard/sync.test.cjs` | Exists (update needed) |
| STAB-09 | Ledger never imports from Switchboard | unit | `node --test dynamo/tests/boundary.test.cjs` | Wave 0 |
| STAB-09 | Switchboard never imports from Ledger | unit | `node --test dynamo/tests/boundary.test.cjs` | Wave 0 |
| STAB-10 | Toggle on/off persists to config.json | unit | `node --test dynamo/tests/toggle.test.cjs` | Wave 0 |
| STAB-10 | Hook dispatcher exits when disabled | unit | `node --test dynamo/tests/toggle.test.cjs` | Wave 0 |
| STAB-10 | DYNAMO_DEV=1 overrides global off | unit | `node --test dynamo/tests/toggle.test.cjs` | Wave 0 |
| STAB-10 | CLI memory commands respect toggle | unit | `node --test dynamo/tests/toggle.test.cjs` | Wave 0 |
| STAB-10 | All 9 MCP tools have CLI equivalents | unit | `node --test dynamo/tests/router.test.cjs` | Exists (update needed) |

### Sampling Rate
- **Per task commit:** `node --test dynamo/tests/*.test.cjs`
- **Per wave merge:** Full suite across all test subdirectories
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `dynamo/tests/boundary.test.cjs` -- covers STAB-08, STAB-09 (import boundary enforcement)
- [ ] `dynamo/tests/toggle.test.cjs` -- covers STAB-10 (toggle on/off, dev mode, CLI gate)
- [ ] Update `dynamo/tests/router.test.cjs` -- add checks for new memory commands and toggle commands
- [ ] Update `dynamo/tests/switchboard/install.test.cjs` -- verify new directory structure deployment
- [ ] Update `dynamo/tests/switchboard/sync.test.cjs` -- verify new directory structure sync

*(Existing test infrastructure covers most needs -- 17 test files with 100+ test cases. New tests needed only for new functionality.)*

## Sources

### Primary (HIGH confidence)
- Codebase analysis: Direct reading of all 24 CJS source files and 17 test files in `dynamo/`
- `~/.claude.json`: Confirmed MCP registration at `mcpServers.graphiti` (line 832-836)
- `~/.claude/CLAUDE.md`: Confirmed 9 MCP tool references that need CLI equivalents
- `12-CONTEXT.md`: All locked decisions, discretion areas, and deferred ideas
- `08-CONTEXT.md`: Phase 8 foundation decisions (zero npm deps, config as JSON, prompts as .md)
- `10-CONTEXT.md`: Phase 10 CLI router pattern, installer behavior, sync scope

### Secondary (MEDIUM confidence)
- Node.js `require()` resolution: Built-in behavior -- `path.join(__dirname, ...)` always resolves from the physical file location
- `claude mcp remove` CLI: Assumed available based on `claude mcp add` usage in install.cjs (line 191)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero npm deps, all Node.js built-ins, already proven across 11 prior phases
- Architecture: HIGH -- directory layout, import patterns, toggle mechanism all clearly specified in CONTEXT.md. One open question around require path resolution strategy (well-analyzed with clear options)
- Pitfalls: HIGH -- every pitfall identified from direct codebase analysis with concrete code references

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable -- internal project architecture, no external dependency changes)

# Dynamo

A Claude Code power-user platform for persistent memory and self-management, built on Node/CJS with a Graphiti knowledge graph backend.

## What It Does

- **Automatic context injection** -- every session starts with relevant preferences, project context, and recent session summaries pulled from the knowledge graph
- **Prompt augmentation** -- every user prompt is enriched with semantically relevant memories before Claude processes it
- **Change tracking** -- file edits are captured as episodes in the knowledge graph for later retrieval
- **Pre-compaction preservation** -- before context window compression, key knowledge is extracted and re-injected so Claude retains critical facts
- **Session summarization** -- when a session ends, a Haiku-generated summary is stored in both project and session scopes
- **CLI-based memory operations** -- search, store, recall, inspect, and manage knowledge graph data directly via the `dynamo` CLI

## Architecture

Dynamo comprises six subsystems: **Dynamo** (system wrapper -- CLI router, shared resources, API surface), **Switchboard** (install/sync/update lifecycle), **Ledger** (data construction -- episode creation, write operations), **Assay** (data access -- search, session queries), **Terminus** (data infrastructure -- MCP transport, Docker stack, health/diagnostics, SQLite session storage), and **Reverie** (Inner Voice -- stub for M2).

```mermaid
graph TB
    CC[Claude Code] -->|hooks stdin/JSON| DH[cc/hooks/dynamo-hooks.cjs<br/>Hook Dispatcher]
    CC -->|CLI invocation| DR[dynamo.cjs<br/>CLI Router]

    DH -->|route by event| LH[subsystems/ledger/<br/>5 Hook Handlers]
    DR -->|memory commands| AS[subsystems/assay/<br/>Search, Sessions]
    DR -->|ops commands| SW[subsystems/switchboard/<br/>Install, Sync, Update]
    DR -->|infra commands| TM[subsystems/terminus/<br/>Health, Diagnose, Stack]

    LH --> MC[terminus/mcp-client.cjs<br/>JSON-RPC/SSE]
    AS --> MC
    TM --> MC

    subgraph "lib/ Shared Substrate"
        CORE[core.cjs] --- RESOLVE[resolve.cjs]
        CORE --- LAYOUT[layout.cjs]
        CORE --- SCOPE[scope.cjs]
    end

    DR --> CORE
    DH --> CORE
```

### Directory Structure

```
dynamo/
  dynamo.cjs                  # CLI router (25 commands)
  dynamo/                     # Meta (config.json, VERSION, migrations/)
  cc/
    hooks/dynamo-hooks.cjs    # Hook dispatcher (5 events, input validation, boundary markers)
    prompts/                  # Curation prompt templates
    settings-hooks.json       # Hook registration template
    CLAUDE.md.template        # CLAUDE.md deployment template
  lib/
    core.cjs                  # Shared utilities, env loading, config
    resolve.cjs               # Centralized path resolver
    layout.cjs                # Layout paths and sync pair definitions (ARCH-04)
    scope.cjs                 # Scope validation (SCOPE, validateGroupId)
    pretty.cjs                # Output formatting
    dep-graph.cjs             # Dependency graph analysis
  subsystems/switchboard/     # Install, sync, update, update-check
  subsystems/assay/           # Search, sessions (read operations)
  subsystems/ledger/          # Curation, episodes, 5 hook handlers (write operations)
  subsystems/terminus/        # Health-check, diagnose, MCP client, stages, session-store,
                              #   stack, migrate, verify-memory
  subsystems/reverie/         # Stub (.gitkeep) -- Inner Voice (M2)
  dynamo/tests/               # 28 test files, 515 tests
```

## Installation

### 1. Clone the repo

```bash
git clone https://github.com/tomkyser/dynamo
cd dynamo
```

### 2. Create your `.env`

```bash
cp .env.example ~/.claude/graphiti/.env
# Add your OpenRouter API key:
#   OPENROUTER_API_KEY=sk-or-...
```

The `.env` file deploys to `~/.claude/graphiti/.env`.

### 3. Run the installer

```bash
node dynamo.cjs install
```

The installer performs 10 steps:

1. **Check dependencies** -- verifies Node.js >= 22
2. **Copy files** -- deploys `subsystems/`, `cc/`, `lib/`, and root files to `~/.claude/dynamo/`
3. **Generate config** -- creates `config.json` from `.env` values
4. **Merge settings** -- adds hook definitions to `~/.claude/settings.json` (backs up first)
5. **Deregister MCP** -- removes direct Graphiti MCP (all access through Dynamo CLI)
6. **Deploy CLAUDE.md** -- copies template to `~/.claude/CLAUDE.md`
7. **Verify lib/** -- confirms shared substrate deployed
8. **Retire Python** -- moves legacy Python/Bash files to `~/.claude/graphiti-legacy/`
9. **Migrate sessions** -- converts `sessions.json` to SQLite (one-time, idempotent)
10. **Health check** -- verifies the deployment (8 stages)

### 4. Start the Docker stack

```bash
node dynamo.cjs start
```

### 5. Restart Claude Code

Hooks and CLI activate on a fresh session.

### Deployed Layout

```
~/.claude/dynamo/             # Deployed by installer
  dynamo.cjs                  # CLI entry point
  dynamo/                     # Meta (config.json, VERSION, migrations/)
  cc/
    hooks/dynamo-hooks.cjs    # Hook dispatcher
    prompts/                  # Curation templates
  lib/
    core.cjs                  # Shared substrate
    resolve.cjs               # Path resolver
    layout.cjs                # Layout paths
    scope.cjs                 # Scope validation
    pretty.cjs                # Formatters
  subsystems/switchboard/     # Install, sync, update
  subsystems/assay/           # Search, sessions
  subsystems/ledger/          # Curation, episodes, hooks/
  subsystems/terminus/        # Health, diagnose, MCP, session-store
  subsystems/reverie/         # Stub (M2)

~/.claude/graphiti/           # Graphiti infrastructure
  docker-compose.yml
  config.yaml
  .env                        # API keys (never committed)
  start-graphiti.sh
  stop-graphiti.sh
  sessions.db                 # SQLite session database
  sessions.json               # JSON backup (backward compat)

~/.claude/CLAUDE.md           # Deployed from template
~/.claude/settings.json       # Hooks merged into this
```

## CLI Commands

All commands are invoked via `node ~/.claude/dynamo/dynamo.cjs <command>` (or `node dynamo/dynamo.cjs <command>` from the repo).

### Memory Operations

| Command | Description |
|---------|-------------|
| `dynamo search <query>` | Search knowledge graph for facts and entities |
| `dynamo search <query> --facts` | Search for facts (relationships) only |
| `dynamo search <query> --nodes` | Search for entity nodes only |
| `dynamo remember <content>` | Store a memory in the knowledge graph |
| `dynamo recall` | Retrieve episodes from a scope |
| `dynamo edge <uuid>` | Inspect a specific entity relationship |
| `dynamo forget <uuid>` | Delete an episode by UUID |
| `dynamo forget --edge <uuid>` | Delete a specific relationship |
| `dynamo clear --scope <scope> --confirm` | Clear all data for a scope (destructive) |

### Session Management

| Command | Description |
|---------|-------------|
| `dynamo session list` | List all sessions |
| `dynamo session view <id>` | View a specific session |
| `dynamo session label <id> <label>` | Label a session |
| `dynamo session backfill` | Backfill session metadata |

### System Operations

| Command | Description |
|---------|-------------|
| `dynamo start` | Start the Graphiti Docker stack with health wait |
| `dynamo stop` | Stop the Graphiti Docker stack (preserves data) |
| `dynamo install` | Deploy Dynamo to `~/.claude/dynamo/` (backup, copy, config, hooks, health check) |
| `dynamo rollback` | Restore previous version from backup |
| `dynamo check-update` | Check for available Dynamo updates (current vs latest version) |
| `dynamo update` | Update Dynamo to latest version (backup, pull, migrate, verify, auto-rollback on failure) |
| `dynamo sync <direction>` | Bidirectional sync between repo and live deployment |
| `dynamo toggle <on\|off>` | Enable or disable Dynamo globally |
| `dynamo status` | Show Dynamo enabled/disabled state |
| `dynamo version` | Show Dynamo version |

### Diagnostics

| Command | Description |
|---------|-------------|
| `dynamo health-check` | Run 8-stage health check (Docker, Neo4j, API, MCP, env, canary, Node.js, session storage) |
| `dynamo diagnose` | Run all 13 diagnostic stages (deep system inspection) |
| `dynamo verify-memory` | Run 6 pipeline checks (write, read, scope isolation, sessions) |
| `dynamo test` | Run the Dynamo test suite |

### Common Options

| Option | Description |
|--------|-------------|
| `--scope <scope>` | Memory scope: `global`, `project-<name>`, `session-<ts>`, `task-<desc>` |
| `--format json` | Structured JSON output (stdout) |
| `--format raw` | Full source content from graph (stdout) |
| `--pretty` | Human-readable output for operational commands |
| `--verbose` | Show detailed stage output |
| `--dry-run` | Preview sync changes without applying |

### Examples

```bash
# Search for architecture decisions in a project
dynamo search "auth strategy" --scope project-myapp

# Store a memory in the global scope
dynamo remember "Prefers Opus with high reasoning effort"

# Recall episodes from a project scope
dynamo recall --scope project-dynamo --format json

# Sync repo changes to live deployment
dynamo sync repo-to-live --dry-run

# Check system health
dynamo health-check --pretty

# View recent sessions
dynamo session list --pretty
```

## Hook System

Dynamo uses a single hook dispatcher (`dynamo-hooks.cjs`) that routes all 5 Claude Code hook events to their handlers. All hooks receive JSON on stdin from Claude Code.

### Dispatcher Flow

```
stdin (JSON from Claude Code)
  -> parse JSON, extract hook_event_name
  -> toggle gate: if disabled, exit 0 silently
  -> detectProject() from cwd
  -> build scope (project-{name} or global)
  -> route to handler
  -> exit 0 (always -- never block Claude Code)
```

### Hook Events

| Event | Matcher | Handler | What It Does |
|-------|---------|---------|-------------|
| SessionStart | `startup\|resume` | `session-start.cjs` | Injects global prefs + project context + recent sessions as `[GRAPHITI MEMORY CONTEXT]` |
| SessionStart | `compact` | `session-start.cjs` | Same injection after context compaction |
| UserPromptSubmit | `""` (all) | `prompt-augment.cjs` | Semantic search per prompt, injects `[RELEVANT MEMORY]` (skips prompts < 15 chars) |
| PostToolUse | `Write\|Edit\|MultiEdit` | `capture-change.cjs` | Captures file changes as episodes (fire-and-forget) |
| PreCompact | `""` (all) | `preserve-knowledge.cjs` | Summarizes conversation via Haiku, stores summary, re-injects as `[PRESERVED CONTEXT]` |
| Stop | `""` (all) | `session-summary.cjs` | Summarizes session via Haiku, stores in project + session scopes |

### Key Behaviors

- **Toggle gate**: hooks exit silently (exit 0) when Dynamo is disabled -- never error, never block
- **Foreground execution**: all hooks run in the foreground with timeouts (10-30s depending on event)
- **Project auto-detection**: determines project from git remote, `package.json`, `composer.json`, `pyproject.toml`, or `.ddev/config.yaml`
- **Haiku curation**: all retrieved memories pass through Claude Haiku to filter noise before injection
- **Graceful degradation**: if the Graphiti stack is down, hooks exit cleanly and Claude Code continues normally

## Configuration

### `config.json`

Generated by the installer from `.env` values. Located at `~/.claude/dynamo/config.json`.

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

| Key | Description |
|-----|-------------|
| `enabled` | Global toggle. `false` disables all hooks and memory commands. |
| `graphiti.mcp_url` | Graphiti MCP server endpoint for JSON-RPC calls |
| `graphiti.health_url` | Health check endpoint |
| `curation.model` | LLM model for curation and summarization (via OpenRouter) |
| `curation.api_url` | OpenRouter API endpoint |
| `timeouts.*` | Per-operation timeout in milliseconds |
| `logging.max_size_bytes` | Log rotation threshold (1MB default) |
| `logging.file` | Error log filename (relative to `~/.claude/dynamo/`) |

### Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `OPENROUTER_API_KEY` | `~/.claude/graphiti/.env` | API key for LLM curation and embeddings via OpenRouter |
| `DYNAMO_DEV` | Process env | Set to `1` to bypass global toggle (dev mode) |
| `DYNAMO_CONFIG_PATH` | Process env | Override config.json path (test isolation) |

### `settings-hooks.json`

Hook definitions merged into `~/.claude/settings.json` by the installer. Defines 5 hook events, each invoking `dynamo-hooks.cjs` with appropriate matchers and timeouts:

- `SessionStart` (startup|resume, compact) -- 30s timeout
- `UserPromptSubmit` (all prompts) -- 15s timeout
- `PostToolUse` (Write|Edit|MultiEdit) -- 10s timeout
- `PreCompact` (all) -- 30s timeout
- `Stop` (all) -- 30s timeout

Also sets `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS=10000` environment variable.

## Scoping

All data in the knowledge graph is organized by scope (Graphiti `group_id`).

| Scope | Format | Contents | Example |
|-------|--------|----------|---------|
| Global | `global` | User preferences, workflow patterns, coding style | `dynamo search "tools" --scope global` |
| Project | `project-<name>` | Architecture, decisions, conventions | `dynamo remember "Uses JWT" --scope project-myapp` |
| Session | `session-<timestamp>` | Conversation summaries | `dynamo recall --scope session-1710000000` |
| Task | `task-<descriptor>` | Task requirements, progress | `dynamo remember "Migrate auth" --scope task-auth-refactor` |

**Important:** Scope values use **dash** separators (not colons). Graphiti rejects colons in `group_id`.

### Auto-Detection

Project names are auto-detected from the working directory in this priority order:

1. Git remote origin URL (repo name)
2. `package.json` `name` field
3. `composer.json` `name` field (last segment)
4. `pyproject.toml` `name` field
5. `.ddev/config.yaml` `name` field
6. Fallback: directory name

Hooks use the detected project name to build `project-<name>` scopes automatically.

## Troubleshooting

### "Dynamo is disabled" error

Dynamo is globally toggled off.

```bash
# Re-enable
dynamo toggle on

# Or bypass for development
DYNAMO_DEV=1 node ~/.claude/dynamo/dynamo.cjs search "test"
```

### Stack not starting

```bash
# Run health check for detailed diagnostics
dynamo health-check --pretty

# Check Docker is running
docker ps

# Check container status
docker compose -f ~/.claude/graphiti/docker-compose.yml ps

# Check health endpoint directly
curl http://localhost:8100/health
```

### Stale session IDs

If hooks return "invalid session" errors, restart Claude Code. The MCP client caches session IDs and does not refresh them after server restarts.

### Hook errors

Check the error log:

```bash
cat ~/.claude/dynamo/hook-errors.log
```

Logs rotate at 1MB (old log preserved as `hook-errors.log.old`).

### Health check failures

Run the 13-stage deep diagnostic:

```bash
dynamo diagnose --pretty --verbose
```

This covers Docker, Neo4j, Graphiti API, MCP connectivity, environment variables, configuration, toggle state, and more.

### Memory pipeline issues

Run the full pipeline verification:

```bash
dynamo verify-memory --pretty
```

Tests write, read, scope isolation, and session operations end-to-end.

## Development Guide

### Workflow

1. Edit source files in the repo (`subsystems/`, `cc/`, `lib/`, `dynamo.cjs`)
2. Sync to live deployment: `dynamo sync repo-to-live`
3. Test: `dynamo test`
4. Restart Claude Code to pick up hook changes

### Sync Pairs

The sync system maps 8 repo directories to deployed locations (defined in `lib/layout.cjs`):

| Repo Directory | Deployed Location | Label |
|---------------|-------------------|-------|
| `./` (root files only) | `~/.claude/dynamo/` | root |
| `dynamo/` | `~/.claude/dynamo/dynamo/` | dynamo-meta |
| `subsystems/switchboard/` | `~/.claude/dynamo/subsystems/switchboard/` | switchboard |
| `subsystems/assay/` | `~/.claude/dynamo/subsystems/assay/` | assay |
| `subsystems/ledger/` | `~/.claude/dynamo/subsystems/ledger/` | ledger |
| `subsystems/terminus/` | `~/.claude/dynamo/subsystems/terminus/` | terminus |
| `cc/` | `~/.claude/dynamo/cc/` | cc |
| `lib/` | `~/.claude/dynamo/lib/` | lib |

```bash
# Preview changes before syncing
dynamo sync repo-to-live --dry-run

# Sync repo to live
dynamo sync repo-to-live

# Sync live changes back to repo
dynamo sync live-to-repo

# Check sync status
dynamo sync status --pretty
```

### Dev Mode Toggle

When Dynamo is globally disabled (`dynamo toggle off`), you can still run commands using the dev mode override:

```bash
DYNAMO_DEV=1 node ~/.claude/dynamo/dynamo.cjs search "test query"
```

This is useful for development and testing without affecting other Claude Code sessions.

### Toggle Mechanism

```
enabled = config.json.enabled !== false     (default: true)
devMode = process.env.DYNAMO_DEV === '1'    (override per-process)
effective = enabled || devMode              (dev mode bypasses global off)
```

### Running Tests

```bash
# Via CLI
dynamo test

# Via node directly
node --test dynamo/tests/*.test.cjs dynamo/tests/**/*.test.cjs
```

All tests use `tmpdir` for isolation -- no shared state, no side effects on the live deployment.

## Design Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Research only, no install | User wants vetted list first, will install later | Good -- clean separation |
| Global scope only | Tools should be universally available, not per-project | Good |
| Full lifecycle self-management | User never wants to manually edit config files | Good |
| Lean final list (5-8) | Quality over quantity | Good -- 5+2 recommendations |
| Diagnostic-first milestone (v1.1) | Fix memory before adding features | Good -- root causes found and fixed |
| Global scope + [project] content prefix | Graphiti v1.21.0 rejects colon in group_id | Good -- workaround documented |
| Two-phase auto-naming via Haiku | Cost-efficient (~$0.001/call) with graceful degradation | Good |
| Foreground hook execution with 5s timeout | Error capture requires foreground; fast timeout prevents blocking | Good |
| Rebrand to Dynamo/Ledger/Switchboard | Separate memory from management for independent evolution | Good -- clean architecture |
| CJS rewrite over Python/Bash | GSD-pattern CJS is proven, modular, testable; unifies tech stack | Good -- 515 tests, feature parity |
| Feature parity before new features | Stable foundation first, new capabilities in v1.3+ | Good -- foundation solid |
| Content-based sync (Buffer.compare) | More accurate than mtime-only conflict detection | Good |
| Options-based test isolation | Stage/module functions accept overrides for test isolation | Good -- all tests use tmpdir |
| Settings.json backup before modification | Atomic write (tmp+rename) with .bak for rollback | Good -- safe cutover |
| Graphiti MCP deregistered; CLI wraps tools | Toggle blackout requires all memory access through Dynamo CLI | Good -- complete blackout when disabled |
| Repo renamed to "dynamo" on GitHub | Reflect Dynamo identity in repo name | Done |
| Branch renamed from main to master | Team convention preference | Done |
| Insert v1.2.1 before v1.3 | Close stabilization gaps before building intelligence layer | Done -- 10 STAB requirements scoped |

For detailed decision context, alternatives considered, constraints, and downstream implications, see `.planning/PROJECT.md`.

## License

MIT

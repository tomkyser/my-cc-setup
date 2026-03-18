# Phase 12: Structural Refactor - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Reorganize the repo into three root-level component directories (`dynamo/`, `ledger/`, `switchboard/`), enforce import boundaries between components, add global on/off and dev mode toggles, and wrap Graphiti MCP access through Dynamo CLI commands for full toggle control. All existing tests must pass against the restructured codebase.

</domain>

<decisions>
## Implementation Decisions

### Directory layout
- Restructure applies to the **repo only** — deployed path remains `~/.claude/dynamo/` with the new internal layout (ledger/, switchboard/ as subdirs, no lib/ wrapper)
- Repo gets three root-level dirs: `dynamo/`, `ledger/`, `switchboard/`
- Shared substrate (`core.cjs`) lives under `dynamo/` — Dynamo owns shared infra as the orchestrator
- CLI entry point (`dynamo.cjs`), config, hooks dispatcher, prompts, and tests all under `dynamo/`
- `graphiti/` moves under `ledger/graphiti/` — Docker infra only (docker-compose.yml, .env, config.yaml, start/stop scripts). CJS code that talks to Graphiti stays directly under `ledger/`
- Tests centralized under `dynamo/tests/` with `ledger/` and `switchboard/` subdirs for organization

### Import boundaries
- Convention + automated test enforcement: `boundary.test.cjs` scans all require() statements and fails if Ledger imports Switchboard or vice versa
- **Allowed:** Dynamo imports from all three (it's the orchestrator). Ledger and Switchboard import from `dynamo/core.cjs` (shared substrate)
- **Blocked:** Ledger ↔ Switchboard cross-imports
- Hook dispatcher stays at `dynamo/hooks/dynamo-hooks.cjs`, routes to `ledger/hooks/` modules

### Toggle mechanism
- **Global on/off** via `config.json` field `"enabled": true/false`
- CLI commands: `dynamo toggle off`, `dynamo toggle on`, `dynamo status`
- Hook dispatcher checks `enabled` first — exits immediately if false
- **Dev mode override** via `DYNAMO_DEV=1` environment variable in current shell
- When global is OFF but `DYNAMO_DEV=1`, hooks still fire for that process tree
- Toggle check: `if (!cfg.enabled && !process.env.DYNAMO_DEV) process.exit(0);`

### Toggle scope — full blackout
- Toggle OFF disables **both hooks AND MCP/memory operations** — full blackout
- Achieved by wrapping all Graphiti MCP access through Dynamo CLI commands
- **Deregister Graphiti as direct MCP server** from `~/.claude.json`
- Claude uses Dynamo CLI for all memory ops: `dynamo search`, `dynamo remember`, `dynamo forget`, `dynamo recall`
- CLI commands go through Ledger → mcp-client.cjs → HTTP → Graphiti (same code path as hooks)
- Toggle gate in shared code applies to ALL paths — hooks and CLI commands alike
- Docker service (`localhost:8100/mcp`) stays running — it's infrastructure that hooks and CLI both use
- **Feature parity is mandatory** — all 9 current MCP tools must have CLI equivalents:
  1. `add_memory` → `dynamo remember`
  2. `search_memory_facts` → `dynamo search --facts`
  3. `search_nodes` → `dynamo search --nodes`
  4. `get_episodes` → `dynamo recall`
  5. `get_entity_edge` → `dynamo edge <uuid>`
  6. `delete_episode` → `dynamo forget <uuid>`
  7. `delete_entity_edge` → `dynamo forget --edge <uuid>`
  8. `clear_graph` → `dynamo clear` (destructive, require confirmation)
  9. `get_status` → `dynamo health-check` (already exists)

### CLI output format
- Human-readable text by default
- `--format json` for structured JSON output (programmatic processing)
- `--format raw` for full source content from graph (when deep context needed)
- Claude decides which format to request based on conversation context — CLAUDE.md instructs this
- Payload formatting must correctly handle Graphiti's expected input formats and response structures — the CLI wrapper owns serialization/deserialization

### Migration approach
- Move files first, then fix all require() paths, then run tests until green
- One atomic commit per logical group (structure move → path fixes → test pass)
- Update `install.cjs` and `sync.cjs` to deploy the new internal layout
- Run `dynamo install` to push new structure to `~/.claude/dynamo/`

### Migration safety
- Use toggle to safely migrate: toggle OFF → restructure → install → test → toggle ON
- Other Claude threads experience brief period (~2-5 min) with no memory injection — clean, no errors (hooks exit silently on toggle check)

### Claude's Discretion
- Exact CLI subcommand naming for memory operations (the mapping above is suggestive, not prescriptive)
- Internal module organization within each component
- How the boundary test discovers and scans files
- Exact JSON structure for CLI output format
- How `--format raw` determines what "full source" means per command

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 8 context (foundation decisions)
- `.planning/phases/08-foundation-and-branding/08-CONTEXT.md` — Zero npm deps, config as JSON, prompts as .md, module identity blocks, coexistence period decisions

### Phase 10 context (CLI and operations decisions)
- `.planning/phases/10-operations-and-cutover/10-CONTEXT.md` — CLI router pattern, installer behavior, sync scope, diagnostic stages, shared stages module

### Requirements
- `.planning/REQUIREMENTS.md` §STAB-08 — Directory structure refactor
- `.planning/REQUIREMENTS.md` §STAB-09 — Component scope refactor
- `.planning/REQUIREMENTS.md` §STAB-10 — Global on/off and dev mode toggles

### Current codebase structure
- `.planning/codebase/STRUCTURE.md` — Current directory layout and naming conventions (pre-v1.2 CJS, needs update)
- `.planning/codebase/ARCHITECTURE.md` — Layer descriptions, data flow, state management

### GSD CLI pattern (reference implementation)
- `~/.claude/get-shit-done/bin/gsd-tools.cjs` — CLI router pattern for dynamo.cjs

### Live deployed code
- `~/.claude/dynamo/dynamo.cjs` — Current CLI entry point
- `~/.claude/dynamo/lib/core.cjs` — Current shared substrate (will move to dynamo/core.cjs)
- `~/.claude/dynamo/hooks/dynamo-hooks.cjs` — Current hook dispatcher (toggle gate goes here)
- `~/.claude/dynamo/config.json` — Current config (will get `enabled` field)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/core.cjs` (→ `dynamo/core.cjs`): loadConfig, loadEnv, output(), error(), log, healthGuard, fetchWithTimeout — toggle check will be added here as a shared gate
- `lib/ledger/mcp-client.cjs`: MCPClient class + parseSSE — already handles Graphiti JSON-RPC, will be used by new CLI memory commands
- `lib/ledger/search.cjs`: Search functionality — wire into `dynamo search` CLI command
- `lib/ledger/episodes.cjs`: Episode add/get — wire into `dynamo remember`/`dynamo recall`
- `lib/switchboard/install.cjs`: Installer — update file copy logic for new directory structure
- `lib/switchboard/sync.cjs`: Sync — update path mappings for new structure

### Established Patterns
- GSD router pattern (switch/case on argv[2]) — extend for new memory subcommands
- core.cjs output() helper — use for all CLI output with format switching
- JSON config loading via loadConfig() — extend for `enabled` field and toggle commands
- Hook stdin/JSON/exit pattern — add toggle check at top of dispatcher

### Integration Points
- `~/.claude/settings.json` — Hook paths stay at `~/.claude/dynamo/hooks/` (unchanged)
- `~/.claude.json` — Remove `mcpServers.graphiti` MCP registration
- `~/.claude/CLAUDE.md` — Update memory instructions: replace MCP tool references with Dynamo CLI commands
- `~/.claude/dynamo/config.json` — Add `enabled` field for toggle
- `graphiti/docker-compose.yml` — Stays running, moves to `ledger/graphiti/` in repo

</code_context>

<specifics>
## Specific Ideas

- The toggle-off → migrate → toggle-on pattern is the first real use of the toggle system — it proves the feature by using it during its own deployment
- CLI-wrapped MCP means CLAUDE.md becomes the single source of truth for how Claude interacts with memory — cleaner than split MCP + CLAUDE.md instructions
- The `--format` param (json/raw/human-readable) lets Claude choose output depth based on conversation needs — matches the "Claude decides" philosophy from core value

</specifics>

<deferred>
## Deferred Ideas

- **Dynamo as native MCP server** — Register Dynamo itself as a stdio-based MCP server wrapping Graphiti. Would restore native tool call UX while keeping toggle control. Significant work — consider for v1.3+.
- **Per-component test runners** — Each component could have its own test entry point. Currently centralized under dynamo/tests/ which is sufficient.

</deferred>

---

*Phase: 12-structural-refactor*
*Context gathered: 2026-03-18*

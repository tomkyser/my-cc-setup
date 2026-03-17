# Phase 9: Hook Migration - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Port all 5 Claude Code hook events (SessionStart, UserPromptSubmit, PostToolUse, PreCompact, Stop) from Python/Bash to CJS, plus the Haiku curation pipeline, session management commands (list, view, label, backfill, index), two-phase session auto-naming, and sessions.json compatibility. Phase 9 switches settings.json to point to CJS hooks after parity verification. Phase 10 handles remaining cutover (installer, CLI, sync, legacy rename).

</domain>

<decisions>
## Implementation Decisions

### Dispatcher architecture
- Single entry point: `dynamo-hooks.cjs` registered in settings.json for all 5 hook events
- Dispatcher parses stdin JSON, builds a context object (session_id, scope, project, event_type), passes to handler function
- Separate handler files in `lib/ledger/hooks/` (e.g., `session-start.cjs`, `prompt-augment.cjs`, `capture-change.cjs`, `preserve-knowledge.cjs`, `session-summary.cjs`)
- Handlers are functions that receive the context object — dispatcher owns stdin parsing and routing

### Curation fallback
- OpenRouter is a hard requirement for curation — no alternative API fallback chain
- Reworking the curation API strategy is out of scope for v1.2
- When OpenRouter is unavailable or unconfigured: return truncated raw results with `[uncurated]` marker
- Hook exits 0 (graceful degradation) — Claude still gets some memory context, just unfiltered

### Hook switchover strategy
- Build all CJS handlers, test thoroughly, then swap settings.json in one commit (all-at-once switch)
- Verification before switch: automated integration tests (pipe test JSON through dynamo-hooks.cjs for each event) PLUS manual smoke test session with full lifecycle
- Phase 9 updates settings.json directly (matches phase goal: "all 5 hook events handled by CJS dispatcher")
- Before switching: copy settings.json to settings.json.bak for rollback
- Old Python/Bash hooks remain on disk — rollback is restoring settings.json.bak

### Stop hook priorities
- Priority order when timeout budget runs short: 1) Session summary + Graphiti write, 2) Auto-naming via Haiku, 3) sessions.json update
- Two-phase auto-naming runs inside the Stop hook (atomic — session ends with a name), matching current Python behavior
- Total timeout budget: start at 30s, measure actual timings, adjust based on empirical data

### Claude's Discretion
- Timeout strategy (budget-based with AbortSignal vs fixed per-step) — pick based on measurement
- Exact handler file naming within lib/ledger/hooks/
- Integration test script design
- How session management commands (list, view, label, backfill, index) are structured (subcommands of dynamo CLI or standalone)
- Internal error logging format within handlers

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Python/Bash system (port source)
- `~/.claude/graphiti/graphiti-helper.py` — MCP client, search, episodes, curation, session management (944 LOC) — primary port source
- `~/.claude/graphiti/hooks/session-start.sh` — SessionStart handler (port source)
- `~/.claude/graphiti/hooks/prompt-augment.sh` — UserPromptSubmit handler (port source)
- `~/.claude/graphiti/hooks/capture-change.sh` — PostToolUse handler (port source)
- `~/.claude/graphiti/hooks/preserve-knowledge.sh` — PreCompact handler (port source)
- `~/.claude/graphiti/hooks/session-summary.sh` — Stop handler (port source)
- `~/.claude/graphiti/hooks/health-check.sh` — Health check (reference, not directly ported in Phase 9)
- `~/.claude/graphiti/curation/prompts.yaml` — Curation prompt templates (already converted to .md in Phase 8)

### Phase 8 foundation (CJS substrate)
- `~/.claude/dynamo/lib/core.cjs` — Shared substrate: config loading, .env parsing, project detection, logging, health guard, fetchWithTimeout
- `~/.claude/dynamo/lib/ledger/scope.cjs` — Scope constants and validation
- `~/.claude/dynamo/lib/ledger/mcp-client.cjs` — MCPClient class + parseSSE for Graphiti JSON-RPC
- `~/.claude/dynamo/config.json` — Dynamo configuration
- `~/.claude/dynamo/prompts/` — 5 prompt .md files (curation, session-summary, prompt-context, precompact, session-name)

### CJS hook pattern (reference implementation)
- `~/.claude/hooks/gsd-context-monitor.js` — Proven CJS hook: stdin buffering, 3s timeout guard, JSON parse, process.exit conventions
- `~/.claude/get-shit-done/bin/gsd-tools.cjs` — CLI router pattern, subcommand dispatch

### Session data
- `~/.claude/graphiti/sessions.json` — Session index format (must read/write compatible)
- `~/.claude/graphiti/.env` — Environment variables (OPENROUTER_API_KEY, GRAPHITI_MCP_URL, etc.)

### Settings
- `~/.claude/settings.json` — Hook registrations (will be modified in Phase 9)
- `claude-config/settings-hooks.json` — Current hook definitions template

### Research outputs
- `.planning/research/ARCHITECTURE.md` — Directory structure, module boundaries
- `.planning/research/PITFALLS.md` — 12 regression risks with prevention strategies

### V1.1 regression context
- `.planning/milestones/v1.1-phases/04-diagnostics/04-DIAGNOSTIC-REPORT.md` — DIAG-01, DIAG-02 root causes
- `~/.claude/dynamo/tests/regression.test.cjs` — Phase 8 regression tests (tests 10-12 define interface contracts for Phase 9: stop hook, two-phase naming, user label preservation)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `core.cjs` (Phase 8): loadConfig, loadEnv, detectProject, formatOutput, log, healthGuard, fetchWithTimeout — all directly usable by hook handlers
- `scope.cjs` (Phase 8): resolveScope, validateGroupId, SCOPES — ready for scope resolution in dispatcher context building
- `mcp-client.cjs` (Phase 8): MCPClient.callTool, parseSSE — ready for Graphiti communication from handlers
- `gsd-context-monitor.js`: Proven stdin buffering pattern with 3s timeout guard — direct model for dynamo-hooks.cjs dispatcher
- `prompts/*.md` (Phase 8): Already converted curation and session prompts from YAML to .md

### Established Patterns
- CJS hook I/O: JSON on stdin, JSON/text on stdout, exit code 0 (success) or 2 (block)
- GSD router pattern: single entry point parses subcommand, routes to handler function
- Graceful degradation: hooks exit 0 even on failure, log errors, never crash Claude Code
- Background execution: current Bash hooks use `&` for non-blocking operations (capture-change.sh, session-summary.sh)

### Integration Points
- `~/.claude/settings.json` — Hook registrations (5 events to update)
- `~/.claude/graphiti/sessions.json` — Session index (read existing format, write compatible)
- `~/.claude/graphiti/.env` — Environment variables for Graphiti URL, API keys, OpenRouter
- Graphiti MCP server at `http://localhost:8100/mcp` — All memory operations via JSON-RPC

</code_context>

<specifics>
## Specific Ideas

- Dispatcher context object should include everything a handler needs so handlers never parse stdin themselves
- Settings.json backup (settings.json.bak) before switching is a hard requirement — not optional
- Regression tests 10-12 from Phase 8 define interface contracts that Phase 9 handlers must satisfy (stop hook completion, two-phase naming, user label preservation)
- STATE.md flags: Stop hook timeout needs empirical measurement, Haiku model ID stability to confirm

</specifics>

<deferred>
## Deferred Ideas

- Alternative curation API providers (direct Anthropic API, local models) — deferred beyond v1.2, OpenRouter is the sole path for now
- In-conversation curation via Claude Code subagents — architectural change, out of scope

</deferred>

---

*Phase: 09-hook-migration*
*Context gathered: 2026-03-17*

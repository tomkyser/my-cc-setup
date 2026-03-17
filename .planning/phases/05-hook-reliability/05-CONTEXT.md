# Phase 5: Hook Reliability - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix hooks so data persists to Graphiti or failures surface visibly. Three write hooks (capture-change.sh, session-summary.sh, preserve-knowledge.sh) currently use a fire-and-forget pattern that hides all errors. The server-level GRAPHITI_GROUP_ID override prevents project-scoped storage. Both issues are resolved in this phase.

</domain>

<decisions>
## Implementation Decisions

### group_id fix approach
- Remove `GRAPHITI_GROUP_ID` line from `docker-compose.yml` entirely (not set to empty — fully remove)
- Rebuild container inline during execution: stop, apply fix, rebuild, start, verify with health-check.py/diagnose.py
- If removing the env var doesn't fix project scoping (server still overrides to global), fall back to single global scope with content prefixing — do not spend time investigating newer image versions
- Existing data: migrate Frostgale world-building context from global scope to `project:frostgale` (or whatever the correct project name is). Analyze global-scope episodes for Frostgale-related content and re-scope them. Other misrouted data can stay in global.

### Backgrounding strategy
- Switch write hooks from fire-and-forget (`2>/dev/null &`) to foreground execution
- Hooks already have timeouts in settings.json (10s for capture-change, 30s for session-summary and preserve-knowledge) — these cap worst-case latency
- Add a 5s internal timeout inside graphiti-helper.py for MCP calls — fail fast with clear error instead of hanging until hook-level timeout kills the process
- Claude's discretion on whether capture-change.sh (high frequency, fires on every Write/Edit/MultiEdit) stays backgrounded with logging vs goes foreground — decide based on observed latency during testing

### Error visibility
- Remove `2>/dev/null` from all write hooks — let stderr flow through to Claude Code session
- Errors go to BOTH stderr (real-time visibility in session) AND a log file (`~/.claude/graphiti/hook-errors.log`) for post-mortem debugging
- Health check failures at hook startup: warn once per session with a one-liner like `[graphiti] Server unreachable — memory hooks disabled` to stderr. Do not warn on every subsequent hook call.
- Add `GRAPHITI_VERBOSE` env var: off by default (failures only), on for debugging (shows all writes with brief confirmation like `[graphiti] Stored: File Edit capture-change.sh`)
- Successful writes produce no output unless GRAPHITI_VERBOSE is set

### Claude's Discretion
- Log file rotation/retention policy for hook-errors.log
- Exact format of error and verbose messages
- Whether capture-change.sh uses foreground or background+logging (based on latency testing)
- Implementation details of the once-per-session warning for health check failures (flag file, env var, or other mechanism)
- Migration approach for Frostgale data (content analysis heuristics, which episodes qualify)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Hook scripts (files being modified)
- `~/.claude/graphiti/hooks/capture-change.sh` — PostToolUse write hook, fire-and-forget pattern at lines 31-34
- `~/.claude/graphiti/hooks/session-summary.sh` — Stop hook, two fire-and-forget writes at lines 31-40
- `~/.claude/graphiti/hooks/preserve-knowledge.sh` — PreCompact hook, fire-and-forget write at lines 24-27

### Infrastructure (files being modified)
- `~/.claude/graphiti/docker-compose.yml` — Line 37: `GRAPHITI_GROUP_ID=${GRAPHITI_GROUP_ID:-global}` (ROOT CAUSE — remove this line)
- `~/.claude/graphiti/graphiti-helper.py` — MCPClient class, `cmd_add_episode()` at lines 345-365 (add internal timeout, error handling improvements)

### Hook registration
- `~/.claude/settings.json` — Hook event registrations with timeouts (lines 183-269)

### Phase 4 diagnostics (evidence and tools)
- `~/.claude/graphiti/diagnose.py` — 10-stage diagnostic probe (reuse for verification after fix)
- `~/.claude/graphiti/health-check.py` — 6-stage health check with canary round-trip (reuse for verification)
- `.planning/phases/04-diagnostics/04-DIAGNOSTIC-REPORT.md` — Full root cause evidence for DIAG-01 and DIAG-02

### Phase 4 context (prior decisions)
- `.planning/phases/04-diagnostics/04-CONTEXT.md` — Diagnostic approach decisions, code observations

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `diagnose.py` — 10-stage probe can verify the group_id fix (Stage 8: MCP Read project scope should PASS after fix)
- `health-check.py` — Canary write/read round-trip verifies end-to-end pipeline
- `graphiti-helper.py` MCPClient class — Already has session management, SSE parsing, tool calling. Timeout needs to be added to httpx calls.
- `graphiti-helper.py` `health-check` command — Already tests HTTP connectivity. Used by all hooks for pre-flight check.

### Established Patterns
- All hooks use `$HELPER` variable pointing to venv Python + graphiti-helper.py
- All hooks read JSON from stdin via `INPUT=$(cat)` and extract fields with `jq`
- Project detection via `detect-project` command (git remote -> package.json -> composer.json -> pyproject.toml -> dir name)
- Health check at hook start: `if ! $HELPER health-check 2>/dev/null; then exit 0; fi`

### Integration Points
- Hook stderr flows to Claude Code session when not suppressed — removing `2>/dev/null` is the primary change
- `graphiti-helper.py` errors print to stderr via `print(..., file=sys.stderr)` — this already works, callers just suppress it
- Docker compose restart: `docker compose -f ~/.claude/graphiti/docker-compose.yml down && docker compose -f ~/.claude/graphiti/docker-compose.yml up -d`
- Neo4j data persists in Docker volumes (`neo4j_data`, `neo4j_logs`) — container rebuild does not lose data

### Critical Code Observations
- `graphiti-helper.py:64-87`: `MCPClient._initialize()` creates MCP session with no timeout. If server is slow/hung, this blocks indefinitely.
- `graphiti-helper.py:356-363`: `cmd_add_episode` error path already prints to stderr — just need to stop suppressing it
- `capture-change.sh:20`: Health check itself uses `2>/dev/null` — needs to change for the once-per-session warning
- All three write hooks have identical scope-detection logic (lines ~18-28) — DRY opportunity but not required

</code_context>

<specifics>
## Specific Ideas

- User specifically wants Frostgale world-building context recovered from global scope to project scope — this is the migration priority, not general re-scoping of all data
- "Warn once per session" for server-down means the first hook call that fails health check prints the warning, subsequent calls in the same session stay silent

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-hook-reliability*
*Context gathered: 2026-03-17*

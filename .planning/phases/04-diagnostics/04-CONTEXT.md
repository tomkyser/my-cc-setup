# Phase 4: Diagnostics - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Trace the exact failure point in the hook -> graphiti-helper.py -> Graphiti MCP -> Neo4j pipeline. Identify root causes for both silent write failures and missing project-scoped memories. Produce a reusable health check that verifies the full pipeline.

</domain>

<decisions>
## Implementation Decisions

### Diagnostic approach
- Systematic probes: build a diagnostic script that tests each pipeline stage independently
- Stage order: Docker/Neo4j -> Graphiti API -> MCP write -> MCP read -> hook execution
- Hook testing included: run hooks with stderr visible (remove `2>/dev/null`) to surface swallowed errors
- Both infrastructure probes AND hook-level tracing

### Root cause documentation
- Full evidence trail: include command output, error messages, trace logs for each finding
- Structure: stage, symptom, root cause, evidence, recommended fix
- Claude's discretion on output format (dedicated report file vs inline in plan artifacts)

### Health check scope
- Stage-by-stage report: Docker running? API reachable? Neo4j connected? Write works? Read works?
- PLUS canary write/read round-trip as final proof of end-to-end data flow
- Available as both CLI command (manual terminal use) and Claude Code command/skill
- Claude's discretion on canary cleanup (delete test data or leave as timestamp marker)

### Claude's Discretion
- Whether diagnostic script is a `graphiti-helper.py diagnose` subcommand or standalone script
- Root cause output file format and location (DIAGNOSTIC.md in phase dir recommended)
- Canary test data cleanup policy
- Exact stage-by-stage probe implementation details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Hook scripts (the system under diagnosis)
- `~/.claude/graphiti/hooks/session-start.sh` -- SessionStart hook, search-only (no writes)
- `~/.claude/graphiti/hooks/prompt-augment.sh` -- UserPromptSubmit hook, search-only (no writes)
- `~/.claude/graphiti/hooks/capture-change.sh` -- PostToolUse hook, writes via fire-and-forget `&` with `2>/dev/null`
- `~/.claude/graphiti/hooks/preserve-knowledge.sh` -- PreCompact hook, writes via fire-and-forget `&` with `2>/dev/null`
- `~/.claude/graphiti/hooks/session-summary.sh` -- Stop hook, writes two episodes via fire-and-forget `&` with `2>/dev/null`

### Infrastructure
- `~/.claude/graphiti/graphiti-helper.py` -- Python bridge between hooks and Graphiti MCP. MCPClient class, add-episode command, health-check command
- `~/.claude/graphiti/.env` -- API keys (Anthropic, OpenRouter), Neo4j credentials
- `~/.claude/graphiti/config.yaml` -- Graphiti server config: LLM provider, embedder, Neo4j connection, entity types
- `~/.claude/graphiti/docker-compose.yml` -- Docker stack definition (Graphiti + Neo4j)

### Hook registration
- `~/.claude/settings.json` -- Hook event registrations (SessionStart, UserPromptSubmit, PostToolUse, PreCompact, Stop)

### Prior research (v1.0 findings)
- `.planning/phases/02-research/memory/MEMO-03-HOOK-GAPS.md` -- Hook gap analysis identifying 9 gaps with severity ratings
- `.planning/phases/02-research/memory/MEMO-02-SESSIONS.md` -- Session management visibility research
- `.planning/phases/02-research/memory/MEMO-01-BROWSING.md` -- Memory browsing interface research

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `graphiti-helper.py` MCPClient class: Already implements MCP HTTP transport with session management, SSE parsing, tool calling. The diagnostic can reuse this for probing.
- `graphiti-helper.py health-check`: Tests HTTP connectivity to `localhost:8100/health`. Starting point for deeper health check.
- `graphiti-helper.py add-episode`: Calls `add_memory` MCP tool with group_id scoping. This is the exact write path that may be failing.
- `graphiti-helper.py search`: Calls `search_memory_facts` and `search_nodes`. Can verify reads after diagnostic writes.

### Established Patterns
- All hooks use `$HELPER` variable pointing to venv Python + graphiti-helper.py
- All hooks read JSON from stdin via `INPUT=$(cat)` and extract fields with `jq`
- Write hooks suppress stderr with `2>/dev/null` and background with `&` -- this is the primary error-hiding pattern
- Health check failures cause graceful exit (`exit 0`) -- hooks never report errors to CC
- Project detection via `detect-project` command (git remote -> package.json -> composer.json -> pyproject.toml -> dir name)

### Integration Points
- Hooks are registered in `~/.claude/settings.json` under `hooks.*` keys
- Graphiti MCP server at `http://localhost:8100/mcp` (streamable HTTP transport)
- Neo4j at `bolt://localhost:7687` (Docker internal) / `bolt://localhost:7688` (host)
- Neo4j Browser at `http://localhost:7475`

### Critical Code Observations
- `capture-change.sh:31-34`: Runs `add-episode` with `&` (background) and `2>/dev/null` (suppressed stderr). If add-episode fails, no one knows.
- `session-summary.sh:31-41`: TWO `add-episode` calls both with `&` and `2>/dev/null`. Same pattern.
- `preserve-knowledge.sh:25-27`: Same fire-and-forget pattern.
- `graphiti-helper.py:356-363`: `cmd_add_episode` prints errors to stderr -- but all callers suppress stderr.
- `graphiti-helper.py:64-87`: `_initialize()` creates MCP session. If session creation fails, all subsequent `call_tool` calls will fail.
- `.env:9-10`: Neo4j URI is `bolt://neo4j:7687` (Docker internal hostname). This is correct for server-to-server inside Docker, but `graphiti-helper.py` runs on the HOST and connects to MCP at `localhost:8100`, not directly to Neo4j.

</code_context>

<specifics>
## Specific Ideas

- The `2>/dev/null` + `&` pattern in write hooks is almost certainly the primary reason failures are invisible
- Project detection (`detect-project`) in iCloud Drive paths (like `com~apple~CloudDocs`) may produce unexpected project names, causing wrong scope
- The health check should be the same tool used in Phase 7 (VRFY-02) verification -- build it once, reuse it

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 04-diagnostics*
*Context gathered: 2026-03-16*

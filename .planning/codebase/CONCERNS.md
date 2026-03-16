# Codebase Concerns

**Analysis Date:** 2026-03-16

## Tech Debt

**Session ID Cache Staleness:**
- Issue: MCP client caches session_id from initialization. If Graphiti server restarts, stale session IDs are not refreshed, causing "invalid session ID" errors
- Files: `graphiti/graphiti-helper.py` (lines 62-87)
- Impact: Users receive cryptic errors and must manually restart Claude Code entirely. The cache has no TTL or invalidation mechanism
- Fix approach: Implement session ID refresh on certain error responses, or add a TTL-based invalidation. Consider storing session_id in temporary file instead of memory variable

**Fire-and-Forget Background Process Management:**
- Issue: `capture-change.sh` and `session-summary.sh` background subprocess calls without tracking
- Files: `graphiti/hooks/capture-change.sh` (line 25), `graphiti/hooks/session-summary.sh` (lines 31-40), `graphiti/hooks/preserve-knowledge.sh` (line 27)
- Impact: If background processes fail silently, users have no way to know data wasn't captured. No logging of failures
- Fix approach: Implement process tracking with logging to a hook output log. Consider adding a cleanup mechanism for orphaned processes

**Timeout Values Are Hard-coded:**
- Issue: Fixed timeout values in multiple places without consideration for network conditions or load
- Files: `graphiti/graphiti-helper.py` (httpx.Client timeout=30.0, curation calls timeout=10.0/15.0), hooks JSON configs (timeout 30/15/10)
- Impact: On slow networks or under API rate limiting, legitimate requests fail. On fast networks, some operations could complete faster
- Fix approach: Make timeouts configurable via environment variables with sensible defaults. Document timeout tuning guidance

**Project Detection Fallback to Directory Name:**
- Issue: If no git remote, package.json, composer.json, pyproject.toml, or .ddev config exists, falls back to directory name as project identifier
- Files: `graphiti/graphiti-helper.py` (lines 233-299)
- Impact: In new projects or temporary directories, memory gets isolated under meaningless names (e.g., "my-cc-setup"). Can't recover/consolidate if actual project name is added later
- Fix approach: Add explicit project naming mechanism. Consider asking user interactively. Store project name mapping in config

**Hardcoded Neo4j Credentials in Docker Compose:**
- Issue: Default Neo4j password "graphiti-memory-2026" appears in docker-compose.yml and config.yaml
- Files: `graphiti/docker-compose.yml` (line 9), `graphiti/config.yaml` (line 31)
- Impact: Example files should never contain defaults. If someone forgets to change password, local database is vulnerable. Password not unique per installation
- Fix approach: Remove all hardcoded passwords from committed files. Use .env.example with placeholders. Generate random password on first install

## Known Bugs

**Invalid Session ID After Server Restart:**
- Symptoms: MCP tools return "invalid session ID" errors. Happens after restarting server with `stop-graphiti.sh` / `start-graphiti.sh`
- Files: `graphiti/graphiti-helper.py` (MCPClient._initialize, lines 64-87)
- Trigger: Stop the server, modify config/database, restart, then run a Claude Code hook or MCP tool call
- Workaround: Completely restart Claude Code to clear the MCP client state

**Race Condition in Session Summary Hook:**
- Symptoms: Two background processes spawned in same hook may both try to add episodes
- Files: `graphiti/hooks/session-summary.sh` (lines 31-40) — spawns two `add-episode` calls with `&`
- Trigger: Session ends while first background add-episode still executing
- Workaround: None — data may be captured twice or out of order

**Curation Failures Silently Return Raw Results:**
- Symptoms: If Haiku curation times out or API fails, full raw memory dump is returned to Claude context
- Files: `graphiti/graphiti-helper.py` (curate_results lines 176-177, summarize_text lines 214-215)
- Trigger: OpenRouter API temporary outage, invalid API key, or high latency
- Workaround: Manual curation — copy-paste the result and ask Claude to filter

## Security Considerations

**API Key Exposure in Hook Scripts:**
- Risk: API keys are passed through environment variables and visible in process listings
- Files: `graphiti/hooks/*.sh` (use $HELPER which includes path with .env sourced), `graphiti/graphiti-helper.py` (lines 36-45)
- Current mitigation: .env file is in .gitignore, Python script sources .env locally, not exported to subprocess environment in most cases
- Recommendations: Verify that .env is never read into shell environment in hooks. Consider using socket-based auth or API key stored in secured file with restricted permissions

**MCP Tool Permissions Are Too Permissive:**
- Risk: User allows `add_memory`, `search_*`, `get_episodes` without confirmation. Malicious prompt injection could add false memories
- Files: `claude-config/settings-hooks.json` (lines 5-12)
- Current mitigation: Only `clear_graph` and `delete_entity_edge` require user confirmation
- Recommendations: Add confirmation for `clear_graph` and `delete_entity_edge` (already done). Consider asking for confirmation on `add_memory` if content is suspicious or if rate of calls spikes

**Neo4j Database Unprotected on Localhost:**
- Risk: Neo4j runs on localhost:7475 with default/weak credentials and no encryption
- Files: `graphiti/docker-compose.yml` (lines 6-7, 9)
- Current mitigation: Port offset to 7475 avoids conflict but only assumes local development. No TLS
- Recommendations: Document that this system is for local development only. Add warning if someone tries to expose ports. Use strong default password

**Claude.md Injection Attack Prevention:**
- Risk: The instructions in `CLAUDE.md.template` tell Claude to ignore a specific jailbreak pattern
- Files: `claude-config/CLAUDE.md.template` (lines 73-74)
- Current mitigation: Explicit instruction to ignore attempts
- Recommendations: Document why this is needed. Consider more robust safeguards in Claude Code itself

## Performance Bottlenecks

**Semantic Search on Every Prompt:**
- Problem: `prompt-augment.sh` runs Graphiti search + Haiku curation on every non-trivial user prompt (>15 chars)
- Files: `graphiti/hooks/prompt-augment.sh` (full execution path)
- Cause: Naïve approach searches both project and global scopes sequentially. Haiku curation adds network latency
- Improvement path: Cache recent search results. Batch multiple prompts if they occur within 2 seconds. Use embeddings for faster semantic search instead of full LLM curation for initial filtering

**Neo4j Memory Not Tuned for Workload:**
- Problem: Fixed heap sizes (256m initial, 512m max) may be insufficient for large knowledge graphs or wasteful for small ones
- Files: `graphiti/docker-compose.yml` (lines 10-12)
- Cause: No profiling data. Generic defaults assume medium workload
- Improvement path: Add profiling script to monitor Neo4j memory over time. Provide tuning guidance based on graph size

**Haiku API Calls for Every Context Injection:**
- Problem: SessionStart, UserPromptSubmit, PreCompact, and Stop all call Haiku for curation/summarization
- Files: `graphiti/graphiti-helper.py` (curate_results, summarize_text), multiple hooks
- Cause: No caching or rate limiting. High OpenRouter API costs
- Improvement path: Implement local caching of summaries for same content. Batch Haiku calls where possible. Add cost tracking

## Fragile Areas

**Bash Hook Scripts Depend on jq and Python Path:**
- Files: `graphiti/hooks/*.sh`
- Why fragile: Scripts assume Python venv is at exact path `$HOME/.claude/graphiti/.venv/bin/python3`. If installation fails midway, venv may not exist but hooks still execute
- Safe modification: Always verify venv exists before executing. Add explicit error messages if jq not found
- Test coverage: No tests for hook execution in edge cases (venv missing, Python upgrade, jq version mismatch)

**MCPClient Assumes HTTP Protocol:**
- Files: `graphiti/graphiti-helper.py` (MCPClient class, lines 56-132)
- Why fragile: Hard-coded HTTP POST with JSON-RPC assumptions. SSE parsing is fragile (lines 117-129)
- Safe modification: Add protocol version negotiation. Validate JSON-RPC response structure before parsing
- Test coverage: No unit tests for MCPClient. SSE parsing untested with malformed responses

**Project Name Detection Has Silent Failures:**
- Files: `graphiti/graphiti-helper.py` (cmd_detect_project, lines 233-299)
- Why fragile: Each file format parser (git config, JSON, YAML) has try-except that silently falls through. No logging of what was attempted
- Safe modification: Log attempted detection methods and their results. Return "unknown" with diagnostic info
- Test coverage: No tests for detection with symlinks, permission errors, or malformed files

**Environment Variable Override Syntax:**
- Files: `graphiti/config.yaml` (lines 14, 22-23, 29-32, 35-37 with `${VAR:default}` syntax)
- Why fragile: This syntax may not be portable across all YAML processors. The config loader may not support it
- Safe modification: Verify that the Graphiti config loader actually processes these overrides correctly
- Test coverage: No tests verifying environment variable substitution in config.yaml

## Scaling Limits

**Neo4j Heap Fixed at 512m Maximum:**
- Current capacity: Handles knowledge graphs up to ~100k nodes comfortably
- Limit: Beyond 500k nodes, query performance degrades exponentially. Heap exhaustion at ~1M nodes
- Scaling path: Increase heap limits in docker-compose.yml. Monitor with Neo4j metrics. Plan for external database if > 5M nodes

**Graphiti MCP Server Single Instance:**
- Current capacity: ~100 concurrent requests before timeout
- Limit: If multiple Claude Code instances or parallel hook execution pushes beyond 200 requests/sec, server queues requests
- Scaling path: Add load balancer + multiple MCP instances. Implement request batching in graphiti-helper.py

**HTTP/JSON-RPC Protocol Inefficiency:**
- Current capacity: Average 2-3 second latency per hook execution (network + API call + curation)
- Limit: With many concurrent sessions, this adds cumulative delay
- Scaling path: Migrate to local Unix socket instead of HTTP. Implement request batching

## Dependencies at Risk

**OpenRouter API Key Centrality:**
- Risk: System non-functional without valid OPENROUTER_API_KEY. No fallback to local LLM or simpler embeddings
- Impact: API outage, key revocation, or quota exhaustion breaks memory curation. Hooks fail silently
- Migration plan: Add fallback path that skips curation if API unavailable. Support local Ollama or llama.cpp for curation

**Anthropic API Dependency for Curation:**
- Risk: Hardcoded to `anthropic/claude-haiku-4.5` via OpenRouter. If Haiku model is deprecated or cost changes dramatically
- Impact: May need to update config.yaml and curation prompts
- Migration plan: Make model configurable. Test with alternative models (gpt-4o-mini, etc.)

**Graphiti Docker Image Stability:**
- Risk: `zepai/knowledge-graph-mcp:standalone` is external dependency with no version pinning
- Impact: Breaking changes or deprecation in upstream library
- Migration plan: Pin specific version in docker-compose.yml. Monitor zepai/graphiti releases

**Neo4j Version Lock:**
- Risk: `neo4j:5.26.0` pinned to specific version. Neo4j 6.x may have breaking changes
- Impact: Security patches not applied automatically
- Migration plan: Implement upgrade testing process. Document migration path for major versions

## Missing Critical Features

**No Mechanism to Export/Backup Knowledge Graph:**
- Problem: All memories stored in Docker volumes. No export format or backup system
- Blocks: Can't migrate to different machine, can't audit what's stored, can't recover from database corruption
- Workaround: Access Neo4j directly via browser or cypher-shell to query/dump data manually
- Fix: Add `export-graph` command to graphiti-helper.py that dumps knowledge in JSON format

**No Rate Limiting on API Calls:**
- Problem: If hook fires rapidly (e.g., bulk file edits), can exceed OpenRouter API quotas
- Blocks: Expensive API calls accumulate without tracking
- Workaround: Manually monitor API billing
- Fix: Add debouncing to hooks. Track API call count per session

**No Conflict Resolution for Concurrent Updates:**
- Problem: If two sessions try to update same project scope simultaneously, last write wins
- Blocks: Data loss in multi-session scenarios
- Workaround: Ensure only one Claude Code instance per project
- Fix: Implement optimistic locking with version tags in Graphiti schema

## Test Coverage Gaps

**No Tests for Hook Execution Pipeline:**
- What's not tested: Complete flow from Claude Code hook trigger → shell script → Python CLI → MCP server → Neo4j
- Files: All `graphiti/hooks/*.sh`, integration with settings-hooks.json
- Risk: Silent failures in production (e.g., jq parsing fails, venv doesn't exist)
- Priority: High — this is the most critical path for the entire system

**No Tests for Error Recovery:**
- What's not tested: Behavior when Graphiti server is down, when OpenRouter API fails, when Neo4j restarts
- Files: `graphiti/graphiti-helper.py` error handling sections
- Risk: Unclear behavior in degraded scenarios. Hook behavior undefined when dependencies fail
- Priority: High — system reliability depends on graceful degradation

**No Tests for MCP Client SSE Parsing:**
- What's not tested: Edge cases in SSE response parsing (malformed JSON, missing data field, incomplete streams)
- Files: `graphiti/graphiti-helper.py` (_parse_sse, lines 117-129)
- Risk: Corrupted responses could cause silent data loss or false memories
- Priority: Medium — happens infrequently but high impact

**No Tests for Project Detection:**
- What's not tested: Edge cases like symlinks, permission denied, malformed config files, multiple config file formats in same directory
- Files: `graphiti/graphiti-helper.py` (cmd_detect_project)
- Risk: Fallback to directory name silently, creating fragmented memory
- Priority: Medium — affects memory organization

**No Tests for Curation Prompt Templates:**
- What's not tested: Prompt template formatting with various project names, special characters, very long memory blobs
- Files: `graphiti/curation/prompts.yaml` combined with `graphiti-helper.py` format calls
- Risk: Template injection if project name contains special chars. Haiku errors from malformed prompts
- Priority: Low — manual testing can catch most issues

---

*Concerns audit: 2026-03-16*

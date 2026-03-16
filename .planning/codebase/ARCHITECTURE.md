# Architecture

**Analysis Date:** 2026-03-16

## Pattern Overview

**Overall:** Event-driven knowledge graph system with hook-based passive memory and MCP-based active memory.

**Key Characteristics:**
- Hook-based event capture at Claude Code lifecycle points (SessionStart, UserPromptSubmit, PostToolUse, PreCompact, Stop)
- Temporal knowledge graph (Neo4j via Graphiti MCP) with semantic search and curation
- Passive memory injection via shell hooks + active memory access via MCP tools
- Multi-scoped memory organization (global, project, session, task)
- Haiku-powered context curation to prevent memory bloat
- Fire-and-forget async writes for non-blocking performance
- Graceful degradation when Graphiti server is offline

## Layers

**Hook Layer (Event Capture):**
- Purpose: Intercept Claude Code lifecycle events and trigger context operations
- Location: `graphiti/hooks/`
- Contains: Five shell scripts (session-start.sh, prompt-augment.sh, capture-change.sh, preserve-knowledge.sh, session-summary.sh)
- Depends on: graphiti-helper.py CLI, jq for JSON parsing
- Used by: Claude Code settings.json hooks configuration
- Pattern: Each hook reads JSON input from stdin, executes conditional logic, outputs context blocks or runs fire-and-forget async operations

**CLI Bridge Layer (Helper Commands):**
- Purpose: Unified command interface between hooks and Graphiti MCP server; includes Haiku curation
- Location: `graphiti/graphiti-helper.py`
- Contains: MCPClient HTTP transport, curation functions, command handlers (health-check, detect-project, search, add-episode, summarize-session)
- Depends on: httpx, pyyaml, anthropic libraries; OpenRouter for LLM/embeddings
- Used by: All hook scripts; can be invoked directly from Claude Code
- Pattern: Single-entry CLI tool with subcommands; handles MCP JSON-RPC protocol; batches curation through Haiku before output

**MCP Server Layer (Knowledge Graph API):**
- Purpose: Exposes Graphiti as MCP tools for Claude Code; manages Neo4j database and semantic search
- Location: Runs in Docker container (zepai/knowledge-graph-mcp:standalone)
- Contains: Graphiti MCP server binary + Neo4j database
- Depends on: Docker Compose orchestration; Neo4j 5.26.0; OpenRouter for embeddings
- Used by: Claude Code MCP client; graphiti-helper.py HTTP bridge
- Pattern: HTTP-based MCP transport; SSE response streaming; stateless session-per-request design

**Configuration Layer:**
- Purpose: Define LLM/embedding providers, entity types, database credentials, curation prompts
- Location: `graphiti/config.yaml`, `graphiti/curation/prompts.yaml`, `graphiti/docker-compose.yml`, `claude-config/CLAUDE.md.template`, `claude-config/settings-hooks.json`
- Contains: Provider endpoints, entity schemas, prompt templates, hook definitions, permissions
- Depends on: Environment variables (.env) for API keys and credentials
- Used by: Graphiti server initialization, Haiku curation pipeline, Claude Code settings
- Pattern: YAML-based configuration; template substitution from environment; separate concerns (server config vs curation vs hooks vs permissions)

**Installation & Deployment Layer:**
- Purpose: Deploy system to user's Claude Code environment and manage startup/shutdown
- Location: `install.sh`, `graphiti/start-graphiti.sh`, `graphiti/stop-graphiti.sh`
- Contains: Pre-flight checks, file copying, venv setup, MCP registration, Docker orchestration
- Depends on: docker-compose, python3, jq, claude CLI
- Used by: User during initial setup and ongoing operations
- Pattern: Idempotent bash installation; Docker Compose for stateful service management

## Data Flow

**SessionStart Flow (Startup/Resume):**

1. Claude Code fires SessionStart hook with source (startup|resume) and cwd
2. `session-start.sh` reads JSON input, health-checks Graphiti server
3. Detects project name via `graphiti-helper.py detect-project` (git remote → package.json → composer.json → pyproject.toml → .ddev/config.yaml → dir name)
4. Searches global scope for user preferences: `search --query "user preferences workflow coding style tools" --scope global`
5. Haiku curates results: `curate_session_context` prompt filters to 3-5 relevant items
6. Outputs section "## User Preferences"
7. If project detected, searches project scope for architecture/decisions: `search --scope "project:{PROJECT}"`
8. Outputs section "## Project: {PROJECT}"
9. Searches same scope for recent sessions: `search --query "session summary accomplished decisions outcome"`
10. Outputs section "## Recent Sessions"
11. All output wrapped in `[GRAPHITI MEMORY CONTEXT]` block

**UserPromptSubmit Flow (Per-Prompt Augmentation):**

1. Claude Code fires UserPromptSubmit hook on every user message
2. `prompt-augment.sh` extracts prompt text, skips if < 15 characters
3. Health-checks Graphiti server (fails silently if offline)
4. Detects project name
5. Primary search in project scope: `search --query "{PROMPT}" --scope "project:{PROJECT}" --limit 10`
6. Haiku curates using `curate_prompt_context` prompt against actual user prompt
7. Falls back to global scope search if project search returns nothing
8. If results found and not "No relevant memories found.", outputs `[RELEVANT MEMORY]` block
9. Otherwise exits silently

**PostToolUse Flow (Change Tracking):**

1. Claude Code fires PostToolUse hook after Write/Edit/MultiEdit tools
2. `capture-change.sh` extracts file path and tool name from JSON
3. Health-checks server (fails gracefully)
4. Detects project scope
5. **Async, backgrounded**: `add-episode --text "File {TOOL}: {FILE_PATH}" --scope "{SCOPE}"`
6. Never blocks file editing (fire-and-forget with `&`)

**PreCompact Flow (Knowledge Extraction):**

1. Claude Code fires PreCompact hook before context window compression
2. `preserve-knowledge.sh` reads conversation context from stdin
3. Health-checks server
4. **Synchronous**: `summarize-session` pipes stdin to Haiku via `curate_precompact` prompt
5. Haiku extracts critical facts (max 10 bullets) from conversation
6. Stores as episode: `add-episode --text "Pre-compaction knowledge extract: {SUMMARY}"`
7. Re-injects as `[PRESERVED CONTEXT]` block so Claude retains knowledge through compaction

**Stop Flow (Session Summarization):**

1. Claude Code fires Stop hook on session end
2. `session-summary.sh` reads session context from stdin
3. Guards against infinite loops (checks `stop_hook_active` flag)
4. Health-checks server
5. Detects project scope
6. **Async, backgrounded**:
   - Summarize session via Haiku: `summarize-session` → `summarize_session` prompt
   - Store in project scope: `add-episode --scope "project:{PROJECT}" --text "Session summary ({TIMESTAMP}): {SUMMARY}"`
   - Store in session scope: `add-episode --scope "session:{TIMESTAMP}" --text "Session summary: {SUMMARY}"`

## State Management

**Knowledge Graph State:**
- Stored in Neo4j 5.26.0 running in Docker
- Organized by `group_id`: global, project:{name}, session:{timestamp}, task:{descriptor}
- Nodes represent entities (Preference, ArchitecturalDecision, ProjectConvention, Requirement, Procedure, CodePattern, BugPattern, TechDebt, WorkflowPreference, Organization, Document, Topic)
- Edges represent relationships between entities
- Timestamps on all episodes and edges for temporal queries
- Embeddings stored for semantic search (1536-dimensional text-embedding-3-small)

**Runtime State:**
- MCP session ID cached in graphiti-helper.py MCPClient for HTTP request headers
- Project name cached per shell invocation (detected once at hook start)
- Async operations backgrounded — no polling or state synchronization needed
- Graceful degradation: all hooks exit cleanly if server offline; Claude Code continues without memory

**Claude Code Settings State:**
- Hook definitions merged into `~/.claude/settings.json` (persistent)
- MCP server registration in `~/.claude.json` (persistent)
- Memory system rules in `~/.claude/CLAUDE.md` (persistent)
- Installed files in `~/.claude/graphiti/` (persistent)
- .env with API keys (persistent, excluded from git)

## Key Abstractions

**MCPClient (HTTP Transport):**
- Purpose: Encapsulates JSON-RPC 2.0 communication with Graphiti MCP server over HTTP
- Location: `graphiti/graphiti-helper.py` lines 56-132
- Pattern: Lazy initialization of MCP session; SSE response parsing; exception handling with fallback to JSON
- Methods: `_initialize()` (establish session), `call_tool()` (invoke MCP tool), `_parse_sse()` (extract JSON-RPC result from SSE stream)

**Curation Pipeline:**
- Purpose: Filter broad Graphiti search results through Haiku to return only contextually relevant items
- Location: `graphiti/graphiti-helper.py` lines 135-180 (curate_results), 182-217 (summarize_text)
- Pattern: Call OpenRouter with Haiku model; template-driven prompts from `curation/prompts.yaml`; fallback to unfiltered results on API failure
- Entry points: `cmd_search()` when `--curate` flag passed; `cmd_summarize_session()` for all summaries
- Prevents context bloat by limiting injected memories to 3-5 most relevant bullets

**Project Detection:**
- Purpose: Auto-identify project name from working directory for scoped memory retrieval
- Location: `graphiti/graphiti-helper.py` lines 233-299 (cmd_detect_project)
- Pattern: Cascading checks (git remote → package.json → composer.json → pyproject.toml → .ddev/config.yaml → dirname)
- Result used for group_id scoping in all hooks; fallback to "unknown" if detection fails
- Enables cross-project memory isolation and per-project context injection

**Fire-and-Forget Pattern:**
- Purpose: Non-blocking async writes to knowledge graph during user interaction
- Location: Used in `capture-change.sh` and `session-summary.sh` (backgrounded with `&`)
- Pattern: `$HELPER add-episode ... 2>/dev/null &` — redirects errors to /dev/null and runs in background
- Ensures file edits and session summaries don't block Claude Code UI

**Graceful Degradation:**
- Purpose: System continues functioning if Graphiti server is offline
- Location: Every hook with `if ! $HELPER health-check 2>/dev/null; then exit 0; fi`
- Pattern: Health check on startup; silent exit on failure (critical hooks) or info message (SessionStart)
- Ensures Claude Code remains responsive even if memory system is unavailable

## Entry Points

**SessionStart Hook:**
- Location: `graphiti/hooks/session-start.sh`
- Triggers: Claude Code startup, resume, or context compaction
- Timeout: 30s
- Responsibilities: Inject global preferences, project context, recent session summaries into Claude's starting context via `[GRAPHITI MEMORY CONTEXT]` block

**UserPromptSubmit Hook:**
- Location: `graphiti/hooks/prompt-augment.sh`
- Triggers: Every user message (skips < 15 chars)
- Timeout: 15s
- Responsibilities: Search knowledge graph for facts matching current prompt; curate results; inject as `[RELEVANT MEMORY]` block

**PostToolUse Hook:**
- Location: `graphiti/hooks/capture-change.sh`
- Triggers: After Write/Edit/MultiEdit tool execution
- Timeout: 10s
- Responsibilities: Log file changes to knowledge graph asynchronously (fire-and-forget)

**PreCompact Hook:**
- Location: `graphiti/hooks/preserve-knowledge.sh`
- Triggers: Before Claude Code context compaction
- Timeout: 30s
- Responsibilities: Extract critical knowledge via Haiku; store in graph; re-inject as `[PRESERVED CONTEXT]`

**Stop Hook:**
- Location: `graphiti/hooks/session-summary.sh`
- Triggers: Session end
- Timeout: 30s
- Responsibilities: Summarize session via Haiku; store in project and session scopes asynchronously

**MCP Tools (Active/Manual):**
- Methods: mcp__graphiti__add_memory, mcp__graphiti__search_memory_facts, mcp__graphiti__search_nodes, mcp__graphiti__get_episodes, mcp__graphiti__get_entity_edge, mcp__graphiti__delete_episode, mcp__graphiti__delete_entity_edge, mcp__graphiti__clear_graph, mcp__graphiti__get_status
- Triggered: By Claude Code user request via "Remember this", "Search for...", "Delete...", etc.
- Responsibilities: Direct knowledge graph manipulation; complement passive hook system with explicit control

## Error Handling

**Strategy:** Fail gracefully with fallback to Claude Code without memory.

**Patterns:**

- **Health Check on Hook Startup:** Every hook calls `$HELPER health-check`. If server offline:
  - SessionStart: Outputs info message "[Graphiti: server offline — no memory context available]" and exits 0
  - Other hooks: Exit 0 silently; Claude Code continues normally

- **JSON Parsing:** Hook input parsed with `jq -r 'FIELD // "default"'`; defaults prevent errors on missing fields

- **MCP Request Failures:** MCPClient catches all exceptions in `call_tool()` and returns `{"error": "message"}` instead of throwing

- **Curation API Failures:** If OpenRouter unreachable, `curate_results()` and `summarize_text()` return unfiltered/truncated results instead of crashing

- **Project Detection Fallback:** If all detection methods fail, returns "unknown"; hooks fall back to global scope

- **Async Operation Failures:** Backgrounded operations (`capture-change.sh`, `session-summary.sh`) redirect stderr to /dev/null; failures don't affect user workflow

## Cross-Cutting Concerns

**Logging:**
- Approach: Hook stdout/stderr captured by Claude Code logs; helper.py prints to stderr on errors; server logs in Docker container
- Access: `docker logs graphiti-mcp --tail 50` for server logs; Claude Code IDE shows hook output

**Validation:**
- Approach: Input validation via jq defaults; project name validation against allowlist ("unknown" and "tom.kyser" skipped); prompt length check (skip < 15 chars)
- Prevents: Mis-scoped memories; overly broad search queries

**Authentication:**
- Approach: OpenRouter API key in .env; passed as Bearer token in HTTP headers; Neo4j credentials in docker-compose.yml
- Secrets: Never logged; excluded from git via .gitignore

**Rate Limiting:**
- Approach: Graphiti MCP server has `SEMAPHORE_LIMIT=8` (max 8 concurrent operations)
- Prevents: Resource exhaustion; graceful degradation under load

**Scope Isolation:**
- Approach: All queries scoped by `group_id` (global, project:{name}, session:{timestamp}, task:{descriptor})
- Prevents: Memory leakage between projects; context confusion across sessions; accidental global pollution

---

*Architecture analysis: 2026-03-16*

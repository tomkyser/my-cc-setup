# External Integrations

**Analysis Date:** 2026-03-16

## APIs & External Services

**LLM Provider:**
- OpenRouter (https://openrouter.ai/api/v1)
  - Service: Unified API gateway for multiple LLM and embedding providers
  - What it's used for:
    - Entity extraction and conversation understanding in Graphiti
    - Context curation via Claude Haiku (filtering search results before injection)
    - Session summarization for memory preservation
  - SDK/Client: `httpx` (Python HTTP client)
  - Auth: `OPENROUTER_API_KEY` environment variable
  - Model specs:
    - LLM: `anthropic/claude-haiku-4.5` (configured in `graphiti/config.yaml`)
    - Embeddings: `openai/text-embedding-3-small` (configured in `graphiti/config.yaml`)
  - Temperature: 1.0 (required for Anthropic models via OpenRouter)

**Curation Endpoint:**
- API: `https://openrouter.ai/api/v1/chat/completions` (OpenAI-compatible)
  - What it's used for: Pre-filtering knowledge graph search results through Haiku before context injection
  - Files: `graphiti/graphiti-helper.py` (functions: `curate_results()`, `summarize_text()`)
  - Response time: 10-15 second timeout per request
  - Max tokens: 500 per request

## Data Storage

**Databases:**

**Primary - Graph Database:**
- Neo4j 5.26.0
  - Provider: Self-hosted Docker container
  - Purpose: Stores temporal knowledge graph, entity relationships, episodes, and memories
  - Connection: Bolt protocol `bolt://neo4j:7687`
  - Auth: `NEO4J_USER` / `NEO4J_PASSWORD` environment variables
  - Client: Graphiti MCP server (manages Neo4j connections)
  - Credentials: Default user `neo4j`, password `graphiti-memory-2026` (override in `.env`)
  - Memory allocation:
    - Heap initial: 256m
    - Heap max: 512m
    - Page cache: 256m
  - Data persistence: Docker volumes `neo4j_data` and `neo4j_logs`
  - Configuration file: `graphiti/config.yaml` (database section)

**Episodic Storage:**
- Episodes stored in Neo4j as graph nodes
  - Types: SessionSummary, FileChange, PromptAugmentation, etc.
  - Group IDs organize data by scope: `global`, `project:{name}`, `session:{timestamp}`, `task:{descriptor}`
  - Source tracking: Each episode tagged with source (hook, user command, etc.)

**File Storage:**
- Local filesystem only
  - Configuration: `graphiti/config.yaml`, `graphiti/curation/prompts.yaml`
  - Install location: `~/.claude/graphiti/` (user home directory)
  - Hook scripts: `~/.claude/graphiti/hooks/`
  - No cloud storage integration

**Caching:**
- None explicitly configured
- Neo4j page cache: 256m

## Authentication & Identity

**Auth Provider:**
- Custom token-based (OpenRouter API key)
  - Implementation: Bearer token in HTTP Authorization header
  - Scope: All external API calls (LLM, embeddings) authenticated with single `OPENROUTER_API_KEY`
  - Files: `graphiti/graphiti-helper.py` (line 168, headers for OpenRouter calls)

**MCP Server Authentication:**
- Session-based HTTP protocol (MCP 2.0)
  - Implementation: Session ID via HTTP headers after initialization
  - Files: `graphiti/graphiti-helper.py` (class `MCPClient`, methods `_initialize()`, `call_tool()`)
  - Session tracking: `mcp-session-id` header maintained across requests

**Claude Code Integration:**
- MCP tool permissions defined in `claude-config/settings-hooks.json`
  - Allowed tools: `add_memory`, `search_nodes`, `search_memory_facts`, `get_episodes`, `delete_episode`, `get_entity_edge`, `get_status`
  - Approval-required tools: `clear_graph`, `delete_entity_edge`

## Monitoring & Observability

**Error Tracking:**
- None detected - errors logged to stderr but not tracked externally
- Graceful degradation: All hooks and scripts fail silently, Claude Code continues normally

**Logs:**
- Approach: File-based logging via Docker volumes
  - Neo4j logs: `/logs` volume mounted in Docker
  - Docker compose logs: Accessible via `docker logs` commands
  - Hook execution: Minimal logging, errors written to stderr (not captured to file)
  - Script output: Follows Unix convention (stdout for results, stderr for errors)

**Health Checks:**
- Neo4j container: HTTP health check on port 7474 (10s interval, 5s timeout, 5 retries, 30s start period)
- Graphiti MCP: Health endpoint at `http://localhost:8100/health`
- Helper health check: `graphiti-helper.py health-check` command
- Files: `graphiti/docker-compose.yml` (healthcheck section), `graphiti/graphiti-helper.py` (cmd_health_check)

## CI/CD & Deployment

**Hosting:**
- Local development environment (Docker)
- No cloud deployment configured
- Multi-node support: None (single-machine setup)

**CI Pipeline:**
- None detected
- Manual installation via `install.sh`
- No automated tests or deployment pipeline

**Docker Infrastructure:**
- Orchestration: Docker Compose
- File: `graphiti/docker-compose.yml`
- Services:
  - `neo4j` - Graph database
  - `graphiti-mcp` - Knowledge graph MCP server
- Network: Default bridge network (services communicate via service names)
- Restart policy: `unless-stopped`

**Installation & Setup:**
- Primary entry point: `./install.sh`
- Startup: `~/.claude/graphiti/start-graphiti.sh`
- Shutdown: `~/.claude/graphiti/stop-graphiti.sh`
- Health verification: Pre-startup checks and wait-for-healthy loops

## Environment Configuration

**Required env vars (from .env):**
- `OPENROUTER_API_KEY` - OpenRouter API authentication (critical)
- `OPENAI_API_KEY` - Alias for OPENROUTER_API_KEY in Docker Compose
- `NEO4J_USER` - Neo4j username (default: `neo4j`)
- `NEO4J_PASSWORD` - Neo4j password (default: `graphiti-memory-2026`)
- `NEO4J_DATABASE` - Neo4j database name (default: `neo4j`)
- `GRAPHITI_GROUP_ID` - Default group ID for episodes (default: `global`)
- `SEMAPHORE_LIMIT` - Connection limit for MCP server (default: 8)

**Optional env vars:**
- `GRAPHITI_MCP_URL` - MCP server endpoint (default: `http://localhost:8100/mcp`)
- `GRAPHITI_HEALTH_URL` - Health check endpoint (default: `http://localhost:8100/health`)
- `ANTHROPIC_API_KEY` - Fallback for Haiku curation (optional if using OpenRouter)

**Secrets location:**
- `.env` file in `graphiti/` directory (not committed to git)
- Template: `graphiti/.env.example` (contains placeholder values)
- Installation copies `.env` to `~/.claude/graphiti/.env`

**Configuration files:**
- `graphiti/config.yaml` - Graphiti server config (LLM, embeddings, database, entity types)
- `graphiti/curation/prompts.yaml` - Haiku curation prompt templates
- `claude-config/settings-hooks.json` - Claude Code hook definitions and MCP permissions
- `claude-config/CLAUDE.md.template` - System instructions for Claude

## Webhooks & Callbacks

**Incoming:**
- None detected - system is read-only from external services' perspective

**Outgoing:**
- Claude Code hooks (passive callbacks)
  - `SessionStart` - Fires on session startup/resume and context compaction
  - `UserPromptSubmit` - Fires on every user prompt (prompt augmentation)
  - `PostToolUse` - Fires after file writes (change tracking)
  - `PreCompact` - Fires before context window compression (knowledge preservation)
  - `Stop` - Fires on session end (session summarization)
  - Configuration: `claude-config/settings-hooks.json`
  - Implementation: Shell scripts in `graphiti/hooks/`

**Event Flow:**
1. Claude Code triggers hook → Executes shell script
2. Shell script calls `graphiti-helper.py` with arguments
3. Python script communicates with Graphiti MCP server via HTTP
4. Results passed back to Claude Code context via stdout

## Third-Party Service Dependencies

**OpenRouter:**
- Provider: Third-party API gateway
- Risk: API outages impact all LLM and embedding calls
- Fallback: None (system degrades gracefully but has no local fallback)
- Workaround: Can use local models if configuration updated, but requires Neo4j entity extraction to fail

**Neo4j:**
- Provider: Local Docker (self-hosted)
- Risk: Data loss if volumes not backed up
- Backup: Manual volume backups required (not automated)

**Docker:**
- Provider: Container runtime dependency
- Risk: Docker daemon downtime stops all services
- Mitigation: `restart: unless-stopped` policy

---

*Integration audit: 2026-03-16*

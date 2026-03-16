# Technology Stack

**Analysis Date:** 2026-03-16

## Languages

**Primary:**
- Python 3.11+ - Backend helper script and MCP client implementation (`graphiti/graphiti-helper.py`)
- Bash/Shell - Hook scripts and orchestration (`graphiti/hooks/*.sh`, `install.sh`, `start-graphiti.sh`, `stop-graphiti.sh`)
- YAML - Configuration files (`graphiti/config.yaml`, `graphiti/curation/prompts.yaml`)
- JSON - Data structures and configuration (`claude-config/settings-hooks.json`)

**Secondary:**
- Dockerfile/Docker Compose - Container orchestration (`graphiti/docker-compose.yml`)

## Runtime

**Environment:**
- Docker & Docker Compose - Container runtime for Neo4j and Graphiti MCP server
- Python 3.11+ - Runtime for `graphiti-helper.py` and MCP client

**Package Manager:**
- pip (Python) - Primary dependency management
- Python venv - Virtual environment isolation
- Lockfile: `requirements.txt` (present)

## Frameworks

**Core:**
- Neo4j 5.26.0 - Graph database backend (`graphiti/docker-compose.yml`)
- Graphiti (zepai/knowledge-graph-mcp) - Temporal knowledge graph MCP server (`graphiti/docker-compose.yml`, image: `zepai/knowledge-graph-mcp:standalone`)

**LLM/AI:**
- OpenRouter - Unified API provider for LLM and embeddings (`graphiti/config.yaml`)
  - Claude Haiku 4.5 - LLM for entity extraction and context curation
  - OpenAI text-embedding-3-small - Embeddings model via OpenRouter

**MCP (Model Context Protocol):**
- Graphiti MCP Server - Provides tools for knowledge graph interaction
- Claude Code MCP Client - Consumes Graphiti tools via HTTP

## Key Dependencies

**Critical:**
- `httpx` (>= 0.27) - HTTP client for MCP requests and API calls (`graphiti/requirements.txt`)
- `anthropic` (>= 0.40) - Anthropic SDK (listed but primarily used for Haiku curation)
- `pyyaml` (>= 6.0) - YAML parsing for config and prompts (`graphiti/requirements.txt`)

**Infrastructure:**
- `jq` - JSON parsing in shell scripts (`install.sh` requirement)
- `docker-compose` - Multi-container orchestration

## Configuration

**Environment:**
- `.env` file - Stores sensitive API keys (not committed)
  - `OPENROUTER_API_KEY` - Required for both LLM and embeddings
  - `NEO4J_USER` - Neo4j authentication (default: `neo4j`)
  - `NEO4J_PASSWORD` - Neo4j authentication (default: `graphiti-memory-2026`)
  - `ANTHROPIC_API_KEY` - Fallback (optional if using OpenRouter)
- `.env.example` - Template with required environment variables

**Build:**
- `install.sh` - Installation orchestrator that sets up Python venv, copies files, registers MCP server
- `start-graphiti.sh` - Starts Docker stack with health checks
- `stop-graphiti.sh` - Gracefully stops Docker containers

**Server Configuration:**
- `graphiti/config.yaml` - Graphiti server configuration
  - LLM provider: OpenAI-compatible (OpenRouter)
  - Embeddings provider: OpenAI-compatible (OpenRouter)
  - Database provider: Neo4j
  - 12 custom entity types (Preference, ArchitecturalDecision, ProjectConvention, etc.)
  - Temperature: 1.0 (Anthropic models via OpenRouter workaround)

**Hook Configuration:**
- `claude-config/settings-hooks.json` - Hook definitions and MCP tool permissions for Claude Code
- `graphiti/curation/prompts.yaml` - Prompt templates for Haiku curation pipeline

## Platform Requirements

**Development:**
- macOS or Linux (tested on macOS Darwin 25.x)
- Docker (for Neo4j and Graphiti MCP)
- Docker Compose
- Python 3.11+
- Bash/Shell (for hook scripts)
- `jq` (for JSON parsing in hooks)
- Claude Code v2.1+ (CLI)
- OpenRouter API key (unified LLM + embeddings provider)

**Production:**
- Docker (containerized Neo4j and Graphiti MCP)
- Port availability: `7475`, `7688` (Neo4j), `8100` (Graphiti MCP HTTP)
- Network access to OpenRouter API endpoint (`https://openrouter.ai/api/v1`)
- Installation target: `~/.claude/graphiti/` (user home directory)

## Deployment & Installation

**Installation Process:**
1. Clone repository to `~/my-cc-setup`
2. Create `.env` from `.env.example` with API keys
3. Run `./install.sh` which:
   - Validates prerequisites (docker, jq, python3)
   - Copies files to `~/.claude/graphiti/`
   - Creates Python venv in `~/.claude/graphiti/.venv`
   - Installs Python dependencies (`pip install -r requirements.txt`)
   - Registers Graphiti MCP server in `~/.claude.json`
4. Merge hook definitions into `~/.claude/settings.json` from `claude-config/settings-hooks.json`
5. Update `~/.claude/CLAUDE.md` with system instructions
6. Start stack: `~/.claude/graphiti/start-graphiti.sh`
7. Restart Claude Code

**Containers:**
- Neo4j 5.26.0: Stores graph data, persisted via Docker volumes
- Graphiti MCP: HTTP endpoint on port 8100, depends on Neo4j health
- Memory constraints: 256m heap init / 512m max / 256m pagecache

---

*Stack analysis: 2026-03-16*

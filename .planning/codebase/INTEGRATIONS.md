# External Integrations

**Generated:** 2026-03-20
**Context:** v1.3-M1 shipped -- six-subsystem architecture

## Graphiti MCP Server

**Protocol:** HTTP JSON-RPC + Server-Sent Events (SSE)
**Endpoint:** `http://localhost:8100/mcp`
**Health:** `http://localhost:8100/health`

### Connection Pattern

All MCP communication flows through `subsystems/terminus/mcp-client.cjs`:

```
MCPClient.initialize() -> SSE connection -> session_id extraction
MCPClient.callTool(name, args) -> JSON-RPC POST -> SSE stream -> parseSSE -> result
```

### MCP Tools Used

| Tool | Subsystem | Purpose |
|------|-----------|---------|
| `add_memory` | Ledger | Store episodes (change capture, summaries, user memories) |
| `search` | Assay | Semantic search across knowledge graph |
| `get_entity_edge` | Assay | Inspect specific relationships |
| `delete_entity_edge` | Assay | Remove specific relationships |
| `delete_episode` | Assay | Remove episodes by UUID |
| `clear_data` | Assay | Clear all data for a scope (destructive) |

### Error Handling

- MCPClient wraps all calls in try/catch
- Connection failures return null/empty results (graceful degradation)
- Health checks verify MCP connectivity via 8-stage pipeline
- Session IDs cached per MCPClient instance; stale IDs require restart

## Neo4j 5.26

**Bolt:** `bolt://localhost:7687`
**HTTP:** `http://localhost:7475` (admin browser)
**Container:** `neo4j-graphiti` (Docker)

Not accessed directly by Dynamo -- all graph operations go through Graphiti MCP.

## OpenRouter API

**Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
**Model:** `anthropic/claude-haiku-4.5`
**Auth:** `OPENROUTER_API_KEY` from `~/.claude/graphiti/.env`

### Usage Points

| Module | Purpose | Timeout |
|--------|---------|---------|
| `subsystems/ledger/curation.cjs` | Curate/filter retrieved memories before injection | 10s |
| `subsystems/ledger/hooks/session-summary.cjs` | Generate session summaries on Stop | 15s |
| `subsystems/ledger/hooks/preserve-knowledge.cjs` | Summarize before context compaction | 15s |
| `subsystems/assay/sessions.cjs` | Auto-name sessions via Haiku (backfill) | 10s |

### Request Pattern

```javascript
const response = await fetch(config.curation.api_url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: config.curation.model,
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]
  })
});
```

## Docker Stack

**Compose file:** `~/.claude/graphiti/docker-compose.yml`
**Management:** `subsystems/terminus/stack.cjs` (start/stop via `docker compose`)

### Containers

| Container | Image | Purpose | Ports |
|-----------|-------|---------|-------|
| `graphiti-mcp` | Graphiti MCP | Knowledge graph API server | 8100 |
| `neo4j-graphiti` | Neo4j 5.26 | Graph database | 7475, 7687 |

### Health Check Pipeline (8 stages)

1. Docker daemon reachable
2. Neo4j HTTP responsive
3. Graphiti API healthy
4. MCP session initializable
5. Environment variables set (OPENROUTER_API_KEY, NEO4J_PASSWORD)
6. Canary write/read round-trip
7. Node.js version >= 22
8. Session storage backend (SQLite or JSON)

## Claude Code Integration

**Hook dispatcher:** `cc/hooks/dynamo-hooks.cjs`
**Registration:** `cc/settings-hooks.json` merged into `~/.claude/settings.json`

### Hook Events

| Event | Timeout | Purpose |
|-------|---------|---------|
| SessionStart (startup/resume) | 30s | Context injection from knowledge graph |
| SessionStart (compact) | 30s | Re-inject context after compaction |
| UserPromptSubmit | 15s | Semantic search augmentation per prompt |
| PostToolUse (Write/Edit/MultiEdit) | 10s | Capture file changes as episodes |
| PreCompact | 30s | Preserve key knowledge before compression |
| Stop | 30s | Session summary and storage |

## SQLite (Session Storage)

**Module:** `subsystems/terminus/session-store.cjs`
**API:** `node:sqlite` DatabaseSync (synchronous, WAL mode)
**Location:** `~/.claude/graphiti/sessions.db`

### Dual-Write Pattern

- **Read:** SQLite (authoritative)
- **Write:** Both SQLite and JSON (`sessions.json`)
- **Fallback:** JSON-only if `node:sqlite` unavailable
- **Migration:** `dynamo install` auto-migrates `sessions.json` to SQLite

---
*Integration analysis for: Dynamo v1.3-M1*

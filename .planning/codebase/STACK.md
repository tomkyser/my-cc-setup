# Technology Stack

**Generated:** 2026-03-20
**Context:** v1.3-M1 shipped -- six-subsystem architecture

## Runtime

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | >= 22.x (current: v24.13.1) | Required for `node:sqlite` DatabaseSync |
| CJS (CommonJS) | Standard | All modules use `require()` / `module.exports` |
| Docker | Required | Graphiti MCP server + Neo4j 5.26 |

## Language

- **JavaScript (CJS)** -- 100% of production code
- No TypeScript, no ESM, no build step
- `'use strict';` in every file
- `node:test` for testing (built-in, zero dependencies)

## Dependencies

### Runtime Dependencies

| Dependency | Type | Purpose | Location |
|-----------|------|---------|----------|
| `js-yaml` | npm | YAML parsing for prompt templates | Used in curation pipeline |
| `node:sqlite` | Built-in | SQLite session storage (DatabaseSync API) | `subsystems/terminus/session-store.cjs` |
| `node:test` | Built-in | Test framework | `dynamo/tests/` |
| `node:http` | Built-in | MCP client HTTP, health checks | `subsystems/terminus/mcp-client.cjs` |
| `node:fs` | Built-in | File I/O everywhere | All modules |
| `node:path` | Built-in | Path resolution | All modules |
| `node:os` | Built-in | Home directory, tmpdir | `lib/core.cjs`, tests |
| `node:child_process` | Built-in | Docker commands, git operations | `subsystems/terminus/stack.cjs` |
| `node:crypto` | Built-in | UUID generation for canary tests | `subsystems/terminus/stages.cjs` |

**Zero npm dependencies beyond js-yaml.** All other dependencies are Node.js built-ins.

### External Services

| Service | Protocol | Purpose |
|---------|----------|---------|
| Graphiti MCP Server | HTTP JSON-RPC + SSE | Knowledge graph read/write via MCP tools |
| Neo4j 5.26 | Bolt (7687) + HTTP (7475) | Graph database backing Graphiti |
| OpenRouter API | HTTPS REST | Claude Haiku 4.5 for session naming and curation |

## Configuration

| File | Location | Purpose |
|------|----------|---------|
| `dynamo/config.json` | Repo + deployed | Runtime config (endpoints, timeouts, logging) |
| `dynamo/VERSION` | Repo + deployed | Semantic version string (0.1.0) |
| `cc/settings-hooks.json` | Repo only | Hook registration template for `~/.claude/settings.json` |
| `~/.claude/graphiti/.env` | Deployed only | API keys (OPENROUTER_API_KEY, NEO4J_PASSWORD) |
| `~/.claude/graphiti/docker-compose.yml` | Deployed only | Graphiti + Neo4j Docker stack |

## Platform

- **Target:** macOS (Darwin), zsh
- **Deployment:** `~/.claude/dynamo/` (user home directory)
- **Shell:** Commands invoked via `node ~/.claude/dynamo/dynamo.cjs <command>`
- **Hooks:** Claude Code command hooks with JSON stdin

---
*Stack analysis for: Dynamo v1.3-M1*

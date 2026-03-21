# Technical Concerns

**Generated:** 2026-03-20
**Context:** v1.3-M1 shipped -- six-subsystem architecture

## Current Health: Good

v1.3-M1 has been validated end-to-end with 14/14 requirements passing, 515 tests, and a successful real fresh install. No known bugs or critical issues.

## Areas of Note

### Session Storage Dual-Write Overhead

**Risk:** Low
**Files:** `subsystems/assay/sessions.cjs`, `subsystems/terminus/session-store.cjs`

The dual-write pattern (SQLite authoritative + JSON backup) doubles write operations. This is intentional for backward compatibility but adds I/O overhead. When JSON fallback is no longer needed (M2+), the JSON write path can be removed.

### OpenRouter API Single Point of Failure

**Risk:** Medium
**Files:** `subsystems/ledger/curation.cjs`, `subsystems/assay/sessions.cjs`

All LLM curation and session naming flows through OpenRouter. If OpenRouter is down or the API key expires, curation degrades (memories injected unfiltered) and session auto-naming fails silently. Graceful degradation is implemented but the user gets lower-quality memory injection.

**Note:** MENH-06 (transport flexibility) was removed from M1 scope. This dependency remains until M2+ addresses it via Inner Voice architecture.

### Regression Tests Against Deployed Layout

**Risk:** Low
**Files:** `dynamo/tests/regression.test.cjs`

Several regression tests read from `~/.claude/dynamo/` (the deployed directory, not tmpdir). This means:
- Tests fail if `~/.claude/dynamo/` doesn't exist or has stale layout
- Tests depend on deployed state, not just repo state
- These tests validate the deployment itself, which is the intent

### MCP Session ID Caching

**Risk:** Low
**Files:** `subsystems/terminus/mcp-client.cjs`

MCPClient caches the session ID from SSE initialization. If the Graphiti MCP server restarts, cached session IDs become stale, causing "invalid session" errors. The workaround is restarting Claude Code. A reconnection mechanism would improve resilience but is not currently implemented.

### Hook Error Visibility

**Risk:** Low
**Files:** `cc/hooks/dynamo-hooks.cjs`, `lib/core.cjs`

All hooks exit 0 regardless of errors (to never block Claude Code). Errors are logged to `hook-errors.log` which users may not check. The inline visibility feature (UI-08, planned for M3) would surface hook errors contextually.

## No Known Technical Debt

After M1 cleanup (Phase 22):
- No `detectLayout`, `resolveSibling`, or `resolveHandlers` remnants
- No stale directory references in comments
- No TODO/FIXME markers in production files
- No DEPRECATED comments
- Only 1 re-export in `core.cjs` (MCPClient -- intentional for orchestrator privilege)
- Circular dependency allowlist: 2 entries (core<->mcp-client, install<->update)

## Security Considerations

### Input Validation (MGMT-08a)

`cc/hooks/dynamo-hooks.cjs` validates all hook input:
- JSON structure verification
- Event name whitelist (VALID_EVENTS)
- Field type checks
- Field length limits (cwd: 4096 chars, tool_input values: 100KB)
- Violations logged, hook exits 0

### Boundary Markers (MGMT-08b)

Hook injection output wrapped in `<dynamo-memory-context>` / `</dynamo-memory-context>` markers to prevent prompt content from bleeding into system instructions.

### No Secrets in Repo

- API keys in `~/.claude/graphiti/.env` (deployed only, never committed)
- Config template (`dynamo/config.json`) contains no secrets
- `.env.example` provides structure without values

## Future Architecture Considerations

### Reverie Subsystem (M2)

Currently a stub (`subsystems/reverie/.gitkeep`). M2 will introduce:
- Inner Voice cognitive processing
- Dual-path routing (hot path <500ms, deliberation 2-10s)
- Custom subagent integration
- REM consolidation

The six-subsystem architecture is designed to accommodate this. Reverie reads through Assay, writes through Ledger, and delegates infrastructure to Terminus.

### Platform Adapter Pattern

The `cc/` directory isolates all Claude Code-specific integration. Future platform adapters (`/web`, `/api`, `/mcp`) can be added without touching subsystem logic. Currently only the `cc/` adapter exists.

---
*Concerns analysis for: Dynamo v1.3-M1*

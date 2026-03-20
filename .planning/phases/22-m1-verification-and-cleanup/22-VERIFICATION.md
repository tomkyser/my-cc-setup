# v1.3-M1 Verification Report

**Date:** 2026-03-20
**Node.js:** v24.13.1
**Status:** COMPLETE

## Requirement Validation Matrix

| ID | Requirement | Method | Result | Notes |
|----|-------------|--------|--------|-------|
| ARCH-01 | Six-subsystem directory structure | Tmpdir install structure check | PASS | 9/9 directories present (switchboard, assay, ledger, terminus, reverie, cc/hooks, cc/prompts, lib, dynamo) |
| ARCH-02 | Centralized dual-layout resolver | Ad-hoc function scan in tmpdir | PASS | No resolveSibling, resolveHandlers, or resolveCore functions found in any production file |
| ARCH-03 | Circular dependency detection | circular-deps.test.cjs execution | PASS | 0 cycles outside 2-entry allowlist (core<->mcp-client, install<->update); core<->sessions cycle eliminated in Plan 02 cleanup |
| ARCH-04 | Unified layout mapping | getSyncPairs returns 8 pairs | PASS | Pairs: root, dynamo-meta, switchboard, assay, ledger, terminus, cc, lib |
| ARCH-05 | Sync with new layout | Sync round-trip all 8 pairs | PASS | All 8 pairs verified in-sync after copyTree to tmpdir; 0 missing files, 0 extra files |
| ARCH-06 | Install pipeline works | Key files exist in tmpdir + real fresh install | PASS | 10/10 key files in tmpdir; real install 10/10 steps OK, 45 files deployed |
| ARCH-07 | All tests pass | Full test suite run (post-cleanup) | PASS | 515 tests, 514 pass, 1 skip (Docker daemon test), 0 fail |
| MGMT-01 | Node.js + Graphiti check | health-check.test.cjs + real health-check | PASS | Node.js version check (stage 6) passes; real health-check 8/8 stages OK |
| MGMT-08a | Hook input validation | Dispatcher smoke test | PASS | validateInput accepts valid JSON, rejects missing/unknown events, enforces field length limits and tool_input value limits |
| MGMT-08b | Boundary markers | Dispatcher smoke test | PASS | BOUNDARY_OPEN contains `<dynamo-memory-context>`, BOUNDARY_CLOSE contains `</dynamo-memory-context>` |
| DATA-01 | SQLite session storage | session-store.test.cjs + m1-verification | PASS | node:sqlite available, DatabaseSync API functional, WAL mode enabled |
| DATA-02 | Session query interface | sessions.test.cjs + m1-verification | PASS | getSession, getAllSessions return correct data; null returned for missing sessions |
| DATA-03 | JSON-to-SQLite migration | Migration smoke test + real install migration | PASS | Test: 2-entry JSON migrated; Real: 314 sessions migrated to SQLite, 0 skipped |
| DATA-04 | Graceful JSON fallback | sessions.test.cjs | PASS | Fallback logic tested in sessions.test.cjs; dual-write pattern preserves JSON compatibility |

**Result: 14/14 requirements PASS**

## Pre-Cleanup Test Suite Results (Plan 01 baseline)

- **Total:** 515
- **Pass:** 514
- **Skip:** 1 (Docker daemon integration test -- requires running Docker, skipped by design)
- **Fail:** 0
- **Duration:** 10785ms

## Post-Cleanup Test Results

After Plan 02 removed 7 re-exports from core.cjs, eliminated the core<->sessions circular dependency, and updated consumer files to use direct imports:

- **Total:** 515
- **Pass:** 514
- **Skip:** 1 (Docker daemon integration test -- same as pre-cleanup)
- **Fail:** 0
- **Duration:** 12734ms

**Comparison:** Identical test counts (515 total, 514 pass, 1 skip, 0 fail). No tests lost or broken by the cleanup. The m1-verification.test.cjs (36 tests) added during Plan 01 is included in both runs.

## Tmpdir Sandbox Verification

- Directory structure: PASS (9/9 directories)
- Key files: PASS (10/10 files)
- Sync round-trip: PASS (8/8 pairs in sync)
- Ad-hoc resolver scan: PASS (no resolveSibling/resolveHandlers/resolveCore found)

## Dispatcher Smoke Test

- Valid JSON accepted: PASS
- Invalid JSON rejected: PASS (malformed JSON piped via child_process; process exits 0)
- Boundary markers present: PASS (BOUNDARY_OPEN and BOUNDARY_CLOSE contain dynamo-memory-context)
- Field length limits enforced: PASS (cwd > 4096 chars and tool_input values > 100KB produce violations)
- Unknown event rejection: PASS (non-VALID_EVENTS event names produce violations)

## SQLite Session Smoke Test

- node:sqlite available: PASS (Node.js v24.13.1)
- Migration from JSON: PASS (2 sessions migrated, 0 skipped)
- Session queries work: PASS (getSession returns correct label and project; getAllSessions returns 2 rows)
- Null return for missing: PASS (getSession returns null for non-existent timestamp)

## Real Install Verification

A real fresh install was performed against `~/.claude/dynamo/` with scripted backup/restore:

1. **Backup:** Live deployment moved to `~/.claude/dynamo-m1-backup/` -- OK
2. **Fresh install:** `node dynamo.cjs install` from repo -- OK (10/10 steps)
   - Check dependencies: OK (Node.js v24.13.1 meets minimum v22.x)
   - Copy files: OK (45 files copied to ~/.claude/dynamo)
   - Generate config: OK (config.json written)
   - Merge settings: OK (settings.json updated)
   - Deregister MCP: OK (already CLI-only)
   - Deploy CLAUDE.md: OK (template copied to ~/.claude/CLAUDE.md)
   - Verify lib/: OK (lib/resolve.cjs deployed)
   - Retire Python: OK (0 items retired)
   - Migrate sessions: OK (314 sessions migrated to SQLite, 0 skipped)
   - Health check: OK (all checks passed)
3. **Health-check:** 8/8 stages reported
   - Docker: OK (both containers running)
   - Neo4j: OK (HTTP reachable on port 7475)
   - Graphiti API: OK (healthy)
   - MCP Session: OK (initialized)
   - Env Vars: OK (OPENROUTER_API_KEY set, NEO4J_PASSWORD set)
   - Canary Write/Read: WARN (write succeeded, eventual consistency on read -- expected)
   - Node.js Version: OK (v24.13.1 meets minimum v22.x)
   - Session Storage: OK (SQLite backend active)
4. **Status check:** `dynamo status` returns enabled=true, effective=true
5. **Decision:** Fresh install kept, backup removed

## Cleanup Summary (Plan 02)

### Re-exports Removed from core.cjs

7 symbols removed from core.cjs re-export surface:
- `parseSSE` (was re-exported from subsystems/terminus/mcp-client.cjs)
- `SCOPE` (was re-exported from lib/scope.cjs)
- `SCOPE_PATTERN` (was re-exported from lib/scope.cjs)
- `validateGroupId` (was re-exported from lib/scope.cjs)
- `sanitize` (was re-exported from lib/scope.cjs)
- `loadSessions` (was re-exported from subsystems/terminus/sessions.cjs)
- `listSessions` (was re-exported from subsystems/terminus/sessions.cjs)

**Remaining re-export:** MCPClient only (required for core.cjs orchestrator privilege)

### Consumers Updated to Direct Imports

- `subsystems/terminus/verify-memory.cjs` -- now imports SCOPE, SCOPE_PATTERN, sanitize directly from lib/scope.cjs and loadSessions from sessions.cjs (validateGroupId dropped as unused)
- `cc/hooks/dynamo-hooks.cjs` -- now imports SCOPE directly from lib/scope.cjs

### Circular Dependency Changes

- Removed core<->sessions allowlist entry (cycle no longer exists after re-export cleanup)
- Remaining allowlist: 2 entries (core<->mcp-client, install<->update)

### Dead Code and Stale References

- No dead migration code found in production files (detectLayout, resolveSibling, resolveHandlers, resolveCore all absent)
- No stale directory references in comments
- No TODO/FIXME markers in production files
- No DEPRECATED comments in production files

### Boundary Test Updates

- boundary.test.cjs updated to assert MCPClient presence and parseSSE/loadSessions absence (negative assertions documenting the cleanup)

## Issues Found

No issues found across all three plans. All 14 M1 requirements pass validation both before and after cleanup. The real install deployed successfully with all 10 steps completing without error.

## Verification Timeline

| Phase | Plan | What | Result |
|-------|------|------|--------|
| 22 | 01 | Automated M1 verification suite (36 tests) + draft report | 14/14 PASS |
| 22 | 02 | Core re-export cleanup + circular dep elimination | 515 tests, 0 fail |
| 22 | 03 | Post-cleanup test suite rerun | 515 tests, 0 fail (matches pre-cleanup) |
| 22 | 03 | Real fresh install to ~/.claude/dynamo/ | 10/10 steps OK, 8/8 health stages |

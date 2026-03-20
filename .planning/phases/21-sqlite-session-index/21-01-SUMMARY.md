---
phase: 21-sqlite-session-index
plan: 01
subsystem: database
tags: [sqlite, node-sqlite, session-storage, migration, fallback]

# Dependency graph
requires:
  - phase: 20-input-validation
    provides: Node.js v24 runtime verification (stageNodeVersion)
provides:
  - SQLite session storage layer (session-store.cjs) with CRUD, migration, fallback
  - Connection management via Map keyed by dbPath for test isolation
  - Availability detection for node:sqlite runtime feature
affects: [21-02, sessions.cjs integration, install.cjs migration step, health-check storage reporting]

# Tech tracking
tech-stack:
  added: [node:sqlite DatabaseSync]
  patterns: [connection-map-per-dbPath, lazy-availability-detection, INSERT-OR-REPLACE-vs-IGNORE]

key-files:
  created:
    - subsystems/terminus/session-store.cjs
    - dynamo/tests/switchboard/session-store.test.cjs
  modified: []

key-decisions:
  - "Functional API module (not class) for session-store.cjs -- matches codebase convention"
  - "Connection Map keyed by dbPath instead of singleton -- enables test isolation without module cache tricks"
  - "INSERT OR REPLACE for upsertSession (caller wants to update), INSERT OR IGNORE for migrateFromJson (preserve existing data)"
  - "getSession returns null (not undefined) to match existing sessions.cjs viewSession contract"
  - "PRAGMA synchronous=NORMAL paired with WAL for write performance"

patterns-established:
  - "Connection map pattern: Map keyed by absolute dbPath, closeDb removes from map, getDb creates or reuses"
  - "Lazy availability detection: _sqliteAvailable cached as null/true/false, checked once on first isAvailable() call"
  - "Row normalization: spread ({ ...row }) to convert null-prototype SQLite objects"

requirements-completed: [DATA-01, DATA-03, DATA-04]

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 21 Plan 01: SQLite Session Store Summary

**SQLite session storage layer via node:sqlite DatabaseSync with CRUD operations, JSON migration, and fallback detection**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-20T03:10:32Z
- **Completed:** 2026-03-20T03:12:55Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files created:** 2

## Accomplishments
- Created session-store.cjs with full CRUD (upsert, get, getAll, delete) using prepared statements
- Implemented migrateFromJson with INSERT OR IGNORE in a transaction for idempotent JSON-to-SQLite migration
- Availability detection via try/catch on require('node:sqlite') with one-time logError on failure
- Connection management via Map keyed by dbPath -- enables test isolation without singleton leakage
- Comprehensive test suite with 30 test cases covering all behaviors, edge cases, and migration scenarios

## Task Commits

Each task was committed atomically (TDD pattern):

1. **Task 1 RED: Failing tests for session store** - `2606d16` (test)
2. **Task 1 GREEN: Implement session-store.cjs** - `99289f5` (feat)

**Plan metadata:** (pending -- docs commit after this summary)

## Files Created/Modified
- `subsystems/terminus/session-store.cjs` - SQLite storage layer with DB init, CRUD, migration, availability detection, connection management
- `dynamo/tests/switchboard/session-store.test.cjs` - 30 test cases covering isAvailable, getDb, closeDb, upsertSession, getSession, getAllSessions, deleteSession, migrateFromJson, DEFAULT_DB_PATH, exports

## Decisions Made
- Functional API (not class) matches codebase convention and research recommendation
- Connection Map keyed by dbPath for multi-connection test isolation
- INSERT OR REPLACE for upsert (caller intent: update) vs INSERT OR IGNORE for migration (intent: preserve existing)
- getSession returns null for missing rows to match existing viewSession contract
- PRAGMA synchronous=NORMAL alongside WAL for balanced durability/performance
- Spread rows ({ ...row }) to normalize null-prototype objects from SQLite

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- session-store.cjs ready for Plan 02 to wire into sessions.cjs
- All exports match the interface contract specified in the plan
- Connection map pattern ready for install.cjs migration step integration
- Existing sessions.test.cjs passes unchanged (regression verified)

## Self-Check: PASSED

- [x] subsystems/terminus/session-store.cjs exists
- [x] dynamo/tests/switchboard/session-store.test.cjs exists
- [x] 21-01-SUMMARY.md exists
- [x] Commit 2606d16 (test RED) found
- [x] Commit 99289f5 (feat GREEN) found

---
*Phase: 21-sqlite-session-index*
*Completed: 2026-03-20*

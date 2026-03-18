---
phase: 12-structural-refactor
plan: 01
subsystem: infra
tags: [cjs, refactor, directory-structure, boundary-enforcement, require-paths]

# Dependency graph
requires: []
provides:
  - "3 root-level component directories (dynamo/, ledger/, switchboard/)"
  - "Import boundary enforcement test"
  - "Dual-path resolveCore() pattern for repo/deployed layouts"
  - "Cross-boundary imports eliminated via core.cjs re-exports"
  - "Docker infra at ledger/graphiti/"
  - "Test subdirectories (dynamo/tests/ledger/, dynamo/tests/switchboard/)"
affects: [12-02, 12-03, 12-04, all-future-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "resolveCore() dual-path resolution for deployed vs repo layout"
    - "Object.assign(module.exports, ...) to break circular dependencies"
    - "resolveLedger() in core.cjs for orchestrator re-exports"

key-files:
  created:
    - "dynamo/tests/boundary.test.cjs"
    - "ledger/graphiti/docker-compose.yml"
    - "ledger/graphiti/config.yaml"
    - "ledger/graphiti/start-graphiti.sh"
    - "ledger/graphiti/stop-graphiti.sh"
    - "ledger/graphiti/.env.example"
  modified:
    - "dynamo/core.cjs"
    - "dynamo/dynamo.cjs"
    - "dynamo/hooks/dynamo-hooks.cjs"
    - "ledger/mcp-client.cjs"
    - "ledger/search.cjs"
    - "ledger/episodes.cjs"
    - "ledger/curation.cjs"
    - "ledger/sessions.cjs"
    - "ledger/hooks/session-start.cjs"
    - "ledger/hooks/prompt-augment.cjs"
    - "ledger/hooks/capture-change.cjs"
    - "ledger/hooks/preserve-knowledge.cjs"
    - "ledger/hooks/session-summary.cjs"
    - "switchboard/stages.cjs"
    - "switchboard/health-check.cjs"
    - "switchboard/diagnose.cjs"
    - "switchboard/verify-memory.cjs"
    - "switchboard/install.cjs"
    - "switchboard/sync.cjs"
    - "switchboard/stack.cjs"

key-decisions:
  - "Used Object.assign(module.exports) after base exports to break circular dependency between core.cjs and ledger modules"
  - "resolveCore() checks deployed layout first (../core.cjs), falls back to repo layout (../dynamo/core.cjs)"
  - "Re-exported loadSessions/listSessions through core.cjs for verify-memory.cjs boundary compliance"
  - "Docker infra copied (not moved) to ledger/graphiti/ -- originals stay for Phase 13 archival"
  - "Updated dispatcher test with fallback path handling for legacy vs new deployed layout"

patterns-established:
  - "resolveCore(): every ledger/ and switchboard/ file uses this for core.cjs resolution"
  - "Boundary rule: ledger never imports switchboard, switchboard never imports ledger"
  - "Orchestrator privilege: only dynamo/core.cjs may import from ledger (re-exports for shared use)"

requirements-completed: [STAB-08, STAB-09]

# Metrics
duration: 11min
completed: 2026-03-18
---

# Phase 12 Plan 01: Directory Structure Refactor Summary

**Restructured Dynamo from monolithic dynamo/lib/ to 3 root-level component directories (dynamo/, ledger/, switchboard/) with dual-path require resolution, cross-boundary import elimination, and boundary enforcement test**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-18T18:30:04Z
- **Completed:** 2026-03-18T18:41:54Z
- **Tasks:** 2
- **Files modified:** 43

## Accomplishments
- Moved all source files to 3 root-level component directories with correct require() paths
- Eliminated all cross-boundary imports (switchboard no longer directly imports from ledger)
- Created boundary enforcement test with 6 structural checks that validates import rules
- All 279 tests pass (271 assertions + 1 skipped Docker test + 7 integration tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Move files to new directory layout and fix all require() paths** - `65670e4` (feat)
2. **Task 2: Create boundary enforcement test and verify full test suite** - `288a1f7` (test)

## Files Created/Modified
- `dynamo/core.cjs` - Moved from lib/, added resolveLedger() and re-exports for MCPClient, SCOPE, sessions
- `dynamo/dynamo.cjs` - Updated all require paths from lib/switchboard/ to ../switchboard/
- `dynamo/hooks/dynamo-hooks.cjs` - Updated core and scope imports, HANDLERS path
- `ledger/*.cjs` (6 files) - Added resolveCore() dual-path resolution
- `ledger/hooks/*.cjs` (5 files) - Added resolveCore() with 2-level depth
- `switchboard/*.cjs` (8 files) - Added resolveCore(), eliminated ledger imports
- `switchboard/install.cjs` - REPO_DIR/HOOKS_TEMPLATE paths, 3-dir copyTree layout
- `switchboard/sync.cjs` - REPO_DIR path from new location
- `dynamo/tests/boundary.test.cjs` - New: 6 boundary enforcement checks
- `dynamo/tests/ledger/*.test.cjs` (7 files) - Moved, updated require paths
- `dynamo/tests/switchboard/*.test.cjs` (7 files) - Moved, updated require paths
- `ledger/graphiti/` (5 files) - Docker infra copied from repo root graphiti/

## Decisions Made
- Used Object.assign(module.exports, ...) pattern to break circular dependency between core.cjs and ledger modules (export base first, then require ledger, then extend exports)
- Chose resolveCore() helper function approach (check deployed path first, fall back to repo path) over symlinks or environment variables
- Re-exported loadSessions/listSessions through core.cjs (pragmatic choice per plan option b) to maintain verify-memory.cjs boundary compliance
- Updated dispatcher test with fallback path logic to handle both old (lib/ledger/hooks) and new (ledger/hooks) deployed layouts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed circular dependency in core.cjs re-exports**
- **Found during:** Task 1 (Phase D - cross-boundary import resolution)
- **Issue:** core.cjs importing from ledger/mcp-client.cjs created circular dependency (mcp-client.cjs imports fetchWithTimeout from core.cjs which was trying to load mcp-client.cjs)
- **Fix:** Set module.exports with base utilities first, then require ledger modules, then Object.assign re-exports onto module.exports
- **Files modified:** dynamo/core.cjs
- **Verification:** `node --test dynamo/tests/core.test.cjs` passes with zero warnings
- **Committed in:** 65670e4 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed dispatcher test for new deployed layout**
- **Found during:** Task 2 (full test suite verification)
- **Issue:** dispatcher.test.cjs pointed HANDLERS_DIR to ~/.claude/dynamo/ledger/hooks/ which doesn't exist yet in the deployed layout (install hasn't been re-run)
- **Fix:** Added fallback path logic: check new layout (ledger/hooks/) first, fall back to legacy (lib/ledger/hooks/)
- **Files modified:** dynamo/tests/ledger/dispatcher.test.cjs
- **Verification:** Full test suite passes with 0 failures
- **Committed in:** 288a1f7 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 3-directory structure in place, all subsequent Phase 12 plans can build on this layout
- Boundary enforcement test will catch any future cross-boundary import regressions
- install.cjs updated for 3-dir deployment -- next `dynamo install` will deploy the new layout
- sync.cjs REPO_DIR updated -- `dynamo sync` will work with new structure

---
*Phase: 12-structural-refactor*
*Completed: 2026-03-18*

---
phase: 22-m1-verification-and-cleanup
plan: 02
subsystem: infra
tags: [core.cjs, re-exports, circular-deps, dead-code, cleanup]

# Dependency graph
requires:
  - phase: 22-01
    provides: Verified six-subsystem layout and test suite baseline
provides:
  - Reduced core.cjs re-export surface from 8 symbols to 1 (MCPClient only)
  - Direct imports in verify-memory.cjs and dynamo-hooks.cjs replacing core.cjs re-exports
  - Eliminated core.cjs <-> sessions.cjs circular dependency cycle
  - Updated allowlist and boundary tests for new re-export reality
affects: [22-03, 22-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [direct-import-over-reexport]

key-files:
  created: []
  modified:
    - lib/core.cjs
    - subsystems/terminus/verify-memory.cjs
    - cc/hooks/dynamo-hooks.cjs
    - dynamo/tests/circular-deps.test.cjs
    - dynamo/tests/boundary.test.cjs

key-decisions:
  - "Remove all re-exports except MCPClient -- SCOPE moved to direct imports from scope.cjs"
  - "dynamo-hooks.cjs updated to import SCOPE from scope.cjs instead of core.cjs"
  - "core<->sessions allowlist entry removed since cycle no longer exists"

patterns-established:
  - "Direct import pattern: consumers import from source module (scope.cjs, sessions.cjs) not via core.cjs re-exports"

requirements-completed: [ARCH-02, ARCH-03, ARCH-07]

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 22 Plan 02: Core Re-Export Cleanup Summary

**Reduced core.cjs re-exports from 8 symbols to MCPClient-only, eliminated core<->sessions circular dependency, verified no dead migration code remains**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-20T16:24:06Z
- **Completed:** 2026-03-20T16:27:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Removed 7 unused/unnecessary re-exports from core.cjs (parseSSE, SCOPE, SCOPE_PATTERN, validateGroupId, sanitize, loadSessions, listSessions)
- Updated verify-memory.cjs and dynamo-hooks.cjs to use direct imports from scope.cjs and sessions.cjs
- Eliminated the core.cjs <-> sessions.cjs circular dependency cycle (removed from allowlist)
- Updated boundary.test.cjs to validate the new reduced re-export surface
- Confirmed no dead migration code exists in production files (detectLayout, resolveSibling, resolveHandlers, resolveCore all absent)
- Confirmed no stale directory references, TODO/FIXME markers, or DEPRECATED comments in production files
- 514 tests passing, 0 failures throughout

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit and clean core.cjs re-exports and update consumers to direct imports** - `b596033` (refactor)
2. **Task 2: Remove dead migration code and fix stale directory references in comments** - No changes needed (codebase already clean from prior phases)

## Files Created/Modified
- `lib/core.cjs` - Removed 7 re-exports, kept only MCPClient; removed require of scope.cjs and sessions.cjs
- `subsystems/terminus/verify-memory.cjs` - Added direct imports from scope.cjs and sessions.cjs, removed validateGroupId (unused)
- `cc/hooks/dynamo-hooks.cjs` - Added direct import of SCOPE from scope.cjs instead of via core.cjs
- `dynamo/tests/circular-deps.test.cjs` - Removed core<->sessions allowlist entry (cycle no longer exists)
- `dynamo/tests/boundary.test.cjs` - Updated orchestrator privilege test to validate reduced re-export surface

## Decisions Made
- Removed SCOPE from core.cjs re-exports even though dynamo-hooks.cjs used it -- updated dynamo-hooks.cjs to import directly from scope.cjs for cleaner architecture
- validateGroupId was imported but never called in verify-memory.cjs -- dropped entirely from the import
- boundary.test.cjs updated to assert that parseSSE and loadSessions are NOT in core.cjs (negative assertions documenting the cleanup)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated boundary.test.cjs to reflect new re-export surface**
- **Found during:** Task 1 (core.cjs re-export cleanup)
- **Issue:** boundary.test.cjs asserted `content.includes('SCOPE')` which failed after SCOPE removal from core.cjs
- **Fix:** Updated test to assert MCPClient presence and parseSSE/loadSessions absence
- **Files modified:** dynamo/tests/boundary.test.cjs
- **Verification:** All 514 tests pass
- **Committed in:** b596033 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix in test)
**Impact on plan:** Test accurately reflects the new architecture. No scope creep.

## Issues Encountered
- Task 2 found zero dead migration code or stale references -- the codebase was already clean from Phases 18-19 restructure work. This is a positive finding confirming the prior cleanup was thorough.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Core.cjs is now minimal (MCPClient only re-export) -- cleaner dependency graph for future development
- Circular dependency allowlist accurately reflects 2 remaining intentional cycles (core<->mcp-client, install<->update)
- Ready for Plan 03 (verification documentation updates) and Plan 04 (final validation)

## Self-Check: PASSED

- All 5 modified files exist on disk
- Commit b596033 verified in git log
- SUMMARY.md created at expected path

---
*Phase: 22-m1-verification-and-cleanup*
*Completed: 2026-03-20*

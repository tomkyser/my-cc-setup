---
phase: 25-cutover-and-completion
plan: 04
subsystem: ops
tags: [install, sync, cleanup, reverie, deploy-pipeline]

# Dependency graph
requires:
  - phase: 25-01
    provides: "Bare dynamo CLI shim, .repo-path dotfile, generateConfig without curation"
provides:
  - "Reverie sync pair in getSyncPairs (9 pairs total)"
  - "cleanupClassicArtifacts function for install pipeline"
  - "Active removal of classic prompt templates, dead Ledger hooks, and curation config on upgrade"
affects: [switchboard, install, sync, deploy]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Active artifact cleanup during install upgrade"]

key-files:
  created: []
  modified:
    - "lib/layout.cjs"
    - "subsystems/switchboard/install.cjs"
    - "dynamo/tests/switchboard/install.test.cjs"
    - "dynamo/tests/switchboard/sync.test.cjs"

key-decisions:
  - "generateConfig curation removal already shipped in 25-01; no duplicate change needed"
  - "cleanupClassicArtifacts uses options.liveDir for test isolation, consistent with codebase pattern"

patterns-established:
  - "CLEANUP_FILES constant: declarative list of dead artifacts for active removal during upgrades"

requirements-completed: [OPS-03]

# Metrics
duration: 6min
completed: 2026-03-21
---

# Phase 25 Plan 04: Install and Sync Pipeline Updates Summary

**Reverie sync pair added to layout, active classic artifact cleanup in install pipeline with config sanitization**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-21T00:09:43Z
- **Completed:** 2026-03-21T00:16:18Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added reverie subsystem to getSyncPairs (8 -> 9 sync pairs), enabling `dynamo sync` to include Reverie files
- Added cleanupClassicArtifacts function that removes 6 dead prompt templates, 5 dead Ledger hook handlers, and strips curation/reverie.mode from config.json
- Integrated cleanup as Step 9 in the install pipeline, running after session migration and before health check
- Added 8 new tests (7 cleanup + 1 generateConfig OPENROUTER assertion), updated sync test for 9 pairs

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Reverie sync pair and update generateConfig** - `1429526` (feat)
2. **Task 2: Add active cleanup step to install pipeline and update tests** - `6f7fe2d` (feat)

## Files Created/Modified
- `lib/layout.cjs` - Added reverie sync pair between terminus and cc entries (9 pairs total)
- `subsystems/switchboard/install.cjs` - Added CLEANUP_FILES constant, cleanupClassicArtifacts function, Step 9 cleanup in run(), exported both
- `dynamo/tests/switchboard/install.test.cjs` - Added 7 cleanupClassicArtifacts tests + 1 generateConfig OPENROUTER test
- `dynamo/tests/switchboard/sync.test.cjs` - Updated sync pair count from 8 to 9, added reverie label assertion

## Decisions Made
- generateConfig curation removal was already shipped in plan 25-01 -- no duplicate change was needed in this plan
- cleanupClassicArtifacts follows the options-based test isolation pattern (accepts `options.liveDir` override)
- Config cleanup uses atomic write (tmp + rename) for safety, consistent with mergeSettings pattern

## Deviations from Plan

None - plan executed exactly as written. The generateConfig curation removal was already complete from plan 25-01, so Task 1 only required the reverie sync pair addition.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Install pipeline now deploys Reverie files and actively cleans classic artifacts
- Sync pipeline includes Reverie in bidirectional sync
- All 64 install + sync tests passing
- Ready for remaining Phase 25 plans

## Self-Check: PASSED

- All 4 modified files exist on disk
- Commit 1429526 (Task 1) verified in git log
- Commit 6f7fe2d (Task 2) verified in git log

---
*Phase: 25-cutover-and-completion*
*Completed: 2026-03-21*

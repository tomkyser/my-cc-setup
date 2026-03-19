---
phase: 15-update-system
plan: 01
subsystem: infra
tags: [github-api, semver, version-check, update-system]

# Dependency graph
requires:
  - phase: 12-migration
    provides: core.cjs fetchWithTimeout and safeReadFile utilities
provides:
  - checkUpdate() function for querying GitHub Releases API
  - compareVersions() function for numeric semver comparison
  - Test suite covering all version check and comparison behavior
affects: [15-02 update orchestrator, 15-03 migrate, 15-04 CLI router]

# Tech tracking
tech-stack:
  added: []
  patterns: [options-based test isolation for API endpoints, dual-path resolveCore]

key-files:
  created:
    - switchboard/update-check.cjs
    - dynamo/tests/switchboard/update-check.test.cjs
  modified: []

key-decisions:
  - "Hand-rolled semver comparison (3-component numeric) to maintain zero-dependency constraint"
  - "Separate 404 handling from network errors to give specific 'No releases published yet' message"
  - "Used live GitHub API call in test for 404 case (currently no releases exist) with timeout guard"

patterns-established:
  - "Options injection for update system: versionPath, apiUrl, timeout parameters for test isolation"
  - "Graceful degradation: network errors and 404s return result objects with error field, never throw"

requirements-completed: [STAB-05]

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 15 Plan 01: Update Check Module Summary

**GitHub Releases API version checker with numeric semver comparison and graceful offline/404 handling**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T01:06:14Z
- **Completed:** 2026-03-19T01:07:57Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- checkUpdate() queries GitHub Releases API and returns current vs latest version with update_available boolean
- compareVersions() handles numeric X.Y.Z semver comparison (not lexicographic)
- Graceful handling of network failure (friendly message, no crash) and 404 (no releases published)
- All functions accept options object for test isolation (versionPath, apiUrl, timeout)
- 12 tests covering all behavior branches pass

## Task Commits

Each task was committed atomically (TDD flow):

1. **Task 1 RED: Failing tests for update-check** - `d130142` (test)
2. **Task 1 GREEN: Implement update-check module** - `4a42cab` (feat)

**Plan metadata:** [pending final commit] (docs: complete plan)

## Files Created/Modified
- `switchboard/update-check.cjs` - Version check module with GitHub API integration, semver comparison, and graceful error handling
- `dynamo/tests/switchboard/update-check.test.cjs` - 12 unit tests covering compareVersions (6 tests) and checkUpdate (4 tests) plus module existence and identity (2 tests)

## Decisions Made
- Hand-rolled semver comparison using split/map(Number) to maintain zero-dependency constraint -- handles standard X.Y.Z format used by Dynamo
- Separate 404 response handling from generic network errors to provide specific "No releases published yet" message vs generic "network unavailable" message
- Used live GitHub API call in 404 test case since the repo currently has no releases, with timeout guard for CI/offline environments

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- update-check.cjs ready for import by update orchestrator (15-02)
- checkUpdate() and compareVersions() exports available for CLI router integration (15-04)
- No blockers for subsequent plans

## Self-Check: PASSED

- FOUND: switchboard/update-check.cjs
- FOUND: dynamo/tests/switchboard/update-check.test.cjs
- FOUND: 15-01-SUMMARY.md
- FOUND: d130142 (RED commit)
- FOUND: 4a42cab (GREEN commit)

---
*Phase: 15-update-system*
*Completed: 2026-03-19*

---
phase: 25-cutover-and-completion
plan: 02
subsystem: switchboard
tags: [cli-shim, changelog, update-system, developer-experience]

# Dependency graph
requires:
  - phase: 15-update-system
    provides: "check-update and update commands for changelog integration"
provides:
  - "Shell shim at bin/dynamo for bare CLI invocation"
  - "installShim() step in install pipeline with .repo-path dotfile"
  - "CHANGELOG.md in Keep a Changelog format (v1.1.0-v1.3.0)"
  - "readChangelog() helper for version-range changelog extraction"
  - "Changelog display in check-update and update commands"
affects: [install, update-system, developer-experience]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shell shim pattern for bare CLI invocation via ~/.local/bin"
    - "Keep a Changelog format for version documentation"

key-files:
  created:
    - bin/dynamo
    - CHANGELOG.md
    - dynamo/tests/switchboard/changelog.test.cjs
  modified:
    - subsystems/switchboard/install.cjs
    - subsystems/switchboard/update-check.cjs
    - subsystems/switchboard/update.cjs

key-decisions:
  - "Copy shim (not symlink) so it survives repo moves"
  - ".repo-path dotfile written during install enables DYNAMO_DEV=1 to find repo"

patterns-established:
  - "Shell shim with DYNAMO_DEV override: check .repo-path for dev mode, fall back to deployed version"

requirements-completed: [OPS-01, OPS-02]

# Metrics
duration: 4min
completed: 2026-03-20
---

# Phase 25 Plan 02: CLI Shim and Changelog Summary

**Shell shim for bare `dynamo` CLI invocation and CHANGELOG.md with version-tagged entries integrated into check-update and update commands**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T23:32:28Z
- **Completed:** 2026-03-20T23:36:18Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created `bin/dynamo` shell shim enabling bare `dynamo` CLI invocation without node prefix
- Added `installShim()` function to install pipeline that copies shim to `~/.local/bin/dynamo` and writes `.repo-path` dotfile
- Created CHANGELOG.md with Keep a Changelog entries for v1.1.0 through v1.3.0
- Integrated `readChangelog()` into update-check (returns changelog field) and update (displays "What's new:" after update)
- 5 new changelog tests, 0 regressions in existing test suites (12 update-check tests, 21 update tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create bare CLI shim and install symlink step** - `4d7add1` (feat)
2. **Task 2: Create CHANGELOG.md and integrate into update commands** - `2b9b089` (feat)

## Files Created/Modified
- `bin/dynamo` - Shell shim script for bare CLI invocation with DYNAMO_DEV=1 override
- `subsystems/switchboard/install.cjs` - Added installShim() function and Step 10 in install pipeline
- `CHANGELOG.md` - Version-tagged changelog in Keep a Changelog format
- `subsystems/switchboard/update-check.cjs` - Added readChangelog() helper, changelog field in checkUpdate return
- `subsystems/switchboard/update.cjs` - Displays changelog after successful update
- `dynamo/tests/switchboard/changelog.test.cjs` - 5 tests for readChangelog function

## Decisions Made
- Copy shim (not symlink) so it survives if the repo directory moves
- `.repo-path` dotfile written to live directory during install enables DYNAMO_DEV=1 to locate the repo version

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test require path for changelog test**
- **Found during:** Task 2 (changelog test creation)
- **Issue:** Plan template used `../../subsystems/` relative path which is incorrect from `dynamo/tests/switchboard/` (needs 3 levels up)
- **Fix:** Used `path.join(__dirname, '..', '..', '..', 'subsystems', 'switchboard', 'update-check.cjs')` matching existing test conventions
- **Files modified:** dynamo/tests/switchboard/changelog.test.cjs
- **Verification:** All 5 tests pass
- **Committed in:** 2b9b089 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test path fix was necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Note: `~/.local/bin` must be in the user's PATH for bare `dynamo` invocation to work. This is standard on most systems.

## Known Stubs
None - all functionality is fully wired.

## Next Phase Readiness
- CLI shim and changelog ready for the install pipeline
- update commands display changelog entries when updates are available
- Ready for remaining Phase 25 plans

## Self-Check: PASSED

All 7 created/modified files verified present. Both task commits (4d7add1, 2b9b089) verified in git log.

---
*Phase: 25-cutover-and-completion*
*Completed: 2026-03-20*

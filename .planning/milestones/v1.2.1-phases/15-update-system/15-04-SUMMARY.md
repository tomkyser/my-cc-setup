---
phase: 15-update-system
plan: 04
subsystem: cli
tags: [cli-router, update-system, check-update, dynamo]

# Dependency graph
requires:
  - phase: 15-update-system
    provides: "update-check.cjs (Plan 01), update.cjs orchestrator (Plan 03), evolved install.cjs rollback (Plan 03)"
provides:
  - "dynamo check-update command with inline status and --format json"
  - "dynamo update command delegating to update.cjs orchestrator"
  - "Updated rollback description reflecting full-snapshot behavior"
  - "Extended router tests covering update system commands"
affects: [dynamo-cli, update-system, documentation]

# Tech tracking
tech-stack:
  added: []
  patterns: ["inline stderr status for human-readable check-update output", "JSON stdout via --format json flag"]

key-files:
  created: []
  modified:
    - "dynamo/dynamo.cjs"
    - "dynamo/tests/router.test.cjs"

key-decisions:
  - "check-update writes human-readable status to stderr (not stdout) to avoid interfering with JSON consumers"
  - "check-update exits cleanly without calling output() in non-JSON mode -- stderr-only status"

patterns-established:
  - "Inline status pattern: stderr for human output, stdout reserved for --format json"

requirements-completed: [STAB-05]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 15 Plan 04: CLI Router Integration Summary

**Wired check-update and update commands into dynamo.cjs CLI router with inline status output, --format json support, and graceful offline handling**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T01:18:16Z
- **Completed:** 2026-03-19T01:21:36Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `check-update` command showing inline version status (current vs latest) to stderr with `--format json` support
- Added `update` command delegating to the update.cjs orchestrator for full update pipeline
- Updated `rollback` description from legacy "Restore settings.json.bak and undo retirement" to "Restore previous version from backup"
- Extended router tests with 9 new tests covering update system commands, help entries, and feature checks

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire check-update and update commands into CLI router** - `f2b5a72` (feat)
2. **Task 2: Extend router tests for check-update, update, and rollback commands** - `9ee35b5` (test)

## Files Created/Modified
- `dynamo/dynamo.cjs` - Added check-update and update switch cases, COMMAND_HELP entries, updated showHelp() command list
- `dynamo/tests/router.test.cjs` - Added check-update and update to expectedCommands, added update system commands describe block with 9 tests

## Decisions Made
- check-update writes human-readable inline status to stderr (matching existing CLI pattern where human text goes to stderr, JSON to stdout)
- In non-JSON mode, check-update exits cleanly without calling output() since status was already written to stderr

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 15 (update-system) is now complete -- all 4 plans executed
- The full update pipeline is accessible via `dynamo check-update` and `dynamo update` commands
- Rollback available via `dynamo rollback` (using evolved full-snapshot restore from Plan 03)
- Ready for next milestone planning

## Self-Check: PASSED

- FOUND: dynamo/dynamo.cjs
- FOUND: dynamo/tests/router.test.cjs
- FOUND: 15-04-SUMMARY.md
- FOUND: commit f2b5a72
- FOUND: commit 9ee35b5

---
*Phase: 15-update-system*
*Completed: 2026-03-19*

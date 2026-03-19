---
phase: 15-update-system
plan: 03
subsystem: infra
tags: [update-orchestrator, snapshot-backup, rollback, dev-mode-detection, tarball-download]

# Dependency graph
requires:
  - phase: 15-update-system
    provides: "checkUpdate from update-check.cjs (Plan 01), runMigrations from migrate.cjs (Plan 02)"
  - phase: 10-foundation
    provides: "install.cjs copyTree, mergeSettings, health-check.cjs _returnOnly pattern"
provides:
  - "Update orchestrator: check -> snapshot -> pull/download -> migrate -> install -> verify pipeline"
  - "createSnapshot/restoreSnapshot for full directory + settings.json backup"
  - "isDevMode for git-based dev vs tarball-based user mode detection"
  - "downloadAndExtract for GitHub tarball download with --strip-components=1"
  - "install.cjs _returnOnly parameter for non-exiting programmatic use"
  - "install.cjs full-snapshot rollback via dynamo-backup/ directory"
affects: [15-04 CLI router integration, dynamo rollback command]

# Tech tracking
tech-stack:
  added: []
  patterns: [snapshot-backup-restore, auto-rollback-on-failure, _returnOnly-pattern-extension]

key-files:
  created:
    - switchboard/update.cjs
    - dynamo/tests/switchboard/update.test.cjs
  modified:
    - switchboard/install.cjs

key-decisions:
  - "Snapshot backup uses existing copyTree from install.cjs -- no new directory copy logic"
  - "Settings.json stored as settings.json.snapshot inside backup dir to avoid path conflicts"
  - "install.cjs rollback() checks dynamo-backup/ first for full-snapshot restore, falls back to legacy settings-only"
  - "update.cjs uses lazy require() for sibling modules inside function bodies to avoid circular dependency issues"

patterns-established:
  - "_returnOnly parameter pattern extended to install.cjs run() matching health-check.cjs convention"
  - "Full-snapshot rollback takes priority over legacy settings-only rollback in install.cjs"
  - "Options-based injection for all update.cjs functions: liveDir, backupDir, settingsPath, scriptDir"

requirements-completed: [STAB-05]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 15 Plan 03: Update Orchestrator Summary

**Full update pipeline with snapshot backup/restore, auto-rollback on failure, dev-mode git pull vs user-mode tarball download**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T01:11:46Z
- **Completed:** 2026-03-19T01:15:44Z
- **Tasks:** 2 (Task 2 was TDD: RED + GREEN)
- **Files modified:** 3

## Accomplishments
- Update orchestrator chains 6 steps: version check, snapshot, code pull/download, migrations, install, health check
- Auto-rollback on any failure after snapshot (migration, install, or health check failure triggers restore)
- createSnapshot/restoreSnapshot handle full directory + settings.json backup with overwrite semantics
- isDevMode detects git repo with tomkyser/dynamo remote for dev vs user mode switching
- install.cjs evolved with _returnOnly parameter and full-snapshot-aware rollback
- 21 update tests + 23 existing install tests all pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Evolve install.cjs with _returnOnly and full-snapshot rollback** - `5aca5e2` (feat)
2. **Task 2 RED: Failing tests for update orchestrator** - `b091f56` (test)
3. **Task 2 GREEN: Implement update orchestrator** - `512cf56` (feat)

**Plan metadata:** [pending final commit] (docs: complete plan)

_Note: Task 2 was TDD with RED/GREEN commits_

## Files Created/Modified
- `switchboard/update.cjs` - Update orchestrator with createSnapshot, restoreSnapshot, isDevMode, downloadAndExtract, update functions
- `switchboard/install.cjs` - Added _returnOnly parameter to run(), replaced rollback() with full-snapshot-aware version
- `dynamo/tests/switchboard/update.test.cjs` - 21 tests covering snapshot, restore, dev mode detection, and structural orchestration verification (280 lines)

## Decisions Made
- Snapshot backup reuses existing copyTree from install.cjs rather than implementing new directory copy logic
- Settings.json stored as settings.json.snapshot inside backup directory to avoid filename conflicts with other backup mechanisms
- install.cjs rollback() evolved to check dynamo-backup/ directory first for full-snapshot restore before falling back to legacy settings-only restore
- update.cjs uses lazy require() for sibling modules (update-check, migrate, install, health-check) inside function bodies to avoid potential circular dependency issues

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Update orchestrator ready for CLI router integration (Plan 04)
- update(), createSnapshot, restoreSnapshot, isDevMode, downloadAndExtract all exported and tested
- install.cjs _returnOnly pattern enables programmatic use from update orchestrator without process.exit
- install.cjs rollback command now supports both full-snapshot and legacy restore modes

## Self-Check: PASSED

- FOUND: switchboard/update.cjs
- FOUND: switchboard/install.cjs
- FOUND: dynamo/tests/switchboard/update.test.cjs
- FOUND: 15-03-SUMMARY.md
- FOUND: 5aca5e2 (Task 1 feat)
- FOUND: b091f56 (Task 2 RED)
- FOUND: 512cf56 (Task 2 GREEN)

---
*Phase: 15-update-system*
*Completed: 2026-03-19*

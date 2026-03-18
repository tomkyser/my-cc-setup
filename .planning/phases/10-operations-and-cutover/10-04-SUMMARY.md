---
phase: 10-operations-and-cutover
plan: 04
subsystem: cli
tags: [cli, router, installer, cutover, settings-merge, rollback]

# Dependency graph
requires:
  - phase: 10-operations-and-cutover
    provides: stages.cjs, health-check.cjs, diagnose.cjs, verify-memory.cjs, sync.cjs, stack.cjs
  - phase: 09-hook-migration
    provides: sessions.cjs, dispatcher, curation pipeline
  - phase: 08-foundation-and-branding
    provides: core.cjs shared substrate
provides:
  - Unified CLI router (dynamo.cjs) dispatching 12 commands to switchboard and ledger modules
  - CJS installer with settings.json merge, Python retirement, and rollback
  - Complete cutover mechanism from Python/Bash to CJS architecture
affects: [11-master-roadmap]

# Tech tracking
tech-stack:
  added: []
  patterns: [switch-case CLI dispatch, atomic settings write, additive permission merge, legacy file retirement]

key-files:
  created:
    - dynamo/dynamo.cjs
    - dynamo/lib/switchboard/install.cjs
    - dynamo/tests/router.test.cjs
    - dynamo/tests/install.test.cjs
  modified: []

key-decisions:
  - "CLI router uses switch/case dispatch matching gsd-tools.cjs pattern"
  - "Installer merges hooks from settings-hooks.json template, preserving non-Dynamo hooks"
  - "Settings.json always backed up before modification (atomic write via .tmp + rename)"
  - "Python retirement moves files to graphiti-legacy/ (reversible via rollback)"
  - "Post-install health check reports results but does not roll back on failure"

patterns-established:
  - "CLI dispatch: switch/case on argv[2] with --pretty flag passthrough to all modules"
  - "Settings merge: backup first, template-authoritative for Dynamo hooks, additive for permissions"
  - "Retirement pattern: rename to -legacy/ directory for reversible cutover"

requirements-completed: [SWB-04, SWB-05, SWB-06]

# Metrics
duration: 8min
completed: 2026-03-17
---

# Phase 10 Plan 04: CLI Router & Installer Summary

**Unified CLI router dispatching 12 commands with CJS installer performing settings merge, Python retirement, and rollback**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-17T23:03:39Z
- **Completed:** 2026-03-17T23:11:29Z
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files created:** 4

## Accomplishments
- Unified CLI entry point (dynamo.cjs) routing all 12 subcommands to correct switchboard/ledger modules
- Full installer with recursive file copy, config generation, settings.json merge, MCP registration, and Python retirement
- Rollback capability restoring settings.json.bak and moving files back from graphiti-legacy/
- Human-verified: help, version, health-check, diagnose, sync status, and full 272-test suite all passing

## Task Commits

Each task was committed atomically (TDD: test then feat):

1. **Task 1: CLI router + installer** - `960bc49` (test) + `44cd603` (feat)
2. **Task 2: Human verification checkpoint** - approved (no code changes)

_TDD task has two commits (RED: failing tests, GREEN: implementation)_

## Files Created/Modified
- `dynamo/dynamo.cjs` - Unified CLI router with shebang, 12-command switch dispatch, help system, version command
- `dynamo/lib/switchboard/install.cjs` - Installer with copyTree, generateConfig, mergeSettings, registerMcp, retirePython, rollback
- `dynamo/tests/router.test.cjs` - 10 tests for CLI dispatch, help output, version command, unknown command error
- `dynamo/tests/install.test.cjs` - 19 tests for copyTree, generateConfig, mergeSettings, retirePython, rollback (all in tmpdir)

## Decisions Made
- CLI router follows gsd-tools.cjs pattern: argv[2] switch/case, --pretty flag passthrough
- Installer merges settings-hooks.json template as authoritative for Dynamo hooks, preserving non-Dynamo hooks (e.g., GSD)
- Permissions merged additively (no removal of existing permissions)
- Settings.json backup created before any modification (atomic write via .tmp + rename)
- Python retirement moves to graphiti-legacy/ (reversible), keeps docker-compose.yml, .env, config.yaml in graphiti/
- Post-install health check is informational only (reports but doesn't roll back on failure)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

First two execution attempts hit API 500 errors; third attempt succeeded. No code-level issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Complete Dynamo CLI system operational: 12 commands, 272 tests passing
- Ready for Phase 11 (Master Roadmap) — full system operational provides informed perspective on backlog prioritization
- Known env var warnings (NEO4J_PASSWORD, OPENROUTER_API_KEY not in process.env) are expected — these live in .env file, not exported

## Self-Check: PASSED

All 4 created files verified on disk. Both commits verified in git history. Full test suite: 272 pass, 0 fail.

---
*Phase: 10-operations-and-cutover*
*Completed: 2026-03-17*

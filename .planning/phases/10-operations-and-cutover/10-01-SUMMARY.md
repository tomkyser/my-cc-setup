---
phase: 10-operations-and-cutover
plan: 01
subsystem: diagnostics
tags: [diagnostic-stages, pretty-formatter, health-check, tdd, cjs]

# Dependency graph
requires:
  - phase: 08-ledger-foundation
    provides: "core.cjs (fetchWithTimeout, loadConfig, safeReadFile, DYNAMO_DIR), MCPClient"
provides:
  - "13 diagnostic stage functions (stages.cjs) for health-check and diagnose commands"
  - "Pretty CLI formatter (pretty.cjs) for human-readable terminal output"
  - "STAGE_NAMES and HEALTH_STAGES index arrays for orchestrator consumption"
affects: [10-02-health-check, 10-03-sync-stack, 10-04-install-cutover]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Stage function contract: async fn(options) returning { status, detail, raw }", "ANSI color output to stderr with TTY detection"]

key-files:
  created:
    - dynamo/lib/switchboard/stages.cjs
    - dynamo/lib/switchboard/pretty.cjs
    - dynamo/tests/stages.test.cjs
  modified: []

key-decisions:
  - "Options-based overrides for testability (graphitiDir, settingsPath, dynamoDir, mcpUrl, neo4jUrl)"
  - "Status hierarchy: FAIL for critical (NEO4J_PASSWORD), WARN for non-fatal (OPENROUTER_API_KEY)"
  - "ANSI codes inline (no chalk dependency) with process.stderr.isTTY detection"

patterns-established:
  - "Stage contract: async function stageName(options = {}) returning { status: OK|FAIL|WARN|SKIP, detail: string, raw?: string }"
  - "Pretty output to stderr (stdout reserved for JSON)"
  - "Options-object injection for test isolation of filesystem/network paths"

requirements-completed: [SWB-01, SWB-03]

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 10 Plan 01: Diagnostic Stages and Pretty Formatter Summary

**13 async diagnostic stage functions (Docker through canary write/read) with shared pretty CLI formatter using ANSI color output to stderr**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T22:13:42Z
- **Completed:** 2026-03-17T22:17:05Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- Built all 13 diagnostic stage functions as independent async exports in stages.cjs
- Each stage follows the { status, detail, raw } contract and catches errors internally
- Pretty formatter provides 5 format functions for health, diagnose, sync, and install reports
- 26 unit tests covering all stage functions with mocked dependencies
- TDD workflow: failing tests first, then implementation

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement stages.cjs with all 13 diagnostic stage functions** (TDD)
   - `8cf2bd3` test(10-01): add failing tests for 13 diagnostic stage functions
   - `eb987e7` feat(10-01): implement 13 diagnostic stage functions in stages.cjs
2. **Task 2: Implement pretty.cjs shared formatter** - `0d9600e` feat(10-01): implement pretty.cjs shared CLI formatter with ANSI colors

## Files Created/Modified
- `dynamo/lib/switchboard/stages.cjs` - 13 async diagnostic stage functions + STAGE_NAMES + HEALTH_STAGES
- `dynamo/lib/switchboard/pretty.cjs` - 5 format functions for CLI output (stderr, ANSI colors)
- `dynamo/tests/stages.test.cjs` - 26 unit tests covering stage contract, env vars, env file, hooks, CJS modules, and graceful failures

## Decisions Made
- Options-based overrides (graphitiDir, settingsPath, dynamoDir, mcpUrl, neo4jUrl) enable test isolation without monkey-patching
- NEO4J_PASSWORD missing returns FAIL (critical), OPENROUTER_API_KEY missing returns WARN (non-fatal for core operations)
- ANSI color codes used directly (no chalk dependency) with TTY detection for piped output compatibility
- Hook file path extraction handles both quoted (`node "$HOME/..."`) and unquoted (`node /path/...`) command formats

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- stages.cjs ready for consumption by health-check.cjs (Plan 02) and diagnose.cjs (Plan 02)
- pretty.cjs ready for --pretty flag formatting in all CLI commands
- HEALTH_STAGES array defines the subset of stages for health-check command

## Self-Check: PASSED

All 3 created files verified on disk. All 3 commits verified in git log.

---
*Phase: 10-operations-and-cutover*
*Completed: 2026-03-17*

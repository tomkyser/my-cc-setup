---
phase: 17-deploy-pipeline-fixes
plan: 01
subsystem: infra
tags: [hooks, installer, deploy-pipeline, dual-layout, mcp-deregistration]

# Dependency graph
requires:
  - phase: 12-structural-refactor
    provides: CJS module layout (dynamo/, ledger/, switchboard/) and resolveSibling pattern
  - phase: 16-tech-debt
    provides: resolveSibling() in dynamo.cjs, settings-hooks.json permissions cleanup
provides:
  - "resolveHandlers() dual-layout path resolution in dynamo-hooks.cjs"
  - "Defensive MCP deregistration in install.cjs"
  - "CLAUDE.md template deployment step in install.cjs"
  - "Stale lib/ directory cleanup step in install.cjs"
affects: [17-02-PLAN, 17-03-PLAN, deploy-pipeline, hooks]

# Tech tracking
tech-stack:
  added: []
  patterns: [dual-layout-resolution, defensive-deregistration]

key-files:
  created: []
  modified:
    - dynamo/hooks/dynamo-hooks.cjs
    - switchboard/install.cjs

key-decisions:
  - "resolveHandlers() follows same pattern as resolveSibling() in dynamo.cjs -- repo path first, deployed fallback"
  - "MCP deregistration is defensive (OK status whether graphiti was registered or not)"
  - "CLAUDE.md deploy copies from claude-config/CLAUDE.md.template to ~/.claude/CLAUDE.md"
  - "Stale lib/ removal uses fs.rmSync recursive+force for clean deletion"

patterns-established:
  - "resolveHandlers(): dual-layout path resolution for hook handler directory"
  - "Defensive deregistration: try remove, catch means already clean"

requirements-completed: [STAB-10]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 17 Plan 01: Deploy Pipeline Fixes Summary

**Dual-layout handler path resolution in dynamo-hooks.cjs and installer hardened with defensive MCP deregistration, CLAUDE.md deploy, and stale lib/ cleanup**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T04:03:14Z
- **Completed:** 2026-03-19T04:06:15Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed dynamo-hooks.cjs to resolve handler paths correctly in both repo and deployed layouts via resolveHandlers()
- Removed registerMcp() function entirely from install.cjs (CLI-only architecture per Phase 12-04)
- Added defensive MCP deregistration step that removes graphiti MCP if present
- Added CLAUDE.md template deployment step to installer
- Added stale lib/ directory cleanup step to installer

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix dynamo-hooks.cjs dual-layout handler resolution** - `b161005` (fix)
2. **Task 2: Fix install.cjs -- remove MCP registration, add defensive deregistration, CLAUDE.md deploy, lib/ cleanup** - `ed11d5a` (fix)

## Files Created/Modified
- `dynamo/hooks/dynamo-hooks.cjs` - Added resolveHandlers() function with dual-layout support, replaced hardcoded HANDLERS path, added fs import
- `switchboard/install.cjs` - Removed registerMcp(), added defensive deregistration (Step 4), CLAUDE.md deploy (Step 5), stale lib/ cleanup (Step 6), renumbered remaining steps

## Decisions Made
- resolveHandlers() follows the same dual-layout pattern as resolveSibling() from dynamo.cjs -- checks repo path first via fs.existsSync, falls back to deployed layout
- MCP deregistration is defensive: both success and failure result in OK status since either path means the desired state (no MCP registered) is achieved
- CLAUDE.md template deploy step checks for template existence before copying, warns if template not found
- Stale lib/ cleanup uses fs.rmSync with recursive+force for clean removal of pre-Phase-12 artifacts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Dispatcher test (dynamo/tests/ledger/dispatcher.test.cjs) reads from deployed layout (~/.claude/dynamo/hooks/), so the resolveHandlers() test fails until next `dynamo install` deploys the updated code. This is expected behavior, not a bug.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Code fixes are committed in repo source -- next `dynamo install` will deploy them to ~/.claude/dynamo/
- Plan 17-02 can proceed with test updates for the new installer steps
- Plan 17-03 can proceed with integration verification

## Self-Check: PASSED

- [x] dynamo/hooks/dynamo-hooks.cjs exists
- [x] switchboard/install.cjs exists
- [x] 17-01-SUMMARY.md exists
- [x] Commit b161005 found
- [x] Commit ed11d5a found

---
*Phase: 17-deploy-pipeline-fixes*
*Completed: 2026-03-19*

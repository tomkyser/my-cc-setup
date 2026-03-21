---
phase: 23-foundation-and-routing
plan: 03
subsystem: reverie
tags: [hooks, dispatcher, routing, subagent, inner-voice, cortex]

# Dependency graph
requires:
  - phase: 23-01
    provides: "lib/config.cjs with reverie.mode validation and get/set"
provides:
  - "7 Reverie handler stubs in subsystems/reverie/handlers/"
  - "Mode-based routing in dispatcher (classic vs cortex)"
  - "SubagentStart/SubagentStop event registration and routing"
  - "JSON_OUTPUT_EVENTS set for boundary-skip logic"
affects: [24-cognitive-pipeline, reverie, dispatcher, hooks]

# Tech tracking
tech-stack:
  added: []
  patterns: ["pass-through stub delegation to Ledger handlers", "mode-based routing conditional in dispatcher", "JSON output events skip boundary wrapping"]

key-files:
  created:
    - subsystems/reverie/handlers/session-start.cjs
    - subsystems/reverie/handlers/user-prompt.cjs
    - subsystems/reverie/handlers/post-tool-use.cjs
    - subsystems/reverie/handlers/pre-compact.cjs
    - subsystems/reverie/handlers/stop.cjs
    - subsystems/reverie/handlers/iv-subagent-start.cjs
    - subsystems/reverie/handlers/iv-subagent-stop.cjs
    - dynamo/tests/reverie/handlers.test.cjs
  modified:
    - cc/hooks/dynamo-hooks.cjs
    - cc/settings-hooks.json
    - dynamo/tests/ledger/dispatcher.test.cjs

key-decisions:
  - "Pass-through stubs delegate via resolve() lazy require, not top-level require, for Phase 24 hot-swap"
  - "SubagentStart/SubagentStop use JSON_OUTPUT_EVENTS set to skip boundary wrapping"
  - "Cortex mode routing uses REVERIE_ROUTE map for clean handler file lookup"

patterns-established:
  - "Pass-through stub: resolve('ledger', 'hooks/X.cjs') lazy require in handler body"
  - "No-op stub: logError with event details, return null"
  - "JSON_OUTPUT_EVENTS: Set-based check to skip boundary markers for non-cognitive events"
  - "REVERIE_ROUTE: event-to-handler-file mapping object for cortex mode dispatch"

requirements-completed: [HOOK-01, HOOK-02, HOOK-03]

# Metrics
duration: 5min
completed: 2026-03-20
---

# Phase 23 Plan 03: Hook Architecture Summary

**7 Reverie handler stubs, dual-mode dispatcher routing (classic/cortex), and SubagentStart/SubagentStop event registration with JSON output format**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T20:16:38Z
- **Completed:** 2026-03-20T20:22:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Created 5 pass-through handler stubs that delegate to classic Ledger handlers, producing identical output in cortex mode
- Created 2 no-op handler stubs for SubagentStart/SubagentStop that log receipt and return null
- Modified dispatcher to read reverie.mode from config and route accordingly (classic preserves existing behavior, cortex routes to Reverie handlers)
- Registered SubagentStart/SubagentStop in VALID_EVENTS (7 total) and settings-hooks.json with inner-voice matcher
- Added JSON_OUTPUT_EVENTS set to skip boundary wrapping for subagent events
- 107 dispatcher+handler tests passing (77 dispatcher, 30 handler)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 7 Reverie handler stubs** - `758faff` (feat)
2. **Task 2: Modify dispatcher for dual-mode routing and register subagent events** - `1075ae8` (feat)
3. **Task 3: Update dispatcher test suite for mode-based routing and subagent events** - `1c855bc` (test)

## Files Created/Modified
- `subsystems/reverie/handlers/session-start.cjs` - Pass-through stub delegating to ledger/hooks/session-start.cjs
- `subsystems/reverie/handlers/user-prompt.cjs` - Pass-through stub delegating to ledger/hooks/prompt-augment.cjs
- `subsystems/reverie/handlers/post-tool-use.cjs` - Pass-through stub delegating to ledger/hooks/capture-change.cjs
- `subsystems/reverie/handlers/pre-compact.cjs` - Pass-through stub delegating to ledger/hooks/preserve-knowledge.cjs
- `subsystems/reverie/handlers/stop.cjs` - Pass-through stub delegating to ledger/hooks/session-summary.cjs
- `subsystems/reverie/handlers/iv-subagent-start.cjs` - No-op stub logging SubagentStart receipt
- `subsystems/reverie/handlers/iv-subagent-stop.cjs` - No-op stub logging SubagentStop receipt
- `cc/hooks/dynamo-hooks.cjs` - Added mode-based routing, SubagentStart/SubagentStop support, JSON_OUTPUT_EVENTS
- `cc/settings-hooks.json` - Added SubagentStart/SubagentStop entries with inner-voice matcher
- `dynamo/tests/reverie/handlers.test.cjs` - 30 tests for handler file structure and exports
- `dynamo/tests/ledger/dispatcher.test.cjs` - Updated from 35 to 77 tests with mode-routing and subagent coverage

## Decisions Made
- Pass-through stubs use lazy require (inside handler body, not top-level) via resolve() to allow Phase 24 hot-swap without changing dispatcher
- SubagentStart/SubagentStop output uses JSON format (hookSpecificOutput structure) without boundary wrapping, per Claude Code subagent hook contract
- REVERIE_ROUTE map pattern used instead of switch/case for cortex mode, keeping classic mode switch/case intact in else block

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All hook architecture is in place for the Reverie subsystem
- reverie.mode flag is now functional: classic mode preserves M1 behavior, cortex mode routes through Reverie handlers (currently pass-through)
- Phase 24 can replace pass-through stubs with cognitive processing pipeline
- SubagentStart/SubagentStop events are wired and ready for Inner Voice subagent integration

## Self-Check: PASSED

All 11 files verified present. All 3 task commits (758faff, 1075ae8, 1c855bc) verified in git log.

---
*Phase: 23-foundation-and-routing*
*Completed: 2026-03-20*

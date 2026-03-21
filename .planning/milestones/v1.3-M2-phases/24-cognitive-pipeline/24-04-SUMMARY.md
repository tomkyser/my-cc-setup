---
phase: 24-cognitive-pipeline
plan: 04
subsystem: reverie
tags: [inner-voice, handlers, pipeline-delegation, cognitive-pipeline, state-bridge, subagent, deliberation, cortex-mode]

# Dependency graph
requires:
  - phase: 23-foundation-and-routing
    provides: 7 pass-through handler stubs, dispatcher dual-mode routing, activation.cjs, state.cjs
  - phase: 24-cognitive-pipeline
    plan: 01
    provides: dual-path.cjs (selectPath, detectSemanticShift, detectExplicitRecall, formatHotPathInjection)
  - phase: 24-cognitive-pipeline
    plan: 02
    provides: curation.cjs (curateForInjection, formatBriefing, formatSynthesis, formatPreCompact)
  - phase: 24-cognitive-pipeline
    plan: 03
    provides: inner-voice.cjs pipeline functions (processUserPrompt, processSessionStart, processStop, processPreCompact, processPostToolUse, consumeDeliberationResult, writeDeliberationResult)
provides:
  - 7 rewritten Reverie handlers delegating to inner-voice.cjs pipeline instead of Ledger pass-through
  - Complete cognitive pipeline integration -- cortex mode routes all hook events through full Inner Voice processing
  - SubagentStart context packaging with deliberation-type-specific instructions
  - SubagentStop state bridge writer with JSON output parsing and self-model updates
  - Updated handler test suite (71 tests) verifying pipeline delegation patterns
affects: [25-hybrid-mode, cortex-mode-activation, subagent-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Handler delegation: thin wrapper pattern -- loadState, call pipeline function, persistState, write stdout"
    - "Subagent context packaging: serialize IV state + deliberation-type-specific instructions as additionalContext"
    - "State bridge write pattern: SubagentStop writes via writeDeliberationResult, UserPromptSubmit atomically consumes"
    - "Agent name filtering: handlers check for 'inner-voice' in agent name/type before processing"

key-files:
  created: []
  modified:
    - subsystems/reverie/handlers/session-start.cjs
    - subsystems/reverie/handlers/user-prompt.cjs
    - subsystems/reverie/handlers/post-tool-use.cjs
    - subsystems/reverie/handlers/pre-compact.cjs
    - subsystems/reverie/handlers/stop.cjs
    - subsystems/reverie/handlers/iv-subagent-start.cjs
    - subsystems/reverie/handlers/iv-subagent-stop.cjs
    - dynamo/tests/reverie/handlers.test.cjs

key-decisions:
  - "SubagentStop parses JSON output from subagent for self-model updates, predictions, and session names -- raw text used as injection fallback"
  - "SubagentStart builds deliberation-type-specific instructions via switch on processing.deliberation_type (explicit_recall, semantic_shift, session_briefing, rem_synthesis)"

patterns-established:
  - "Handler delegation pattern: loadState -> call innerVoice.processX -> persistState -> write stdout"
  - "Agent name filtering: check ctx.agent_name || ctx.agent_type includes 'inner-voice' before processing"
  - "Deliberation spawn instruction: stdout message '[INNER VOICE: ...]' instructs dispatcher/session to spawn subagent"

requirements-completed: [PATH-03, IV-06, IV-05, IV-07, IV-08, IV-09, IV-11, PATH-01, PATH-02, PATH-04, PATH-05, PATH-06]

# Metrics
duration: 4min
completed: 2026-03-20
---

# Phase 24 Plan 04: Handler Pipeline Integration Summary

**All 7 Reverie handlers rewritten from pass-through Ledger stubs to full inner-voice.cjs cognitive pipeline delegation with SubagentStart context packaging and SubagentStop state bridge writing**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T22:28:00Z
- **Completed:** 2026-03-20T22:32:16Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Rewrote 5 cognitive event handlers (SessionStart, UserPromptSubmit, PostToolUse, PreCompact, Stop) from Ledger pass-through stubs to inner-voice.cjs pipeline delegation with state management and stdout injection output
- Rewrote SubagentStart handler to package full IV state (self_model, activation_map, predictions, domain_frame) with deliberation-type-specific instructions as additionalContext for the inner-voice subagent
- Rewrote SubagentStop handler to write deliberation results to state bridge via writeDeliberationResult, parse JSON output for self-model/prediction updates, and comply with Pitfall 1 (return null, no stdout)
- Updated handler test suite from 30 stub-verification tests to 71 pipeline-delegation tests verifying inner-voice.cjs integration, no Ledger pass-through, correct function calls, state management, and agent name filtering
- All existing tests unaffected: inner-voice (39), dual-path (44), curation (22), activation (49), dispatcher (77) -- zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite 5 cognitive handlers** - `6619bee` (feat)
2. **Task 2: Rewrite SubagentStart/SubagentStop and update tests** - `2cac337` (feat)

## Files Created/Modified

- `subsystems/reverie/handlers/session-start.cjs` - SessionStart cognitive pipeline handler with D-14 always-deliberation spawn instruction
- `subsystems/reverie/handlers/user-prompt.cjs` - UserPromptSubmit handler with state bridge consumption, processUserPrompt pipeline, and deliberation spawn instruction
- `subsystems/reverie/handlers/post-tool-use.cjs` - PostToolUse lightweight activation update handler (no stdout output)
- `subsystems/reverie/handlers/pre-compact.cjs` - PreCompact handler with compact summary stdout output
- `subsystems/reverie/handlers/stop.cjs` - Stop handler with D-15 REM Tier 3 deliberation queuing
- `subsystems/reverie/handlers/iv-subagent-start.cjs` - SubagentStart context packaging with deliberation-type-specific instructions
- `subsystems/reverie/handlers/iv-subagent-stop.cjs` - SubagentStop state bridge writer with JSON parsing and self-model updates
- `dynamo/tests/reverie/handlers.test.cjs` - Updated test suite (71 tests) verifying pipeline delegation patterns

## Decisions Made

- **SubagentStop JSON parsing:** SubagentStop attempts JSON.parse on subagent output to extract structured fields (injection, type, session_name, self_model_updates, predictions). Falls back to using raw text as injection if not valid JSON. This enables the subagent to return rich structured data when available.
- **Deliberation-type-specific instructions:** SubagentStart builds context-sensitive instruction text via switch on processing.deliberation_type (explicit_recall, semantic_shift, session_briefing, rem_synthesis, default). Each type provides the subagent with targeted guidance for its specific task.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 7 Reverie handlers now delegate to inner-voice.cjs pipeline functions in cortex mode
- Classic mode completely unaffected -- dispatcher routes to Ledger handlers when mode=classic
- Switching `reverie.mode` config to "cortex" activates the complete Inner Voice processing pipeline
- Ready for Phase 25 hybrid mode (A/B comparison between classic and cortex)
- All 302 Reverie-related tests pass (71 handler + 39 inner-voice + 44 dual-path + 22 curation + 49 activation + 77 dispatcher = 302 total)

## Known Stubs

None - all handlers contain complete pipeline delegation logic.

## Self-Check: PASSED

All 8 modified files verified on disk. All 2 commit hashes verified in git log (6619bee, 2cac337).

---
*Phase: 24-cognitive-pipeline*
*Completed: 2026-03-20*

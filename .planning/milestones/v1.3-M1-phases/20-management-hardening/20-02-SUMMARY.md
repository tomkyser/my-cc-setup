---
phase: 20-management-hardening
plan: 02
subsystem: hooks
tags: [input-validation, prompt-injection, boundary-markers, dispatcher, security]

# Dependency graph
requires:
  - phase: 18-02
    provides: Resolver migration and dual-layout bootstrap for cc/hooks/dynamo-hooks.cjs
provides:
  - validateInput() function rejecting malformed/unknown/oversized hook input
  - Stdout boundary wrapping with <dynamo-memory-context> markers around all handler output
  - Exported constants (VALID_EVENTS, LIMITS, BOUNDARY_OPEN, BOUNDARY_CLOSE) for downstream use
affects: [hooks, prompt-injection-defense, memory-context]

# Tech tracking
tech-stack:
  added: []
  patterns: [stdout-interception-with-try-finally, input-validation-with-early-return, xml-boundary-markers]

key-files:
  created: []
  modified:
    - cc/hooks/dynamo-hooks.cjs
    - dynamo/tests/ledger/dispatcher.test.cjs

key-decisions:
  - "XML-style boundary markers chosen over bracket-style for LLM-native semantic clarity"
  - "validateInput returns early on missing hook_event_name without checking optional fields"
  - "Unknown fields ignored in validation for forward-compatibility with Claude Code updates"
  - "Empty handler output produces no boundary markers (avoids wrapping empty string)"

patterns-established:
  - "Stdout interception pattern: monkey-patch process.stdout.write, restore in finally block"
  - "Input validation pattern: centralized validateInput() in dispatcher, not per-handler"
  - "Boundary marker pattern: <dynamo-memory-context source='dynamo-hooks'> wraps all handler output"

requirements-completed: [MGMT-08a, MGMT-08b]

# Metrics
duration: 4min
completed: 2026-03-20
---

# Phase 20 Plan 02: Input Validation and Boundary Protection Summary

**Hook dispatcher hardened with validateInput() rejecting malformed/unknown/oversized input and stdout boundary wrapping via <dynamo-memory-context> markers**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T02:35:17Z
- **Completed:** 2026-03-20T02:39:51Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Input validation layer added to dispatcher: validates hook_event_name (required, known event set), field types, and field length limits (64 chars event name, 4KB cwd, 100KB tool_input values)
- Stdout boundary wrapping intercepts all handler output and wraps in `<dynamo-memory-context>` / `</dynamo-memory-context>` XML tags with source attribution
- 35 new tests covering all validation edge cases, boundary marker behavior, and integration assertions (54 total dispatcher tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add input validation and stdout boundary wrapping to dynamo-hooks.cjs** - `895ca61` (feat)
2. **Task 2: Add comprehensive dispatcher tests for validation and boundary wrapping** - `e85cd60` (test)

## Files Created/Modified
- `cc/hooks/dynamo-hooks.cjs` - Added validateInput(), VALID_EVENTS, LIMITS, BOUNDARY_OPEN/CLOSE constants, stdout interception with try/finally, malformed JSON specific logging
- `dynamo/tests/ledger/dispatcher.test.cjs` - Added 3 new describe blocks with 35 tests covering MGMT-08a validation, MGMT-08b boundary markers, and dispatcher integration

## Decisions Made
- XML-style boundary markers (`<dynamo-memory-context source="dynamo-hooks">`) chosen for LLM-native semantic clarity over bracket-style delimiters
- validateInput() returns early on missing/invalid hook_event_name without checking optional fields (fail fast)
- Unknown fields are silently ignored for forward-compatibility with future Claude Code input changes
- Empty handler output produces no boundary markers (clean no-op when handler is silent)
- JSON.parse errors now logged with specific "malformed JSON input:" prefix for diagnostics

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing uncommitted changes from Plan 20-01 (health-check.cjs, stages.test.cjs, health-check.test.cjs) were found in the working tree. These add a 7th health-check stage (Node.js version) but were never committed with Plan 20-01. They cause 1 test failure in health-check.test.cjs. These are NOT caused by Plan 20-02 and were left untouched. Logged to deferred items.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Dispatcher now validates all input before routing to handlers
- All handler stdout is wrapped in boundary markers for prompt injection protection
- Existing section markers ([GRAPHITI MEMORY CONTEXT], [RELEVANT MEMORY], [PRESERVED KNOWLEDGE]) are preserved inside boundary-wrapped content
- Pre-existing uncommitted 20-01 changes should be committed before proceeding to next phase

## Self-Check: PASSED

- FOUND: cc/hooks/dynamo-hooks.cjs
- FOUND: dynamo/tests/ledger/dispatcher.test.cjs
- FOUND: .planning/phases/20-management-hardening/20-02-SUMMARY.md
- FOUND: 895ca61 (Task 1 commit)
- FOUND: e85cd60 (Task 2 commit)

---
*Phase: 20-management-hardening*
*Completed: 2026-03-20*

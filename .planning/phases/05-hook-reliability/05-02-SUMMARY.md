---
phase: 05-hook-reliability
plan: 02
subsystem: infra
tags: [graphiti, hooks, error-propagation, logging, verbose, bash, python]

requires:
  - phase: 05-hook-reliability
    plan: 01
    provides: GRAPHITI_GROUP_ID override removed; MCPClient 5s timeout; SCOPE_FALLBACK.md documenting global scope + content prefix fallback

provides:
  - capture-change.sh rewritten with foreground execution, log_error, once-per-session health warning, [project-name] content prefix
  - session-summary.sh rewritten with foreground execution, log_error, once-per-session health warning, [project-name] content prefix
  - preserve-knowledge.sh rewritten with foreground execution, log_error, once-per-session health warning, [project-name] content prefix
  - graphiti-helper.py cmd_add_episode exits 1 on failure, supports GRAPHITI_VERBOSE=1
  - graphiti-helper.py cmd_health_check prints [graphiti] Server unreachable on connection failure
  - hook-errors.log infrastructure (created on first error)

affects: [06-session-management, memory-system]

tech-stack:
  added: []
  patterns:
    - "Once-per-session health warning: /tmp/graphiti-health-warned-${PPID} flag prevents repeated stderr noise"
    - "log_error() writes to both stderr AND ~/.claude/graphiti/hook-errors.log with timestamp and hook name"
    - "All add-episode calls run foreground (no & backgrounding) so exit codes are captured"
    - "GRAPHITI_VERBOSE=1 env var enables [graphiti] Stored: confirmation messages on successful writes"
    - "Log rotation: mv to .old at 1MB, overwritten on next rotation"

key-files:
  created: []
  modified:
    - ~/.claude/graphiti/hooks/capture-change.sh
    - ~/.claude/graphiti/hooks/session-summary.sh
    - ~/.claude/graphiti/hooks/preserve-knowledge.sh
    - ~/.claude/graphiti/graphiti-helper.py

key-decisions:
  - "Hooks use global scope + [project-name] content prefix per SCOPE_FALLBACK.md — project:name colon format rejected by server v1.21.0"
  - "capture-change.sh runs add-episode foreground (not backgrounded) — 10s hook-level timeout + 5s MCPClient timeout is acceptable latency"
  - "Frostgale migration SKIPPED — fallback scenario active; project scope isolation deferred until colon constraint resolved"
  - "session scope (session:TIMESTAMP) removed from session-summary.sh — colon in group_id would fail server validation"

patterns-established:
  - "Once-per-session warning pattern: PPID-based flag file in /tmp, cleaned on reboot"
  - "Hook error logging: timestamp + hook name prefix for easy grepping"

requirements-completed: [HOOK-02, HOOK-03]

duration: 3min
completed: 2026-03-17
---

# Phase 5 Plan 02: Hook Reliability - Error Propagation Summary

**Three write hooks rewritten with foreground execution, stderr error propagation, hook-errors.log logging, GRAPHITI_VERBOSE support, and once-per-session health warning — ending fire-and-forget silent failure mode**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T03:20:42Z
- **Completed:** 2026-03-17T03:23:51Z (Tasks 1-2 complete; awaiting Task 3 human-verify checkpoint)
- **Tasks:** 2 of 3 automated tasks complete (Task 3 is checkpoint:human-verify)
- **Files modified:** 4 (3 hook scripts + graphiti-helper.py — all in ~/.claude/graphiti/)

## Accomplishments

- Rewrote all three write hooks to run `add-episode` calls foreground (removed `2>/dev/null &` fire-and-forget pattern)
- Added `log_error()` function to all three hooks: writes to both stderr and `~/.claude/graphiti/hook-errors.log` with timestamp and hook name
- Replaced silent health check exit with once-per-session warning (`/tmp/graphiti-health-warned-${PPID}`) — first failure in session prints `[graphiti] Server unreachable`, subsequent calls stay silent
- Updated `graphiti-helper.py` `cmd_add_episode` to exit code 1 on failure (enables hook `if !` error capture) and print `[graphiti] Stored:` when `GRAPHITI_VERBOSE=1`
- Updated `graphiti-helper.py` `cmd_health_check` to print `[graphiti] Server unreachable — memory hooks disabled` instead of silently exiting 1
- Implemented global scope + `[project-name]` content prefix in all hooks per SCOPE_FALLBACK.md (colon constraint workaround)
- Verified full pipeline: diagnose.py 9/10 (Stage 8 FAIL — documented fallback), health-check.py healthy=True
- Verified error visibility: stopping container produces `[graphiti] Server unreachable — memory hooks disabled for this session` on stderr
- Verified verbose mode: `GRAPHITI_VERBOSE=1` produces `[graphiti] Stored: change-hook (global)` on successful write

## Task Commits

These tasks modified files in `~/.claude/graphiti/` which is outside the project git repository. Changes are tracked via planning artifacts only.

1. **Task 1: Rewrite all three write hooks** - `6c86434` (chore)
2. **Task 2: Frostgale migration skip + full verification** - `1469045` (chore)
3. **Task 3: Human-verify checkpoint** - awaiting user verification

**Plan metadata:** (see final docs commit)

## Files Created/Modified

- `~/.claude/graphiti/hooks/capture-change.sh` - Foreground add-episode, log_error, once-per-session warning, [project-name] prefix
- `~/.claude/graphiti/hooks/session-summary.sh` - Foreground add-episode, log_error, once-per-session warning, [project-name] prefix; removed session:TIMESTAMP scope (colon constraint)
- `~/.claude/graphiti/hooks/preserve-knowledge.sh` - Foreground add-episode, log_error, once-per-session warning, [project-name] prefix
- `~/.claude/graphiti/graphiti-helper.py` - cmd_add_episode: exit(1) on failure, GRAPHITI_VERBOSE support; cmd_health_check: prints messages on failure

## Decisions Made

1. **session scope removed from session-summary.sh**: The original script stored sessions in both `project:$PROJECT` scope and `session:$TIMESTAMP` scope. The session scope uses a colon (`:`) which is rejected by Graphiti v1.21.0. Since both scopes violate the format constraint and the fallback uses global scope, the session scope write was removed entirely. Global scope + `[project-name]` prefix is sufficient.

2. **capture-change.sh runs foreground**: Per CONTEXT.md, Claude has discretion. Chosen foreground because 10s hook-level timeout + 5s MCPClient timeout = worst case 5s delay, which is acceptable and allows error detection. Can revert to background if user reports latency issues.

3. **Frostgale migration skipped**: Pre-check condition not met — Plan 01 fallback triggered, Stage 8 FAIL. Re-storing episodes in `project:frostgale` would fail server validation for the same reason as `project:my-cc-setup`. No migration attempted.

## Deviations from Plan

None — plan executed exactly as written. The session scope removal was anticipated by the plan (which had already noted the colon constraint in SCOPE_FALLBACK.md). The Frostgale migration skip was explicitly directed by the plan's pre-check condition.

## Issues Encountered

**Session scope write removed from session-summary.sh**: The original session-summary.sh stored to both project scope AND `session:${TIMESTAMP}` scope. With the colon constraint, both fail server validation. The plan's session scope write was dropped — global scope + content prefix is used instead. This simplifies the hook while maintaining data capture capability.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All three hooks now propagate errors visibly — HOOK-02 and HOOK-03 requirements met
- User verification (Task 3 checkpoint) still needed to confirm live Claude Code session behavior
- After Task 3 approval: Phase 5 complete, Phase 6 (Session Management) ready to proceed
- hook-errors.log infrastructure in place — will capture errors when add-episode fails while server is healthy

---
*Phase: 05-hook-reliability*
*Completed: 2026-03-17*

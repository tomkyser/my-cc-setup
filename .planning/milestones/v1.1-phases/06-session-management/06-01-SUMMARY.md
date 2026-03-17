---
phase: 06-session-management
plan: 01
subsystem: infra
tags: [graphiti, sessions, cli, python, hooks, json-index]

requires:
  - phase: 05-hook-reliability
    provides: Reliable hooks with foreground execution, error propagation, log_error, once-per-session health warning, SCOPE_FALLBACK.md dash format

provides:
  - list-sessions subcommand with --project, --filter, --json, --all flags
  - view-session subcommand fetching content from Graphiti via get_episodes with global fallback
  - label-session subcommand with user label preservation (labeled_by tracking)
  - backfill-sessions subcommand scanning Graphiti for existing session summaries
  - index-session subcommand for atomic session index writes from hooks
  - sessions.json local index file created on first write
  - session-summary.sh writes index entry on every Stop event

affects: [06-session-management plan 02, session-auto-naming]

tech-stack:
  added: []
  patterns:
    - "Atomic JSON write: write to .tmp then rename to prevent corruption"
    - "sessions.json schema: array of {timestamp, project, label, labeled_by} entries"
    - "labeled_by field: 'auto' vs 'user' controls overwrite semantics"
    - "Auto-backfill: first list-sessions on missing index triggers Graphiti scan"

key-files:
  created:
    - ~/.claude/graphiti/sessions.json (created on first write at runtime)
  modified:
    - ~/.claude/graphiti/graphiti-helper.py
    - ~/.claude/graphiti/hooks/session-summary.sh

key-decisions:
  - "sessions.json uses labeled_by field ('auto'|'user') to control whether auto-naming can overwrite labels"
  - "index-session subcommand added as bridge for shell hooks to write JSON atomically without jq dependency"
  - "session-summary.sh always writes index entry even if Graphiti summary is empty -- ensures session is discoverable"
  - "Backfill uses search_memory_facts with 'session summary' query against global scope, parses 'Session summary (TIMESTAMP):' pattern"

patterns-established:
  - "Session index pattern: local JSON file for existence/metadata, Graphiti for content retrieval"
  - "User label preservation: check labeled_by before overwriting, never clobber user choices"
  - "Auto-backfill on first access: transparent index population without explicit user action"

requirements-completed: [SESS-01, SESS-02, SESS-03]

duration: 3min
completed: 2026-03-17
---

# Phase 6 Plan 01: Session Management Core Summary

**Five new graphiti-helper.py subcommands (list-sessions, view-session, label-session, backfill-sessions, index-session) with sessions.json local index and session-summary.sh hook integration**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T04:18:28Z
- **Completed:** 2026-03-17T04:21:50Z
- **Tasks:** 2
- **Files modified:** 2 (graphiti-helper.py, session-summary.sh -- both outside project repo)

## Accomplishments

- Added 5 new cmd_ functions to graphiti-helper.py (10 total), all registered with argparse subparsers
- list-sessions reads sessions.json with project filtering (auto-detect or explicit), label filtering, JSON output, and auto-backfill on empty/missing index
- view-session fetches session content from Graphiti via get_episodes with global-scope fallback via search_memory_facts
- label-session updates session labels with labeled_by=user, which are preserved against auto-overwrite
- backfill-sessions scans Graphiti global scope for existing session summaries and populates sessions.json
- index-session provides atomic session index writes from shell hooks without jq dependency
- session-summary.sh wired to call index-session on every Stop event, creating session entries regardless of whether Graphiti summary succeeded
- Atomic write pattern (tmp+rename) prevents sessions.json corruption if hook is killed mid-write

## Task Commits

Each task was committed atomically:

1. **Task 1: Add session management subcommands to graphiti-helper.py** - `968c551` (chore)
2. **Task 2: Wire session-summary.sh to write sessions.json entries** - `8418e58` (chore)

**Plan metadata:** (see final docs commit)

_Note: Modified files are outside the project git repo (~/.claude/graphiti/). Commits track planning artifacts._

## Files Created/Modified

- `~/.claude/graphiti/graphiti-helper.py` - Added _load_sessions, _save_sessions, SESSIONS_FILE constant, cmd_list_sessions, cmd_view_session, cmd_label_session, cmd_backfill_sessions, cmd_index_session
- `~/.claude/graphiti/hooks/session-summary.sh` - Added index-session call after Graphiti writes

## Decisions Made

1. **index-session as bridge subcommand**: The plan specified using graphiti-helper.py for atomic JSON writes from shell hooks. This avoids a jq dependency for JSON array manipulation and reuses the existing _load_sessions/_save_sessions helpers with atomic tmp+rename.

2. **Always index even if summary empty**: The index-session call in session-summary.sh runs outside the `if [ -n "$SUMMARY" ]` block, ensuring every session is discoverable in the index regardless of whether Haiku generated a summary.

3. **labeled_by semantics**: The `labeled_by` field controls overwrite behavior -- `"user"` labels are never overwritten by `"auto"` calls. This ensures manual labeling via label-session is permanent until the user explicitly changes it.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

- Plan 02 (session auto-naming) can proceed: sessions.json infrastructure is in place, labeled_by semantics support auto vs user distinction
- The empty label written by session-summary.sh is the hook point for Plan 02's auto-naming to fill in
- Backfill mechanism available if user has existing sessions from before this plan

## Self-Check: PASSED

All deliverables verified:
- `968c551` commit exists in git log (Task 1)
- `8418e58` commit exists in git log (Task 2)
- All 5 new subcommands respond to --help with exit 0
- 10 total cmd_ functions in graphiti-helper.py
- session-summary.sh contains index-session call
- list-sessions --json --all returns valid JSON array
- label preservation verified: user labels survive auto index-session calls

---
*Phase: 06-session-management*
*Completed: 2026-03-17*

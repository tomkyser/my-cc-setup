---
phase: 06-session-management
plan: 02
subsystem: infra
tags: [graphiti, sessions, haiku, auto-naming, openrouter, hooks]

requires:
  - phase: 06-session-management plan 01
    provides: sessions.json index, index-session subcommand, labeled_by semantics, _load_sessions/_save_sessions helpers

provides:
  - generate-session-name subcommand producing 3-5 word names via Haiku
  - Two-phase auto-naming (preliminary at first prompt, refined at session end)
  - Haiku prompt template in prompts.yaml for session name generation
  - Empty-label guard preventing overwrite of existing names with blank strings
  - User-label preservation across all auto-naming operations

affects: [07-verification-and-sync]

tech-stack:
  added: []
  patterns:
    - "Two-phase naming: preliminary name at first substantial prompt, refined name at session end from full summary"
    - "PPID-keyed flag file for once-per-session behavior in prompt-augment.sh"
    - "Haiku session naming via OpenRouter with word-extraction fallback when API unavailable"
    - "Empty-label guard: never overwrite non-empty label with empty string"

key-files:
  created: []
  modified:
    - ~/.claude/graphiti/graphiti-helper.py
    - ~/.claude/graphiti/curation/prompts.yaml
    - ~/.claude/graphiti/hooks/prompt-augment.sh
    - ~/.claude/graphiti/hooks/session-summary.sh

key-decisions:
  - "Two-phase naming ensures even abnormally terminated sessions get a name from the first prompt"
  - "Haiku (claude-haiku-4.5) used via OpenRouter for name generation at ~$0.001 per call"
  - "max_tokens: 30 keeps Haiku responses tight -- session names are 3-5 words"
  - "Fallback to first-5-words title-cased extraction when OPENROUTER_API_KEY is unset"
  - "Empty-label guard in index-session prevents refined naming from blanking preliminary names when summary is empty"

patterns-established:
  - "Session auto-naming pattern: generate-session-name -> index-session with generated label"
  - "Once-per-session flag: /tmp/graphiti-session-named-${PPID} prevents repeated naming"
  - "Graceful degradation: all naming calls wrapped in 2>/dev/null || true to avoid breaking hook flow"

requirements-completed: [SESS-04]

duration: 3min
completed: 2026-03-17
---

# Phase 6 Plan 02: Session Auto-Naming Summary

**Two-phase auto-naming via Haiku: generate-session-name subcommand, preliminary naming at first prompt in prompt-augment.sh, refined naming at session end in session-summary.sh, with fallback word extraction and user-label preservation**

## Performance

- **Duration:** ~3 min (across checkpoint boundary)
- **Started:** 2026-03-17T04:25:00Z
- **Completed:** 2026-03-17T04:30:50Z
- **Tasks:** 2 (1 implementation + 1 human-verify checkpoint)
- **Files modified:** 4 (graphiti-helper.py, prompts.yaml, prompt-augment.sh, session-summary.sh -- all outside project repo)

## Accomplishments

- Added generate_session_name() function and cmd_generate_session_name subcommand to graphiti-helper.py, calling Haiku via OpenRouter with 30-token limit and 0.3 temperature
- Added generate_session_name prompt template to curation/prompts.yaml with system and user templates for concise 3-5 word title-case names
- Wired preliminary naming into prompt-augment.sh: on first substantial prompt (>15 chars), generates name via Haiku and writes to sessions.json via index-session
- Wired refined naming into session-summary.sh: at session end, regenerates name from full summary text and overwrites preliminary name
- Added empty-label guard to cmd_index_session: never overwrites a non-empty label with an empty string (protects preliminary names when summary is empty)
- Fallback path: when OPENROUTER_API_KEY is unset, extracts first 5 words of text in title case
- All 10 end-to-end verification checks passed (list, JSON output, view, label, filter, user-label preservation, name generation, prompt-augment wiring, session-summary wiring, backfill)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement auto-naming with Haiku and wire into both hooks** - `d2f020b` (chore)
2. **Task 2: Verify session management end-to-end** - checkpoint:human-verify (approved, no commit needed)

**Plan metadata:** (see final docs commit)

_Note: Modified files are outside the project git repo (~/.claude/graphiti/). Commits track planning artifacts._

## Files Created/Modified

- `~/.claude/graphiti/graphiti-helper.py` - Added generate_session_name(), cmd_generate_session_name, argparse registration, empty-label guard in cmd_index_session
- `~/.claude/graphiti/curation/prompts.yaml` - Added generate_session_name prompt template (system + user)
- `~/.claude/graphiti/hooks/prompt-augment.sh` - Added preliminary session naming block with PPID-keyed flag file, log_error function, LOG_FILE/HOOK_NAME variables
- `~/.claude/graphiti/hooks/session-summary.sh` - Replaced empty-label index-session call with generate-session-name + labeled index-session

## Decisions Made

1. **Two-phase naming approach**: Preliminary name generated at first substantial prompt ensures even crashed/aborted sessions have a human-readable name. Refined name from full summary provides better quality for normally completed sessions.

2. **PPID-keyed flag file**: Uses `/tmp/graphiti-session-named-${PPID:-$$}` to detect "first prompt in session" -- all hooks from the same Claude Code process share a PPID, and OS cleans /tmp on reboot.

3. **Empty-label guard**: Added `if not label and existing.get("label"): return` to cmd_index_session so that when session-summary.sh generates an empty summary (and thus empty name), the preliminary name from prompt-augment.sh survives.

4. **Graceful degradation**: All naming calls use `2>/dev/null || true` so a Haiku API failure or timeout never blocks the prompt augmentation or session summary flow.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required. OPENROUTER_API_KEY is already configured from prior phases.

## Next Phase Readiness

- Phase 6 (Session Management) is fully complete: SESS-01 through SESS-04 all satisfied
- Phase 7 (Verification and Sync) can proceed: the memory system is now fully instrumented with diagnostics, reliable hooks, and navigable sessions
- All session management infrastructure (list, view, label, auto-name, backfill, index) is operational

## Self-Check: PASSED

All deliverables verified:
- `d2f020b` commit exists in git log (Task 1)
- All 4 modified files exist on disk (graphiti-helper.py, prompts.yaml, prompt-augment.sh, session-summary.sh)
- generate_session_name function present in graphiti-helper.py
- cmd_generate_session_name subcommand present in graphiti-helper.py
- generate_session_name prompt template present in prompts.yaml
- SESSION_NAMED_FLAG present in prompt-augment.sh
- generate-session-name call present in session-summary.sh
- Empty-label guard present in graphiti-helper.py

---
*Phase: 06-session-management*
*Completed: 2026-03-17*

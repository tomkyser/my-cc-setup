---
phase: 04-diagnostics
plan: 01
subsystem: infra
tags: [graphiti, neo4j, mcp, docker, memory, diagnostics, python]

requires:
  - phase: 04-diagnostics context
    provides: hypothesis list, canonical hook/helper references, phase scope definition

provides:
  - 10-stage pipeline probe script at ~/.claude/graphiti/diagnose.py
  - Confirmed root cause for DIAG-01 (silent write failures — NOT a real failure, 2>/dev/null is a risk)
  - Confirmed root cause for DIAG-02 (server-level GRAPHITI_GROUP_ID override forces all writes to global)
  - Evidence that project detection (my-cc-setup) is correct — iCloud path is not the issue
  - Evidence that the MCP API v1.21.0 lies: it echoes requested group_id in response message but stores as global

affects:
  - 04-02 (second diagnostics plan if any)
  - 05-hook-reliability (needs DIAG-01/DIAG-02 findings to know what to fix)
  - 06-session-management (depends on hooks working)

tech-stack:
  added: [httpx (already in venv), subprocess, uuid — used in diagnose.py]
  patterns:
    - "Stage-by-stage diagnostic probing: each stage independent, PASS/FAIL with full output"
    - "MCP HTTP transport replication: inline httpx calls mirror MCPClient without import side effects"
    - "Hook simulation without 2>/dev/null: capture_output=True in subprocess.run reveals suppressed errors"

key-files:
  created:
    - ~/.claude/graphiti/diagnose.py
    - .planning/phases/04-diagnostics/04-DIAGNOSTIC-REPORT.md
  modified: []

key-decisions:
  - "DIAG-01 root cause: NOT a traditional silent failure — hooks write successfully but 2>/dev/null is still a risk multiplier that must be removed"
  - "DIAG-02 root cause: GRAPHITI_GROUP_ID=global in docker-compose.yml overrides per-request group_id at the server level; MCP API v1.21.0 echoes the requested group_id in its response message but stores as global"
  - "Project name detection is correct: detect-project returns 'my-cc-setup' from git remote URL even from iCloud Drive path"
  - "Fix direction for DIAG-02: remove or clear GRAPHITI_GROUP_ID from docker-compose.yml and test whether server then respects per-request group_id values"

patterns-established:
  - "Diagnostic probe pattern: implement each stage as probe_X() returning (status, output), collect in results list, print structured report"
  - "Cross-check technique: compare get_episodes vs search_memory_facts for same group_id to detect server-side filter inconsistencies"

requirements-completed: [DIAG-01, DIAG-02]

duration: 6min
completed: 2026-03-17
---

# Phase 4 Plan 01: Diagnostics Summary

**10-stage pipeline probe identifies DIAG-02 root cause: server-level GRAPHITI_GROUP_ID=global override silently remaps all project-scoped writes to global scope despite API acknowledging the requested group_id**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-17T02:22:04Z
- **Completed:** 2026-03-17T02:28:00Z
- **Tasks:** 2 of 2
- **Files modified:** 2

## Accomplishments

- Built `~/.claude/graphiti/diagnose.py` — a standalone 10-stage pipeline probe that tests every component from Docker containers through MCP session initialization, global writes/reads, project-scoped writes/reads, and hook simulation
- Ran the probe and captured definitive evidence: 9/10 stages pass; stage 8 (project-scope read) fails with empty results despite stage 7 (project-scope write) reporting success
- Confirmed DIAG-01 finding: hook write pipeline (helper + hook simulation) works correctly with no stderr errors — `2>/dev/null` was suppressing nothing, but the pattern remains a future-failure risk
- Confirmed DIAG-02 root cause: server stores ALL episodes as `group_id='global'` regardless of requested group — cross-validated via `get_episodes` returning identical global episodes when queried for `project:my-cc-setup`
- Documented that MCP API v1.21.0 is misleading: it echoes `"queued for processing in group 'project:my-cc-setup'"` but stores with `group_id='global'`
- Created `04-DIAGNOSTIC-REPORT.md` with full evidence, root causes, and Phase 5 fix directions

## Task Commits

1. **Task 1: Build and run diagnostic probe script + Task 2: Document root causes** - `3a3d660` (feat)

**Plan metadata:** [to be committed with this SUMMARY]

## Files Created/Modified

- `~/.claude/graphiti/diagnose.py` — 10-stage pipeline diagnostic script (outside project git repo)
- `.planning/phases/04-diagnostics/04-DIAGNOSTIC-REPORT.md` — Root cause report with evidence

## Decisions Made

- Confirmed that project name detection is correct — `detect-project` returns `my-cc-setup` via git remote, not a mangled iCloud path
- Root cause for DIAG-02 identified at the server configuration level (`docker-compose.yml` `GRAPHITI_GROUP_ID=global`), not in graphiti-helper.py code
- The `2>/dev/null` suppression pattern is a risk but not the current root cause — hooks are actually writing successfully

## Deviations from Plan

### Extra investigation added

**[Rule 1 - Bug investigation] Cross-check with get_episodes to confirm server-level group_id override**
- **Found during:** Task 1, after stage 8 failed
- **Issue:** Stage 8 returned 0 facts but stage 7 write returned success message citing `project:my-cc-setup`. Needed to distinguish between async indexing delay vs. server-level scope override.
- **Fix:** Ran additional `get_episodes` and `search_memory_facts` queries cross-checking `project:my-cc-setup` vs `global` group IDs. Confirmed all stored episodes have `group_id='global'` regardless of what was requested.
- **Files modified:** None (investigation only, findings incorporated into report)
- **Verification:** `get_episodes` for `project:my-cc-setup` returns identical 10 global episodes; `search_memory_facts` for same scope returns 0 facts for content that exists in global
- **Committed in:** 3a3d660 (included in task commit)

---

**Total deviations:** 1 extra investigation step
**Impact on plan:** Strengthened evidence quality. Without the cross-check, stage 8 failure could have been attributed to async processing delay. The extra queries prove it is a permanent server-level scope override.

## Issues Encountered

- `~/.claude/graphiti/` has no git repository, so `diagnose.py` cannot be committed to version control via the project repo. The file exists at the expected path and functions correctly.

## User Setup Required

None — diagnostic is complete. No external service configuration changes needed for this plan. Phase 5 will make the changes indicated by the fix directions in `04-DIAGNOSTIC-REPORT.md`.

## Next Phase Readiness

- Phase 5 (Hook Reliability) has clear fix targets:
  1. Fix `docker-compose.yml` `GRAPHITI_GROUP_ID` configuration to enable project-scope isolation
  2. Remove `2>/dev/null` from all write hooks and add error logging
  3. Enhance health-check to perform canary write+read verification
  4. Consider whether async backgrounding (`&`) should be replaced with timeout-guarded foreground calls
- `diagnose.py` is reusable as a regression test after Phase 5 fixes are applied

---
*Phase: 04-diagnostics*
*Completed: 2026-03-17*

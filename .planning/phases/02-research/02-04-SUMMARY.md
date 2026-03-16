---
phase: 02-research
plan: 04
subsystem: memory
tags: [graphiti, neo4j, mcp, hooks, session-management, knowledge-graph]

# Dependency graph
requires:
  - phase: 01-methodology
    provides: Vetting protocol (4 gates, tier criteria) and anti-features list for gate evaluation

provides:
  - MEMO-01: Memory browsing interface approach comparison — Neo4j Browser recommended, mcp-neo4j-cypher eliminated (918 stars < 1,000 threshold), v2 flag when stars >= 1,000
  - MEMO-02: Session management visibility gap documented — no session listing exists, workarounds using project-scoped search, v2 flag for list_group_ids API
  - MEMO-03: Hook gap analysis — 9 gaps identified across 5 hooks, 3 closable via hooks, 3 via graphiti-helper.py, 3 blocked by CC API

affects: [phase-3-ranked-report, memory-tool-selection, hook-improvements-v1-v2]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ADR-style approach comparison: problem statement, approaches table, per-approach detail, recommendation, fallback"
    - "Gate evaluation inline within research documents: pre-filter then 4-gate sequence documented in full"
    - "Ideal-first gap analysis: define perfect system before diffing against current state"

key-files:
  created:
    - .planning/phases/02-research/memory/MEMO-01-BROWSING.md
    - .planning/phases/02-research/memory/MEMO-02-SESSIONS.md
    - .planning/phases/02-research/memory/MEMO-03-HOOK-GAPS.md
  modified: []

key-decisions:
  - "mcp-neo4j-cypher eliminated: 918 stars below community threshold of 1,000; re-evaluate when stars >= 1,000"
  - "Session listing is a documented gap: no list_group_ids endpoint in Graphiti API; workaround is project-scoped search"
  - "Hook Gap Tier 1: Bash error capture, semantic diffs on file changes, active task state at SessionStart are highest-value improvements"
  - "Gap 5 (error/failure capture) blocked by CC API: no PostToolError hook event exists; partial mitigation via Bash exit-code check"

patterns-established:
  - "Gate evaluation as part of research documents: run full gate sequence inline, document each gate result"
  - "Locked decision enforcement: explicitly document why custom builds are NOT VIABLE per constraint"
  - "Feasibility categorization for gaps: closable-hooks / closable-graphiti / blocked-CC-API"

requirements-completed: [MEMO-01, MEMO-02, MEMO-03]

# Metrics
duration: 6min
completed: 2026-03-16
---

# Phase 2 Plan 04: Memory System Research Summary

**ADR-style analysis of memory browsing, session visibility, and hook gaps — mcp-neo4j-cypher eliminated at Gate 1, session listing gap confirmed, 9 hook gaps identified with feasibility tiers**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-16T20:26:59Z
- **Completed:** 2026-03-16T20:33:00Z
- **Tasks:** 3 of 3
- **Files modified:** 3

## Accomplishments

- MEMO-01: Gate-evaluated mcp-neo4j-cypher (neo4j-contrib/mcp-neo4j) — 918 stars fails community threshold; Neo4j Browser at localhost:7475 documented as existing workaround; v2 re-evaluation flag set for when stars >= 1,000
- MEMO-02: Confirmed session listing gap — no `list_group_ids` endpoint exists in Graphiti MCP API; three workarounds documented (get_episodes, search_memory_facts, graphiti-helper.py); v2 flag for upstream contribution
- MEMO-03: Verified all 5 hook scripts against actual code; defined 12-event ideal system; identified 9 gaps with current-behavior/ideal/severity/impact for each; categorized by feasibility and prioritized Tier 1 improvements

## Task Commits

Each task was committed atomically:

1. **Task 1: Memory browsing interface (MEMO-01)** - `d461cbb` (feat)
2. **Task 2: Session management visibility (MEMO-02)** - `c12efbc` (feat)
3. **Task 3: Hook gap analysis (MEMO-03)** - `5a7de0c` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `.planning/phases/02-research/memory/MEMO-01-BROWSING.md` — 4 approaches compared, mcp-neo4j-cypher gate-evaluated (ELIMINATED), recommendation: Neo4j Browser
- `.planning/phases/02-research/memory/MEMO-02-SESSIONS.md` — 3 viable workarounds, 1 NOT VIABLE (custom command), gap documented, v2 flag
- `.planning/phases/02-research/memory/MEMO-03-HOOK-GAPS.md` — 5 hooks verified, ideal system defined, 9 gaps with feasibility categorization

## Decisions Made

- **mcp-neo4j-cypher star count:** 918 at assessment time (2026-03-16). The `neo4j-contrib` org is classified as community (not official vendor) per vetting protocol, requiring 1,000 stars. Fails by 82 stars. Noted: recency (21 days) and self-management (uvx-based) would both pass.
- **Session listing as gap, not workaround gap:** The issue is at the API level — Graphiti MCP has no `list_group_ids` endpoint. This is a first-class gap, not a documentation issue.
- **Hook Gap Tier 1 = Bash errors + semantic diffs + task state:** These three improvements address the most material daily-use information loss: failed commands, what changed in files, and continuity between sessions.
- **`capture-change.sh` stores only file path:** Verified against actual script — the episode text is literally `"File Write: /path/to/file"` with no content or context. This is intentionally lightweight but limits utility.

## Deviations from Plan

None — plan executed exactly as written. The preliminary gap list in 02-RESEARCH.md identified 7 gaps; actual hook code review confirmed those 7 and surfaced 2 additional gaps (active task state at SessionStart, semantic diff on file changes), for a total of 9. This is an expected research refinement, not a deviation.

## Issues Encountered

- graphiti-helper.py requires venv Python (`~/.claude/graphiti/.venv/bin/python3`) — the system `python3` lacks the `httpx` dependency. This is expected and documented in MEMO-02 (approach detail section for graphiti-helper).

## User Setup Required

None — no external service configuration required. Research and documentation only.

## Next Phase Readiness

- MEMO-01, MEMO-02, MEMO-03 feed into Phase 3 ranked report memory section
- Key Phase 3 inputs: mcp-neo4j-cypher is ELIMINATED but flagged for v2 re-evaluation; no new memory tool enters the final 5-8 tool list from this research
- Hook gap recommendations (Tier 1: Bash errors, semantic diffs, task state) are implementable post-Phase 3 without new tool installation
- Blockers: None

---

*Phase: 02-research*
*Completed: 2026-03-16*

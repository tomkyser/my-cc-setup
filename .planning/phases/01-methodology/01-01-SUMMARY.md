---
phase: 01-methodology
plan: 01
subsystem: infra
tags: [vetting-protocol, anti-features, mcp-assessment, methodology]

requires: []

provides:
  - "VETTING-PROTOCOL.md: 4 binary hard gates, scorecard template, INCLUDE/CONSIDER/DEFER tier criteria"
  - "ANTI-FEATURES.md: 7 named exclusions with justifications, 4 category rules, Not Evaluated section"
affects:
  - phase-02-assessments
  - phase-03-report

tech-stack:
  added: []
  patterns:
    - "Decision tree gate structure: 4 binary pass/fail gates applied sequentially"
    - "Tiered thresholds by publisher type (vendor/established-org/community)"
    - "Two-part anti-features document: named list for O(1) lookup + category rules for unlisted tools"
    - "Scorecard template where every field is answerable by CLI command, URL, or protocol rule"

key-files:
  created:
    - .planning/phases/01-methodology/VETTING-PROTOCOL.md
    - .planning/phases/01-methodology/ANTI-FEATURES.md
  modified: []

key-decisions:
  - "Pre-defined INCLUDE/CONSIDER/DEFER tier criteria in Phase 1 so Phase 2 assessors assign tiers at assessment time — makes Phase 3 a tabulation, not a deliberation"
  - "Separate Not Evaluated section from anti-features list — out-of-scope tools are not anti-features; distinction prevents misclassification"
  - "Security findings are informational only, not a hard gate — mcp-scan results documented for user decision in Phase 3 report"
  - "SSE transport is a flagged risk, not a hard disqualification gate — tool is still assessed, risk documented for user decision"
  - "Community forks assessed case-by-case, not blanket-excluded — but official server preferred when it meets all gates"

patterns-established:
  - "Gate 1 (Stars): Tiered by publisher — 100 (official vendor), 500 (established org), 1000 (community)"
  - "Gate 2 (Recency): Graduated — <=30 preferred, 31-90 acceptable with justification note, >90 hard fail"
  - "Gate 3 (Self-management): All 4 ops (Install/Configure/Update/Troubleshoot) must have documented commands"
  - "Gate 4 (CC Duplication): Tool eliminated if it replicates CC built-in with no additional value"
  - "Anti-feature entry format: Category + 3-sentence justification (what, why appealing, why excluded)"

requirements-completed: [INFR-01, INFR-02]

duration: 3min
completed: 2026-03-16
---

# Phase 1 Plan 1: Methodology Summary

**Binary vetting protocol with 4 tiered hard gates and a 7-entry anti-features exclusion list that enable judgment-free Phase 2 tool assessments**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T19:21:00Z
- **Completed:** 2026-03-16T19:24:23Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- VETTING-PROTOCOL.md with 4 binary hard gates, copy-paste scorecard template, and pre-defined INCLUDE/CONSIDER/DEFER tier criteria — a Phase 2 assessor can evaluate any MCP by following the decision tree without judgment calls on hard gates
- ANTI-FEATURES.md with 7 named exclusion entries (each with 3-sentence justification), 4 category rules for classifying unlisted tools, and a separate "Not Evaluated" section for out-of-scope tools — a Phase 2 researcher can check whether any tool is pre-excluded in O(1)
- Both documents cross-reference each other: ANTI-FEATURES.md references VETTING-PROTOCOL.md for gate definitions and community fork policy; VETTING-PROTOCOL.md scorecard template notes the pre-filter step

## Task Commits

Each task was committed atomically:

1. **Task 1: Write VETTING-PROTOCOL.md** - `de578d5` (feat)
2. **Task 2: Write ANTI-FEATURES.md** - `7e6eac8` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `.planning/phases/01-methodology/VETTING-PROTOCOL.md` - 4 hard gates, scorecard template, tier criteria, SSE notice, community fork policy
- `.planning/phases/01-methodology/ANTI-FEATURES.md` - 7 named exclusions, 4 category rules, Not Evaluated section

## Decisions Made

- Pre-defined INCLUDE/CONSIDER/DEFER tier criteria in Phase 1 (rather than leaving to Phase 3) — directly satisfies the "no judgment calls" success criterion; makes Phase 3 a tabulation of pre-made tier assignments
- Used a separate "Not Evaluated" section for out-of-scope tools (Jira, Notion, Atlassian, Database MCPs) rather than listing them as anti-features — preserves semantic accuracy: anti-features are tools that look appealing but have concrete disqualifying reasons; out-of-scope tools were never candidates
- Security findings kept informational only, not a hard gate — consistent with CONTEXT.md locked decision; mcp-scan results documented for user decision at Phase 3

## Deviations from Plan

None — plan executed exactly as written. All content sourced from existing research documents (CONTEXT.md, RESEARCH.md, FEATURES.md, SUMMARY.md, PITFALLS.md, REQUIREMENTS.md) without invention.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. Both deliverables are documentation files.

## Next Phase Readiness

Phase 2 tool assessments can now begin. Both deliverables are complete and ready for use:
- VETTING-PROTOCOL.md: Apply Gate 1 → Gate 2 → Gate 3 → Gate 4 → Scorecard for each candidate
- ANTI-FEATURES.md: Check named list first; fall through to category rules for unlisted tools

No blockers. The three concerns tracked in STATE.md remain: Context7 PHP/WP coverage depth, GitHub PAT minimum scope, and WP 7.0 timeline — all deferred to Phase 2 assessment as planned.

## Self-Check: PASSED

- FOUND: `.planning/phases/01-methodology/VETTING-PROTOCOL.md`
- FOUND: `.planning/phases/01-methodology/ANTI-FEATURES.md`
- FOUND: `.planning/phases/01-methodology/01-01-SUMMARY.md`
- FOUND commit: `de578d5` (Task 1 — VETTING-PROTOCOL.md)
- FOUND commit: `7e6eac8` (Task 2 — ANTI-FEATURES.md)

---
*Phase: 01-methodology*
*Completed: 2026-03-16*

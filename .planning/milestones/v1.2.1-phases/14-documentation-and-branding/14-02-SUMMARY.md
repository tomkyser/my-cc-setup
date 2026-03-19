---
phase: 14-documentation-and-branding
plan: 02
subsystem: documentation
tags: [claude-md, project-md, architecture-decisions, cli-reference, troubleshooting]

# Dependency graph
requires:
  - phase: 14-01
    provides: README rewrite establishing documentation patterns
  - phase: 12
    provides: CLI commands, toggle mechanism, 3-directory architecture
  - phase: 13
    provides: Clean codebase with legacy removed
provides:
  - Complete CLAUDE.md template with 20+ CLI commands, troubleshooting, maintenance, component scope
  - PROJECT.md with 19 structured architecture decision records
affects: [14-03-codebase-maps, 15-update-system, future-claude-sessions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Categorized command tables (Memory, Session, System, Diagnostics) in CLAUDE.md"
    - "Structured decision record format (Context/Alternatives/Constraints/Implications) in PROJECT.md"

key-files:
  created: []
  modified:
    - claude-config/CLAUDE.md.template
    - .planning/PROJECT.md

key-decisions:
  - "All 20+ CLI commands included in CLAUDE.md grouped by category rather than flat list"
  - "19 decision blocks in PROJECT.md (3 more than the 16 minimum) covering v1.0 through v1.2.1"
  - "Repo rename marked as Done in Key Decisions table"

patterns-established:
  - "Decision record format: Context, Alternatives Considered, Constraints, Downstream Implications"
  - "CLAUDE.md command grouping by category with 'Use When' column"

requirements-completed: [STAB-04, STAB-06]

# Metrics
duration: 4min
completed: 2026-03-18
---

# Phase 14 Plan 02: CLAUDE.md + PROJECT.md Expansion Summary

**CLAUDE.md template expanded with 20+ categorized CLI commands, troubleshooting/maintenance/component-scope sections, and all stale shell script references removed; PROJECT.md expanded with 19 structured architecture decision records covering v1.0 through v1.2.1**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-18T21:36:00Z
- **Completed:** 2026-03-18T21:40:42Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- CLAUDE.md template expanded from 12 commands in a flat table to 20+ commands grouped into 4 categories (Memory, Session, System, Diagnostics)
- Added Troubleshooting section with 6 common issues and fixes (disabled error, stack start, stale sessions, hook errors, health failures, memory persistence)
- Added Maintenance section with update, version check, config change, and stack management instructions
- Added Component Architecture section with Dynamo/Ledger/Switchboard scope boundaries
- Added Output Behavior section documenting stderr/stdout conventions
- Removed stale `~/.claude/graphiti/start-graphiti.sh` and `stop-graphiti.sh` references
- PROJECT.md expanded with 19 structured decision blocks (3 more than the 16 minimum)
- Repo rename decision marked as Done (was Pending)
- Context section updated to reflect Phase 13 complete, Phase 14 in progress

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand CLAUDE.md template with complete operational instructions** - `8b00a17` (docs)
2. **Task 2: Expand PROJECT.md with structured architecture decision records** - `895338d` (docs)

## Files Created/Modified
- `claude-config/CLAUDE.md.template` - Complete operational reference for Claude Code with all CLI commands, troubleshooting, maintenance, component scope
- `.planning/PROJECT.md` - Architecture decision records with full Context/Alternatives/Constraints/Implications format for 19 decisions

## Decisions Made
- Included all 20+ commands in CLAUDE.md rather than just the memory-focused subset, since STAB-04 requires "complete operational instructions"
- Added 3 additional decisions beyond the 16 specified in the plan (Insert v1.2.1, Branch rename, Structural refactors ordering) for completeness
- Grouped commands by category (Memory, Session, System, Diagnostics) rather than keeping the original flat table

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CLAUDE.md template is now a complete operational reference for Claude Code self-management
- PROJECT.md has full architecture decision context for development continuity
- Ready for 14-03 (codebase map refresh) which will reference the same source-of-truth codebase these docs describe

## Self-Check: PASSED

- All files exist (CLAUDE.md.template, PROJECT.md, 14-02-SUMMARY.md)
- All commits verified (8b00a17, 895338d)

---
*Phase: 14-documentation-and-branding*
*Completed: 2026-03-18*

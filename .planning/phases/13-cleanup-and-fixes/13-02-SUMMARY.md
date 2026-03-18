---
phase: 13-cleanup-and-fixes
plan: 02
subsystem: infra
tags: [neo4j, docker, port-mapping, cleanup]

requires:
  - phase: 13-01
    provides: Legacy files removed from repo, safe to clean stale references
provides:
  - Neo4j admin browser accessible at localhost:7475 via Bolt port fix
  - Stale legacy references cleaned from active CJS code
  - README deprecation notice directing users to Dynamo CLI
affects: [14-documentation]

tech-stack:
  added: []
  patterns: [toggle-off/toggle-on safe restart for Docker changes]

key-files:
  created: []
  modified:
    - ledger/graphiti/docker-compose.yml
    - dynamo/core.cjs
    - README.md

key-decisions:
  - "Used dynamo sync repo-to-live --force to update deployed CLI before toggle command"
  - "Added .last-sync to root .gitignore (dynamo sync creates it at repo root)"
  - "Provenance comments changed to past tense rather than removed entirely"
  - "README gets minimal deprecation notice only — full rewrite is Phase 14"

patterns-established:
  - "Safe Docker restart: toggle off → stop → sync/copy → start → toggle on"

requirements-completed: [STAB-07, STAB-02]

duration: 5min
completed: 2026-03-18
---

# Phase 13-02: Neo4j Port Fix + Cleanup Summary

**Neo4j Bolt port remapped from 7688→7687, stale legacy references cleaned from core.cjs, README deprecation notice added**

## Performance

- **Duration:** ~5 min
- **Tasks:** 3 (2 automated + 1 human checkpoint)
- **Files modified:** 4

## Accomplishments
- Neo4j admin browser now accessible at localhost:7475 with working Bolt connection
- Docker stack healthy after restart with correct port mapping (7687:7687)
- Provenance comments in core.cjs updated to past tense (legacy Python files removed)
- README.md has deprecation notice directing users to Dynamo CLI
- No stale legacy path references remain in active CJS code

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Bolt port mapping and restart Docker stack** - `f73dcea` (fix)
2. **Task 2: Clean stale legacy references and add README deprecation notice** - `d4e4a65` (chore)
3. **Task 3: Verify Neo4j browser and knowledge graph visibility** - human checkpoint (approved)

## Files Created/Modified
- `ledger/graphiti/docker-compose.yml` - Bolt port remapped from 7688:7687 to 7687:7687
- `dynamo/core.cjs` - Provenance comments updated to past tense
- `README.md` - Deprecation notice added at top
- `.gitignore` - Added .last-sync entry

## Decisions Made
- Used repo-version dynamo.cjs for toggle command since deployed version was out of date, then synced
- Added `.last-sync` to `.gitignore` since `dynamo sync` creates it at repo root
- Provenance comments kept but changed to past tense (preserves history without stale line refs)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Dynamo toggle not available in deployed CLI**
- **Found during:** Task 1 (Docker restart)
- **Issue:** Deployed `~/.claude/dynamo/dynamo.cjs` was out of date, missing `toggle` command
- **Fix:** Used repo version (`dynamo/dynamo.cjs`) instead, then synced via `dynamo sync repo-to-live --force`
- **Verification:** `dynamo status` and `dynamo toggle` commands work after sync

**2. [Rule 3 - Blocking] .last-sync file created at repo root**
- **Found during:** Task 1 (dynamo sync)
- **Issue:** `dynamo sync` created `.last-sync` at repo root, `.gitignore` only had `graphiti/.last-sync`
- **Fix:** Added `.last-sync` to root `.gitignore`
- **Verification:** `git status` shows clean after commit

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for execution. No scope creep.

## Issues Encountered
- 4 pre-existing test failures documented in `deferred-items.md` — not caused by Phase 13 changes

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Neo4j browser accessible for knowledge graph visibility
- All legacy artifacts removed and archived
- Ready for Phase 14 (documentation rewrite)

---
*Phase: 13-cleanup-and-fixes*
*Completed: 2026-03-18*

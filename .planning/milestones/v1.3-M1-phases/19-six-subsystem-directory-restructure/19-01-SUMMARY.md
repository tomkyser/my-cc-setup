---
phase: 19-six-subsystem-directory-restructure
plan: 01
subsystem: infra
tags: [resolver, layout, restructure, cjs, lib]

# Dependency graph
requires:
  - phase: 18-restructure-prerequisites
    provides: lib/resolve.cjs centralized resolver with 8-subsystem layout map
provides:
  - lib/layout.cjs as unified layout source of truth (ARCH-04)
  - lib/core.cjs shared substrate (moved from dynamo/)
  - lib/scope.cjs shared constants (moved from ledger/)
  - lib/pretty.cjs shared formatters (moved from switchboard/)
  - All production files updated to resolve('lib', 'core.cjs')
affects: [19-02, 19-03, sync, install, deploy]

# Tech tracking
tech-stack:
  added: []
  patterns: [layout.cjs single source of truth for paths, shared substrate in lib/]

key-files:
  created: [lib/layout.cjs]
  modified: [lib/resolve.cjs, lib/core.cjs, lib/scope.cjs, lib/pretty.cjs, dynamo/dynamo.cjs, dynamo/hooks/dynamo-hooks.cjs, ledger/search.cjs, ledger/episodes.cjs, ledger/sessions.cjs, ledger/mcp-client.cjs, ledger/curation.cjs, ledger/hooks/session-start.cjs, ledger/hooks/prompt-augment.cjs, ledger/hooks/capture-change.cjs, ledger/hooks/preserve-knowledge.cjs, ledger/hooks/session-summary.cjs, switchboard/install.cjs, switchboard/sync.cjs, switchboard/health-check.cjs, switchboard/diagnose.cjs, switchboard/verify-memory.cjs, switchboard/stack.cjs, switchboard/stages.cjs, switchboard/update.cjs, switchboard/update-check.cjs]

key-decisions:
  - "core.cjs bootstrap simplified to require('./resolve.cjs') since both now live in lib/"
  - "detectLayout() left unchanged for this prep wave -- deployed marker still works for existing installs"
  - "scope.cjs re-export in core.cjs updated to resolve('lib', 'scope.cjs')"

patterns-established:
  - "Pattern: lib/layout.cjs getLayoutPaths(root) as single source of truth for subsystem path maps"
  - "Pattern: lib/ directory as shared substrate for cross-subsystem utilities"

requirements-completed: [ARCH-04]

# Metrics
duration: 6min
completed: 2026-03-19
---

# Phase 19 Plan 01: Prep Wave Summary

**lib/layout.cjs extracted as unified layout source of truth; core.cjs, scope.cjs, pretty.cjs moved to lib/ shared substrate with all 21 production files and 7 test files updated**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-20T01:04:29Z
- **Completed:** 2026-03-20T01:10:52Z
- **Tasks:** 2
- **Files modified:** 33

## Accomplishments
- Created lib/layout.cjs with getLayoutPaths() and getSyncPairs() as single source of truth for path definitions (ARCH-04)
- Moved core.cjs, scope.cjs, pretty.cjs to lib/ via git mv preserving rename detection and blame history
- Updated all 21 production files from resolve('dynamo', 'core.cjs') to resolve('lib', 'core.cjs')
- Updated all path.join(__dirname, ...) references to moved files to use the resolver
- 400 tests, 399 pass, 0 fail, 1 skip (2 new tests added for scope.cjs and pretty.cjs resolution)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lib/layout.cjs and refactor resolve.cjs** - `a51ed26` (feat)
2. **Task 2: Move core.cjs, scope.cjs, pretty.cjs to lib/ and update all references** - `17bba00` (refactor)

## Files Created/Modified
- `lib/layout.cjs` - New unified layout source of truth with getLayoutPaths() and getSyncPairs()
- `lib/resolve.cjs` - Refactored repo branch to consume layout.cjs
- `lib/core.cjs` - Moved from dynamo/core.cjs; bootstrap simplified to require('./resolve.cjs')
- `lib/scope.cjs` - Moved from ledger/scope.cjs
- `lib/pretty.cjs` - Moved from switchboard/pretty.cjs
- `dynamo/dynamo.cjs` - All path.join(__dirname, 'core.cjs') replaced with resolve('lib', 'core.cjs')
- `dynamo/hooks/dynamo-hooks.cjs` - Updated core.cjs resolve path
- `ledger/*.cjs` (6 files) - Updated core.cjs resolve path
- `ledger/hooks/*.cjs` (5 files) - Updated core.cjs and scope.cjs resolve paths
- `switchboard/*.cjs` (9 files) - Updated core.cjs and pretty.cjs resolve paths
- `dynamo/tests/resolve.test.cjs` - Updated test for lib/core.cjs, added scope.cjs and pretty.cjs tests
- `dynamo/tests/{toggle,core,regression,boundary,circular-deps}.test.cjs` - Updated paths to moved files
- `dynamo/tests/ledger/scope.test.cjs` - Updated path to lib/scope.cjs

## Decisions Made
- core.cjs bootstrap require simplified from dual-layout conditional to `require('./resolve.cjs')` since both are now in lib/
- detectLayout() left unchanged for this prep wave -- the existing `core.cjs` deployed marker still works for existing installs; will be cleaned up in Plan 02
- scope.cjs re-export path in core.cjs updated from resolve('ledger', 'scope.cjs') to resolve('lib', 'scope.cjs')
- layout.cjs uses pre-migration paths (dynamo/, ledger/, switchboard/) -- will be updated to target paths in Plan 02

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated 7 test files referencing moved file paths**
- **Found during:** Task 2 (test suite run)
- **Issue:** Test files used hardcoded paths to dynamo/core.cjs, ledger/scope.cjs that broke after git mv
- **Fix:** Updated require paths in toggle.test.cjs, core.test.cjs, regression.test.cjs, boundary.test.cjs, circular-deps.test.cjs, resolve.test.cjs, scope.test.cjs
- **Files modified:** 7 test files
- **Verification:** Full test suite 400 tests, 0 failures
- **Committed in:** 17bba00 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Test path updates were necessary consequence of file moves. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- lib/ shared substrate fully established with layout.cjs, resolve.cjs, dep-graph.cjs, core.cjs, scope.cjs, pretty.cjs
- Plan 02 (Wave 2) can now create subsystems/*, cc/*, move all remaining files, and update layout.cjs path map
- All resolve() calls already use resolve('lib', 'core.cjs') so Wave 2 only needs to update bootstrap require depths and layout map

---
*Phase: 19-six-subsystem-directory-restructure*
*Completed: 2026-03-19*

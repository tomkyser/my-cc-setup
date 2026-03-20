# Phase 20: Deferred Items

## Uncommitted Plan 20-01 Changes

**Found during:** Plan 20-02, Task 2 verification
**Files affected:**
- `subsystems/terminus/health-check.cjs` (adds 7th stage for Node.js version)
- `dynamo/tests/switchboard/health-check.test.cjs` (updates stage count expectations to 7)
- `dynamo/tests/switchboard/stages.test.cjs` (adds stageNodeVersion to export/function counts)

**Issue:** These files were modified as part of Plan 20-01 (commit `0dd9dce` added `stageNodeVersion` to `stages.cjs`) but the corresponding health-check integration and test updates were never committed. This causes 1 test failure in the health-check test suite (`passed counts non-SKIP stages with OK or WARN; total counts non-SKIP stages`).

**Resolution:** These uncommitted changes should be committed as a follow-up to complete Plan 20-01's work. They are consistent and correct -- they just need to be staged and committed.

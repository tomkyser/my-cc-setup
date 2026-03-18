---
phase: 13
slug: cleanup-and-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` (v24.13.1) |
| **Config file** | None needed -- uses `--test` flag |
| **Quick run command** | `node --test dynamo/tests/*.test.cjs` |
| **Full suite command** | `node --test dynamo/tests/*.test.cjs dynamo/tests/ledger/*.test.cjs dynamo/tests/switchboard/*.test.cjs` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test dynamo/tests/*.test.cjs`
- **After every plan wave:** Run `node --test dynamo/tests/*.test.cjs dynamo/tests/ledger/*.test.cjs dynamo/tests/switchboard/*.test.cjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | STAB-02 | smoke | `test ! -d graphiti/ && test ! -f install.sh && test ! -f sync-graphiti.sh && echo PASS` | N/A | ⬜ pending |
| 13-01-02 | 01 | 1 | STAB-02 | smoke | `git tag -l v1.2-legacy-archive \| grep -q v1.2-legacy-archive && echo PASS` | N/A | ⬜ pending |
| 13-01-03 | 01 | 1 | STAB-02 | smoke | `ls ~/.claude/graphiti-legacy/graphiti-helper.py && echo PASS` | N/A | ⬜ pending |
| 13-01-04 | 01 | 1 | STAB-02 | smoke | `test -f ledger/graphiti/docker-compose.yml && test -f ledger/graphiti/start-graphiti.sh && echo PASS` | N/A | ⬜ pending |
| 13-02-01 | 02 | 1 | STAB-07 | smoke | `grep '"7687:7687"' ledger/graphiti/docker-compose.yml && echo PASS` | N/A | ⬜ pending |
| 13-02-02 | 02 | 1 | STAB-07 | integration | `curl -sf http://localhost:7475 > /dev/null && echo PASS` | N/A | ⬜ pending |
| 13-02-03 | 02 | 1 | STAB-07 | integration | `node ~/.claude/dynamo/dynamo.cjs health-check --format json` | Yes | ⬜ pending |
| 13-ALL | ALL | ALL | ALL | regression | `node --test dynamo/tests/*.test.cjs` | Yes (94 tests) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Phase 13 does not add new CJS code, so no new test files are needed. Verification is primarily smoke tests (file existence/absence) and live service checks.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Neo4j browser displays graph contents | STAB-07 | Requires visual confirmation of graph data rendering | 1. Open http://localhost:7475 2. Run `MATCH (n) RETURN n LIMIT 25` 3. Verify nodes and relationships render |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

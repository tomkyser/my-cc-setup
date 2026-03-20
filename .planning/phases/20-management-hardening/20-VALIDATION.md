---
phase: 20
slug: management-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in, Node.js 22+) |
| **Config file** | none — node:test needs no config |
| **Quick run command** | `node --test dynamo/tests/*.test.cjs` |
| **Full suite command** | `node --test dynamo/tests/*.test.cjs dynamo/tests/ledger/*.test.cjs dynamo/tests/switchboard/*.test.cjs` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test dynamo/tests/*.test.cjs dynamo/tests/ledger/*.test.cjs dynamo/tests/switchboard/*.test.cjs`
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | MGMT-01 | unit | `node --test dynamo/tests/switchboard/health-check.test.cjs` | ✅ (needs update) | ⬜ pending |
| 20-01-02 | 01 | 1 | MGMT-01 | unit | `node --test dynamo/tests/switchboard/install.test.cjs` | ✅ (needs update) | ⬜ pending |
| 20-02-01 | 02 | 1 | MGMT-08a | unit | `node --test dynamo/tests/ledger/dispatcher.test.cjs` | ✅ (needs update) | ⬜ pending |
| 20-02-02 | 02 | 1 | MGMT-08b | unit | `node --test dynamo/tests/ledger/dispatcher.test.cjs` | ✅ (needs update) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Updated `dynamo/tests/switchboard/health-check.test.cjs` — stage count assertion update (6 → 7)
- [ ] New validation tests in `dynamo/tests/ledger/dispatcher.test.cjs` — malformed JSON, field length, boundary wrapping

*Existing infrastructure covers remaining phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Boundary markers visible in Claude Code session | MGMT-08b | Requires live Claude Code session to observe injected context | Start new session, check `[GRAPHITI MEMORY CONTEXT]` output has boundary wrapper |
| Node.js version warning displays during install | MGMT-01 | Requires running install against live `~/.claude/dynamo/` | Run `dynamo install`, verify version check output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---
phase: 23
slug: foundation-and-routing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x / node:test (built-in) |
| **Config file** | none — Wave 0 installs if needed |
| **Quick run command** | `node --test tests/reverie/` |
| **Full suite command** | `node --test tests/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/reverie/`
- **After every plan wave:** Run `node --test tests/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 1 | FLAG-01 | unit | `node --test tests/reverie/config.test.cjs` | ❌ W0 | ⬜ pending |
| 23-01-02 | 01 | 1 | FLAG-03 | unit | `node --test tests/reverie/config.test.cjs` | ❌ W0 | ⬜ pending |
| 23-02-01 | 02 | 1 | IV-01 | unit | `node --test tests/reverie/state.test.cjs` | ❌ W0 | ⬜ pending |
| 23-02-02 | 02 | 1 | IV-03 | unit | `node --test tests/reverie/state.test.cjs` | ❌ W0 | ⬜ pending |
| 23-03-01 | 03 | 1 | IV-02 | unit | `node --test tests/reverie/activation.test.cjs` | ❌ W0 | ⬜ pending |
| 23-03-02 | 03 | 1 | IV-04 | unit | `node --test tests/reverie/activation.test.cjs` | ❌ W0 | ⬜ pending |
| 23-03-03 | 03 | 1 | IV-10 | unit | `node --test tests/reverie/activation.test.cjs` | ❌ W0 | ⬜ pending |
| 23-04-01 | 04 | 2 | HOOK-01 | unit | `node --test tests/reverie/dispatcher.test.cjs` | ❌ W0 | ⬜ pending |
| 23-04-02 | 04 | 2 | HOOK-02 | unit | `node --test tests/reverie/dispatcher.test.cjs` | ❌ W0 | ⬜ pending |
| 23-04-03 | 04 | 2 | HOOK-03 | unit | `node --test tests/reverie/dispatcher.test.cjs` | ❌ W0 | ⬜ pending |
| 23-05-01 | 05 | 2 | OPS-MON-01 | unit | `node --test tests/reverie/ops-monitor.test.cjs` | ❌ W0 | ⬜ pending |
| 23-05-02 | 05 | 2 | OPS-MON-02 | unit | `node --test tests/reverie/ops-monitor.test.cjs` | ❌ W0 | ⬜ pending |
| 23-05-03 | 05 | 2 | IV-12 | unit | `node --test tests/reverie/ops-monitor.test.cjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/reverie/config.test.cjs` — stubs for FLAG-01, FLAG-03
- [ ] `tests/reverie/state.test.cjs` — stubs for IV-01, IV-03
- [ ] `tests/reverie/activation.test.cjs` — stubs for IV-02, IV-04, IV-10
- [ ] `tests/reverie/dispatcher.test.cjs` — stubs for HOOK-01, HOOK-02, HOOK-03
- [ ] `tests/reverie/ops-monitor.test.cjs` — stubs for OPS-MON-01, OPS-MON-02, IV-12

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Classic mode behavioral identity | Success Criteria 2 | Requires full hook pipeline execution | Set mode=classic, run a full Claude Code session, verify no output change |
| Cortex mode pass-through identity | Success Criteria 3 | Requires full hook pipeline execution | Set mode=cortex, run same session, diff output against classic |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---
phase: 24
slug: cognitive-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` (no external dependency) |
| **Config file** | none — built-in; no jest.config or similar |
| **Quick run command** | `node --test dynamo/tests/reverie/*.test.cjs` |
| **Full suite command** | `node --test dynamo/tests/**/*.test.cjs` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test dynamo/tests/reverie/*.test.cjs`
- **After every plan wave:** Run `node --test dynamo/tests/**/*.test.cjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | IV-05 | unit | `node --test dynamo/tests/reverie/inner-voice.test.cjs` | ❌ W0 | ⬜ pending |
| 24-01-02 | 01 | 1 | IV-06 | unit | `node --test dynamo/tests/reverie/state.test.cjs` | ✅ extend | ⬜ pending |
| 24-01-03 | 01 | 1 | IV-07 | unit | `node --test dynamo/tests/reverie/curation.test.cjs` | ❌ W0 | ⬜ pending |
| 24-01-04 | 01 | 1 | IV-08 | unit | `node --test dynamo/tests/reverie/inner-voice.test.cjs` | ❌ W0 | ⬜ pending |
| 24-01-05 | 01 | 1 | IV-09 | unit | `node --test dynamo/tests/reverie/dual-path.test.cjs` | ❌ W0 | ⬜ pending |
| 24-01-06 | 01 | 1 | IV-11 | unit | `node --test dynamo/tests/reverie/dual-path.test.cjs` | ❌ W0 | ⬜ pending |
| 24-02-01 | 02 | 1 | PATH-01 | unit | `node --test dynamo/tests/reverie/dual-path.test.cjs` | ❌ W0 | ⬜ pending |
| 24-02-02 | 02 | 1 | PATH-02 | unit/smoke | `node --test dynamo/tests/reverie/inner-voice.test.cjs` | ❌ W0 | ⬜ pending |
| 24-02-03 | 02 | 2 | PATH-03 | unit | `node --test dynamo/tests/reverie/subagent.test.cjs` | ❌ W0 | ⬜ pending |
| 24-02-04 | 02 | 2 | PATH-04 | unit | `node --test dynamo/tests/reverie/dual-path.test.cjs` | ❌ W0 | ⬜ pending |
| 24-02-05 | 02 | 2 | PATH-05 | unit | `node --test dynamo/tests/reverie/state-bridge.test.cjs` | ❌ W0 | ⬜ pending |
| 24-02-06 | 02 | 1 | PATH-06 | unit | `node --test dynamo/tests/reverie/activation.test.cjs` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `dynamo/tests/reverie/inner-voice.test.cjs` — stubs for IV-05, IV-08, PATH-02 (pipeline orchestrator, token limits, timing)
- [ ] `dynamo/tests/reverie/dual-path.test.cjs` — stubs for PATH-01, PATH-04, IV-09, IV-11 (path selection, degradation, semantic shift, recall)
- [ ] `dynamo/tests/reverie/curation.test.cjs` — stubs for IV-07 (curation migration, template fallback)
- [ ] `dynamo/tests/reverie/state-bridge.test.cjs` — stubs for PATH-05 (state bridge write/consume/TTL/correlation)
- [ ] `dynamo/tests/reverie/subagent.test.cjs` — stubs for PATH-03 (subagent definition file validation)
- [ ] Extend `dynamo/tests/reverie/state.test.cjs` — covers IV-06 (self-model activation sections)
- [ ] Extend `dynamo/tests/reverie/activation.test.cjs` — covers PATH-06 (rate limit flag sets/clears)
- [ ] Extend `dynamo/tests/reverie/handlers.test.cjs` — verify handlers no longer pass-through

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Subagent spawn via additionalContext | PATH-03 | Claude Code model must follow injection instruction; cannot automate model behavior | 1. Enable cortex mode 2. Start new session 3. Verify inner-voice subagent spawns 4. Check SubagentStop hook fires |
| End-to-end injection in live session | IV-05 | Requires active Claude Code session with real hook pipeline | 1. Enable cortex mode 2. Send prompt referencing known entities 3. Verify injection appears in system-reminder 4. Check timing in debug output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

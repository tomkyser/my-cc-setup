---
phase: 14
slug: documentation-and-branding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | None (uses node --test glob) |
| **Quick run command** | `node --test dynamo/tests/*.test.cjs` |
| **Full suite command** | `node --test dynamo/tests/*.test.cjs dynamo/tests/ledger/*.test.cjs dynamo/tests/switchboard/*.test.cjs` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Visual review + grep for stale references
- **After every plan wave:** Full read-through of each artifact against source code
- **Before `/gsd:verify-work`:** All 4 requirements verifiable by content inspection
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | STAB-01 | manual-only | `grep -r "my-cc-setup\|graphiti-helper\|install.sh\|\.sh.*hook" README.md` | N/A | ⬜ pending |
| 14-02-01 | 02 | 1 | STAB-03 | manual-only | Verify README has all 10 sections defined in CONTEXT.md | N/A | ⬜ pending |
| 14-03-01 | 03 | 1 | STAB-04 | manual-only | `grep -c "~/.claude/graphiti/" claude-config/CLAUDE.md.template` (should be 0) | N/A | ⬜ pending |
| 14-04-01 | 04 | 1 | STAB-06 | manual-only | Count decision blocks in PROJECT.md | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

No test infrastructure needed -- this is a documentation-only phase. Validation is content verification against source code, not automated testing.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| README reflects Dynamo identity, no old references | STAB-01 | Markdown content -- no executable behavior | Grep for stale strings: `my-cc-setup`, `graphiti-helper`, `install.sh`, `.sh.*hook` |
| Documentation covers all 5 topics (arch, CLI, hooks, config, dev guide) | STAB-03 | Documentation completeness requires human judgment | Verify README contains all 10 locked sections from CONTEXT.md |
| CLAUDE.md has complete operational instructions | STAB-04 | Template content must match actual CLI commands | Compare commands in CLAUDE.md.template against `dynamo.cjs` command list (20 commands) |
| All 16 decisions have expanded blocks in PROJECT.md | STAB-06 | Structured content, not executable code | Count `### Decision:` blocks, verify each has context/rationale |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

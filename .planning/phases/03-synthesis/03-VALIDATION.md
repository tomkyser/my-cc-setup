---
phase: 03
slug: synthesis
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-16
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual review — documentation-only phase, no executable code |
| **Config file** | N/A |
| **Quick run command** | `grep -c "^##" .planning/phases/03-synthesis/RANKED-REPORT.md` |
| **Full suite command** | See Verification Gate checklist below |
| **Estimated runtime** | ~5 seconds (grep checks) |

---

## Sampling Rate

- **After every task commit:** Run quick grep checks for section existence
- **After every plan wave:** Run full Verification Gate checklist
- **Before `/gsd:verify-work`:** All Verification Gate items must pass
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| INFR-03 | Self-management lifecycle documented per tool | grep | `grep -c "Install\|Configure\|Update\|Troubleshoot" RANKED-REPORT.md` | Verify 4 operations documented for each of 7 tools |
| DLVR-01 | Ranked report with categories, pros/cons, pass/fail | grep | `grep -c "Primary Recommendations\|Conditional Recommendations\|Supplementary Findings" RANKED-REPORT.md` | Verify all 3 major sections present |
| DLVR-02 | Context cost estimate per tool | grep | `grep -c "Context Cost\|token" RANKED-REPORT.md` | Verify 7 tools each have a context cost value |
| DLVR-03 | Security assessment per tool | grep | `grep -c "Security\|mcp-scan" RANKED-REPORT.md` | Verify 7 tools each have security profile |

*Status: ⬜ pending*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework needed — this phase produces a single markdown document.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Report completeness | DLVR-01 | Section content quality requires human judgment | Review each tool write-up has pros, cons, verdict, and pass/fail against gates |
| Cap math accuracy | DLVR-01 | Arithmetic statement needs human verification | Confirm "5 primary + 2 conditional = 7 within 5-8 cap" is stated |
| Prerequisites before rankings | DLVR-01 | Section ordering requires reading flow check | Confirm PATH fix section appears before any tool write-up |
| Self-management command correctness | INFR-03 | Commands must match Phase 2 source data | Spot-check 3 tools' commands against their Phase 2 assessment files |

---

## Verification Gate

Before `/gsd:verify-work`, confirm:
- [ ] RANKED-REPORT.md exists at `.planning/phases/03-synthesis/RANKED-REPORT.md`
- [ ] Prerequisites section appears before any tool write-up
- [ ] 5 INCLUDE tools present with complete write-ups
- [ ] 2 CONSIDER tools present with upgrade conditions
- [ ] All 7 tools have context cost, security profile, and self-management commands
- [ ] Supplementary Findings appendix present with Future Enhancements
- [ ] Cap math statement present ("5 primary + 2 conditional = 7")

---

## Validation Sign-Off

- [x] All tasks have verification criteria (grep checks + manual review)
- [x] No automated test infrastructure needed — documentation-only phase
- [x] Wave 0 not applicable — no test stubs needed
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

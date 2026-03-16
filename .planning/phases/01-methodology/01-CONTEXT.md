# Phase 1: Methodology - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the vetting protocol (programmatic criteria) and anti-features list that all Phase 2 tool assessments will be evaluated against. This phase produces documentation only — no tools are evaluated, installed, or configured. The output must be specific enough that any Phase 2 assessment can be completed by applying only these criteria, with no judgment calls required on the hard gates.

</domain>

<decisions>
## Implementation Decisions

### Threshold Calibration

**GitHub Stars — Tiered by source:**
- Official vendor repos (GitHub, Microsoft, Anthropic, Brave, WordPress): 100+ stars minimum
- Established org repos (Upstash, Firecrawl, etc.): 500+ stars minimum
- Community/individual repos: 1,000+ stars minimum

**Commit Recency — Graduated window:**
- Preferred: Last commit within 30 calendar days of assessment date
- Acceptable: 31-90 days with a documented justification note (e.g., "stable release, no open security issues")
- Hard fail: Over 90 days since last commit — eliminated, no assessment

**Self-Management Capability — Full lifecycle (4 ops required):**
- Tool must support ALL four operations via commands CC can execute: install, configure, update, troubleshoot
- Failing any one operation = fails the self-management gate
- Commands documented from official docs (no verification at assessment time — this is research only)

**Security — Informational, not a hard gate:**
- Run mcp-scan (or equivalent) and document findings in the assessment
- Findings are presented in the Phase 3 ranked report for user decision
- No auto-disqualification based on security scan results

### Assessment Template

**Format:** Structured scorecard, ~1-2 pages per tool
**Mandatory sections:**
- Identity: name, repo URL, stars, last commit date, transport type
- Pass/fail gates: stars (by tier), commit recency, self-management (4 ops), CC duplication check
- Context cost estimate: per-tool token overhead measurement
- Self-management commands: install, configure, update, troubleshoot (documented from official sources)
- Security findings: mcp-scan results or equivalent
- Pros/cons: strengths and weaknesses
- Verdict: INCLUDE / CONSIDER / DEFER with brief rationale

### Pass/Fail Model

**Hard gates (binary — pass or eliminated):**
1. GitHub stars meets tiered threshold for source type
2. Last commit within 90 days (30 preferred)
3. Full lifecycle self-management (all 4 ops supported)
4. Does NOT duplicate a CC built-in capability (auto-disqualify if it does)

**Recommendation tiers (for tools that pass all gates):**
- **INCLUDE** — recommended for the final 5-8 tool set
- **CONSIDER** — viable but conditional (e.g., needs validation, overlaps with another tool)
- **DEFER** — valuable but not for v1 (timing, scope, or dependency issues)

**Tier assignment criteria:** Claude's discretion, based on what eliminates the most judgment calls from Phase 2 while keeping Phase 3 synthesis meaningful.

**SSE transport:** Flagged as a deprecation risk in the assessment but NOT a hard disqualification gate. Tool is still assessed — the SSE risk is documented for the user's decision in Phase 3.

### Anti-Features List Structure

**Format:** Closed named list + category rules for future evaluation
- Every currently known anti-feature is named explicitly with detailed justification (2-3 sentences per entry covering: what it does, why it looks appealing, why it's excluded, and the better alternative)
- Category rules defined so new tools encountered during Phase 2 research can be evaluated without updating the named list

**Anti-feature categories:**
1. CC built-in duplication (auto-disqualify)
2. Abandoned/archived projects (hard fail on recency gate)
3. Out-of-scope for this project
4. Security/supply chain risk

**Community forks:** Assessed case-by-case, NOT blanket-excluded. A fork that adds genuine value over the official server is assessed on its own merits. However, when an official vendor server exists and meets all gates, the fork must demonstrate clear, documented superiority to be preferred.

**Out-of-scope separation:** Claude's discretion on whether out-of-scope tools (Jira MCP, database MCPs) go in the anti-features list or a separate "Not Evaluated" section, based on what prevents scope creep most effectively.

### Claude's Discretion
- WordPress/PHP relevance section: include in assessment template when it adds value for the specific tool, skip for obviously general-purpose tools
- Recommendation tier criteria: pre-define in methodology or leave to Phase 3 — whichever eliminates the most judgment calls from Phase 2
- Out-of-scope tools placement: anti-features list or separate section — whichever prevents scope creep most effectively

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Vetting criteria sources
- `.planning/research/FEATURES.md` — Tool viability matrix, anti-features table, security assessment by tool, stars/commit data for all candidates
- `.planning/research/SUMMARY.md` — Executive summary with recommended stack, critical pitfalls, confidence assessment
- `.planning/research/PITFALLS.md` — Security risks, config corruption, context bloat, namespace conflicts — informs security check procedure and anti-feature reasoning

### Project constraints
- `.planning/REQUIREMENTS.md` — INFR-01 (vetting protocol) and INFR-02 (anti-features list) are the two requirements this phase delivers
- `.planning/PROJECT.md` — Core value (self-manageable by CC), constraints (maintenance, trust, self-management, quantity cap, global scope, macOS platform)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No code to reuse — this phase produces documentation only (markdown files)

### Established Patterns
- Research documents follow structured markdown with tables, sections, and source citations (see FEATURES.md, SUMMARY.md)
- Phase deliverables are markdown files in `.planning/phases/01-methodology/`

### Integration Points
- Vetting protocol feeds directly into Phase 2 tool assessments — assessors apply these criteria
- Anti-features list feeds into Phase 2 as a pre-filter — named tools are skipped, category rules catch new discoveries
- Phase 3 ranked report references vetting criteria for pass/fail columns

</code_context>

<specifics>
## Specific Ideas

- The "no judgment calls" success criterion specifically targets the hard gates — stars, recency, self-management, CC duplication. Recommendation tiers (INCLUDE/CONSIDER/DEFER) are an acceptable judgment area because they're documented and justified.
- Research already contains raw data for most thresholds (stars counts, commit dates, anti-features). Phase 1 codifies this into a formal protocol rather than inventing from scratch.
- Assessment scorecard should be usable as a template — copy it, fill in the blanks for each tool.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-methodology*
*Context gathered: 2026-03-16*

# Quick Task 260318-mcy: Research Ledger Cortex brief and produce roadmap revision analysis - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Task Boundary

Research the Ledger Cortex architectural vision documented in `.planning/research/LEDGER-CORTEX-BRIEF.md` exhaustively. Produce both a deep analysis with adversarial deliberation AND a concrete revised roadmap draft. This is a research-and-analysis task — no code changes.

</domain>

<decisions>
## Implementation Decisions

### Research Depth and Breadth
- **Deep AND broad**: Exhaustive treatment of all 21 research questions in the brief. No question left unaddressed, and high-risk feasibility questions (headless CC instances, inter-agent protocols, Hindsight/Graphiti coexistence, cost model) get the deepest treatment. Will produce a large document.

### Output Format
- **Both**: Produce a recommendation analysis document with clear reasoning AND a draft revised MASTER-ROADMAP.md as an appendix/companion file. The recommendation doc contains the reasoning; the draft roadmap shows the proposed result. User decides what to adopt.

### Adversarial Deliberation Style
- **Steel-man then stress-test**: For each major component and architectural decision, first build the strongest possible version of the idea, THEN actively try to break it. Surface real risks, failure modes, and honest go/no-go assessments per component. The output should feel rigorous and trustworthy, not cheerleading.

### Claude's Discretion
- Research methodology and section organization
- How to structure the draft roadmap (whether to keep existing version numbering or propose new scheme)

</decisions>

<specifics>
## Specific Ideas

- The brief contains 21 numbered research questions across 5 categories (Feasibility, Architecture, Cost/Scale, Integration, Domain Breadth) — all must be addressed
- The brief identifies 7 existing requirements that get absorbed and 10 new requirements — analysis should validate or challenge these mappings
- Three milestone impact options (A, B, C) are proposed — research should produce enough evidence to recommend one
- The Claudia vision (30,000 foot view) is context for WHY the architecture must be extensible, but Claudia is NOT in scope for the roadmap revision
- Current roadmap: v1.2.1 (stabilization, in progress) → v1.3 (intelligence) → v1.4 (memory quality) → v1.5 (dashboard) → v2.0 (advanced)

</specifics>

<canonical_refs>
## Canonical References

- `.planning/research/LEDGER-CORTEX-BRIEF.md` — Primary input document (the vision being researched)
- `MASTER-ROADMAP.md` — Current roadmap to be analyzed for revision
- `.planning/ROADMAP.md` — Active phase-level roadmap
- `.planning/PROJECT.md` — Project context and constraints
- `.planning/REQUIREMENTS.md` — Full requirements details
- Synix article (https://synix.dev/articles/agent-memory-systems/) — Origin analysis that inspired the vision

</canonical_refs>

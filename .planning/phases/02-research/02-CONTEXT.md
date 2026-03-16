# Phase 2: Research - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Produce individual assessments of all candidate tools and document the existing setup. This phase applies the Phase 1 vetting protocol to 5 named candidates, discovers and vets writing tool candidates, researches memory system enhancement approaches, and documents GSD/Graphiti self-management and coexistence. All work is research and documentation only — no tools are installed or configured.

</domain>

<decisions>
## Implementation Decisions

### Writing Tools Discovery (WRIT-01, WRIT-02)
- Scope is wide: MCPs, CC plugins, CLI tools CC can invoke via Bash, prompt libraries, writing frameworks — anything CC can leverage globally
- Surface top 5 candidates per category (creative writing, technical writing) before vetting
- Creative writing covers both professional content (copywriting, marketing, blog posts) and personal/fiction (storytelling, worldbuilding, narrative) — equal weight
- Technical writing covers documentation, API docs, READMEs, and similar
- All discovered candidates go through the full Phase 1 4-gate vetting protocol
- If no viable candidates exist in a category: document the gap, flag the requirement for v2 re-evaluation. Do not force workarounds.

### Memory System Research (MEMO-01, MEMO-02, MEMO-03)
- MEMO-01 (browsing interface) and MEMO-02 (session visibility): research existing tools only — no custom build proposals
- Any tools discovered during memory research go through the full Phase 1 4-gate vetting protocol (same standards as named candidates)
- MEMO-03 (hook gaps): compare current hooks against an ideal memory capture system to identify gaps — define what a perfect system would capture, then diff against what exists
- Output format for all three: approach comparison (table of approaches found, pros/cons per approach, recommendation) — similar structure to an ADR

### Existing Setup Documentation (GMGR-01, GMGR-02)
- Audience: dual — structured for Claude Code to execute commands from, readable for the user to review and understand
- GMGR-01 (GSD lifecycle): operational runbook depth — install, update (git pull + version check), config structure, troubleshooting decision tree, known issues, recovery procedures
- GMGR-02 (coexistence strategy): primary focus on config conflict prevention — how GSD, Graphiti, and new tools share ~/.claude without stepping on each other's config files, hooks, or settings
- Coexistence doc flags interaction risks but does NOT include full recovery procedures — recovery can be figured out when needed

### Plan Organization
- Claude's discretion on plan grouping, optimized for execution efficiency
- 5 named tool assessments run in parallel (batch), followed by a cross-cutting review pass to check overlaps and consistency before finalizing
- Writing tools research runs concurrently with named assessments (independent work stream)
- Memory research and setup docs can run concurrently (independent of assessments)
- A dedicated final review plan reads all deliverables, checks for gaps, inconsistencies, and ensures every requirement is fully addressed before Phase 3

### Claude's Discretion
- Exact plan grouping and count — optimize for parallelism while keeping plans manageable
- How to structure the cross-cutting review (checklist, narrative, or whatever catches gaps most effectively)
- Whether GMGR-01 and GMGR-02 are one plan or two (they share context)
- Assessment order within batches

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Vetting methodology (Phase 1 deliverables)
- `.planning/phases/01-methodology/VETTING-PROTOCOL.md` — 4 hard gates (stars, recency, self-management, CC duplication), assessment scorecard template, recommendation tier criteria (INCLUDE/CONSIDER/DEFER), SSE deprecation policy, community fork policy
- `.planning/phases/01-methodology/ANTI-FEATURES.md` — 7 named exclusions, 4 category rules, "Not Evaluated" section. Pre-filter: check this BEFORE running gate evaluation.

### Phase 1 context
- `.planning/phases/01-methodology/01-CONTEXT.md` — Threshold calibration decisions (tiered stars, graduated recency, security as informational only), assessment template format, pass/fail model

### Project-level constraints
- `.planning/REQUIREMENTS.md` — 12 requirements mapped to Phase 2: DOCS-01/02, DEVT-01/02/03, WRIT-01/02, GMGR-01/02, MEMO-01/02/03
- `.planning/PROJECT.md` — Core value (self-manageable by CC), constraints (maintenance, trust, self-management, quantity cap, global scope, macOS/zsh/Homebrew)

### Research data (from project initialization)
- `.planning/research/FEATURES.md` — Tool viability matrix, anti-features table, security assessment data, stars/commit data for all initial candidates
- `.planning/research/SUMMARY.md` — Executive summary, recommended stack, critical pitfalls
- `.planning/research/PITFALLS.md` — Security risks, config corruption, context bloat, namespace conflicts

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No application code — this project produces documentation only (markdown files)
- Phase 1 assessment scorecard template (in VETTING-PROTOCOL.md Section 2) is the primary reusable asset — copy and fill for each named candidate

### Established Patterns
- Research documents follow structured markdown with tables, sections, and source citations
- Phase deliverables go in `.planning/phases/02-research/`
- Assessments apply the scorecard template from VETTING-PROTOCOL.md

### Integration Points
- Assessments feed into Phase 3 ranked report — each assessment's verdict (INCLUDE/CONSIDER/DEFER/ELIMINATED) becomes a row in the final report
- GMGR-01/02 docs feed into Phase 3's self-management lifecycle section per tool (INFR-03)
- Memory research findings inform whether memory tools enter the final 5-8 tool list

</code_context>

<specifics>
## Specific Ideas

- The "batch then review" approach for named assessments mirrors how Phase 1's tier criteria were designed: assess independently, then cross-reference for overlaps
- Writing tools research may legitimately come up empty — the requirement explicitly allows "no viable candidates" as a valid finding, flagged for v2
- Memory research output format (approach comparison) was chosen because these topics are landscape surveys, not single-tool evaluations
- Coexistence doc focuses on ~/.claude config conflicts specifically because that's the shared namespace where GSD, Graphiti hooks, plugins, and MCP configs all live

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-research*
*Context gathered: 2026-03-16*

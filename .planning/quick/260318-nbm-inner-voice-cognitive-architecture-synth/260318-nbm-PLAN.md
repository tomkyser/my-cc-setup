---
phase: quick-260318-nbm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/research/INNER-VOICE-SPEC.md
autonomous: true
requirements: [QUICK-NBM]

must_haves:
  truths:
    - "Document synthesizes the dual-process model, sublimation mechanism, cascading associations, and continuous parallel processing into a unified specification"
    - "All 15 cognitive theories are mapped with PRIMARY/SECONDARY/TERTIARY/SUPPORTING classifications, each showing theory-to-mechanism mapping and design implications"
    - "Mechanical design section describes state management, processing pipeline per hook, sublimation threshold formula, spreading activation implementation, injection format, model selection, and latency/cost budgets"
    - "Adversarial analysis steel-mans then stress-tests every major claim with failure mode taxonomy and mitigation strategies"
    - "Implementation pathway aligns with Option C phasing (v1.3 through v2.0) with explicit scope boundaries per milestone"
  artifacts:
    - path: ".planning/research/INNER-VOICE-SPEC.md"
      provides: "Inner Voice cognitive architecture supplementary specification"
      min_lines: 400
  key_links:
    - from: ".planning/research/INNER-VOICE-SPEC.md"
      to: ".planning/research/LEDGER-CORTEX-BRIEF.md"
      via: "supplements the Inner Voice section"
      pattern: "LEDGER-CORTEX-BRIEF"
    - from: ".planning/research/INNER-VOICE-SPEC.md"
      to: ".planning/research/LEDGER-CORTEX-ANALYSIS.md"
      via: "incorporates and extends adversarial analysis"
      pattern: "LEDGER-CORTEX-ANALYSIS"
---

<objective>
Produce the polished Inner Voice cognitive architecture specification document (INNER-VOICE-SPEC.md) that synthesizes all research findings, theory mappings, mechanical designs, adversarial analysis, and implementation phasing into a single authoritative supplementary specification.

Purpose: This document will be the primary reference when planning and implementing the Inner Voice component in v1.3 and beyond. It must be comprehensive enough that a planning session can derive implementation tasks directly from its sections without needing to re-read the research document or reconstruct the theory-to-mechanism mappings.

Output: .planning/research/INNER-VOICE-SPEC.md
</objective>

<execution_context>
@/Users/tom.kyser/.claude/get-shit-done/workflows/execute-plan.md
@/Users/tom.kyser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/research/LEDGER-CORTEX-BRIEF.md
@.planning/research/LEDGER-CORTEX-ANALYSIS.md
@.planning/quick/260318-nbm-inner-voice-cognitive-architecture-synth/260318-nbm-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Synthesize and write INNER-VOICE-SPEC.md</name>
  <files>.planning/research/INNER-VOICE-SPEC.md</files>
  <action>
Create the Inner Voice Cognitive Architecture Specification document by synthesizing content from the three source documents (LEDGER-CORTEX-BRIEF.md Inner Voice section, LEDGER-CORTEX-ANALYSIS.md Inner Voice component analysis, and 260318-nbm-RESEARCH.md full cognitive architecture research).

This is a SYNTHESIS document, not a copy-paste aggregation. The research document (260318-nbm-RESEARCH.md) is the primary source -- it contains the most comprehensive treatment. The specification should distill, organize, and polish that material into a production-ready reference document.

**Document structure (follow this outline exactly):**

```
# Inner Voice: Cognitive Architecture Specification

**Status:** Supplementary specification for Ledger Cortex
**Date:** 2026-03-18
**Supplements:** LEDGER-CORTEX-BRIEF.md (vision), LEDGER-CORTEX-ANALYSIS.md (adversarial analysis)
**Consumed by:** v1.3 implementation planning

---

## 1. Executive Summary
- What the Inner Voice IS (the dual-process model, continuous parallel processing via persistent state)
- The central finding (cognitive science mapping is load-bearing, not decorative)
- The central tension resolved (event-driven with persistent state achieves the illusion of continuity)
- The composite cognitive model (five PRIMARY theories and their mechanical outputs)

## 2. What the Inner Voice IS
- The dual-process model table (Main Session vs Inner Voice)
- The sublimation model (how processing surfaces selectively)
- Operational modes (preconscious loading, continuous processing, selective sublimation, cascading association tagging, active recall direction, relational modeling)
- Key design principle: Inner Voice speaks TO the Claude session; sole interface between memory system and parent thread

## 3. Cognitive Theory Foundation
### 3.1 Theory Classification
- Summary table: all 15 theories with applicability tier, what they map to, v1.3 essentiality, confidence level
- (Reproduce the Theory Applicability Summary table from the research)

### 3.2 PRIMARY Theories (load-bearing)
For each of the 6 PRIMARY theories (Dual-Process, Global Workspace, Spreading Activation, Predictive Processing, Working Memory/Baddeley, Relevance Theory) AND Cognitive Load Theory (also PRIMARY):
- Theory summary (2-3 sentences)
- Mapping table (Theory concept -> Inner Voice mechanism)
- Design implications (numbered, actionable)
- Why it is essential (1 paragraph)
- Where the analogy breaks down (numbered stress-test points)

### 3.3 SECONDARY Theories (design constraints)
For each (Attention Schema, Somatic Markers, Default Mode Network, Memory Consolidation, Metacognition):
- Theory summary (1-2 sentences)
- How it maps (brief)
- Key design implication
- Verdict and timing (v1.3 vs v1.4)

### 3.4 TERTIARY and SUPPORTING Theories
- Schema Theory, Affect-as-Information, Hebbian Learning: brief treatment, 2-3 sentences each
- What they contribute and when

### 3.5 Design Principles Derived from Theory
- The 10-row principles table from Section 7.2 of the research
- These are the operational rules the Inner Voice implementation MUST follow

## 4. Mechanical Design
### 4.1 The Continuity Problem and Solution
- Why true continuous processing is impossible in Claude Code
- Why event-driven + persistent state is not a compromise but the correct design
- The neuroscience parallel (human continuity is also event-driven at neural level)

### 4.2 State Management Architecture
- File paths and structure
- Full state JSON schema (self_model, relationship_model, activation_map, pending_associations, injection_history, predictions)
- State lifecycle: load -> process -> update -> persist

### 4.3 Processing Pipeline Per Hook
- UserPromptSubmit pipeline (8 steps with latency targets)
- SessionStart pipeline (5 steps)
- Stop pipeline (6 steps)
- PostToolUse pipeline (brief: entity extraction + activation update + queue)

### 4.4 Sublimation Threshold Mechanism
- The composite threshold function (formula with all 5 factors)
- Factor definitions and ranges
- Threshold adaptation (metacognitive adjustment)
- Bypass for explicit user recall

### 4.5 Spreading Activation Implementation
- Neo4j Cypher-based activation propagation
- Practical constraints (depth limit, minimum threshold, temporal weighting, convergence bonus)
- In-memory vs graph-backed activation map

### 4.6 Injection Mechanism
- How sublimated content reaches the main thread (stdout via hooks)
- Injection format (good vs bad examples from Relevance Theory)
- Token limits by context (500 session start, 150 mid-session, 50 urgent)

### 4.7 Model Selection
- Table: component -> model -> rationale (deterministic/Haiku/Sonnet)
- Prompt caching strategy

### 4.8 Latency Budget
- Table: operation -> target -> mechanism

### 4.9 Cost Projections
- Current baseline table
- v1.3 projected cost table
- With/without prompt caching comparison
- Net increase over baseline

## 5. Adversarial Analysis
### 5.1 Steel-Man: The Strongest Case FOR
- Synthesize from Section 4.1 of research: the difference between "finds relevant information" and "genuinely understands context"
- Each theory maps to a mechanism; remove any one and the design degrades in an identifiable way

### 5.2 Stress-Test Results
- 7 stress-test questions from Section 4.2, each with verdict
- Failure mode taxonomy table (7 failure modes with cause, severity, detection, recovery)
- Special treatment of "confidently wrong" as the most dangerous failure mode
- 4 mitigations for confidently wrong

### 5.3 Risk Register
- From LEDGER-CORTEX-ANALYSIS.md: risks 1-10 relevant to Inner Voice
- Add any Inner Voice-specific risks from the research

## 6. Implementation Pathway (Option C)
### 6.1 v1.3: Minimal Viable Inner Voice
- What ships (files, commands)
- Cognitive theories implemented (6 PRIMARY)
- What is explicitly NOT in v1.3 (relationship modeling, affect, multi-hop, etc.)
- Risk level and mitigation

### 6.2 v1.4: Advanced Inner Voice
- What ships
- Cognitive theories added (6 SECONDARY)

### 6.3 v1.5 and v2.0
- Brief scope statements

### 6.4 Incremental vs Big-Bang Comparison
- The 6-factor comparison table

## 7. Open Questions
- Embedding model selection
- State file concurrency
- Knowledge graph density requirements
- Evaluation metrics (with baseline gap noted)
- Prompt engineering quality

## 8. Document Relationships
- How this document relates to LEDGER-CORTEX-BRIEF.md, LEDGER-CORTEX-ANALYSIS.md, and the future master roadmap
- What to read in what order

## Sources
- Reproduce the Sources section from the research
```

**Writing guidelines:**
- This is a SPECIFICATION, not an academic paper. Write for an implementer who will build this in Claude Code.
- Preserve all tables, formulas, code blocks, and Cypher queries from the research -- these are load-bearing.
- The tone should be authoritative and direct. No hedging on things the research concluded.
- Where the research identified genuine uncertainty, preserve that uncertainty honestly.
- Do NOT add new analysis or theories not present in the source documents. This is synthesis, not expansion.
- Cross-reference the companion documents by filename where appropriate.
- The document should be self-contained: a reader should be able to understand the full Inner Voice design from this document alone, without needing to read the research document.
  </action>
  <verify>
    <automated>wc -l .planning/research/INNER-VOICE-SPEC.md | awk '{if ($1 >= 400) print "PASS: "$1" lines"; else print "FAIL: only "$1" lines"}'</automated>
  </verify>
  <done>
- INNER-VOICE-SPEC.md exists at .planning/research/INNER-VOICE-SPEC.md
- Document contains all 8 major sections from the outline
- All 15 cognitive theories are covered with appropriate depth per tier
- Mechanical design section includes state schema, processing pipelines, sublimation formula, Cypher queries, and cost projections
- Adversarial analysis includes steel-man, all 7 stress-tests, and failure mode taxonomy
- Implementation pathway covers v1.3 through v2.0 with explicit scope boundaries
- Document is self-contained and authoritative
  </done>
</task>

</tasks>

<verification>
- File exists: .planning/research/INNER-VOICE-SPEC.md
- File is >= 400 lines (comprehensive specification)
- Document covers all 8 sections from the outline
- All theory-to-mechanism mappings are preserved from research
- Mechanical design includes concrete implementation details (state schema, Cypher, formulas)
</verification>

<success_criteria>
A polished, authoritative Inner Voice cognitive architecture specification that can be consumed directly by v1.3 implementation planning without needing to re-read the research document or reconstruct mappings.
</success_criteria>

<output>
After completion, create `.planning/quick/260318-nbm-inner-voice-cognitive-architecture-synth/260318-nbm-SUMMARY.md`
</output>

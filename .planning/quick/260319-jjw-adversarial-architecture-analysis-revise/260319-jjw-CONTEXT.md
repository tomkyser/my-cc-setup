# Quick Task 260319-jjw: Adversarial Architecture Analysis - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Task Boundary

Adversarial architecture analysis comparing the revised cognitive-layer subsystem model (proposed in conversation) against the current six-subsystem spec (Dynamo, Switchboard, Ledger, Assay, Terminus, Reverie). Employ adversarial deliberation with steel-manning. Consider both technical and memory theory dimensions. Produce a unified single report.

</domain>

<decisions>
## Implementation Decisions

### Evaluation Framework
- **Primary dimension: Memory theory fidelity.** Judge each architecture by how well it maps to cognitive science -- working memory, consolidation, retrieval, archival. Technical feasibility is secondary to theoretical alignment.

### Adversarial Structure
- **Stress-test the new vision.** Steel-man the current six-subsystem spec as the challenger. The new cognitive-layer model is the thesis being tested -- try to break it. Surface where the current spec genuinely wins on its own terms.

### Report Goal
- **Analysis only.** Pure analysis -- strengths, weaknesses, tensions, trade-offs. No recommendation. No verdict. The user decides after reading.

### Input Scope
- **Full conversation as first-class input.** Everything discussed in conversation (tool research results for Synix, Hyperspell-v2, LangMem; user's answers on Terminus routing, Vault independence, Ledger as fast-recall trigger, Journal deferral; the cognitive-layer data flow model) is treated as binding requirements for the new vision, not background context.

### Claude's Discretion
- Report structure and section ordering
- Depth of cognitive science references (should be substantive but not academic)
- How to handle the deferred Journal -- mention it but don't evaluate deeply since it's deferred

</decisions>

<specifics>
## Specific Ideas

### The New Cognitive-Layer Model (from conversation)
- **Ledger** (Graphiti): Fast-recall trigger layer, not short-term/ephemeral. Results drive deeper searches.
- **Library** (Synix): Long-term processed memory. Tiered compression. Reverie REM consolidation target.
- **Vault** (TBD): Data lake for unadulterated raw artifacts. Exact retrieval, zero fuzzy. Transcripts, docs, images, video, command outputs.
- **Assay** (Hyperspell-v2): Unified hybrid search across Ledger, Library, Vault, and external sources. Transparent interface.
- **Terminus**: Redefined as data ingestion pipeline. Hook-triggered scripts, background monitor. Routes to Ledger or Library based on rules, not reasoning.
- **Journal** (LangMem, deferred): Reverie-private subjective/personality memory. Cross-domain taxonomies.
- **Reverie**: Hot mode (Ledger + Journal, fast) vs passive mode (Library/Vault via Assay, deep). REM feeds back to Terminus. Interprets all sources as parts of her own mind.
- **Switchboard**: Ops lifecycle for contained services. Manages start/stop/health/I/O but doesn't own the services.

### The Current Six-Subsystem Spec (from spec docs)
- Dynamo (system wrapper), Switchboard (dispatcher), Ledger (data construction/write-only), Assay (data access/read-only), Terminus (data infrastructure), Reverie (Inner Voice)
- Read/write boundary model: Ledger never reads, Assay never writes
- Reverie reads through Assay, writes through Ledger
- Terminus provides transport pipe, doesn't decide what flows
- Hybrid architecture: CJS hooks for hot path + custom subagent for deliberation

### Tool Research Results (from agents)
- **Synix**: Programmable memory build system. Four-tier model (Execution/Session/Experience/Identity). DAG pipelines, incremental rebuilds, full provenance. Currently operates at Tier 2 (Experience).
- **Hyperspell-v2**: Multi-tenant memory API. Hybrid search (vector + knowledge graph + keyword). Cross-encoder reranking. 50+ source connectors. Self-contained Docker stack.
- **LangMem**: Typed memory SDK. Pydantic schema-driven extraction. Procedural memory evolves agent system prompt. High search latency (p50 ~18s). Deferred.

</specifics>

<canonical_refs>
## Canonical References

- `.planning/research/REVERIE-SPEC.md` -- Reverie subsystem specification (1,463 lines)
- `.planning/research/INNER-VOICE-ABSTRACT.md` -- Platform-agnostic Inner Voice concept
- `.planning/research/DYNAMO-PRD.md` -- Dynamo product requirements document
- `.planning/research/TERMINUS-SPEC.md` -- Terminus subsystem specification
- `.planning/research/SWITCHBOARD-SPEC.md` -- Switchboard subsystem specification
- `.planning/research/LEDGER-SPEC.md` -- Ledger subsystem specification
- `.planning/research/ASSAY-SPEC.md` -- Assay subsystem specification
- `MASTER-ROADMAP.md` -- v1.3 milestoned roadmap (1.3-M1 through 1.3-M7)

</canonical_refs>

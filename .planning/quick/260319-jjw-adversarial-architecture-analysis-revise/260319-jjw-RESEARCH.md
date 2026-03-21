# Quick Task 260319-jjw: Adversarial Architecture Analysis - Research

**Researched:** 2026-03-19
**Domain:** Cognitive science memory theory applied to AI memory system architecture
**Confidence:** HIGH (foundational cognitive science is well-established; AI memory system mapping is MEDIUM)

## Summary

This research grounds the adversarial architecture analysis in cognitive science. It covers the major memory models (multi-store, working memory, levels of processing, consolidation, dual-process), the role of forgetting and emotional memory, retrieval mechanisms, and how existing AI memory systems map to these theories. The goal is to provide the evaluative framework for judging two competing architectures -- the current six-subsystem spec and the proposed cognitive-layer model -- on memory theory fidelity.

The central finding is that the brain does NOT store raw sensory data for later retrieval. It processes, encodes, and transforms information at every stage. Forgetting is an active, adaptive cognitive function, not a failure mode. Retrieval is context-dependent and reconstructive, not lookup-based. These findings have direct implications for evaluating the Vault concept, the Terminus ingestion pipeline, and the Assay unified search layer.

**Primary recommendation:** Evaluate each architecture component against the specific cognitive mechanism it claims to model. Where an architecture diverges from the science, determine whether the divergence is a deliberate engineering tradeoff (acceptable) or a misunderstanding of the theory it invokes (problematic).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Primary dimension: Memory theory fidelity.** Judge each architecture by how well it maps to cognitive science -- working memory, consolidation, retrieval, archival. Technical feasibility is secondary to theoretical alignment.
- **Stress-test the new vision.** Steel-man the current six-subsystem spec as the challenger. The new cognitive-layer model is the thesis being tested -- try to break it. Surface where the current spec genuinely wins on its own terms.
- **Analysis only.** Pure analysis -- strengths, weaknesses, tensions, trade-offs. No recommendation. No verdict. The user decides after reading.
- **Full conversation as first-class input.** Everything discussed in conversation (tool research results for Synix, Hyperspell-v2, LangMem; user's answers on Terminus routing, Vault independence, Ledger as fast-recall trigger, Journal deferral; the cognitive-layer data flow model) is treated as binding requirements for the new vision, not background context.

### Claude's Discretion
- Report structure and section ordering
- Depth of cognitive science references (should be substantive but not academic)
- How to handle the deferred Journal -- mention it but don't evaluate deeply since it's deferred

### Deferred Ideas (OUT OF SCOPE)
- None specified
</user_constraints>

---

## 1. Cognitive Science Memory Models: What the Science Says

### 1.1 Multi-Store Model (Atkinson & Shiffrin, 1968)

The foundational model posits three distinct stores with different characteristics:

| Store | Duration | Capacity | Function |
|-------|----------|----------|----------|
| **Sensory Register** | 250ms-3s | Very large but fleeting | Raw sensory buffer; decays unless attended to |
| **Short-Term Memory** | 18-30s without rehearsal | 7 +/- 2 items | Active holding and manipulation |
| **Long-Term Memory** | Indefinite | Effectively unlimited | Permanent storage of encoded information |

**Key insight for architecture evaluation:** The sensory register is NOT a storage system. It is a pre-attentive buffer that decays almost immediately. Information must pass through attention to enter short-term memory, and through encoding (rehearsal, elaboration) to enter long-term memory. There is no cognitive analog to "store everything raw for later retrieval." The brain filters aggressively at every stage.

**Confidence:** HIGH -- this is a 58-year-old model with extensive empirical support and refinement.

### 1.2 Working Memory Model (Baddeley & Hitch, 1974; Baddeley 2000)

Replaced the monolithic "short-term memory" with a multi-component system:

- **Central Executive:** Attentional control system. Directs focus, coordinates subsystems, manages task-switching. Does NOT store information itself.
- **Phonological Loop:** Temporary storage of verbal/acoustic information with rehearsal.
- **Visuospatial Sketchpad:** Temporary storage of spatial and visual information.
- **Episodic Buffer** (added 2000): Limited-capacity integration system that binds information from subsidiary systems AND long-term memory into coherent episodic representations. Conscious awareness is its principal mode of retrieval.

**Key insight for architecture evaluation:** The episodic buffer is the critical component. It does not just retrieve -- it INTEGRATES multi-source information into coherent episodes. This is the function the INNER-VOICE-ABSTRACT.md explicitly maps Reverie to. The question is whether this integration function is adequately modeled in each architecture. The current spec maps Reverie directly to the episodic buffer. The new model distributes integration across Reverie (hot/passive modes) and Assay (search unification).

**Confidence:** HIGH -- Baddeley's model is the dominant working memory framework in cognitive science.

### 1.3 Levels of Processing (Craik & Lockhart, 1972)

Memory persistence is a function of encoding depth, not storage location:

- **Shallow processing** (structural/sensory features): Fragile trace, rapid decay
- **Intermediate processing** (phonemic/acoustic features): Moderate persistence
- **Deep processing** (semantic/meaning-based): Durable, long-lasting traces

Elaborative encoding -- connecting new information to existing knowledge networks -- produces the most durable memories. This is not about WHERE information is stored but HOW it is processed during encoding.

**Key insight for architecture evaluation:** This directly challenges any architecture that treats storage as the primary memory function. A "data lake" that stores raw artifacts without semantic processing is performing shallow encoding at best. The science predicts that deeply processed (semantically enriched) memories will be more retrievable than raw stored data, regardless of storage fidelity. This applies to the Vault concept and to the distinction between Ledger (fast-recall trigger, graph-enriched) and Library (tiered compression).

**Confidence:** HIGH -- supported by hundreds of experiments since 1972.

### 1.4 Memory Consolidation Theory

Two distinct consolidation processes operate at different timescales:

**Synaptic consolidation** (minutes to hours): Stabilizes newly formed memory traces at the synaptic level. Happens during and shortly after encoding.

**Systems consolidation** (days to years): Gradually transfers memories from hippocampus (temporary, context-rich) to neocortex (permanent, schema-integrated). This is where the REM/NREM sleep cycle becomes critical:

- **NREM/Slow-Wave Sleep:** Drives systems consolidation through hippocampal replay. Previously encoded neural ensembles are reactivated, transferring representations to neocortical networks. This is the "replay and reorganize" phase.
- **REM Sleep:** Promotes synaptic pruning -- selectively weakening or eliminating redundant connections to refine memory networks. Also facilitates hippocampus-to-cortex transfer and stabilization of cortical memory traces.

**Key insight for architecture evaluation:** The Reverie REM consolidation concept maps well to systems consolidation -- session-end synthesis that reorganizes and integrates episodic memories into higher-order patterns. The critical detail is that consolidation is NOT just archival. It is an active transformation process that changes the form of the memory. The brain does not simply move data from one store to another; it restructures, generalizes, and prunes. Any architecture claiming cognitive fidelity for its consolidation process must include transformation, not just transfer.

**Confidence:** HIGH -- consolidation theory is well-established; the specific NREM/REM division has strong empirical support from the last decade of sleep research.

### 1.5 Dual-Process Theory (Kahneman)

Two modes of cognitive processing:

- **System 1:** Fast, automatic, associative, emotional, parallel, effortless. Handles ~95% of cognitive processing. Uses heuristics. Error-prone but efficient.
- **System 2:** Slow, deliberate, serial, rational, effortful. Engages only when System 1 signals uncertainty or when the task demands it. Requires working memory.

System 1 does NOT decide whether to engage System 2 through reasoning. The handoff is triggered by measurable signals: uncertainty, complexity, novelty, prediction error.

**Key insight for architecture evaluation:** Both architectures claim dual-process fidelity. The current spec implements it as CJS hot path (System 1) vs custom subagent deliberation (System 2). The new model implements it as Reverie hot mode (Ledger + Journal, fast) vs passive mode (Library/Vault via Assay, deep). The critical question is whether the handoff mechanism is signal-driven (cognitive fidelity) or configuration-driven (engineering convenience). A cognitively faithful dual-process system triggers the slow path based on measurable signals from the fast path, not based on predetermined routing rules.

**Confidence:** HIGH -- Kahneman's framework is both empirically grounded and the most widely applied cognitive model in AI system design.

### 1.6 Retrieval: Spreading Activation and Context-Dependency

**Spreading activation (Collins & Loftus, 1975):** Semantic memory is a network of interconnected nodes. Activating one concept spreads activation to connected concepts, with strength decaying over distance. Multiple activation sources can converge on a single node (summation), and subthreshold activation primes future retrieval. This is content-addressable memory -- you retrieve through associative pathways, not through indexed lookup.

**Encoding specificity (Tulving & Thomson, 1973):** Memory retrieval is most effective when retrieval cues match encoding context. Memories are not stored as isolated records; they are bound to the context in which they were formed. Retrieval is reconstructive -- the brain does not "play back" a stored record but reconstructs the memory from available cues and stored traces.

**Reconsolidation:** Retrieved memories enter a labile state and can be modified before re-stabilization. Every retrieval is potentially a modification event. This means the act of searching memory can change memory -- a finding with profound implications for any system that models memory as a static data store.

**Key insight for architecture evaluation:** The brain does not have a "unified search" in the engineering sense. It uses spreading activation (associative, parallel, unconscious) and context-dependent retrieval (cue-matching, reconstructive). Different memory types (episodic, semantic, procedural) interact during retrieval but through different mechanisms. Assay as a unified search layer is an engineering abstraction that does not directly map to how cognitive retrieval works -- but that may be an acceptable engineering tradeoff if the abstraction preserves the important properties (multi-source integration, context-sensitivity, associative linkage).

**Confidence:** HIGH for the cognitive science; MEDIUM for the implications for AI architecture.

### 1.7 The Role of Forgetting

Forgetting is NOT a failure of memory. It is an active, adaptive cognitive process:

- **Retrieval-induced forgetting (Anderson et al., 1994):** Retrieving one memory actively suppresses competing memories. The prefrontal cortex engages inhibitory control to reduce interference from competing traces. This is adaptive -- it reduces future retrieval competition.
- **Directed forgetting:** The brain can intentionally suppress memories to minimize errors, facilitate new learning, or regulate emotional state.
- **Active forgetting across species:** Prefrontal cortex-mediated forgetting is not uniquely human; it is observed in mammals generally, suggesting it is a fundamental feature of adaptive memory systems.

**Key insight for architecture evaluation:** A system that stores everything without forgetting is cognitively UNfaithful. Healthy cognition requires active pruning, suppression, and decay. The current spec's Reverie REM consolidation includes implicit pruning through synthesis (information is consolidated into higher-order patterns, losing raw detail). The new model's Vault concept -- storing raw artifacts indefinitely with zero fuzzy matching -- is the most cognitively unfaithful component of either architecture. There is no cognitive analog to "store everything raw forever." The closest analog (eidetic/photographic memory) is extremely rare, not well-supported empirically, and where it exists, is often associated with cognitive dysfunction rather than enhanced performance.

**Confidence:** HIGH -- adaptive forgetting is one of the most robust findings in modern memory research.

### 1.8 Emotional/Subjective Memory and Decision-Making

**Somatic Marker Hypothesis (Damasio):** Emotions create physiological responses ("somatic markers") that become associated with situations and their past outcomes. When facing complex choices, the brain retrieves these emotional associations to bias decision-making. Pure cognitive processing without emotional signals produces abnormal behavior -- emotions are not noise, they are essential decision-making data.

**Key insight for architecture evaluation:** The new model's Journal concept (Reverie-private subjective/personality memory, deferred) maps to this. The current spec's INNER-VOICE-ABSTRACT.md includes the Somatic Marker Hypothesis as a SECONDARY theory, with affect/valence tags on knowledge graph entities. Both architectures recognize subjective memory as important, but the new model gives it a dedicated store (Journal) while the current spec treats it as metadata on existing entities. The dedicated-store approach is arguably more cognitively faithful -- emotional memory in the brain has distinct neural substrates (amygdala, orbitofrontal cortex) from semantic memory.

**Confidence:** HIGH for the cognitive science; MEDIUM for the architectural implications (the Journal is deferred, so it cannot be fully evaluated).

---

## 2. How Existing AI Memory Systems Map to Cognitive Science

### 2.1 MemGPT/Letta

**Architecture:** Two-tier memory (main context / external context) modeled on virtual memory in operating systems. The LLM manages its own memory, deciding what to page in and out.

**Cognitive fidelity:** The OS analogy is engineering-native, not cognitively inspired. Memory is treated as a storage management problem (what fits in the "context window") rather than an encoding/retrieval problem. There is no spreading activation, no consolidation, no forgetting. The LLM's "decision" about what to page in is a form of attention, but it conflates the central executive with the storage system.

**Where it succeeds:** The self-editing memory capability captures something like reconsolidation -- the system can modify its own memories. The two-tier model maps loosely to working memory (in-context) vs long-term memory (external).

**Where it fails:** No encoding depth distinction. No emotional/subjective memory. No adaptive forgetting. No consolidation process. Memory is treated as data management, not cognitive processing.

### 2.2 Graphiti/Zep

**Architecture:** Temporal knowledge graph with three-tier subgraph hierarchy (episode, semantic entity, community). Bitemporal model (event time T, ingestion time T'). Hybrid search (semantic embeddings + BM25 + graph traversal).

**Cognitive fidelity:** The strongest cognitive mapping of any production system. The episode subgraph maps to episodic memory. The semantic entity subgraph maps to semantic memory. The community subgraph maps to schema/concept formation. The temporal model captures when things actually happened vs when they were learned -- a distinction the brain makes naturally.

**Where it succeeds:** Graph traversal is a direct analog to spreading activation. Temporal fact management (facts have validity windows, old facts are invalidated not deleted) maps to memory updating/reconsolidation. The three-tier hierarchy mirrors cognitive science memory hierarchies.

**Where it fails:** No adaptive forgetting (old facts are invalidated but not removed). No emotional/subjective memory layer. No consolidation process -- the hierarchy is structural, not temporal (there is no sleep-like synthesis phase). Search is fundamentally retrieval-oriented rather than integration-oriented.

### 2.3 Mem0

**Architecture:** Memory extraction + consolidation from conversations. Graph-based variant (Mem0g) stores entities and relationships. Hybrid search (vector + graph).

**Cognitive fidelity:** The extraction and updation process maps to encoding and reconsolidation. Memory is not a raw transcript dump -- the system extracts salient information, which is a form of deep processing.

**Where it succeeds:** The extraction process performs something like levels-of-processing -- it selects meaningful information over raw data. The graph representation enables associative retrieval.

**Where it fails:** No dual-process architecture. No subjective/emotional memory. No consolidation beyond the extraction step itself. The system is fundamentally a single-path processor.

### 2.4 Synix

**Architecture:** Programmable memory build system with four-tier model (Execution/Session/Experience/Identity). DAG pipelines, incremental rebuilds, full provenance.

**Cognitive fidelity:** The four-tier model has interesting cognitive parallels -- Execution (working memory), Session (episodic), Experience (consolidated episodic), Identity (semantic/self-model). The DAG pipeline concept maps loosely to consolidation -- information is progressively transformed through defined stages.

**Where it succeeds:** The tiered model explicitly recognizes that memory has different forms at different timescales. Full provenance tracking maps to the encoding specificity principle -- you can trace back to the encoding context. Incremental rebuilds map to reconsolidation.

**Where it fails:** Currently operates at Tier 2 (Experience), so the theoretical model exceeds the implementation. The "build system" metaphor is engineering-native, not cognitively inspired.

---

## 3. The "Data Lake" Question: Cognitive Analog to the Vault

### 3.1 Does the Brain Store Raw Data?

**The answer is definitively no.** The sensory register holds raw sensory input for 250ms to 3 seconds. After that, everything is processed. There is no long-term storage of raw sensory data in healthy cognition.

- **Eidetic memory** (sometimes called "photographic memory") is not well-supported empirically. Where it exists, it appears to be a brief extension of iconic (sensory) memory, not long-term raw storage. True eidetic memory in adults is vanishingly rare and its existence is debated.
- The brain ALWAYS processes before long-term storage. Encoding transforms sensory input into semantic, episodic, or procedural representations. The original "raw data" is lost.
- **The role of forgetting:** The brain actively prunes, suppresses, and decays information. A system that stores everything raw indefinitely is modeling the opposite of healthy cognition.

### 3.2 Implications for the Vault Concept

The Vault (raw artifact store, exact retrieval, zero fuzzy) is the most cognitively unfaithful component proposed in either architecture. There is no cognitive analog to:

- Storing transcripts, docs, images, video, command outputs verbatim
- Exact retrieval without semantic processing
- Zero fuzzy matching (the brain is fundamentally fuzzy in its retrieval)
- Indefinite raw storage without decay or transformation

**However:** This does not necessarily make the Vault a bad engineering decision. Engineering systems routinely include capabilities that have no biological analog (databases, indexes, exact-match search). The question for the analysis is whether the Vault's presence UNDERMINES the cognitive fidelity of the overall architecture (by creating a component that contradicts the theoretical framework) or whether it COMPLEMENTS it (by providing engineering capability that the cognitive framework cannot).

The honest assessment: if the architecture claims cognitive fidelity as its organizing principle, the Vault is a tension point. It is the one component that cannot be justified by appeal to cognitive science. It must be justified on pure engineering grounds -- which is valid, but breaks the theoretical coherence.

### 3.3 Counterargument: External Memory and Extended Cognition

The one cognitive framework that could support the Vault is the **Extended Cognition thesis** (Clark & Chalmers, 1998) -- the idea that cognitive processes extend beyond the brain to include external tools (notebooks, computers, archives). Under this view, the Vault is not modeling a brain component but modeling the filing cabinet, the bookshelf, the document archive that humans use to supplement biological memory. This is a valid framing but it shifts the architecture's claim from "modeling how the brain works" to "modeling how humans-plus-tools work."

---

## 4. Ingestion Pipeline vs. Passive Encoding: Terminus as Always-On Router

### 4.1 Automatic vs. Effortful Encoding in Cognitive Science

The brain encodes information through two pathways:

- **Automatic encoding:** Unconscious, incidental encoding of spatial information, temporal sequences, frequency data, and well-learned information. Requires no deliberate effort. This is real -- the brain does passively absorb certain types of information.
- **Effortful encoding:** Requires attention and conscious awareness. Produces deeper, more durable memory traces. Divided attention at encoding significantly degrades later recall.

**The attentional bottleneck:** Not everything can be deeply encoded. Attention is a finite resource. The brain's solution is selective attention -- most sensory input is filtered out before encoding. This filtering is not a bug; it is the mechanism that makes encoding possible at all.

### 4.2 Implications for Terminus as Ingestion Pipeline

The new model redefines Terminus from "stateless transport pipe" to "data ingestion pipeline -- hook-triggered scripts, background monitor, routes to Ledger or Library based on rules, not reasoning."

**Cognitive parallel:** Automatic encoding has a real analog here. The brain does route certain types of information to storage without deliberate attention. BUT the critical distinction is:

- The brain routes PROCESSED information, not raw data
- The routing is based on learned salience patterns, not static rules
- The attentional bottleneck means most input is DISCARDED, not routed

A "route everything" approach has no cognitive analog. The closest analog is the sensory register, which captures everything briefly but discards 99%+ within seconds. An always-on ingestion pipeline that routes all hook events to storage is more like a surveillance camera than a cognitive system.

**The "rules, not reasoning" routing:** This is actually MORE cognitively faithful than it might appear. Automatic encoding in the brain IS rule-based (or more precisely, pattern-based) -- it does not involve deliberate reasoning. The brain automatically encodes spatial context, temporal sequence, and frequency without System 2 involvement. The question is whether the rules capture the RIGHT things (salience, novelty, relevance) or just route by type.

---

## 5. Unified Search vs. Domain-Specific Retrieval: Assay as Search Layer

### 5.1 Does the Brain Have Unified Search?

The short answer is: not exactly, but something more interesting.

**Different memory systems use different retrieval mechanisms:**

- **Episodic memory:** Cue-dependent, context-sensitive retrieval. The hippocampus performs pattern completion -- given a partial cue, it reconstructs the full episodic context.
- **Semantic memory:** Spreading activation through concept networks. Retrieval is associative and graded, not all-or-nothing.
- **Procedural memory:** Implicit, triggered by environmental cues. Not accessible to conscious retrieval at all.

**But these systems interact during retrieval.** Recent fMRI research shows that episodic and semantic retrieval processes are not fully independent -- semantic cues enhance episodic retrieval and vice versa. The brain does not have a "unified search API" but it does have cross-system facilitation.

### 5.2 Implications for the Two Architectures

**Current spec (Assay):** Assay is the read-side counterpart to Ledger's write-side. It queries the knowledge graph and session index. Search operations go through Terminus transport. Assay does not decide relevance -- Reverie decides what to search for, Assay executes. This is a clean engineering abstraction that maps loosely to spreading activation (graph-based search) but does not model the interaction between different memory types.

**New model (Assay as unified hybrid search):** Assay searches across Ledger (knowledge graph), Library (long-term processed), Vault (raw artifacts), and external sources through a transparent interface. Uses Hyperspell-v2's hybrid search (vector + knowledge graph + keyword + cross-encoder reranking).

**Cognitive fidelity comparison:** The new Assay is arguably more cognitively faithful in one respect -- it enables cross-system retrieval facilitation, which the brain does. But it is LESS cognitively faithful in another -- it treats all memory types as searchable through the same interface, whereas the brain uses fundamentally different mechanisms for different memory types. Episodic retrieval (pattern completion) is qualitatively different from semantic retrieval (spreading activation), and neither works like exact-match lookup (which is what Vault retrieval would require).

The honest framing: unified search is an engineering convenience that enables something the brain does (cross-system interaction) through a mechanism the brain does not use (uniform query interface). Whether this is a net gain for cognitive fidelity depends on whether the important property is the cross-system interaction (yes -- new model wins) or the mechanism-specificity (yes -- current spec wins by not over-claiming).

---

## 6. Mapping the Two Architectures to Cognitive Theory

### 6.1 Component-to-Theory Mapping

| Cognitive Mechanism | Current Six-Subsystem Spec | New Cognitive-Layer Model | Science Says |
|--------------------|-----------------------------|---------------------------|-------------|
| **Sensory register** | Not modeled | Terminus (ingestion pipeline) -- partial | Very brief, massive filtering. Neither fully models this. |
| **Working memory / episodic buffer** | Reverie (integration function) | Reverie hot mode | Integration > retrieval. Both claim this. |
| **Short-term / fast recall** | Not explicitly separated | Ledger (fast-recall trigger) | Distinct from long-term. New model is more explicit. |
| **Long-term semantic memory** | Knowledge graph (via Assay/Ledger) | Library (Synix tiered compression) | Processed, schema-integrated. Library's tiered compression maps well. |
| **Long-term episodic memory** | Knowledge graph episodes | Ledger (Graphiti episodes) + Library | Graphiti's episode subgraph maps well in both. |
| **Raw sensory storage** | Not modeled | Vault | Does not exist in healthy cognition. |
| **Consolidation (NREM/REM)** | Reverie REM consolidation | Reverie REM feeds back to Terminus | Both model this. New model adds Terminus as pipeline. |
| **Adaptive forgetting** | Implicit in consolidation | Not explicitly addressed | Essential to healthy cognition. Gap in both. |
| **Spreading activation** | Reverie activation maps | Ledger triggers deeper searches | Both leverage graph structure. |
| **Dual-process (S1/S2)** | CJS hot path / subagent deliberation | Reverie hot mode / passive mode | Both model this. Mechanism differs. |
| **Emotional/subjective memory** | Affect metadata on entities | Journal (deferred) | Distinct neural substrates. New model's dedicated store is more faithful. |
| **Unified retrieval** | Assay (graph queries) | Assay (cross-store hybrid search) | Brain uses cross-system facilitation, not unified API. |
| **Context-dependent retrieval** | Reverie contextual framing | Assay + Reverie interpretation | Encoding specificity is fundamental. Both partially address. |

### 6.2 Theory Coverage Score (Informal)

| Theory | Current Spec Coverage | New Model Coverage |
|--------|----------------------|-------------------|
| Multi-store model | Partial (no explicit tier separation) | Strong (Ledger/Library/Vault as distinct stores) |
| Working memory / episodic buffer | Strong (Reverie as integrator) | Strong (Reverie as interpreter) |
| Levels of processing | Implicit (graph enrichment) | Explicit (Ledger shallow, Library deep, Vault raw) |
| Consolidation | Strong (REM consolidation in Reverie) | Strong (REM + Terminus feedback loop) |
| Dual-process | Strong (hot path / deliberation) | Strong (hot mode / passive mode) |
| Spreading activation | Strong (activation maps) | Moderate (Ledger triggers, but activation maps less central) |
| Adaptive forgetting | Weak (implicit only) | Weak (not addressed) |
| Emotional memory | Moderate (affect metadata) | Moderate-Strong (Journal concept, but deferred) |
| Encoding specificity | Moderate (context in graph) | Moderate (context distributed across stores) |
| Retrieval mechanisms | Moderate (graph-based) | Strong (hybrid multi-store search) |

---

## 7. Key Tensions and Trade-Offs for the Analysis

### 7.1 Theoretical Coherence vs. Engineering Pragmatism

The current spec maintains tighter theoretical coherence -- every component can be justified by cognitive science. The new model introduces the Vault, which breaks theoretical coherence but adds engineering capability. The analysis should evaluate whether theoretical coherence is more valuable than the practical capability the Vault provides.

### 7.2 Explicit Tiering vs. Implicit Enrichment

The new model makes memory tiers explicit (Ledger = fast recall, Library = long-term processed, Vault = raw). The current spec treats the knowledge graph as a unified store with implicit depth through graph structure. The science supports explicit tiering (multi-store model, levels of processing), but the brain's tiers are defined by PROCESSING DEPTH, not by storage location. The new model's tiers are defined by storage location AND processing depth, which is a closer mapping.

### 7.3 Terminus: Stateless Pipe vs. Active Router

The current spec's Terminus is a stateless transport layer. The new model's Terminus is an active ingestion pipeline. The science supports SOME automatic encoding (the brain does route information without deliberate attention), but with massive filtering (the attentional bottleneck). The analysis should evaluate whether Terminus-as-router preserves the filtering property or creates a "store everything" dynamic.

### 7.4 The Forgetting Gap

Neither architecture adequately models adaptive forgetting. This is a significant gap in both, and the analysis should surface it as a shared weakness rather than a differentiator.

### 7.5 Spreading Activation Centrality

The current spec makes spreading activation a first-class architectural concept (Reverie activation maps). The new model de-emphasizes it in favor of Ledger as a "fast-recall trigger" that drives deeper searches. The science says spreading activation is fundamental to how semantic retrieval works. If the new model's architecture makes activation maps less central, that may be a cognitive fidelity regression.

---

## Open Questions

1. **How does the new model's Assay handle mechanism-specific retrieval?**
   - The brain uses qualitatively different mechanisms for different memory types
   - A unified search interface may paper over important mechanistic differences
   - Recommendation: Evaluate whether Hyperspell-v2's hybrid search preserves mechanism diversity or homogenizes it

2. **Does the new model's Terminus routing include salience filtering?**
   - "Route everything" has no cognitive analog
   - The science requires massive pre-storage filtering
   - Recommendation: Evaluate whether the routing rules function as an attentional bottleneck or as a pass-through

3. **How does Library's tiered compression map to consolidation?**
   - Consolidation in the brain is transformative, not compressive
   - Compression preserves information in reduced form; consolidation restructures it
   - Recommendation: Evaluate whether Synix's tiered model transforms or merely compresses

---

## Sources

### Primary (HIGH confidence)
- Atkinson & Shiffrin (1968) -- multi-store model. [Wikipedia](https://en.wikipedia.org/wiki/Atkinson%E2%80%93Shiffrin_memory_model), [Simply Psychology](https://www.simplypsychology.org/multi-store.html)
- Baddeley & Hitch (1974), Baddeley (2000) -- working memory model, episodic buffer. [Wikipedia](https://en.wikipedia.org/wiki/Baddeley's_model_of_working_memory), [PubMed](https://pubmed.ncbi.nlm.nih.gov/11058819/)
- Craik & Lockhart (1972) -- levels of processing. [Simply Psychology](https://www.simplypsychology.org/levelsofprocessing.html), [Wikipedia](https://en.wikipedia.org/wiki/Levels_of_processing_model)
- Collins & Loftus (1975) -- spreading activation. [APA PsycNet](https://psycnet.apa.org/record/1976-03421-001), [Wikipedia](https://en.wikipedia.org/wiki/Spreading_activation)
- Tulving & Thomson (1973) -- encoding specificity. [Wikipedia](https://en.wikipedia.org/wiki/Encoding_specificity_principle)
- Kahneman (2011) -- dual-process theory. [The Decision Lab](https://thedecisionlab.com/reference-guide/philosophy/system-1-and-system-2-thinking), [Wikipedia](https://en.wikipedia.org/wiki/Dual_process_theory)
- Damasio -- somatic marker hypothesis. [Wikipedia](https://en.wikipedia.org/wiki/Somatic_marker_hypothesis), [ScienceDirect](https://www.sciencedirect.com/topics/neuroscience/somatic-marker-hypothesis)
- Memory consolidation during sleep. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12576410/), [Nature Neuroscience](https://www.nature.com/articles/s41593-019-0467-3), [Neuron (Cell)](https://www.cell.com/neuron/fulltext/S0896-6273(23)00201-5)
- Retrieval-induced forgetting. [Nature Communications](https://www.nature.com/articles/s41467-018-07128-7), [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4394359/)
- Memory reconsolidation. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5605913/), [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4588064/)

### Secondary (MEDIUM confidence)
- Zep/Graphiti architecture paper. [arXiv](https://arxiv.org/abs/2501.13956)
- MemGPT/Letta architecture. [arXiv](https://arxiv.org/abs/2310.08560), [Letta Docs](https://docs.letta.com/concepts/memgpt/)
- Mem0 architecture. [arXiv](https://arxiv.org/abs/2504.19413), [GitHub](https://github.com/mem0ai/mem0)
- Synix agent memory analysis. [Synix](https://synix.dev/articles/agent-memory-systems/)

### Tertiary (LOW confidence)
- Extended Cognition thesis (Clark & Chalmers, 1998) -- referenced for Vault justification argument but not independently verified in this research session

## Metadata

**Confidence breakdown:**
- Cognitive science foundations: HIGH -- established theories with 30-60 years of empirical support
- AI memory system survey: MEDIUM -- based on published papers and documentation, but tool capabilities evolve rapidly
- Architecture-to-theory mapping: MEDIUM -- my synthesis applying cognitive science to these specific architectures; reasonable people could map differently
- Vault analysis: HIGH -- the cognitive science is clear that raw indefinite storage has no biological analog; the engineering tradeoff assessment is my judgment

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (cognitive science is stable; AI memory tools may evolve)

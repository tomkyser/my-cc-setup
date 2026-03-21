# Adversarial Architecture Analysis: Six-Subsystem Specification vs. Cognitive-Layer Model

**Analysis Date:** 2026-03-19
**Scope:** Memory theory fidelity as primary evaluation dimension
**Method:** The cognitive-layer model is the thesis under test. The current six-subsystem specification is the steel-manned challenger. No verdict. No recommendation.

---

## 1. Architecture Portraits

### 1.1 The Current Six-Subsystem Specification

The current architecture organizes Dynamo into six subsystems with strict directional boundaries:

| Subsystem | Role | Key Boundary Rule |
|-----------|------|-------------------|
| **Dynamo** | System wrapper -- CLI router, shared resources, API surface | Routes commands; does not process data |
| **Switchboard** | Dispatcher -- hook routing, install/sync/update lifecycle | Dispatches events to handlers; does not implement handler logic |
| **Ledger** | Data construction -- episode creation, write-side formatting | Writes to the knowledge graph; never reads; zero LLM calls; stateless |
| **Assay** | Data access -- search, session queries, entity inspection | Reads from the knowledge graph; never writes to it |
| **Terminus** | Data infrastructure -- MCP transport, Docker stack, health, migrations | Stateless transport pipe; does not decide what flows through it |
| **Reverie** | Inner Voice -- cognitive processing, dual-path routing, activation management, REM consolidation | The only subsystem containing intelligence; reads through Assay, writes through Ledger |

**Data flow pattern:** All data enters and exits the knowledge graph through Terminus transport. Ledger provides write functions. Assay provides read functions. Reverie orchestrates both but delegates the actual operations. Switchboard dispatches hook events to the appropriate handler subsystem. The read/write boundary is enforced architecturally: Ledger never imports read functions, Assay never imports write functions.

**Cognitive processing:** Reverie implements a dual-path architecture. The hot path (CJS command hooks, <500ms) handles ~95% of operations through deterministic processing: entity extraction, activation map updates, threshold calculations, template-based injection formatting. The deliberation path (custom subagent or direct API call, 2-10s) handles complex synthesis, narrative generation, and session-start briefings. Path selection is itself deterministic -- based on entity match confidence, cached result count, semantic shift score, and explicit recall signals.

**Activation model:** Reverie maintains a spreading activation map as a first-class data structure. Entities mentioned in conversation receive activation that propagates through graph relationships (1-hop in v1.3, 2-hop in v1.4). Convergent activation from independent paths receives a 1.5x bonus. The sublimation threshold is a composite function of activation level, surprise factor, relevance ratio, cognitive load penalty, and confidence weight. All components are deterministic or pre-computed -- no LLM call required for threshold calculation.

**Consolidation:** Reverie implements a three-tier REM consolidation model. Tier 1 (PreCompact) preserves operational state before context compression. Tier 3 (Stop) performs full session synthesis, self-model updates, affect marker updates, and observation extraction. The consolidated output is written to the knowledge graph via Ledger and to local state files directly.

**Single knowledge graph:** The Graphiti temporal knowledge graph serves as the sole long-term data store. It provides a three-tier subgraph hierarchy (episode, semantic entity, community), bitemporal tracking (event time vs. ingestion time), and hybrid search (semantic embeddings + BM25 + graph traversal). All subsystems access the same graph through Terminus transport.

### 1.2 The Proposed Cognitive-Layer Model

The cognitive-layer model redefines subsystem roles and introduces new components to create explicit memory tiers:

| Component | Role | Key Distinction from Current Spec |
|-----------|------|----------------------------------|
| **Ledger** (Graphiti) | Fast-recall trigger layer -- graph-enriched entries that drive deeper searches | No longer a general-purpose write layer; repositioned as short-term/fast-recall |
| **Library** (Synix) | Long-term processed memory -- tiered compression via DAG pipelines | New component; Reverie REM consolidation target |
| **Vault** (TBD) | Raw artifact data lake -- exact retrieval, zero fuzzy matching | New component; transcripts, docs, images, video, command outputs |
| **Assay** (Hyperspell-v2) | Unified hybrid search across Ledger, Library, Vault, and external sources | Expanded from graph-only queries to cross-store search |
| **Terminus** | Data ingestion pipeline -- hook-triggered scripts, background monitor | Redefined from stateless transport to active routing based on rules |
| **Journal** (LangMem, deferred) | Reverie-private subjective/personality memory | New component; emotional/subjective memory with cross-domain taxonomies |
| **Reverie** | Hot mode (Ledger + Journal, fast) vs. passive mode (Library/Vault via Assay, deep) | Dual-mode replaces hot-path/deliberation; interprets all sources as parts of her own mind |
| **Switchboard** | Ops lifecycle manager -- manages start/stop/health/I/O for contained services | Expanded from dispatcher to service lifecycle management |

**Data flow pattern:** Data enters through Terminus, which actively routes incoming information to Ledger or Library based on rules (not reasoning). Assay provides a unified search interface across all stores -- Ledger (fast graph recall), Library (long-term processed), Vault (raw artifacts), and external sources -- through Hyperspell-v2's hybrid search capabilities. Reverie operates in two modes: hot mode draws from Ledger and Journal for fast, contextually immediate responses; passive mode queries Library and Vault through Assay for deep retrieval.

**Explicit memory tiers:** The model creates distinct storage tiers with different processing depths. Ledger holds graph-enriched entries for fast recall. Library holds tiered compressed memory at different abstraction levels (Synix's four-tier model: Execution/Session/Experience/Identity). Vault holds raw, unprocessed artifacts. Journal (deferred) holds subjective and personality memory. Each tier corresponds to a different cognitive function -- or attempts to.

**Consolidation target:** Reverie's REM consolidation feeds back through Terminus (now an ingestion pipeline), with consolidated output directed to Library for long-term storage. This creates a processing loop: raw data enters through Terminus, is processed by Reverie during sessions, and consolidated artifacts flow back through Terminus into Library.

**Tool research grounding:** The model is not purely theoretical. Synix (Library) offers programmable memory build pipelines with four-tier compression. Hyperspell-v2 (Assay) provides multi-tenant hybrid search with 50+ source connectors. LangMem (Journal) offers typed memory extraction with schema-driven processing. These are production tools with documented capabilities and limitations.

---

## 2. Memory Theory Framework: The Evaluative Lens

This analysis evaluates both architectures primarily through the lens of cognitive science memory theory. The following models establish what "cognitive fidelity" means in this context and what properties a cognitively faithful architecture should exhibit.

### 2.1 Core Memory Models

**Multi-Store Model (Atkinson & Shiffrin, 1968).** Memory operates through distinct stores with different characteristics. The sensory register holds raw input for 250ms-3s before it decays. Short-term memory holds ~7 items for 18-30 seconds. Long-term memory has effectively unlimited capacity and duration. The critical insight: the sensory register is not a storage system -- it is a pre-attentive buffer that filters aggressively. There is no cognitive analog to "store everything raw for later retrieval."

**Working Memory Model (Baddeley, 1974/2000).** Working memory is a multi-component system. The central executive directs attention and coordinates subsystems. The phonological loop and visuospatial sketchpad handle domain-specific temporary storage. The episodic buffer -- added in 2000 -- is a limited-capacity integration system that binds information from subsidiary systems AND long-term memory into coherent episodic representations. The episodic buffer does not merely retrieve; it integrates. This integration function is the property both architectures claim for Reverie.

**Levels of Processing (Craik & Lockhart, 1972).** Memory persistence is a function of encoding depth, not storage location. Shallow processing (structural features) produces fragile traces. Deep processing (semantic, meaning-based) produces durable traces. Elaborative encoding -- connecting new information to existing knowledge networks -- produces the most durable memories. The critical insight: a system that stores raw artifacts without semantic processing is performing shallow encoding at best. The science predicts that deeply processed memories will be more retrievable than raw stored data, regardless of storage fidelity.

**Memory Consolidation.** Two distinct processes operate at different timescales. Synaptic consolidation (minutes to hours) stabilizes new traces. Systems consolidation (days to years) transfers memories from hippocampus to neocortex through sleep-dependent replay and reorganization. The NREM/REM sleep cycle drives this: NREM replays and reorganizes; REM prunes and stabilizes. The critical insight: consolidation is NOT archival. It is active transformation that restructures, generalizes, and prunes. The brain does not move data between stores -- it changes the form of the memory during transfer.

**Dual-Process Theory (Kahneman).** Two cognitive processing modes: System 1 (fast, automatic, associative, ~95% of processing) and System 2 (slow, deliberate, serial, engaged on demand). The handoff from System 1 to System 2 is triggered by measurable signals -- uncertainty, complexity, novelty, prediction error -- not by reasoning about whether to engage.

### 2.2 Retrieval and Forgetting

**Spreading Activation (Collins & Loftus, 1975).** Semantic memory is a network of interconnected nodes. Activating one concept spreads activation to connected concepts, with strength decaying over distance. Multiple activation sources can converge (summation). This is content-addressable memory -- retrieval through associative pathways, not indexed lookup.

**Encoding Specificity (Tulving & Thomson, 1973).** Retrieval is most effective when retrieval cues match encoding context. Memories are not stored as isolated records -- they are bound to their encoding context. Retrieval is reconstructive, not playback.

**Adaptive Forgetting.** Forgetting is not a failure of memory. It is an active, adaptive cognitive process. Retrieval-induced forgetting actively suppresses competing memories. The prefrontal cortex engages inhibitory control to reduce interference. A system that stores everything without forgetting is cognitively unfaithful. Healthy cognition requires active pruning, suppression, and decay.

### 2.3 What "Cognitive Fidelity" Means

For this analysis, cognitive fidelity is evaluated along four dimensions:

1. **Structural correspondence.** Does the architecture's component structure map to recognized cognitive mechanisms? Are the boundaries between components consistent with how cognitive science draws boundaries between memory systems?

2. **Process fidelity.** Do the architecture's processes (encoding, storage, retrieval, consolidation) exhibit the properties that cognitive science ascribes to these processes? Consolidation should transform, not merely transfer. Retrieval should be context-sensitive, not uniform lookup. Encoding should be depth-variable, not uniform storage.

3. **Constraint honoring.** Does the architecture honor the constraints that cognitive science identifies? The attentional bottleneck means not everything gets encoded. Adaptive forgetting means not everything is retained. Cognitive load theory means not everything should be surfaced.

4. **Theoretical coherence.** Does the architecture maintain a consistent theoretical framework, or does it invoke cognitive science for some components while abandoning it for others? Mixed-metaphor architectures risk using cognitive theory as decoration rather than as a genuine design constraint.

---

## 3. Component-by-Component Adversarial Analysis

### 3.1 Ledger: Write-Only Construction vs. Fast-Recall Trigger

**Cognitive mechanism claimed:** Short-term/working memory (fast access, recently encoded), with graph enrichment providing associative structure.

**Current spec: Write-only data construction.** Ledger narrows to a pure write layer. It creates knowledge graph episodes through Terminus transport. It never reads the graph, contains zero LLM calls, and is stateless. Ledger is a construction crew -- it builds what it is told to build. The intelligence of what to write lives in Reverie; the transport lives in Terminus.

*Steel-man for the current spec:* This boundary is cognitively clean in a way that is easy to overlook. In the brain, the mechanisms that encode memories (hippocampal long-term potentiation, synaptic consolidation) are distinct from the mechanisms that retrieve them (pattern completion, spreading activation, cue-dependent recall). The current spec honors this distinction architecturally. By enforcing write-only boundaries, the spec prevents the kind of read-write coupling that would conflate encoding with retrieval -- a conflation that has no cognitive analog. The current spec also avoids the problematic framing of Ledger as a "fast-recall trigger" because it does not assign a cognitive identity to what is fundamentally an infrastructure function. Writing data is not short-term memory; it is encoding. The current spec correctly treats Ledger as an encoding mechanism, not as a memory store.

**New model: Fast-recall trigger layer.** Ledger is repositioned as the fast-recall layer. Graph-enriched entries in Ledger are not general-purpose writes but fast-access triggers that drive deeper searches. Ledger results prime Reverie to query Library or Vault through Assay.

*Where the new model genuinely succeeds:* The repositioning makes the multi-store model explicit. By designating Ledger as distinct from Library (long-term processed) and Vault (raw), the new model creates architectural tiers that correspond to recognized memory distinctions. Short-term/fast-recall is a genuine cognitive function that the current spec does not model explicitly -- the current spec has one knowledge graph serving all temporal roles. The new model's Ledger as fast-recall maps loosely to the hippocampal "index" theory, where the hippocampus stores pointers to cortical representations rather than full memories.

*Where the new model strains:* Graphiti's temporal knowledge graph already provides fast access to recent entities through its temporal model. The current spec's single-graph approach achieves fast recall through recency weighting and temporal fact management -- recent facts are naturally more accessible. Splitting fast recall into a separate named component may create a distinction without a meaningful difference if the underlying query mechanisms remain similar. The "fast-recall trigger" framing also risks confusing the storage medium (Graphiti) with the cognitive function (fast recall) -- the same database engine serves both roles.

### 3.2 Library: Long-Term Processed Memory

**Cognitive mechanism claimed:** Long-term semantic and episodic memory, with tiered compression mapping to consolidation-driven restructuring.

**Current spec: No direct analog.** The current spec's single knowledge graph serves as long-term storage through its semantic entity subgraph (semantic memory) and episode subgraph (episodic memory). There is no separate long-term processed store. Consolidation happens within the same graph structure -- Reverie's REM synthesis creates new episodes and updates entity relationships in the existing graph.

*Steel-man for the current spec:* The brain does not have a separate "Library" for long-term memories. The neocortex is the long-term store, and it is the same tissue that participates in ongoing cognition. The hippocampus-to-neocortex transfer (systems consolidation) is a gradual process where memories are reorganized and integrated into existing cortical schemas -- not moved to a different filing cabinet. The current spec's single-graph approach is arguably more cognitively faithful here: consolidated memories live alongside recent ones, differentiated by temporal metadata and graph structure (depth of semantic integration), not by storage location. The current spec treats the knowledge graph as a continuous landscape where depth of processing is reflected in graph structure (richer entity connections, higher community integration) rather than in physical separation.

**New model: Synix as Library.** Library uses Synix's four-tier model (Execution/Session/Experience/Identity) with DAG pipelines and incremental rebuilds. Information progresses through tiers of compression, with Reverie's REM consolidation feeding into Library through Terminus.

*Where the new model genuinely succeeds:* Synix's four-tier model has real cognitive parallels. Execution maps to working memory, Session to episodic, Experience to consolidated episodic, Identity to self-model/semantic. The DAG pipeline concept maps loosely to progressive consolidation -- information is transformed through defined stages rather than simply stored. Full provenance tracking maps to encoding specificity, preserving the encoding context. This tiered structure makes the levels of processing explicit: information at higher tiers has been more deeply processed and is more durable and abstract.

*Where the new model strains:* The central question is whether Synix's "tiered compression" is genuinely transformative (consolidation) or merely reductive (archival compression). Consolidation in the brain restructures memories -- it extracts patterns, generalizes across instances, integrates with existing schemas, and prunes irrelevant detail. If Synix's tiers perform lossy compression (reducing information volume while preserving key content), that maps to archival summarization, not to cognitive consolidation. If the tiers perform genuine restructuring (connecting new information to existing tier content, extracting cross-session patterns, revising prior abstractions), that maps much better. The answer depends on implementation details that have not been specified. Currently Synix operates at Tier 2 (Experience), so the theoretical model exceeds what the tool currently delivers.

### 3.3 Vault: Raw Artifact Data Lake

**Cognitive mechanism claimed:** External memory / archival storage. The analysis finds this is the most significant cognitive fidelity challenge in either architecture.

**Current spec: No analog.** The current spec does not store raw artifacts. All data enters the knowledge graph through Ledger's episode creation, which involves semantic processing by the Graphiti pipeline (entity extraction, relationship formation, community detection). There is no "store it raw" pathway.

*Steel-man for the current spec:* The brain does not store raw sensory data for later retrieval. The sensory register holds raw input for 250ms-3 seconds; after that, everything is processed. There is no long-term storage of raw sensory data in healthy cognition. Eidetic ("photographic") memory is vanishingly rare, not well-supported empirically, and where it exists is often associated with cognitive dysfunction rather than enhanced performance. The current spec's absence of a raw data store is not a gap -- it is cognitive fidelity. Everything the system remembers has been processed through the Graphiti pipeline, which performs entity extraction, relationship formation, and temporal tracking. This is the architectural equivalent of the brain's mandatory encoding step: no information enters long-term storage without semantic processing.

**New model: Vault as raw artifact store.** The Vault stores transcripts, documents, images, video, and command outputs in their original form. Retrieval is exact, not fuzzy. Zero semantic processing at storage time.

*Where the new model genuinely succeeds:* The Extended Cognition thesis (Clark & Chalmers, 1998) provides the strongest theoretical justification. Under this view, cognitive processes extend beyond the brain to include external tools -- notebooks, filing cabinets, document archives. The Vault is not modeling a brain component; it is modeling the filing cabinet. Humans supplement biological memory with external storage precisely because the brain cannot store everything raw. An AI system that acknowledges the value of unprocessed external records, accessible when needed, is modeling how humans-plus-tools work, even if it is not modeling how the brain alone works. There is also a practical engineering argument: some artifacts (code files, configuration documents, conversation transcripts) lose critical information when semantically compressed. The exact text of a configuration file matters in ways that a summary cannot capture.

*Where the new model strains -- and this is the central challenge:* If the architecture claims cognitive fidelity as its organizing principle, the Vault is a direct contradiction. Every other component can be justified by appeal to cognitive science. The Vault cannot. Its presence introduces a component that operates on principles opposite to those the rest of the architecture invokes:

| Property | Cognitive Science | Vault |
|----------|-------------------|-------|
| Processing at encoding | Mandatory; depth determines durability | None; stored raw |
| Forgetting/decay | Active, adaptive, essential to function | None; stored indefinitely |
| Retrieval mechanism | Associative, context-dependent, reconstructive | Exact match, context-independent |
| Fuzzy matching | Fundamental to how retrieval works | Explicitly excluded ("zero fuzzy") |

The question is not whether the Vault is useful (it clearly is for engineering purposes) but whether its presence undermines the theoretical coherence of the entire architecture. An architecture that says "we model the brain" for seven components and "we model a filing cabinet" for one must address whether the filing cabinet creates operational tensions with the brain-modeled components. For instance: if Reverie's hot mode draws from Ledger (fast-recall, semantically processed) while passive mode can access Vault (raw, exact), does the availability of raw artifacts change how Reverie processes? Does the system favor raw recall over reconstructive retrieval when both are available? If so, the Vault may not merely complement the cognitive architecture -- it may displace the cognitive mechanisms the architecture was designed to support.

### 3.4 Assay: Read-Only Graph Queries vs. Unified Cross-Store Search

**Cognitive mechanism claimed:** Retrieval -- ranging from associative recall (current) to cross-system facilitation (new).

**Current spec: Read-only knowledge graph access.** Assay executes search operations against the Graphiti knowledge graph: combined search (parallel fact + node), session listing and management, entity inspection. Assay does not decide relevance -- Reverie decides what to search for; Assay executes. The boundary is strict: Assay never writes to the knowledge graph.

*Steel-man for the current spec:* Assay's clean separation from relevance judgment is cognitively faithful to the distinction between retrieval mechanisms (largely automatic, associative, operating below conscious awareness) and retrieval decisions (which require working memory involvement, central executive engagement). Assay is the retrieval mechanism; Reverie is the central executive that directs it. This separation preserves a genuine cognitive distinction that the new model's expanded Assay may blur. Additionally, Assay's graph-based queries map naturally to spreading activation -- the dominant model of semantic retrieval. Graph traversal IS spreading activation, computationally realized. The current spec's Assay directly implements the cognitive mechanism it claims to model.

**New model: Unified hybrid search across all stores.** Assay, powered by Hyperspell-v2, searches across Ledger (knowledge graph), Library (tiered processed memory), Vault (raw artifacts), and external sources through a transparent interface. Hybrid search combines vector similarity, knowledge graph traversal, keyword matching, and cross-encoder reranking.

*Where the new model genuinely succeeds:* The brain does exhibit cross-system facilitation during retrieval. Recent fMRI research shows that episodic and semantic retrieval processes are not fully independent -- semantic cues enhance episodic retrieval and vice versa. A unified search layer that enables cross-store retrieval facilitation captures this property. The current spec's Assay, limited to the knowledge graph, cannot facilitate retrieval across different memory types because only one memory type exists (the graph). The new model's Assay enables a property -- cross-system interaction during retrieval -- that the science supports as genuine.

*Where the new model strains:* The brain does NOT have a unified search API. Different memory types use fundamentally different retrieval mechanisms. Episodic retrieval uses cue-dependent pattern completion (the hippocampus reconstructs episodes from partial cues). Semantic retrieval uses spreading activation through concept networks (graded, associative, not all-or-nothing). Procedural memory is implicit, triggered by environmental cues, not accessible to conscious retrieval at all. A unified search interface that treats all these through the same query mechanism homogenizes retrieval in a way the brain does not. The new model achieves cross-system interaction (which the brain does) through a mechanism the brain does not use (uniform query interface). Whether this is a net gain depends on whether the important cognitive property is the cross-system interaction itself or the mechanism-specificity of different retrieval types.

There is also a practical concern: querying across Ledger (graph-enriched), Library (tiered compressed), and Vault (raw) returns results at fundamentally different processing depths. A raw transcript from Vault and a deeply processed semantic entity from Library have different cognitive status -- the Library result has been through consolidation, while the Vault result has not been processed at all. A unified search interface that presents both in the same result set may obscure this distinction. Reverie would need to know the source tier of each result to process it appropriately, adding complexity that the interface was designed to hide.

### 3.5 Terminus: Stateless Transport vs. Active Ingestion Pipeline

**Cognitive mechanism claimed:** Automatic encoding / sensory filtering (new model); no cognitive claim (current spec).

**Current spec: Stateless transport pipe.** Terminus provides JSON-RPC transport to the Graphiti MCP server, Docker stack lifecycle management, health monitoring, diagnostics, and migrations. It is explicitly stateless. Terminus does not decide what flows through the pipe -- it provides the pipe and guarantees the pipe works.

*Steel-man for the current spec:* Not claiming a cognitive mapping is itself a form of intellectual honesty. The MCP transport layer, Docker infrastructure, and health monitoring are engineering infrastructure with no meaningful cognitive analog. The current spec does not invoke cognitive science to justify components that are purely technical. This restraint maintains the architecture's theoretical coherence: when the spec claims a cognitive mapping (Reverie as episodic buffer, spreading activation in the activation map), the claim carries weight because the spec does not over-claim elsewhere. Terminus-as-infrastructure is correctly identified as engineering, not cognition.

**New model: Active ingestion pipeline.** Terminus is redefined as a data ingestion pipeline. Hook-triggered scripts and a background monitor route incoming data to Ledger or Library based on rules. The routing decision is "rules, not reasoning" -- deterministic classification based on data type and source, not LLM evaluation.

*Where the new model genuinely succeeds:* Automatic encoding is a real cognitive mechanism. The brain does route certain types of information to storage without deliberate attention -- spatial context, temporal sequences, frequency data, and well-learned patterns are encoded automatically. The "rules, not reasoning" framing is actually more cognitively faithful than it initially appears: automatic encoding in the brain IS pattern-based, not deliberative. It does not involve System 2 processing. Terminus-as-router performing rule-based classification of incoming data maps to this automatic encoding pathway more directly than the current spec's passive transport.

*Where the new model strains:* The cognitive analog has a critical property that the Terminus-as-router model must address: the attentional bottleneck. The brain's automatic encoding captures certain types of information, but it DISCARDS vastly more. The sensory register processes enormous volumes of input and passes through only the fraction that meets salience criteria. The brain's solution to the encoding problem is not "route everything to the right store" but "filter aggressively and encode only what matters." If Terminus routes all hook events to some store (Ledger or Library), it implements the opposite of the cognitive mechanism it parallels -- a pipeline that captures everything rather than one that filters ruthlessly. The critical question: do Terminus's routing rules function as an attentional bottleneck (discarding low-salience input) or as a sorting mechanism (routing everything somewhere)? If the latter, the cognitive parallel breaks down.

### 3.6 Reverie: Integration Function and Dual Modes

**Cognitive mechanism claimed:** Episodic buffer (working memory model), dual-process cognition, spreading activation, REM consolidation.

**Current spec: Episodic buffer with hot path/deliberation.** Reverie is the sole cognitive subsystem. It implements the episodic buffer's integration function -- combining retrieved facts with relational context, temporal framing, and user communication patterns. The hot path (deterministic, <500ms) handles ~95% of operations. The deliberation path (subagent or API, 2-10s) handles complex synthesis. Spreading activation maps are a first-class data structure, tracking entity activation levels across the knowledge graph with propagation, decay, convergence detection, and threshold crossings.

*Steel-man for the current spec:* Reverie's design is deeply grounded in cognitive science at every level. The sublimation threshold function directly operationalizes five cognitive theories (spreading activation, predictive processing, relevance theory, cognitive load theory, metacognition) into a single composite score. The dual-path architecture maps to dual-process theory with the correct handoff property: path selection is signal-driven (entity match confidence, semantic shift score, result count) rather than configuration-driven. The hot path does not "decide" to engage the deliberation path through reasoning -- it triggers automatically based on measurable signals, which is how System 1 triggers System 2. The activation map implements spreading activation as a continuous, evolving data structure rather than as an ad-hoc query optimization. The 1-hop propagation limit, minimum propagation threshold, temporal weighting, and convergence bonus are all informed by known constraints on how semantic networks propagate activation. The self-model (Attention Schema Theory) and relationship model (Somatic Marker Hypothesis) provide the metacognitive layer that prevents the "confidently wrong" failure mode. This is a deeply theorized architecture where each component has a traceable relationship to specific cognitive science.

**New model: Hot mode / passive mode.** Reverie operates in two modes. Hot mode draws from Ledger and Journal for fast, contextually immediate responses. Passive mode queries Library and Vault through Assay for deep retrieval. REM consolidation feeds back to Terminus for routing to Library.

*Where the new model genuinely succeeds:* The hot/passive mode distinction maps to a real cognitive phenomenon. Hot cognition (affect-laden, fast, driven by immediate context and emotional associations) and cold cognition (deliberate, analytical, drawing on deep knowledge) are well-documented. By linking hot mode to Ledger (fast recall) and Journal (emotional/subjective memory), the new model creates a System 1-like pathway that is weighted by both recency and affect -- closer to how human automatic processing actually works. The current spec's hot path is affect-neutral (it does not weight by emotional associations), which is a known gap in System 1 modeling.

*Where the new model strains:* The spreading activation map's status in the new model is ambiguous. In the current spec, the activation map is a first-class data structure central to Reverie's processing -- it is what makes retrieval associative rather than query-based. The new model describes Ledger as a "fast-recall trigger" that "drives deeper searches," which suggests that activation propagation may be replaced or supplemented by a trigger-and-search pattern. If activation maps become less central in the new model, this represents a potential cognitive fidelity regression. Spreading activation is one of the most robust and well-validated models of semantic retrieval. The current spec's activation map directly operationalizes it. If the new model de-emphasizes activation maps in favor of cross-store search dispatching, it may lose the continuous, associative, emergent quality of spreading activation in favor of a more query-driven approach.

### 3.7 Switchboard: Dispatcher vs. Ops Lifecycle Manager

**Cognitive mechanism claimed:** Neither architecture makes a strong cognitive claim for Switchboard.

**Current spec: Dispatcher and operations.** Switchboard dispatches hook events (toggle gate, project detection, scope building, handler routing) and manages system lifecycle (install, sync, update, toggle). It dispatches but does not handle -- handlers live in their owning subsystems.

**New model: Ops lifecycle manager.** Switchboard manages start/stop/health/I/O for contained services. It expands from dispatching events to managing the operational lifecycle of other components.

*Analysis:* Both architectures correctly identify Switchboard as operations infrastructure with minimal cognitive mapping. The current spec's "dispatches but does not handle" boundary is architecturally clean and enables subsystem independence. The new model's service lifecycle management is a reasonable engineering evolution that does not affect cognitive fidelity in either direction. This component is evaluated on engineering merit rather than cognitive theory, and both approaches are reasonable.

### 3.8 Journal: Emotional and Subjective Memory (Deferred)

**Cognitive mechanism claimed:** Emotional memory (amygdala-mediated), subjective experience, somatic markers.

**Current spec: Affect metadata on existing entities.** The current spec includes the Somatic Marker Hypothesis as a secondary theory. Affect/valence tags are attached to knowledge graph entities as metadata. Emotional associations are properties of existing entities rather than a separate store.

**New model: Dedicated Journal store (deferred).** Journal, backed by LangMem, provides Reverie-private subjective and personality memory with cross-domain taxonomies. It is explicitly deferred and cannot be fully evaluated.

*Brief analysis:* The new model's dedication of a separate store to emotional/subjective memory has cognitive support. Emotional memory in the brain has distinct neural substrates (amygdala, orbitofrontal cortex) from semantic memory (temporal/parietal cortex). The current spec's metadata approach (emotional tags on semantic entities) conflates the neural substrates by treating emotional associations as properties of the same data structures that hold semantic content. The dedicated-store approach is arguably more faithful to the neuroscience.

However: LangMem's documented search latency (p50 ~18s) raises practical concerns that would interact with cognitive design. High retrieval latency for emotional associations would make them unavailable for System 1 (hot mode) processing, which is precisely where emotional memory is most influential in human cognition. Somatic markers bias fast, automatic decisions -- they must be available at System 1 speed. The deferral is noted but not deeply evaluated.

---

## 4. Cross-Cutting Tensions

The following tensions span multiple components and cannot be resolved by evaluating any single component in isolation. They represent the fundamental design tradeoffs between the two architectures.

| Tension | Current Spec Position | New Model Position | Science Position |
|---------|----------------------|-------------------|------------------|
| Theoretical coherence | Single framework throughout | Mixed frameworks (cognitive + extended cognition) | No direct guidance; coherence aids reasoning |
| Explicit tiering | Implicit (graph structure depth) | Explicit (separate stores) | Tiers exist but defined by processing depth, not location |
| Forgetting | Implicit in consolidation | Not addressed | Active, essential, adaptive |
| Spreading activation | First-class data structure | Unclear centrality | Fundamental to semantic retrieval |
| Consolidation | Additive (new episodes/models) | Potentially transformative (tier progression) | Transformative (restructuring) |
| Dual-process handoff | Signal-driven (specified) | Mode-based (underspecified) | Signal-driven |

### 4.1 Theoretical Coherence vs. Engineering Pragmatism

The current six-subsystem spec maintains tighter theoretical coherence. Every component can be justified by appeal to cognitive science. Ledger writes (encoding). Assay reads (retrieval). Reverie integrates (episodic buffer). Terminus transports (infrastructure, no cognitive claim). When the spec declines to assign a cognitive role to infrastructure components, it strengthens the cognitive claims it does make.

The new model introduces the Vault, which breaks this coherence. Seven of eight components can be justified cognitively; the Vault requires a different theoretical framework (Extended Cognition) that shifts the architecture's claim from "modeling how the brain works" to "modeling how humans-plus-tools work." This is not inherently wrong -- Extended Cognition is a legitimate framework -- but it is a different claim. An architecture that invokes two different theoretical frameworks must address whether they complement or conflict.

The tension is real: theoretical coherence makes an architecture easier to reason about, predict, and extend. When every component follows the same principles, you can derive the correct design for a new component by applying those principles. When one component follows different principles, you must know which framework applies where, and edge cases at the boundary between frameworks become harder to resolve.

But theoretical coherence is not intrinsically more valuable than engineering capability. The current spec's coherence is purchased partly by omission -- it does not store raw artifacts because raw storage has no cognitive analog, not because raw storage is useless. The new model's Vault provides genuine engineering capability (exact retrieval of original documents) that the current spec cannot match.

### 4.2 Explicit Tiering vs. Implicit Enrichment

The new model makes memory tiers explicit through storage location AND processing depth:

| Tier | Store | Processing Depth | Cognitive Mapping |
|------|-------|-----------------|-------------------|
| Fast recall | Ledger (Graphiti) | Graph-enriched | Short-term / hippocampal index |
| Long-term processed | Library (Synix) | Tiered compression | Consolidated neocortical |
| Raw | Vault | None | No cognitive analog |
| Emotional/subjective | Journal (deferred) | Personality-structured | Amygdala-mediated |

The current spec treats the knowledge graph as a unified store with implicit depth through graph structure:

| Depth Level | Indicator | Cognitive Mapping |
|-------------|-----------|-------------------|
| Recent episode | Temporal recency, low community integration | Hippocampal, pre-consolidation |
| Established entity | Multiple episode references, rich relationships | Partially consolidated |
| Community member | High-degree node, strong community assignment | Schema-integrated, neocortical |

The science supports explicit tiering -- the multi-store model and levels of processing both posit distinct memory forms. But the brain's tiers are defined by PROCESSING DEPTH, not by storage location. The neocortex does not have separate filing cabinets for "shallow" and "deep" memories. Depth of processing is reflected in the richness of neural connections, the strength of synaptic weights, and the degree of integration with existing schemas -- all properties of the same neural tissue, not of different tissues.

The new model conflates storage location with processing depth: Library stores deeply processed content, Vault stores raw content. This is architecturally clean but cognitively imprecise. The current spec's approach -- different depths reflected in different graph structure within the same store -- is closer to how the brain actually represents processing depth: through the richness of representation, not through storage location.

### 4.3 The Forgetting Gap

Neither architecture adequately models adaptive forgetting. This is a significant shared weakness.

In the brain, forgetting is an active, essential cognitive function. Retrieval-induced forgetting suppresses competing memories to reduce interference. Directed forgetting suppresses memories to facilitate new learning. Memory traces decay without rehearsal. These are not bugs -- they are fundamental to how memory works. Without active forgetting, retrieval would be overwhelmed by competition from irrelevant traces.

**Current spec:** Implicit forgetting through consolidation. Reverie's REM synthesis consolidates raw episodes into higher-order patterns, and the raw detail is effectively lost (the synthesis replaces the original). Graphiti's temporal fact management invalidates old facts (marking them as no longer current) without deleting them. But there is no active suppression mechanism -- no process that identifies memories competing with retrieval and actively suppresses them.

**New model:** No forgetting mechanism specified. The Vault explicitly stores everything raw with no decay. Library's tiered compression may lose detail at higher tiers, but this is archival compression, not adaptive forgetting. There is no mechanism that says "this memory is interfering with retrieval of more relevant memories; suppress it."

Both architectures would benefit from a forgetting mechanism. One approach: entities and relationships below a threshold of relevance (low activation over extended periods, no retrieval in N sessions) could be flagged for pruning during REM consolidation. This would honor the science while providing practical benefits (reduced graph noise, faster retrieval, lower storage costs).

### 4.4 Spreading Activation Centrality

The current spec makes spreading activation a first-class architectural concept. Reverie's activation map tracks entity activation levels as an explicit data structure with propagation, decay, convergence detection, and threshold crossings. The sublimation threshold -- the mechanism that determines when Reverie's processing surfaces into the active session -- depends directly on activation levels. Every processing cycle updates the map. The map is the substrate on which relevance decisions are made.

The new model describes Ledger as a "fast-recall trigger" that "drives deeper searches" in Library and Vault. This trigger-and-search pattern is functionally different from continuous spreading activation. In the current spec, activation propagates continuously through graph relationships, and entities accumulate activation from multiple independent paths over time. In a trigger-and-search model, Ledger results initiate targeted searches in other stores -- a more discrete, query-driven approach.

The cognitive science is clear: spreading activation is fundamental to how semantic retrieval works. Priming effects, associative memory, the "tip of the tongue" phenomenon, and convergent recall all depend on continuous activation propagation through semantic networks. A system that replaces continuous spreading activation with discrete trigger-and-search loses the emergent property of convergent activation -- the ability for unrelated conversation paths to independently activate the same entity, producing the "this keeps coming up" signal that the current spec explicitly models.

This is not a definitive judgment against the new model -- it may preserve spreading activation within Ledger's graph while adding cross-store search on top. But if the new model's architecture de-emphasizes the activation map in favor of cross-store dispatching, it risks losing one of the current spec's strongest cognitive mappings.

### 4.5 Consolidation Fidelity

Both architectures claim REM consolidation. The critical question is whether either is truly transformative.

**Cognitive science says:** Consolidation restructures memories. It extracts cross-experience patterns, generalizes specific instances into abstract schemas, prunes redundant connections, and strengthens connections that survive reactivation. The hippocampus replays recent experiences non-faithfully during sleep -- fragments are recombined, tested, reorganized. The output of consolidation is qualitatively different from the input. It is not a summary; it is a restructuring.

**Current spec (Reverie REM Tier 3):** Session synthesis via Sonnet (LLM). The Stop hook generates a session synthesis, updates the self-model and relationship model, extracts observations, and updates affect markers. This is closer to summarization than to restructuring -- it produces a session summary and model updates, but it does not restructure the knowledge graph itself. The existing entities and relationships in the graph are not reorganized by consolidation. The consolidation output is additive (new episode, updated model) rather than transformative (reorganized graph structure).

**New model (Reverie REM through Terminus to Library):** Consolidated output flows through Terminus into Library's tiered compression. If Synix's DAG pipelines perform genuine restructuring (connecting new session content to existing tier content, extracting cross-session patterns, revising prior abstractions), this could be more transformative than the current spec's additive approach. But if the pipelines perform summarization-at-different-granularities, the improvement is quantitative (more tiers of summary) rather than qualitative (genuine restructuring).

Neither architecture currently implements truly transformative consolidation as the science describes it. The current spec's consolidation is additive (adds synthesis to the graph). The new model's consolidation could be transformative (if Synix restructures across tiers) but this depends on implementation. Both claim REM consolidation; neither fully delivers the restructuring property that makes REM consolidation cognitively distinct from simple archival.

### 4.6 Dual-Process Handoff: Signal-Driven vs. Configuration-Driven

Both architectures implement dual-process cognition. The critical question is how the handoff between fast and slow processing is triggered.

**Current spec:** Signal-driven handoff. The hot path evaluates measurable signals -- entity match confidence, cached result count, semantic shift score, explicit recall requests -- and triggers the deliberation path when those signals indicate uncertainty or complexity. The path selection function is deterministic (no LLM call) but responsive to the content of the current processing cycle. This maps well to how System 1 triggers System 2: not through reasoning about whether to engage, but through automatic signal detection.

**New model:** Mode-based routing. Reverie operates in hot mode (Ledger + Journal) or passive mode (Library + Vault via Assay). The trigger for switching modes is not specified in detail in the available context. If the mode switch is driven by measurable signals (similar to the current spec's approach), cognitive fidelity is preserved. If modes are selected by configuration or predetermined routing rules (e.g., "session start always uses passive mode"), this is more engineering-convenient than cognitively faithful. The current spec explicitly designs against configuration-driven routing:

> "System 1 does NOT decide whether to engage System 2 through reasoning. The handoff is triggered by measurable signals: uncertainty, complexity, novelty, prediction error."

The new model's hot/passive distinction has a cognitive advantage in linking hot mode to emotional memory (Journal) -- somatic markers influencing fast processing is well-supported by the science. But the mechanism for switching between modes must be signal-driven to maintain cognitive fidelity.

---

## 5. Where Each Architecture Genuinely Wins

### 5.1 The Current Six-Subsystem Spec's Genuine Strengths

**Theoretical coherence.** The current spec's greatest strength is that every component can be justified by the same theoretical framework. Ledger writes (encoding), Assay reads (retrieval), Reverie integrates (episodic buffer), Terminus transports (infrastructure, correctly identified as non-cognitive). When you extend this architecture -- adding a new capability, designing a new subsystem -- you can derive the correct design by applying the cognitive science principles consistently. You do not need to ask "which theoretical framework applies here?" because the same framework applies everywhere. This coherence is not just aesthetic; it makes the architecture predictable and extensible.

**Spreading activation as first-class architecture.** The activation map is not an afterthought or an optimization -- it is the mechanism through which relevance emerges. By maintaining a continuous, evolving activation map across the knowledge graph, the current spec implements spreading activation more faithfully than any production AI memory system documented in the research. The convergence detection (multiple independent paths activating the same entity), the sublimation threshold (composite function of five cognitive factors), and the propagation mechanics (hop limits, decay, domain frame weighting) are all directly derived from the cognitive science. This is not a system that uses graph search and calls it "associative" -- it is a system that implements the mathematics of spreading activation.

**Clean read/write boundary.** The Ledger-never-reads / Assay-never-writes boundary is more than organizational cleanliness. It enforces the cognitive distinction between encoding mechanisms and retrieval mechanisms. In the brain, these are different neural processes mediated by different structures. By making them architecturally separate subsystems that cannot cross-call, the current spec prevents the kind of read-write coupling that would create behaviors with no cognitive analog. This boundary also enables independent optimization: Assay can add caching without affecting Ledger; Ledger can add structured episodes without affecting Assay.

**Honest boundaries.** Terminus makes no cognitive claim. Switchboard makes no cognitive claim. When the spec says "this component has no cognitive analog, it is engineering infrastructure," it strengthens every other cognitive claim the spec makes. Compare this to an architecture where every component has a cognitive label, some of which are stretches. The current spec's willingness to leave infrastructure as infrastructure earns credibility for its genuine cognitive mappings.

**Sublimation threshold mechanism.** The composite threshold function that governs when Reverie's processing surfaces into the active session is a sophisticated operationalization of multiple cognitive theories in a single mechanism. Activation level (spreading activation) times surprise factor (predictive processing) times relevance ratio (relevance theory) times cognitive load adjustment (cognitive load theory) times confidence weight (metacognition). All factors are deterministic or pre-computed. The threshold adapts based on outcome history (metacognitive adjustment). This is a concrete, implementable mechanism that directly translates cognitive science into engineering specification.

### 5.2 The Cognitive-Layer Model's Genuine Strengths

**Explicit memory tiering.** The multi-store model -- one of the most robust findings in cognitive science -- posits that memory operates through distinct stores with different characteristics. The current spec uses a single knowledge graph for all temporal roles. The new model creates explicit stores (Ledger, Library, Vault, Journal) with different processing depths, retention characteristics, and retrieval mechanisms. By making tiers architecturally explicit, the new model can enforce tier-specific properties: fast recall in Ledger degrades gracefully without affecting Library's long-term storage; Library can apply deep processing without blocking Ledger's fast access. The current spec must simulate these tiers through temporal metadata within a single store, which is less enforced and easier to violate.

**Cross-store retrieval facilitation.** The brain's memory systems interact during retrieval -- semantic cues enhance episodic retrieval, and episodic context shapes semantic access. The current spec's Assay queries a single store. The new model's Assay, searching across Ledger, Library, Vault, and external sources, enables the kind of cross-system interaction that the brain exhibits. A query that finds a fast-recall trigger in Ledger AND a deeply processed pattern in Library AND a raw transcript in Vault provides richer retrieval context than any single-store query can. This is a genuine capability expansion that has cognitive support.

**Emotional memory as a distinct component.** The Journal concept (deferred though it is) recognizes that emotional and subjective memory has distinct neural substrates and distinct behavioral properties. The Somatic Marker Hypothesis demonstrates that emotional associations are not mere metadata on cognitive content -- they are a separate, parallel memory system that directly influences decision-making. The current spec treats emotional memory as tags on existing entities, which conflates the neural substrate question. The new model's dedication of a separate store to emotional memory is more faithful to the neuroscience, even if the implementation is deferred.

**Automatic encoding pathway.** Terminus as an active ingestion pipeline, routing incoming data to appropriate stores based on rules, maps to a real cognitive mechanism: automatic encoding. The brain does route certain types of information to storage without deliberate attention. The current spec's Terminus is purely passive -- it transports what it is told to transport. The new model's Terminus adds a layer of automatic classification that has genuine cognitive support, provided the routing rules include salience filtering (discarding low-relevance input) rather than just type-based sorting.

**Tool-grounded feasibility.** The new model is not purely theoretical. Synix, Hyperspell-v2, and LangMem are production tools with documented APIs, performance characteristics, and limitations. This grounds the architecture in what is actually buildable with current technology. The current spec's more ambitious cognitive claims (spreading activation across the full graph, sublimation threshold with five cognitive factors) are theoretically beautiful but must be built from scratch. The new model's approach of mapping cognitive functions to existing tools reduces implementation risk at the cost of some theoretical purity.

**Progressive processing depth.** The pipeline from raw input (Terminus ingestion) through fast recall (Ledger) to deep processing (Library) creates an explicit encoding depth gradient. Information that enters the system starts shallow and progressively deepens through consolidation. This maps to the levels of processing framework: shallow encoding produces fragile traces; deep encoding produces durable ones. The current spec's single-graph approach does not make this gradient explicit -- all data enters the same way through the same pipeline. The new model's gradient architecture means you can inspect where information is in its processing journey and predict its durability based on tier.

---

## 6. Unresolved Questions

These questions cannot be answered by this analysis alone. They require additional specification, implementation experience, or empirical measurement.

**1. How does Synix's tiered compression relate to cognitive consolidation?** Compression preserves information in reduced form. Consolidation restructures it -- extracting patterns, generalizing, pruning, integrating with existing schemas. The Library's cognitive fidelity depends on whether Synix performs genuine restructuring or merely lossy compression at different granularities. This is an empirical question that requires examining Synix's DAG pipeline outputs.

**2. Do Terminus's routing rules function as an attentional bottleneck?** The cognitive parallel requires that most incoming information is DISCARDED, not routed. If Terminus routes all hook events to some store, it implements the opposite of the cognitive mechanism it parallels. The answer depends on whether the routing rules include "discard" as a routing destination and whether the discard criteria are salience-based.

**3. What happens to spreading activation in the new model?** The current spec's activation map is a first-class data structure. The new model's Ledger-as-trigger description suggests a more discrete, query-driven approach. Does the new model preserve continuous spreading activation within Ledger's graph while adding cross-store search? Or does it replace continuous activation with trigger-and-search? The answer fundamentally affects cognitive fidelity.

**4. How does unified search handle results at different processing depths?** When Assay returns a raw Vault transcript alongside a deeply processed Library pattern and a fast-recall Ledger trigger, how does Reverie weight them? Does Reverie know the source tier? Does processing depth inform relevance scoring? If all results are treated uniformly, the unified interface obscures information that Reverie needs for faithful cognitive processing.

**5. Does the Vault's availability change Reverie's retrieval behavior?** When raw, unprocessed artifacts are available alongside semantically processed memories, does the system favor exact recall over reconstructive retrieval? In human cognition, retrieval is always reconstructive -- the brain never "plays back" stored records. If the Vault enables exact playback of stored artifacts, and Reverie preferentially uses exact playback when available, the system may drift from reconstructive retrieval (cognitively faithful) toward database lookup (cognitively unfaithful).

**6. What is the handoff mechanism between hot mode and passive mode?** The current spec specifies signal-driven handoff with measurable criteria (entity match confidence, semantic shift score, cached result count). The new model defines two modes but does not fully specify the trigger for switching between them. Is it signal-driven (cognitively faithful) or configuration-driven (engineering convenient)?

**7. How does Journal's high search latency interact with hot mode?** LangMem's documented p50 search latency of ~18 seconds makes it incompatible with hot mode's latency requirements. If Journal is intended to influence fast/hot processing (somatic markers biasing System 1 decisions), the latency characteristic creates a fundamental tension between the cognitive design and the tool capability.

**8. Can either architecture implement truly transformative consolidation?** Both claim REM consolidation, but neither specification describes the restructuring, generalization, and schema integration that characterize biological consolidation. Is this a specification gap (the mechanisms exist but are underspecified) or a fundamental limitation of current technology?

**9. How do the two architectures handle reconsolidation?** In cognitive science, retrieved memories enter a labile state and can be modified before re-stabilization. Every retrieval is potentially a modification event. The current spec's Graphiti supports temporal fact management (old facts are invalidated, new facts created), which is a form of reconsolidation at the data level. The new model's multi-store architecture raises the question differently: when a Library entry is retrieved through Assay and used by Reverie, does the retrieval event update the Library entry? If so, through what pathway? If not, the system lacks a reconsolidation mechanism.

**10. What is the migration path between architectures?** The current spec exists as a detailed, implementable specification with defined file paths, module interfaces, and migration scripts. The new model is a conceptual architecture grounded in tool research but without implementation specification. Any transition between them requires a concrete migration plan that preserves existing capabilities while introducing new components. The Vault, Library, and Journal components each require infrastructure decisions (storage backend, API integration, deployment model) that are not yet specified.

**11. How does each architecture handle the cold start problem?** Both architectures assume a populated knowledge graph for their cognitive mechanisms to operate on. With a new or sparse graph, spreading activation has nowhere to spread, cross-store retrieval has nothing to cross-reference, and tiered processing has nothing to tier. The current spec addresses this explicitly (activation.cjs checks density threshold at session start; graph density below 100 entities / 200 relationships disables spreading activation in favor of simple entity-mention matching). The new model does not specify cold start behavior for its additional stores.

---

## 7. Metadata

**Analysis date:** 2026-03-19

**Source documents:**

| Document | Role in Analysis |
|----------|-----------------|
| `260319-jjw-CONTEXT.md` | New cognitive-layer model definition |
| `260319-jjw-RESEARCH.md` | Cognitive science memory theory framework |
| `REVERIE-SPEC.md` (1,463 lines) | Reverie subsystem specification -- dual-path, activation maps, REM, subagent |
| `INNER-VOICE-ABSTRACT.md` (471 lines) | Platform-agnostic Inner Voice concept -- 15 cognitive theories, sublimation model |
| `DYNAMO-PRD.md` (441 lines) | Product requirements -- six-subsystem boundaries, interface pattern, value proposition |
| `TERMINUS-SPEC.md` (682 lines) | Terminus specification -- stateless transport, MCP client, stack lifecycle |
| `SWITCHBOARD-SPEC.md` (819 lines) | Switchboard specification -- dispatcher model, static routing, cc/ adapter |
| `LEDGER-SPEC.md` (682 lines) | Ledger specification -- write-only, episode creation, zero LLM calls |
| `ASSAY-SPEC.md` (871 lines) | Assay specification -- read-only, search operations, session index |

**Theoretical frameworks applied:**

| Framework | Key Insight Used |
|-----------|-----------------|
| Multi-Store Model (Atkinson & Shiffrin) | Distinct memory stores with different characteristics; no raw long-term storage |
| Working Memory Model (Baddeley) | Episodic buffer as integration function, not just retrieval |
| Levels of Processing (Craik & Lockhart) | Encoding depth determines durability; storage location is secondary |
| Memory Consolidation Theory | Consolidation is transformative (restructuring), not archival (moving) |
| Dual-Process Theory (Kahneman) | Signal-driven handoff between fast and slow processing |
| Spreading Activation (Collins & Loftus) | Content-addressable retrieval through associative networks |
| Encoding Specificity (Tulving & Thomson) | Context-dependent retrieval; memories bound to encoding context |
| Adaptive Forgetting | Forgetting is active and essential; store-everything systems are cognitively unfaithful |
| Somatic Marker Hypothesis (Damasio) | Emotional memory as distinct substrate influencing automatic decision-making |
| Extended Cognition (Clark & Chalmers) | Cognitive processes extend to external tools; theoretical justification for Vault |

**Evaluation approach:** Each architecture component was evaluated against the specific cognitive mechanism it claims to model. Where an architecture diverges from the science, the analysis determines whether the divergence is a deliberate engineering tradeoff (noted as such) or a misunderstanding of the theory it invokes (flagged as a fidelity issue). Both architectures are given the strongest possible reading on their own terms.

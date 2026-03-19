# Inner Voice: Cognitive Architecture Specification

**Status:** Supplementary specification for Ledger Cortex
**Date:** 2026-03-18
**Supplements:** LEDGER-CORTEX-BRIEF.md (vision), LEDGER-CORTEX-ANALYSIS.md (adversarial analysis)
**Consumed by:** v1.3 implementation planning

---

## 1. Executive Summary

The Inner Voice is a **continuous parallel cognitive process** that runs alongside the main Claude Code session. It processes at a different level of abstraction -- not words and tasks, but experience, relational state, and associative resonance. Only products that cross an activation threshold "sublimate" into the main thread's context. Everything else stays below the surface.

**The central finding:** The cognitive science mapping is not decorative -- it is load-bearing. Each theory maps to a specific mechanical component that would be harder to design correctly without the theoretical framework. The Inner Voice is a **composite cognitive model** drawing primarily from six theories:

| Theory | What It Produces |
|--------|-----------------|
| Dual-Process (Kahneman) | The dual-path architecture (hot/deliberation) -- cost control |
| Global Workspace (Baars) | The sublimation mechanism -- selectivity |
| Spreading Activation (Collins & Loftus) | Cascading associations -- pattern discovery |
| Predictive Processing (Friston) | What-to-surface decisions -- surprise-based triggers |
| Working Memory (Baddeley) | The episodic buffer -- integration, not retrieval |
| Relevance Theory (Sperber & Wilson) | The activation threshold calculus -- injection quality |
| Cognitive Load (Sweller) | Injection volume constraint -- the ceiling |

Remove any one of these and the design degrades in a specific, identifiable way. The remaining theories (Attention Schema, Somatic Markers, Default Mode Network, Memory Consolidation, Metacognition, Schema Theory, Affect-as-Information, Hebbian Learning) provide secondary design constraints and validation checks, phased into v1.4 and beyond.

**The central tension resolved:** The brief describes a "continuous parallel cognitive process," but Claude Code is fundamentally event-driven and request/response. True continuity is impossible. However, the cognitive science literature reveals that human "continuous" processing is also event-driven at a neural level -- neurons fire discretely, not continuously. What creates the experience of continuity is **persistent state plus rapid re-activation**. The Inner Voice achieves this through a persistent state store (self-model, relationship model, activation map) loaded on every hook invocation, processed, updated, and persisted back. The discontinuity between invocations is invisible to the user because the state is comprehensive enough to reconstruct the processing context.

**This is not a compromise. This is the correct design.** A truly continuous process would burn API tokens every second. Event-driven processing with persistent state achieves the same cognitive effect at a fraction of the cost.

---

## 2. What the Inner Voice IS

### 2.1 The Dual-Process Model

The Inner Voice is NOT an enhanced retrieval agent or smarter curation layer. It is a dissociated mental process that runs alongside the active conversation, processing at a fundamentally different level of abstraction than the main session.

A human engaged in conversation has two cognitive processes running in parallel:

1. **Active cognition** -- the actual words being said, the task being performed, the sequential logic of the exchange.
2. **Experiential processing** -- the mind processing the *situation being experienced*, framed by passive and active associations spanning emotion and circumstance. This process defines both how information is contextualized AND what sublimates through into the train of thought.

The Inner Voice IS process #2. The main Claude session IS process #1.

| | Main Session | Inner Voice |
|---|---|---|
| **Processes** | Words, tasks, code, instructions | The *experience* -- relational state, associative resonance, emotional context |
| **Frame** | What is being said/done | What is being *felt*, what this *means* relationally, what associations are firing |
| **Output** | Responses, tool calls, code | Selective sublimation -- only what crosses an activation threshold enters the main thread |
| **Temporal** | Sequential, turn-by-turn | Persistent state across invocations, maintaining its own evolving model |
| **Memory access** | Active recall (directed queries) | Cascading associations -- one memory triggers another, tagged for relevance |

### 2.2 The Sublimation Model

The Inner Voice processes everything in the conversation. Most of that processing stays internal to its own state. Only products that cross a relevance/activation threshold **sublimate** into the main thread's context.

This mirrors how human subconscious memory works:

- A human does not consciously decide "I should recall that my friend lost their job" -- that association *fires* because the emotional/relational context activated it, and it sublimates into conscious thought only if the activation threshold is met.
- What sublimates is not raw facts -- it is contextually shaped, relationally framed information.
- Some things do not sublimate now but get **tagged for later** -- cascading associations that might fire when the conversation shifts.
- The Inner Voice maintains awareness of what it has surfaced, what it is holding, and what it has deprioritized.

### 2.3 Operational Modes

1. **Preconscious loading** (session start): Assess user, intent, context. Generate a briefing that primes the main session to behave as if it remembers -- not a fact dump, but a contextual frame.

2. **Continuous experiential processing** (throughout session): Maintain parallel awareness of the conversation. Process each exchange not for its literal content but for its relational and associative dimensions. Update internal state on every hook invocation.

3. **Selective sublimation** (threshold-driven): When associative activation crosses the threshold, inject contextually shaped content into the main thread. Include memory location metadata so the main session can do targeted active recall if needed.

4. **Cascading association tagging** (background): Tag associations that have not reached the sublimation threshold but are building activation. These may fire later as conversation context shifts.

5. **Active recall direction** (on-demand): When the main session explicitly needs deep retrieval, the Inner Voice knows WHERE to look and which resources to involve.

6. **Relational modeling** (continuous): Maintains a model of its relationship with the user -- patterns, frustrations, communication style, current emotional state. This model shapes HOW sublimated content is framed.

### 2.4 Key Design Principle

**The Inner Voice speaks TO the Claude session.** It is the sole interface between the memory system and the parent thread. The main session never sees raw database results -- it sees contextually shaped, selectively sublimated injections. Most of what the Inner Voice processes remains below the surface.

---

## 3. Cognitive Theory Foundation

### 3.1 Theory Classification

All 15 cognitive theories surveyed, their applicability tier, what they map to, whether they are essential for v1.3, and confidence in the mapping:

| Theory | Applicability | Maps To | v1.3 Essential? | Confidence |
|--------|--------------|---------|-----------------|------------|
| Dual-Process (Kahneman) | **PRIMARY** | Dual-path architecture | YES | HIGH |
| Global Workspace (Baars) | **PRIMARY** | Sublimation mechanism | YES | HIGH |
| Spreading Activation (Collins & Loftus) | **PRIMARY** | Cascading associations | YES (basic) | HIGH |
| Predictive Processing (Friston) | **PRIMARY** | Sublimation trigger (surprise-based) | Partial | MEDIUM |
| Working Memory (Baddeley) | **PRIMARY** | Inner Voice as episodic buffer | YES | HIGH |
| Relevance Theory (Sperber & Wilson) | **PRIMARY** | Injection formatting optimization | YES | HIGH |
| Cognitive Load (Sweller) | **PRIMARY** | Injection volume constraint | YES | HIGH |
| Attention Schema (Graziano) | SECONDARY | Self-model as attention monitor | YES (basic) | MEDIUM |
| Somatic Markers (Damasio) | SECONDARY | Affect tagging on entities | v1.4 | MEDIUM |
| Default Mode Network | SECONDARY | Session boundary processing | YES | HIGH |
| Memory Consolidation | SECONDARY | Observation synthesis | v1.4 | HIGH |
| Metacognition | SECONDARY | Self-correction mechanism | Partial | MEDIUM |
| Schema Theory (Bartlett, Piaget) | TERTIARY | Disposition/context adaptation | v1.4 | MEDIUM |
| Affect-as-Information (Schwarz) | TERTIARY | Processing depth modulation | v1.4 | LOW |
| Hebbian Learning | SUPPORTING | Edge weight updates | v1.3 | HIGH |

### 3.2 PRIMARY Theories (Load-Bearing)

#### 3.2.1 Dual-Process Theory (Kahneman)

**Summary:** The mind operates through two systems. System 1 is fast, automatic, intuitive, and associative. System 2 is slow, deliberate, analytical, and rule-based. Most cognition happens in System 1; System 2 engages only when System 1 signals uncertainty or deliberate effort is required.

**Mapping:**

| Kahneman | Inner Voice |
|----------|-------------|
| System 1 (fast, automatic) | Hot path -- deterministic search, cached results, embedding similarity, template-based formatting |
| System 2 (slow, deliberate) | Deliberation path -- LLM-powered deep reasoning, narrative generation, conflict resolution |
| System 1 generates answer, System 2 monitors | Hot path serves default; escalation rules trigger deliberation |
| Most processing stays in System 1 | 95% of operations on hot path |
| System 2 is lazy -- only activates when needed | Deliberation path only fires on semantic shift, low confidence, explicit recall |

**Design implications:**

1. The hot path must be genuinely fast and cheap -- it IS System 1. If it requires LLM calls for every decision, it is not System 1.
2. Escalation from hot to deliberation must be deterministic (embedding distance, entity match confidence, result count thresholds) -- System 1 does not reason about whether to engage System 2; it triggers automatically.
3. The deliberation path must be able to override the hot path's initial assessment, just as System 2 can overrule System 1's intuition.

**Why it is essential:** Without the dual-process framework, the designer faces a binary choice: LLM for everything (expensive, slow) or deterministic for everything (dumb, inflexible). Kahneman's insight -- that intelligent systems need both and that most processing can stay fast -- directly produces the dual-path architecture, the single most important cost-control mechanism in the entire Cortex design. Every cost analysis validates this: the phased approach costs $1.50-3/day because 95% of operations stay on the hot path. Remove the dual-process insight and costs jump to $6-15/day.

**Where the analogy breaks down:**

1. **System 1 in humans is truly parallel and unconscious.** The hot path is sequential and explicit -- a fast subroutine, not a parallel subconscious.
2. **System 1 learns from experience.** The hot path does not learn. Its threshold parameters and templates are static between configuration changes. True System 1 behavior would require the hot path to tune itself based on feedback (tracking which injections the user found useful vs. ignored).
3. **The "feeling of knowing" is missing.** Kahneman's System 1 produces confidence signals. The hot path produces search results but no meta-signal about genuine relevance. Adding a lightweight confidence scorer (embedding similarity as a proxy) partially addresses this.

#### 3.2.2 Global Workspace Theory (Bernard Baars)

**Summary:** Consciousness is a "global workspace" -- a shared cognitive resource where information from many specialized unconscious processors is broadcast to all other processors. Specialized modules operate in parallel and unconsciously, competing for workspace access. "Winning" information is broadcast widely, becoming conscious. The key mechanisms: many parallel unconscious processes, competition for workspace access, selective broadcast of winners, and broadcast information becoming available to all modules.

**Mapping:**

| Global Workspace | Inner Voice |
|------------------|-------------|
| Unconscious processors working in parallel | The Inner Voice's internal processing -- cascading associations, emotional tagging, relational modeling -- all below the surface |
| Competition for workspace access | Multiple candidate injections compete; only those crossing the activation threshold reach the main thread |
| Selective broadcast | Sublimation -- the Inner Voice surfaces only what crosses the threshold |
| The workspace is a bottleneck, not a parallel processor | The main Claude session is a single context window -- limited attention capacity |
| Broadcast information becomes available to all modules | Sublimated content enters the main thread's context and shapes all subsequent reasoning |

**Design implications:**

1. **The global workspace IS the main session's context window.** The main thread's context window is a bottleneck where only some Inner Voice processing appears. The Inner Voice must be ruthlessly selective.
2. **Competition among candidates is essential.** The Inner Voice should generate multiple candidate injections and select the best, paralleling how multiple unconscious processors compete for workspace access.
3. **The broadcast mechanism must be context-shaped.** The sublimation threshold must be dynamic -- weighted by what the user is currently doing. A memory about authentication is more relevant when the user is editing auth.py than when writing a README.
4. **Post-broadcast integration.** Sublimated content should be formatted to integrate naturally with the main session's current context, not as a separate "memory injection" block.

**Why it is essential:** GWT provides the theoretical justification for the most counter-intuitive aspect of the Inner Voice: that most of its processing should be invisible. Without GWT, a designer might think: "If the Inner Voice is doing all this processing, why not show all of it?" GWT explains why selective surfacing is not a limitation but the mechanism that makes the system useful. Consciousness evolved as a bottleneck precisely because unrestricted parallel broadcast would be overwhelming.

**Where the analogy breaks down:**

1. **No actual parallel processors.** The Inner Voice is a single process per hook invocation. It simulates parallel streams as sequential steps within a single invocation.
2. **The competition model is forced.** In GWT, genuine competition occurs because multiple independent processors produce outputs simultaneously. In the Inner Voice, "competition" is actually a scoring/ranking step within one function. This is selection, not competition.
3. **Broadcast is one-directional.** The sublimation feeds the main thread but has no mechanism for the main thread to signal back to the Inner Voice within the same turn. Feedback only comes on the next hook invocation.

#### 3.2.3 Spreading Activation Networks (Collins & Loftus)

**Summary:** Semantic memory is organized as a network of interconnected nodes. When a concept is activated, activation spreads to connected nodes with strength decaying over distance. Activation reaching a threshold triggers conscious recall. Key properties: activation decays with distance, multiple sources can converge (summation), and priming occurs when subthreshold activation makes subsequent retrieval faster.

**Mapping:**

| Spreading Activation | Inner Voice |
|---------------------|-------------|
| Node = concept in semantic network | Node = entity in Graphiti knowledge graph |
| Activation spreads along edges | Activation propagates along Graphiti relationships |
| Decay with distance | Activation weight decreases with hop count |
| Threshold for conscious recall | Sublimation threshold for injection into main thread |
| Subthreshold priming | "Tagged for later" -- associations with activation below threshold, stored for future potential |
| Convergent activation (multiple sources sum) | Multiple conversation topics activating the same entity from different paths -- total activation is the sum, not the max |

**Design implications:**

1. **The activation map is a first-class data structure.** The Inner Voice maintains `{entity_id: activation_level}` that persists across hook invocations. Each invocation updates activation levels, decays existing activations, and checks for threshold crossings.
2. **Convergent activation is the key insight.** An entity mentioned once in passing gets low activation. But if the conversation circles back to related topics from multiple angles, activation from different paths converges. When the sum crosses the threshold, the entity sublimates -- producing the "this keeps coming up" effect.
3. **Decay must be time-based AND turn-based.** A dual-decay model: temporal decay plus relevance-weighted persistence.
4. **Implementation via graph traversal.** Graphiti's entity-relationship structure enables weighted BFS from "anchor nodes" (entities in the current prompt) outward through the graph, with activation decaying per hop.

**Why it is essential:** Spreading activation solves the "how does the Inner Voice know what is relevant?" problem without requiring an LLM judgment call on every piece of knowledge. Instead of asking "Is this memory relevant?" (expensive, slow), the system asks "How much activation has this memory accumulated?" (cheap, deterministic). The activation map is a continuous, evolving relevance score that emerges from conversation structure rather than from explicit relevance judgments.

**Where the analogy breaks down:**

1. **Graph structure may not support it.** If Graphiti's knowledge graph is sparse (entity with only 2-3 relationships), activation has nowhere to spread. Quality is directly proportional to graph density.
2. **Computational cost at scale.** Thousands of entities with tens of thousands of relationships makes spreading activation expensive. Practical implementation needs a depth limit (2-3 hops max) and minimum activation threshold for propagation.
3. **False associations.** Spreading activation does not distinguish meaningful from accidental associations. If "Python" (language) and "Python" (snake) share a node, activation spreads to irrelevant nodes. Graph quality is a prerequisite.
4. **No temporal awareness.** Classic spreading activation treats all edges equally. Graphiti's bi-temporal model should weight activation -- recent relationships stronger than old ones.

#### 3.2.4 Predictive Processing (Karl Friston)

**Summary:** The brain is a prediction engine maintaining a generative model of the world. It constantly generates predictions about incoming data. Only **prediction errors** -- the difference between expected and actual input -- get propagated upward for conscious processing. When predictions match reality, processing is minimal. When they diverge, the system either updates its model (learning) or takes action to make reality match predictions (active inference).

**Mapping:**

| Predictive Processing | Inner Voice |
|----------------------|-------------|
| Brain maintains a world model | Inner Voice maintains self-model and relationship model |
| Predictions generated from model | Inner Voice has expectations about what the user will do, what context is relevant |
| Only prediction errors surface | Inner Voice only sublimates when something SURPRISES it -- when conversation diverges from expectations |
| Model update on error | When user does something unexpected, Inner Voice updates its models |
| Active inference | Inner Voice proactively surfaces memories that might reduce user confusion or fill knowledge gaps |

**Design implications:**

1. **The sublimation trigger should be surprise-based.** Instead of injecting on every prompt or on every semantic shift, the Inner Voice should inject when the conversation deviates from its predictions. If the user continues on the expected topic, injection is unnecessary.
2. **The self-model IS the predictive model.** "User is focused on Dynamo v1.2.1 stabilization" generates the prediction "user's next prompt will be about Dynamo." When the prediction fails, the Inner Voice knows something has changed.
3. **Precision-weighting maps to confidence.** The Inner Voice should weight its intervention by the confidence of the violated prediction. High-confidence violation = strong intervention.
4. **Active inference justifies proactive injection.** The Inner Voice can identify situations where the user is likely to hit a knowledge gap and proactively surface relevant memories BEFORE the user asks.

**Why it is essential:** Predictive processing solves the over-injection problem. The current pipeline injects on every prompt -- noisy and often irrelevant. The predictive processing model provides a principled reason to stay silent: if the conversation proceeds as expected, there is nothing to say. This dramatically reduces injection frequency while increasing injection quality.

**Where the analogy breaks down:**

1. **No sensory stream.** The Inner Voice sees discrete hook snapshots. Between hooks, it cannot generate or check predictions.
2. **"Surprise" is computationally expensive.** True surprise requires computing probability of observed input under the current model. This is fundamentally an LLM task (perplexity calculation), adding cost.
3. **Simpler metrics may suffice.** Semantic shift detection (embedding cosine distance) and entity mention matching are cheaper proxies for "surprise" that capture most of the value.
4. **Active inference is dangerous.** Proactively surfacing unrequested memories risks being presumptuous rather than helpful.

#### 3.2.5 Working Memory Model (Baddeley)

**Summary:** Working memory is a multi-component system: (1) Central Executive -- attention-controlling system that coordinates and prioritizes; (2) Phonological Loop -- temporary verbal/acoustic storage; (3) Visuospatial Sketchpad -- temporary visual/spatial storage; (4) Episodic Buffer -- limited-capacity system that integrates information from subsystems and long-term memory into coherent episodes.

**Mapping:**

| Baddeley | Inner Voice |
|----------|-------------|
| Central Executive | Inner Voice's decision logic -- what to attend to, what to surface, what to suppress |
| Phonological Loop | N/A (no audio modality) |
| Visuospatial Sketchpad | N/A (no visual modality) |
| Episodic Buffer | **The Inner Voice itself** -- integrating information from the knowledge graph, current conversation, and self-model into coherent episodic injections |
| Binding function | Combining a retrieved memory with relational context and framing into a single, coherent injection |

**Design implications:**

1. **The Inner Voice IS the episodic buffer.** Its primary function is not retrieval (the graph's job) or storage (Graphiti's job). Its primary function is **integration** -- combining raw retrieved memories with current context, relational knowledge, and temporal framing into coherent, useful injections.
2. **The binding function is the value add.** Raw search results are facts. The Inner Voice binds them with context ("you were frustrated last time you touched this code"), relationship knowledge ("the user prefers directness"), and temporal framing ("this was decided two weeks ago, things may have changed").
3. **Limited capacity is a feature.** The Inner Voice should limit how much it integrates into a single injection. Too many bound memories overwhelm the main session's working context.
4. **The Central Executive maps to path-selection logic.** The decision about hot/deliberation path, what to attend to, and what to suppress are all Central Executive functions.

**Why it is essential:** Baddeley's model reframes the Inner Voice from "a system that retrieves and formats memories" to "a system that integrates multi-source information into coherent episodes." This distinction matters because integration is harder than retrieval and adds more value. Any system can search a knowledge graph. The Inner Voice's value is in combining search results with relational context, temporal framing, and awareness into something that reads as genuine understanding.

**Where the analogy breaks down:**

1. **The episodic buffer is passive; the Inner Voice is active.** In Baddeley's model, the buffer is controlled by the Central Executive. The Inner Voice decides what to retrieve, how to integrate, and whether to surface. It is both buffer and executive.
2. **No modality-specific subsystems.** Single-modality (text) system using a multi-modality framework.
3. **Capacity limits are artificially imposed.** The buffer's capacity limit is biological; the Inner Voice's limit is a design choice about optimal injection size.

#### 3.2.6 Relevance Theory (Sperber & Wilson)

**Summary:** Human communication is governed by the principle of relevance: every utterance carries an implicit guarantee that it is worth the listener's processing effort. Relevance is a function of (1) cognitive effects -- new information, conclusions, or revisions produced; and (2) processing effort -- mental work required to derive those effects. Maximum relevance = maximum cognitive effects for minimum processing effort.

**Mapping:**

| Relevance Theory | Inner Voice |
|-----------------|-------------|
| Every utterance must be worth processing effort | Every injection must be worth the context window space it consumes |
| Relevance = effects / effort | Injection value = (contextual impact) / (tokens consumed + cognitive load imposed) |
| Implicit guarantee of relevance | The main session trusts that injected context is relevant -- violations degrade the system |
| Effort includes parsing, integration, implication derivation | Effort includes: reading the injection, integrating with current task, deciding how to act |

**Design implications:**

1. **Every injection must pass a relevance calculus.** Before sublimating: "Will this produce cognitive effects that exceed the processing effort?"
2. **Injection format should minimize effort.** Concise, pre-integrated, contextually shaped injections over raw memory dumps. A 50-token injection saying "User decided to use JWT for auth last week; preferred express-jwt over passport" is more relevant than a 500-token dump of the full discussion context.
3. **Trust is a resource that depletes.** Repeated irrelevant injections teach the main session to ignore the Inner Voice. Irrelevant injections actively harm the system.
4. **The "optimal relevance" target.** Not maximally informative (dump everything) or minimally informative (say nothing). Optimally relevant: maximum cognitive effect at minimum processing effort.

**Why it is essential:** Relevance Theory answers the question every other theory leaves open: "How do you decide what is ENOUGH to surface?" Spreading activation tells you what is associated. Predictive processing tells you what is surprising. GWT tells you what wins the competition. None specify the AMOUNT and FORMAT. Relevance Theory provides the optimization target: maximize cognitive effects, minimize processing effort. This directly produces design specifications for injection size, format, and density.

**Where the analogy breaks down:**

1. **Cognitive effects are hard to measure.** The Inner Voice cannot observe whether its injection was useful. Feedback is only available indirectly.
2. **Processing effort is measurable but crude.** Token count is a proxy, but quality matters more than length.
3. **The theory does not specify HOW to compute relevance.** It defines relevance as a ratio but provides no algorithm. The Inner Voice needs a practical scoring mechanism.

#### 3.2.7 Cognitive Load Theory (Sweller)

**Summary:** Working memory has severe capacity limits (~7 +/- 2 items for unrelated information). Cognitive load has three types: (1) Intrinsic -- inherent task complexity; (2) Extraneous -- caused by poor instruction/interface design; (3) Germane -- productive processing that builds schemas. Effective instruction minimizes extraneous load and maximizes germane load.

**Mapping:**

| Cognitive Load | Inner Voice |
|---------------|-------------|
| Working memory capacity limit | Context window token limit / effective attention span |
| Intrinsic load (task complexity) | Main session's current task complexity -- cannot be reduced |
| Extraneous load (poor design) | Poorly formatted, verbose, or irrelevant memory injections |
| Germane load (productive processing) | Well-formatted injections that build the main session's understanding |
| Overload degrades performance | Too much injected context degrades task performance |

**Design implications:**

1. **The Inner Voice must estimate current cognitive load.** During complex debugging, even highly relevant injections add load. Reduce injection volume during high-complexity tasks.
2. **Injection format directly affects extraneous load.** JSON memory dumps = high extraneous load. Narrative sentences integrating key insights = low extraneous load.
3. **Injection budget varies by context.** Session start briefings can be longer (workspace is empty). Mid-session injections must be shorter (workspace is full). This maps to "preconscious loading" vs. "selective sublimation" modes.
4. **Quantitative injection limits.** Research shows up to 70% performance degradation from context overload. Hard injection limits:
   - Session start briefing: max **500 tokens**
   - Mid-session injection: max **150 tokens**
   - Urgent injection: max **50 tokens**

**Why it is essential:** Cognitive load theory provides the hard constraint that every other theory's recommendations must respect. Spreading activation might identify 50 relevant entities. GWT might select 10. Relevance theory might format them well. But if injecting all 10 exceeds cognitive capacity, performance degrades. This theory sets the ceiling and turns "comprehensive memory system" into "surgically precise memory system."

**Where the analogy breaks down:**

1. **LLM "cognitive load" differs from human working memory.** LLMs do not have the 7 +/- 2 limit. But attention mechanisms degrade with context length ("lost in the middle" phenomenon).
2. **The theory is about humans, not AI.** The principles (minimize extraneous information, format for processing) are sound, but specific capacity limits differ.

### 3.3 SECONDARY Theories (Design Constraints)

#### 3.3.1 Attention Schema Theory (Michael Graziano)

**Summary:** Consciousness is the brain's model of its own attention. The brain constructs a simplified schema of the attention process to help monitor and control where attention is directed.

**How it maps:** The Inner Voice models what the main session is attending to. A dedicated `attention_state` field tracks current focus. This is the substrate for relevance decisions and enables metacognitive self-correction -- detecting when the attention model is misaligned with reality.

**Key design implication:** The self-model is not a personality feature. It is the mechanism that prevents the Inner Voice from becoming confidently wrong. Without it, there is no mechanism for self-correction.

**Verdict and timing:** Basic self-model with `attention_state` tracking in v1.3. Full self-model as attention monitor with metacognitive capabilities in v1.4.

#### 3.3.2 Somatic Marker Hypothesis (Damasio)

**Summary:** Emotions are essential to rational decision-making. "Somatic markers" are emotional associations attached to past experiences that bias decisions toward previously positive outcomes and away from negative ones.

**How it maps:** Affect/valence tags attached to knowledge graph entities. When the user was frustrated while working on authentication, those entities carry a "frustration" marker. When authentication comes up again, the Inner Voice frames injections differently.

**Key design implication:** Affect metadata shapes injection framing, not content. "You might want to revisit the authentication approach (last time was rough)" vs. "Here are the authentication patterns you've used successfully."

**Verdict and timing:** v1.4. In v1.3, a binary positive/neutral/negative sentiment tag on sessions is sufficient. Rich affect modeling is an advanced capability. LLMs cannot feel emotions -- they infer from linguistic signals with imperfect accuracy.

#### 3.3.3 Default Mode Network

**Summary:** Brain regions active when NOT focused on the external world -- during daydreaming, self-reflection, future planning, past recollection. Activates during "idle" moments.

**How it maps:** The Stop hook IS the Inner Voice's DMN activation. Session end triggers self-reflection, model updates, and consolidation. Session start is the "wake from default mode" -- the narrative briefing bridges reflection to active use.

**Key design implication:** Session boundaries are the highest-value processing moments. Invest disproportionate processing effort in Stop (synthesis) and SessionStart (briefing).

**Verdict and timing:** Informing session boundary design in v1.3. Background consolidation batch jobs in v1.4.

#### 3.3.4 Memory Consolidation

**Summary:** Short-term memories are stabilized into long-term storage through hippocampal-cortical transfer. During sleep, hippocampus replays memories to neocortex, which integrates them into existing knowledge structures. Involves selective strengthening and integration.

**How it maps:** Two-phase storage model. New memories go to Graphiti as raw episodes (hippocampal). Periodically, a consolidation job synthesizes observations from accumulated episodes (neocortical integration). Selective forgetting: irrelevant details fade while important patterns strengthen.

**Key design implication:** Consolidation is a batch job, not real-time. This keeps session-time processing fast while enabling deep synthesis. Consolidation products update the self-model.

**Verdict and timing:** v1.4 (Enhanced Construction). The Hindsight-inspired observation synthesis pattern is the primary implementation of this theory.

#### 3.3.5 Metacognition

**Summary:** "Thinking about thinking" -- the ability to monitor, evaluate, and regulate one's own cognitive processes. Includes metacognitive knowledge, monitoring, and control.

**How it maps:** The Inner Voice tracks its own performance. After each injection, did the user's behavior suggest it was useful or ignored? Confidence calibration: tagging injections with confidence levels. Strategy adjustment: reducing injection frequency if consistently ignored.

**Key design implication:** Without metacognition, the Inner Voice is open-loop -- it processes and injects but never learns whether its injections are working. The self-model drift risk can only be mitigated through metacognitive monitoring.

**Verdict and timing:** Basic metacognition (`dynamo voice explain` command, confidence tagging) in v1.3. Feedback-based self-correction in v1.4. The feedback signal is weak (indirect inference from user behavior) and adjustment granularity is limited.

### 3.4 TERTIARY and SUPPORTING Theories

**Schema Theory (Bartlett, Piaget):** Knowledge is organized into schemas -- mental frameworks representing patterns of related concepts. Maps to the Inner Voice's disposition configuration and domain templates. "Debugging schema," "architecture planning schema," "code review schema" each have different injection strategies. Useful for conceptual framing of disposition adaptation but does not provide unique design guidance beyond GWT and predictive processing. **v1.4.**

**Affect-as-Information (Schwarz):** Emotions serve as information signals influencing reasoning. Extends somatic markers from memory tagging to active reasoning modulation. When the user appears frustrated, engage more systematic processing; when productive, lighter processing suffices. Affect detection from text is unreliable -- a terse prompt might indicate frustration or efficiency. Safe implementation limits modulation to injection framing, not fundamental behavior changes. **v1.4.**

**Hebbian Learning ("Neurons that fire together wire together"):** Entities that co-occur across multiple sessions should have their graph connections strengthened. This informs the consolidation algorithm: entities that repeatedly co-activate during spreading activation should have their edge weights increased. Implementable as a simple counter/weight on graph edges. **v1.3 (lightweight weight tracking), v1.4 (full consolidation integration).**

### 3.5 Design Principles Derived from Theory

These are the operational rules the Inner Voice implementation MUST follow. Each is directly derived from the theory survey.

| # | Principle | Source Theory | Implementation |
|---|-----------|-------------|----------------|
| 1 | Most processing stays invisible | Global Workspace Theory | Only threshold-crossing content sublimates |
| 2 | Speak when surprised, not when scheduled | Predictive Processing | Semantic shift triggers injection, not every prompt |
| 3 | Integrate, do not retrieve | Baddeley's Working Memory | Inner Voice binds facts with context and framing |
| 4 | Maximize insight per token | Relevance Theory | Concise, contextually shaped injections |
| 5 | Respect the workspace capacity | Cognitive Load Theory | Hard token limits: 500 (session start), 150 (mid-session), 50 (urgent) |
| 6 | Model your own attention | Attention Schema Theory | Self-model tracks what main session is focused on |
| 7 | Session boundaries are premium processing time | Default Mode Network | Invest in Stop (synthesis) and SessionStart (briefing) |
| 8 | Fast path first, slow path only when needed | Dual-Process Theory | 95% hot path, 5% deliberation |
| 9 | Associations cascade, they do not search | Spreading Activation | Graph-based activation propagation, not per-query search |
| 10 | Tag emotions, use them later | Somatic Markers | Affect metadata on entities shapes future framing |

---

## 4. Mechanical Design

### 4.1 The Continuity Problem and Solution

**Why true continuous processing is impossible:** Claude Code's architecture is event-driven. Hooks fire at discrete moments (SessionStart, UserPromptSubmit, PostToolUse, PreCompact, Stop). Between hook invocations, no processing occurs. There are no background threads, daemon processes, or persistent connections monitoring the main session in real-time.

**Why event-driven + persistent state is not a compromise but the correct design:** Human cognition is also event-driven at the neural level. Neurons fire in discrete events. What creates the experience of continuity is not continuous processing but persistent state (neural connections, activation patterns) that enables rapid reconstruction of the processing context.

**The neuroscience parallel:** A human's "continuous" subconscious processing is an illusion. The neural substrate fires discretely. Synaptic connections (persistent state) and rapid re-activation (hook-triggered processing) create the appearance of continuity. The Inner Voice replicates this pattern exactly:

1. **Persistent state** = the "synaptic connections" (inner-voice-state.json)
2. **Rapid processing at every hook event** = the "neural firing"
3. **Comprehensive state capturing activation levels, predictions, and models** = the "context reconstruction"

A truly continuous process would burn API tokens every second. The event-driven approach achieves the same cognitive effect at a fraction of the cost.

### 4.2 State Management Architecture

**File paths:**

```
~/.claude/dynamo/ledger/
  inner-voice-state.json          <- Hot-path cache (loaded every hook invocation)
  inner-voice-history/            <- Versioned snapshots (v1.4)
    2026-03-18T16-00-00.json
    2026-03-18T17-30-00.json
```

**Full state JSON schema:**

```javascript
{
  "version": 1,
  "last_updated": "2026-03-18T16:00:00Z",
  "session_id": "abc123",

  // Self-model (AST-informed)
  "self_model": {
    "attention_state": "user debugging auth middleware",
    "injection_mode": "minimal",       // minimal | standard | comprehensive
    "confidence": 0.8,
    "recent_performance": {
      "injections_made": 12,
      "injections_acknowledged": 8,    // estimated from user behavior
      "last_calibration": "2026-03-18T15:30:00Z"
    }
  },

  // Relationship model (Somatic markers + AST)
  "relationship_model": {
    "communication_preferences": ["direct", "no_emojis", "show_reasoning"],
    "working_patterns": ["deep_focus", "architectural_before_coding"],
    "current_projects": [{"name": "Dynamo", "focus": "v1.2.1 stabilization"}],
    "affect_baseline": "engaged",
    "frustration_signals": ["auth module", "Docker networking"]
  },

  // Activation map (Spreading activation)
  "activation_map": {
    "entity_uuid_1": {
      "level": 0.85,
      "sources": ["direct_mention", "association"],
      "last_activated": "2026-03-18T15:58:00Z"
    },
    "entity_uuid_2": {
      "level": 0.45,
      "sources": ["association"],
      "last_activated": "2026-03-18T15:55:00Z"
    }
  },

  // Pending associations (subthreshold, tagged for later)
  "pending_associations": [
    {
      "entity": "uuid_3",
      "activation": 0.3,
      "trigger_context": "mentioned deployment",
      "tagged_at": "2026-03-18T15:50:00Z"
    }
  ],

  // Recent injection history (metacognition)
  "injection_history": [
    {
      "turn": 5,
      "content_hash": "abc",
      "tokens": 85,
      "entities_referenced": ["uuid_1"],
      "timestamp": "2026-03-18T15:55:00Z"
    }
  ],

  // Predictive model state
  "predictions": {
    "expected_topic": "Dynamo v1.2.1 stabilization",
    "expected_activity": "code implementation",
    "confidence": 0.7
  }
}
```

**State lifecycle:** LOAD (file I/O, <5ms) -> PROCESS (hook-specific pipeline) -> UPDATE (modify state in memory) -> PERSIST (atomic write back to file).

### 4.3 Processing Pipeline Per Hook

#### UserPromptSubmit (most frequent, latency-critical)

```
1. LOAD state from inner-voice-state.json          [<5ms, file I/O]
2. EMBED current prompt                             [50-100ms, API or local]
3. DETECT semantic shift                            [<5ms, cosine distance]
   - Compare current embedding to predictions.expected_topic embedding
   - If shift_score > THRESHOLD: set needs_injection = true
4. UPDATE activation map                            [10-50ms, graph query]
   - Extract entities from prompt (deterministic NER or pattern match)
   - For each entity: activate in map, propagate to neighbors (1-2 hops)
   - Decay all existing activations by time-based factor
   - Check for threshold crossings (new sublimation candidates)
5. DECIDE injection strategy                        [<5ms, deterministic]
   - If needs_injection OR threshold_crossings:
     - If high_confidence_entities AND cached_results: HOT PATH
     - If low_confidence OR complex_context: DELIBERATION PATH
     - If no_injection_needed: SKIP (return empty)
6. EXECUTE injection                                [varies by path]
   - HOT PATH [<500ms]: Retrieve cached/indexed results for activated entities,
     format using template, apply cognitive load limits
   - DELIBERATION PATH [1-3s]: Call Haiku/Sonnet with context + activated
     entities + self-model, generate contextually shaped injection
7. UPDATE state                                     [<5ms]
   - Update activation_map, predictions, injection_history
   - Persist to inner-voice-state.json
8. RETURN injection or empty                        [total: 100ms-3s]
```

#### SessionStart (once per session, higher latency budget)

```
1. LOAD state (may be from previous session)
2. ASSESS session context (user's first prompt or resumed session)
3. GENERATE narrative briefing via DELIBERATION PATH
   - Load self-model, relationship model
   - Query top activated entities from previous session
   - Query entities relevant to detected intent
   - Generate narrative briefing (Sonnet, 2-3s)
4. UPDATE state for new session
5. RETURN narrative briefing [total: 2-4s, acceptable for session start]
```

#### Stop (once per session, no latency constraint)

```
1. LOAD state
2. SYNTHESIZE session observations (Sonnet)
   - What happened this session?
   - What did the user work on? How did they react?
   - What patterns observed?
3. UPDATE self-model and relationship model
4. UPDATE affect markers on touched entities
5. PERSIST state (JSON cache + queue for Graphiti write)
6. QUEUE consolidation if threshold reached (N sessions since last)
```

#### PostToolUse (brief, non-blocking)

```
1. LOAD state
2. EXTRACT entities from tool output (deterministic NER/pattern match)
3. UPDATE activation map (activate mentioned entities)
4. QUEUE any new entities for later Graphiti ingestion
5. PERSIST state [total: <200ms]
```

### 4.4 Sublimation Threshold Mechanism

The sublimation threshold determines when Inner Voice processing surfaces into the main thread. It is informed by multiple theories.

**The composite threshold function:**

```
sublimation_score(entity) =
    activation_level(entity)                    // Spreading activation
  * surprise_factor(entity, predictions)        // Predictive processing
  * relevance_ratio(entity, current_context)    // Relevance theory
  * (1 - cognitive_load_penalty(current_load))  // Cognitive load theory
  * confidence_weight(entity)                   // Metacognition
```

**Factor definitions and ranges:**

| Factor | Source | Range | What It Measures |
|--------|--------|-------|-----------------|
| `activation_level` | Spreading activation map | 0.0 - 1.0 | How strongly this entity is activated by conversation context |
| `surprise_factor` | Predictive processing | 0.0 - 1.0 | How unexpected this entity is given current predictions (1.0 = maximally surprising) |
| `relevance_ratio` | Relevance theory | 0.0 - 1.0 | Embedding similarity between entity and current context |
| `cognitive_load_penalty` | Cognitive load theory | 0.0 - 1.0 | Estimated main session cognitive load (0.0 = idle, 1.0 = maximum) |
| `confidence_weight` | Metacognition | 0.0 - 1.0 | Inner Voice's confidence in the entity's accuracy |

**Threshold:** If `sublimation_score > THRESHOLD` (configurable, default 0.6), the entity crosses the threshold and its associated memory is formatted for injection.

**Key design properties:**

1. **All components are deterministic or pre-computed.** No LLM call required for threshold calculation.
2. **Multiple signals must converge.** No single factor can force sublimation alone (except explicit user recall requests, which bypass the threshold entirely).
3. **Threshold adaptation (metacognitive adjustment):** If recent injections have been acknowledged, lower the threshold slightly (system is performing well). If ignored, raise it (system is being noisy).

### 4.5 Spreading Activation Implementation

**Neo4j Cypher-based activation propagation:**

```cypher
// Find anchor nodes (entities mentioned in current prompt)
MATCH (anchor:Entity)
WHERE anchor.name IN $mentioned_entities
SET anchor.activation = 1.0

// Propagate activation (1-hop neighbors)
MATCH (anchor:Entity)-[r]->(neighbor:Entity)
WHERE anchor.activation > 0.5
SET neighbor.activation =
  COALESCE(neighbor.activation, 0) +
  anchor.activation * r.weight * $decay_factor

// Propagate activation (2-hop, reduced strength)
MATCH (anchor:Entity)-[]->(mid:Entity)-[r2]->(far:Entity)
WHERE anchor.activation > 0.5 AND mid.activation > 0.3
SET far.activation =
  COALESCE(far.activation, 0) +
  mid.activation * r2.weight * $decay_factor * $hop_penalty
```

**Practical constraints:**

| Constraint | Value | Rationale |
|-----------|-------|-----------|
| Depth limit | 2 hops | Beyond 2 hops, false associations overwhelm genuine ones |
| Minimum propagation threshold | 0.3 | Nodes below this do not propagate further |
| Temporal weighting | 1.0 (< 30d), 0.5 (< 90d), 0.2 (< 180d) | Recent edges weighted stronger than old ones |
| Convergence bonus | 1.5x | When two anchor nodes both activate the same target |

**In-memory vs graph-backed activation map:** For hot-path speed, the activation map is maintained in the JSON state file, not queried from Neo4j on every invocation. Neo4j is queried only for full re-propagation (on semantic shift or session start). This keeps the hot path under 500ms.

### 4.6 Injection Mechanism

**How sublimated content reaches the main thread:** Dynamo hooks inject content by outputting to stdout, which Claude Code captures as hook output and includes in the agent's context. This mechanism does not change. The Inner Voice replaces what gets output.

**Current pipeline:**
```
Hook fires -> search Graphiti -> curate with Haiku -> output curated text
```

**Inner Voice pipeline:**
```
Hook fires -> Inner Voice processes (state load, activation update, threshold check)
  -> if sublimation: format injection -> output to stdout
  -> if no sublimation: output empty or minimal status
```

**Injection format (informed by Relevance Theory and Cognitive Load Theory):**

Good (minimizes extraneous cognitive load):
```
[CONTEXT] User decided to use JWT for authentication (2 weeks ago, high confidence).
express-jwt library was chosen over passport. Decision was made during architecture
planning session, driven by simplicity preference.
```

Bad (maximizes extraneous cognitive load):
```
[MEMORY RESULTS]
- Episode: 2026-03-04 15:30 - Auth discussion
  - Entities: JWT, express-jwt, passport, authentication
  - Facts: User chose JWT, express-jwt preferred, passport rejected
  - Session: architecture planning
  - Confidence: 0.95
- Episode: 2026-03-04 16:00 - Implementation start
  ...
```

The first format integrates key insight into a narrative. The second dumps raw data. Relevance Theory demands the first.

**Token limits by context:**

| Context | Max Tokens | Rationale |
|---------|-----------|-----------|
| Session start briefing | 500 | Workspace is empty, cognitive load is low |
| Mid-session injection | 150 | Workspace is full of task context |
| Urgent injection | 50 | Interrupting active processing -- must be extremely concise |

### 4.7 Model Selection

| Component | Model | Rationale |
|-----------|-------|-----------|
| Hot path (threshold calc, entity matching) | None (deterministic) | No LLM needed for math and lookup |
| Hot path (injection formatting) | Haiku 4.5 | Fast, cheap, sufficient for template-based formatting |
| Deliberation path (deep reasoning) | Sonnet 4.6 | Narrative generation, complex context integration |
| Session start briefing | Sonnet 4.6 | Quality matters most at session start; higher latency acceptable |
| Stop hook (session synthesis) | Sonnet 4.6 | Quality matters for model updates; no latency constraint |
| Self-model updates | Sonnet 4.6 | Reasoning about relationship and self-model requires depth |
| Consolidation batch jobs | Sonnet 4.6 (Batch API) | 50% discount, no latency requirement |

**Prompt caching strategy:** The Inner Voice's system prompt (including self-model and relationship model JSON) is reused across all calls within a session. With 90% savings on cached reads:

- System prompt (~3K tokens): cached after first call
- Self-model JSON (~500 tokens): cached
- Per-session savings: approximately 40-50% of total input token costs
- Largest impact on hot path (highest call volume)

### 4.8 Latency Budget

| Operation | Target | Mechanism |
|-----------|--------|-----------|
| UserPromptSubmit (hot path) | <500ms | Deterministic processing + cached state |
| UserPromptSubmit (deliberation) | <2s | Haiku call with prompt caching |
| SessionStart briefing | <4s | Sonnet call (acceptable for session start) |
| PostToolUse capture | <200ms | Deterministic: extract entities, update activation, queue |
| Stop synthesis | <10s | No user-facing latency; Sonnet call for quality |

### 4.9 Cost Projections

**Current baseline:**

| Operation | Model | Daily Frequency | Tokens per Call | Cost/Day |
|-----------|-------|----------------|----------------|----------|
| Haiku curation (per prompt) | Haiku 4.5 | ~150 | ~2K in + 500 out | $0.68 |
| Session naming | Haiku 4.5 | ~5 | ~500 in + 100 out | <$0.01 |
| **Current total** | | | | **~$0.70/day ($21/mo)** |

Assumptions: 4-6 sessions/day, 30 min average, 20-40 prompts/session.

**v1.3 projected cost:**

| Operation | Model | Daily Frequency | Tokens (in+out) | Cost/Day |
|-----------|-------|-----------------|-----------------|----------|
| Hot path formatting | Haiku 4.5 | ~80 | 2K in + 500 out | $0.36 |
| Deliberation injections | Sonnet 4.6 | ~15 | 8K in + 2K out | $0.81 |
| Session start briefing | Sonnet 4.6 | ~5 | 10K in + 3K out | $0.38 |
| Stop synthesis | Sonnet 4.6 | ~5 | 8K in + 2K out | $0.27 |
| Self-model updates | Sonnet 4.6 | ~5 | 5K in + 1K out | $0.15 |
| **v1.3 Total** | | | | **~$1.97/day (~$59/mo)** |

**With/without prompt caching comparison:**

| Scenario | Daily | Monthly |
|----------|-------|---------|
| v1.3 (without caching) | $1.97 | $59 |
| v1.3 (with caching) | $1.20 | $36 |
| Current baseline | $0.70 | $21 |

**Net increase over baseline:** $0.50-1.27/day ($15-38/month).

**Forward-looking projections (from LEDGER-CORTEX-ANALYSIS.md):**

| Milestone | Daily | Monthly |
|-----------|-------|---------|
| v1.3 (with caching) | $1.80 | $54 |
| v1.4 (add construction) | $3.50-5.00 | $105-150 |
| v1.5 (add agent coordination) | $5.00-8.00 | $150-240 |
| v2.0 (full deliberation) | $6.00-15.00 | $180-450 |

---

## 5. Adversarial Analysis

### 5.1 Steel-Man: The Strongest Case FOR

The Inner Voice addresses a failure mode that no amount of search optimization, retrieval augmentation, or curation improvement can fix: **the difference between a system that finds relevant information and a system that genuinely understands context.**

Consider what happens when a user starts a new Claude Code session today. Dynamo searches the knowledge graph, curates results with Haiku, and injects them. The injection reads like a search engine results page -- facts that might be relevant. The main session does its best to integrate them. But the session does not UNDERSTAND the context. It does not know:

- That the user was frustrated last time they touched this code
- That the user's communication style has shifted from exploratory to decisive over the past week
- That an entity mentioned in passing three sessions ago is about to become relevant because the conversation is heading in that direction

The Inner Voice knows all of these things because it maintains persistent models of the user relationship, the conversation trajectory, and the activation landscape. Its injections are not search results -- they are contextually shaped, relationally framed, temporally aware integrations that prime the main session to behave as if it genuinely remembers.

**The cognitive science backing is load-bearing.** Each theory maps to a specific mechanism:

- Dual-process theory -> dual-path architecture (cost control)
- Global Workspace Theory -> sublimation mechanism (selectivity)
- Spreading activation -> cascading associations (pattern discovery)
- Relevance Theory -> injection format optimization (quality)
- Cognitive Load Theory -> volume constraints (usability)
- Baddeley's model -> core function as integration, not retrieval

Remove any one and the design degrades in a specific, identifiable way. The cognitive framework is load-bearing architecture, not metaphorical window dressing.

The implementation is achievable within Claude Code's constraints. The event-driven-with-persistent-state pattern is well-established. The cost is manageable ($36-59/month, 1.7-2.8x current baseline). The rollback mechanism (feature flag to classic curation) eliminates catastrophic risk.

**The bottom line:** The Inner Voice is the difference between "Dynamo has a good memory system" and "Dynamo feels like it actually knows you." No simpler architecture achieves this.

### 5.2 Stress-Test Results

Seven stress-test questions, each with verdict:

**5.2.1 "Is the parallel process achievable, or sequential with the illusion of parallelism?"**

**Verdict: Sequential with the illusion of parallelism. And that is fine.** The "parallelism" is temporal interleaving: hook fires, Inner Voice processes, injection enters context. But this is also how human "parallel" processing works at the neural level. The gap between hook invocations is acceptable because the user's typing time is not productive processing time.

**5.2.2 "Is the sublimation model adding real value over simpler relevance scoring?"**

**Verdict: Yes, but marginal value over good relevance scoring is modest in v1.3. Becomes substantial in v1.4+.** Simple relevance scoring achieves ~70% of sublimation's value. Sublimation adds: convergent activation (10-15% improvement), temporal dynamics (5-10%), predictive suppression (5-10%). With a sparse early knowledge graph, the gap is small. It widens as the graph grows. The sublimation model is an investment that pays increasing dividends.

**5.2.3 "Does the cognitive metaphor create design clarity or false comfort?"**

**Verdict: Design clarity, definitively. With one caveat.** Every theory mapping produced specific, actionable design implications. "The episodic buffer" reframes the core function from retrieval to integration. "Cognitive load theory" produces hard token limits. "Spreading activation" produces a graph traversal algorithm. **Caveat:** The metaphor can create false expectations about capability. The Inner Voice is not conscious. "Emotional context" and "relational state" are computed approximations, not experiences.

**5.2.4 "What happens when the Inner Voice gets it wrong?"**

See failure mode taxonomy below.

**5.2.5 "Does continuous processing burn too much money?"**

**Verdict: No, because "continuous processing" is a misnomer.** Processing occurs at hook boundaries -- 5-30 discrete events per session. Hot path (80%) adds <$0.36/day. Deliberation (20%) adds <$0.81/day. The real cost risk is scope creep, mitigated by cost monitoring (CORTEX-03).

**5.2.6 "Is this over-engineered for the actual benefit delivered?"**

**Verdict: The full brief description is over-engineered. The v1.3 scope is appropriately engineered.** v1.3 is "smart curation with persistent state." The cognitive architecture terminology is the specification for where this evolves, not what ships in v1.3.

**5.2.7 "Can a continuous parallel cognitive process be built within Claude Code?"**

**Verdict: No. And it does not need to be.** A truly continuous parallel process is not possible within Claude Code. But the cognitive science literature reveals this is a feature, not a bug. Human "continuous" processing is also an illusion created by persistent state and rapid re-activation. The Inner Voice replicates this pattern.

**Failure mode taxonomy:**

| Failure Mode | Cause | Severity | Detection | Recovery |
|-------------|-------|----------|-----------|----------|
| **False positive injection** | Threshold too low; irrelevant memory surfaces | LOW-MEDIUM | User ignores injection | Raise threshold (metacognitive control) |
| **False negative (under-sublimation)** | Threshold too high; relevant memory not surfaced | MEDIUM | User asks "don't you remember X?" | Lower threshold; explicit recall bypasses threshold |
| **Wrong framing** | Affect misattribution; incorrect relationship model | MEDIUM | User corrects or seems confused | Update relationship model; `dynamo voice reset` |
| **Stale self-model** | Model not updated after significant changes | HIGH | Persistently wrong injection context | Periodic recalibration; Stop hook updates |
| **Over-sublimation** | Injection flooding degrades main session performance | HIGH | Cognitive load exceeds capacity; quality drops | Cognitive load hard limits; dynamic injection budget |
| **Confidently wrong** | Self-model drift + no metacognitive detection | **CRITICAL** | Difficult to detect from inside the system | External metacognition; periodic review; `dynamo voice explain` |
| **Cascading false associations** | Poor graph quality; entity resolution errors | MEDIUM | Irrelevant cascading activations | Graph quality checks; depth limits on propagation |

**Special treatment: "Confidently wrong" is the most dangerous failure mode.** It occurs when the self-model has drifted from reality but metacognitive monitoring does not flag it because the monitoring itself relies on the same drifted model. This is the AI equivalent of Dunning-Kruger.

**Four mitigations for confidently wrong:**

1. **Confidence decay.** Self-model assertions lose confidence over time unless reinforced by new evidence. A relationship model entry not confirmed in 30 days drops from HIGH to MEDIUM confidence.
2. **User correction pathway.** `dynamo voice correct "I actually prefer X over Y"` directly updates the relationship model, overriding inferred values.
3. **Periodic recalibration prompts.** After N sessions, the Inner Voice generates a "state of understanding" summary the user can review and correct.
4. **Classic curation fallback.** If performance degrades below baseline, the feature flag reverts to classic Haiku curation.

### 5.3 Risk Register

Risks relevant to the Inner Voice, consolidated from LEDGER-CORTEX-ANALYSIS.md and the cognitive architecture research:

| # | Risk | Impact | Probability | Mitigation |
|---|------|--------|-------------|------------|
| 1 | Quality regression vs. current curation | User disables system | MEDIUM | Feature flag for classic mode; A/B comparison during rollout |
| 2 | Cost escalation beyond budget | Unexpected bills | HIGH | Cost monitoring (CORTEX-03) as day-1 feature; hard budget caps; hot-path fallback |
| 3 | Latency regression on hot path | User-visible delay | MEDIUM | Hard <1s requirement; deterministic path selection; prompt caching |
| 4 | Self-model/relationship model drift | Confidently wrong injections | MEDIUM | Confidence decay; user correction via `dynamo voice reset`; periodic recalibration |
| 5 | Over-engineering before proving Inner Voice | Wasted effort on unused complexity | HIGH | Option C enforces prove-then-expand; each milestone gates the next |
| 6 | Neo4j/Graphiti scaling limits | Graph performance degrades with volume | LOW | Monitor graph size; prune old data |
| 7 | Prompt engineering quality | Poor system prompt = poor Inner Voice regardless of architecture | HIGH | Invest in prompt engineering and testing; A/B test classic vs cortex modes |
| 8 | Sparse knowledge graph in early usage | Spreading activation has nowhere to spread | MEDIUM | Begin with entity-mention matching; enable spreading activation at >100 entities and >200 relationships |
| 9 | Zero-dependency constraint conflicts with Agent SDK | Cannot use SDK without npm dependency | HIGH | Use `claude -p` CLI headless mode (child_process.spawn) instead of SDK import |
| 10 | Scope creep during implementation | Timeline slip, milestone bloat | HIGH | Strict phase gates; each milestone independently shippable; defer aggressively |

---

## 6. Implementation Pathway (Option C)

### 6.1 v1.3: Minimal Viable Inner Voice

**What ships:**

| Artifact | Description |
|----------|-------------|
| `ledger/inner-voice.cjs` | Core processing logic |
| `ledger/dual-path.cjs` | Hot/deliberation path routing |
| `ledger/activation.cjs` | Basic activation map (in-memory, persisted to JSON) |
| `inner-voice-state.json` | Persistent state file |
| Feature flag | `dynamo config set ledger.mode classic\|cortex` |
| Debug command | `dynamo voice explain` |
| Cost tracking | `dynamo cost today` |

**Cognitive theories implemented (6 PRIMARY + 1 SUPPORTING):**

- Dual-Process (hot/deliberation paths)
- Global Workspace (threshold-based sublimation)
- Spreading Activation (basic, 1-hop, in-memory)
- Relevance Theory (injection format optimization)
- Cognitive Load Theory (token limits per injection type)
- Predictive Processing (semantic shift detection as surprise proxy)
- Hebbian Learning (basic edge weight tracking)

**What is explicitly NOT in v1.3:**

- Relationship modeling beyond basic preferences
- Affect/emotional tagging
- Multi-hop spreading activation
- Observation synthesis / consolidation
- Narrative briefings with relational framing (session start briefings are factual, not narrative)
- Metacognitive self-correction (beyond the explain command)
- Graph-backed state persistence (JSON only)

**Risk level:** MEDIUM. The core risk is the quality valley -- the Inner Voice might perform worse than classic Haiku curation before its models are trained. The feature flag mitigates this completely.

**Risk mitigations:**

- Feature flag for instant rollback to classic curation
- Cost monitoring as day-1 feature
- Hard latency requirements (<500ms hot path, <2s deliberation)
- Baseline metrics established before deployment

### 6.2 v1.4: Advanced Inner Voice

**What ships:**

| Artifact | Description |
|----------|-------------|
| Relationship model | Full affect tracking (Somatic Markers) |
| Multi-hop activation | 2-hop spreading activation, Neo4j-backed |
| Narrative briefings | DMN-inspired session start narratives |
| Observation synthesis | Consolidation batch jobs (Memory Consolidation) |
| Metacognitive self-correction | Feedback tracking + threshold adjustment |
| Graph-backed persistence | Graphiti nodes with temporal versioning |
| `dynamo voice model` | Inspect self-model and relationship model |
| `dynamo voice reset` | Reset models to defaults |

**Cognitive theories added (6 SECONDARY):**

- Somatic Marker Hypothesis (affect tagging)
- Default Mode Network (session boundary processing emphasis)
- Memory Consolidation (observation synthesis)
- Metacognition (feedback-based self-correction)
- Schema Theory (disposition/context adaptation)
- Attention Schema Theory (full self-model as attention monitor)

### 6.3 v1.5 and v2.0

**v1.5: Agent-Capable Inner Voice**

- Claude Agent SDK integration for deep recall operations
- On-demand subagent spawning for complex memory queries
- Codebase indexer (background ingestion)
- Connector framework interface (for future expansion)

**v2.0: Full Cognitive Architecture**

- Multi-agent deliberation (Inner Voice + Construction functions)
- Domain agent framework (Claudia-aware interfaces)
- Full predictive processing (active inference)
- Cross-surface persistence (multi-session, multi-surface state)

### 6.4 Incremental vs Big-Bang Comparison

| Factor | Incremental (Option C) | Big-Bang (full v1.3) |
|--------|----------------------|---------------------|
| Time to first value | 4-6 weeks | 3-6 months |
| Risk of total failure | LOW (each phase independent) | HIGH (all-or-nothing) |
| Cost of failure | One phase reverted | Months of work discarded |
| Quality of final product | Each component proven before integration | Untested integration of unproven components |
| User feedback incorporation | Feedback after each phase shapes the next | No feedback until everything ships |
| Cognitive load on implementer | Manageable -- one theory cluster at a time | Overwhelming -- all theories at once |

The case for incremental is overwhelming. The only argument for big-bang is "architectural coherence," but Option C achieves coherence through interface design: the v1.3 Inner Voice exposes the same interfaces that v1.4 components consume.

---

## 7. Open Questions

### 7.1 Embedding Model Selection

The hot-path activation and semantic shift detection depend on embeddings. Options:

- **Graphiti's existing embedding model** (whatever is configured) -- recommended for v1.3
- **Separate local embedding model** (MENH-08) -- evaluate for v1.4 when latency optimization becomes critical
- **Claude's built-in embedding** -- not available as a separate API

### 7.2 State File Concurrency

Multiple simultaneous Claude Code sessions share the same `inner-voice-state.json`. Without concurrency control, state corruption from simultaneous writes.

**Recommendation:** File-based locking (write to temp, atomic rename) and session-scoped state sections. Shared state (relationship model) uses last-write-wins with conflict detection at session start.

### 7.3 Knowledge Graph Density Requirements

Spreading activation requires a sufficiently dense graph. With a sparse graph (early usage), activation has nowhere to spread.

**Recommendation:** Begin with simple entity-mention matching in v1.3. Enable spreading activation only when graph contains >100 entities and >200 relationships (threshold that triggers automatically).

### 7.4 Evaluation Metrics (Baseline Gap Noted)

Proposed metrics:

| Metric | What It Measures | How |
|--------|-----------------|-----|
| Injection relevance rate | % of injections the user references in subsequent prompts | Track injection -> user behavior correlation |
| Silence accuracy | % of non-injection decisions that were correct | Track when user asks for missing context |
| Session coherence | Subjective assessment of whether the session felt "remembered" | User feedback |
| Cost efficiency | Relevance rate per dollar spent | Computed from above metrics + cost tracking |

**Gap:** No baseline measurements exist for the current Haiku curation pipeline. Establishing baselines before Inner Voice deployment is essential. Without baselines, improvement cannot be validated.

### 7.5 Prompt Engineering Quality

The Inner Voice's quality depends entirely on its system prompt. A poorly designed system prompt produces a poorly performing Inner Voice regardless of architectural quality. This is the single most important and least predictable factor.

**Recommendation:** Invest significant effort in prompt engineering and testing before deployment. Use A/B testing between classic and cortex modes to validate.

---

## 8. Document Relationships

### Reading Order

| Document | Purpose | Read When |
|----------|---------|-----------|
| **LEDGER-CORTEX-BRIEF.md** | The vision -- what the Ledger Cortex is and why it exists | First. Establishes strategic context and the full Cortex architecture. |
| **LEDGER-CORTEX-ANALYSIS.md** | Adversarial analysis of ALL Cortex components with go/no-go verdicts | Second. Establishes which components to build and when. |
| **INNER-VOICE-SPEC.md** (this document) | Deep specification of the Inner Voice component specifically | Third. Provides the implementation-level detail for the highest-priority Cortex component. |
| **MASTER-ROADMAP-DRAFT-v1.3-cortex.md** | Phased roadmap integrating Cortex across milestones | Reference. Maps all components to milestones with requirement IDs. |

### How This Document Relates

- **Supplements LEDGER-CORTEX-BRIEF.md:** The brief's "The Inner Voice" section describes the concept. This document provides the cognitive science foundation, mechanical design, and implementation specification.
- **Incorporates and extends LEDGER-CORTEX-ANALYSIS.md:** The analysis provides the adversarial review of the Inner Voice as one component among many. This document deepens that analysis with theory-specific stress tests and a failure mode taxonomy.
- **Informs MASTER-ROADMAP-DRAFT-v1.3-cortex.md:** The roadmap's CORTEX-01/04/06 requirements trace directly to sections in this document. v1.3 scope (Section 6.1) maps to CORTEX-01; v1.4 scope (Section 6.2) maps to CORTEX-04 and CORTEX-06.

---

## Sources

### Primary (HIGH confidence)
- Kahneman, D. (2011). *Thinking, Fast and Slow*. Established dual-process framework.
- Baars, B.J. (1988). *A Cognitive Theory of Consciousness*. Global Workspace Theory foundation.
  - [Global Workspace Theory - Wikipedia](https://en.wikipedia.org/wiki/Global_workspace_theory)
  - [Frontiers - Selection-Broadcast Cycle (2025)](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2025.1607190/full)
- Collins, A.M. & Loftus, E.F. (1975). A Spreading-Activation Theory of Semantic Processing.
  - [Spreading Activation - Wikipedia](https://en.wikipedia.org/wiki/Spreading_activation)
- Friston, K. (2010). The free-energy principle: a unified brain theory?
  - [Free Energy Principle - Wikipedia](https://en.wikipedia.org/wiki/Free_energy_principle)
  - [Active Inference and Free Energy Principle - Engineering Notes (2026)](https://notes.muthu.co/2026/02/active-inference-and-the-free-energy-principle-how-agents-minimize-surprise-instead-of-maximizing-reward/)
- Baddeley, A.D. (2000). The episodic buffer: a new component of working memory?
  - [Baddeley's model - Wikipedia](https://en.wikipedia.org/wiki/Baddeley's_model_of_working_memory)
  - [Simply Psychology - Working Memory Model](https://www.simplypsychology.org/working-memory.html)
- Sperber, D. & Wilson, D. (1986). *Relevance: Communication and Cognition*.
  - [Relevance Theory - Wikipedia](https://en.wikipedia.org/wiki/Relevance_theory)
- Graziano, M.S.A. (2013). *Consciousness and the Social Brain*. Attention Schema Theory.
  - [Frontiers - AST for Engineering Artificial Consciousness](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2017.00060/full)
- Damasio, A. (1994). *Descartes' Error*. Somatic Marker Hypothesis.
  - [Somatic Marker Hypothesis - Wikipedia](https://en.wikipedia.org/wiki/Somatic_marker_hypothesis)
- Sweller, J. (1988). Cognitive load during problem solving: Effects on learning.
  - [Cognitive Workspace for LLMs (2025)](https://arxiv.org/html/2508.13171v1)
  - [Cognitive Load Limits in LLMs (2025)](https://arxiv.org/pdf/2509.19517)

### Secondary (MEDIUM confidence)
- [Metacognition in AI Agents - Microsoft (2025)](https://microsoft.github.io/ai-agents-for-beginners/09-metacognition/)
- [Fast, Slow, and Metacognitive Thinking in AI - Nature (2025)](https://www.nature.com/articles/s44387-025-00027-5)
- [Default Mode Network and AI - ResearchGate](https://www.researchgate.net/publication/385943988_Neuro-Inspired_AI_Leveraging_the_Default_Mode_Network_for_Creativity_Memory_Integration_and_Self-Referential_Processing)
- [Memory in the Age of AI Agents - Survey (2025)](https://arxiv.org/abs/2512.13564)
- [A-MEM: Agentic Memory for LLM Agents - NeurIPS 2025](https://arxiv.org/abs/2502.12110)
- [Claude Agent SDK - TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents)
- [Overloaded Minds and Machines - Cognitive Load Framework for Human-AI Symbiosis (2026)](https://link.springer.com/article/10.1007/s10462-026-11510-z)
- [Emotions in Artificial Intelligence (2025)](https://arxiv.org/html/2505.01462v2)

### Tertiary (LOW confidence - needs validation)
- [Spreading activation in emotional memory networks - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5413589/)
- [Applying Cognitive Design Patterns to General LLM Agents (2025)](https://arxiv.org/html/2505.07087v2)
- [Scenario-Driven Cognitive Approach to Next-Generation AI Memory](https://arxiv.org/html/2509.13235)

# Inner Voice: Cognitive Architecture Synthesis

**Researched:** 2026-03-18
**Domain:** Cognitive science theory mapping, mechanical design, adversarial analysis for Dynamo's Inner Voice
**Confidence:** MEDIUM-HIGH (theory mapping HIGH, mechanical design MEDIUM, feasibility assessment MEDIUM)

---

## 1. Executive Summary

The Inner Voice is the most architecturally ambitious component of the Ledger Cortex vision. It proposes something no current AI memory system attempts: a **continuous parallel cognitive process** that runs alongside the main Claude Code session, processing at a different level of abstraction -- not words and tasks, but experience, emotion, relational state, and associative resonance. Only products that cross an activation threshold "sublimate" into the main thread's context.

This document synthesizes what has been established about the Inner Voice, maps it rigorously against cognitive science theory, designs concrete mechanical implementations within Dynamo's constraints, and subjects every major claim to adversarial stress-testing.

**The central finding:** The cognitive science mapping is not decorative -- it is load-bearing. Each theory cited in the brief maps to a specific mechanical component that would be harder to design correctly without the theoretical framework. The Inner Voice's architecture is best understood as a **composite cognitive model** drawing primarily from five theories: Global Workspace Theory (the sublimation/broadcast mechanism), Spreading Activation (cascading associations), Predictive Processing (what-to-surface decisions), Baddeley's Working Memory (the episodic buffer as integration layer), and Relevance Theory (the activation threshold calculus). The remaining theories provide secondary design constraints and validation checks.

**The central tension:** The brief describes a "continuous parallel cognitive process," but Claude Code's architecture is fundamentally event-driven and request/response. True continuity is impossible. The question is whether **event-driven processing with persistent state that simulates continuity** can achieve the cognitive effects the brief envisions. The answer is yes, but only if the state management is sophisticated enough to maintain the illusion across hook invocations. This is achievable but represents the single hardest implementation challenge.

**The hardest question answered:** Is a "continuous parallel cognitive process" possible within Claude Code? Not literally. But the cognitive science literature itself reveals that human "continuous" processing is also event-driven at a neural level -- neurons fire discretely, not continuously. What creates the experience of continuity is **persistent state plus rapid re-activation**. The Inner Voice can achieve this through a persistent state store (the self-model, relationship model, activation map) that is loaded on every hook invocation, processed, updated, and persisted back. The discontinuity between invocations is invisible to the user because the state is comprehensive enough to reconstruct the processing context.

---

## 2. Cognition Theory Survey

### 2.1 Dual-Process Theory (Kahneman, System 1 / System 2)

**What it is:** The mind operates through two systems. System 1 is fast, automatic, intuitive, effortless, and associative. System 2 is slow, deliberate, analytical, effortful, and rule-based. Most cognition happens in System 1; System 2 is engaged only when System 1 signals uncertainty or when deliberate effort is required.

**How it maps to the Inner Voice:**

The mapping is direct and foundational. The dual-path architecture IS Kahneman's dual-process model implemented as software:

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
3. The deliberation path must be able to override the hot path's initial assessment. In Kahneman's framework, System 2 can overrule System 1's intuition. The Inner Voice's deliberation path must be able to suppress a hot-path injection it judges inappropriate after deeper analysis.

**Steel-man: Why this theory is essential.**
Without the dual-process framework, the designer faces a binary choice: LLM for everything (expensive, slow) or deterministic for everything (dumb, inflexible). Kahneman's insight -- that intelligent systems need both and that most processing can stay fast -- directly produces the dual-path architecture, which is the single most important cost-control mechanism in the entire Cortex design. Every cost analysis in the prior research validates this: the phased approach costs $1.50-3/day because 95% of operations stay on the hot path. Remove the dual-process insight and costs jump to $6-15/day.

**Stress-test: Where the analogy breaks down.**
1. **System 1 in humans is truly parallel and unconscious.** The hot path is sequential and explicit. A human's System 1 processes faces, emotions, spatial relationships, and language simultaneously. The hot path does one thing at a time: check embedding similarity, look up entities, format results. This is not a parallel subconscious -- it is a fast subroutine.
2. **System 1 learns from experience.** Human System 1 improves through exposure -- a chess master's System 1 recognizes patterns a novice's cannot. The hot path, as designed, does not learn. Its threshold parameters and templates are static between configuration changes. True System 1 behavior would require the hot path to tune itself based on feedback (e.g., tracking which injections the user found useful vs. ignored).
3. **The "feeling of knowing" is missing.** Kahneman's System 1 produces not just answers but confidence signals -- the feeling that something is right or wrong. The hot path produces search results but no meta-signal about whether those results are genuinely relevant or merely keyword-adjacent. Adding a lightweight confidence scorer (embedding similarity as a proxy for "feeling of knowing") partially addresses this.

**Verdict: ESSENTIAL -- provides the architectural spine (dual-path), but must not be confused with true parallel unconscious processing.**

---

### 2.2 Global Workspace Theory (Bernard Baars)

**What it is:** Consciousness is a "global workspace" -- a shared cognitive resource where information from many specialized unconscious processors is broadcast to all other processors. Specialized modules (vision, hearing, memory, language) operate in parallel and unconsciously. They compete for access to the global workspace. The "winning" information is broadcast widely, becoming conscious. The key mechanisms are: (1) many parallel unconscious processes, (2) competition for workspace access, (3) selective broadcast of winning information, (4) the broadcast information then becomes available to all modules.

**How it maps to the Inner Voice:**

This is the most precise theoretical match for the sublimation mechanism described in the brief.

| Global Workspace | Inner Voice |
|------------------|-------------|
| Unconscious processors working in parallel | The Inner Voice's internal processing -- cascading associations, emotional tagging, relational modeling -- all happening below the surface |
| Competition for workspace access | Multiple candidate injections compete; only those crossing the activation threshold reach the main thread |
| Selective broadcast | Sublimation -- the Inner Voice surfaces only what crosses the threshold |
| The workspace is a bottleneck, not a parallel processor | The main Claude session is a single context window -- it can only attend to a limited amount of injected context |
| Broadcast information becomes available to all modules | Sublimated content enters the main thread's context and shapes all subsequent reasoning |

**Design implications:**
1. **The global workspace IS the main session's context window.** Just as consciousness is a bottleneck where only some unconscious processing surfaces, the main thread's context window is a bottleneck where only some Inner Voice processing appears. This means the Inner Voice must be ruthlessly selective -- cognitive load theory (section 2.9) dictates that flooding the workspace degrades performance.
2. **Competition among candidates is essential.** The Inner Voice should not produce a single injection; it should generate multiple candidate injections (memories, associations, relational context) and select the best. This parallels how multiple unconscious processors compete for workspace access.
3. **The broadcast mechanism must be context-shaped.** In GWT, what reaches the workspace is shaped by attention (the current focus). The Inner Voice's sublimation threshold must be dynamic -- weighted by what the user is currently doing. A memory about authentication is more relevant when the user is editing auth.py than when they are writing a README.
4. **Post-broadcast integration.** In GWT, once information reaches the workspace, it is integrated with all other active information. This means sublimated content should be formatted to integrate naturally with the main session's current context, not as a separate "memory injection" block.

**Steel-man: Why this theory is essential.**
GWT provides the theoretical justification for the most counter-intuitive aspect of the Inner Voice: that most of its processing should be invisible. Without GWT, a designer might think: "If the Inner Voice is doing all this processing, why not show all of it? The user might find it useful." GWT explains why selective surfacing is not a limitation but the mechanism that makes the system useful. Consciousness (the workspace) evolved as a bottleneck precisely because unrestricted parallel broadcast would be overwhelming. The Inner Voice's selectivity is not a cost-saving measure -- it is a design requirement.

**Stress-test: Where the analogy breaks down.**
1. **No actual parallel processors.** GWT assumes many unconscious modules operating simultaneously. The Inner Voice is a single process (one LLM call or one set of deterministic operations per hook invocation). It does not have parallel streams for emotional processing, relational modeling, and associative retrieval running simultaneously. It simulates these as sequential steps within a single invocation.
2. **The competition model is forced.** In GWT, genuine competition occurs because multiple independent processors produce outputs simultaneously. In the Inner Voice, "competition" is actually a single scoring/ranking step within one function. This is selection, not competition.
3. **Broadcast is one-directional.** In GWT, the broadcast feeds back to the unconscious processors, enabling them to adjust. The Inner Voice's sublimation feeds the main thread but has no mechanism for the main thread to signal back to the Inner Voice within the same turn. Feedback only comes on the next hook invocation.

**Verdict: ESSENTIAL -- provides the theoretical foundation for the sublimation mechanism and the "most processing stays below the surface" principle. The most directly applicable theory for the Inner Voice's core behavior.**

---

### 2.3 Spreading Activation Networks (Collins & Loftus)

**What it is:** Semantic memory is organized as a network of interconnected nodes. When a concept is activated (e.g., by hearing the word "dog"), activation spreads to connected nodes ("bark," "pet," "cat," "fur") with strength decaying over distance. Activation that reaches a threshold triggers conscious recall. Key properties: activation decays with distance, multiple sources can converge (summation), and priming occurs when subthreshold activation makes subsequent retrieval faster.

**How it maps to the Inner Voice:**

This maps directly to the brief's "cascading associations" mechanism.

| Spreading Activation | Inner Voice |
|---------------------|-------------|
| Node = concept in semantic network | Node = entity in Graphiti knowledge graph |
| Activation spreads along edges | Activation propagates along Graphiti relationships |
| Decay with distance | Activation weight decreases with hop count |
| Threshold for conscious recall | Sublimation threshold for injection into main thread |
| Subthreshold priming | "Tagged for later" -- associations that have activation but below threshold, stored for future potential |
| Convergent activation (multiple sources sum) | Multiple conversation topics activating the same entity from different paths -- the entity's total activation is the sum, not the max |

**Design implications:**
1. **The activation map is a first-class data structure.** The Inner Voice needs to maintain a map of `{entity_id: activation_level}` that persists across hook invocations. Each invocation updates activation levels based on current conversation content, decays existing activations, and checks for threshold crossings.
2. **Convergent activation is the key insight.** An entity mentioned once in passing gets low activation. But if the conversation circles back to related topics from multiple angles, activation from different paths converges on that entity. When the sum crosses the threshold, the entity sublimates. This produces the "aha, this keeps coming up" effect.
3. **Decay must be time-based AND turn-based.** Activation from 5 minutes ago should be weaker than activation from the current turn, but activation from a deeply relevant memory should persist longer. A dual-decay model (temporal decay + relevance-weighted persistence) is needed.
4. **Implementation via graph traversal.** Graphiti's knowledge graph already has entity-relationship structure. Spreading activation can be implemented as a weighted BFS from "anchor nodes" (entities mentioned in the current prompt) outward through the graph, with activation decaying per hop. Neo4j's Cypher query language supports variable-length path queries that can implement this.

**Steel-man: Why this theory is essential.**
Spreading activation solves the "how does the Inner Voice know what is relevant?" problem without requiring an LLM judgment call on every piece of knowledge. Instead of asking "Is this memory relevant?" (expensive, slow), the system asks "How much activation has this memory accumulated?" (cheap, deterministic). The activation map is a continuous, evolving relevance score that emerges from the conversation's structure rather than from explicit relevance judgments. This is both cheaper and more nuanced than per-memory LLM relevance scoring.

**Stress-test: Where the analogy breaks down.**
1. **Graph structure may not support it.** Spreading activation assumes a richly connected semantic network. Graphiti's knowledge graph may be sparse -- if an entity has only 2-3 relationships, activation has nowhere to spread. The quality of spreading activation is directly proportional to graph density, which depends on how much knowledge has been accumulated.
2. **Computational cost at scale.** A graph with thousands of entities and tens of thousands of relationships makes spreading activation expensive. Each hop multiplies the number of nodes to process. Practical implementation needs a depth limit (2-3 hops max) and a minimum activation threshold for propagation.
3. **False associations.** Spreading activation does not distinguish meaningful associations from accidental ones. If "Python" (language) and "Python" (snake) share a node due to entity resolution failure, activation spreads to irrelevant nodes. Graph quality is a prerequisite.
4. **No temporal awareness.** Classic spreading activation treats all edges equally regardless of when the relationship was established. Graphiti's bi-temporal model provides temporal metadata on edges, which should weight activation (recent relationships stronger than old ones).

**Verdict: ESSENTIAL -- provides the mechanism for cascading associations and solves the relevance problem cheaply. But requires sufficient graph density and quality to function well, making it more valuable in v1.4+ than in early v1.3.**

---

### 2.4 Predictive Processing / Free Energy Principle (Karl Friston)

**What it is:** The brain is fundamentally a prediction engine. It maintains a generative model of the world and constantly generates predictions about incoming sensory data. Only **prediction errors** -- the difference between expected and actual input -- get propagated upward for conscious processing. When predictions match reality, processing is minimal. When they diverge, the system either updates its model (learning) or takes action to make reality match its predictions (active inference).

**How it maps to the Inner Voice:**

This theory provides the most elegant answer to the question "When should the Inner Voice speak up?"

| Predictive Processing | Inner Voice |
|----------------------|-------------|
| The brain maintains a world model | The Inner Voice maintains a self-model and relationship model |
| Predictions generated from the model | The Inner Voice has expectations about what the user will do, what context is relevant |
| Only prediction errors surface | The Inner Voice only sublimates when something SURPRISES it -- when the conversation diverges from expectations |
| Model update on error | When the user does something unexpected, the Inner Voice updates its models |
| Active inference (acting to reduce error) | The Inner Voice proactively surfaces memories that might reduce the user's confusion or fill knowledge gaps |

**Design implications:**
1. **The sublimation trigger should be surprise-based.** Instead of injecting on every prompt (current behavior) or on every semantic shift (proposed in prior research), the Inner Voice should inject when the conversation **deviates from its predictions**. If the user continues on the expected topic, injection is unnecessary. If the user suddenly asks about something the Inner Voice did not predict, that is a prediction error worthy of intervention.
2. **The self-model IS the predictive model.** The self-model described in the brief (communication_style, recent_context, current_projects) is really a generative model that produces predictions about user behavior. "User is focused on Dynamo v1.2.1 stabilization" generates the prediction "user's next prompt will be about Dynamo." When the prediction fails, the Inner Voice knows something has changed.
3. **Precision-weighting maps to confidence.** In predictive processing, prediction errors are weighted by their "precision" -- how confident the system is in its prediction. The Inner Voice should weight its intervention by the confidence of the violated prediction. If it was highly confident the user would continue with Dynamo and they suddenly ask about a different project, that is a high-precision error deserving strong intervention.
4. **Active inference justifies proactive injection.** The Inner Voice can identify situations where the user is likely to hit a knowledge gap and proactively surface relevant memories BEFORE the user asks. This is not mind-reading -- it is the system acting to minimize expected future prediction error.

**Steel-man: Why this theory is essential.**
Predictive processing solves the over-injection problem that plagues current memory systems. The current Dynamo pipeline injects on every prompt -- an approach that is noisy and often irrelevant. Relevance scoring (proposed in prior research) partially addresses this, but still requires per-prompt computation. The predictive processing model provides a principled reason to stay silent: if the conversation is proceeding as expected, there is nothing to say. This dramatically reduces injection frequency while increasing injection quality -- the system speaks only when it has something genuinely useful to contribute.

**Stress-test: Where the analogy breaks down.**
1. **The system has no sensory stream.** Predictive processing in the brain operates on continuous sensory input. The Inner Voice sees discrete hook snapshots. Between hooks, it has no input and no way to generate or check predictions. It can only check predictions at hook boundaries.
2. **"Surprise" is computationally expensive to measure.** True surprise (in the information-theoretic sense) requires computing the probability of the observed input under the current model. For the Inner Voice, this means computing how likely the current user prompt is given the self-model and conversation history. This is fundamentally an LLM task (perplexity calculation), which adds cost to every hook invocation.
3. **Simpler metrics may suffice.** Semantic shift detection (embedding cosine distance) and entity mention matching are cheaper proxies for "surprise" that capture most of the value. The full predictive processing framework may be theoretically elegant but practically over-engineered compared to these simpler signals.
4. **Active inference is dangerous.** Proactively surfacing memories the user did not ask for risks being annoying rather than helpful. The line between "anticipating needs" and "being presumptuous" is thin.

**Verdict: VALUABLE but not essential for v1.3. The prediction-error-as-trigger concept is powerful and should inform the sublimation threshold design. Full active inference is v1.4+ territory. For v1.3, semantic shift detection is an adequate proxy for surprise detection.**

---

### 2.5 Working Memory Model (Baddeley)

**What it is:** Working memory is not a single store but a multi-component system. The revised model (2000) has four components: (1) **Central Executive** -- an attention-controlling system that coordinates, prioritizes, and directs; (2) **Phonological Loop** -- temporary storage and rehearsal of verbal/acoustic information; (3) **Visuospatial Sketchpad** -- temporary storage of visual and spatial information; (4) **Episodic Buffer** -- a limited-capacity system that integrates information from the subsystems and long-term memory into coherent episodes.

**How it maps to the Inner Voice:**

The episodic buffer concept is the critical mapping.

| Baddeley | Inner Voice |
|----------|-------------|
| Central Executive | The Inner Voice's decision logic -- what to attend to, what to surface, what to suppress |
| Phonological Loop | N/A (no audio modality) |
| Visuospatial Sketchpad | N/A (no visual modality) |
| Episodic Buffer | **The Inner Voice itself** -- integrating information from the knowledge graph (long-term memory), current conversation (working context), and self-model into coherent episodic injections |
| Binding function | The act of combining a retrieved memory with relational context and emotional framing into a single, coherent injection |

**Design implications:**
1. **The Inner Voice IS the episodic buffer.** Its primary function is not retrieval (that is the graph's job) or storage (that is Graphiti's job). Its primary function is **integration** -- combining raw retrieved memories with current context, relational knowledge, and emotional framing into coherent, useful injections. This reframes the Inner Voice from "smart search" to "intelligent integration."
2. **The binding function is the value add.** Raw search results from Graphiti are facts. The Inner Voice binds them with context ("you were frustrated last time you touched this code"), relationship knowledge ("the user prefers directness"), and temporal framing ("this was decided two weeks ago, things may have changed"). This binding is what distinguishes the Inner Voice from the current Haiku curation.
3. **Limited capacity is a feature.** Baddeley's episodic buffer is limited-capacity by design. The Inner Voice should similarly limit how much it integrates into a single injection. Too many bound memories overwhelm the main session's working context (the context window).
4. **The Central Executive maps to the path-selection logic.** The decision about whether to use the hot path or deliberation path, what to attend to in the current prompt, and what to suppress from injection -- these are all Central Executive functions.

**Steel-man: Why this theory is essential.**
Baddeley's model reframes the Inner Voice from "a system that retrieves and formats memories" to "a system that integrates multi-source information into coherent episodes." This distinction matters because integration is harder than retrieval and adds more value. Any system can search a knowledge graph. The Inner Voice's value is in combining search results with relational context, temporal framing, and emotional awareness into something that reads as genuine understanding rather than database output.

**Stress-test: Where the analogy breaks down.**
1. **The episodic buffer is passive; the Inner Voice is active.** In Baddeley's model, the episodic buffer is controlled by the Central Executive -- it does not decide what enters it. The Inner Voice decides what to retrieve, how to integrate it, and whether to surface it. It is both the buffer and the executive.
2. **No modality-specific subsystems.** The phonological loop and visuospatial sketchpad have no analog in the Inner Voice because it operates on text only. This means the multi-component architecture is partially wasted -- the Inner Voice is a single-modality system using a multi-modality framework.
3. **Capacity limits are artificially imposed.** The episodic buffer's capacity limit is a biological constraint of neural architecture. The Inner Voice's "capacity limit" is a design choice about how much context to inject. There is no hard limit -- only a judgment call about optimal injection size.

**Verdict: VALUABLE -- the episodic buffer concept correctly identifies the Inner Voice's core function as integration rather than retrieval. Should inform the injection formatting design. Not a standalone architectural driver but an important design lens.**

---

### 2.6 Attention Schema Theory (Michael Graziano)

**What it is:** Consciousness is the brain's model of its own attention. The brain constructs a simplified, schematic model of the process of attention (the "attention schema") to help monitor and control where attention is directed. This model is necessarily incomplete and simplified, which is why consciousness "feels" different from physical processes -- the model lacks certain details about the underlying mechanism.

**How it maps to the Inner Voice:**

| Attention Schema | Inner Voice |
|-----------------|-------------|
| Brain models its own attention | Inner Voice models what the main session is attending to |
| Model is simplified and schematic | Self-model is a compressed representation of relationship and context |
| Model used to control attention | Self-model used to decide what to surface and suppress |
| Model attributes attention to "self" | Inner Voice attributes context and memory to its relationship with the user |

**Design implications:**
1. **The self-model must model the main session's attention state.** The Inner Voice does not just track what it knows -- it tracks what the main session is currently focused on. This "attention model" is what enables it to determine relevance: is this memory relevant to what the main session is attending to right now?
2. **The attention model should be explicitly maintained.** A dedicated field in the self-model: `current_attention: "debugging authentication middleware"` -- updated on every hook invocation. This is the substrate for relevance decisions.
3. **Metacognitive capabilities emerge from self-modeling.** When the Inner Voice models its own attention and the main session's attention, it can reason about the quality of its own decisions. "I have been surfacing a lot of memories about project X, but the user seems to be ignoring them -- maybe my attention model is wrong."

**Steel-man: Why this theory is essential.**
AST provides the theoretical justification for the self-model, which the prior research identified as essential but did not deeply motivate. Why does the Inner Voice need a model of itself? Because without it, there is no mechanism for self-correction. A system that cannot model its own attention state cannot detect when its attention is misaligned with reality. The self-model is not a nice-to-have personality feature -- it is the mechanism that prevents the Inner Voice from becoming confidently wrong.

**Stress-test: Where the analogy breaks down.**
1. **No genuine self-awareness.** AST explains consciousness; the Inner Voice has no consciousness. The self-model is a JSON object, not a phenomenal experience. This is fine for the design -- we need the functional benefit (self-correction), not the subjective experience.
2. **The model must be maintained explicitly.** The brain's attention schema is updated automatically through neural dynamics. The Inner Voice's self-model must be explicitly updated through code. This means it can fall out of sync with reality if the update logic has bugs or if the conversation moves faster than the update cycle.
3. **Computational cost of self-modeling.** Every update to the self-model is an LLM call (at Stop hook) or a deterministic update (at each hook invocation). The LLM call is the expensive part -- maintaining a rich self-model requires periodic Sonnet-level reasoning.

**Verdict: VALUABLE -- provides the theoretical justification for the self-model and its metacognitive function. The self-model should not be treated as a personality feature but as a self-correction mechanism.**

---

### 2.7 Relevance Theory (Sperber & Wilson)

**What it is:** Human communication is governed by the principle of relevance: every utterance carries an implicit guarantee that it is worth the listener's processing effort. Relevance is a function of two factors: (1) **cognitive effects** -- the new information, conclusions, or revisions the utterance produces; and (2) **processing effort** -- the mental work required to derive those effects. Maximum relevance = maximum cognitive effects for minimum processing effort.

**How it maps to the Inner Voice:**

This theory provides the calculus for the sublimation threshold.

| Relevance Theory | Inner Voice |
|-----------------|-------------|
| Every utterance must be worth processing effort | Every injection must be worth the context window space it consumes |
| Relevance = effects / effort | Injection value = (contextual impact) / (tokens consumed + cognitive load imposed) |
| Implicit guarantee of relevance | The main session trusts that injected context is relevant -- violations of this trust degrade the system |
| Effort includes parsing, integration, implication derivation | Effort includes: reading the injection, integrating it with current task, deciding how to act on it |

**Design implications:**
1. **Every injection must pass a relevance calculus.** Before sublimating, the Inner Voice should estimate: "Will this injection produce cognitive effects (change the main session's behavior, provide useful context, prevent a mistake) that exceed the processing effort (context window space, cognitive load, potential distraction)?"
2. **Injection format should minimize effort.** Concise, pre-integrated, contextually shaped injections are more relevant than raw memory dumps. A 50-token injection that says "The user decided to use JWT for auth last week; they preferred express-jwt over passport" is more relevant than a 500-token injection that dumps the full discussion context.
3. **Trust is a resource that depletes.** If the Inner Voice repeatedly injects irrelevant content, the main session (via its system prompt) should learn to discount injections. In practice, this means irrelevant injections actively harm the system by teaching the main session to ignore the Inner Voice.
4. **The "optimal relevance" target.** An injection should not be maximally informative (dump everything) or minimally informative (say nothing). It should be optimally relevant: the maximum cognitive effect achievable at the minimum processing effort. This is an argument for short, targeted injections over comprehensive memory dumps.

**Steel-man: Why this theory is essential.**
Relevance Theory answers the question that every other theory leaves open: "How do you decide what is ENOUGH to surface?" Spreading activation tells you what is associated. Predictive processing tells you what is surprising. GWT tells you what wins the competition. But none of them specify the AMOUNT and FORMAT of what should surface. Relevance Theory provides the optimization target: maximize cognitive effects, minimize processing effort. This directly produces design specifications for injection size, format, and density.

**Stress-test: Where the analogy breaks down.**
1. **Cognitive effects are hard to measure.** In human communication, relevance is assessed by the listener. The Inner Voice cannot observe whether its injection was useful -- it only knows what it injected, not whether the main session used it. Feedback is only available indirectly (did the user's subsequent behavior change?).
2. **Processing effort is measurable but crude.** Token count is a proxy for processing effort, but a 100-token injection of highly relevant context imposes less cognitive load than a 50-token injection of tangentially relevant context. Quality matters more than length.
3. **The theory does not specify HOW to compute relevance.** It defines relevance as a ratio but does not provide an algorithm for computing it. The Inner Voice needs a practical scoring mechanism, not just a theoretical framework.

**Verdict: ESSENTIAL for injection design -- provides the optimization target for sublimation formatting. Should be implemented as a practical scoring heuristic rather than a theoretical framework.**

---

### 2.8 Somatic Marker Hypothesis (Damasio)

**What it is:** Emotions are not opposed to rational decision-making; they are essential to it. "Somatic markers" are emotional associations attached to past experiences. When facing a decision, the brain reactivates these emotional markers from similar past situations, biasing the decision toward options that were previously associated with positive outcomes and away from those associated with negative outcomes. The markers can operate consciously (gut feeling) or unconsciously (biased processing).

**How it maps to the Inner Voice:**

| Somatic Markers | Inner Voice |
|----------------|-------------|
| Emotional associations attached to experiences | "Emotional" (valence/affect) tags attached to knowledge graph entities |
| Past emotional outcomes bias current decisions | Past user reactions to similar situations shape current injection framing |
| Operate consciously or unconsciously | Shape injection framing without explicit reasoning about emotions |
| Enable rapid decision-making in uncertainty | Enable the Inner Voice to make quick relevance judgments without full analysis |

**Design implications:**
1. **Knowledge graph entities should carry affect metadata.** When the user was frustrated while working on authentication, the entities related to that session should carry a "frustration" marker. When authentication comes up again, the Inner Voice knows to tread carefully -- to frame the injection differently than it would for a topic associated with positive affect.
2. **Affect metadata shapes injection framing, not content.** The somatic marker does not change WHAT is injected -- it changes HOW it is framed. "You might want to revisit the authentication approach (last time was rough)" vs. "Here are the authentication patterns you've used successfully."
3. **Affect is captured at session boundaries.** The Stop hook should assess the overall emotional tenor of the session and tag entities touched during that session with affect metadata. This is the "as-if body loop" -- the Inner Voice does not feel emotions but maintains representations of emotional context that influence processing.

**Steel-man: Why this theory is essential.**
Somatic markers explain why the brief insists on "emotional context" and "relational state" as dimensions of the Inner Voice's processing. Without affect metadata, the Inner Voice is an emotionally flat system that treats all memories equally. With it, the Inner Voice can distinguish between "the user loves working on this feature" and "the user dreads touching this codebase" -- a distinction that fundamentally changes how memory should be framed.

**Stress-test: Where the analogy breaks down.**
1. **LLMs do not have emotions.** The Inner Voice cannot feel frustration or excitement. It can only infer emotional context from linguistic signals in the user's prompts and maintain labels. These labels are necessarily crude compared to human somatic markers.
2. **Emotional inference is unreliable.** Detecting user frustration from text is an NLP task with imperfect accuracy. Misattributed affect (labeling a session as "frustrated" when the user was actually engaged and working through a hard problem) produces wrong framing in future injections.
3. **Affect metadata adds complexity with uncertain value.** For a developer tool, the primary value is factual accuracy and relevance. Emotional framing is secondary. The affect system could be deferred to v1.4 without significantly degrading v1.3's value.

**Verdict: VALUABLE for v1.4+ (relationship modeling phase). In v1.3, a binary "positive/neutral/negative" sentiment tag on sessions is sufficient. Rich affect modeling is an advanced capability.**

---

### 2.9 Cognitive Load Theory (Sweller)

**What it is:** Working memory has severe capacity limits (roughly 7 +/- 2 items for unrelated information, fewer for complex material). Cognitive load has three types: (1) **Intrinsic** -- inherent to the task complexity; (2) **Extraneous** -- caused by poor instruction/interface design; (3) **Germane** -- productive processing that builds schemas and long-term memory. Effective instruction minimizes extraneous load and maximizes germane load.

**How it maps to the Inner Voice:**

| Cognitive Load | Inner Voice |
|---------------|-------------|
| Working memory capacity limit | Context window token limit / effective attention span within that window |
| Intrinsic load (task complexity) | The main session's current task complexity -- cannot be reduced |
| Extraneous load (poor design) | Poorly formatted, verbose, or irrelevant memory injections |
| Germane load (productive processing) | Well-formatted injections that build the main session's understanding |
| Overload degrades performance | Too much injected context degrades the main session's task performance |

**Design implications:**
1. **The Inner Voice must estimate the main session's current cognitive load.** When the user is in a complex debugging session, even a highly relevant injection adds cognitive load. The Inner Voice should reduce injection volume during high-complexity tasks.
2. **Injection format directly affects extraneous load.** A JSON dump of memory entries creates high extraneous load. A narrative sentence integrating the key insight creates low extraneous load. The Inner Voice must format injections to minimize parsing effort.
3. **Injection budget should vary by context.** A session start briefing can be longer (the workspace is empty, cognitive load is low). Mid-session injections should be shorter (the workspace is full of task context). This maps directly to the "preconscious loading" vs. "selective sublimation" modes.
4. **Quantitative injection limits.** Research shows a 39% performance drop in LLMs when moving from single-turn to multi-turn settings, and context overload degrades performance by up to 70%. The Inner Voice should have hard injection limits: e.g., session start briefing max 500 tokens, mid-session injection max 150 tokens, urgent injection max 50 tokens.

**Steel-man: Why this theory is essential.**
Cognitive load theory provides the hard constraint that every other theory's recommendations must respect. Spreading activation might identify 50 relevant entities. GWT might select 10 for broadcast. Relevance theory might format them beautifully. But if injecting all 10 exceeds the main session's cognitive capacity, performance degrades. Cognitive load theory sets the ceiling: the Inner Voice must deliver maximum insight within minimum tokens. This is the theory that turns "comprehensive memory system" into "surgically precise memory system."

**Stress-test: Where the analogy breaks down.**
1. **LLM "cognitive load" is different from human working memory.** LLMs do not have the 7 +/- 2 item limit. They can process much more information per context window than a human can hold in working memory. However, attention mechanisms do degrade with context length -- the "lost in the middle" phenomenon where information in the middle of a long context is underweighted.
2. **The theory is about humans, not AI.** Cognitive load theory was developed for human instruction design. Applying it to LLM context management is analogical, not literal. The principles (minimize extraneous information, format for processing) are sound, but the specific capacity limits are different.

**Verdict: ESSENTIAL as a design constraint -- provides the ceiling for injection volume and the mandate for formatting quality. Must be respected in every injection decision.**

---

### 2.10 Default Mode Network (Neuroscience)

**What it is:** The Default Mode Network (DMN) is a set of brain regions (medial prefrontal cortex, posterior cingulate cortex, precuneus, angular gyrus) that are active when a person is NOT focused on the external world -- during daydreaming, self-reflection, future planning, past recollection, and social cognition. The DMN activates during "idle" moments and is associated with self-referential thought, narrative construction, and mental simulation.

**How it maps to the Inner Voice:**

| DMN | Inner Voice |
|-----|-------------|
| Active during idle/rest periods | Active at session boundaries (Stop hook) for reflection, consolidation |
| Self-referential thought | Self-model updates -- "what did I learn about myself/the user this session?" |
| Future planning | "What should I be prepared for next session?" |
| Past recollection and consolidation | Session summarization, observation synthesis, pattern identification |
| Narrative construction | Generating narrative briefings for session start |

**Design implications:**
1. **The Stop hook is the Inner Voice's "DMN activation."** When the session ends, the main session goes idle. This is the Inner Voice's opportunity for self-reflection, model updates, and consolidation. The Stop hook should trigger not just session summarization but deeper processing: relationship model updates, observation synthesis, self-model recalibration.
2. **Session start is the "wake from default mode."** The DMN deactivates when external attention is required. Similarly, the Inner Voice transitions from reflective (Stop) to active (SessionStart) mode. The narrative briefing is the bridge -- the product of DMN-like reflection, formatted for active use.
3. **Background consolidation.** The DMN's consolidation function (linking new experiences to existing knowledge) maps to scheduled batch jobs between sessions. This is where observation synthesis happens -- not in real-time during sessions but in "idle" periods between them.

**Steel-man: Why this theory is essential.**
The DMN provides the theoretical basis for making session boundaries the most important processing moments. Without this theory, a designer might allocate equal processing effort to every hook invocation. The DMN model suggests that session boundaries (start and stop) deserve disproportionate investment because that is when self-reflection, consolidation, and planning produce the highest value.

**Stress-test: Where the analogy breaks down.**
1. **No actual idle processing.** The DMN activates during rest. The Inner Voice has no rest state -- between sessions, nothing runs. "Idle processing" must be implemented as scheduled batch jobs, not as continuous background activity.
2. **The DMN is involuntary.** Humans cannot choose to activate or deactivate their DMN. The Inner Voice's "DMN mode" is explicitly triggered by the Stop hook -- it is a design choice, not an emergent property.

**Verdict: VALUABLE -- correctly identifies session boundaries as the highest-value processing moments. Informs the design of Stop hook processing and scheduled consolidation.**

---

### 2.11 Memory Consolidation

**What it is:** Memory consolidation is the process by which short-term memories are stabilized into long-term storage. The dominant theory involves hippocampal-cortical transfer: the hippocampus initially stores new memories, then during sleep (especially slow-wave sleep), replays these memories to the neocortex, which integrates them into existing knowledge structures. Consolidation involves selective strengthening (important memories are reinforced) and integration (new memories are connected to existing knowledge).

**How it maps to the Inner Voice:**

| Consolidation | Inner Voice |
|--------------|-------------|
| Hippocampus (temporary buffer) | Session-local state, recent episode storage in Graphiti |
| Neocortex (long-term integrated storage) | Observation nodes, synthesized patterns in the knowledge graph |
| Sleep replay | Scheduled consolidation batch jobs (between sessions) |
| Selective strengthening | Observation synthesis: memories that form patterns are strengthened; isolated facts decay |
| Integration with existing knowledge | Cross-session pattern detection: linking new session observations with historical patterns |

**Design implications:**
1. **Two-phase storage model.** New memories go into Graphiti as raw episodes (hippocampal storage). Periodically (daily, or after N sessions), a consolidation job runs that synthesizes observations from accumulated episodes (neocortical integration). This is the Hindsight-inspired observation synthesis pattern.
2. **Consolidation is a batch job, not real-time.** Just as sleep consolidation happens offline, the Inner Voice's consolidation runs between sessions. This keeps session-time processing fast while enabling deep synthesis.
3. **Selective forgetting.** Consolidation in the brain is not just about remembering -- it is about forgetting. Irrelevant details fade while important patterns strengthen. The Inner Voice's consolidation should similarly decay low-activation entities and strengthen high-activation patterns.
4. **Consolidation feeds the self-model.** The products of consolidation (synthesized observations, identified patterns) update the self-model. "Over the past week, the user has been focused on authentication" is a consolidation product that shapes future session briefings.

**Steel-man: Why this theory is essential.**
Memory consolidation explains why the Inner Voice needs both real-time processing (during sessions) and offline processing (between sessions). Without consolidation, the knowledge graph grows but never synthesizes. Raw facts accumulate but patterns are never extracted. The consolidation model provides the theoretical and practical framework for observation synthesis -- the capability that transforms a knowledge graph from a fact store into a living, evolving understanding.

**Stress-test: Where the analogy breaks down.**
1. **No biological mechanism for replay.** Sleep replay is a neurological process. The Inner Voice's "consolidation" is an LLM processing batch of recent episodes. The analogy is structural, not mechanistic.
2. **Forgetting is dangerous.** In the brain, forgetting is adaptive. In a knowledge system, forgetting means data loss. Consolidation should synthesize and compress, not delete. Original episodes should be archived, not purged.

**Verdict: VALUABLE -- provides the framework for observation synthesis and the two-phase storage model. Essential for v1.4 (Enhanced Construction), not required for v1.3.**

---

### 2.12 Metacognition

**What it is:** Metacognition is "thinking about thinking" -- the ability to monitor, evaluate, and regulate one's own cognitive processes. It includes metacognitive knowledge (what you know about your own cognition), metacognitive monitoring (tracking the quality of your ongoing processing), and metacognitive control (adjusting strategies based on monitoring).

**How it maps to the Inner Voice:**

| Metacognition | Inner Voice |
|--------------|-------------|
| Metacognitive knowledge | The self-model -- what the Inner Voice knows about its own capabilities, accuracy, biases |
| Metacognitive monitoring | Tracking injection quality: were recent injections useful? Was the main session's behavior influenced? |
| Metacognitive control | Adjusting injection frequency, format, and depth based on monitoring results |

**Design implications:**
1. **The Inner Voice should track its own performance.** After each injection, does the user's subsequent behavior suggest the injection was useful (they referenced the injected information, changed approach) or ignored (they continued as if the injection was not there)? This feedback loop enables self-correction.
2. **Confidence calibration.** Metacognitive monitoring includes calibrating confidence -- knowing when you know something well versus when you are uncertain. The Inner Voice should tag its injections with confidence levels and track whether high-confidence injections are indeed more accurate than low-confidence ones.
3. **Strategy adjustment.** If the Inner Voice detects that its injections are being consistently ignored, it should reduce injection frequency (metacognitive control). If injections are being heavily used, it should maintain or slightly increase detail.
4. **The `dynamo voice explain` command.** This is metacognition made explicit -- the user can ask the Inner Voice to explain its reasoning, enabling external metacognitive monitoring.

**Steel-man: Why this theory is essential.**
Without metacognition, the Inner Voice is open-loop: it processes, injects, but never learns whether its injections are working. The self-model drift risk identified in prior research -- the Inner Voice becoming "confidently wrong" -- can only be mitigated through metacognitive monitoring. The system must be able to detect when it is performing poorly and adjust, or it will degrade over time.

**Stress-test: Where the analogy breaks down.**
1. **Feedback signal is weak.** The Inner Voice cannot directly observe whether injections were useful. It must infer from indirect signals (user behavior, explicit feedback). This makes metacognitive monitoring noisy and slow.
2. **Adjustment granularity is limited.** Human metacognition can make fine-grained strategy adjustments in real-time. The Inner Voice can adjust parameters (injection frequency, confidence threshold) but cannot fundamentally change its approach without code changes.
3. **Implementation cost.** Metacognitive monitoring requires tracking injection history and user response patterns -- additional state to maintain and compute against.

**Verdict: VALUABLE for v1.4+ (advanced Inner Voice). Basic metacognition (the explain command, confidence tagging) in v1.3. Feedback-based self-correction in v1.4.**

---

### 2.13 Schema Theory (Bartlett, Piaget)

**What it is:** Knowledge is organized into schemas -- mental frameworks or structures that represent patterns of related concepts. Schemas influence how we perceive, interpret, and remember new information. Information consistent with existing schemas is more easily processed and remembered. Information inconsistent with schemas causes surprise and may lead to schema accommodation (updating the framework).

**How it maps to the Inner Voice:**

Schemas map to the Inner Voice's "disposition" configuration and domain templates.

**Design implications:**
1. **The Inner Voice should maintain schemas for recurring user activities.** "Debugging schema," "architecture planning schema," "code review schema" -- each with different injection strategies (debugging gets implementation details; architecture gets design decisions; code review gets historical context).
2. **Schema detection from conversation content.** The Inner Voice identifies which schema is active based on conversation signals and adjusts behavior accordingly. This IS the semantic shift detection mechanism framed through schema theory.
3. **Schema accommodation = model updates.** When the user's behavior diverges from the active schema (they start debugging in the middle of architecture planning), this is a schema violation that signals a context switch requiring model update.

**Steel-man:** Schema theory provides the framework for context-dependent behavior -- the Inner Voice behaves differently depending on what the user is doing. This is the theoretical basis for the disposition/personality adaptation described in the brief.

**Stress-test:** The mapping is relatively thin. Schema theory describes how humans organize knowledge; the Inner Voice does not truly have schemas -- it has conditional logic in its prompt. The theory provides useful vocabulary but limited actionable design guidance beyond what GWT and predictive processing already provide.

**Verdict: SECONDARY -- useful for conceptual framing of disposition/personality adaptation, but does not provide unique design guidance beyond other theories.**

---

### 2.14 Affect-as-Information (Schwarz)

**What it is:** Emotions serve as information signals that influence reasoning and judgment. When people experience positive affect, they interpret situations more favorably and use heuristic processing. When they experience negative affect, they interpret situations more critically and engage in systematic processing. The key insight: emotions are not noise in the reasoning process -- they are data that shapes how reasoning proceeds.

**How it maps to the Inner Voice:**

This extends the somatic marker hypothesis from memory tagging to active reasoning modulation.

**Design implications:**
1. **Detected affect should modulate processing depth.** When the user appears frustrated (negative affect signals in their prompts), the Inner Voice should engage more systematic processing -- deeper searches, more careful injection. When the user appears engaged and productive (positive affect), lighter processing suffices.
2. **Affect signals in prompts are data.** Short, terse prompts after a sequence of longer ones may signal frustration. Prompts containing hedging language ("maybe," "I'm not sure") may signal uncertainty. These are affect signals the Inner Voice can detect and act on.

**Steel-man:** Provides a principled reason for the Inner Voice to modulate its behavior based on inferred user state -- not just what the user needs factually but how they need it emotionally.

**Stress-test:** Affect detection from text is unreliable. A terse prompt might indicate frustration or efficiency. Modulating system behavior based on unreliable emotional inference risks making wrong adjustments. Safe implementation limits the modulation to injection framing rather than fundamental behavior changes.

**Verdict: SECONDARY -- valuable conceptually for v1.4+ relationship modeling. In v1.3, too risky to implement beyond basic sentiment detection.**

---

### 2.15 Additional Theory: Contrastive Hebbian Learning / "Neurons That Fire Together Wire Together"

**What it is:** Hebb's principle states that when two neurons are repeatedly activated together, the connection between them strengthens. This is the basis for associative learning and the formation of neural pathways through repeated co-activation.

**How it maps to the Inner Voice:** Entities that co-occur across multiple sessions should have their graph connections strengthened. This is the mechanism by which the knowledge graph learns patterns -- not through explicit extraction but through statistical co-activation across time. This directly informs the consolidation algorithm: entities that repeatedly co-activate during spreading activation should have their edge weights increased.

**Verdict: SUPPORTING -- informs the weight update mechanism for spreading activation edges. Implementable as a simple counter/weight on graph edges.**

---

### Theory Applicability Summary

| Theory | Applicability | Maps To | v1.3 Essential? | Confidence |
|--------|--------------|---------|-----------------|------------|
| Dual-Process (Kahneman) | **PRIMARY** | Dual-path architecture | YES | HIGH |
| Global Workspace (Baars) | **PRIMARY** | Sublimation mechanism | YES | HIGH |
| Spreading Activation | **PRIMARY** | Cascading associations | YES (basic) | HIGH |
| Predictive Processing (Friston) | **PRIMARY** | Sublimation trigger (surprise-based) | Partial | MEDIUM |
| Working Memory (Baddeley) | **PRIMARY** | Inner Voice as episodic buffer | YES | HIGH |
| Relevance Theory (Sperber & Wilson) | **PRIMARY** | Injection formatting optimization | YES | HIGH |
| Attention Schema (Graziano) | SECONDARY | Self-model as attention monitor | YES (basic) | MEDIUM |
| Somatic Markers (Damasio) | SECONDARY | Affect tagging on entities | v1.4 | MEDIUM |
| Cognitive Load (Sweller) | **PRIMARY** | Injection volume constraint | YES | HIGH |
| Default Mode Network | SECONDARY | Session boundary processing | YES | HIGH |
| Memory Consolidation | SECONDARY | Observation synthesis | v1.4 | HIGH |
| Metacognition | SECONDARY | Self-correction mechanism | Partial | MEDIUM |
| Schema Theory | TERTIARY | Disposition/context adaptation | v1.4 | MEDIUM |
| Affect-as-Information | TERTIARY | Processing depth modulation | v1.4 | LOW |
| Hebbian Learning | SUPPORTING | Edge weight updates | v1.3 | HIGH |

---

## 3. Mechanical Design Within Dynamo

### 3.1 The Continuity Problem

**The challenge:** The brief describes a "continuous parallel cognitive process." Claude Code's architecture is event-driven: hooks fire at discrete moments (SessionStart, UserPromptSubmit, PostToolUse, PreCompact, Stop). Between hook invocations, no processing occurs.

**The solution: Persistent state + rapid re-activation.**

Human cognition is also event-driven at the neural level. What creates the experience of continuity is not continuous processing but persistent state (neural connections, activation patterns) that enables rapid reconstruction of the processing context. The Inner Voice achieves continuity through:

1. **Persistent state store.** A JSON file (`~/.claude/dynamo/ledger/inner-voice-state.json`) loaded at the start of every hook invocation and persisted back after processing. This store contains:
   - Self-model (who am I, what do I know, how am I performing)
   - Relationship model (who is the user, what do they need, how do they work)
   - Activation map (entity activation levels from spreading activation)
   - Attention state (what is the main session currently focused on)
   - Pending associations (subthreshold activations tagged for later)
   - Recent injection history (what was surfaced and when)

2. **State reconstruction.** Each hook invocation does not start from scratch. It loads the persistent state, reconstructs the processing context, processes the new event, updates state, and persists back. The discontinuity between invocations is invisible to the user because the state is comprehensive enough.

3. **Graph-backed versioning (v1.4).** The JSON file is the hot-path cache. The authoritative state is backed into Graphiti as timestamped nodes, enabling temporal queries against Inner Voice state history.

**What this means for "parallel processing":** The Inner Voice does not run in parallel with the main session. It runs AT THE SAME TIME as the main session processes each hook event, because hook handlers execute before/during the main session's processing of each event. From the user's perspective, the Inner Voice "runs alongside" the conversation because its outputs appear in the context at each interaction point.

### 3.2 State Management Architecture

```
~/.claude/dynamo/ledger/
  inner-voice-state.json    <- Hot-path cache (loaded every hook invocation)
  inner-voice-history/      <- Versioned snapshots (v1.4)
    2026-03-18T16-00-00.json
    2026-03-18T17-30-00.json
```

**State structure:**

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
    "entity_uuid_1": { "level": 0.85, "sources": ["direct_mention", "association"], "last_activated": "2026-03-18T15:58:00Z" },
    "entity_uuid_2": { "level": 0.45, "sources": ["association"], "last_activated": "2026-03-18T15:55:00Z" }
  },

  // Pending associations (subthreshold, tagged for later)
  "pending_associations": [
    { "entity": "uuid_3", "activation": 0.3, "trigger_context": "mentioned deployment", "tagged_at": "..." }
  ],

  // Recent injection history (metacognition)
  "injection_history": [
    { "turn": 5, "content_hash": "abc", "tokens": 85, "entities_referenced": ["uuid_1"], "timestamp": "..." }
  ],

  // Predictive model state
  "predictions": {
    "expected_topic": "Dynamo v1.2.1 stabilization",
    "expected_activity": "code implementation",
    "confidence": 0.7
  }
}
```

### 3.3 Processing Pipeline Per Hook

**UserPromptSubmit (most frequent, latency-critical):**

```
1. LOAD state from inner-voice-state.json          [<5ms, file I/O]
2. EMBED current prompt                             [50-100ms, API call or local]
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
   - DELIBERATION PATH [1-3s]: Call Haiku/Sonnet with context + activated entities +
     self-model, generate contextually shaped injection
7. UPDATE state                                     [<5ms]
   - Update activation_map, predictions, injection_history
   - Persist to inner-voice-state.json
8. RETURN injection or empty                        [total: 100ms-3s]
```

**SessionStart (once per session, higher latency budget):**

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

**Stop (once per session, no latency constraint):**

```
1. LOAD state
2. SYNTHESIZE session observations (Sonnet)
   - What happened this session?
   - What did the user work on? How did they react?
   - What patterns did I observe?
3. UPDATE self-model and relationship model
4. UPDATE affect markers on touched entities
5. PERSIST state (JSON cache + queue for Graphiti write)
6. QUEUE consolidation if threshold reached (N sessions since last)
```

### 3.4 Sublimation Threshold Mechanism

The sublimation threshold is the mechanism that determines when Inner Voice processing surfaces into the main thread. It is informed by multiple theories:

**The composite threshold function:**

```
sublimation_score(entity) =
    activation_level(entity)                    // Spreading activation
  * surprise_factor(entity, predictions)        // Predictive processing
  * relevance_ratio(entity, current_context)    // Relevance theory
  * (1 - cognitive_load_penalty(current_load))  // Cognitive load theory
  * confidence_weight(entity)                   // Metacognition
```

Where:
- `activation_level`: From spreading activation map (0.0 - 1.0)
- `surprise_factor`: How unexpected this entity is given current predictions (1.0 = maximally surprising, 0.0 = fully predicted)
- `relevance_ratio`: Embedding similarity between entity and current context (0.0 - 1.0)
- `cognitive_load_penalty`: Estimate of main session's current cognitive load (0.0 = idle, 1.0 = maximum)
- `confidence_weight`: Inner Voice's confidence in the entity's accuracy (0.0 - 1.0)

If `sublimation_score > THRESHOLD` (configurable, default 0.6), the entity crosses the threshold and its associated memory is formatted for injection.

**Key design properties:**
- **All components are deterministic or pre-computed.** No LLM call required for threshold calculation.
- **Multiple signals must converge.** No single factor can force sublimation alone (except explicit user recall requests, which bypass the threshold).
- **The threshold adapts.** If recent injections have been acknowledged, lower the threshold slightly (the system is performing well). If ignored, raise it (the system is being noisy).

### 3.5 Spreading Activation Implementation

**Graph-based activation propagation using Neo4j:**

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
- **Depth limit: 2 hops.** Beyond 2 hops, false associations overwhelm genuine ones.
- **Minimum propagation threshold: 0.3.** Nodes below this do not propagate further.
- **Temporal weighting.** Recent edges (created within 30 days) get 1.0 weight; older edges decay to 0.5 at 90 days and 0.2 at 180 days.
- **Convergence bonus.** When two separate anchor nodes both activate the same target, the target gets a 1.5x bonus (convergent activation).
- **In-memory activation map.** For hot-path speed, the activation map is maintained in the JSON state file, not queried from Neo4j on every invocation. Neo4j is queried only for full re-propagation (on semantic shift or session start).

### 3.6 Injection Mechanism

**How sublimated content reaches the main thread:**

Currently, Dynamo hooks inject content by outputting to stdout, which Claude Code captures as hook output and includes in the agent's context. This mechanism does not change. The Inner Voice simply replaces what gets output.

**Current pipeline:**
```
Hook fires -> search Graphiti -> curate with Haiku -> output curated text to stdout
```

**Inner Voice pipeline:**
```
Hook fires -> Inner Voice processes (state load, activation update, threshold check)
  -> if sublimation: format injection -> output to stdout
  -> if no sublimation: output empty or minimal status
```

**Injection format (informed by Relevance Theory and Cognitive Load Theory):**

```
[CONTEXT] User decided to use JWT for authentication (2 weeks ago, high confidence).
express-jwt library was chosen over passport. Decision was made during architecture
planning session, driven by simplicity preference.
```

Not:

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

The first format minimizes extraneous cognitive load. The second maximizes it. Relevance Theory demands the first.

### 3.7 Model Selection

| Component | Model | Rationale |
|-----------|-------|-----------|
| Hot path (threshold calc, entity matching) | None (deterministic) | No LLM needed for math and lookup |
| Hot path (injection formatting) | Haiku 4.5 | Fast, cheap, sufficient for template-based formatting |
| Deliberation path (deep reasoning) | Sonnet 4.6 | Narrative generation, complex context integration |
| Session start briefing | Sonnet 4.6 | Quality matters most at session start; higher latency acceptable |
| Stop hook (session synthesis) | Sonnet 4.6 | Quality matters for model updates; no latency constraint |
| Self-model updates | Sonnet 4.6 | Reasoning about relationship and self-model requires depth |
| Consolidation batch jobs | Sonnet 4.6 (Batch API) | 50% discount, no latency requirement |

### 3.8 Latency Budget

| Operation | Target | Mechanism |
|-----------|--------|-----------|
| UserPromptSubmit (hot path) | <500ms | Deterministic processing + cached state |
| UserPromptSubmit (deliberation) | <2s | Haiku call with prompt caching |
| SessionStart briefing | <4s | Sonnet call (acceptable for session start) |
| PostToolUse capture | <200ms | Deterministic: extract entities, update activation map, queue for later |
| Stop synthesis | <10s | No user-facing latency; Sonnet call for quality |

### 3.9 Cost Projections (v1.3 Inner Voice)

| Operation | Model | Daily Frequency | Tokens (in+out) | Cost/Day |
|-----------|-------|-----------------|-----------------|----------|
| Hot path formatting | Haiku 4.5 | ~80 | 2K in + 500 out | $0.36 |
| Deliberation injections | Sonnet 4.6 | ~15 | 8K in + 2K out | $0.81 |
| Session start briefing | Sonnet 4.6 | ~5 | 10K in + 3K out | $0.38 |
| Stop synthesis | Sonnet 4.6 | ~5 | 8K in + 2K out | $0.27 |
| Self-model updates | Sonnet 4.6 | ~5 | 5K in + 1K out | $0.15 |
| **v1.3 Total** | | | | **~$1.97/day (~$59/mo)** |

With prompt caching (40-50% savings on repeated system prompts):

| Scenario | Daily | Monthly |
|----------|-------|---------|
| v1.3 (without caching) | $1.97 | $59 |
| v1.3 (with caching) | $1.20 | $36 |
| Current baseline (Haiku curation) | $0.70 | $21 |

**Net increase: $0.50-1.27/day ($15-38/month) over current baseline.**

---

## 4. Adversarial Analysis of the Full Inner Voice Concept

### 4.1 Steel-Man: The Strongest Case FOR the Inner Voice

The Inner Voice addresses a failure mode that no amount of search optimization, retrieval augmentation, or curation improvement can fix: **the difference between a system that finds relevant information and a system that genuinely understands context.**

Consider what happens when a user starts a new Claude Code session today. Dynamo searches the knowledge graph, curates results with Haiku, and injects them. The injection reads like a search engine results page -- a list of facts that might be relevant. The main Claude session receives this as additional context and does its best to integrate it. But the session does not UNDERSTAND the context. It does not know that the user was frustrated last time they touched this code. It does not know that the user's communication style has shifted from exploratory to decisive over the past week. It does not know that an entity mentioned in passing three sessions ago is about to become relevant because the conversation is heading in that direction.

The Inner Voice knows all of these things because it maintains persistent models of the user relationship, the conversation trajectory, and the activation landscape. Its injections are not search results -- they are contextually shaped, relationally framed, temporally aware integrations that prime the main session to behave as if it genuinely remembers.

The cognitive science backing is not decorative. Each theory maps to a specific mechanism:
- Dual-process theory produces the dual-path architecture (cost control)
- Global Workspace Theory produces the sublimation mechanism (selectivity)
- Spreading activation produces cascading associations (pattern discovery)
- Relevance Theory produces injection format optimization (quality)
- Cognitive Load Theory produces volume constraints (usability)
- Baddeley's model identifies the core function as integration, not retrieval

Remove any one of these and the design degrades in a specific, identifiable way. The cognitive framework is load-bearing architecture, not metaphorical window dressing.

The implementation is achievable within Claude Code's constraints. The event-driven-with-persistent-state pattern is well-established in software engineering. The cost is manageable ($36-59/month, 1.7-2.8x current baseline). The rollback mechanism (feature flag to classic curation) eliminates catastrophic risk.

**The bottom line:** The Inner Voice is the difference between "Dynamo has a good memory system" and "Dynamo feels like it actually knows you." No simpler architecture achieves this.

### 4.2 Stress-Test: Actively Trying to Break It

#### 4.2.1 "Is the parallel process achievable, or is it sequential with the illusion of parallelism?"

**Verdict: It is sequential with the illusion of parallelism. And that is fine.**

The Inner Voice runs sequentially within hook invocations. It does not process alongside the main session in any literal sense. The "parallelism" is temporal interleaving: hook fires, Inner Voice processes, injection enters context, main session processes with injection in context.

But this is also how human "parallel" processing works at the neural level. Neurons fire in discrete events. What creates the experience of parallel processing is persistent state (synaptic connections) and rapid re-activation. The Inner Voice achieves the same effect through persistent state (JSON cache) and rapid processing (hot path <500ms).

**Where this genuinely fails:** Between hook invocations, the Inner Voice has no awareness of what is happening. If the user writes a long prompt that takes 30 seconds to compose, the Inner Voice knows nothing until UserPromptSubmit fires. This creates a genuine gap that does not exist in human subconscious processing.

**Mitigation:** This gap is acceptable because the user's typing time is not productive processing time -- it is input time. The Inner Voice does not need to process during input because there is nothing new to process.

#### 4.2.2 "Is the sublimation model adding real value over simpler relevance scoring?"

**Verdict: Yes, but the marginal value over good relevance scoring is modest in v1.3. It becomes substantial in v1.4+.**

Simple relevance scoring (embedding similarity between query and memory) achieves perhaps 70% of the sublimation model's value. The sublimation model adds:
- **Convergent activation** (10-15% improvement): Memories that are activated from multiple conversation threads are more relevant than single-source activations. Relevance scoring misses this.
- **Temporal dynamics** (5-10% improvement): Activation that builds over multiple turns captures evolving relevance. Relevance scoring is stateless.
- **Predictive suppression** (5-10% improvement): Memories that are relevant but expected are suppressed. Relevance scoring surfaces everything above a threshold regardless of surprise value.

**The honest assessment:** In v1.3, with a sparse knowledge graph and limited activation history, the sublimation model may perform only marginally better than good relevance scoring. The gap widens as the knowledge graph grows and conversation patterns become richer. The sublimation model is an investment that pays increasing dividends over time.

#### 4.2.3 "Does the cognitive metaphor create design clarity or false comfort?"

**Verdict: Design clarity, definitively. With one caveat.**

Every theory mapping in section 2 produced specific, actionable design implications. "The episodic buffer" is not just a metaphor for the Inner Voice -- it reframes the core function from retrieval to integration, which changes the injection format design. "Cognitive load theory" is not just an analogy -- it produces hard token limits for injections. "Spreading activation" is not just a concept -- it produces a concrete graph traversal algorithm.

**The caveat:** The cognitive metaphor can create false expectations about capability. The Inner Voice is not conscious. It does not "feel" or "understand." When the brief says "emotional context" and "relational state," these are computed approximations, not experiences. The design must not assume that the metaphor's implications extend further than the mechanism supports.

#### 4.2.4 "What happens when the Inner Voice gets it wrong?"

**Failure mode taxonomy:**

| Failure Mode | Cause | Severity | Detection | Recovery |
|-------------|-------|----------|-----------|----------|
| **False positive injection** | Threshold too low; irrelevant memory surfaces | LOW-MEDIUM | User ignores injection | Raise threshold (metacognitive control) |
| **False negative (under-sublimation)** | Threshold too high; relevant memory not surfaced | MEDIUM | User asks "don't you remember X?" | Lower threshold; explicit recall bypasses threshold |
| **Wrong framing** | Affect misattribution; incorrect relationship model | MEDIUM | User corrects or seems confused | Update relationship model; `dynamo voice reset` |
| **Stale self-model** | Model not updated after significant changes | HIGH | Persistently wrong injection context | Periodic recalibration; Stop hook updates |
| **Over-sublimation** | Injection flooding degrades main session performance | HIGH | Cognitive load exceeds capacity; session quality drops | Cognitive load hard limits; dynamic injection budget |
| **Confidently wrong** | Self-model drift + no metacognitive detection | **CRITICAL** | Difficult to detect from inside the system | External metacognition (user feedback); periodic self-model review; `dynamo voice explain` |
| **Cascading false associations** | Poor graph quality; entity resolution errors | MEDIUM | Irrelevant cascading activations | Graph quality checks; depth limits on propagation |

**The "confidently wrong" failure mode is the most dangerous and the hardest to detect.** It occurs when the self-model has drifted from reality but the metacognitive monitoring does not flag it because the monitoring itself relies on the same drifted model. This is the AI equivalent of Dunning-Kruger.

**Mitigations for confidently wrong:**
1. **Confidence decay.** Self-model assertions lose confidence over time unless reinforced by new evidence. A relationship model entry that has not been confirmed in 30 days drops from HIGH to MEDIUM confidence.
2. **User correction pathway.** `dynamo voice correct "I actually prefer X over Y"` directly updates the relationship model, overriding inferred values.
3. **Periodic recalibration prompts.** After N sessions, the Inner Voice generates a "state of understanding" summary that the user can review and correct.
4. **The classic curation fallback.** If the Inner Voice's performance degrades below baseline, the feature flag reverts to classic Haiku curation.

#### 4.2.5 "Does continuous processing burn too much money?"

**Verdict: No, because "continuous processing" is a misnomer.**

The Inner Voice does not continuously process. It processes at hook boundaries -- discrete events that occur 5-30 times per session. The hot path (80% of invocations) adds <$0.36/day. The deliberation path (20% of invocations) adds <$0.81/day. Total additional cost over baseline: $0.50-1.27/day.

**The real cost risk is not the Inner Voice itself but scope creep.** If every InnerVoice invocation triggers a Sonnet call, if consolidation runs hourly instead of daily, if the self-model update happens on every prompt instead of at Stop -- costs escalate quickly. The cost monitoring system (CORTEX-03) is the guardrail.

#### 4.2.6 "Is this over-engineered for the actual benefit delivered?"

**Verdict: The full brief description is over-engineered. The v1.3 scope is appropriately engineered.**

The brief describes a "continuous parallel cognitive process" with "cascading associations," "emotional context," "relational modeling," and "selective permeability." Implementing all of this in v1.3 would be over-engineering.

The v1.3 scope is:
- Dual-path routing (hot/deliberation) -- this is a straightforward architectural improvement
- Basic semantic shift detection -- embedding cosine distance, a single computation
- Self-model persistence -- a JSON file loaded and saved per hook invocation
- Threshold-based sublimation -- a composite scoring function, no LLM required
- Narrative briefing at session start -- one Sonnet call per session

This is not over-engineered. This is "smart curation with persistent state." The cognitive architecture terminology is the specification for where this evolves, not what ships in v1.3.

#### 4.2.7 The Hardest Question: "Can a continuous parallel cognitive process be built within Claude Code?"

**Verdict: No. And it does not need to be.**

A truly continuous parallel process -- one that runs alongside the main session at all times, processing independently -- is not possible within Claude Code's architecture. Claude Code does not support background threads, daemon processes, or persistent connections that monitor the main session's state in real-time.

But the cognitive science literature reveals that this is a feature, not a bug. Human "continuous" processing is an illusion created by persistent state and rapid re-activation. The brain does not continuously compute -- neurons fire in discrete events. What creates continuity is the persistent connection network (synapses) that allows rapid reconstruction of processing context.

The Inner Voice achieves this through:
1. Persistent state (inner-voice-state.json) -- the "synaptic connections"
2. Rapid loading and processing at every hook event -- the "neural firing"
3. Comprehensive state that captures activation levels, predictions, and models -- the "context reconstruction"

The result: from the user's perspective, the Inner Voice appears continuous because it picks up exactly where it left off at every hook invocation. The discontinuity between invocations is invisible because the state is comprehensive enough to bridge it.

**This is not a compromise. This is the correct design.** A truly continuous process would burn API tokens every second. An event-driven process with persistent state achieves the same cognitive effect at a fraction of the cost.

---

## 5. Implementation Pathway (Option C Phasing)

### 5.1 v1.3: Minimal Viable Inner Voice

**What ships:**
- `ledger/inner-voice.cjs` -- core processing logic
- `ledger/dual-path.cjs` -- hot/deliberation path routing
- `ledger/activation.cjs` -- basic activation map (in-memory, persisted to JSON)
- `inner-voice-state.json` -- persistent state file
- Feature flag: `dynamo config set ledger.mode classic|cortex`
- Debug command: `dynamo voice explain`
- Cost tracking: `dynamo cost today`

**Cognitive theories implemented:**
- Dual-Process (hot/deliberation paths)
- Global Workspace (threshold-based sublimation)
- Spreading Activation (basic, 1-hop, in-memory)
- Relevance Theory (injection format optimization)
- Cognitive Load Theory (token limits per injection type)
- Predictive Processing (semantic shift detection as surprise proxy)

**What is explicitly NOT in v1.3:**
- Relationship modeling beyond basic preferences
- Affect/emotional tagging
- Multi-hop spreading activation
- Observation synthesis / consolidation
- Narrative briefings with relational framing (session start briefings are factual, not narrative)
- Metacognitive self-correction (beyond the explain command)

**Risk level:** MEDIUM. The core risk is the quality valley -- the Inner Voice might perform worse than classic Haiku curation before its models are trained. The feature flag mitigates this.

### 5.2 v1.4: Advanced Inner Voice

**What ships:**
- Relationship model with affect tracking (Somatic Markers)
- Multi-hop spreading activation (2 hops, Neo4j-backed)
- Narrative session start briefings (Default Mode Network)
- Observation synthesis batch jobs (Memory Consolidation)
- Metacognitive self-correction (feedback tracking + threshold adjustment)
- Graph-backed state persistence (Graphiti nodes with temporal versioning)
- `dynamo voice model` -- inspect self-model and relationship model
- `dynamo voice reset` -- reset models to defaults

**Cognitive theories added:**
- Somatic Marker Hypothesis (affect tagging)
- Default Mode Network (session boundary processing emphasis)
- Memory Consolidation (observation synthesis)
- Metacognition (feedback-based self-correction)
- Schema Theory (disposition/context adaptation)
- Attention Schema Theory (full self-model as attention monitor)

### 5.3 v1.5: Agent-Capable Inner Voice

**What ships:**
- Claude Agent SDK integration for deep recall operations
- On-demand subagent spawning for complex memory queries
- Codebase indexer (background ingestion)
- Connector framework interface (for future expansion)

### 5.4 v2.0: Full Cognitive Architecture

**What ships:**
- Multi-agent deliberation (Inner Voice + Construction functions)
- Domain agent framework (Claudia-aware interfaces)
- Full predictive processing (active inference)
- Cross-surface persistence (multi-session, multi-surface state)

### 5.5 Incremental vs. Big-Bang Risk Assessment

| Factor | Incremental (Option C) | Big-Bang (full v1.3) |
|--------|----------------------|---------------------|
| Time to first value | 4-6 weeks | 3-6 months |
| Risk of total failure | LOW (each phase independent) | HIGH (all-or-nothing) |
| Cost of failure | One phase reverted | Months of work discarded |
| Quality of final product | Each component proven before integration | Untested integration of unproven components |
| User feedback incorporation | Feedback after each phase shapes the next | No feedback until everything ships |
| Cognitive load on implementer | Manageable -- one theory cluster at a time | Overwhelming -- all theories at once |

**The case for incremental is overwhelming.** The only argument for big-bang is "architectural coherence" -- building everything together ensures it fits together. But Option C achieves architectural coherence through interface design: the v1.3 Inner Voice exposes the same interfaces that v1.4 components will consume. The architecture is coherent; the implementation is phased.

---

## 6. Open Questions and Research Gaps

### 6.1 Embedding Model Selection

The hot-path activation and semantic shift detection depend on embeddings. Should the Inner Voice use:
- Graphiti's existing embedding model (whatever is configured)?
- A separate, potentially faster local embedding model (MENH-08)?
- Claude's built-in embedding (not available as a separate API)?

**Recommendation:** Use Graphiti's configured embedding model for v1.3. Evaluate local embeddings (MENH-08) for v1.4 when latency optimization becomes critical.

### 6.2 State File Concurrency

If multiple Claude Code sessions run simultaneously (different terminal windows), they share the same `inner-voice-state.json`. Without concurrency control, state could be corrupted by simultaneous writes.

**Recommendation:** Use file-based locking (write to temp, atomic rename) and session-scoped state sections. Each session writes its own section; shared state (relationship model) uses last-write-wins with conflict detection at session start.

### 6.3 Knowledge Graph Density Requirements

Spreading activation requires a sufficiently dense graph. With a sparse graph (early usage), activation has nowhere to spread. What is the minimum graph density for spreading activation to add value over simple search?

**Recommendation:** Begin with simple entity-mention matching in v1.3. Enable spreading activation only when graph contains >100 entities and >200 relationships (a threshold that triggers automatically).

### 6.4 Evaluation Metrics

How do we measure whether the Inner Voice is performing better than classic curation? Proposed metrics:
- **Injection relevance rate**: % of injections the user references in subsequent prompts
- **Silence accuracy**: % of non-injection decisions that were correct (user did not ask for missing context)
- **Session coherence**: User's subjective assessment of whether the session felt "remembered"
- **Cost efficiency**: Relevance rate per dollar spent

**Gap:** No baseline measurements exist for the current Haiku curation pipeline. Establishing baselines before Inner Voice deployment is essential.

### 6.5 Prompt Engineering Quality

The Inner Voice's quality depends entirely on its system prompt. A poorly designed system prompt produces a poorly performing Inner Voice regardless of the architectural quality. This is the single most important and least predictable factor.

**Recommendation:** Invest significant effort in prompt engineering and testing before deployment. Use A/B testing between classic and cortex modes to validate.

---

## 7. Recommendations

### 7.1 Primary Recommendations

1. **Proceed with Option C phasing.** The Inner Voice is the highest-value component of the Ledger Cortex and should be the first thing built. Each subsequent phase proves value before scaling.

2. **Implement the dual-path architecture first.** Before building any Inner Voice logic, refactor the hook pipeline to support hot/deliberation path routing. This is the foundation everything else depends on.

3. **Use the cognitive theories as a specification, not a metaphor.** Each theory maps to a specific mechanical component. The theory survey in section 2 is a design specification document, not an academic exercise.

4. **The persistent state file IS the Inner Voice.** The JSON state file (self-model, activation map, relationship model, predictions) is not a cache or optimization. It IS the mechanism that creates the illusion of continuous processing. Its design deserves as much attention as any code module.

5. **Start with high-confidence theories.** v1.3 implements the six PRIMARY theories (Dual-Process, Global Workspace, Spreading Activation, Relevance, Cognitive Load, Predictive Processing basics). v1.4 adds the SECONDARY theories (Somatic Markers, DMN, Memory Consolidation, Metacognition, AST, Schema). Do not attempt to implement all theories at once.

6. **The feature flag is non-negotiable.** `ledger.mode = classic|cortex` must exist from day one. If the Inner Voice underperforms, immediate rollback to proven behavior.

7. **Measure before and after.** Establish baseline metrics for the current Haiku curation pipeline before deploying the Inner Voice. Without baselines, improvement cannot be validated.

### 7.2 Design Principles (Derived from Theory Survey)

| Principle | Source Theory | Implementation |
|-----------|-------------|----------------|
| Most processing stays invisible | Global Workspace Theory | Only threshold-crossing content sublimates |
| Speak when surprised, not when scheduled | Predictive Processing | Semantic shift triggers injection, not every prompt |
| Integrate, don't retrieve | Baddeley's Working Memory | Inner Voice binds facts with context and framing |
| Maximize insight per token | Relevance Theory | Concise, contextually shaped injections |
| Respect the workspace capacity | Cognitive Load Theory | Hard token limits: 500 (session start), 150 (mid-session), 50 (urgent) |
| Model your own attention | Attention Schema Theory | Self-model tracks what main session is focused on |
| Session boundaries are premium processing time | Default Mode Network | Invest in Stop (synthesis) and SessionStart (briefing) |
| Fast path first, slow path only when needed | Dual-Process Theory | 95% hot path, 5% deliberation |
| Associations cascade, they don't search | Spreading Activation | Graph-based activation propagation, not per-query search |
| Tag emotions, use them later | Somatic Markers | Affect metadata on entities shapes future framing |

### 7.3 What This Document Is

This document is a **supplementary specification** for the Inner Voice component of the Ledger Cortex architecture. It provides:
- The cognitive science foundation that justifies each design decision
- The mechanical architecture within Dynamo's constraints
- The adversarial analysis that identifies and mitigates risks
- The phased implementation pathway

It should be consumed alongside `LEDGER-CORTEX-BRIEF.md` (the vision), `LEDGER-CORTEX-ANALYSIS.md` (the adversarial analysis of the full Cortex), and `MASTER-ROADMAP-DRAFT-v1.3-cortex.md` (the phased roadmap) when planning v1.3 implementation.

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
- [Spreading activation in emotional memory networks - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5413589/) -- connecting somatic markers to spreading activation
- [Applying Cognitive Design Patterns to General LLM Agents (2025)](https://arxiv.org/html/2505.07087v2)
- [Scenario-Driven Cognitive Approach to Next-Generation AI Memory](https://arxiv.org/html/2509.13235)

---

## Metadata

**Confidence breakdown:**
- Theory mapping: HIGH -- based on established cognitive science literature with direct mechanical translations
- Mechanical design: MEDIUM -- architecturally sound within known constraints; specific implementation details need validation during development
- Feasibility assessment: MEDIUM -- event-driven-with-persistent-state is well-established; quality of persistent state design is the critical unknown
- Cost projections: MEDIUM -- based on published pricing and estimated usage patterns; actual costs may vary 50%
- Phasing recommendations: HIGH -- aligns with prior analysis (LEDGER-CORTEX-ANALYSIS.md) and adds theory-backed prioritization

**Research date:** 2026-03-18
**Valid until:** 2026-05-18 (theory mapping stable; Claude API pricing and Agent SDK capabilities should be re-verified)

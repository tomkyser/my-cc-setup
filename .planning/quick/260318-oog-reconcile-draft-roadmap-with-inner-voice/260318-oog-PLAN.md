---
phase: quick
plan: 260318-oog
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/research/MASTER-ROADMAP-DRAFT-v1.3-cortex.md
autonomous: true
requirements: []

must_haves:
  truths:
    - "CORTEX-01/02 descriptions reference specific PRIMARY theories mapped to v1.3 scope"
    - "CORTEX-04/05/06 descriptions reference SECONDARY/TERTIARY theories mapped to v1.4 scope"
    - "Mechanical design findings (event-driven + persistent state, deterministic sublimation threshold) appear in CORTEX-01 and CORTEX-02 descriptions"
    - "Inner Voice phasing across v1.3-v2.0 reflects the spec's artifact-level detail"
    - "MENH-06/07 explicitly requires Graphiti dual-model (Sonnet/Haiku) configuration"
    - "All changes are marked with [RECONCILED] tag"
    - "A changelog entry documents all reconciliation changes"
  artifacts:
    - path: ".planning/research/MASTER-ROADMAP-DRAFT-v1.3-cortex.md"
      provides: "Updated roadmap reconciled with Inner Voice spec findings"
      contains: "[RECONCILED]"
  key_links:
    - from: "INNER-VOICE-SPEC.md Section 3.1 theory table"
      to: "CORTEX-01/02/04 requirement descriptions"
      via: "PRIMARY->v1.3, SECONDARY/TERTIARY->v1.4+ mapping"
      pattern: "RECONCILED.*PRIMARY|SECONDARY"
---

<objective>
Update MASTER-ROADMAP-DRAFT-v1.3-cortex.md to incorporate findings from the Inner Voice Cognitive Architecture Specification. The spec produced concrete design insights that the draft roadmap currently lacks: theory tiering mapped to milestones, mechanical design resolution, refined Inner Voice phasing, and Graphiti dual-model requirement.

Purpose: The roadmap is the source of truth for implementation planning. Without reconciliation, the spec's findings remain disconnected from the build order and requirement descriptions that drive actual phase planning.

Output: Updated MASTER-ROADMAP-DRAFT-v1.3-cortex.md with all four gaps closed, every change tagged [RECONCILED], and a changelog entry at the bottom.
</objective>

<execution_context>
@/Users/tom.kyser/.claude/get-shit-done/workflows/execute-plan.md
@/Users/tom.kyser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/research/MASTER-ROADMAP-DRAFT-v1.3-cortex.md
@.planning/research/INNER-VOICE-SPEC.md
@.planning/research/LEDGER-CORTEX-BRIEF.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Reconcile roadmap with Inner Voice spec findings</name>
  <files>.planning/research/MASTER-ROADMAP-DRAFT-v1.3-cortex.md</files>
  <action>
Read both INNER-VOICE-SPEC.md and the current MASTER-ROADMAP-DRAFT-v1.3-cortex.md in full. Then apply the following four reconciliation passes to the roadmap. Mark EVERY change with `[RECONCILED]` so changes are traceable.

**Pass 1: Map cognitive theory tiering to milestone requirements**

Update CORTEX-01 description to enumerate the 7 PRIMARY theories that are load-bearing for v1.3:
- Dual-Process (Kahneman) -> dual-path architecture
- Global Workspace (Baars) -> sublimation mechanism
- Spreading Activation (Collins & Loftus) -> basic 1-hop cascading associations
- Predictive Processing (Friston) -> semantic shift detection as surprise proxy
- Working Memory (Baddeley) -> episodic buffer / integration function
- Relevance Theory (Sperber & Wilson) -> injection format optimization
- Cognitive Load (Sweller) -> injection volume constraints (500/150/50 token limits)
Plus Hebbian Learning as SUPPORTING (basic edge weight tracking).

Update CORTEX-04 description to enumerate the 5 SECONDARY theories added in v1.4:
- Attention Schema Theory (Graziano) -> full self-model as attention monitor
- Somatic Marker Hypothesis (Damasio) -> affect tagging on entities
- Default Mode Network -> session boundary consolidation processing
- Memory Consolidation -> observation synthesis (Hindsight reflect pattern)
- Metacognition -> feedback-based self-correction and threshold adjustment
Plus Schema Theory as TERTIARY (disposition/context adaptation).

Note: Affect-as-Information (Schwarz) is also TERTIARY and maps to v1.4 processing depth modulation but the spec rates it LOW confidence -- mention but do not make it a primary v1.4 deliverable.

**Pass 2: Incorporate mechanical design findings into requirement descriptions**

Update CORTEX-01 description to include:
- The "event-driven + persistent state" resolution: NOT a compromise but the correct design. Human cognition is also event-driven at neural level; persistent state + rapid re-activation creates the continuity illusion.
- The persistent state file (`inner-voice-state.json`) containing self-model, relationship model, activation map, pending associations, injection history, and predictive model state.
- The processing pipeline per hook: LOAD state -> PROCESS -> UPDATE -> PERSIST.

Update CORTEX-02 description to include:
- The deterministic sublimation threshold formula: `sublimation_score = activation_level * surprise_factor * relevance_ratio * (1 - cognitive_load_penalty) * confidence_weight`. All factors deterministic or pre-computed -- no LLM call for threshold calculation.
- Hot path target: <500ms, deterministic processing + cached state.
- Deliberation path target: <2s for Haiku, <4s for Sonnet (session start).
- 95% hot path / 5% deliberation target ratio.

**Pass 3: Refine Inner Voice phasing across milestones**

Update the v1.3 section to specify what the Inner Voice ships (from spec Section 6.1):
- Core artifacts: `ledger/inner-voice.cjs`, `ledger/dual-path.cjs`, `ledger/activation.cjs`, `inner-voice-state.json`
- Feature flag: `dynamo config set ledger.mode classic|cortex`
- Debug: `dynamo voice explain`
- v1.3 spreading activation is basic (1-hop, in-memory JSON, NOT Neo4j-backed)
- v1.3 session start briefings are factual, NOT narrative
- v1.3 explicitly does NOT include: relationship modeling beyond basic preferences, affect/emotional tagging, multi-hop spreading activation, observation synthesis, narrative briefings with relational framing, metacognitive self-correction beyond explain command, graph-backed state persistence

Update the v1.4 section to specify what advances (from spec Section 6.2):
- Spreading activation upgrades to 2-hop, Neo4j-backed
- Narrative briefings with relational framing (DMN-inspired)
- Observation synthesis batch jobs (Memory Consolidation theory)
- Metacognitive self-correction (feedback tracking + threshold adjustment)
- Graph-backed persistence (Graphiti nodes with temporal versioning replacing JSON-only)
- New CLI commands: `dynamo voice model`, `dynamo voice reset`

Add a note to v1.5 section: Agent-capable Inner Voice (Agent SDK for deep recall, subagent spawning).

Add a note to v2.0 section: Full cognitive architecture (multi-agent deliberation, active inference, cross-surface persistence).

**Pass 4: Add Graphiti dual-model requirement**

Update MENH-06 description to explicitly state: "Enables Graphiti dual-model selection (Sonnet for complex relationship inference, Haiku for simple entity extraction). This is a prerequisite for CORTEX-01/02 model selection per path."

Update MENH-07 description to add: "Per-path model selection (Haiku for hot path formatting, Sonnet for deliberation path reasoning, session start briefing, stop synthesis, and self-model updates). See INNER-VOICE-SPEC.md Section 4.7 for full model-to-component mapping."

In the Requirement Index, add a note to MENH-06 and MENH-07 entries: `[RECONCILED] Prerequisite for CORTEX-01/02 dual-model selection`.

**Pass 5: Add reconciliation changelog entry**

At the bottom of the file, after the existing changelog, add a new section:

```
### Reconciliation with Inner Voice Spec (2026-03-18)

Source: INNER-VOICE-SPEC.md (Cognitive Architecture Specification)

| Change | Requirement(s) | What Changed |
|--------|---------------|--------------|
| Theory tiering mapped to milestones | CORTEX-01, CORTEX-04 | 7 PRIMARY theories -> v1.3, 5 SECONDARY + 2 TERTIARY -> v1.4 |
| Mechanical design findings | CORTEX-01, CORTEX-02 | Event-driven + persistent state resolution, deterministic sublimation threshold formula, latency budgets |
| Inner Voice phasing refined | CORTEX-01, CORTEX-04, CORTEX-06 | Specific artifacts per milestone, explicit NOT-in-v1.3 list, v1.3 basic vs v1.4 advanced distinctions |
| Graphiti dual-model | MENH-06, MENH-07 | Explicit Sonnet/Haiku per-path model selection as prerequisite for CORTEX dual-path |

All changes marked with [RECONCILED] tag for traceability.
```

**Important constraints:**
- Do NOT change any requirement IDs, milestone assignments, or add/remove requirements.
- Do NOT change the overall structure or ordering of the document.
- Only modify description text within existing requirement entries and add the changelog.
- Preserve all existing `[CORTEX]` tags -- add `[RECONCILED]` alongside, not instead of.
  </action>
  <verify>
    <automated>grep -c "\[RECONCILED\]" .planning/research/MASTER-ROADMAP-DRAFT-v1.3-cortex.md | xargs -I{} test {} -ge 10 && echo "PASS: 10+ RECONCILED tags found" || echo "FAIL: fewer than 10 RECONCILED tags"</automated>
  </verify>
  <done>
- CORTEX-01 description enumerates 7 PRIMARY theories with their mechanical mappings
- CORTEX-02 description includes deterministic sublimation threshold formula and latency budgets
- CORTEX-04 description enumerates 5 SECONDARY + TERTIARY theories
- MENH-06/07 descriptions explicitly require Graphiti dual-model as CORTEX prerequisite
- v1.3 section lists specific Inner Voice artifacts and explicit NOT-in-v1.3 scope
- v1.4 section lists specific advancement artifacts (2-hop activation, narrative briefings, consolidation, graph-backed persistence)
- All changes tagged [RECONCILED]
- Changelog entry at bottom documents all 4 reconciliation areas
  </done>
</task>

</tasks>

<verification>
1. All [RECONCILED] tags are present (grep count >= 10)
2. Document still renders as valid Markdown (no broken tables or formatting)
3. No requirement IDs changed, no requirements added or removed
4. All 4 reconciliation gaps explicitly addressed
5. Existing [CORTEX] tags preserved alongside new [RECONCILED] tags
</verification>

<success_criteria>
The updated MASTER-ROADMAP-DRAFT-v1.3-cortex.md incorporates all four findings from INNER-VOICE-SPEC.md with full traceability via [RECONCILED] tags. A reader can grep for [RECONCILED] to see exactly what changed and why. The document is ready for user review before replacing MASTER-ROADMAP.md.
</success_criteria>

<output>
After completion, create `.planning/quick/260318-oog-reconcile-draft-roadmap-with-inner-voice/260318-oog-SUMMARY.md`
</output>

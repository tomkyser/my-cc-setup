# Dynamo Master Roadmap

> **DRAFT -- Proposed revision incorporating Ledger Cortex (Option C: Phased Integration).**
> See `LEDGER-CORTEX-ANALYSIS.md` for reasoning behind every change.
> Changes from the current roadmap are marked with `[CORTEX]`.

**Last updated:** 2026-03-18

This document covers the Dynamo project roadmap from v1.2.1 through v2.0. Milestones v1.0 (Research and Ranked Report), v1.1 (Fix Memory System), and v1.2 (Dynamo Foundation) are complete. Requirements are prioritized and assigned to milestones based on dependency analysis and the project's core value: every capability must be self-manageable by Claude Code without manual user config file edits.

> **How to Use This Document:** This is a living document that Claude Code should read to understand what comes next and in what order. When planning future work, consult the milestone assignments and dependency notes to determine what to build next. Requirement IDs (MENH-XX, MGMT-XX, UI-XX, STAB-XX, CORTEX-XX) correspond to entries in `.planning/REQUIREMENTS.md`.

> **[CORTEX] Ledger Cortex Integration:** The Ledger Cortex vision (multi-agent cognitive memory) is integrated across milestones via phased delivery (Option C). Core insight: the Inner Voice + dual-path architecture ships in v1.3; enhanced construction scales in v1.4; agent coordination and domain extensibility scale in v1.5-v2.0. The Infrastructure Agent is implemented as deterministic tooling, not an LLM agent. See LEDGER-CORTEX-ANALYSIS.md for the full adversarial analysis.

## Milestone Overview

| Milestone | Theme | Requirements | Description |
|-----------|-------|:------------:|-------------|
| v1.2.1 | Stabilization and Polish | 10 | Close gaps from v1.2: rebranding, directory/scope refactor, legacy cleanup, docs, CLI integration, update system, architecture capture, Neo4j fix, dev toggles |
| v1.3 | Intelligent Memory and Modularity | 17 | `[CORTEX]` Inner Voice, dual-path routing, cost monitoring + management modularity. Absorbs MENH-01, MENH-02, MENH-10, MENH-11, MGMT-09. |
| v1.4 | Memory Quality and Agent Foundation | 9 | `[CORTEX]` Advanced Inner Voice, observation synthesis, preferences. Adds CORTEX-04/05/06. MGMT-09 moved to v1.3. |
| v1.5 | Dashboard, Visibility, and Agent Coordination | 10 | `[CORTEX]` UI + agent SDK integration + connector framework. Adds CORTEX-07/08/09. |
| v2.0 | Advanced Capabilities | 4 | `[CORTEX]` Multi-agent deliberation, domain agent framework, cross-platform. Adds CORTEX-10/11. MENH-09 absorbed. |

## Completed Milestones

<details>
<summary>v1.0 through v1.2 (completed)</summary>

- **v1.0 Research and Ranked Report** (Phases 1-3) -- Completed 2026-03-17. Vetted and ranked tools for the Claude Code ecosystem using a 4-gate methodology.
- **v1.1 Fix Memory System** (Phases 4-7) -- Completed 2026-03-17. Diagnosed root causes of silent hook failures, fixed memory persistence, added session management and auto-naming.
- **v1.2 Dynamo Foundation** (Phases 8-11) -- Completed 2026-03-18. Rewrote the Python/Bash foundation to Node/CJS architecture with full feature parity. Established Dynamo/Ledger/Switchboard branding and project structure.

</details>

## Milestone Details

### v1.2.1 -- Stabilization and Polish

**Goal:** Close the gaps between v1.2's CJS rewrite and v1.3's intelligence work. The foundation is solid but the public-facing artifacts (README, repo identity, docs) and operational concerns (update system, legacy cleanup, CLAUDE.md integration) were not addressed in v1.2. This milestone ensures Dynamo is properly branded, fully documented, easy to update, and that the architectural decisions made during v1.2 are captured for continuity.

**Dependencies:** v1.2 (CJS substrate complete, feature parity achieved)

| Requirement | Name | Rationale |
|-------------|------|-----------|
| STAB-01 | README and rebranding pass | README still references Python/Bash architecture and old naming; repo name change on GitHub to reflect Dynamo identity |
| STAB-02 | Archive legacy Python/Bash system | Cutover should be complete: tag and branch the old system, remove from dev/master branches |
| STAB-03 | Exhaustive documentation | Cover all facets: architecture, usage, CLI commands, hook behavior, configuration, development guide |
| STAB-04 | Dynamo CLI integration in CLAUDE.md | Claude Code must know how to use the Dynamo CLI and system; CLAUDE.md needs complete operational instructions |
| STAB-05 | Update/upgrade system | Design, implement, and document a system for updating Dynamo as a whole (version checks, migration, rollback) |
| STAB-06 | Architecture and design decision capture | Deep analysis of GSD-made architectural decisions from v1.0-v1.2; incorporate into planning artifacts for development continuity |
| STAB-07 | Fix Neo4j admin browser connectivity | Unable to connect to Neo4j through the admin browser (port 7475); investigate root cause and fix -- critical for visibility into the knowledge graph |
| STAB-08 | Directory structure refactor | Establish `dynamo/`, `ledger/`, `switchboard/` as root-level directories reflecting the three-component architecture; `graphiti/` moves under `ledger/` as its storage backend |
| STAB-09 | Component scope refactor | Refactor code as necessary to honor the established scope boundaries of Dynamo (orchestration/CLI), Ledger (memory/knowledge), and Switchboard (management/ops); ensure no cross-boundary leakage |
| STAB-10 | Global on/off and dev mode toggles | Global toggle to disable all Dynamo hooks/MCP/functionality across all threads; dev mode toggle to override global off for the current development thread only -- prevents Dynamo from interfering during development while allowing the dev session to use it selectively |

### v1.3 -- Intelligent Memory and Modularity `[CORTEX REVISED]`

**Goal:** Make the memory system intelligent through the Inner Voice and dual-path architecture (Ledger Cortex Phase 1), while making the management system modular with self-contained dependency management and on-demand skill loading. The Inner Voice replaces Haiku-only curation with context-aware, personality-driven memory injection. Dual-path routing ensures cost control by routing 95% of operations through a fast, cheap hot path. `[CORTEX]`

`[RECONCILED]` **Inner Voice v1.3 Artifacts:** Core artifacts: `ledger/inner-voice.cjs`, `ledger/dual-path.cjs`, `ledger/activation.cjs`, `inner-voice-state.json`. Feature flag: `dynamo config set ledger.mode classic|cortex`. Debug: `dynamo voice explain`. Cost tracking: `dynamo cost today`. v1.3 spreading activation is basic (1-hop, in-memory JSON, NOT Neo4j-backed). v1.3 session start briefings are factual, NOT narrative. **Explicitly NOT in v1.3:** relationship modeling beyond basic preferences, affect/emotional tagging, multi-hop spreading activation, observation synthesis/consolidation, narrative briefings with relational framing, metacognitive self-correction beyond the explain command, graph-backed state persistence (JSON only).

**Dependencies:** v1.2.1 (stabilization complete, documentation and CLI integration in place)

#### `[CORTEX]` Ledger Cortex Requirements (new and absorbed)

| Requirement | Name | Source | Rationale |
|-------------|------|--------|-----------|
| CORTEX-01 | Inner Voice (basic) | New | `[CORTEX]` `[RECONCILED]` Semantic shift detection, smart curation replacing Haiku pipeline, self-model persistence (basic JSON cache). Absorbs MENH-01, MENH-02, MENH-10, MENH-11 functionality. **Implements 7 PRIMARY cognitive theories:** Dual-Process (Kahneman) -> dual-path architecture; Global Workspace (Baars) -> sublimation mechanism; Spreading Activation (Collins & Loftus) -> basic 1-hop cascading associations; Predictive Processing (Friston) -> semantic shift detection as surprise proxy; Working Memory (Baddeley) -> episodic buffer / integration function; Relevance Theory (Sperber & Wilson) -> injection format optimization; Cognitive Load (Sweller) -> injection volume constraints (500/150/50 token limits). Plus Hebbian Learning (SUPPORTING) for basic edge weight tracking. **Mechanical design:** Event-driven + persistent state architecture (not a compromise -- the correct design; human cognition is also event-driven at the neural level; persistent state + rapid re-activation creates the continuity illusion). Persistent state file (`inner-voice-state.json`) containing self-model, relationship model, activation map, pending associations, injection history, and predictive model state. Processing pipeline per hook: LOAD state -> PROCESS -> UPDATE -> PERSIST. See INNER-VOICE-SPEC.md Section 4 for full mechanical specification. |
| CORTEX-02 | Dual-path routing | New | `[CORTEX]` `[RECONCILED]` Hot path (<1s, deterministic search + cached results) and deliberation path (LLM-powered deep reasoning). Deterministic path selection rules. **Deterministic sublimation threshold formula:** `sublimation_score = activation_level * surprise_factor * relevance_ratio * (1 - cognitive_load_penalty) * confidence_weight`. All factors deterministic or pre-computed -- no LLM call for threshold calculation. **Latency budgets:** Hot path target <500ms (deterministic processing + cached state); Deliberation path target <2s (Haiku call with prompt caching); Session start briefing <4s (Sonnet, acceptable for session start). **Target ratio:** 95% hot path / 5% deliberation. See INNER-VOICE-SPEC.md Section 4.4 and 4.8 for threshold mechanism and latency budget details. |
| CORTEX-03 | Cost monitoring | New | `[CORTEX]` Per-agent/day/month budget tracking with hard enforcement. Degrades to hot-path-only when budget exhausted. CLI: `dynamo cost today/month/budget`. |
| MENH-01 | Decision engine -- infer context type | Absorbed by CORTEX-01 | `[CORTEX]` Inner Voice context inference IS the decision engine. Not built separately. |
| MENH-02 | Preload engine -- auto inference and injection | Absorbed by CORTEX-01 | `[CORTEX]` Inner Voice narrative briefing IS the preload engine. Not built separately. |
| MENH-10 | Dynamic curation depth | Absorbed by CORTEX-02 | `[CORTEX]` Dual-path routing IS dynamic curation depth. Hot path for simple lookups, deliberation for deep synthesis. |
| MENH-11 | Proactive intelligent ingestion | Absorbed by CORTEX-01 | `[CORTEX]` Inner Voice's smart PostToolUse handling IS proactive ingestion for v1.3 scope. |
| MGMT-09 | Human cognition patterns as prompt engineering | Moved from v1.4 | `[CORTEX]` Inner Voice cognitive architecture IS this requirement. Biomimetic memory patterns applied to injection. |

#### Remaining Management Requirements (unchanged)

| Requirement | Name | Rationale |
|-------------|------|-----------|
| MENH-06 | Support both API and native Haiku | `[RECONCILED]` Removes OpenRouter single-point-of-failure for curation; straightforward transport layer change on CJS. **Enables Graphiti dual-model selection (Sonnet for complex relationship inference, Haiku for simple entity extraction). This is a prerequisite for CORTEX-01/02 model selection per path.** See INNER-VOICE-SPEC.md Section 4.7 for model-to-component mapping. |
| MENH-07 | Support other model choices for curation | `[RECONCILED]` Natural extension of MENH-06; once transport is flexible, model selection follows. `[CORTEX]` Now also enables per-path model selection (Haiku for hot, Sonnet for deliberation). **Per-path model selection: Haiku 4.5 for hot path formatting, Sonnet 4.6 for deliberation path reasoning, session start briefing, stop synthesis, and self-model updates.** See INNER-VOICE-SPEC.md Section 4.7 for full model-to-component mapping. |
| MGMT-01 | Self-contained dependency management | Core self-manageability requirement; Dynamo should manage its own dependencies (GSD, Graphiti, etc.) |
| MGMT-02 | Domain-specific on-demand modules | Enables skill loading (WPCS, Context7, Playwright); requires modular injection pattern from v1.2 |
| MGMT-03 | CC skill inference and internal use | Makes Claude Code aware of available skills; builds on MGMT-02's module system |
| MGMT-05 | Hooks replacing CLAUDE.md for dynamic behavior | Architectural evolution -- hooks already exist from v1.2, this makes them the primary behavior mechanism |
| MGMT-08 | Jailbreak/hijacking protection patterns | Security hardening of the hook system; should happen early while the system is well-understood |
| MGMT-10 | Modular injection with better control | Refined injection control building on v1.2's CJS foundation; enables precise capability management |
| MGMT-11 | Session index refactor to SQLite | Replace flat-file session index with SQLite (or similar) to accommodate the depth and breadth of Ledger and Dynamo over time; a proper DB could serve multiple subsystems beyond just Ledger |
| UI-08 | Inline Dynamo visibility in Claude thread | More in-thread visibility of what Dynamo is doing without adding excessive noise; status indicators, memory actions, and system state surfaced contextually |

### v1.4 -- Memory Quality and Agent Foundation `[CORTEX REVISED]`

**Goal:** Elevate the quality of stored memories through synthesis, comprehension, and alternative storage backends, while enabling intelligent persistence of user preferences at both global and project scopes. The advanced Inner Voice gains narrative briefings, relationship modeling, and cross-session continuity. Observation synthesis (inspired by Hindsight's reflect pattern) automatically identifies patterns across accumulated knowledge. `[CORTEX]`

`[RECONCILED]` **Inner Voice v1.4 Advancements:** Spreading activation upgrades to 2-hop, Neo4j-backed (replacing in-memory JSON). Narrative briefings with relational framing (DMN-inspired session start narratives). Observation synthesis batch jobs (Memory Consolidation theory -- Hindsight-inspired reflect pattern). Metacognitive self-correction (feedback tracking + threshold adjustment). Graph-backed persistence (Graphiti nodes with temporal versioning replacing JSON-only state). New CLI commands: `dynamo voice model` (inspect self-model and relationship model), `dynamo voice reset` (reset models to defaults). Implements 5 SECONDARY + 2 TERTIARY cognitive theories (see CORTEX-04).

**Dependencies:** v1.3 (Inner Voice basic + dual-path operational, intelligence layer and modular injection operational)

#### `[CORTEX]` Ledger Cortex Requirements (new)

| Requirement | Name | Source | Rationale |
|-------------|------|--------|-----------|
| CORTEX-04 | Inner Voice (advanced) | New | `[CORTEX]` `[RECONCILED]` Narrative briefings at session start, relationship modeling (user patterns, frustrations, communication style), personality adaptation across contexts. **Implements 5 SECONDARY cognitive theories:** Attention Schema Theory (Graziano) -> full self-model as attention monitor with metacognitive capabilities; Somatic Marker Hypothesis (Damasio) -> affect/valence tagging on knowledge graph entities; Default Mode Network -> session boundary consolidation processing (background batch jobs); Memory Consolidation -> observation synthesis via Hindsight-inspired reflect pattern; Metacognition -> feedback-based self-correction and threshold adjustment. **Plus TERTIARY theories:** Schema Theory (Bartlett, Piaget) -> disposition/context adaptation ("debugging schema," "architecture planning schema" with different injection strategies). Note: Affect-as-Information (Schwarz, TERTIARY, LOW confidence) maps to processing depth modulation but should not be a primary v1.4 deliverable due to unreliable affect detection from text. |
| CORTEX-05 | Enhanced Construction | New | `[CORTEX]` Observation synthesis (batch job, not persistent agent), consolidation runs, improved entity deduplication, conflict detection. Enhances Graphiti integration. |
| CORTEX-06 | Inner Voice persistence (advanced) | New | `[CORTEX]` `[RECONCILED]` Cross-session continuity via graph-backed self-model evolution. Self-model and relationship model stored as Graphiti nodes with temporal versioning. JSON cache for hot path reads. Replaces v1.3's JSON-only persistence with graph-backed state, enabling temporal queries on self-model history. |

#### Remaining Requirements

| Requirement | Name | Rationale |
|-------------|------|-----------|
| MENH-03 | Memory synthesis and export | Requires MENH-01's context typing (now via Inner Voice) to know what to synthesize; produces shareable knowledge artifacts |
| MENH-04 | Memory inference and understanding | Builds on Inner Voice intelligence; moves from storage to comprehension. `[CORTEX]` Enhanced by CORTEX-05 observation synthesis. |
| MENH-05 | Flat file support alongside Graph DB | Alternative storage backend for users who cannot run Docker/Neo4j; broadens accessibility |
| MENH-08 | Native or local text embedding model | Removes dependency on external embedding APIs; improves latency and privacy |
| MGMT-06 | Global CC preferences through memories | Requires v1.3's decision engine (now Inner Voice) to correctly scope preference storage |
| MGMT-07 | Project CC preferences through memories | Same dependency as MGMT-06 but project-scoped; natural pair |

`[CORTEX]` **Removed from v1.4:** MGMT-09 (Human cognition patterns) -- moved to v1.3 as Inner Voice component.

### v1.5 -- Dashboard, Visibility, and Agent Coordination `[CORTEX REVISED]`

**Goal:** Provide users with visual insight into what Dynamo knows and does through a modular web dashboard, while integrating Cortex agent coordination capabilities. The Claude Agent SDK enables on-demand agent spawning for deep recall operations. A basic Access Agent provides scheduled codebase ingestion beyond what session hooks capture. The connector framework establishes the pluggable interface for future data sources (Claudia-aware). `[CORTEX]`

`[RECONCILED]` **Inner Voice v1.5:** Agent-capable Inner Voice -- Claude Agent SDK integration for deep recall operations, on-demand subagent spawning for complex memory queries. See INNER-VOICE-SPEC.md Section 6.3.

**Dependencies:** v1.4 (memory quality + Inner Voice advanced + observation synthesis stable enough to display and coordinate)

#### `[CORTEX]` Ledger Cortex Requirements (new)

| Requirement | Name | Source | Rationale |
|-------------|------|--------|-----------|
| CORTEX-07 | Agent coordination | New | `[CORTEX]` Claude Agent SDK integration for on-demand agent spawning. Used for deep recall operations requiring multi-step reasoning. CLI: `dynamo agent status/spawn/stop/logs`. |
| CORTEX-08 | Access Agent (basic) | New | `[CORTEX]` Codebase indexer for background ingestion of full repo (not just files touched in sessions). Scheduled batch job, not persistent agent. |
| CORTEX-09 | Connector framework | New | `[CORTEX]` Pluggable source interface (connect/poll/fetch/getSchema). v1.5 connectors: FileSystem, Session, Graphiti. Claudia-scope connectors (iMessage, Email, etc.) added later without architectural change. |

#### Remaining UI Requirements (unchanged)

| Requirement | Name | Rationale |
|-------------|------|-----------|
| UI-01 | Global, Session, Project, Task views | Core navigation structure; must exist before specialized views |
| UI-02 | Modular and insightful dashboard | Main landing page; requires UI-01's view structure |
| UI-03 | Preload control | Visual control for preload engine (now Inner Voice); requires that engine to exist (v1.3) |
| UI-04 | Memory system config | Settings interface for memory parameters; requires stable memory system (v1.4) |
| UI-05 | Asset management and browser | Browse and manage stored knowledge artifacts; requires MENH-03's export (v1.4) |
| UI-06 | Memory CRUD operations | Direct manipulation of memories; requires mature memory system with quality controls (v1.4) |
| MGMT-04 | TweakCC integration | UI-adjacent tool for Claude Code behavior overrides; ships with dashboard for cohesive UX |

### v2.0 -- Advanced Capabilities `[CORTEX REVISED]`

**Goal:** Deliver ambitious features that require significant research, architectural decisions, and a fully mature infrastructure. Multi-agent deliberation protocol enables sophisticated inter-agent reasoning. The domain agent framework provides Claudia-aware extensibility for future domain agents (Finance, Calendar, Home, etc.). `[CORTEX]`

`[RECONCILED]` **Inner Voice v2.0:** Full cognitive architecture -- multi-agent deliberation (Inner Voice + Construction functions), active inference (full Predictive Processing implementation), cross-surface persistence (multi-session, multi-surface state for eventual Claudia integration). See INNER-VOICE-SPEC.md Section 6.3.

**Dependencies:** v1.5 (stable, visible, well-understood system with agent coordination operational)

| Requirement | Name | Source | Rationale |
|-------------|------|--------|-----------|
| CORTEX-10 | Multi-agent deliberation protocol | New | `[CORTEX]` Typed message envelopes with correlation tracking, priority-based routing, domain tagging. Enables multi-agent reasoning between Inner Voice, Construction, and Access components. |
| CORTEX-11 | Domain agent framework | New | `[CORTEX]` Claudia-aware extensibility: pluggable domain agents, domain-specific extraction templates, disposition configuration per domain. Designs the interface; domain agents themselves are Claudia-scope. |
| MENH-09 | Council-style AI agent deliberation | Absorbed by CORTEX-10 | `[CORTEX]` CORTEX-10 IS the multi-agent deliberation requirement. MENH-09 absorbed. |
| UI-07 | Memory with desktop app and mobile | Existing | Cross-platform UI; requires v1.5's web dashboard as foundation and stable API surface |

## Requirement Index

| Requirement ID | Name | Milestone | Notes |
|----------------|------|-----------|-------|
| STAB-01 | README and rebranding pass | v1.2.1 | |
| STAB-02 | Archive legacy Python/Bash system | v1.2.1 | |
| STAB-03 | Exhaustive documentation | v1.2.1 | |
| STAB-04 | Dynamo CLI integration in CLAUDE.md | v1.2.1 | |
| STAB-05 | Update/upgrade system | v1.2.1 | |
| STAB-06 | Architecture and design decision capture | v1.2.1 | |
| STAB-07 | Fix Neo4j admin browser connectivity | v1.2.1 | |
| STAB-08 | Directory structure refactor | v1.2.1 | |
| STAB-09 | Component scope refactor | v1.2.1 | |
| STAB-10 | Global on/off and dev mode toggles | v1.2.1 | |
| MENH-01 | Decision engine -- infer context type | v1.3 | `[CORTEX]` Absorbed by CORTEX-01 |
| MENH-02 | Preload engine -- auto inference and injection | v1.3 | `[CORTEX]` Absorbed by CORTEX-01 |
| MENH-03 | Memory synthesis and export | v1.4 | |
| MENH-04 | Memory inference and understanding | v1.4 | `[CORTEX]` Enhanced by CORTEX-05 |
| MENH-05 | Flat file support alongside Graph DB | v1.4 | |
| MENH-06 | Support both API and native Haiku | v1.3 | `[RECONCILED]` Prerequisite for CORTEX-01/02 dual-model selection |
| MENH-07 | Support other model choices for curation | v1.3 | `[RECONCILED]` Prerequisite for CORTEX-01/02 dual-model selection |
| MENH-08 | Native or local text embedding model | v1.4 | |
| MENH-09 | Council-style AI agent deliberation | v2.0 | `[CORTEX]` Absorbed by CORTEX-10 |
| MENH-10 | Dynamic curation depth | v1.3 | `[CORTEX]` Absorbed by CORTEX-02 |
| MENH-11 | Proactive intelligent ingestion | v1.3 | `[CORTEX]` Absorbed by CORTEX-01 |
| MGMT-01 | Self-contained dependency management | v1.3 | |
| MGMT-02 | Domain-specific on-demand modules | v1.3 | |
| MGMT-03 | CC skill inference and internal use | v1.3 | |
| MGMT-04 | TweakCC integration | v1.5 | |
| MGMT-05 | Hooks replacing CLAUDE.md for dynamic behavior | v1.3 | |
| MGMT-06 | Global CC preferences through memories | v1.4 | |
| MGMT-07 | Project CC preferences through memories | v1.4 | |
| MGMT-08 | Jailbreak/hijacking protection patterns | v1.3 | |
| MGMT-09 | Human cognition patterns as prompt engineering | v1.3 | `[CORTEX]` Moved from v1.4; absorbed by Inner Voice |
| MGMT-10 | Modular injection with better control | v1.3 | |
| MGMT-11 | Session index refactor to SQLite | v1.3 | |
| UI-01 | Global, Session, Project, Task views | v1.5 | |
| UI-02 | Modular and insightful dashboard | v1.5 | |
| UI-03 | Preload control | v1.5 | |
| UI-04 | Memory system config | v1.5 | |
| UI-05 | Asset management and browser | v1.5 | |
| UI-06 | Memory CRUD operations | v1.5 | |
| UI-07 | Memory with desktop app and mobile | v2.0 | |
| UI-08 | Inline Dynamo visibility in Claude thread | v1.3 | |
| CORTEX-01 | Inner Voice (basic) | v1.3 | `[CORTEX]` `[RECONCILED]` NEW -- smart curation, semantic shift detection, self-model; 7 PRIMARY theories mapped |
| CORTEX-02 | Dual-path routing | v1.3 | `[CORTEX]` `[RECONCILED]` NEW -- hot path + deliberation path; deterministic sublimation threshold formula |
| CORTEX-03 | Cost monitoring | v1.3 | `[CORTEX]` NEW -- budget tracking and enforcement |
| CORTEX-04 | Inner Voice (advanced) | v1.4 | `[CORTEX]` `[RECONCILED]` NEW -- narrative briefings, relationship modeling; 5 SECONDARY + 2 TERTIARY theories mapped |
| CORTEX-05 | Enhanced Construction | v1.4 | `[CORTEX]` NEW -- observation synthesis, consolidation |
| CORTEX-06 | Inner Voice persistence (advanced) | v1.4 | `[CORTEX]` `[RECONCILED]` NEW -- graph-backed self-model evolution; replaces JSON-only with Graphiti temporal versioning |
| CORTEX-07 | Agent coordination | v1.5 | `[CORTEX]` NEW -- Claude Agent SDK, on-demand spawning |
| CORTEX-08 | Access Agent (basic) | v1.5 | `[CORTEX]` NEW -- codebase indexer, background ingestion |
| CORTEX-09 | Connector framework | v1.5 | `[CORTEX]` NEW -- pluggable source interface |
| CORTEX-10 | Multi-agent deliberation protocol | v2.0 | `[CORTEX]` NEW -- typed message envelopes, coordination |
| CORTEX-11 | Domain agent framework | v2.0 | `[CORTEX]` NEW -- Claudia-aware extensibility |

## Guiding Principles

- **Build foundational capabilities first.** The intelligence layer (Inner Voice, dual-path routing) must exist before features that depend on it. v1.3 establishes the smart substrate that v1.4's quality improvements and v1.5's dashboard both require.
- **Memory quality before UI.** Displaying memories in a dashboard is only valuable if those memories are high quality. v1.4's synthesis, comprehension, and preference persistence must mature before v1.5 builds visual interfaces on top of them.
- **Security early, ambition late.** Jailbreak protection (MGMT-08) belongs in v1.3 while the hook system is fresh and well-understood. Multi-agent deliberation (CORTEX-10) belongs in v2.0 where research time and mature infrastructure are available.
- **Self-manageability is non-negotiable.** Every milestone must maintain the core value that Claude Code can install, configure, update, and troubleshoot Dynamo without manual user intervention. Dependency management (MGMT-01) in v1.3 reinforces this principle early.
- **Pair related requirements within milestones.** MENH-06 and MENH-07 (transport flexibility then model selection) are natural pairs in v1.3. MGMT-06 and MGMT-07 (global then project preferences) are natural pairs in v1.4. Pairing reduces context-switching cost and enables shared infrastructure.
- `[CORTEX]` **Prove before scaling.** The Inner Voice must demonstrably improve memory quality in v1.3 before investing in multi-agent coordination in v1.5. Each Cortex component must justify its cost and complexity through measured improvement.
- `[CORTEX]` **Agents are expensive; functions are cheap.** Default to deterministic CJS functions. Escalate to LLM agents only when reasoning genuinely adds value. The Infrastructure Agent is deterministic tooling, not an LLM agent.
- `[CORTEX]` **Dual-path is non-negotiable.** Every memory operation must route through the hot path (fast, cheap, deterministic) or deliberation path (slow, expensive, intelligent). No operation should use the deliberation path by default.
- `[CORTEX]` **Claudia-aware, not Claudia-scoped.** Design interfaces for extensibility (connector framework, message envelopes, domain templates) but only build what Dynamo needs now. Every architectural decision should support Claudia's eventual addition without building Claudia-scope functionality prematurely.

---

## `[CORTEX]` Change Log: Differences from Current MASTER-ROADMAP.md

### Requirements Moved Between Milestones

| Requirement | From | To | Reason |
|-------------|------|----|--------|
| MGMT-09 (Human cognition patterns) | v1.4 | v1.3 | `[CORTEX]` Absorbed by Inner Voice cognitive architecture |

### New CORTEX Requirements Added

| Requirement | Milestone | Description |
|-------------|-----------|-------------|
| CORTEX-01 | v1.3 | Inner Voice (basic) -- smart curation, semantic shift detection, self-model |
| CORTEX-02 | v1.3 | Dual-path routing -- hot path + deliberation path |
| CORTEX-03 | v1.3 | Cost monitoring -- budget tracking and enforcement |
| CORTEX-04 | v1.4 | Inner Voice (advanced) -- narrative briefings, relationship modeling |
| CORTEX-05 | v1.4 | Enhanced Construction -- observation synthesis, consolidation |
| CORTEX-06 | v1.4 | Inner Voice persistence (advanced) -- graph-backed self-model evolution |
| CORTEX-07 | v1.5 | Agent coordination -- Claude Agent SDK, on-demand spawning |
| CORTEX-08 | v1.5 | Access Agent (basic) -- codebase indexer, background ingestion |
| CORTEX-09 | v1.5 | Connector framework -- pluggable source interface |
| CORTEX-10 | v2.0 | Multi-agent deliberation protocol |
| CORTEX-11 | v2.0 | Domain agent framework -- Claudia-aware extensibility |

### Existing Requirements Absorbed

| Requirement | Absorbed By | Status |
|-------------|------------|--------|
| MENH-01 (Decision engine) | CORTEX-01 | Still in v1.3; implemented as Inner Voice, not separately |
| MENH-02 (Preload engine) | CORTEX-01 | Still in v1.3; implemented as Inner Voice, not separately |
| MENH-10 (Dynamic curation depth) | CORTEX-02 | Still in v1.3; implemented as dual-path routing |
| MENH-11 (Proactive ingestion) | CORTEX-01 | Still in v1.3; implemented as smart PostToolUse |
| MGMT-09 (Human cognition patterns) | CORTEX-01 | Moved from v1.4 to v1.3 |
| MENH-04 (Memory inference) | Enhanced by CORTEX-05 | Still in v1.4; enhanced, not fully absorbed |
| MENH-09 (Council-style deliberation) | CORTEX-10 | Still in v2.0; same requirement under new name |

### Theme/Goal Text Changes

| Milestone | Change |
|-----------|--------|
| v1.3 | Theme: "Intelligence and Modularity" -> "Intelligent Memory and Modularity". Goal updated to reference Inner Voice and dual-path architecture. |
| v1.4 | Theme: "Memory Quality and Preferences" -> "Memory Quality and Agent Foundation". Goal updated to reference advanced Inner Voice and observation synthesis. |
| v1.5 | Theme: "Dashboard and Visibility" -> "Dashboard, Visibility, and Agent Coordination". Goal updated to reference agent SDK integration and connector framework. |
| v2.0 | Goal updated to reference multi-agent deliberation protocol and domain agent framework. |

### Requirement Count Changes

| Milestone | Before | After | Net Change | Reason |
|-----------|--------|-------|------------|--------|
| v1.2.1 | 10 | 10 | 0 | Unchanged |
| v1.3 | 14 | 17 | +3 | +3 new CORTEX, +1 moved in (MGMT-09), -1 net from absorptions (absorbed reqs still counted, just implemented differently) |
| v1.4 | 7 | 9 | +2 | +3 new CORTEX, -1 moved out (MGMT-09) |
| v1.5 | 7 | 10 | +3 | +3 new CORTEX |
| v2.0 | 2 | 4 | +2 | +2 new CORTEX (MENH-09 absorbed, not removed from count) |

### Guiding Principles Additions

Four new principles added (marked `[CORTEX]`):
1. **Prove before scaling** -- Inner Voice must prove value before multi-agent investment
2. **Agents are expensive; functions are cheap** -- default to deterministic CJS
3. **Dual-path is non-negotiable** -- every operation routes through hot or deliberation
4. **Claudia-aware, not Claudia-scoped** -- design for extensibility, build for now

### Reconciliation with Inner Voice Spec (2026-03-18)

Source: INNER-VOICE-SPEC.md (Cognitive Architecture Specification)

| Change | Requirement(s) | What Changed |
|--------|---------------|--------------|
| Theory tiering mapped to milestones | CORTEX-01, CORTEX-04 | 7 PRIMARY theories -> v1.3, 5 SECONDARY + 2 TERTIARY -> v1.4 |
| Mechanical design findings | CORTEX-01, CORTEX-02 | Event-driven + persistent state resolution, deterministic sublimation threshold formula, latency budgets |
| Inner Voice phasing refined | CORTEX-01, CORTEX-04, CORTEX-06 | Specific artifacts per milestone, explicit NOT-in-v1.3 list, v1.3 basic vs v1.4 advanced distinctions |
| Graphiti dual-model | MENH-06, MENH-07 | Explicit Sonnet/Haiku per-path model selection as prerequisite for CORTEX dual-path |

All changes marked with [RECONCILED] tag for traceability.

---
*DRAFT -- Proposed revision created: 2026-03-18*
*Based on Ledger Cortex research and adversarial analysis*
*Reconciled with Inner Voice Cognitive Architecture Specification: 2026-03-18*
*Pending user review and approval before replacing MASTER-ROADMAP.md*
*Source: .planning/REQUIREMENTS.md + .planning/research/LEDGER-CORTEX-ANALYSIS.md + .planning/research/INNER-VOICE-SPEC.md*

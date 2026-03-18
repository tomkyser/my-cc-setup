# Dynamo Master Roadmap

**Last updated:** 2026-03-18

This document covers the Dynamo project roadmap from v1.3 through v2.0. Milestones v1.0 (Research and Ranked Report), v1.1 (Fix Memory System), and v1.2 (Dynamo Foundation) are complete. The 26 deferred requirements from REQUIREMENTS.md are prioritized and assigned to four future milestones based on dependency analysis and the project's core value: every capability must be self-manageable by Claude Code without manual user config file edits.

> **How to Use This Document:** This is a living document that Claude Code should read to understand what comes after v1.2 and in what order. When planning future work, consult the milestone assignments and dependency notes to determine what to build next. Requirement IDs (MENH-XX, MGMT-XX, UI-XX) correspond to entries in `.planning/REQUIREMENTS.md`.

## Milestone Overview

| Milestone | Theme | Requirements | Description |
|-----------|-------|:------------:|-------------|
| v1.3 | Intelligence and Modularity | 10 | Make the memory system smarter and the management system modular |
| v1.4 | Memory Quality and Preferences | 7 | Make stored memories higher quality and let user preferences persist intelligently |
| v1.5 | Dashboard and Visibility | 7 | Give users visual insight into what Dynamo knows and does |
| v2.0 | Advanced Capabilities | 2 | Ambitious features requiring significant research and architectural decisions |

## Completed Milestones

<details>
<summary>v1.0 through v1.2 (completed)</summary>

- **v1.0 Research and Ranked Report** (Phases 1-3) -- Completed 2026-03-17. Vetted and ranked tools for the Claude Code ecosystem using a 4-gate methodology.
- **v1.1 Fix Memory System** (Phases 4-7) -- Completed 2026-03-17. Diagnosed root causes of silent hook failures, fixed memory persistence, added session management and auto-naming.
- **v1.2 Dynamo Foundation** (Phases 8-11) -- Completed 2026-03-18. Rewrote the Python/Bash foundation to Node/CJS architecture with full feature parity. Established Dynamo/Ledger/Switchboard branding and project structure.

</details>

## Milestone Details

### v1.3 -- Intelligence and Modularity

**Goal:** Make the memory system smarter by adding context-aware decision-making and proactive injection, while making the management system modular with self-contained dependency management and on-demand skill loading. This milestone leverages the CJS substrate from v1.2 to build the intelligence and modularity layers that all subsequent milestones depend on.

**Dependencies:** v1.2 (CJS substrate operational, hook system deployed, modular injection pattern established)

| Requirement | Name | Rationale |
|-------------|------|-----------|
| MENH-01 | Decision engine -- infer context type | Foundational for all memory quality improvements; the CJS substrate from v1.2 provides the hook points needed |
| MENH-02 | Preload engine -- auto inference and injection | Builds directly on MENH-01's context type inference; together they make memory useful proactively |
| MENH-06 | Support both API and native Haiku | Removes OpenRouter single-point-of-failure for curation; straightforward transport layer change on CJS |
| MENH-07 | Support other model choices for curation | Natural extension of MENH-06; once transport is flexible, model selection follows |
| MGMT-01 | Self-contained dependency management | Core self-manageability requirement; Dynamo should manage its own dependencies (GSD, Graphiti, etc.) |
| MGMT-02 | Domain-specific on-demand modules | Enables skill loading (WPCS, Context7, Playwright); requires modular injection pattern from v1.2 |
| MGMT-03 | CC skill inference and internal use | Makes Claude Code aware of available skills; builds on MGMT-02's module system |
| MGMT-05 | Hooks replacing CLAUDE.md for dynamic behavior | Architectural evolution -- hooks already exist from v1.2, this makes them the primary behavior mechanism |
| MGMT-08 | Jailbreak/hijacking protection patterns | Security hardening of the hook system; should happen early while the system is well-understood |
| MGMT-10 | Modular injection with better control | Refined injection control building on v1.2's CJS foundation; enables precise capability management |

### v1.4 -- Memory Quality and Preferences

**Goal:** Elevate the quality of stored memories through synthesis, comprehension, and alternative storage backends, while enabling intelligent persistence of user preferences at both global and project scopes. This milestone builds on v1.3's intelligence layer to move from raw storage to meaningful knowledge management.

**Dependencies:** v1.3 (intelligence layer and modular injection operational)

| Requirement | Name | Rationale |
|-------------|------|-----------|
| MENH-03 | Memory synthesis and export | Requires MENH-01's context typing to know what to synthesize; produces shareable knowledge artifacts |
| MENH-04 | Memory inference and understanding | Builds on MENH-01/02 intelligence; moves from storage to comprehension |
| MENH-05 | Flat file support alongside Graph DB | Alternative storage backend for users who cannot run Docker/Neo4j; broadens accessibility |
| MENH-08 | Native or local text embedding model | Removes dependency on external embedding APIs; improves latency and privacy |
| MGMT-06 | Global CC preferences through memories | Requires v1.3's decision engine to correctly scope preference storage |
| MGMT-07 | Project CC preferences through memories | Same dependency as MGMT-06 but project-scoped; natural pair |
| MGMT-09 | Human cognition patterns as prompt engineering | Requires mature memory system to store and apply cognitive patterns effectively |

### v1.5 -- Dashboard and Visibility

**Goal:** Provide users with visual insight into what Dynamo knows and does through a modular web dashboard with views for browsing memories, controlling preload behavior, managing assets, and performing direct CRUD operations on stored knowledge. The dashboard requires stable, high-quality data from v1.4 to display meaningfully.

**Dependencies:** v1.4 (memory quality and preferences stable enough to display)

| Requirement | Name | Rationale |
|-------------|------|-----------|
| UI-01 | Global, Session, Project, Task views | Core navigation structure; must exist before specialized views |
| UI-02 | Modular and insightful dashboard | Main landing page; requires UI-01's view structure |
| UI-03 | Preload control | Visual control for MENH-02's preload engine; requires that engine to exist (v1.3) |
| UI-04 | Memory system config | Settings interface for memory parameters; requires stable memory system (v1.4) |
| UI-05 | Asset management and browser | Browse and manage stored knowledge artifacts; requires MENH-03's export (v1.4) |
| UI-06 | Memory CRUD operations | Direct manipulation of memories; requires mature memory system with quality controls (v1.4) |
| MGMT-04 | TweakCC integration | UI-adjacent tool for Claude Code behavior overrides; ships with dashboard for cohesive UX |

### v2.0 -- Advanced Capabilities

**Goal:** Deliver ambitious features that require significant research, architectural decisions, and a fully mature infrastructure. These capabilities push Dynamo beyond a single-session tool into a multi-agent, multi-platform knowledge system.

**Dependencies:** v1.5 (stable, visible, well-understood system)

| Requirement | Name | Rationale |
|-------------|------|-----------|
| MENH-09 | Council-style AI agent deliberation | Multi-agent reasoning; needs research, mature infrastructure, and proven memory quality from v1.4 |
| UI-07 | Memory with desktop app and mobile | Cross-platform UI; requires v1.5's web dashboard as foundation and stable API surface |

## Requirement Index

| Requirement ID | Name | Milestone |
|----------------|------|-----------|
| MENH-01 | Decision engine -- infer context type | v1.3 |
| MENH-02 | Preload engine -- auto inference and injection | v1.3 |
| MENH-03 | Memory synthesis and export | v1.4 |
| MENH-04 | Memory inference and understanding | v1.4 |
| MENH-05 | Flat file support alongside Graph DB | v1.4 |
| MENH-06 | Support both API and native Haiku | v1.3 |
| MENH-07 | Support other model choices for curation | v1.3 |
| MENH-08 | Native or local text embedding model | v1.4 |
| MENH-09 | Council-style AI agent deliberation | v2.0 |
| MGMT-01 | Self-contained dependency management | v1.3 |
| MGMT-02 | Domain-specific on-demand modules | v1.3 |
| MGMT-03 | CC skill inference and internal use | v1.3 |
| MGMT-04 | TweakCC integration | v1.5 |
| MGMT-05 | Hooks replacing CLAUDE.md for dynamic behavior | v1.3 |
| MGMT-06 | Global CC preferences through memories | v1.4 |
| MGMT-07 | Project CC preferences through memories | v1.4 |
| MGMT-08 | Jailbreak/hijacking protection patterns | v1.3 |
| MGMT-09 | Human cognition patterns as prompt engineering | v1.4 |
| MGMT-10 | Modular injection with better control | v1.3 |
| UI-01 | Global, Session, Project, Task views | v1.5 |
| UI-02 | Modular and insightful dashboard | v1.5 |
| UI-03 | Preload control | v1.5 |
| UI-04 | Memory system config | v1.5 |
| UI-05 | Asset management and browser | v1.5 |
| UI-06 | Memory CRUD operations | v1.5 |
| UI-07 | Memory with desktop app and mobile | v2.0 |

## Guiding Principles

- **Build foundational capabilities first.** The intelligence layer (decision engine, preload engine) must exist before features that depend on it. v1.3 establishes the smart substrate that v1.4's quality improvements and v1.5's dashboard both require.
- **Memory quality before UI.** Displaying memories in a dashboard is only valuable if those memories are high quality. v1.4's synthesis, comprehension, and preference persistence must mature before v1.5 builds visual interfaces on top of them.
- **Security early, ambition late.** Jailbreak protection (MGMT-08) belongs in v1.3 while the hook system is fresh and well-understood. Council-style deliberation (MENH-09) belongs in v2.0 where research time and mature infrastructure are available.
- **Self-manageability is non-negotiable.** Every milestone must maintain the core value that Claude Code can install, configure, update, and troubleshoot Dynamo without manual user intervention. Dependency management (MGMT-01) in v1.3 reinforces this principle early.
- **Pair related requirements within milestones.** MENH-06 and MENH-07 (transport flexibility then model selection) are natural pairs in v1.3. MGMT-06 and MGMT-07 (global then project preferences) are natural pairs in v1.4. Pairing reduces context-switching cost and enables shared infrastructure.

---
*Master Roadmap created: 2026-03-18*
*Source: .planning/REQUIREMENTS.md (Future Requirements section)*

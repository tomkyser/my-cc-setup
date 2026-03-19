# Task: PROJECT UPDATE

## Subject: Housekeeping, Clarification, and Inner Voice & Dynamo Architecture
Description:
Continued Research & SPEC DOCS & PRD Generation. Dynamo scope explained: current version built on top of claude code as a platform, future platforms and platform types planned. Underlying platform will support various implementation forms, such as claude code integration (current) with planned web and mcp implementations (still through the claude code platform version).

## Reference Files:
Latest Clarifications & Source of Truth: .planning/research/INNER-VOICE-SYNTHESIS-RESEARCH.md
Provenance in order of newest to oldest: 
.planning/research/INNER-VOICE-SYNTHESIS-v2.md
.planning/research/INNER-VOICE-SPEC.md
MASTER-ROADMAP.md
.planning/research/MASTER-ROADMAP-DRAFT-v1.3-cortex.md
.planning/research/LEDGER-CORTEX-ANALYSIS.md
.planning/research/LEDGER-CORTEX-BRIEF.md
README.md


## Objectives:

* Abstract Doc for the concept of Inner Voice and theoretical implementation agnostic of any platform or provider (no dynamo, no claude code or graphiti etc etc.).
* Unified Spec Doc for Reverie (Inner Voice) as a subsystem based on abstract applied to PRD of Dynamo.
  * One more round of research (including adversarial steel man).
  * New requriments: 
    * Exclusively using claude code features such as agents/sub-agents through hooks, skills, or whatever is necessary — reference GSD for inspiration [https://github.com/gsd-build/get-shit-done]
    * API based LLM are required to be limited only to underlying infrastructure minimally, the goal is to keep additional API dependance to an absolute minimum and use Claude Code (Max subscription) as the platform.
* Create Updated PRD Doc for Dynamo (claude code version)
* Create Spec Docs (claude code version):
- Dynamo as the overall system wrapper (Interface, utilities, api, MCP Server, skills, and shared resources)
- Subsystems:
    - Switchboard: Dispatcher, hooks, internal I/O, events
    - Ledger: Data Construction Layer
    - Assay: Data Access Layer
    - Terminus: Data Infrastructure Layer 
    - Reverie: Inner Voice 
* Update GSD project planning files to reflect updates.
* Refactor Master Roadmap:
  * Everything is folded into 1.3, we will not plan further than 1.3
  * Milestones within 1.3 represent iterations toward 1.3
  * Deferred Milestones listed at end of doc with no assigned targeted version.

Conceptual Tree:
dynamo/claude-code/ [BASE PLATFORM]
—> lib/ (core)
—> shared/ (exposed resources for subsystems)
—> health/
—> migrations/
—> cc/ (claude code specific integration) [future: /web, /api, mcp/…]
—>—> hooks/
—>—> agents/
—>—> skills/
—>—> rules/
—>—> prompts/
—>—> CLAUDE-TEMPLATE.MD
—>—> settings-hooks.json
—>—> dynamo-cc.cjs
—> subsystems/
—>—> switchboard/
—>—> assay/
—>—> ledger/
—>—> terminus/
—>—> reverie/
—> dynamo.cjs
—> config.json
—> VERSION

# Milestones

## v1.3-M2 Core Intelligence (Shipped: 2026-03-21)

**Delivered:** Intelligent memory system with Inner Voice cognitive pipeline, dual-path routing (hot <500ms + deliberation subagent), and full cutover from classic Ledger curation to Reverie-only architecture.

**Phases completed:** 23-25 (3 phases, 11 plans, 21 tasks)
**Commits:** 58 | **Files changed:** 97 | **Lines:** +14,895 / -881
**Production LOC:** ~7,081 CJS | **Tests:** 525+ passing
**Timeline:** 2026-03-20 to 2026-03-21
**Requirements:** 28/28 (CORTEX-01/02/03, MGMT-05, MGMT-10 categories; 3 cost reqs deferred with rationale)
**Git range:** docs(23: capture phase context) → docs(phase-25: evolve PROJECT.md)

**Key accomplishments:**

- Built Reverie cognitive pipeline: activation engine (entity extraction, spreading activation, sublimation scoring), dual-path routing (deterministic hot path + Sonnet deliberation subagent), template-based curation with adversarial counter-prompting
- Created central pipeline orchestrator (`inner-voice.cjs`) wiring 5 per-hook cognitive pipelines with 400ms abort, atomic state bridge (correlation ID + 60s TTL), and self-model persistence
- Replaced all 7 classic Ledger handler stubs with full Reverie cognitive pipeline delegation
- Removed classic curation entirely: eliminated `reverie.mode` config, OpenRouter dependency, 12 dead files, and Ledger hook code
- Added `dynamo voice status/explain/reset` CLI commands for Inner Voice visibility
- Created bare CLI shim, CHANGELOG.md integrated into update commands, and install pipeline with active classic artifact cleanup

**What's next:** v1.3-M3 Management and Visibility (MGMT-02/03, UI-08)

---

## v1.3-M1 Foundation and Infrastructure Refactor (Shipped: 2026-03-20)

**Phases completed:** 5 phases, 13 plans, 28 tasks
**Commits:** ~75 | **Files changed:** 74 | **Lines:** +3,037 / -1,021
**Production LOC:** ~5,335 CJS | **Tests:** 515 passing
**Timeline:** 2026-03-19 to 2026-03-20
**Requirements:** 14/14 (ARCH-01 through ARCH-07, MGMT-01, MGMT-08a/b, DATA-01 through DATA-04)
**Git range:** feat(18-01) → docs(v1.3-M1)

**Key accomplishments:**

- Centralized path resolver (`lib/resolve.cjs`) with logical name API for 8 subsystems and DFS-based circular dependency detector (`lib/dep-graph.cjs`)
- Six-subsystem directory restructure: 27 production files migrated via `git mv` from 3-dir to `subsystems/`, `cc/`, `lib/` layout with unified `lib/layout.cjs`
- Management hardening: Node.js version verification in health-check and install, input validation with field length limits, `<dynamo-memory-context>` boundary markers against prompt injection
- SQLite session storage via `node:sqlite` DatabaseSync with dual-write pattern, JSON fallback, and one-time migration (314 sessions migrated)
- End-to-end verification: 14/14 requirements validated, real fresh install (45 files deployed), 515 tests, core.cjs re-export audit (7 removed)

---

## v1.2.1 Stabilization and Polish (Shipped: 2026-03-19)

**Phases completed:** 6 phases, 17 plans
**Commits:** 104 | **Files changed:** 154 | **Lines:** +21,516 / -4,935
**Production LOC:** 9,253 CJS | **Tests:** 374 passing
**Timeline:** 2026-03-18 to 2026-03-19
**Requirements:** 10/10 STAB requirements complete

**Key accomplishments:**

- Restructured into 3 root-level component directories (`dynamo/`, `ledger/`, `switchboard/`) with import boundary enforcement
- Built global on/off toggle with complete blackout — CLI gate, hook gate, MCP deregistration, no bypass paths
- Replaced Graphiti MCP with 8 CLI memory commands, enabling toggle-gated memory access through Dynamo CLI
- Archived and removed legacy Python/Bash system (tagged `v1.2-legacy-archive`), fixed Neo4j admin browser port
- Comprehensive documentation: README (537 lines, Mermaid diagram), CLAUDE.md template (20+ commands), 19 architecture decision records, 7 codebase maps
- Self-updating system: GitHub Releases API version checks, dual-mode update (git pull/tarball), migration harness with version-keyed scripts, pre-update snapshot with automatic rollback
- Deploy pipeline hardened: dual-layout path resolution for hooks and CLI, defensive MCP deregistration, CLAUDE.md template deployment, stale directory cleanup

---

## v1.2 Dynamo Foundation (Shipped: 2026-03-18)

**Phases completed:** 4 phases, 12 plans
**Commits:** 29 feat/test | **Production LOC:** 3,585 CJS | **Test LOC:** 3,382 CJS
**Timeline:** 2026-03-17 to 2026-03-18

**Key accomplishments:**

- Rewrote entire Python/Bash foundation to Node/CJS architecture with 272 passing tests
- Built CJS shared substrate (core.cjs) with config loading, MCP client, scope validation, health guard
- Migrated all 5 hook handlers to CJS dispatcher with full behavioral parity to Python/Bash system
- Created unified CLI router (dynamo.cjs) dispatching 12 commands across Ledger and Switchboard
- Built installer with settings.json merge, Python retirement to graphiti-legacy/, and rollback capability
- Produced Master Roadmap assigning 26 deferred requirements to v1.3-v2.0 milestones

---

## v1.1 Fix Memory System (Shipped: 2026-03-17)

**Phases completed:** 4 phases, 8 plans
**Commits:** 34 | **Files changed:** 44 | **Lines:** +7,579
**Timeline:** 2026-03-16 to 2026-03-17

**Key accomplishments:**

- Diagnosed root causes: server-level GRAPHITI_GROUP_ID override forcing all writes to global scope; API v1.21.0 echoing requested group_id but storing differently
- Fixed hook reliability: rewrote all 3 write hooks with foreground execution, error propagation, file logging, and 5s timeout
- Built session management: 6 new subcommands (list, view, label, backfill, index, generate-name) with two-phase auto-naming via Haiku
- Created verification tools: verify-memory quick pass/fail (6 checks), diagnose.py extended to 13 stages, health-check.py for pipeline monitoring
- Published and synced: sync-graphiti.sh for bidirectional sync, updated installer, README for GitHub visitors

---

## v1.0 Research and Ranked Report (Shipped: 2026-03-17)

**Phases completed:** 3 phases, 8 plans
**Timeline:** 2026-03-16 to 2026-03-17

**Key accomplishments:**

- Established vetting protocol with 4 binary hard gates and anti-features list
- Assessed 5 named MCP/tool candidates plus creative and technical writing tools
- Documented GSD framework lifecycle and global scope coexistence strategy
- Researched memory browsing, session visibility, and identified Graphiti hook gaps
- Produced ranked report with 5 primary + 2 conditional tool recommendations

---

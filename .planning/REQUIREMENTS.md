# Requirements: Dynamo

**Defined:** 2026-03-17
**Core Value:** Every capability must be self-manageable by Claude Code without manual user config file edits

## v1.2 Requirements

Requirements for the CJS architectural rewrite with complete feature parity.

### Foundation

- [ ] **FND-01**: CJS shared substrate (core.cjs) with config loading, .env parsing, project detection, output formatting
- [ ] **FND-02**: MCP client with SSE parsing for Graphiti JSON-RPC communication
- [ ] **FND-03**: Scope constants and validation function rejecting invalid characters (colon constraint)
- [ ] **FND-04**: Error logging with 1MB rotation, ISO timestamps, hook name prefix
- [ ] **FND-05**: Health guard (once-per-session flag using process.ppid)
- [ ] **FND-06**: Shared HTTP utility with explicit timeouts (fetchWithTimeout)
- [ ] **FND-07**: Regression test suite covering all 12 v1.1 fixes

### Ledger

- [ ] **LDG-01**: Single hook dispatcher (dynamo-hooks.cjs) routing all 5 hook events
- [ ] **LDG-02**: SessionStart hook ported to CJS with full parity
- [ ] **LDG-03**: UserPromptSubmit hook ported to CJS with full parity
- [ ] **LDG-04**: PostToolUse (capture-change) hook ported to CJS with full parity
- [ ] **LDG-05**: PreCompact (preserve-knowledge) hook ported to CJS with full parity
- [ ] **LDG-06**: Stop (session-summary) hook ported to CJS with full parity
- [ ] **LDG-07**: Haiku curation pipeline via OpenRouter with graceful degradation
- [ ] **LDG-08**: Session management: list, view, label, backfill, index commands
- [ ] **LDG-09**: Two-phase session auto-naming via Haiku
- [ ] **LDG-10**: sessions.json format compatibility (read existing, write compatible)

### Switchboard

- [ ] **SWB-01**: Health check (6 stages: Docker, Neo4j, API, MCP session, env vars, canary)
- [ ] **SWB-02**: Verify-memory end-to-end pipeline test (6 checks including scope round-trip)
- [ ] **SWB-03**: Deep diagnostics ported from diagnose.py (13 stages)
- [ ] **SWB-04**: CJS installer deploying to ~/.claude/dynamo/, eliminating Python venv
- [ ] **SWB-05**: Settings generator for hook registrations pointing to .cjs files
- [ ] **SWB-06**: Unified `dynamo <command>` CLI router
- [ ] **SWB-07**: Bidirectional sync rewrite (sync-graphiti.sh → CJS)
- [ ] **SWB-08**: Stack start/stop commands (Docker compose wrappers)

### Branding

- [ ] **BRD-01**: Project renamed to Dynamo with Ledger/Switchboard subsystem identity
- [ ] **BRD-02**: Directory restructured to ~/.claude/dynamo/ with lib/ledger/ and lib/switchboard/

### Master Roadmap

- [ ] **MRP-01**: Backlog items prioritized and assigned to v1.3–v2.0 milestones
- [ ] **MRP-02**: Master Roadmap document created in project root

## Future Requirements

Deferred to v1.3+. Tracked but not in current roadmap.

### Memory Enhancement
- **MENH-01**: Decision engine — infer global, project, and session level context type
- **MENH-02**: Preload engine — auto inference and injection after user prompt
- **MENH-03**: Memory synthesis and export
- **MENH-04**: Memory inference and understanding
- **MENH-05**: Flat file support in addition to Graph DB
- **MENH-06**: Support both API and native Claude Code Haiku (proxy/workaround)
- **MENH-07**: Support other model choices for curation
- **MENH-08**: Support native or local text embedding model
- **MENH-09**: Council-style AI agent deliberation

### Management Enhancement
- **MGMT-01**: Self-contained dependency management (Codeman, GSD, Memory System)
- **MGMT-02**: Domain-specific on-demand modules/skills/agents (WPCS, Context7, Playwright, Creative Writing)
- **MGMT-03**: CC skill inference and internal use
- **MGMT-04**: TweakCC integration for Claude Code overrides
- **MGMT-05**: Hooks replacing CLAUDE.md for dynamic behavior management
- **MGMT-06**: Global CC preferences through memories
- **MGMT-07**: Project CC preferences through memories
- **MGMT-08**: Jailbreak/hijacking protection patterns
- **MGMT-09**: Human cognition patterns applied as prompt engineering
- **MGMT-10**: Modular injection with better control through CJS

### UI
- **UI-01**: Global, Session, Project, Task views
- **UI-02**: Modular and insightful dashboard
- **UI-03**: Preload control
- **UI-04**: Memory system config
- **UI-05**: Asset management and browser
- **UI-06**: Memory CRUD operations
- **UI-07**: Memory with desktop app and mobile

## Out of Scope

| Feature | Reason |
|---------|--------|
| New memory features in v1.2 | Foundation first — parity before enhancement |
| UI/dashboard in v1.2 | Requires stable CJS substrate; deferred to v1.4+ |
| Domain skills in v1.2 | Requires modular injection pattern to mature; deferred to v1.3+ |
| ESM modules | CJS is the standard in this ecosystem (GSD, existing hooks, package.json) |
| npm dependencies beyond js-yaml | Node.js built-ins cover all needs; zero bloat philosophy |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | — | Pending |
| FND-02 | — | Pending |
| FND-03 | — | Pending |
| FND-04 | — | Pending |
| FND-05 | — | Pending |
| FND-06 | — | Pending |
| FND-07 | — | Pending |
| LDG-01 | — | Pending |
| LDG-02 | — | Pending |
| LDG-03 | — | Pending |
| LDG-04 | — | Pending |
| LDG-05 | — | Pending |
| LDG-06 | — | Pending |
| LDG-07 | — | Pending |
| LDG-08 | — | Pending |
| LDG-09 | — | Pending |
| LDG-10 | — | Pending |
| SWB-01 | — | Pending |
| SWB-02 | — | Pending |
| SWB-03 | — | Pending |
| SWB-04 | — | Pending |
| SWB-05 | — | Pending |
| SWB-06 | — | Pending |
| SWB-07 | — | Pending |
| SWB-08 | — | Pending |
| BRD-01 | — | Pending |
| BRD-02 | — | Pending |
| MRP-01 | — | Pending |
| MRP-02 | — | Pending |

**Coverage:**
- v1.2 requirements: 29 total
- Mapped to phases: 0
- Unmapped: 29 ⚠️

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-17 after initial definition*

# Project Research Summary

**Project:** Dynamo v1.2 — CJS Architectural Rewrite
**Domain:** Claude Code enhancement platform (memory system + management layer)
**Researched:** 2026-03-17
**Confidence:** HIGH

## Executive Summary

Dynamo is a Claude Code memory and lifecycle management platform currently implemented in Python (~1,500 LOC) and Bash (~350 LOC). The v1.2 milestone is a full rewrite into CommonJS Node.js — not an enhancement, but a runtime migration that eliminates the Python venv dependency while preserving exact feature parity. The architecture is well-understood because the target runtime (Node.js 24.x) is already installed, the pattern to follow (GSD's CJS framework) is already proven in the same environment, and the codebase being replaced has been fully audited. This is an unusually high-confidence rewrite: 14 production `.cjs` files in GSD demonstrate exactly how to structure the code, and every feature in the Python/Bash system has been inventoried, classified, and mapped to a CJS target module.

The recommended approach follows three fixed constraints: CJS only (not ESM), zero npm dependencies beyond `js-yaml`, and exact behavioral parity with the Python/Bash system before adding any new capabilities. The two-system architecture — Ledger (what Claude knows) and Switchboard (how Claude behaves) — cleanly separates concerns and maps directly to existing module boundaries. The single hook dispatcher pattern (`dynamo-hooks.cjs`) collapses the current 3-layer chain (Bash script → Python → httpx) to a single Node.js process, eliminating an estimated 300-500ms of startup overhead per hook invocation while also eliminating the Python venv (~500MB) entirely.

The primary risk is regression: the v1.1 cycle produced 12 hard-won fixes — scope separator format, GRAPHITI_GROUP_ID override, silent fire-and-forget failures, infinite loop guard, and others — that must be codified as automated regression tests in the CJS version before any hook code is considered complete. Three of these regressions are "invisible": the system appears to work but silently stores data in the wrong scope or drops it entirely. The mitigation is equally clear: build the shared infrastructure modules (config loading, scope constants, HTTP utilities, stdin reader) in Phase 1 before writing any hook code, and attach regression tests to each critical behavior before that phase closes.

---

## Key Findings

### Recommended Stack

The stack decision is settled: Node.js 24.x with CJS (`.cjs` files, `require()`, `module.exports`), one external dependency (`js-yaml ^4.1.1`), and built-in Node.js modules for everything else. This follows GSD's proven pattern — the same environment has 14 production CJS files with zero npm dependencies running successfully today. The `~/.claude/package.json` is already set to `"type": "commonjs"`, and three existing JS hooks already use `require()` and `module.exports`.

**Core technologies:**
- **Node.js v24.x (LTS, installed):** Built-in `fetch`, `node:test`, `node:assert`, `crypto.randomUUID()` eliminate all HTTP, testing, and UUID dependencies
- **CJS (`require`/`module.exports`):** Native to GSD framework; synchronous require is critical for hook execution paths with 5-15s timeouts; ~20ms faster cold start than ESM
- **`js-yaml ^4.1.1`:** The single external dependency — needed to parse `curation/prompts.yaml`; de facto standard (24,681 dependents), pure CJS, no native bindings
- **`globalThis.fetch` (built-in):** Replaces Python `httpx` for all HTTP to Graphiti MCP and OpenRouter; requires explicit `AbortSignal.timeout()` (no default timeout)
- **`node:test` + `node:assert` (built-in):** Zero-dependency test runner; stable and production-ready in Node 24; covers all Dynamo test needs

What is NOT being installed: Express, axios, commander, TypeScript, dotenv, chalk, uuid, Jest — all replaced by Node.js built-ins or GSD patterns from the existing codebase.

### Expected Features

The feature set is entirely defined by the existing Python/Bash system. Every capability has been inventoried from a full source code audit. Features are classified as Ledger (memory) or Switchboard (management).

**Must have — Ledger (table stakes, these ARE the product):**
- MCP Client (JSON-RPC + SSE over HTTP to Graphiti) — foundation for all memory operations; handles session init handshake and SSE response parsing
- 5 hook scripts (capture-change, session-summary, preserve-knowledge, session-start, prompt-augment) — the actual product; hooks not ported = regression, not rewrite
- Haiku curation pipeline (OpenRouter) — prevents context bloat; raw Graphiti results are noisy without curation
- Project detection + scope resolution — ensures memories land in the right project scope; uses dash separator (`project-{name}`)
- Session management (list, view, label, backfill, index) — user-facing session navigation against sessions.json flat file

**Must have — Switchboard (table stakes, operations):**
- Health check (6 stages: Docker, Neo4j, API, MCP session, env vars, canary round-trip)
- Verify memory (end-to-end pipeline test: write to project scope, read back, confirm group_id is not 'global')
- Installer rewritten for CJS (eliminates Python venv setup entirely)
- Settings generator (hook registrations pointing to `.cjs` files)
- Error logging + rotation (1MB threshold, ISO timestamps, hook-errors.log)
- Once-per-session health guard (prevents repeated warnings using `process.ppid`)

**Should have (differentiators enabled by CJS architecture):**
- Single entry point CLI (`node dynamo.cjs <command>`) replacing 6 separate scripts + 2 Python files
- Modular injection pattern — hooks as thin wrappers, business logic in `lib/`, shared by CLI and hooks
- Testability via `node --test` — Bash/Python had zero automated tests

**Defer to v1.2.x patch:**
- Deep diagnostics (13-stage `diagnose.py` — 588 lines, HIGH complexity; the 6-stage health check covers 90% of diagnostic needs)
- Sync CJS rewrite (`sync-graphiti.sh` still works; no urgency to replace 177-line Bash script)
- Stack start/stop CJS wrappers (20-line Bash wrappers around `docker compose`; functional, no urgency)

**Defer to v1.3+:**
- Decision engine, preload engine, memory quality scoring, UI/dashboard, hook auto-discovery

### Architecture Approach

The architecture is a two-system modular CJS tree under `~/.claude/dynamo/`, following the GSD `gsd-tools.cjs` pattern exactly. A single hook dispatcher (`hooks/dynamo-hooks.cjs`) is registered once for all Claude Code hook events and routes internally by `hook_event_name`. The Ledger system (`lib/ledger/`) owns all knowledge graph interaction; the Switchboard system (`lib/switchboard/`) owns all infrastructure management; `lib/core.cjs` provides the shared substrate (config, project detection, health check, output formatting) that both systems need but neither owns. The two systems never import from each other — only from `core.cjs` and their own public `index.cjs`.

**Major components:**
1. **`hooks/dynamo-hooks.cjs`** — Single Claude Code hook entry point; routes all 5 hook events to Ledger handlers via switch/case; wraps all execution in try/catch (never blocks Claude Code)
2. **`lib/core.cjs`** — Shared substrate: config loading, .env parsing, project detection, health check caching, output/error formatting, safeReadFile
3. **`lib/ledger/`** — Memory system: MCP client (with SSE parsing), search, episodes, curation, sessions (index + naming + summary); exposes public API via `index.cjs`
4. **`lib/switchboard/`** — Management system: health check, verify, hooks registration, installer, Docker stack; exposes public API via `index.cjs`
5. **`bin/dynamo.cjs`** — CLI router: maps `dynamo <command>` to Ledger/Switchboard functions; mirrors `gsd-tools.cjs` pattern exactly

The build order is dependency-driven: `core.cjs` first (no dependencies), then `lib/ledger/mcp-client.cjs`, then remaining ledger modules (can be built in parallel), then `lib/ledger/index.cjs` (hook handlers composing individual modules), then `hooks/dynamo-hooks.cjs`, then switchboard modules (depend only on core), then `bin/dynamo.cjs` last.

### Critical Pitfalls

Research identified 10 pitfalls. Five address regression risks (bugs already fixed in v1.1 that must not be reintroduced); five address new migration risks inherent in moving from Python to Node.js.

**Top regression risks (invisible failures, already burned once):**

1. **GRAPHITI_GROUP_ID override (DIAG-02)** — If `GRAPHITI_GROUP_ID=global` appears anywhere in `docker-compose.yml` or `.env`, all project-scoped writes silently land in global scope. The server acknowledges the write with the correct scope name, making the regression invisible at write time. Prevention: assert the variable is absent from all config files in Phase 1; add a regression test that writes to project scope and verifies the stored `group_id` is not `'global'`.

2. **Colon-in-group-id rejection** — Graphiti MCP v1.21.0 rejects any `group_id` with characters outside `[a-zA-Z0-9_-]`. Scope must use dash: `project-{name}`, never `project:{name}`. Prevention: define scope format as locked constants in `lib/ledger/scope.cjs` with a validation function that rejects colons at the module boundary.

3. **Silent fire-and-forget regression** — JavaScript's async model makes bare `.catch(() => {})` the path of least resistance, recreating the `2>/dev/null &` pattern that caused silent data loss in v1.0. Prevention: every HTTP call to Graphiti must either throw on failure (caught by a logging handler) or return a result the caller checks; bare catch blocks that do not call the error logger are forbidden.

**Top new migration risks:**

4. **Node.js `fetch` has no default timeout** — Python `httpx` defaulted to 5-second timeouts. Native Node.js `fetch` hangs indefinitely without an explicit `AbortSignal.timeout()`. A hook that hangs blocks Claude Code until the configured hook timeout kills the process. Prevention: build a shared `fetchWithTimeout()` utility in Phase 1 that wraps all HTTP calls with explicit per-operation timeouts (health: 3s, MCP: 5s, curation: 10s, summarization: 15s).

5. **SessionEnd/Stop global timeout cap** — Claude Code imposes a 1.5-second global cap on SessionEnd hooks by default. The session summary hook requires 2-5 seconds (Haiku summarization + Graphiti write + session naming). Prevention: set `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS=10000` in the install script; verify empirically with timing probes during Phase 2.

---

## Implications for Roadmap

The dependency graph and pitfall phase-mappings from PITFALLS.md point to a clear 4-phase structure. The ordering is dictated by two constraints: (1) shared infrastructure must exist before any hook can be safely written, and (2) regression tests for the three invisible failure modes must be automated before any Graphiti interaction code is declared complete.

### Phase 1: Foundation and Shared Substrate

**Rationale:** Eight of the 10 pitfalls are best addressed here — not because Phase 1 is a catch-all, but because these pitfalls are infrastructure-level bugs that corrupt data silently if not eliminated at the module boundary. Building these modules first means all subsequent phases build on correct ground. No hook code should be written until the shared substrate has passing regression tests.

**Delivers:**
- `lib/core.cjs` — config loading, .env parsing, project detection, output/error formatting, health check caching
- `lib/ledger/mcp-client.cjs` — MCP JSON-RPC client with SSE parsing, session initialization handshake, mandatory timeouts
- `lib/ledger/scope.cjs` — scope format constants (dash-separated), validation function rejecting colons
- `lib/shared/config.cjs` — .env loader with "don't override existing env vars" behavior (port Python's 12-line implementation)
- `lib/shared/logger.cjs` — error logger with 1MB rotation, ISO timestamps, hook name prefix
- `lib/shared/health-guard.cjs` — once-per-session flag using `process.ppid` (not `process.pid`)
- `tests/` — regression tests for DIAG-02 (group_id override), scope format validation, HTTP timeout behavior, stdin reading

**Addresses from FEATURES.md:** Shared infrastructure (config, logger, health-guard), MCP client (L1), project detection (L7), scope resolution (L8) — all P1 features
**Pitfalls addressed:** P1 (GRAPHITI_GROUP_ID), P2 (colon scope), P4 (cold start / lazy require), P5 (stdin reading), P6 (HTTP timeout), P7 (SSE parsing), P8 (module complexity budget), P9 (.env loading)

### Phase 2: Hook Migration (The Product)

**Rationale:** With the foundation in place, the 5 hooks are the core deliverable. Each hook is a thin wrapper (20-30 lines) calling Phase 1 modules — the actual logic lives in `lib/`. The hooks are the product; without them, nothing flows into Graphiti. Each hook must be individually verified against the v1.1 regression checklist before being declared migrated. The Stop hook's timing must be measured empirically in this phase.

**Delivers:**
- `hooks/dynamo-hooks.cjs` — single entry point router for all 5 hook events
- Hook handlers: `handleSessionStart`, `handleUserPrompt`, `handlePostToolUse`, `handlePreCompact`, `handleStop`
- `lib/ledger/episodes.cjs` — `add_memory` tool calls
- `lib/ledger/search.cjs` — `search_memory_facts` + `search_nodes`
- `lib/ledger/curation.cjs` — Haiku curation, summarization, session naming via OpenRouter
- `lib/ledger/sessions.cjs` — session index CRUD, session naming, summary storage, sessions.json compatibility
- `lib/ledger/index.cjs` — public Ledger API composing all modules
- `settings-hooks.json` updated with CJS paths
- Regression tests: each hook tested with Graphiti server DOWN (verifies exit codes and error log writes)
- Timing verification: Stop hook measured empirically; `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS` set in installer

**Addresses from FEATURES.md:** All 5 hooks (L9-L13), curation pipeline (L4-L6), session index (S3), session management (S4-S7 baseline)
**Pitfalls addressed:** P3 (fire-and-forget), P10 (SessionEnd timeout), infinite loop guard (`stop_hook_active` check), sessions.json format compatibility, once-per-session flag using `process.ppid`

### Phase 3: Operations and Verification

**Rationale:** The hooks need operational support — health checking and memory verification — to confirm the system is actually working before the Python version is retired. The 6-stage health check and verify-memory pipeline test are the "is it working?" answer. Session management CLI commands are also needed for user-facing operations. This phase builds the CLI router that exposes all functionality as `dynamo <command>`.

**Delivers:**
- `lib/switchboard/health.cjs` — 6-stage health check (Docker, Neo4j, Graphiti API, MCP session, env vars, canary round-trip including project-scope write-then-read)
- `lib/ledger/verify.cjs` — verify-memory pipeline test (6 checks; GRAPHITI_GROUP_ID absence confirmed automatically)
- `lib/switchboard/sessions.cjs` — list, view, label, backfill session commands
- `bin/dynamo.cjs` — CLI router for all commands (`dynamo health-check`, `dynamo search`, `dynamo list-sessions`, `dynamo verify-memory`, etc.)
- `lib/switchboard/index.cjs` — public Switchboard API

**Addresses from FEATURES.md:** Health check (S1), verify memory (L14), session management commands (S4-S7), CLI dispatcher
**Pitfalls addressed:** Ensures the Phase 2 hooks are actually storing data correctly (via scope round-trip test) before cutover from Python

### Phase 4: Installation and Cutover

**Rationale:** The CJS system must be deployable and the Python/Bash system must be retired. The installer is the mechanism for both. This phase is last because it can't be written until the system it deploys is complete and verified. The cutover sequence is per-event (one hook at a time) with `verify-memory` run after each switch.

**Delivers:**
- `lib/switchboard/install.cjs` — copies CJS files to `~/.claude/dynamo/`, registers MCP server in `~/.claude.json`, generates `settings-hooks.json`, sets `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`, eliminates Python venv setup entirely
- `lib/switchboard/settings.cjs` — hook registration generator pointing to `.cjs` files, not `.sh` files
- Per-event migration: switch each hook in `settings.json` from Bash to CJS; run `dynamo verify-memory` after each switch
- Post-cutover: `graphiti/` directory deprecated; Python hooks removed from `settings.json`
- `VERSION` file (Dynamo version for self-management)

**Addresses from FEATURES.md:** Installer (S8), settings generator (S12), full feature parity checklist
**Deferred (v1.2.x):** Deep diagnostics (S2), sync CJS rewrite (S9), stack start/stop CJS wrappers (S10/S11)

### Phase Ordering Rationale

- Foundation before hooks: 8 of 10 pitfalls live at the infrastructure level; fixing them in Phase 1 means hooks never encounter them
- Hooks before operations: health check and verify-memory need real hook data to validate against; the pipeline must be flowing before it can be certified
- Operations before cutover: you need a way to confirm the system works (`dynamo verify-memory`) before retiring the Python version
- The Python/Bash system stays active alongside CJS during Phases 1-3 (both registered in `settings.json`) — Phase 4 is the only phase that removes Python hooks

### Research Flags

Phases with well-documented patterns (skip research-phase, build directly):
- **Phase 1:** CJS module patterns, Node.js built-in APIs, GSD patterns are verified from live source code. No novel integrations. Build directly.
- **Phase 3:** CLI router, session CRUD, health check patterns all follow established GSD conventions. Build directly.
- **Phase 4:** Installer pattern follows GSD's existing install mechanism. Build directly.

Phases needing empirical investigation during implementation:
- **Phase 2 (Stop hook timing):** Whether `Stop` has the same 1.5-second global cap as `SessionEnd` needs empirical confirmation. The documentation references both event names inconsistently. Use timing probes during Stop hook implementation; do not assume the 30-second `settings.json` timeout applies end-to-end.
- **Phase 2 (MCP `notifications/initialized`):** The requirement to send the `notifications/initialized` message after `initialize` is documented as "may cause undefined behavior" if omitted. Capture a real MCP session handshake to verify before shipping the CJS MCP client.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against installed runtime (Node v24.13.1), GSD source (14 CJS files), `~/.claude/package.json`, and official Node.js 24 LTS documentation. Zero ambiguity in technology choices. |
| Features | HIGH | Full source code audit of all 17 files in the existing system (every function, every subcommand). Feature inventory is exhaustive and maps directly to CJS target modules. |
| Architecture | HIGH | Directory structure and patterns derived directly from GSD production code (same environment). Hook registration verified from official Claude Code docs and live `settings.json`. Ledger/Switchboard boundary is clearly defined with an explicit boundary test. |
| Pitfalls | HIGH | 10 of 12 pitfalls derived from v1.1 diagnostic history (DIAG-01, DIAG-02 with root causes documented). Remaining pitfalls derived from direct code comparison of Python httpx vs. Node.js fetch semantics. All 12 v1.1 fixes have explicit regression test specifications. |

**Overall confidence:** HIGH

### Gaps to Address

- **Stop hook global timeout cap:** Whether `Stop` has the same 1.5-second global cap as `SessionEnd` requires empirical measurement during Phase 2. Set timing probes on the session summary hook and test in a real Claude Code session before declaring the hook complete.

- **MCP `notifications/initialized` requirement:** Whether omitting this notification causes undefined behavior or is silently tolerated is unclear. Capture a real MCP handshake (via network inspection or verbose logging in the Python client) before implementing the CJS version.

- **Sessions.json format compatibility:** The CJS sessions module must read the existing `sessions.json` written by Python. The format appears straightforward, but validate round-trip read/write compatibility before retiring the Python sessions module in Phase 4.

- **Haiku model ID stability:** The curation pipeline uses `anthropic/claude-haiku-4.5` via OpenRouter. If this model ID changes, curation silently degrades to truncated output. Verify the model ID against the OpenRouter models endpoint at Phase 2 implementation time.

---

## Sources

### Primary (HIGH confidence)

- GSD source code `~/.claude/get-shit-done/bin/gsd-tools.cjs` and 14 `lib/*.cjs` modules — CJS patterns, module structure, zero-dependency philosophy (direct code inspection)
- `~/.claude/package.json` — Confirmed `{"type":"commonjs"}` (direct inspection)
- `~/.claude/settings.json` — Hook registration structure (direct inspection)
- `~/.claude/hooks/gsd-context-monitor.js`, `gsd-statusline.js` — CJS hook patterns (direct inspection)
- Node.js v24.13.1 installed runtime — `node:test`, `node:assert`, `globalThis.fetch` availability confirmed
- Full source audit: `graphiti/graphiti-helper.py` (944 LOC), `graphiti/health-check.py` (553 LOC), `graphiti/diagnose.py` (588 LOC), 6 Bash hook scripts (~350 LOC total)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) — official hook event schemas, timeout behavior, stdin format, exit codes
- [Node.js 24 LTS announcement](https://nodesource.com/blog/nodejs-24-becomes-lts) — LTS status confirmed
- [js-yaml on npm](https://www.npmjs.com/package/js-yaml) — v4.1.1, 24,681 dependents, CJS-native confirmed

### Secondary (MEDIUM confidence)

- [Claude Code Hooks Guide](https://claude.com/blog/how-to-configure-hooks) — configuration patterns and examples
- [Claude Code Async Hooks](https://reading.sh/claude-code-async-hooks-what-they-are-and-when-to-use-them-61b21cd71aad) — async vs. foreground hook behavior; SessionEnd timeout cap behavior
- [Node.js Loader Performance](https://blog.appsignal.com/2025/10/22/ways-to-improve-nodejs-loader-performance.html) — CJS require() cold-start optimization strategies
- [Claude Code plugin-dev SKILL](https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/hook-development/SKILL.md) — hook development patterns (may be version-specific)

### Internal (HIGH confidence)

- `.planning/milestones/v1.1-phases/04-diagnostics/04-DIAGNOSTIC-REPORT.md` — DIAG-01, DIAG-02 root causes and fixes
- `.planning/milestones/v1.1-phases/05-hook-reliability/05-VERIFICATION.md` — 8/8 truths verified
- `graphiti/SCOPE_FALLBACK.md` — dash separator constraint documentation (Graphiti MCP v1.21.0 group_id validation)

---
*Research completed: 2026-03-17*
*Ready for roadmap: yes*

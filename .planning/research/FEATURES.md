# Feature Research: v1.2 CJS Rewrite Feature Parity

**Domain:** Claude Code enhancement platform — CJS rewrite of Python/Bash memory + management system
**Researched:** 2026-03-17
**Confidence:** HIGH (based on direct source code audit of every existing file, GSD CJS patterns in production)

---

## Existing System Inventory (Source of Truth)

Before defining feature parity, every existing capability must be inventoried and categorized. This inventory was built by reading every source file in the repository.

### Current File Inventory

| File | Language | Lines | Domain | Purpose |
|------|----------|-------|--------|---------|
| `graphiti-helper.py` | Python | 944 | Ledger | Core API bridge: 12 subcommands for Graphiti MCP interaction |
| `health-check.py` | Python | 553 | Switchboard | 6-stage pipeline health check with human + JSON output |
| `diagnose.py` | Python | 588 | Switchboard | 13-stage deep diagnostic probe of full pipeline |
| `capture-change.sh` | Bash | 59 | Ledger | PostToolUse hook: stores file change episodes |
| `session-summary.sh` | Bash | 83 | Ledger | Stop hook: summarizes session, stores in graph + local index |
| `preserve-knowledge.sh` | Bash | 57 | Ledger | PreCompact hook: extracts and preserves key knowledge |
| `session-start.sh` | Bash | 59 | Ledger | SessionStart hook: bootstraps session with memory context |
| `prompt-augment.sh` | Bash | 67 | Ledger | UserPromptSubmit hook: augments prompts with relevant memories |
| `health-check.sh` | Bash | 5 | Switchboard | Thin wrapper that delegates to health-check.py |
| `install.sh` | Bash | 92 | Switchboard | Installer: copies files, creates venv, registers MCP |
| `sync-graphiti.sh` | Bash | 177 | Switchboard | Bidirectional sync between live (~/.claude) and repo |
| `start-graphiti.sh` | Bash | ~20 | Switchboard | Docker compose up for Graphiti stack |
| `stop-graphiti.sh` | Bash | ~20 | Switchboard | Docker compose down for Graphiti stack |
| `settings-hooks.json` | JSON | 92 | Switchboard | Hook configuration for Claude Code settings |
| `config.yaml` | YAML | 62 | Infra | Graphiti MCP server configuration |
| `docker-compose.yml` | YAML | 52 | Infra | Neo4j + Graphiti MCP container definitions |
| `prompts.yaml` | YAML | 70 | Ledger | Curation prompt templates for Haiku |

**Total functional code:** ~2,860 lines across Python and Bash (excluding config/YAML/JSON).

---

## Ledger vs Switchboard Classification

The core architectural decision for v1.2: every feature belongs to exactly one of two systems.

**Ledger** = What Claude knows. Memory storage, retrieval, curation, context injection.
**Switchboard** = How Claude behaves. Lifecycle management, health, installation, sync, configuration.

### Ledger (Memory System) Features

| # | Feature | Current Implementation | CJS Module | Complexity | Dependencies |
|---|---------|----------------------|------------|------------|-------------|
| L1 | **MCP Client** | `MCPClient` class in graphiti-helper.py (140 lines) | `lib/ledger/mcp-client.cjs` | MEDIUM | httpx -> node native fetch or undici |
| L2 | **Add Episode** | `cmd_add_episode()` + Bash hooks call it | `lib/ledger/episodes.cjs` | LOW | L1 (MCP Client) |
| L3 | **Search Facts + Nodes** | `cmd_search()` with dual MCP calls | `lib/ledger/search.cjs` | LOW | L1 (MCP Client) |
| L4 | **Context Curation** | `curate_results()` via Haiku/OpenRouter | `lib/ledger/curation.cjs` | MEDIUM | OpenRouter API key |
| L5 | **Session Summarization** | `summarize_text()` via Haiku/OpenRouter | `lib/ledger/curation.cjs` | LOW | OpenRouter API key (shares module with L4) |
| L6 | **Session Naming** | `generate_session_name()` via Haiku | `lib/ledger/curation.cjs` | LOW | OpenRouter API key (shares module with L4/L5) |
| L7 | **Project Detection** | `cmd_detect_project()` — git, package.json, composer.json, pyproject.toml, DDEV | `lib/ledger/project-detect.cjs` | LOW | Filesystem + child_process for git |
| L8 | **Scope Resolution** | Bash logic in every hook: project-{name} or global | `lib/ledger/scope.cjs` | LOW | L7 (Project Detection) |
| L9 | **Hook: Capture Change** | `capture-change.sh` (PostToolUse) | `hooks/capture-change.cjs` | LOW | L1, L2, L7, L8 |
| L10 | **Hook: Session Summary** | `session-summary.sh` (Stop) | `hooks/session-summary.cjs` | MEDIUM | L1, L2, L5, L6, L7, L8, S3 |
| L11 | **Hook: Preserve Knowledge** | `preserve-knowledge.sh` (PreCompact) | `hooks/preserve-knowledge.cjs` | LOW | L1, L2, L5, L7, L8 |
| L12 | **Hook: Session Start** | `session-start.sh` (SessionStart) | `hooks/session-start.cjs` | MEDIUM | L1, L3, L4, L7, L8 |
| L13 | **Hook: Prompt Augment** | `prompt-augment.sh` (UserPromptSubmit) | `hooks/prompt-augment.cjs` | MEDIUM | L1, L3, L4, L6, L7, L8, S3 |
| L14 | **Verify Memory** | `cmd_verify_memory()` — 6 pipeline checks | `lib/ledger/verify.cjs` | MEDIUM | L1, L2, L3, S3 |
| L15 | **Curation Prompts** | `prompts.yaml` — 5 prompt templates | `config/prompts.yaml` (keep YAML, load in CJS) | LOW | None (static config) |

### Switchboard (Management System) Features

| # | Feature | Current Implementation | CJS Module | Complexity | Dependencies |
|---|---------|----------------------|------------|------------|-------------|
| S1 | **Health Check** | `health-check.py` — 6 stages (Docker, Neo4j, API, MCP session, env vars, canary) | `lib/switchboard/health.cjs` | MEDIUM | child_process (docker), fetch (HTTP), L1 (MCP) |
| S2 | **Deep Diagnostics** | `diagnose.py` — 13 stages with verbose output | `lib/switchboard/diagnose.cjs` | HIGH | Everything in S1 plus L2, L3, L7 |
| S3 | **Session Index** | `_load_sessions()`, `_save_sessions()`, sessions.json CRUD | `lib/switchboard/sessions.cjs` | LOW | Filesystem only |
| S4 | **List Sessions** | `cmd_list_sessions()` — filter, project auto-detect, JSON output | `lib/switchboard/sessions.cjs` | LOW | S3, L7 |
| S5 | **View Session** | `cmd_view_session()` — retrieves from Graphiti + fallback search | `lib/switchboard/sessions.cjs` | LOW | S3, L1 |
| S6 | **Label Session** | `cmd_label_session()` — assigns user label | `lib/switchboard/sessions.cjs` | LOW | S3 |
| S7 | **Backfill Sessions** | `cmd_backfill_sessions()` — scans Graphiti for past sessions | `lib/switchboard/sessions.cjs` | MEDIUM | S3, L1 |
| S8 | **Installer** | `install.sh` — copies files, creates venv, registers MCP | `lib/switchboard/install.cjs` | MEDIUM | child_process, filesystem |
| S9 | **Sync** | `sync-graphiti.sh` — bidirectional rsync with conflict detection | `lib/switchboard/sync.cjs` | MEDIUM | child_process (rsync), filesystem |
| S10 | **Stack Start** | `start-graphiti.sh` — docker compose up | `lib/switchboard/stack.cjs` | LOW | child_process (docker) |
| S11 | **Stack Stop** | `stop-graphiti.sh` — docker compose down | `lib/switchboard/stack.cjs` | LOW | child_process (docker) |
| S12 | **Settings Generator** | `settings-hooks.json` — hook registration config | `lib/switchboard/settings.cjs` | LOW | Filesystem |
| S13 | **Error Logging** | Log rotation pattern in every hook (>1MB rotate) | `lib/shared/logger.cjs` | LOW | Filesystem |
| S14 | **Health Guard** | Once-per-session health check flag (/tmp/graphiti-health-warned-$$) | `lib/shared/health-guard.cjs` | LOW | S1, filesystem (/tmp) |
| S15 | **Config Loading** | .env file parsing, environment variable resolution | `lib/shared/config.cjs` | LOW | Filesystem |

---

## Feature Landscape

### Table Stakes (Feature Parity Requirements)

Features the system already has in Python/Bash. Missing any of these = regression, not a rewrite.

| Feature | Why Required | Complexity | CJS Module(s) | Notes |
|---------|-------------|------------|---------------|-------|
| **MCP Client (JSON-RPC over HTTP)** | Every Graphiti interaction goes through this. Foundation of the entire system. | MEDIUM | `lib/ledger/mcp-client.cjs` | Must handle SSE response parsing, session initialization, and the initialized notification handshake. Current Python impl is 140 lines. |
| **5 Hook Scripts** | These ARE the product. Without hooks, memory doesn't flow. | MEDIUM | `hooks/*.cjs` | capture-change, session-summary, preserve-knowledge, session-start, prompt-augment. Each reads JSON from stdin, calls Ledger modules. |
| **Haiku Curation Pipeline** | Prevents context bloat. Raw Graphiti results are noisy. Without curation, injected context is low-quality. | MEDIUM | `lib/ledger/curation.cjs` | 3 functions (curate, summarize, name-generate) sharing OpenRouter/Haiku integration. Prompt templates stay in YAML. |
| **Project Detection** | Scoping memories to projects is a core v1.1 fix. Without it, all memories go to global scope. | LOW | `lib/ledger/project-detect.cjs` | 5 detection methods: git remote, package.json, composer.json, pyproject.toml, DDEV config.yaml. Falls back to directory name. |
| **Session Management (6 subcommands)** | list, view, label, backfill, index, generate-name. Users depend on these for session navigation. | MEDIUM | `lib/switchboard/sessions.cjs` | All operate on sessions.json (flat-file index). View also queries Graphiti for content. |
| **Health Check (6 stages)** | Quick pass/fail for "is the system working." Used by hooks before every operation. | MEDIUM | `lib/switchboard/health.cjs` | Docker, Neo4j, Graphiti API, MCP session, env vars, canary round-trip. Human and JSON output modes. |
| **Deep Diagnostics (13 stages)** | Debugging tool when things break. v1.1's primary deliverable. | HIGH | `lib/switchboard/diagnose.cjs` | All 6 health stages plus: project-scope write/read, helper add-episode, hook simulation, session list/view/backfill. |
| **Verify Memory** | Quick pipeline validation (write canary, read back, check sessions). | MEDIUM | `lib/ledger/verify.cjs` | 6 checks: server health, global write, global read, session index, list sessions, view session. |
| **Installer** | Self-management is a core value. Claude Code must install the system. | MEDIUM | `lib/switchboard/install.cjs` | CJS rewrite eliminates Python venv setup. Copies CJS files, registers MCP server, generates settings. |
| **Bidirectional Sync** | Keeps repo and live ~/.claude in sync. Essential for development workflow. | MEDIUM | `lib/switchboard/sync.cjs` | Conflict detection, dry-run mode, exclude patterns. May still shell out to rsync or reimplement in Node. |
| **Error Logging + Rotation** | Hooks must surface failures visibly (stderr) AND log persistently. v1.1 key learning. | LOW | `lib/shared/logger.cjs` | Log to file, rotate at 1MB, format with ISO timestamp + hook name. |
| **Once-per-session Health Guard** | Prevents repeated "server unreachable" warnings and unnecessary health checks. | LOW | `lib/shared/health-guard.cjs` | Flag file in /tmp keyed to process ID. First failure warns, subsequent failures silent. |
| **.env Config Loading** | API keys (OPENROUTER, NEO4J_PASSWORD) must load from .env file. | LOW | `lib/shared/config.cjs` | Simple key=value parsing. No external dependency needed (dotenv-like). |
| **Settings/Hook JSON Generation** | Claude Code needs settings.json hook entries pointing to the new CJS scripts. | LOW | `lib/switchboard/settings.cjs` | Generate the settings-hooks.json equivalent with CJS paths. |
| **Stack Management (start/stop)** | docker compose up/down for Graphiti + Neo4j. | LOW | `lib/switchboard/stack.cjs` | Thin wrappers around child_process docker compose commands. |

### Differentiators (New Capabilities Enabled by CJS Architecture)

Features that become possible or dramatically better with the CJS rewrite. Not required for parity, but the architectural value proposition.

| Feature | Value Proposition | Complexity | CJS Module(s) | Notes |
|---------|-------------------|------------|---------------|-------|
| **Modular Injection Pattern** | Hooks and capabilities become pluggable modules with a standard interface. New hooks can be added by dropping a file, not editing Bash scripts. | MEDIUM | `lib/shared/injector.cjs` | Module registry pattern: scan a directory, require() each .cjs, call standard entry point. GSD uses this successfully for commands. |
| **Single Entry Point CLI** | `node dynamo.cjs <command> [args]` replaces 6 separate scripts. Consistent arg parsing, help text, error handling. | MEDIUM | `dynamo.cjs` + `lib/commands.cjs` | Mirrors GSD's gsd-tools.cjs pattern. All commands route through one dispatcher. |
| **Shared Module Dependencies** | MCP client, config loading, project detection used by multiple hooks without re-initialization. | LOW | Architectural | Python had to re-parse .env and re-init MCP session per hook invocation. CJS modules can cache. |
| **Testability** | Pure CJS functions are unit-testable with Node's built-in test runner. Bash was not testable. | MEDIUM | `tests/` directory | Each lib module gets corresponding test file. No external test framework needed (Node 18+ has built-in). |
| **Unified Error Handling** | try/catch propagation instead of Bash's fragile set -uo pipefail + trap patterns. | LOW | Architectural | Every hook currently has identical 15-line error/logging boilerplate. CJS centralizes this. |
| **Hook Settings Auto-Generation** | Generate settings-hooks.json programmatically from discovered hook modules, not hand-maintained JSON. | LOW | `lib/switchboard/settings.cjs` | Scan hooks/ directory, generate correct settings structure. Self-updating when hooks are added. |
| **Eliminate Python Dependency** | No more Python venv, pip install, requirements.txt. Node.js is already required for Claude Code. | LOW | Architectural | Removes ~500MB venv, httpx/PyYAML dependency chain. Simplifies installer significantly. |
| **Config Validation** | Validate .env, config.yaml, settings.json at startup instead of failing silently mid-operation. | LOW | `lib/shared/config.cjs` | Parse and validate all config on load. Surface missing keys immediately. |

### Anti-Features (Do NOT Build in v1.2)

Features that are tempting but explicitly out of scope per PROJECT.md or would add complexity without parity value.

| Feature | Why Tempting | Why Problematic | What to Do Instead |
|---------|-------------|-----------------|-------------------|
| **New memory features (decision engine, preload)** | Natural to add while rewriting | Scope creep. v1.2 is parity, not enhancement. New features belong in v1.3+. | Stub the module interface so v1.3 can add them. Do not implement logic. |
| **UI/Dashboard** | Visual session browser would be nice | Massive scope addition. Out of scope until v1.4+. | Keep JSON output mode for programmatic access. |
| **Domain-specific skills/agents** | WPCS skill, Context7 agent could live here | Wrong system boundary. Skills are Claude Code native, not Dynamo's concern. | Document in Master Roadmap for v1.3+. |
| **ESM modules instead of CJS** | "Modern" JavaScript | GSD uses CJS. Claude Code's hook system expects a command that runs and exits. CJS has simpler require() semantics, no top-level await issues. ESM adds complexity for zero user value. | Use CJS throughout. Consistent with GSD pattern. |
| **TypeScript** | Type safety, better DX | Requires build step. GSD doesn't use it. Adds toolchain complexity (tsconfig, compilation). CJS files run directly with `node`. | Write CJS with JSDoc type annotations if type hints are needed. |
| **External test framework (Jest, Vitest)** | More features | Unnecessary dependency. Node 18+ built-in test runner covers unit test needs. Keep it zero-dependency. | Use `node --test` for testing. |
| **Database abstraction layer** | Future-proofing for non-Neo4j backends | YAGNI. Graphiti is the database. The MCP protocol IS the abstraction layer. | Interact only through MCP client, which is already database-agnostic. |
| **Multi-user support** | Theoretically useful | Single user system. All config is in ~/.claude. user_id is hardcoded "claude-code". | Do not add user resolution logic. |
| **Webhook/notification system** | Alert on hook failures | PROJECT.md explicitly says "visible error output is sufficient." | Write to stderr (visible in Claude Code) and log file. |
| **Background daemon/service** | Persistent process for faster hook execution | Hooks must be stateless, invoked by Claude Code, and exit. Daemon adds crash recovery complexity and contradicts the hook execution model. | Each hook invocation is independent. Use /tmp flags for per-session state. |
| **Rewriting sync in pure Node** | Eliminate rsync dependency | rsync is battle-tested for bidirectional file sync with conflict detection. Reimplementing it in Node is error-prone and adds hundreds of lines for no user value. | Shell out to rsync from CJS. Rsync is pre-installed on macOS. |

---

## Feature Dependencies

```
[L1: MCP Client]
    |
    +--requires--> Node.js fetch/http (built-in)
    |
    +--used-by--> [L2: Add Episode]
    +--used-by--> [L3: Search Facts/Nodes]
    +--used-by--> [L14: Verify Memory]
    +--used-by--> [S1: Health Check]
    +--used-by--> [S2: Diagnostics]
    +--used-by--> [S5: View Session]
    +--used-by--> [S7: Backfill Sessions]

[L4: Curation] + [L5: Summarization] + [L6: Session Naming]
    |
    +--requires--> OpenRouter API key
    +--requires--> [L15: Curation Prompts (YAML)]
    |
    +--used-by--> [L10: Hook: Session Summary]
    +--used-by--> [L11: Hook: Preserve Knowledge]
    +--used-by--> [L12: Hook: Session Start]
    +--used-by--> [L13: Hook: Prompt Augment]

[L7: Project Detection]
    |
    +--requires--> git CLI, filesystem
    |
    +--used-by--> [L8: Scope Resolution]
    +--used-by--> [S4: List Sessions]

[L8: Scope Resolution]
    |
    +--requires--> [L7: Project Detection]
    |
    +--used-by--> ALL hooks (L9-L13)

[S3: Session Index]
    |
    +--requires--> Filesystem (sessions.json)
    |
    +--used-by--> [S4: List Sessions]
    +--used-by--> [S5: View Session]
    +--used-by--> [S6: Label Session]
    +--used-by--> [S7: Backfill Sessions]
    +--used-by--> [L10: Hook: Session Summary]
    +--used-by--> [L13: Hook: Prompt Augment]

[S13: Logger] + [S14: Health Guard] + [S15: Config]
    |
    +--shared infrastructure, used by ALL hooks and commands
```

### Dependency Notes

- **L1 (MCP Client) is the critical path.** Nothing works without it. Must be ported first and tested in isolation. The SSE response parsing and MCP session handshake are the most delicate parts.
- **L4/L5/L6 (Curation) degrades gracefully.** If OpenRouter API key is missing, falls back to truncated text. This graceful degradation must be preserved in CJS.
- **S3 (Session Index) is purely local.** No network dependencies. Can be tested completely offline. Good early win.
- **L7 (Project Detection) has no external dependencies** except git CLI (always available). Another good early target.
- **S8 (Installer) changes significantly.** Python venv setup is eliminated. The installer becomes: copy CJS files, register MCP, generate settings. Simpler than current.

---

## Feature Parity Checklist

Concrete, testable criteria for "v1.2 is done."

### Ledger Parity

- [ ] `node dynamo.cjs health-check` returns pass/fail matching `health-check.py` output
- [ ] `node dynamo.cjs add-episode --text "test" --scope global` stores an episode in Graphiti
- [ ] `node dynamo.cjs search --query "test" --scope global` returns facts and nodes
- [ ] `node dynamo.cjs search --query "test" --scope global --curate "context"` filters results through Haiku
- [ ] `node dynamo.cjs summarize-session` reads stdin and produces Haiku summary
- [ ] `node dynamo.cjs detect-project` returns correct project name from git remote
- [ ] `node dynamo.cjs generate-session-name --text "debugging auth flow"` returns 3-5 word name
- [ ] `node dynamo.cjs verify-memory` runs 6 checks and reports pass/fail
- [ ] Hook: capture-change.cjs stores file change episode when invoked by PostToolUse
- [ ] Hook: session-summary.cjs stores summary + indexes session when invoked by Stop
- [ ] Hook: preserve-knowledge.cjs extracts knowledge and re-injects when invoked by PreCompact
- [ ] Hook: session-start.cjs bootstraps context when invoked by SessionStart
- [ ] Hook: prompt-augment.cjs augments prompts + names session when invoked by UserPromptSubmit
- [ ] Curation degrades gracefully when OPENROUTER_API_KEY is not set
- [ ] Prompts.yaml is loaded and templates are interpolated correctly

### Switchboard Parity

- [ ] `node dynamo.cjs health-check` runs 6 stages: Docker, Neo4j, API, MCP, env, canary
- [ ] `node dynamo.cjs health-check --json` outputs machine-readable JSON
- [ ] `node dynamo.cjs diagnose` runs 13 stages with verbose output
- [ ] `node dynamo.cjs list-sessions` shows sessions for current project
- [ ] `node dynamo.cjs list-sessions --json --all` outputs all sessions as JSON
- [ ] `node dynamo.cjs view-session --timestamp <ts>` retrieves session content
- [ ] `node dynamo.cjs label-session --timestamp <ts> --label "name"` updates session label
- [ ] `node dynamo.cjs backfill-sessions` scans Graphiti and populates index
- [ ] `node dynamo.cjs install` copies files, registers MCP, generates settings
- [ ] `node dynamo.cjs sync status` shows diff between live and repo
- [ ] `node dynamo.cjs sync live-to-repo` copies live to repo with conflict detection
- [ ] `node dynamo.cjs sync repo-to-live` copies repo to live with conflict detection
- [ ] `node dynamo.cjs stack start` runs docker compose up
- [ ] `node dynamo.cjs stack stop` runs docker compose down
- [ ] Error logging writes to hook-errors.log with ISO timestamps
- [ ] Log rotation triggers at 1MB
- [ ] Health guard prevents repeated warnings per session

### Behavioral Parity

- [ ] Hooks read JSON from stdin (Claude Code hook contract)
- [ ] Hooks write augmentation context to stdout (Claude Code reads this)
- [ ] Hooks write errors to stderr (visible in Claude Code UI)
- [ ] Hooks exit 0 on success, 0 on non-critical failure (don't block Claude Code)
- [ ] Hooks respect 5s/10s/15s/30s timeout budgets from settings-hooks.json
- [ ] All hooks perform once-per-session health guard check
- [ ] Session summary hook guards against infinite loops (stop_hook_active check)
- [ ] Project scope uses `project-{name}` format (not `project:{name}` -- Graphiti v1.21.0 constraint)

---

## MVP Definition

### v1.2 Launch (Feature Parity)

The minimum that constitutes a successful rewrite:

- [ ] **Shared infrastructure** (config, logger, health-guard) -- foundation for everything else
- [ ] **MCP Client in CJS** -- the most critical port, enables all Graphiti interaction
- [ ] **Project detection + scope resolution** -- simple, testable, enables correct scoping
- [ ] **Session index (CRUD)** -- local-only, no network, exercises file I/O patterns
- [ ] **All 5 hooks ported to CJS** -- this is the actual product
- [ ] **Curation pipeline (Haiku/OpenRouter)** -- hooks depend on this for quality output
- [ ] **Health check** -- fast validation that the system works
- [ ] **Verify memory** -- end-to-end pipeline test
- [ ] **Installer rewritten for CJS** -- users need to deploy the new system
- [ ] **Settings generator** -- hook registrations pointing to .cjs files
- [ ] **CLI dispatcher** (dynamo.cjs) -- single entry point for all commands

### Add After v1.2 Stabilization (v1.2.x)

- [ ] **Deep diagnostics** (13-stage diagnose) -- defer because it's 588 lines of edge-case probing and health check covers 90% of needs
- [ ] **Sync rewrite** -- defer because sync-graphiti.sh still works fine alongside CJS; it's the one Bash script that doesn't need urgent rewriting
- [ ] **Stack management** -- defer because start/stop are 20-line wrappers around docker compose; existing Bash works

### Future (v1.3+)

- [ ] **Decision engine** -- new Ledger capability, not parity
- [ ] **Preload engine** -- new Ledger capability, not parity
- [ ] **Hook auto-discovery** -- scan hooks/ directory, auto-register in settings
- [ ] **Memory quality scoring** -- rate stored memories for relevance/staleness
- [ ] **UI/Dashboard** -- visual session browser

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Phase Placement |
|---------|-----------|--------------------|---------|----|
| Shared infra (config, logger, health-guard) | HIGH (unblocks everything) | LOW | P1 | Phase 1 |
| MCP Client (CJS) | HIGH (foundation) | MEDIUM | P1 | Phase 1 |
| Project detection + scope resolution | HIGH (correctness) | LOW | P1 | Phase 1 |
| Session index CRUD | MEDIUM | LOW | P1 | Phase 1 |
| CLI dispatcher (dynamo.cjs) | HIGH (UX) | MEDIUM | P1 | Phase 1 |
| 5 Hooks (CJS) | HIGH (the product) | MEDIUM | P1 | Phase 2 |
| Curation pipeline (Haiku) | HIGH (quality) | MEDIUM | P1 | Phase 2 |
| Health check (6 stages) | HIGH (ops) | MEDIUM | P1 | Phase 3 |
| Verify memory | MEDIUM | MEDIUM | P1 | Phase 3 |
| Installer (CJS) | HIGH (deployment) | MEDIUM | P1 | Phase 4 |
| Settings generator | MEDIUM | LOW | P1 | Phase 4 |
| Deep diagnostics | LOW (niche) | HIGH | P2 | Phase 4 or defer |
| Sync (CJS) | LOW (existing works) | MEDIUM | P3 | Defer |
| Stack start/stop (CJS) | LOW (existing works) | LOW | P3 | Defer |

**Priority key:**
- P1: Must have for v1.2 launch -- core parity
- P2: Should have -- add if time allows, can be v1.2.x patch
- P3: Nice to have -- existing Bash still works, no urgency

---

## Modular Injection Pattern

The key architectural differentiator for v1.2 that enables future extensibility.

### Pattern: Module Registry

```
dynamo.cjs (entry point)
  |
  +-- lib/
  |     +-- shared/           (cross-cutting: config, logger, health-guard)
  |     +-- ledger/           (memory: mcp-client, episodes, search, curation, scope, verify)
  |     +-- switchboard/      (management: health, diagnose, sessions, install, sync, stack)
  |     +-- commands.cjs      (command dispatcher -- maps CLI args to modules)
  |
  +-- hooks/                  (hook entry points -- thin wrappers calling lib/ modules)
  |     +-- capture-change.cjs
  |     +-- session-summary.cjs
  |     +-- preserve-knowledge.cjs
  |     +-- session-start.cjs
  |     +-- prompt-augment.cjs
  |
  +-- config/                 (static configuration)
        +-- prompts.yaml
        +-- entity-types.yaml (from config.yaml graphiti.entity_types)
```

### How Injection Works

Each module in `lib/ledger/` and `lib/switchboard/` exports a standard interface:

```javascript
// lib/ledger/episodes.cjs
const { getMCPClient } = require('../shared/mcp-pool.cjs');
const { resolveScope } = require('./scope.cjs');

async function addEpisode({ text, scope, source }) {
  const client = getMCPClient();
  const resolvedScope = resolveScope(scope);
  return client.callTool('add_memory', {
    name: source,
    episode_body: text,
    group_id: resolvedScope,
    source: 'text',
    source_description: source,
  });
}

module.exports = { addEpisode };
```

Hooks are thin wrappers that read stdin, call modules, write stdout/stderr:

```javascript
// hooks/capture-change.cjs
const { addEpisode } = require('../lib/ledger/episodes.cjs');
const { detectProject } = require('../lib/ledger/project-detect.cjs');
const { healthGuard } = require('../lib/shared/health-guard.cjs');

async function main() {
  const input = JSON.parse(await readStdin());
  if (!['Write', 'Edit', 'MultiEdit'].includes(input.tool_name)) process.exit(0);
  if (!await healthGuard()) process.exit(0);

  const project = await detectProject(input.cwd);
  const scope = project !== 'unknown' ? `project-${project}` : 'global';
  await addEpisode({
    text: `File ${input.tool_name}: ${input.tool_input?.file_path || 'unknown'}`,
    scope,
    source: 'change-hook',
  });
}
```

### Why This Pattern

1. **Hooks stay thin.** Business logic lives in lib/. Hooks are 20-30 lines, not 60-80.
2. **CLI and hooks share code.** `dynamo.cjs add-episode` and `hooks/capture-change.cjs` both call the same `addEpisode()` function.
3. **New hooks = new file.** Adding a hook in v1.3+ means creating a file in hooks/ and adding a line to settings.json. No code changes to existing modules.
4. **Testing is straightforward.** Test lib/ modules in isolation. Test hooks by mocking stdin/stdout.
5. **Ledger and Switchboard evolve independently.** A new Switchboard feature (e.g., auto-update checker) doesn't touch any Ledger code.

---

## Infrastructure Dependencies

All features depend on these external systems that are NOT being rewritten:

| Dependency | Version | Required By | Managed How |
|-----------|---------|-------------|-------------|
| Graphiti MCP Server | `zepai/knowledge-graph-mcp:standalone` | All Ledger features, Health/Diagnostics | Docker (docker-compose.yml -- kept as-is) |
| Neo4j | 5.26.0 | Graphiti (internal) | Docker (docker-compose.yml -- kept as-is) |
| OpenRouter API | Haiku 4.5 | Curation, Summarization, Session Naming | API key in .env |
| Node.js | 18+ (Claude Code requirement) | All CJS modules | Pre-installed (Claude Code depends on it) |
| Docker | Latest | Stack start/stop, Health check | Pre-installed (Homebrew) |
| rsync | macOS built-in | Sync feature | Pre-installed on macOS |
| jq | Latest | Installer (MCP registration check) | Homebrew |
| git | Latest | Project detection | Pre-installed on macOS |

**Key insight:** Node.js is guaranteed to be available because Claude Code itself requires it. This is the strongest argument for CJS over Python -- zero additional runtime dependencies.

---

## Sources

- Direct source code audit of all 17 files in the repository (graphiti-helper.py, diagnose.py, health-check.py, 6 hook scripts, install.sh, sync-graphiti.sh, settings-hooks.json, config.yaml, docker-compose.yml, prompts.yaml, start/stop scripts)
- GSD framework CJS architecture (`~/.claude/get-shit-done/bin/gsd-tools.cjs` + 12 lib modules) -- production-proven pattern for CJS CLI tools
- Claude Code hooks documentation (settings.json hook contract: stdin JSON, stdout augmentation, stderr errors)
- PROJECT.md v1.2 milestone definition and constraints

---

*Feature research for: Dynamo v1.2 CJS Rewrite Feature Parity*
*Researched: 2026-03-17*

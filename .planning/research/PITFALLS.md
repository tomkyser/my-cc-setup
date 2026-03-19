# Domain Pitfalls: v1.3-M1 Foundation and Infrastructure Refactor

**Domain:** CJS application restructure with transport abstraction, SQLite migration, and security hardening
**Researched:** 2026-03-19
**System:** Dynamo -- 9,253 LOC CJS, 374 tests, zero npm deps, dual-layout (repo + ~/.claude/dynamo/)
**Overall confidence:** HIGH (based on codebase analysis + verified technical constraints)

---

## Critical Pitfalls

Mistakes that cause rewrites, broken deployments, or user-impacting failures. These are the ones that can take days to recover from.

---

### CP-01: Circular Dependency Time Bomb During Restructure

**What goes wrong:** Moving ~20 files across 6 subsystems creates new `require()` chains that weren't tested together. CJS circular dependencies don't throw errors -- they silently return empty objects for the partially-loaded module. A function that was `undefined` shows up only at runtime, often in a hook handler at 2 AM when the user is trying to work.

**Why it happens in THIS system:** The current `core.cjs` already contains a deliberate circular dependency mitigation pattern (lines 319-355). It exports base utilities first, THEN requires from ledger modules, THEN extends `module.exports` with re-exports. This pattern works because `core.cjs` is loaded first. But the restructure introduces new dependency paths:

```
Current (working):
  core.cjs -> ledger/mcp-client.cjs -> core.cjs (handled by split export)
  core.cjs -> ledger/scope.cjs -> (no back-dependency)
  core.cjs -> ledger/sessions.cjs -> core.cjs (handled by split export)

After restructure (danger zone):
  lib/core.cjs -> subsystems/terminus/mcp-client.cjs -> lib/core.cjs
  lib/core.cjs -> subsystems/assay/sessions.cjs -> lib/core.cjs
  subsystems/switchboard/install.cjs -> subsystems/terminus/health-check.cjs -> ???
  subsystems/terminus/stages.cjs -> lib/core.cjs -> subsystems/terminus/mcp-client.cjs
```

Every new cross-subsystem `require()` path is a potential cycle. And because CJS circular deps are silent, tests pass until the exact code path that triggers the cycle runs in production.

**Consequences:** Hook handlers return `undefined` instead of expected functions. Hooks exit 0 (as designed for safety) but do nothing. User loses memory injection for an entire session without any visible error. The `hook-errors.log` might capture "TypeError: xxx is not a function" but the user doesn't check that proactively.

**Prevention:**
1. Map every `require()` chain BEFORE moving files. Create a dependency graph (even hand-drawn) of all current imports and verify the restructured graph has no cycles.
2. The existing split-export pattern in `core.cjs` (export base, then require, then extend) MUST be replicated in any new shared module that subsystems depend on.
3. Add a boundary test (extend `boundary.test.cjs`) that statically parses all `require()` calls across all subsystems and builds a directed graph, then asserts no cycles exist. This is the single highest-ROI test to write before any restructure work begins.
4. Move files in dependency order: shared `lib/` first, then leaf subsystems (Terminus, Assay, Ledger), then hub subsystems (Switchboard, Dynamo). Never move a file that is depended upon before its dependents are ready.

**Detection:** The boundary cycle test catches this statically. Additionally, run the full 374-test suite after EVERY file move (not batch moves). If a test starts failing with "X is not a function" or "Cannot read properties of undefined", you hit a cycle.

**Phase:** Must be addressed as the FIRST task in the restructure phase. The cycle detection test is prerequisite infrastructure.

---

### CP-02: Dual-Layout Resolution Breaks During Restructure

**What goes wrong:** Every module in the system has a `resolveCore()` or `resolveSibling()` function that resolves paths for both repo layout and deployed layout. When you move files to new locations, these resolution functions still point at old paths. The repo works fine (you updated it), but the deployed `~/.claude/dynamo/` has the old structure. First deploy after restructure either breaks entirely or resolves to stale files.

**Why it happens in THIS system:** The dual-layout pattern is spread across 7+ files, each with its own resolution logic:

| File | Resolution Pattern | Repo Resolution | Deployed Resolution |
|------|-------------------|-----------------|---------------------|
| `core.cjs` | `resolveLedger()` | `../ledger/MODULE` | `ledger/MODULE` |
| `dynamo.cjs` | `resolveSibling()` | `../switchboard/FILE` | `switchboard/FILE` |
| `dynamo-hooks.cjs` | `resolveHandlers()` | `../../ledger/hooks/` | `../ledger/hooks/` |
| `mcp-client.cjs` | `resolveCore()` | `../dynamo/core.cjs` | `../core.cjs` |
| `sessions.cjs` | `resolveCore()` | `../dynamo/core.cjs` | `../core.cjs` |
| `curation.cjs` | `resolveCore()` | `../dynamo/core.cjs` | `../core.cjs` |
| `sync.cjs` | `resolveCore()` | `../dynamo/core.cjs` | `../core.cjs` |
| `install.cjs` | `resolveCore()` | `../dynamo/core.cjs` | `../core.cjs` |

Every one of these changes when files move to `subsystems/` layout. And the deployed layout changes too -- the installer (`install.cjs`) copies the repo tree into `~/.claude/dynamo/`, so the deployed paths mirror the new structure.

**Consequences:** Two failure modes: (1) Hook dispatcher can't find handler modules -- hooks silently fail, user loses all memory operations. (2) CLI commands crash with MODULE_NOT_FOUND errors -- user can't run `dynamo health-check`, `dynamo install`, etc.

**Prevention:**
1. Centralize ALL path resolution into `lib/core.cjs` with a single `resolveModule(subsystem, module)` function. No more per-file `resolveCore()` patterns. Every module calls `core.resolveModule('terminus', 'mcp-client')` and the central resolver knows about both layouts.
2. The deployed layout structure MUST be documented as a test fixture. Add a test that verifies `install.cjs` produces the correct directory tree (it already partially does this, but not for the new layout).
3. Update `install.cjs` SYNC_PAIRS / copy logic and `sync.cjs` SYNC_PAIRS simultaneously with the file moves. These are the mechanisms that CREATE the deployed layout -- they must reflect the new structure.
4. After every restructure phase, run `dynamo install` to a temp directory and verify the deployed tree matches expectations.

**Detection:** A test that runs `install.cjs` with `_returnOnly = true` against a tmpdir and verifies the output directory structure matches the expected layout. Also: run `dynamo sync status` after restructure to verify sync pairs are correct.

**Phase:** Must be addressed in every restructure task. The centralized resolver should be built as part of the `lib/` extraction.

---

### CP-03: Sync and Install Path Drift

**What goes wrong:** The sync system (`sync.cjs`) and install system (`install.cjs`) both maintain hardcoded directory mappings. Sync has `SYNC_PAIRS` (3 pairs mapping repo dirs to deployed dirs). Install has `copyTree()` calls with explicit source paths. These are separate codebases that must agree on the same directory structure. When the restructure changes paths, one gets updated and the other doesn't.

**Why it happens in THIS system:** The current sync system maps three pairs:

```javascript
// sync.cjs lines 32-36
const SYNC_PAIRS = [
  { repo: path.join(REPO_ROOT, 'dynamo'), live: LIVE_DIR, ... },
  { repo: path.join(REPO_ROOT, 'ledger'), live: path.join(LIVE_DIR, 'ledger'), ... },
  { repo: path.join(REPO_ROOT, 'switchboard'), live: path.join(LIVE_DIR, 'switchboard'), ... },
];
```

The install system copies from three separate directories:

```javascript
// install.cjs lines 297-301
fileCount += copyTree(path.join(REPO_ROOT, 'dynamo'), LIVE_DIR, ...);
fileCount += copyTree(path.join(REPO_ROOT, 'ledger'), path.join(LIVE_DIR, 'ledger'), ...);
fileCount += copyTree(path.join(REPO_ROOT, 'switchboard'), path.join(LIVE_DIR, 'switchboard'), ...);
```

After restructure, the repo has `subsystems/terminus/`, `subsystems/switchboard/`, `subsystems/ledger/`, `subsystems/assay/`, `lib/`, `cc/`, etc. Both sync and install must be updated to map ALL new directories. Miss one? That subsystem never deploys. Miss the cleanup of an old mapping? Stale files persist in `~/.claude/dynamo/ledger/` when ledger moved to `~/.claude/dynamo/subsystems/ledger/`.

**Consequences:** Partial deployment -- some subsystems deploy, others don't. Or worse: both old and new paths exist in deployed layout, causing the dual-layout resolver to find the wrong (stale) version. User has a system that appears to work but uses old code for some subsystems.

**Prevention:**
1. Extract directory mapping into a single shared data structure (e.g., `lib/layout.cjs`) that both sync and install reference. No hardcoded paths in either module.
2. Add a "stale directory cleanup" step to install that removes known-obsolete directories (`ledger/`, `switchboard/` at the root of `~/.claude/dynamo/`) after copying to new locations. The existing install Step 6 ("Clean stale lib/") is the precedent.
3. Write an install integration test that verifies EVERY subsystem's files exist in the deployed layout after install. Currently `stages.cjs` checks deployment in the diagnose flow, but it checks the old paths.
4. Update sync and install in the SAME commit as the file moves. Never let them diverge.

**Detection:** Integration test: run install to tmpdir, then verify every `.cjs` file in the repo has a corresponding file in the deployed tree (modulo excludes like tests). A second test: run sync status and verify zero diff between repo and freshly-installed deployment.

**Phase:** Addressed when building the new layout mapping module. Should be among the first tasks after the cycle detection test.

---

### CP-04: 374 Tests Break Silently Due to Hardcoded __dirname Assumptions

**What goes wrong:** Tests use `__dirname` to locate test fixtures, the repo root, and modules under test. When the test directory moves (from `dynamo/tests/` to wherever tests live in the new layout), every `path.join(__dirname, '..', '..')` breaks. Tests that appear to pass are actually testing the wrong files or no files at all (e.g., `getAllCjsFiles()` in `boundary.test.cjs` returns an empty array because the path doesn't exist, and the test passes because "no files found" means "no violations found").

**Why it happens in THIS system:** The boundary test uses:

```javascript
// boundary.test.cjs line 9
const REPO_ROOT = path.join(__dirname, '..', '..');
```

This assumes tests are exactly 2 levels deep from repo root. If tests move to `subsystems/terminus/tests/` (3 levels deep) or to a top-level `tests/` directory (1 level deep), REPO_ROOT resolves to the wrong directory. The `getAllCjsFiles()` function (line 12-24) returns empty arrays for non-existent directories, and the `assert.ok(files.length > 0, ...)` catches this -- but only for Ledger and Switchboard directories. The directory structure assertions (line 82-96) will fail outright.

**Consequences:** Tests pass but validate nothing (false passes). Or tests fail but for the wrong reason (path resolution, not code quality). Worst case: you ship a restructure that passes all tests but has boundary violations because the boundary test was checking an empty directory.

**Prevention:**
1. Introduce a `test-helpers.cjs` module that exports `REPO_ROOT` computed from a reliable anchor (e.g., find the directory containing `dynamo.cjs` or a sentinel file like `.planning/`). All tests import from this helper instead of computing their own paths.
2. Every test file that uses `__dirname` for path computation must be audited during the restructure. Create a checklist of all 21+ test files.
3. The boundary test MUST be updated to check the new 6-subsystem boundaries, not the old 3-directory boundaries. This is not just a path fix -- the assertion logic changes entirely.
4. Run the test suite with `--verbose` after each move to catch empty-set-passes (tests that pass with 0 assertions).

**Detection:** Node.js test runner reports assertion counts. A test with 0 assertions that passes is suspicious. Add explicit minimum-count assertions: `assert.ok(files.length >= 5, 'Expected at least 5 CJS files in subsystem')`.

**Phase:** Test infrastructure update should happen immediately after the directory mapping module, before any files move.

---

### CP-05: settings.json Hook Paths Become Stale on Live System

**What goes wrong:** The `settings.json` file in `~/.claude/settings.json` contains the absolute path to the hook dispatcher:

```json
"command": "node ~/.claude/dynamo/hooks/dynamo-hooks.cjs"
```

After restructure, the dispatcher moves to `~/.claude/dynamo/cc/hooks/dynamo-hooks.cjs`. If the user's `settings.json` isn't updated, Claude Code invokes the old path, gets MODULE_NOT_FOUND, the hook fails, and Claude Code silently continues without Dynamo.

**Why it happens in THIS system:** The dispatcher path is registered in `settings.json` by the install system. But users don't run `dynamo install` on every update -- they run `dynamo update` which does backup/pull/migrate/verify. If the migration doesn't include a settings.json path update, the stale path persists.

This is the SWITCHBOARD-SPEC.md Section 6.4 "Breaking Change" -- it's called out explicitly but easily missed during implementation.

**Consequences:** Total loss of hook functionality. All 5 hook events stop firing. User gets no memory injection, no session summaries, no change capture. Because hooks exit silently on failure, the user may not notice for hours or days.

**Prevention:**
1. Write a migration script (in Terminus's migration harness) that runs during `dynamo update` and patches `settings.json` to reference the new dispatcher path.
2. The migration must use the same safe write pattern as `mergeSettings()`: backup before modify, atomic write via tmp+rename.
3. Add a diagnostic stage to `stages.cjs` that validates the hook command path actually exists on disk. If `settings.json` references a path that doesn't exist, flag it as FAIL.
4. Keep a re-export shim at the old location (`hooks/dynamo-hooks.cjs`) that `require()`s the new location. This provides backward compatibility during the transition period. Remove the shim in a later phase.

**Detection:** `dynamo diagnose` should check that every hook command path in `settings.json` resolves to an existing file. Add this as diagnostic stage 14.

**Phase:** Migration script written as part of the restructure. Shim created simultaneously. Shim removed in a cleanup task at the end of M1.

---

## Moderate Pitfalls

Issues that cause bugs, performance problems, or architectural debt but don't break the entire system.

---

### MP-01: Transport Abstraction Leaks Between OpenRouter and Anthropic API

**What goes wrong:** You build a clean transport abstraction layer (`callModel(prompt, options)`) that routes to either OpenRouter or Anthropic's Messages API. The abstraction works for happy paths. Then you discover the APIs have different error formats, different rate limiting behavior, different timeout characteristics, and different response schemas.

**Why it happens in THIS system:** The current curation system (`curation.cjs`) calls OpenRouter with:

```javascript
// OpenRouter format
headers: { 'Authorization': 'Bearer ' + apiKey }
body: { model: 'anthropic/claude-haiku-4.5', messages: [...], max_tokens: 500 }
// Response: { choices: [{ message: { content: "..." } }] }
```

The Anthropic Messages API uses:

```javascript
// Anthropic format
headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
body: { model: 'claude-haiku-4-5-20250514', messages: [...], max_tokens: 500 }
// Response: { content: [{ type: "text", text: "..." }] }
```

Key differences that leak through any abstraction:
- **Auth header:** `Authorization: Bearer` vs `x-api-key`
- **Model naming:** `anthropic/claude-haiku-4.5` vs `claude-haiku-4-5-20250514`
- **Response schema:** `choices[0].message.content` vs `content[0].text`
- **Rate limits:** OpenRouter has per-model quotas; Anthropic has per-key quotas
- **Error format:** OpenRouter returns standard HTTP errors; Anthropic returns structured `error` objects with `type` field
- **Timeout behavior:** Anthropic has a known 1-minute Cloudflare gateway timeout; OpenRouter may have different limits

**Consequences:** The abstraction works for curation (text in, text out) but breaks for structured responses, streaming, or error handling. Error recovery logic that works with OpenRouter fails silently with Anthropic (or vice versa). Model selection routing sends the wrong model name format to the wrong provider.

**Prevention:**
1. The transport abstraction should be a thin adapter, NOT a full abstraction. Two concrete implementations (OpenRouterTransport, AnthropicTransport) that share an interface (`sendMessage(messages, options) -> { text, metadata }`), not a generic HTTP wrapper.
2. Normalize the response at the adapter boundary: both adapters return `{ text: string, model: string, inputTokens: number, outputTokens: number }`. Consumers never see provider-specific response formats.
3. Normalize errors at the adapter boundary: both adapters throw `TransportError` with standardized error codes (TIMEOUT, RATE_LIMIT, AUTH_FAILURE, SERVER_ERROR). The provider-specific error details go in a `cause` field.
4. Model name mapping lives in the adapter, not in consumers. Consumer says "haiku" or "sonnet", adapter translates to the provider-specific model ID.
5. Build the Anthropic transport FIRST (it's the strategic direction -- removing OpenRouter SPOF). Keep the OpenRouter transport as-is (already working). Don't refactor the working code until the new transport is proven.

**Detection:** Integration tests that mock both providers and verify the normalized response format. Error injection tests that verify both adapters handle the same error scenarios identically.

**Phase:** Transport abstraction is part of MENH-06. Build adapters before model selection (MENH-07) since MENH-07 depends on having multiple transports available.

---

### MP-02: node:sqlite Experimental API Changes Break Session Index

**What goes wrong:** You build the SQLite session index on `node:sqlite` (DatabaseSync). The module's API changes in a Node.js update (it's still experimental/release-candidate), and your code breaks. Or worse: the user upgrades Node.js and the API is different, causing Dynamo to crash on every hook invocation that touches sessions.

**Why it happens in THIS system:** Verified on this machine: Node.js v24.13.1 has `node:sqlite` available with DatabaseSync, WAL mode, and busy_timeout all working. But it still emits `ExperimentalWarning`. The module reached Release Candidate status in v25.7.0 but is not yet stable.

Dynamo's constraint is zero npm dependencies. The alternatives are:
- `better-sqlite3` -- npm package (violates zero-dep constraint, requires native compilation)
- `node:sqlite` -- built-in but experimental/RC
- Write a custom SQLite FFI using `node:ffi` -- massive complexity for no gain
- Keep flat-file JSON -- current approach, performance limited

**Consequences:** If the API changes, any Dynamo version that uses `node:sqlite` breaks on the affected Node.js version. Since hooks fire on every Claude Code event, a crash in the session index path crashes every hook invocation. The `try/catch` safety pattern (hooks exit 0) prevents blocking Claude Code, but all memory operations stop.

**Prevention:**
1. Wrap ALL `node:sqlite` calls in a single `lib/sqlite.cjs` module that exports Dynamo-specific functions (`openSessionDb()`, `querySessions()`, etc.). No raw DatabaseSync usage outside this module.
2. The wrapper must catch and handle the case where `node:sqlite` is NOT available (Node.js < 22.5.0 or compiled without SQLite support). Fallback to the existing `sessions.json` flat-file approach.
3. Pin the minimum Node.js version in documentation and in the health check. Add a diagnostic stage that verifies `node:sqlite` availability.
4. Suppress the ExperimentalWarning in the wrapper (via `process.removeAllListeners('warning')` scoped to the import, or by accepting the warning on stderr).
5. Keep the flat-file `sessions.json` as a functioning fallback, not just a legacy path. The SQLite index is an optimization, not a hard requirement.

**Detection:** Health check stage that verifies `require('node:sqlite')` succeeds and DatabaseSync is constructable. If it fails, fall back gracefully and log a warning.

**Phase:** SQLite session index (MGMT-11) should be implemented after the directory restructure is stable. The wrapper module goes in `lib/sqlite.cjs`.

---

### MP-03: SQLite Concurrent Access from Parallel Hook Invocations

**What goes wrong:** Multiple Claude Code hooks fire in rapid succession (e.g., user submits a prompt, tool runs, another tool runs). Each hook invocation is a separate Node.js process. Each process opens the SQLite database, reads/writes, and closes. Without WAL mode and proper busy_timeout, the second process gets SQLITE_BUSY and the write fails.

**Why it happens in THIS system:** Claude Code fires hooks as separate process invocations. The hook dispatcher (`dynamo-hooks.cjs`) is a fresh Node.js process each time. If PostToolUse fires while UserPromptSubmit is still running (both touch the session index), they're two independent processes accessing the same SQLite file.

The current `sessions.json` approach has the same fundamental problem (two processes writing JSON simultaneously can corrupt the file), but atomic write (tmp+rename) mitigates it for JSON. SQLite has better built-in concurrency support -- but only if configured correctly.

**Consequences:** Intermittent SQLITE_BUSY errors cause session writes to fail silently (caught by the hook error handler). Session index becomes stale or missing entries. User's session list is incomplete. Over time, the session index diverges from reality.

**Prevention:**
1. Open every database connection with WAL mode enabled (`PRAGMA journal_mode=WAL`) and busy_timeout set (`PRAGMA busy_timeout=5000` or constructor option `timeout: 5000`). Verified these both work on Node.js v24.13.1 with `node:sqlite`.
2. Keep transactions short. Open, write, close. Do not hold the database connection open for the duration of hook processing -- open it, execute the query/write, close immediately.
3. Wrap all write operations in explicit transactions (`BEGIN IMMEDIATE; ... COMMIT;`). IMMEDIATE transactions acquire a write lock immediately rather than upgrading from a read lock, avoiding deadlock scenarios.
4. Design the schema so most hook invocations are READ-ONLY (checking session exists, reading metadata). Only SessionStart and Stop need writes. This minimizes write contention.
5. Test concurrent access explicitly: spawn 5 parallel Node.js processes that all write to the same SQLite DB simultaneously, verify all writes succeed.

**Detection:** A stress test that simulates rapid hook firing: 10 concurrent processes opening, writing, and closing the session DB. Verify zero SQLITE_BUSY errors and all writes persist.

**Phase:** Part of MGMT-11 (SQLite session index). Must be validated before any hook handler touches the SQLite DB.

---

### MP-04: Schema Migration Without ORM Becomes Fragile

**What goes wrong:** You create SQLite schema v1 for the session index. Later milestones need to add columns, change types, or add tables. Without an ORM's migration framework, you're writing raw `ALTER TABLE` statements. A migration that works on a fresh database fails on an existing one because the column already exists, or because SQLite doesn't support dropping columns (before SQLite 3.35.0).

**Why it happens in THIS system:** Dynamo already has a migration harness (`migrate.cjs`) that tracks version state via the VERSION file and runs CJS migration scripts. But this harness was designed for configuration migrations, not schema migrations. The existing pattern:

```javascript
module.exports = {
  version: '1.3.0',
  up: async (config) => { /* modify config.json */ },
  down: async (config) => { /* revert config.json */ }
};
```

Schema migrations are different because:
- SQLite `ALTER TABLE` has limited capabilities (add column: yes; drop column: only in SQLite >= 3.35.0; change type: no)
- Schema state lives in the database itself, not in a version file
- Failed schema migration can leave the database in an inconsistent state

**Consequences:** A user who updates from v1.3.0 to v1.3.5 needs schema changes applied. If the migration fails midway, the database is corrupted and the session index is unusable. Unlike config files, there's no simple "restore from .bak" for a half-migrated database.

**Prevention:**
1. Use `PRAGMA user_version` to track schema version independently from the app VERSION file. Check it on every database open.
2. Wrap every schema migration in a transaction. SQLite supports transactional DDL (`CREATE TABLE`, `ALTER TABLE` inside transactions). If any statement fails, the whole migration rolls back.
3. Design the initial schema with room to grow. Add a `metadata TEXT` column (JSON blob) that can hold future fields without schema changes.
4. Create a backup of the SQLite file before running migrations: `cp sessions.db sessions.db.bak`. This is the same pattern used for `settings.json`.
5. Prefer additive migrations (add column, add table) over destructive ones (drop column, rename column). SQLite's limitations actually help here -- they force you toward safe patterns.
6. Keep the schema simple. The session index is a denormalization for performance. If the schema gets complicated, you've gone too far.

**Detection:** Migration test that creates a v1 database, runs all migrations to latest, and verifies the final schema matches expectations. Run this in CI with every schema change.

**Phase:** Schema migration infrastructure built alongside the initial SQLite implementation in MGMT-11. First migration is the initial schema creation.

---

### MP-05: Jailbreak Protection False Positives Block Legitimate Hooks

**What goes wrong:** You add input validation to the hook dispatcher to detect prompt injection attempts in the stdin JSON. The validation is too aggressive: it flags legitimate user prompts that happen to contain code blocks, system-prompt-like patterns, or instructions that look like injection attempts. The hook blocks the event, and the user's prompt loses its memory augmentation.

**Why it happens in THIS system:** Claude Code sends the full user prompt in the hook event JSON for `UserPromptSubmit`. A developer working on prompt engineering, LLM security research, or writing CLAUDE.md files will routinely write prompts that contain:

- "You are a..." (system prompt pattern)
- "Ignore previous instructions" (jailbreak pattern)
- Code blocks with `process.exit`, `require`, `eval` (code injection patterns)
- JSON structures that contain nested hook event fields (structure injection)

All of these are legitimate user activities. But a naive jailbreak detector flags them.

Additionally, Claude Code's hook event JSON includes `transcript_path` and `cwd` fields that could be used as file path injection vectors. The REAL threat model is:

1. **JSON structure injection:** Malicious content in a user prompt that, when parsed as part of the hook event JSON, alters the event's structure (e.g., overwriting `hook_event_name`).
2. **Path traversal:** Content that causes hook handlers to read/write files outside expected directories.
3. **Content injection into knowledge graph:** Malicious content that gets stored in the knowledge graph and then injected into future sessions.

**Consequences:** False positives: legitimate prompts get blocked or stripped, breaking the memory augmentation flow. Users notice degraded behavior and lose trust. False negatives: actual injection attempts pass through because the validator was tuned to reduce false positives.

**Prevention:**
1. Validate the JSON STRUCTURE, not the JSON CONTENT. Verify that `hook_event_name` is one of the expected values, that `session_id` matches expected format, that `cwd` is a real directory. Do NOT scan `prompt` or `data` content for injection patterns -- that's the LLM's job.
2. Use allowlist validation, not blocklist. Define what valid hook events look like (field types, value ranges) and reject anything that doesn't match. Don't try to enumerate all possible attacks.
3. Sanitize paths: verify `cwd` resolves to a real directory, verify `transcript_path` is under a Claude Code-managed directory. This prevents path traversal.
4. For knowledge graph injection: sanitize BEFORE writing, not when reading. Strip or escape control characters, limit content length, validate that episode content is a reasonable string. This is Ledger's responsibility, not the dispatcher's.
5. Keep validation fast. The hot path budget is <500ms total. Jailbreak validation should add <10ms. Use regex-based structure checks, not LLM-based content analysis, for the hook dispatcher.

**Detection:** Test with a corpus of legitimate prompts that LOOK like injection attempts (prompts about LLM security, prompts containing code, prompts with markdown, etc.) and verify none are blocked.

**Phase:** MGMT-08 (Jailbreak protection). Should be implemented AFTER the restructure is stable, as restructure + security hardening simultaneously creates too much change surface.

---

### MP-06: Model Selection Routing Adds Latency to Hot Path

**What goes wrong:** MENH-07 (model selection) adds per-path model routing: Haiku for hot path, Sonnet for deliberation. The routing logic itself -- loading config, evaluating conditions, selecting model, constructing the right transport call -- adds overhead to every hook invocation. Combined with the transport abstraction setup (MENH-06), the cumulative overhead pushes UserPromptSubmit past the 500ms budget.

**Why it happens in THIS system:** The current system has a single code path for LLM calls (OpenRouter, Haiku, fixed config). Model selection introduces branching logic:

```
1. Load config (which model for this event type?)
2. Check event type (hot path or deliberation?)
3. Select transport (OpenRouter or Anthropic API?)
4. Construct request (provider-specific format)
5. Send request
6. Parse response (provider-specific format)
7. Return normalized result
```

Steps 1-4 and 6 are new overhead. If implemented naively (re-reading config on every call, constructing new transport instances, etc.), each adds 5-20ms. That's 25-100ms of overhead before the actual LLM call even starts.

**Consequences:** UserPromptSubmit exceeds 500ms budget. User perceives lag in prompt processing. In extreme cases, Claude Code's hook timeout kills the process before it completes.

**Prevention:**
1. Cache config and transport instances. Don't re-read `config.json` or create new transport objects on every hook invocation. Load once at module require time.
2. Model selection should be a simple lookup table, not a decision tree. Map event type to model at configuration time, not at call time.
3. Benchmark the overhead of model selection independently before integrating it into the hook path. Target: <5ms for the entire selection + transport setup.
4. If the Anthropic API path has higher latency than OpenRouter (cold start, TLS negotiation, etc.), default to OpenRouter for the hot path and reserve Anthropic API for background/deliberation paths only.
5. The hot path (UserPromptSubmit) should have zero LLM calls in v1.3-M1. The current curation call via Haiku is an existing cost -- model selection shouldn't add new LLM calls, just change which model an existing call targets.

**Detection:** Latency logging in the hook dispatcher. Track time from stdin parse to stdout write. Alert if p95 exceeds 400ms (leaving 100ms buffer before the 500ms budget).

**Phase:** MENH-07 follows MENH-06. Benchmark after MENH-06 to establish baseline before adding model selection.

---

## Minor Pitfalls

Issues that cause friction, tech debt, or minor bugs but have bounded impact.

---

### mP-01: Test Directory Structure Doesn't Match New Subsystem Layout

**What goes wrong:** Tests currently live in `dynamo/tests/ledger/` and `dynamo/tests/switchboard/`. After restructure, modules move to `subsystems/terminus/`, `subsystems/assay/`, etc. but tests may stay in the old structure. This creates a mismatch between code and test organization that makes it hard to find tests, and the `dynamo test` command's glob pattern breaks.

**Prevention:** Move test directories to mirror subsystem structure. Update the `dynamo test` command glob: `subsystems/*/tests/*.test.cjs` or a centralized test runner that discovers tests by convention.

**Phase:** Part of the directory restructure task. Tests move with their modules.

---

### mP-02: ExperimentalWarning Noise from node:sqlite

**What goes wrong:** Every hook invocation that uses SQLite prints `ExperimentalWarning: SQLite is an experimental feature` to stderr. Claude Code may capture this as error output or display it in verbose mode.

**Prevention:** Suppress the warning using `process.removeAllListeners('warning')` scoped to the SQLite import, or use `node --no-warnings` in the hook command (if Claude Code allows command flags). Alternatively, accept the warning and document that it's expected.

**Phase:** Address during MGMT-11 implementation. Low priority.

---

### mP-03: Dependency Management Bootstrap Problem

**What goes wrong:** MGMT-01 (dependency management) makes Dynamo manage its own dependencies. But the dependency manager itself has to work before dependencies are resolved. If the first-run experience requires dependencies that aren't yet available, the system can't bootstrap.

**Prevention:** The dependency manager must have zero dependencies itself (already satisfied by the zero-dep constraint). First-run detection should use only Node.js built-ins. The dependency system should be additive -- it manages OPTIONAL dependencies (like checking for specific Node.js features), not hard requirements.

**Phase:** MGMT-01 early in M1, designed as a feature-detection system rather than a package manager.

---

### mP-04: Graphiti Docker Directory Reference Changes

**What goes wrong:** The `graphiti/` directory currently lives under `ledger/graphiti/`. The restructure moves it to top-level `graphiti/` (per TERMINUS-SPEC.md Section 6.4). Every reference to `ledger/graphiti/docker-compose.yml` breaks.

**Prevention:** Reference the graphiti directory through config (`config.json -> graphiti.docker_compose_path`) rather than hardcoded paths. Update all references in one pass: `stack.cjs`, `install.cjs`, `health-check.cjs`, `stages.cjs`.

**Phase:** Part of the Terminus extraction task. Low risk if done atomically.

---

### mP-05: CLAUDE.md Template References Old Paths

**What goes wrong:** The `CLAUDE.md.template` (deployed to `~/.claude/CLAUDE.md`) contains hardcoded paths like `~/.claude/dynamo/hooks/dynamo-hooks.cjs` and instructions referencing the old directory structure. After restructure, the template is stale.

**Prevention:** Update the template as part of the restructure. Add a checklist item to the per-phase checklist (already documented in PROJECT.md).

**Phase:** Documentation update at the end of each restructure phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|-------------|---------------|------------|----------|
| Directory restructure | CP-01 (circular deps), CP-02 (dual-layout), CP-04 (test paths) | Build cycle detection test first, centralize path resolution | Critical |
| Sync/install update | CP-03 (path drift), CP-05 (settings.json) | Shared layout mapping, migration script | Critical |
| Transport abstraction (MENH-06) | MP-01 (leaky abstraction), MP-06 (latency) | Thin adapter pattern, cache transport instances | Moderate |
| Model selection (MENH-07) | MP-06 (latency on hot path) | Lookup table, benchmark overhead | Moderate |
| SQLite session index (MGMT-11) | MP-02 (experimental API), MP-03 (concurrent access), MP-04 (schema migration) | Wrapper module with fallback, WAL mode, PRAGMA user_version | Moderate |
| Jailbreak protection (MGMT-08) | MP-05 (false positives) | Structure validation not content scanning, allowlist approach | Moderate |
| Dependency management (MGMT-01) | mP-03 (bootstrap problem) | Feature detection, not package management | Minor |

---

## Integration Pitfalls: Restructuring a Live System

These pitfalls are specific to the fact that Dynamo is actively deployed at `~/.claude/dynamo/` and hooks fire on every Claude Code event while the restructure is underway.

---

### IP-01: Development Breaks Live Deployment During Restructure

**What goes wrong:** The developer (Claude Code agent) is restructuring files in the repo. They run `dynamo sync repo-to-live` to test. The sync deploys a half-restructured repo to `~/.claude/dynamo/`. Now hooks fire against the half-restructured code and crash. Every Claude Code session (including the development session) loses memory functionality until the restructure is complete.

**Prevention:**
1. Never run `dynamo sync` or `dynamo install` during active restructure development. Only deploy once a restructure phase is complete and all tests pass.
2. Use `DYNAMO_DEV=1` environment variable during development to bypass the toggle gate, but understand this doesn't prevent sync/install from deploying broken code.
3. Consider adding a `dynamo toggle off` step at the start of restructure work and `dynamo toggle on` at the end. This prevents hooks from firing against stale code during development.
4. All restructure development should be done on the `dev` branch with no deploys. Deploy only when merging to `master` at milestone completion.

**Detection:** If hooks start failing during development, check `hook-errors.log` for MODULE_NOT_FOUND errors. This indicates a bad sync deployed half-restructured code.

---

### IP-02: Migration Path from Old Layout to New Layout

**What goes wrong:** When the user runs `dynamo update` after the restructure ships, the update system tries to apply changes to the old deployed layout. The update pulls new code (new layout) but the migration/verification steps expect the new layout to already be deployed.

**Prevention:**
1. The update system must handle the layout transition as a special migration. This migration:
   a. Backs up the old layout
   b. Copies the new layout (using the NEW install logic)
   c. Runs the settings.json path migration (CP-05)
   d. Verifies the new layout
   e. Cleans up old directories
2. This "layout migration" should be a dedicated migration script, not baked into install.cjs changes. The migration harness runs it during `dynamo update`.
3. Test the upgrade path: start with a deployed v1.2.1 layout, run `dynamo update`, verify the result is a working v1.3-M1 layout.

**Detection:** The update system's auto-rollback mechanism (backup + restore on failure) is the safety net. If the layout migration fails, the old layout is restored automatically.

---

### IP-03: Multiple Claude Code Sessions Share Deployed Code

**What goes wrong:** The user has multiple Claude Code windows open (different projects). All share the same `~/.claude/dynamo/` deployment. A deploy that's correct for one session may break another if the sessions have different expectations about the code.

**Prevention:** This is already mitigated by Dynamo's design -- all sessions share the same deployed code, and updates are atomic (copy tree, then rename). The risk during restructure is a partial deploy (sync interrupted, install failed midway). Keep the atomic write pattern: copy everything to a staging directory, then swap. The existing `dynamo-backup` mechanism provides rollback.

**Detection:** If one session works and another doesn't, the issue is likely a stale cached module in Node's require cache (which is per-process, so not actually shared). More likely: timing issue where one session triggered a hook between the old code being removed and the new code being copied. The solution is atomic deployment.

---

## Risk Summary

| Risk | Probability | Impact | Priority |
|------|-------------|--------|----------|
| CP-01: Circular dependencies | HIGH | HIGH | Address first |
| CP-02: Dual-layout breaks | HIGH | HIGH | Address first |
| CP-03: Sync/install drift | MEDIUM | HIGH | Address with layout mapping |
| CP-04: Test path breakage | HIGH | MEDIUM | Address before file moves |
| CP-05: Settings.json stale paths | MEDIUM | HIGH | Migration script required |
| MP-01: Transport leaky abstraction | MEDIUM | MEDIUM | Thin adapter pattern |
| MP-02: node:sqlite experimental | LOW | MEDIUM | Wrapper with fallback |
| MP-03: SQLite concurrent access | MEDIUM | MEDIUM | WAL + busy_timeout |
| MP-04: Schema migration fragility | LOW | MEDIUM | Transactional DDL |
| MP-05: Jailbreak false positives | MEDIUM | MEDIUM | Structure validation only |
| MP-06: Model selection latency | LOW | MEDIUM | Cache + benchmark |
| IP-01: Live system breaks during dev | MEDIUM | HIGH | Toggle off during restructure |
| IP-02: Old-to-new layout migration | MEDIUM | HIGH | Dedicated migration script |

---

## Recommended Phase Ordering Based on Pitfalls

Based on the dependency chain of pitfalls, the restructure should proceed in this order:

1. **Infrastructure tests first:** Build cycle detection test, centralize path resolution in `lib/core.cjs`, create test helper for REPO_ROOT resolution. (Addresses CP-01, CP-02, CP-04)
2. **Layout mapping module:** Extract directory structure into `lib/layout.cjs` shared by sync, install, and tests. (Addresses CP-03)
3. **File moves in dependency order:** `lib/` first, then `subsystems/terminus/` (leaf), then `subsystems/assay/` (leaf), then `subsystems/ledger/` (leaf), then `cc/` (platform adapter), then `subsystems/switchboard/` (hub), then update `dynamo.cjs` (entry point). (Minimizes CP-01 risk)
4. **Sync/install update:** Update both simultaneously with new layout mapping. (Addresses CP-03)
5. **Migration script for settings.json:** Write and test the hook path migration. (Addresses CP-05)
6. **Transport abstraction (MENH-06):** Build Anthropic adapter alongside existing OpenRouter. (Addresses MP-01)
7. **Model selection (MENH-07):** Lookup table routing on top of transport layer. (Addresses MP-06)
8. **SQLite session index (MGMT-11):** Wrapper module, fallback support, concurrent access tests. (Addresses MP-02, MP-03, MP-04)
9. **Jailbreak protection (MGMT-08):** Structure validation in dispatcher. (Addresses MP-05)
10. **Dependency management (MGMT-01):** Feature detection system. (Addresses mP-03)

---

## Sources

- Codebase analysis: `core.cjs`, `dynamo.cjs`, `dynamo-hooks.cjs`, `sync.cjs`, `install.cjs`, `mcp-client.cjs`, `sessions.cjs`, `curation.cjs`, `boundary.test.cjs`
- Architecture specs: `DYNAMO-PRD.md`, `TERMINUS-SPEC.md`, `SWITCHBOARD-SPEC.md`
- [Node.js SQLite Documentation](https://nodejs.org/api/sqlite.html) -- node:sqlite API reference, DatabaseSync class, experimental/RC status
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) -- hook event types, JSON format, timeout limits, output structure
- [Node.js CJS Circular Dependencies](https://nodejs.org/api/modules.html) -- official docs on how CJS handles circular require()
- [Circular Dependencies in JavaScript](https://medium.com/visual-development/how-to-fix-nasty-circular-dependency-issues-once-and-for-all-in-javascript-typescript-a04c987cf0de) -- patterns for fixing cycles
- [Anthropic API Overview](https://platform.claude.com/docs/en/api/overview) -- Messages API format, headers, authentication
- [OpenRouter Quickstart](https://openrouter.ai/docs/quickstart) -- OpenRouter API format for comparison
- [SQLite WAL Mode](https://sqlite.org/wal.html) -- WAL concurrency characteristics
- [CVE-2025-54794: Claude AI Prompt Injection](https://github.com/AdityaBhatt3010/CVE-2025-54794-Hijacking-Claude-AI-with-a-Prompt-Injection-The-Jailbreak-That-Talked-Back) -- real-world prompt injection in Claude
- [Mitigate Jailbreaks - Claude API Docs](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks) -- Anthropic's guidance on jailbreak mitigation
- [SQLite Schema Migration Strategies](https://sqlite.org/forum/forumpost/0f9dd8806f) -- pragmatic migration approaches without ORMs
- Local verification: `node:sqlite` DatabaseSync, WAL mode, and busy_timeout all confirmed working on Node.js v24.13.1

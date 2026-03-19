# Feature Research: v1.3-M1 Foundation and Infrastructure Refactor

**Domain:** Claude Code power-user platform -- directory restructure, transport abstraction, security hardening, session persistence
**Researched:** 2026-03-19
**Confidence:** HIGH (existing specs provide detailed requirements; research validates feasibility and patterns)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that must work correctly or the milestone is incomplete. "Users" here means both the human operator and Claude Code sessions consuming hooks.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Directory restructure with zero downtime** | Deployed `~/.claude/dynamo/` must continue working during and after migration from 3-dir to 6-subsystem layout | HIGH | 31 CJS files moving across directories; all import paths change; deployed layout and repo layout must both resolve. Re-export shims at old paths provide backward compat during transition. |
| **Re-export shims at old import paths** | Any consumer (hooks, CLI, core.cjs re-exports) that references `ledger/search.cjs` must continue working until all imports are updated | LOW | Thin `module.exports = require('../subsystems/assay/search');` files. Remove after all consumers updated. |
| **Settings.json hook path migration** | Hook dispatcher path changes from `~/.claude/dynamo/hooks/dynamo-hooks.cjs` to `~/.claude/dynamo/cc/hooks/dynamo-hooks.cjs`; if not updated, all hooks silently stop | MEDIUM | Must be handled by install migration. Breaking change requiring settings.json rewrite. |
| **Transport fallback chain** | When OpenRouter is down, Haiku calls must not silently fail. Must have at least one fallback transport. | MEDIUM | Current SPOF: OpenRouter. Must support direct Anthropic API as primary and OpenRouter as fallback (or vice versa). |
| **Model calls continue working during transport refactor** | Session naming, curation, and summarization must not break while transport layer is restructured | MEDIUM | Contract preservation: `callHaiku(promptName, variables, options)` interface must remain stable regardless of backend transport. |
| **SQLite sessions backward-compatible interface** | `listSessions()`, `viewSession()`, `labelSession()` etc. must keep identical signatures and return shapes | MEDIUM | Backend swap from JSON to SQLite is internal. Consumers never know. Migration must import existing sessions.json data. |
| **Existing test suite passes after restructure** | 374 tests must remain green. Relocated files must update test imports. | HIGH | Tests reference file paths directly. Every moved file means test import updates. This is the highest-effort mechanical task. |

### Differentiators (Competitive Advantage)

Features that go beyond "don't break things" into genuine capability improvement.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Direct Anthropic API transport (MENH-06)** | Eliminates OpenRouter SPOF; enables using Max subscription API credits directly; ~0ms routing overhead vs OpenRouter's 50-200ms | MEDIUM | Simple REST POST to `https://api.anthropic.com/v1/messages` with `x-api-key`, `anthropic-version`, `content-type` headers. Zero dependency -- uses Node.js built-in `fetch`. |
| **Per-path model selection (MENH-07)** | Haiku for hot path ($0.001/call), Sonnet for deliberation ($0.015/call). 95/5 split saves ~85% vs uniform Sonnet. | MEDIUM | Config-driven model routing: `config.models.hotPath = "claude-haiku-4.5"`, `config.models.deliberation = "claude-sonnet-4-6"`. Transport layer resolves model to appropriate API endpoint. |
| **Claude Code native Haiku via subagent** | Subscription users can call Haiku at zero marginal cost through Claude Code's built-in subagent model selection (`model: haiku`) | LOW | Claude Code subagents support `model: haiku` in agent definitions. Zero API cost for Max subscribers. Bypasses both OpenRouter and direct API. |
| **Self-contained dependency management (MGMT-01)** | Dynamo verifies and manages its own dependencies (correct Node version, Docker, Graphiti stack) without manual user checks | MEDIUM | Health check + install flow already exists. This extends it to proactive dependency verification and guided remediation. |
| **Jailbreak/injection protection (MGMT-08)** | Hook system hardened against prompt injection via stdin JSON that could manipulate `additionalContext` injection | HIGH | Multi-layer defense: input validation, output sanitization, canary detection, instruction hierarchy enforcement. Critical because hooks inject directly into Claude's context window. |
| **SQLite session index with query performance (MGMT-11)** | Sessions queryable by project, date range, label pattern. O(log n) lookups vs O(n) JSON scan. Supports thousands of sessions. | MEDIUM | `node:sqlite` is Release Candidate in Node 24.x. Synchronous API (DatabaseSync) matches existing sync session code. Zero dependency -- built into Node.js. |
| **Platform adapter pattern (cc/ directory)** | Isolates all Claude Code specifics into `cc/`. Enables future `/web`, `/api` adapters without touching subsystem logic. | MEDIUM | Architectural differentiator. Most hook-based systems hardcode platform integration. `cc/` pattern enables Claudia-scale extensibility. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Explicitly scoped out of M1.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Use @anthropic-ai/sdk npm package** | Official SDK with type safety, streaming, retries built-in | Violates zero-dependency constraint. Adds npm/package.json. The SDK is 200KB+ with transitive deps. The Anthropic API is a trivial REST POST -- a 30-line fetch wrapper provides everything needed. | Direct `fetch()` to `https://api.anthropic.com/v1/messages` with 3 headers. Already proven pattern in `curation.cjs`. |
| **Use better-sqlite3 npm package** | Most popular SQLite lib for Node.js. Faster than native. WAL mode support. | Violates zero-dependency constraint. Requires native compilation (node-gyp, Python, C++ toolchain). Breaks on some macOS versions without Xcode CLT. | `node:sqlite` built-in module. Release Candidate in Node 24.x (current: v24.13.1). Synchronous API matches codebase patterns. Zero install friction. |
| **Dynamic handler registration** | Subsystems register their own hook handlers at startup instead of static routing table | Adds discovery overhead to <500ms hot path. Creates registration protocol, persistence, conflict resolution. The handler list is known at build time and changes only on update. | Static routing table in dispatcher. Updated during install/update. Visible in one place. |
| **ESM migration during restructure** | "While we're moving files, why not convert to ESM?" | Scope explosion. ESM changes every `require()` to `import`, every `module.exports` to `export`. Doubles the restructure effort. CJS is the ecosystem standard for Claude Code hooks and GSD framework. | Stay CJS. This is a validated decision (see KEY DECISIONS in PROJECT.md). ESM provides no benefit for this codebase. |
| **Async SQLite (node:sqlite/promises)** | Non-blocking database access for high concurrency | `node:sqlite` currently offers only `DatabaseSync` (synchronous). Sessions are queried serially in hook handlers. Async adds complexity without benefit for single-threaded hook execution. | Synchronous `DatabaseSync` matches existing `loadSessions`/`saveSessions` patterns. Sessions are never queried concurrently. |
| **Full prompt injection ML classifier** | ML-based detection of sophisticated injection attacks | Requires ML model, inference time, training data. Overkill for a hook system where the attack surface is stdin JSON with known schema. | Pattern-based validation: schema enforcement, field-length limits, character blocklists, canary tokens. Covers 95% of realistic attacks on this system. |
| **Connection pooling for MCP client** | Persistent connections for better latency | Current stateless per-request HTTP is simple and within latency budgets. 5-30 requests per session. Pooling adds lifecycle management complexity. | Per-request fetch with AbortSignal timeout. Revisit if MCP latency becomes a measured bottleneck. |

---

## Feature Dependencies

```
Directory Restructure
    |
    +--requires--> Re-export shims (backward compat during transition)
    |
    +--requires--> Settings.json hook path migration
    |
    +--requires--> Test suite import path updates
    |
    +--enables--> cc/ platform adapter pattern
    |
    +--enables--> subsystems/ directory (homes for all 6 subsystems)

Transport Flexibility (MENH-06)
    |
    +--requires--> Directory restructure (transport code moves to subsystems/terminus/)
    |
    +--enables--> Model Selection (MENH-07)
    |
    +--enables--> Native Haiku via subagent (zero-cost for Max subscribers)

Model Selection (MENH-07)
    |
    +--requires--> Transport Flexibility (MENH-06)
    |
    +--enables--> Reverie dual-path routing (M2: CORTEX-02)

Jailbreak Protection (MGMT-08)
    |
    +--requires--> Directory restructure (dispatcher moves to cc/hooks/)
    |
    +--enhances--> Hook dispatcher (Switchboard)
    |
    +--independent-of--> Transport, SQLite, Dependency Management

SQLite Session Index (MGMT-11)
    |
    +--requires--> Directory restructure (sessions.cjs moves to subsystems/assay/)
    |
    +--requires--> Node.js 22.13+ (node:sqlite without --experimental flag)
    |
    +--independent-of--> Transport, Jailbreak Protection

Dependency Management (MGMT-01)
    |
    +--enhances--> Install system (Switchboard)
    |
    +--enhances--> Health check (Terminus)
    |
    +--independent-of--> Transport, SQLite, Jailbreak Protection
```

### Dependency Notes

- **Directory restructure is the foundation.** Every other M1 feature depends on files being in their new locations. It must be completed first, or at minimum in a coordinated wave where files move and features are built in the new locations.
- **MENH-06 enables MENH-07.** Transport flexibility (provider abstraction) must exist before per-path model selection can route to different providers/models. These are a natural pair -- build the abstraction, then add the routing.
- **MGMT-08 is independent** but benefits from the restructure. Jailbreak protection hardens the dispatcher, which moves to `cc/hooks/`. Building protection in the new location avoids having to port security code.
- **MGMT-11 is independent** but benefits from the restructure. SQLite replaces `sessions.json` inside Assay's module. Building it in `subsystems/assay/` avoids patching old `ledger/sessions.cjs`.
- **MGMT-01 is independent.** Dependency management extends the existing install and health check systems. No dependency on the other M1 features.

---

## Feature Detail

### 1. Directory Restructure (3-dir to 6-subsystem)

**What it is:** Move from `dynamo/`, `ledger/`, `switchboard/` flat layout to `subsystems/`, `cc/`, `lib/` hierarchical layout. This is the most mechanically complex feature in M1.

**Current state (31 CJS files across 3 directories):**
```
dynamo/           -> dynamo.cjs, core.cjs, hooks/dynamo-hooks.cjs
ledger/           -> curation.cjs, episodes.cjs, mcp-client.cjs, scope.cjs, search.cjs, sessions.cjs, hooks/5-handlers
switchboard/      -> install.cjs, sync.cjs, update.cjs, update-check.cjs, stack.cjs, health-check.cjs, diagnose.cjs, verify-memory.cjs, stages.cjs, migrate.cjs, pretty.cjs
```

**Target state (6 subsystem directories + platform adapter + shared lib):**
```
subsystems/switchboard/  -> install, sync, update, update-check
subsystems/assay/        -> search, sessions, inspect (new)
subsystems/ledger/       -> episodes, format (write-side curation)
subsystems/terminus/     -> mcp-client, stack, health-check, diagnose, verify-memory, stages, migrate
subsystems/reverie/      -> (empty stubs for M2)
cc/hooks/                -> dynamo-hooks.cjs (dispatcher)
cc/prompts/              -> curation.md, session-summary.md, session-name.md
cc/settings-hooks.json   -> hook definitions
cc/CLAUDE-TEMPLATE.MD    -> CLAUDE.md template
lib/                     -> core.cjs, scope.cjs, pretty.cjs, transport-utils.cjs
```

**Backward compatibility strategy:**
1. Move files to new locations
2. Create re-export shims at old locations: `module.exports = require('../subsystems/assay/search');`
3. Update all consumers to use new paths
4. Remove shims after all consumers updated
5. Update `settings.json` hook paths via install migration

**Complexity:** HIGH. 31 files moving, ~50 import path changes, ~374 test file imports to update, settings.json breaking change.

**Risk:** The dual-layout resolution pattern (`resolveCore()`, `resolveHandlers()`) must be replaced with standardized paths. The new layout eliminates the need for dual-resolution since both repo and deployed layouts will use the same relative paths.

### 2. Transport Flexibility (MENH-06)

**What it is:** Support multiple LLM transport backends so Dynamo is not dependent on OpenRouter as a single point of failure.

**Current state:** All LLM calls go through OpenRouter (`curation.cjs` -> `https://openrouter.ai/api/v1/chat/completions`). If OpenRouter is down or the API key expires, all curation, naming, and summarization fail silently (graceful degradation to uncurated output).

**Target transport providers (priority order):**

| Provider | Endpoint | Auth | Use Case | Cost (Haiku) |
|----------|----------|------|----------|-------------|
| **Anthropic Direct** | `https://api.anthropic.com/v1/messages` | `x-api-key` header + `anthropic-version` header | Primary for API-plan users | $0.80/MTok in, $4/MTok out |
| **OpenRouter** | `https://openrouter.ai/api/v1/chat/completions` | `Authorization: Bearer` header | Fallback; current default | $0.80/MTok in, $4/MTok out + markup |
| **Claude Code Native** | Subagent with `model: haiku` | Subscription auth (implicit) | Zero-cost for Max subscribers | $0 (subscription) |

**Implementation pattern -- Transport abstraction:**

```javascript
// lib/transport.cjs
class TransportManager {
  constructor(config) {
    this.providers = this.buildProviderChain(config);
  }

  async complete(messages, options = {}) {
    const model = options.model || this.config.models.default;
    for (const provider of this.providers) {
      try {
        return await provider.complete(messages, { ...options, model });
      } catch (err) {
        logError('transport', `${provider.name} failed: ${err.message}`);
        continue; // Try next provider in chain
      }
    }
    return { text: options.fallback || '', uncurated: true };
  }
}
```

Each provider implements a simple interface:
```javascript
// Provider interface
{
  name: string,
  available: () => boolean,  // Has API key or is native
  complete: async (messages, options) => { text: string }
}
```

**Anthropic Direct provider (zero-dependency):**
```javascript
async function anthropicComplete(messages, options) {
  const resp = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model || 'claude-haiku-4.5-20250514',
      max_tokens: options.maxTokens || 500,
      messages,
      temperature: options.temperature || 0.3
    })
  }, options.timeout || 10000);
  const data = await resp.json();
  return { text: data.content[0].text };
}
```

**Key design decision:** The Anthropic Messages API is a trivial REST endpoint. Three headers, a JSON body, a JSON response. The existing `fetchWithTimeout` utility handles it. No SDK needed.

**Complexity:** MEDIUM. The abstraction layer is straightforward. The work is in refactoring `curation.cjs`'s `callHaiku()` to use the transport manager instead of hardcoded OpenRouter calls.

### 3. Model Selection (MENH-07)

**What it is:** Per-path model selection so the hot path uses cheap Haiku and the deliberation path uses capable Sonnet.

**Config shape:**
```json
{
  "models": {
    "hotPath": "claude-haiku-4.5-20250514",
    "deliberation": "claude-sonnet-4-6-20250514",
    "default": "claude-haiku-4.5-20250514"
  },
  "transport": {
    "primary": "anthropic",
    "fallback": "openrouter",
    "providers": {
      "anthropic": { "enabled": true },
      "openrouter": { "enabled": true }
    }
  }
}
```

**Usage in hook handlers (future M2, but config laid in M1):**
```javascript
// Hot path (curation, naming): use Haiku
const result = await transport.complete(messages, { model: config.models.hotPath });

// Deliberation path (future: complex reasoning): use Sonnet
const result = await transport.complete(messages, { model: config.models.deliberation });
```

**Why M1 not M2:** The transport layer and model configuration must be in place before Reverie (M2) can implement dual-path routing. M1 builds the pipe; M2 decides what flows through it.

**Complexity:** LOW once MENH-06 is done. Model selection is a config lookup passed to the transport layer.

### 4. Dependency Management (MGMT-01)

**What it is:** Dynamo verifies and manages its own runtime dependencies.

**Dependencies to manage:**

| Dependency | Current Check | Target Check |
|------------|--------------|-------------|
| Node.js version | None (assumed) | `process.version >= 22.13.0` (for node:sqlite) |
| Docker | Health check stage 1 | Extend: version check, daemon running, compose available |
| Graphiti MCP | Health check stage 3-4 | Extend: version compatibility check |
| `.env` file | Health check stage 5 | Extend: required keys validation, format check |
| Disk space | None | Basic check for SQLite DB growth |
| Network | None | Reachability check for transport providers |

**Implementation:** Extend the existing install and health-check systems with a `checkDependencies()` function that runs during install, update, and on-demand via `dynamo check-deps`.

**Complexity:** MEDIUM. Mostly extending existing patterns.

### 5. Jailbreak Protection (MGMT-08)

**What it is:** Security hardening of the hook system to prevent prompt injection attacks via stdin JSON that manipulates `additionalContext` injection into Claude's context window.

**Attack surface analysis:**

The hook dispatcher receives JSON via stdin from Claude Code. This JSON includes user prompt text (`UserPromptSubmit`), tool output (`PostToolUse`), and file paths. The dispatcher processes this data and may inject `additionalContext` back into Claude's context. The attack chain:

```
Malicious content in file/prompt
  -> Tool reads file (PostToolUse)
  -> Hook receives tool output via stdin
  -> Hook processes content, includes in search/curation
  -> Curated content injected via additionalContext
  -> Claude processes injected content as trusted context
  -> Prompt injection executed
```

**Defense layers (defense in depth):**

| Layer | What It Does | Implementation |
|-------|-------------|----------------|
| **L1: Input schema validation** | Reject stdin JSON that does not match expected schema for the hook event type | JSON Schema validation against known event fields. Reject unexpected fields. Enforce field types and lengths. |
| **L2: Field length limits** | Prevent context stuffing via oversized fields | Max prompt length, max tool output length. Truncate with `[TRUNCATED]` marker. |
| **L3: Instruction boundary markers** | Wrap injected content with clear system/user boundaries | `[MEMORY CONTEXT - NOT USER INSTRUCTIONS]` prefix/suffix around all `additionalContext` content. |
| **L4: Pattern detection** | Detect common injection patterns in data flowing through hooks | Blocklist of instruction-like patterns in memory results: "ignore previous instructions", "you are now", "system:", etc. Flag but do not necessarily block (avoid false positives on legitimate content). |
| **L5: Canary token monitoring** | Detect if injected instructions are being followed | Embed hidden canary strings in system context. If they appear in Claude's output, injection may have occurred. Log for analysis. |
| **L6: Output sanitization** | Sanitize `additionalContext` before injection | Strip control characters, normalize Unicode, remove zero-width characters. Ensure output is plain text or known-safe markdown. |

**What NOT to build:**
- ML-based classifiers (overkill for known-schema stdin)
- Real-time blocking of all suspicious patterns (too many false positives)
- Encryption of hook payloads (unnecessary -- hooks run locally)

**Complexity:** HIGH. Security requires careful design, thorough testing, and ongoing maintenance. The pattern detection layer needs tuning to avoid false positives.

### 6. SQLite Session Index (MGMT-11)

**What it is:** Replace `sessions.json` flat file with SQLite database for scalable session queries.

**Current state:** `sessions.json` is a JSON array file. Every operation loads the entire file, scans/modifies in memory, and writes back atomically. Works fine for <100 sessions. Degrades at scale.

**Why `node:sqlite` (not better-sqlite3):**

| Criterion | node:sqlite | better-sqlite3 |
|-----------|------------|-----------------|
| Zero-dependency | YES -- built into Node 22.13+ | NO -- requires npm, node-gyp, C++ toolchain |
| Sync API | YES -- `DatabaseSync` class | YES -- synchronous by design |
| Node version required | 22.13+ (current: 24.13.1) | Any (14+) |
| Stability | Release Candidate (1.2) in Node 25.7+; available without flag in 22.13+ | Stable, battle-tested |
| Performance | Sufficient for session workload | Faster (2-3x), but irrelevant for 100-1000 sessions |
| Install friction | Zero | Requires: Python, C++ compiler, node-gyp |

**Decision:** Use `node:sqlite`. The zero-dependency constraint is non-negotiable. Node 24.13.1 (current) includes `node:sqlite` without the experimental flag. The session workload (hundreds to low thousands of records, single-digit queries per session) is trivially within `node:sqlite` performance envelope.

**Schema:**
```sql
CREATE TABLE sessions (
  timestamp TEXT PRIMARY KEY,
  project TEXT NOT NULL DEFAULT 'unknown',
  label TEXT DEFAULT '',
  labeled_by TEXT DEFAULT 'auto',
  named_phase TEXT DEFAULT ''
);

CREATE INDEX idx_sessions_project ON sessions(project);
CREATE INDEX idx_sessions_timestamp ON sessions(timestamp DESC);
```

**Migration from sessions.json:**
```javascript
function migrateSessionsJsonToSqlite(jsonPath, dbPath) {
  const sessions = loadSessions(jsonPath);  // Existing function
  const db = new DatabaseSync(dbPath);
  db.exec(SCHEMA_SQL);
  const insert = db.prepare(
    'INSERT OR IGNORE INTO sessions (timestamp, project, label, labeled_by, named_phase) VALUES (?, ?, ?, ?, ?)'
  );
  for (const s of sessions) {
    insert.run(s.timestamp, s.project || 'unknown', s.label || '', s.labeled_by || 'auto', s.named_phase || '');
  }
  // Keep sessions.json as backup; remove after validation
}
```

**Interface preservation (critical):**
```javascript
// BEFORE (JSON):
function listSessions(options) {
  let sessions = loadSessions(filePath);
  if (options.project) sessions = sessions.filter(s => s.project === options.project);
  sessions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  if (options.limit) sessions = sessions.slice(0, options.limit);
  return sessions;
}

// AFTER (SQLite):
function listSessions(options) {
  const db = openSessionDB(options);
  let sql = 'SELECT * FROM sessions';
  const params = [];
  if (options.project) { sql += ' WHERE project = ?'; params.push(options.project); }
  sql += ' ORDER BY timestamp DESC';
  if (options.limit) { sql += ' LIMIT ?'; params.push(options.limit); }
  return db.prepare(sql).all(...params);
}
```

**Same function signature, same return shape, different backend.** Consumers never know.

**Complexity:** MEDIUM. Schema is simple. Migration is straightforward. Main effort is ensuring the interface contract is preserved and tests cover edge cases.

---

## MVP Definition

### Launch With (M1)

Must-have for M1 to be considered complete:

- [x] **Directory restructure** -- Files in new locations, imports updated, shims in place, tests green
- [x] **Settings.json migration** -- Hook paths point to `cc/hooks/dynamo-hooks.cjs`
- [x] **Transport abstraction** (MENH-06) -- At least Anthropic Direct + OpenRouter with fallback chain
- [x] **Model config** (MENH-07) -- Config structure for per-path model selection, used by curation calls
- [x] **Jailbreak protection** (MGMT-08) -- L1 (schema validation) + L3 (boundary markers) + L6 (output sanitization) at minimum
- [x] **SQLite sessions** (MGMT-11) -- Sessions in SQLite, migration from JSON, identical interface
- [x] **Dependency checks** (MGMT-01) -- Node version check, Docker check, .env validation

### Add After Validation (M1 polish)

Features to add once core M1 is working:

- [ ] **L2 field length limits** -- After seeing real-world field sizes in production
- [ ] **L4 pattern detection** -- After tuning against real memory content to avoid false positives
- [ ] **L5 canary tokens** -- After core injection protection is proven
- [ ] **Native Haiku via subagent** -- After transport abstraction proves stable; requires testing Claude Code's subagent model routing
- [ ] **Shim removal** -- After all consumers confirmed on new import paths; final cleanup task

### Future Consideration (M2+)

Features explicitly deferred to later milestones:

- [ ] **Connection pooling** (Terminus) -- Only if MCP latency is measured as bottleneck
- [ ] **Search result caching** (Assay) -- Deferred to M2 per ASSAY-SPEC.md open question 7.5
- [ ] **Transport provider hot-switching** -- Change provider at runtime without restart; adds complexity with minimal benefit
- [ ] **Health check result persistence** -- Historical tracking per TERMINUS-SPEC.md open question 7.4

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Dependency |
|---------|------------|---------------------|----------|------------|
| Directory restructure | HIGH (unblocks everything) | HIGH (31 files, 374 tests) | P1 | None |
| Settings.json migration | HIGH (hooks die without it) | LOW (install step) | P1 | Directory restructure |
| Transport abstraction (MENH-06) | HIGH (removes SPOF) | MEDIUM (new transport.cjs) | P1 | Directory restructure |
| Model selection (MENH-07) | MEDIUM (enables M2) | LOW (config + routing) | P1 | MENH-06 |
| Jailbreak protection (MGMT-08) | HIGH (security) | HIGH (multi-layer) | P1 | Directory restructure |
| SQLite sessions (MGMT-11) | MEDIUM (scalability) | MEDIUM (schema + migration) | P2 | Directory restructure |
| Dependency management (MGMT-01) | MEDIUM (self-management) | MEDIUM (extending existing) | P2 | Directory restructure |
| Re-export shims | LOW (transitional) | LOW (thin files) | P1 (temporary) | Created during restructure |
| Test suite migration | HIGH (quality gate) | HIGH (mechanical) | P1 | Part of restructure |

**Priority key:**
- P1: Must have for M1 completion. Blocks M2.
- P2: Should have. Valuable but M2 not blocked without it.

---

## Competitor Feature Analysis

| Feature | Aider (multi-provider LLM) | Claude-Mem (hook-based memory) | LiteLLM (LLM gateway) | Dynamo Approach |
|---------|---------------------------|-------------------------------|----------------------|-----------------|
| **Transport abstraction** | Via LiteLLM library (Python) | Single-provider (OpenAI) | Dedicated proxy server | Lightweight CJS transport manager; zero deps; fallback chain |
| **Model routing** | Per-action model selection | No model routing | Config-based routing | Config-driven per-path selection (hot/deliberation) |
| **Security** | Tool permission system | Basic hook validation | API key management | Multi-layer injection protection on hook stdin/stdout |
| **Session persistence** | Git-based (edit history) | In-memory only | N/A (gateway only) | SQLite with node:sqlite; schema-indexed queries |
| **Zero dependencies** | No (Python + pip deps) | No (npm deps) | No (Python + pip) | Yes -- pure Node.js built-ins |
| **Self-management** | Manual config | Manual config | Docker deployment | Full CLI lifecycle (install/sync/update/rollback) |

---

## Sources

### Transport and API
- [Anthropic Messages API](https://platform.claude.com/docs/en/api/messages) -- REST endpoint, headers, request format (HIGH confidence)
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript) -- Official SDK reference, confirms REST simplicity (HIGH confidence)
- [OpenRouter Provider Routing](https://openrouter.ai/docs/guides/routing/provider-selection) -- Multi-provider routing patterns (MEDIUM confidence)
- [Aider Multi-Provider Integration](https://deepwiki.com/Aider-AI/aider/6.3-multi-provider-llm-integration) -- Transport abstraction patterns (MEDIUM confidence)

### Claude Code Hooks and Security
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) -- Official hook architecture, stdin format, additionalContext (HIGH confidence)
- [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents) -- Model selection per subagent (HIGH confidence)
- [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) -- Prompt injection taxonomy (HIGH confidence)
- [System Prompt Hardening](https://securityboulevard.com/2026/03/introducing-system-prompt-hardening-production-ready-protection-for-system-prompts/) -- Defense patterns (MEDIUM confidence)
- [Lasso Claude Hooks Security](https://github.com/lasso-security/claude-hooks) -- Hook-specific injection defense (MEDIUM confidence)

### SQLite and Session Storage
- [Node.js node:sqlite Documentation](https://nodejs.org/api/sqlite.html) -- Release Candidate status, DatabaseSync API (HIGH confidence)
- [Native SQLite in Node.js Guide](https://betterstack.com/community/guides/scaling-nodejs/nodejs-sqlite/) -- Usage patterns, stability trajectory (HIGH confidence)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) -- Alternative considered and rejected per zero-dep constraint (HIGH confidence)

### Directory Restructure
- [Node.js Modules: Packages](https://nodejs.org/api/packages.html) -- CJS module resolution, exports field (HIGH confidence)
- Internal: DYNAMO-PRD.md, SWITCHBOARD-SPEC.md, ASSAY-SPEC.md, TERMINUS-SPEC.md, LEDGER-SPEC.md -- Detailed migration paths (HIGH confidence)

---
*Feature research for: v1.3-M1 Foundation and Infrastructure Refactor*
*Researched: 2026-03-19*

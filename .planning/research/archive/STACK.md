# Stack Research

**Domain:** CJS/Node architectural rewrite of Claude Code enhancement platform (Dynamo)
**Researched:** 2026-03-17
**Confidence:** HIGH — verified against installed runtime (Node v24.13.1), GSD source code (v1.25.1), existing hooks, Claude Code official docs, and npm registry

---

## Why CJS, Not ESM

This is the most important decision to understand up front. The answer is short: **follow GSD's proven pattern**.

| Factor | CJS | ESM |
|--------|-----|-----|
| GSD framework compatibility | Native — GSD is 100% CJS (.cjs files, `require()`, `module.exports`) | Would require interop layer or fork |
| `~/.claude/package.json` | Already set to `{"type":"commonjs"}` | Changing would break existing GSD hooks |
| Existing Dynamo hooks | 3 JS hooks already use CJS (`require('fs')`, `require('path')`) | Would need rewriting |
| Claude Code hook execution | Hooks run as `node script.js` — CJS starts ~20ms faster (no module resolution overhead) | ESM adds startup latency in hook-critical paths |
| Node.js 24 support | Fully supported, not deprecated, explicitly maintained | Recommended for new projects but not required |
| Dynamic require from hooks | `require()` is synchronous — critical for hooks with 5-15s timeouts | `import()` is async — adds complexity in time-constrained hooks |
| Ecosystem direction | ESM is the future, but CJS is explicitly not being removed | — |

**Decision: CJS.** Because GSD is CJS, the Claude runtime is CJS, and hooks need synchronous fast-path execution. ESM would gain us nothing and force interop complexity. When/if GSD migrates to ESM (unlikely near-term given v1.25.1 is pure CJS), we can migrate then.

**Confidence: HIGH** — Verified by reading GSD source (14 `.cjs` files, zero `.mjs` files, zero `import` statements), `~/.claude/package.json` content, and 3 existing JS hooks all using `require()`.

---

## Recommended Stack

### Core Runtime

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | v24.x (LTS Oct 2025+) | Runtime | Already installed (v24.13.1). LTS = stable for production. Built-in `fetch`, `node:test`, `node:assert` eliminate external deps. |

**No framework.** Dynamo is a CLI tool + hook library, not a web app. Express, Fastify, etc. are irrelevant. Follow GSD's pattern: pure Node.js with zero framework dependency.

### Module System

| Pattern | Source | Purpose |
|---------|--------|---------|
| `require()` / `module.exports` | GSD convention | Module loading |
| `.cjs` file extension | GSD convention | Explicit CJS marking (avoids ambiguity even though `package.json` sets `"type": "commonjs"`) |
| Single entry point + lib/ modules | GSD `gsd-tools.cjs` pattern | CLI router delegates to focused modules |

**Architecture pattern from GSD:**
```
bin/
  dynamo.cjs              # CLI entry point (like gsd-tools.cjs)
  lib/
    core.cjs              # Shared utilities, output helpers, error handling
    graphiti-client.cjs   # MCP client (replaces Python MCPClient class)
    hooks.cjs             # Hook I/O helpers (stdin parsing, JSON output)
    health.cjs            # Health check logic (replaces health-check.py)
    sessions.cjs          # Session management (replaces session commands in graphiti-helper.py)
    curation.cjs          # LLM curation via OpenRouter (replaces Python curate_results)
    project.cjs           # Project detection (replaces detect-project)
    config.cjs            # Dynamo configuration
```

### HTTP Client

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `globalThis.fetch` (built-in) | Node 24 native | HTTP requests to Graphiti MCP, OpenRouter API, health endpoints | Zero dependencies. Replaces Python `httpx`. Available in CJS via global. Verified working on installed Node. |

**Why not `undici` npm package:** The built-in `fetch` in Node 24 IS undici under the hood. Installing undici separately only makes sense if you need connection pooling, request interceptors, or HTTP/2 — none of which Dynamo needs. The hooks make simple POST/GET requests with 3-15s timeouts.

**Why not `node-fetch`:** Deprecated in favor of built-in fetch. Was necessary for Node <18, irrelevant now.

**Why not `axios`:** External dependency for no gain. Built-in fetch covers all Dynamo use cases (JSON POST to MCP, GET health checks, POST to OpenRouter).

### Testing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `node:test` | Node 24 built-in | Test runner | Zero dependencies. Stable and production-ready in Node 24. Supports `describe`/`it`/`test`, mocking, watch mode, coverage. GSD has no tests (it's a framework), but Dynamo should — hooks that silently fail need test coverage. |
| `node:assert` | Node 24 built-in | Assertions | Paired with `node:test`. `assert.strictEqual`, `assert.deepStrictEqual`, `assert.throws` cover all needs. |

**Why not Jest:** External dependency (dozens of transitive deps). `node:test` covers all Dynamo's needs: unit tests for module functions, integration tests for hook I/O. Jest's snapshot testing and DOM mocking are irrelevant here.

**Why not Vitest:** ESM-first, adds complexity for CJS projects. Also external dependency.

**Test execution:**
```bash
node --test bin/lib/__tests__/*.cjs       # Run all tests
node --test --watch bin/lib/__tests__/     # Watch mode
node --test --experimental-test-coverage   # Coverage report
```

### YAML Parsing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `js-yaml` | ^4.1.1 | Parse `curation/prompts.yaml`, `config.yaml`, `.ddev/config.yaml` | De facto standard (24,681 dependents). Pure JS, CJS compatible. Replaces Python `pyyaml`. Only external dependency needed. |

**Why this is the ONE npm dependency:** The existing system reads YAML for curation prompts, DDEV config detection, and Graphiti config. Node.js has no built-in YAML parser. `js-yaml` is the standard choice — lightweight, well-maintained, CJS-native.

### Process & IPC

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `child_process` (built-in) | Node 24 native | Shell commands (git, docker) | Replaces Python `subprocess`. `execSync` for simple commands, `spawnSync` for controlled I/O. Same pattern GSD uses. |
| `process.stdin` / `process.stdout` | Node 24 native | Hook I/O with Claude Code | Hooks receive JSON on stdin, output JSON on stdout. Existing hooks already use this pattern. |

---

## Supporting Libraries (All Built-in)

These are Node.js built-in modules — zero npm install required.

| Module | Purpose | Replaces |
|--------|---------|----------|
| `fs` | File system operations | Python `pathlib`, `os` |
| `path` | Path manipulation | Python `os.path`, `pathlib` |
| `os` | Home directory, temp dir, platform detection | Python `os`, `pathlib.Path.home()` |
| `child_process` | Shell execution (git, docker) | Python `subprocess` |
| `crypto` | UUID generation (`crypto.randomUUID()`) | Python `uuid` |
| `node:test` | Test runner | (none — Python code was untested) |
| `node:assert` | Test assertions | (none) |

---

## What NOT to Install

This section is critical. Dynamo must stay lean — every dependency is a maintenance burden, a security surface, and a startup-time cost for hooks that have 5-15 second timeouts.

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Express / Fastify / Hapi | Not a web server. Hooks are CLI scripts. | Built-in `process.stdin`/`process.stdout` |
| axios / got / node-fetch | Redundant with built-in `fetch` in Node 24 | `globalThis.fetch` |
| Jest / Mocha / Vitest | External test runners add dep weight | `node:test` + `node:assert` (built-in) |
| TypeScript | GSD is pure JS. TS adds build step, slows hook startup. CJS+TS is awkward. | JSDoc type annotations if needed |
| commander / yargs | CLI argument parsing frameworks. GSD uses raw `process.argv` parsing — follow the pattern. | Manual `process.argv.slice(2)` parsing (GSD pattern) |
| dotenv | GSD loads config from JSON files, not .env | Manual `.env` parsing (10 lines, like existing Python code) |
| winston / pino / bunyan | Logging frameworks. Hooks log to stderr or to files directly. | `process.stderr.write()` + `fs.appendFileSync()` |
| uuid | `crypto.randomUUID()` is built-in since Node 19 | `require('crypto').randomUUID()` |
| chalk / picocolors | ANSI color libraries. Existing hooks use raw ANSI escape codes. | Raw `\x1b[32m` codes (GSD pattern, see `gsd-statusline.js`) |

**Total external dependencies for Dynamo: 1 (js-yaml).**

Compare to the Python system being replaced: `httpx`, `anthropic`, `pyyaml`, plus a full Python venv (~50MB).

---

## Integration with Claude Code Hook System

### Hook Architecture (Current vs. Target)

**Current (Python/Bash):**
```
settings.json hook entry
  -> bash script (session-start.sh, capture-change.sh, etc.)
    -> Python venv/graphiti-helper.py
      -> httpx HTTP calls to Graphiti MCP + OpenRouter
```

**Target (Node/CJS):**
```
settings.json hook entry
  -> node dynamo.cjs hook <event-name>
    -> Built-in fetch to Graphiti MCP + OpenRouter
```

Three layers collapse to two. The bash middleman is eliminated. Python venv is eliminated.

### Hook Event Coverage

Based on verified Claude Code hook schema (22 events total, Dynamo uses 6):

| Hook Event | Current Implementation | Target CJS |
|------------|----------------------|------------|
| `SessionStart` | `session-start.sh` -> Python (search global prefs, project context, recent sessions) | `dynamo.cjs hook session-start` |
| `UserPromptSubmit` | `prompt-augment.sh` -> Python (semantic search, curation, session naming) | `dynamo.cjs hook prompt-augment` |
| `PostToolUse` (Write/Edit) | `capture-change.sh` -> Python (add episode to knowledge graph) | `dynamo.cjs hook capture-change` |
| `PostToolUse` (all) | `gsd-context-monitor.js` (already CJS) | Keep as-is or integrate |
| `PreCompact` | `preserve-knowledge.sh` -> Python (extract critical knowledge before compaction) | `dynamo.cjs hook preserve-knowledge` |
| `Stop` | `session-summary.sh` -> Python (summarize session, index, auto-name) | `dynamo.cjs hook session-summary` |

### Hook I/O Contract

All hooks follow the same pattern (verified against official docs):

**Input (stdin):**
```json
{
  "session_id": "abc123",
  "cwd": "/path/to/project",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": { "file_path": "..." }
}
```

**Output (stdout) for context injection:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Curated memory context here..."
  }
}
```

**Or plain text** (SessionStart and UserPromptSubmit accept raw text on stdout as context).

**Exit codes:** 0 = success (JSON parsed), 2 = blocking error, other = non-blocking error (stderr shown in verbose mode).

### Shared Hook I/O Module

The `lib/hooks.cjs` module should provide a standard pattern for all hooks:

```javascript
// lib/hooks.cjs — Hook I/O helpers
const STDIN_TIMEOUT_MS = 3000; // Match existing pattern from gsd-context-monitor.js

function readStdin() {
  return new Promise((resolve, reject) => {
    let input = '';
    const timeout = setTimeout(() => resolve('{}'), STDIN_TIMEOUT_MS);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => input += chunk);
    process.stdin.on('end', () => {
      clearTimeout(timeout);
      try { resolve(JSON.parse(input)); }
      catch { resolve({}); }
    });
  });
}

function outputContext(hookEventName, additionalContext) {
  const output = {
    hookSpecificOutput: { hookEventName, additionalContext }
  };
  process.stdout.write(JSON.stringify(output));
}

function silentExit() { process.exit(0); }

module.exports = { readStdin, outputContext, silentExit };
```

---

## MCP Client (Replacing Python MCPClient)

The Python `MCPClient` class does four things: initialize MCP session, call tools, parse SSE responses, and close the connection. This maps directly to CJS using built-in `fetch`:

```javascript
// lib/graphiti-client.cjs — MCP client for Graphiti
const crypto = require('crypto');

const MCP_URL = process.env.GRAPHITI_MCP_URL || 'http://localhost:8100/mcp';
const HEALTH_URL = process.env.GRAPHITI_HEALTH_URL || 'http://localhost:8100/health';

class GraphitiClient {
  constructor(timeout = 5000) {
    this.sessionId = null;
    this.timeout = timeout;
  }

  async initialize() {
    if (this.sessionId) return;
    const resp = await fetch(MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'initialize',
        params: { protocolVersion: '2025-03-26', capabilities: {},
                  clientInfo: { name: 'dynamo', version: '1.0.0' } },
        id: 1
      }),
      signal: AbortSignal.timeout(this.timeout)
    });
    this.sessionId = resp.headers.get('mcp-session-id');
    // Send initialized notification
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' };
    if (this.sessionId) headers['mcp-session-id'] = this.sessionId;
    await fetch(MCP_URL, {
      method: 'POST', headers,
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      signal: AbortSignal.timeout(this.timeout)
    });
  }

  async callTool(toolName, args) {
    await this.initialize();
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' };
    if (this.sessionId) headers['mcp-session-id'] = this.sessionId;
    const resp = await fetch(MCP_URL, {
      method: 'POST', headers,
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'tools/call',
        params: { name: toolName, arguments: args },
        id: crypto.randomUUID()
      }),
      signal: AbortSignal.timeout(this.timeout)
    });
    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      return this._parseSSE(await resp.text());
    }
    return resp.json();
  }

  _parseSSE(text) {
    for (const line of text.split('\n')) {
      if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.result || parsed.error) return parsed;
          } catch {}
        }
      }
    }
    return { error: 'No valid response in SSE stream' };
  }

  static async healthCheck(timeoutMs = 3000) {
    try {
      const resp = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(timeoutMs) });
      return resp.status === 200;
    } catch { return false; }
  }
}

module.exports = { GraphitiClient };
```

This is a direct 1:1 port of the Python `MCPClient` class using zero external dependencies.

---

## OpenRouter / Curation Client (Replacing Python httpx Calls)

The curation system calls OpenRouter's API (Claude Haiku via chat completions endpoint). This is a simple `fetch` POST:

```javascript
// lib/curation.cjs — LLM curation via OpenRouter
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');  // The ONE external dependency

const CURATION_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CURATION_MODEL = 'anthropic/claude-haiku-4.5';

function loadPrompts() {
  const promptsPath = path.join(__dirname, '..', '..', 'curation', 'prompts.yaml');
  try { return yaml.load(fs.readFileSync(promptsPath, 'utf8')) || {}; }
  catch { return {}; }
}

async function curate(memories, context, promptKey, opts = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return memories;
  // ... rest follows same pattern as Python
}

module.exports = { curate, loadPrompts };
```

---

## Installation

```bash
# The ONE external dependency
npm install js-yaml

# Dev dependency (none required — node:test is built-in)
# No dev dependencies needed.
```

**package.json additions:**
```json
{
  "type": "commonjs",
  "dependencies": {
    "js-yaml": "^4.1.1"
  },
  "scripts": {
    "test": "node --test bin/lib/__tests__/*.cjs",
    "test:watch": "node --test --watch bin/lib/__tests__/",
    "test:coverage": "node --test --experimental-test-coverage bin/lib/__tests__/*.cjs"
  }
}
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `globalThis.fetch` | `undici` npm package | If you need HTTP/2, connection pooling, or request interceptors (Dynamo doesn't) |
| `node:test` | Jest | If you need snapshot testing, complex DOM mocking, or have a team used to Jest (not applicable) |
| `js-yaml` | `yaml` npm package | If you need YAML 1.2 spec compliance or YAML writing (Dynamo only reads YAML) |
| Raw `process.argv` parsing | `commander` / `yargs` | If CLI has >20 subcommands with complex option types (Dynamo's CLI is hook-focused, not user-interactive) |
| `.cjs` extension | `.js` + `"type": "commonjs"` | If only deploying to one location. `.cjs` is unambiguous regardless of `package.json` location. GSD uses `.cjs`. |
| Manual `.env` parsing | `dotenv` npm package | If `.env` files have complex features (multiline, interpolation). Dynamo's `.env` is 3 simple `KEY=VALUE` lines. |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Node.js v24.x | `js-yaml` ^4.1.1 | Verified — js-yaml is pure JS, no native bindings |
| Node.js v24.x | `node:test` stable | Stable since Node 22, production-ready in 24 |
| Node.js v24.x | `globalThis.fetch` | Stable since Node 21, non-experimental in 24 |
| Node.js v24.x | `crypto.randomUUID()` | Available since Node 19 |
| `js-yaml` ^4.1.1 | CJS `require()` | Native CJS support confirmed |

---

## Stack Patterns by Variant

**If adding new hook events (future v1.3+):**
- Follow the `dynamo.cjs hook <event-name>` pattern
- Add handler in `lib/hooks/` directory
- Register in `settings.json` hook configuration
- Same I/O contract: stdin JSON in, stdout JSON/text out, exit 0/2

**If Graphiti MCP moves to a different transport:**
- `GraphitiClient` class isolates all MCP communication
- Change the fetch calls in one file, not across all hooks
- SSE parsing is already modular

**If migrating to ESM in the future:**
- `.cjs` extension means files will continue working as CJS even if surrounding `package.json` changes to `"type": "module"`
- Migration path: rename `.cjs` to `.mjs`, change `require()` to `import`, `module.exports` to `export`
- Not recommended until GSD framework migrates

---

## Python/Bash Elimination Summary

What gets replaced and what stays:

| Current | Replaces | Lines (approx) |
|---------|----------|-----------------|
| `graphiti-helper.py` | `lib/graphiti-client.cjs` + `lib/sessions.cjs` + `lib/curation.cjs` + `lib/project.cjs` | ~945 -> ~400 |
| `health-check.py` | `lib/health.cjs` | ~553 -> ~200 |
| `diagnose.py` | Can be absorbed into health checks or deferred | ~700 |
| `session-start.sh` | `dynamo.cjs hook session-start` | ~58 -> 0 (shell eliminated) |
| `capture-change.sh` | `dynamo.cjs hook capture-change` | ~59 -> 0 |
| `prompt-augment.sh` | `dynamo.cjs hook prompt-augment` | ~68 -> 0 |
| `preserve-knowledge.sh` | `dynamo.cjs hook preserve-knowledge` | ~(similar) -> 0 |
| `session-summary.sh` | `dynamo.cjs hook session-summary` | ~(similar) -> 0 |
| `health-check.sh` | `dynamo.cjs health` | ~(small) -> 0 |

**What stays unchanged:**
- `start-graphiti.sh` / `stop-graphiti.sh` — Docker management scripts. These are 20-line bash scripts that call `docker compose`. No reason to rewrite.
- `docker-compose.yml` — Infrastructure config, not code.
- `curation/prompts.yaml` — Content file, consumed by new CJS code via `js-yaml`.
- `.env` / `.env.example` — Config files, read by new CJS code.

---

## Sources

- GSD source code: `~/.claude/get-shit-done/bin/` — 14 CJS files examined (gsd-tools.cjs, lib/*.cjs) — **HIGH confidence**
- `~/.claude/package.json` — Verified `{"type":"commonjs"}` — **HIGH confidence**
- `~/.claude/settings.json` — Verified hook configuration structure — **HIGH confidence**
- `~/.claude/hooks/gsd-context-monitor.js` — Verified CJS hook pattern — **HIGH confidence**
- `~/.claude/hooks/gsd-statusline.js` — Verified CJS statusline pattern — **HIGH confidence**
- Node.js v24.13.1 runtime — Verified `node:test`, `node:assert`, `globalThis.fetch` availability — **HIGH confidence**
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) — Official hook event schemas — **HIGH confidence**
- [Claude Code Hooks Guide](https://claude.com/blog/how-to-configure-hooks) — Official configuration patterns — **HIGH confidence**
- [Node.js 24 LTS announcement](https://nodesource.com/blog/nodejs-24-becomes-lts) — LTS status confirmed — **HIGH confidence**
- [Node.js Test Runner docs](https://nodejs.org/api/test.html) — `node:test` stable status — **HIGH confidence**
- [js-yaml on npm](https://www.npmjs.com/package/js-yaml) — v4.1.1, 24,681 dependents — **HIGH confidence**
- [Node.js built-in fetch (undici foundation)](https://nodejs.org/en/learn/getting-started/fetch) — Stable in Node 24 — **HIGH confidence**

---
*Stack research for: Dynamo v1.2 CJS Architectural Foundation*
*Researched: 2026-03-17*

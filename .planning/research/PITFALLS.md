# Pitfalls Research

**Domain:** Python/Bash to Node/CJS migration for Claude Code hook platform (Dynamo v1.2)
**Researched:** 2026-03-17
**Confidence:** HIGH (analysis based on actual codebase review, official Claude Code hooks docs, Node.js documentation, and v1.1 diagnostic/fix history)

## Critical Pitfalls

### Pitfall 1: Regressing the GRAPHITI_GROUP_ID Override Bug (DIAG-02)

**What goes wrong:**
The CJS rewrite re-introduces the server-level `GRAPHITI_GROUP_ID` override bug that was the root cause of missing project-scoped memories in v1.1. The Graphiti MCP server echoes back the requested group_id in its response message but silently stores everything under the server's default group_id. The new CJS code passes the correct scope string but something in the docker-compose.yml or .env regresses, and all project-scoped writes silently land in `global` scope again.

**Why it happens:**
The fix was environmental (removing `GRAPHITI_GROUP_ID` from docker-compose.yml and .env), not in application code. During the CJS rewrite, if the install script, docker-compose.yml, or .env templates are regenerated, refactored, or replaced, the `GRAPHITI_GROUP_ID=global` default can creep back in. The MCP server's deceptive acknowledgment message ("Episode queued for processing in group 'project-my-cc-setup'") makes the regression invisible at write time -- only detectable by reading back with the same group_id.

**How to avoid:**
- Port the `GRAPHITI_GROUP_ID` removal as the very first verification in the CJS migration, before any other code is written.
- Add an explicit assertion to the CJS health-check or verify-memory that writes to a project scope and reads it back -- exactly what diagnose.py Stage 8 does today.
- Never regenerate docker-compose.yml or .env from templates without checking for `GRAPHITI_GROUP_ID`. Add a comment in both files: `# DO NOT SET GRAPHITI_GROUP_ID — causes silent scope override (see DIAG-02)`.
- The CJS test suite must include a canary round-trip test that writes to `project-test` scope and verifies the episode is NOT in `global` scope.

**Warning signs:**
- `search_memory_facts` with project scope returns 0 facts
- `get_episodes` for project scope returns episodes with `group_id='global'`
- Sessions accumulate in global scope despite project detection working correctly
- The word `GRAPHITI_GROUP_ID` appears anywhere in docker-compose.yml or .env

**Phase to address:**
Phase 1 (Foundation/Scaffold) -- this constraint must be codified as an automated check before any hook code is migrated.

---

### Pitfall 2: Regressing the Colon-in-Group-ID Rejection

**What goes wrong:**
The CJS rewrite uses colon (`:`) as the scope separator (e.g., `project:my-cc-setup`) instead of dash (`-`) (e.g., `project-my-cc-setup`). Graphiti MCP server v1.21.0 validates `group_id` values and rejects any containing characters outside alphanumeric, dashes, and underscores. Writes silently fail or return errors that get swallowed.

**Why it happens:**
The colon separator was the original design in v1.0/v1.1 before the fix. It reads more naturally in code. A developer writing fresh CJS code without reading SCOPE_FALLBACK.md would naturally reach for `project:${name}` because it looks like a standard namespace separator. The Python graphiti-helper.py code uses the dash format, but someone rewriting in CJS from specification rather than from the existing implementation might use colons.

**How to avoid:**
- Define scope format constants in a single shared module (e.g., `lib/scopes.js`):
  ```javascript
  const SCOPE = {
    global: 'global',
    project: (name) => `project-${name}`,
    session: (ts) => `session-${ts}`,
    task: (desc) => `task-${desc}`
  };
  ```
- Add a validation function that rejects any group_id containing characters outside `[a-zA-Z0-9_-]`.
- Port SCOPE_FALLBACK.md into the CJS project as inline documentation in the scope module.
- The CJS test suite must include a test that the scope builder never produces colons.

**Warning signs:**
- Graphiti API returns error responses mentioning "invalid group_id"
- Hook error logs show write failures for project-scoped episodes
- The string "project:" appears anywhere in hook code (should be "project-")

**Phase to address:**
Phase 1 (Foundation/Scaffold) -- scope format must be a locked constant from day one.

---

### Pitfall 3: Losing Silent-Failure Prevention (Fire-and-Forget Regression)

**What goes wrong:**
The CJS rewrite introduces async patterns (Promises, async/await) that accidentally return to fire-and-forget behavior. The v1.1 fix specifically removed `2>/dev/null` and `&` (backgrounding) from all hook write operations. In CJS, the equivalent regression is: using `fetch().catch(() => {})` without logging, using `Promise.all` without handling rejections, or returning from the hook before the HTTP call completes.

**Why it happens:**
JavaScript's async nature makes fire-and-forget the path of least resistance. A developer writing `await fetch(url)` correctly blocks, but wrapping it in a try/catch that swallows the error recreates the exact same problem as `2>/dev/null`. Node.js also has unhandled promise rejection behavior that changed across versions -- in some versions, unhandled rejections crash the process; in others, they emit a warning that gets lost.

**How to avoid:**
- Establish an explicit error-handling contract: every HTTP call to Graphiti must either (a) throw on failure (and be caught by a handler that logs to the error file), or (b) return a result object that the caller checks.
- Port the exact same `log_error()` pattern from Bash: timestamp, hook name, error message, written to `~/.claude/graphiti/hook-errors.log`.
- Forbid bare `.catch(() => {})` in code review. The only acceptable catch pattern is one that calls the error logger.
- The CJS `add-episode` equivalent must `process.exit(1)` on failure, exactly as `cmd_add_episode` does in Python today (line 432 of graphiti-helper.py).
- Do NOT use `async: true` on any Graphiti write hooks in the Claude Code settings. The v1.1 architecture requires foreground execution so errors are visible.

**Warning signs:**
- Any `.catch` block that does not call a logging function
- Any `fetch` or HTTP call not wrapped in try/catch
- The string `async: true` appearing in hook configuration for write hooks
- Hook exit code is always 0 regardless of whether the write succeeded

**Phase to address:**
Phase 2 (Hook Migration) -- every hook must be individually verified for error propagation before being declared migrated.

---

### Pitfall 4: Node.js Cold Start Blowing Hook Timeouts

**What goes wrong:**
The current Bash hooks exec into Python, which has its own startup cost (~200-400ms for Python + venv + imports). CJS has different startup characteristics: Node.js cold start is ~100-375ms for the runtime itself, plus `require()` time for all modules. If the CJS tool has many dependencies or does eager initialization (creating HTTP clients, reading config files, parsing YAML), the cold start can exceed expectations. Combined with the Graphiti MCP session initialization handshake (~200-500ms), the total time for a single hook invocation can approach or exceed the configured timeout, especially for the `PostToolUse` hook (currently 10s timeout) that fires on every Write/Edit/MultiEdit.

**Why it happens:**
Python's startup cost was hidden because the venv + script launch was a single `exec` call that the Bash hook delegated to. The developer never saw it separately. In CJS, the startup is the entire hook -- there's no Bash wrapper absorbing part of the cost. Also, CJS `require()` is synchronous and blocks the event loop during module loading, meaning every `require` in the dependency tree executes sequentially.

**How to avoid:**
- Minimize top-level `require()` calls. Use lazy require patterns for heavy modules:
  ```javascript
  // Bad: loaded on every invocation even if not needed
  const yaml = require('js-yaml');

  // Good: loaded only when actually used
  function loadPrompts() {
    const yaml = require('js-yaml');
    return yaml.load(fs.readFileSync(promptsPath, 'utf-8'));
  }
  ```
- Keep the dependency tree shallow. The GSD pattern already demonstrates this: `gsd-tools.cjs` uses only Node.js built-ins (`fs`, `path`, `child_process`) plus its own lib modules. Follow the same pattern.
- Measure actual cold-start time during development. Add a timing probe:
  ```javascript
  const startMs = Date.now();
  // ... at end of hook execution:
  if (process.env.DYNAMO_TIMING === '1') {
    console.error(`[timing] ${hookName}: ${Date.now() - startMs}ms`);
  }
  ```
- Target sub-200ms for hook startup (before any HTTP call). The current Python path is ~300-400ms; CJS should be faster, not slower.
- For the MCP session initialization: reuse the session across calls within the same hook invocation (the current Python MCPClient already does this). Do NOT create multiple MCPClient instances per hook run.

**Warning signs:**
- Hooks timing out (exit code from signal, not from application logic)
- `PostToolUse` hook adding noticeable delay to every file write
- `UserPromptSubmit` hook adding delay before each prompt processes
- `require()` count in the main entry point exceeds 10

**Phase to address:**
Phase 1 (Foundation/Scaffold) -- establish the module structure and dependency budget before writing hook code.

---

### Pitfall 5: Stdin Reading Semantics Differ Between Bash and Node.js

**What goes wrong:**
Every current Bash hook reads JSON from stdin with `INPUT=$(cat)` then extracts fields with `jq -r`. This is synchronous and blocking -- `cat` reads until EOF, returns the full string, done. In Node.js, stdin reading is asynchronous by default. A naive port that uses `process.stdin.on('data', ...)` may fire the callback multiple times for large inputs, miss data if the handler isn't registered before data arrives, or hang if the process doesn't know when stdin is closed.

**Why it happens:**
Bash `cat` and Node.js `process.stdin` have fundamentally different execution models. In Bash, `INPUT=$(cat)` blocks the entire script until EOF. In Node.js, stdin is a Readable stream that emits events asynchronously. If the CJS hook starts doing work before all stdin data is collected, it operates on partial input and produces wrong results (e.g., `jq -r '.cwd'` on a truncated JSON string).

**How to avoid:**
- Use the synchronous `fs.readFileSync('/dev/stdin', 'utf-8')` pattern for CJS hooks that need all-at-once stdin reading. This matches Bash's `cat` behavior exactly and is appropriate for small JSON payloads (Claude Code hook inputs are always small).
- Alternatively, collect all stdin data with an async pattern, but do not start processing until the `end` event:
  ```javascript
  async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
  }
  ```
- Parse JSON immediately after reading all stdin. The jq fallback patterns in the Bash hooks (`.source // "startup"`, `.cwd // ""`) must be replicated with JavaScript defaults:
  ```javascript
  const input = JSON.parse(stdinData);
  const source = input.source || 'startup';
  const cwd = input.cwd || '';
  ```
- Never use `process.stdin.read()` in a loop without checking for null -- this is the most common Node.js stdin mistake.

**Warning signs:**
- Hooks receiving truncated or empty JSON
- `JSON.parse` errors in hook logs
- Hooks working in manual testing (small input) but failing in real Claude Code sessions (larger input)
- `undefined` values where hook input fields should be populated

**Phase to address:**
Phase 1 (Foundation/Scaffold) -- create a shared `readHookInput()` utility that all hooks import.

---

### Pitfall 6: HTTP Client Behavioral Differences Between Python httpx and Node.js fetch/undici

**What goes wrong:**
The Python codebase uses `httpx.Client` with explicit timeout control (3s for health checks, 5s for MCP calls, 10s for curation, 15s for session summarization). The CJS rewrite uses Node.js native `fetch` or a library like `undici`, which has different default timeout behavior. Node.js native `fetch` has NO default timeout -- requests hang indefinitely unless explicitly configured. The hook then blocks Claude Code until the hook timeout kills it, creating a terrible user experience.

**Why it happens:**
Python httpx has a sensible 5-second default timeout and throws specific exceptions (`ConnectError`, `TimeoutException`) that the code handles. Node.js native `fetch` treats timeouts as an opt-in feature via `AbortSignal.timeout()`. A developer porting code that says `httpx.get(url, timeout=3.0)` might write `fetch(url)` without realizing the timeout didn't port with it.

**How to avoid:**
- Create a shared HTTP utility module that wraps fetch with mandatory timeout:
  ```javascript
  async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(id);
    }
  }
  ```
- Map all current Python timeout values into the CJS code explicitly:
  - Health check: 3000ms
  - MCP tool calls: 5000ms
  - Curation (OpenRouter Haiku): 10000ms
  - Session summarization: 15000ms
- Handle `AbortError` (the Node.js equivalent of httpx's `TimeoutException`) and `TypeError` with cause `ECONNREFUSED` (the equivalent of httpx's `ConnectError`) explicitly.
- Test timeout behavior with a deliberately slow or unreachable endpoint before shipping.

**Warning signs:**
- Hooks hanging instead of failing gracefully
- No timeout-related error handling in HTTP call code
- `fetch()` calls without `signal` parameter
- Health checks that pass but then MCP calls hang (because health endpoint is fast but MCP endpoint is slow)

**Phase to address:**
Phase 1 (Foundation/Scaffold) -- the HTTP utility must be one of the first modules built, before any Graphiti interaction code.

---

### Pitfall 7: MCP SSE Response Parsing Regression

**What goes wrong:**
The Graphiti MCP server returns responses in SSE (Server-Sent Events) format for tool calls. The current Python code has a custom `_parse_sse()` method that extracts JSON-RPC results from `data:` lines. The CJS port either fails to handle SSE responses (expecting plain JSON), parses them incorrectly (taking the first data line instead of scanning for the one with `result`), or breaks on edge cases (empty data lines, multiple events in one response).

**Why it happens:**
There is no standard SSE parsing library in Node.js built-ins. The Python implementation is custom (15 lines in `MCPClient._parse_sse`). When rewriting in CJS, the developer must either port this exact logic or find a library. The Content-Type detection (`"text/event-stream" in content_type`) is easy to miss, causing the code to try `JSON.parse` on raw SSE text and fail.

**How to avoid:**
- Port the `_parse_sse()` function directly from Python to CJS. It is 15 lines and straightforward:
  ```javascript
  function parseSSE(text) {
    for (const line of text.split('\n')) {
      if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if ('result' in parsed || 'error' in parsed) return parsed;
          } catch { continue; }
        }
      }
    }
    return { error: 'No valid response in SSE stream' };
  }
  ```
- The response handler must check `content-type` header before deciding how to parse:
  ```javascript
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/event-stream')) {
    return parseSSE(await response.text());
  } else {
    return await response.json();
  }
  ```
- Write explicit tests for SSE parsing with real response examples captured from the current system.

**Warning signs:**
- `SyntaxError: Unexpected token 'e'` (trying to JSON.parse "event: message\ndata: {...}")
- MCP calls returning `undefined` or empty results
- Health check passes but all tool calls fail

**Phase to address:**
Phase 1 (Foundation/Scaffold) -- the MCP client module with SSE parsing is a core dependency for all hooks.

---

### Pitfall 8: Modular Architecture Introducing Accidental Complexity

**What goes wrong:**
The current system is 6 Bash scripts + 1 Python file. Each hook is self-contained: it sources the helper, does its work, exits. The CJS rewrite introduces a modular architecture (following GSD patterns): `lib/mcp-client.js`, `lib/scopes.js`, `lib/http.js`, `lib/config.js`, `lib/logger.js`, etc. This modularity is correct in principle but creates failure modes that the simple scripts never had: circular dependencies, module loading order issues, shared state contamination between modules, and path resolution failures when hooks are invoked from unexpected working directories.

**Why it happens:**
The current Bash hooks have zero shared state. Each invocation is a fresh process. Each hook has `HELPER="$HOME/.claude/graphiti/.venv/bin/python3 $HOME/.claude/graphiti/graphiti-helper.py"` as its first meaningful line -- hardcoded, no abstraction, no indirection. This is brutally simple and reliable. CJS modules introduce indirection: `require('./lib/mcp-client')` depends on the working directory, or uses `__dirname` which depends on where the file is installed.

**How to avoid:**
- Use `__dirname`-relative paths for all internal requires. Never use process.cwd()-relative paths for module loading:
  ```javascript
  // Good: works regardless of where the hook is called from
  const mcpClient = require(path.join(__dirname, '..', 'lib', 'mcp-client'));

  // Bad: breaks if cwd is not the expected directory
  const mcpClient = require('./lib/mcp-client');
  ```
- Keep the module tree shallow: hooks -> lib modules -> Node.js built-ins. No lib module should require another lib module that requires back to the first (circular dependency).
- Each hook entry point should be a single CJS file that can be tested in isolation:
  ```bash
  echo '{"cwd":"/tmp","tool_name":"Write"}' | node ~/.claude/dynamo/hooks/capture-change.cjs
  ```
- Follow the GSD pattern exactly: `gsd-tools.cjs` is the entry point, `lib/` contains focused modules, each module exports functions, no module has side effects on load.
- Resist the urge to create an "everything framework." The current system is 944 lines of Python + ~300 lines of Bash. The CJS rewrite should be comparable in size, not 3x larger.

**Warning signs:**
- Total CJS line count exceeds 2x the current Python+Bash total (~2500 lines ceiling)
- Any module requires more than 3 other project modules
- Circular dependency warnings from Node.js
- Hooks fail when invoked from different working directories
- A change to one lib module breaks multiple hooks

**Phase to address:**
Phase 1 (Foundation/Scaffold) -- define the module boundaries and dependency rules before writing implementation.

---

### Pitfall 9: .env and API Key Loading Differences

**What goes wrong:**
The Python code has custom .env loading logic (lines 42-52 of graphiti-helper.py) that reads the .env file, parses key=value pairs, and sets them as environment variables -- but only if the key is not already set in the actual environment. The CJS rewrite either fails to load .env at all (no built-in .env support in Node.js), loads it with `dotenv` which has subtly different precedence behavior, or loads it in a way that overwrites environment variables that were explicitly set.

**Why it happens:**
Python's .env loading in the current code is hand-rolled (12 lines) with explicit "don't override existing env vars" behavior. Node.js developers typically reach for the `dotenv` package, which by default does NOT override existing env vars (matching the current behavior), but some versions or configurations do override. More commonly, the developer forgets to load .env at all in the CJS version, because they expect API keys to "just be there" from the shell environment.

**How to avoid:**
- Port the .env loading logic directly rather than adding a dependency:
  ```javascript
  function loadEnv(envPath) {
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (key && value && !(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
  ```
- The critical API keys are: `OPENROUTER_API_KEY` (for Haiku curation/naming), `ANTHROPIC_API_KEY` (present but unused currently), `NEO4J_PASSWORD` (for health checks).
- Test with: (a) keys in .env only, (b) keys in environment only, (c) keys in both (environment should win), (d) no .env file at all (graceful degradation).
- The .env file path must be resolved relative to the Dynamo install directory, not the working directory: `path.join(__dirname, '..', '.env')`.

**Warning signs:**
- Curation/session naming silently falling back to truncation (means OPENROUTER_API_KEY not loaded)
- Health checks failing with authentication errors (means NEO4J_PASSWORD not loaded)
- Keys loaded differently when hooks run from different project directories

**Phase to address:**
Phase 1 (Foundation/Scaffold) -- .env loading is a config module responsibility, must work before any hook code.

---

### Pitfall 10: SessionEnd Hook Timeout (1.5s Global Cap)

**What goes wrong:**
The current `session-summary.sh` hook has a 30-second timeout configured in settings-hooks.json. But Claude Code imposes a global SessionEnd timeout of 1.5 seconds (overridable via `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`). The session summary hook calls Haiku via OpenRouter (~1-3 seconds for summarization) plus writes to Graphiti (~0.5-1 second), plus generates a session name (~0.5-1 second), plus writes session index (~negligible). Total: 2-5 seconds. This exceeds the 1.5-second SessionEnd cap, so the hook is killed before completing.

**Why it happens:**
The 30-second timeout in settings-hooks.json is the per-hook timeout, but Claude Code docs state: "For SessionEnd, per-hook timeouts are capped by the global limit." The default global limit is 1.5 seconds. This means the session summary hook has likely been getting killed on many sessions, silently losing session data. The CJS rewrite must address this, not just port it.

**How to avoid:**
- Set `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS` to a value that accommodates the session summary workflow. Based on current timing: `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS=10000` (10 seconds).
- The install script must set this environment variable, either in the shell profile or via `CLAUDE_ENV_FILE` mechanism.
- Alternatively, restructure the session summary to do less work at SessionEnd: just capture the raw session data quickly, and defer the Haiku summarization + naming to a background job or the next SessionStart.
- Measure actual SessionEnd timing in the CJS version with timing probes.
- Note: The Claude Code docs also mention the `Stop` event (which is what the current hooks use). Verify whether `Stop` has the same 1.5s cap as `SessionEnd`, or if they are different events with different caps.

**Warning signs:**
- Session summaries intermittently missing from Graphiti
- Session naming only producing the preliminary (first-prompt) name, never the refined (summary-based) name
- Hook error log shows no errors (because the process was killed, not errored)
- `sessions.json` has entries with empty labels

**Phase to address:**
Phase 2 (Hook Migration) -- this must be tested empirically during session summary hook migration.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `dotenv` package instead of hand-rolled .env loading | One line: `require('dotenv').config()` | Additional dependency; subtly different precedence behavior; may override env vars | Acceptable ONLY if pinned to exact version and precedence behavior verified |
| Keeping Python scripts alongside CJS during migration | Both systems work, gradual transition | Two codebases to maintain; confusion about which is authoritative; bugs fixed in one but not the other | Only during a defined transition window (max 1 phase) with explicit cutover date |
| Using `axios` or `got` instead of native `fetch` | Nicer API, built-in retries, better errors | Dependency creep; native fetch is adequate for this use case; adds cold-start time | Never -- native fetch + AbortSignal is sufficient for HTTP GET/POST to known endpoints |
| Wrapping every hook in a monolithic CLI tool (one entry point, subcommands) | Unified interface; follows GSD pattern | Every hook invocation loads the entire CLI; cold-start cost multiplied; a bug in any subcommand path can break all hooks | Only if lazy-loading ensures hooks only load their own modules, not the full CLI |
| Skipping the MCP session initialization test in CJS health check | Faster health check | Misses the most failure-prone step (the one that actually broke in v1.1) | Never -- the canary round-trip test is the single most important health check |
| Not porting the `once-per-session health check` pattern | Simpler code | Every hook invocation hits the health endpoint; adds ~100ms latency per hook call; unnecessary load on Graphiti server | Never -- the `/tmp/graphiti-health-warned-${PPID}` pattern must be ported |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Graphiti MCP (SSE transport) | Assuming response is always JSON; using `response.json()` without checking content-type | Check `content-type` header; parse SSE for `text/event-stream`, JSON otherwise |
| Graphiti MCP (session init) | Skipping the `notifications/initialized` message after `initialize` | Send both: `initialize` (request), then `notifications/initialized` (notification). Omitting the second may cause undefined behavior |
| OpenRouter API (Haiku curation) | Using `node-fetch` or custom HTTP for a simple POST | Use native `fetch` with `AbortSignal.timeout(10000)` and explicit error handling for rate limits (429) and auth failures (401) |
| Claude Code hook stdin | Using `readline` or event-based stdin for small synchronous input | Use `fs.readFileSync('/dev/stdin', 'utf-8')` or async iterator pattern with full buffer collection before parsing |
| Sessions index (sessions.json) | Writing JSON directly without atomic rename | Port the Python pattern: write to `.tmp` file, then `fs.renameSync(tmp, target)` for atomic update |
| Shell profile corruption | CJS hook outputs debug info to stdout that corrupts JSON parsing | All diagnostic output must go to stderr (`console.error`); stdout is reserved for hook return JSON |
| Temp file flags (health warned, session named) | Using `process.pid` instead of `process.ppid` for flag files | Claude Code hook processes are children of the CC process; `PPID` is the stable session identifier. In Node.js, use `process.ppid` (not `process.pid`) |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Eager module loading in hook entry points | Every Write/Edit fires PostToolUse; each invocation loads all modules | Lazy require: only load modules when the specific code path needs them | Noticeable at ~5 file edits per minute (normal coding pace) |
| Creating new MCP session per HTTP call | Each `fetch` to Graphiti starts a new session handshake (~200-500ms) | Reuse MCPClient instance within a single hook invocation (current Python already does this) | Hooks that make 2+ MCP calls (search + curate = 2 calls in prompt-augment) |
| Synchronous YAML parsing of prompts.yaml on every invocation | Blocks event loop for ~5-20ms per hook call | Load once, cache in module scope; file rarely changes | Prompt-augment hook fires on every user message |
| Unbounded stdin buffering | Large PostToolUse payloads (big file writes) consume memory | Read stdin, parse JSON, extract only needed fields, discard the rest immediately | Claude Code passing large tool_input payloads (files > 100KB) |
| Log file growth without rotation | `hook-errors.log` grows unbounded if errors are frequent | Port the 1MB rotation logic from Bash: check size, rotate `.old` | After several hundred error-state hook invocations |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging full hook stdin (including prompt content) to error file | User prompts and session content written to plain text file | Log only error context (hook name, timestamp, error message), never the full stdin payload |
| Hardcoding API keys in CJS source during development | Keys committed to git; exposed in repo | Load exclusively from .env or environment variables; .env is in .gitignore |
| Using `eval()` or `new Function()` on stdin data | Code injection via crafted hook input | Always use `JSON.parse()` -- never eval stdin data |
| Exposing Graphiti MCP on non-localhost | Remote access to knowledge graph without auth | Verify docker-compose.yml binds only to `127.0.0.1`; health check should verify this |
| Not sanitizing project names before using in group_id | Path traversal or injection in Neo4j queries via malicious directory names | Sanitize project name: strip non-alphanumeric-dash-underscore characters |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Migration breaks existing sessions data | User loses session history, labels, summaries from v1.1 | Sessions.json is a flat file; the CJS version must read the same format and path |
| Install script requires running Python venv alongside Node.js | Confusing dual-runtime setup during transition | Phase out Python dependencies completely; don't ship a half-migrated state |
| Different error message format between old hooks and new hooks | User sees unfamiliar errors; existing troubleshooting docs don't match | Keep the same `[graphiti]` prefix and error message patterns |
| CJS hook crashes produce Node.js stack traces instead of clean errors | Intimidating, unhelpful output in Claude Code | Wrap top-level hook execution in try/catch with clean error formatting to stderr |
| Health check CJS version reports different stages than Python version | Confusion about which health check to trust | Exact same stage names and numbering; extend, don't redesign |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Hook migrated to CJS:** Does it handle SSE responses from Graphiti MCP? (most common miss)
- [ ] **Scope handling ported:** Does it use dash separators (`project-name`), never colons (`project:name`)? Check SCOPE_FALLBACK.md.
- [ ] **Error propagation working:** Does the hook exit 1 on write failure? Test with Graphiti server stopped.
- [ ] **Stdin reading complete:** Test with real Claude Code hook payloads, not just `echo '{}' | node hook.cjs`
- [ ] **Timeout behavior correct:** Test with slow/unreachable Graphiti server. Does the hook fail within the configured timeout?
- [ ] **Once-per-session patterns ported:** Health check warning flag (`/tmp/graphiti-health-warned-*`) and session named flag (`/tmp/graphiti-session-named-*`) use `process.ppid`, not `process.pid`
- [ ] **Atomic file writes:** Sessions.json writes use tmp-file-then-rename, not direct overwrite
- [ ] **Log rotation ported:** Error log file rotation at 1MB (stat + rename pattern)
- [ ] **GRAPHITI_GROUP_ID not present:** Verify docker-compose.yml and .env have no GRAPHITI_GROUP_ID setting
- [ ] **Install script updated:** `install.sh` copies CJS files, not Python files; no longer creates .venv
- [ ] **Settings hooks JSON updated:** Hook commands point to `.cjs` files, not `.sh` files
- [ ] **Infinite loop guard ported:** `session-summary` checks `stop_hook_active` to prevent re-entrancy

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| GRAPHITI_GROUP_ID override regression | MEDIUM | Remove from docker-compose.yml and .env; restart containers; data already written to wrong scope is not recoverable (stored as global) |
| Colon-in-group-id regression | LOW | Fix scope constants; re-deploy hooks; previously misscoped data is lost but system self-heals on next write |
| Fire-and-forget regression (silent failures) | HIGH | Audit all HTTP calls for error handling; add logging; lost data from the silent-failure period is unrecoverable |
| Cold start timeout | LOW | Lazy-require heavy modules; measure with timing probes; adjust hook timeout if needed |
| Stdin reading bug | LOW | Switch to `fs.readFileSync('/dev/stdin')` pattern; test with real Claude Code payloads |
| HTTP timeout hang | LOW | Add AbortSignal.timeout() to all fetch calls; test with unreachable server |
| SSE parsing failure | LOW | Port the exact Python `_parse_sse` logic; test with captured real responses |
| SessionEnd timeout kill | MEDIUM | Set `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`; restructure session summary to do less work at exit |
| Module path resolution failure | LOW | Use `__dirname`-relative paths in all requires; test hooks from multiple working directories |
| .env loading regression | LOW | Port the hand-rolled loader; test all four key-source combinations |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| GRAPHITI_GROUP_ID override (P1) | Phase 1: Foundation | Automated test: write to project scope, read back, verify group_id is not 'global' |
| Colon-in-group-id (P2) | Phase 1: Foundation | Scope module includes regex validation rejecting non-alphanumeric-dash-underscore |
| Fire-and-forget regression (P3) | Phase 2: Hook Migration | Each hook tested with Graphiti server down; verify exit code 1 and error log entry |
| Cold start timeout (P4) | Phase 1: Foundation | Timing probes show sub-200ms cold start; hook timeouts not triggered during test suite |
| Stdin reading (P5) | Phase 1: Foundation | Shared readHookInput() utility; tested with real Claude Code payloads |
| HTTP timeout (P6) | Phase 1: Foundation | HTTP utility with mandatory timeout; tested with unreachable endpoint |
| SSE parsing (P7) | Phase 1: Foundation | MCP client module with SSE parsing; tested with captured real SSE responses |
| Modular complexity (P8) | Phase 1: Foundation | Module dependency graph is acyclic; no module requires > 3 project modules; line count < 2500 total |
| .env loading (P9) | Phase 1: Foundation | Config module loads .env; tested with all four key-source scenarios |
| SessionEnd timeout (P10) | Phase 2: Hook Migration | Measured actual SessionEnd timing; CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS documented in install |
| Infinite loop guard | Phase 2: Hook Migration | Session summary hook checks `stop_hook_active` field; tested with simulated re-entrant call |
| Sessions.json compatibility | Phase 2: Hook Migration | CJS reads existing sessions.json written by Python; round-trip verified |

---

## Regression Test Matrix (v1.1 Fixes)

Each v1.1 fix must have an explicit regression test in the CJS version.

| v1.1 Fix | What Was Fixed | CJS Regression Test |
|----------|---------------|---------------------|
| DIAG-01: Silent write failures | Removed `2>/dev/null` and `&` backgrounding from hooks | Verify: no `.catch(() => {})` patterns; all HTTP errors logged; hook exits 1 on write failure |
| DIAG-02: GRAPHITI_GROUP_ID override | Removed GRAPHITI_GROUP_ID from docker-compose.yml and .env | Verify: variable absent from all config files; canary write-to-project-scope-then-read test passes |
| Colon-in-group_id rejection | Changed scope separator from `:` to `-` | Verify: scope module produces only `[a-zA-Z0-9_-]` characters; unit test with all scope types |
| Foreground hook execution | Changed hooks from background (`&`) to foreground with error capture | Verify: no `async: true` in settings-hooks.json for write hooks; hooks block until HTTP completes |
| Error logging to file | Added `log_error()` function writing to `hook-errors.log` | Verify: CJS logger writes same format `[ISO-Z] [hook-name] msg`; file created on first error |
| GRAPHITI_VERBOSE support | Added `GRAPHITI_VERBOSE=1` confirmation messages to stderr | Verify: CJS checks `process.env.GRAPHITI_VERBOSE` and prints `[graphiti] Stored: source (scope)` |
| Health check canary round-trip | Enhanced health check beyond HTTP 200 to include write+read test | Verify: CJS health check includes MCP write + search; not just `/health` GET |
| Log rotation | Added 1MB rotation for `hook-errors.log` | Verify: CJS log function checks file size and rotates; tested with file > 1MB |
| Once-per-session health warning | Health check failure warning shown once, not on every hook call | Verify: flag file created at `/tmp/graphiti-health-warned-${ppid}`; second call silent |
| Infinite loop guard | `stop_hook_active` check in session-summary prevents re-entrancy | Verify: CJS session-summary checks `input.stop_hook_active`; exits 0 if true |
| Two-phase session naming | Preliminary name from first prompt, refined from summary | Verify: CJS prompt-augment creates preliminary name; session-summary refines it |
| User label preservation | `index-session` never overwrites `labeled_by: "user"` entries | Verify: CJS index-session checks `labeled_by` before updating |

---

## Sources

- [Claude Code Hooks Reference (Official)](https://code.claude.com/docs/en/hooks) -- timeout behavior, stdin format, exit code semantics, SessionEnd global cap
- [Node.js CommonJS Modules Documentation](https://nodejs.org/api/modules.html) -- require() behavior, __dirname resolution, module caching
- [HTTPX Timeouts Documentation](https://www.python-httpx.org/advanced/timeouts/) -- Python httpx timeout granularity for migration comparison
- [Node.js Stdin Reading Patterns (GitHub Gist)](https://gist.github.com/espadrine/172658142820a356e1e0) -- synchronous stdin reading in Node.js
- [Claude Code Async Hooks (JP Caparas, Jan 2026)](https://reading.sh/claude-code-async-hooks-what-they-are-and-when-to-use-them-61b21cd71aad) -- async vs foreground hook behavior
- [Node.js Loader Performance (AppSignal, Oct 2025)](https://blog.appsignal.com/2025/10/22/ways-to-improve-nodejs-loader-performance.html) -- CJS require() cold-start optimization
- v1.1 Diagnostic Report: `.planning/milestones/v1.1-phases/04-diagnostics/04-DIAGNOSTIC-REPORT.md` -- DIAG-01, DIAG-02 root causes
- v1.1 Hook Reliability Verification: `.planning/milestones/v1.1-phases/05-hook-reliability/05-VERIFICATION.md` -- 8/8 truths verified
- Scope Fallback Resolution: `graphiti/SCOPE_FALLBACK.md` -- dash separator constraint
- Current implementation: `graphiti/graphiti-helper.py` (944 lines), `graphiti/hooks/*.sh` (6 hooks, ~300 lines total)
- GSD CJS pattern reference: `~/.claude/get-shit-done/bin/gsd-tools.cjs` and `lib/*.cjs`

---
*Pitfalls research for: Python/Bash to Node/CJS migration (Dynamo v1.2)*
*Researched: 2026-03-17*

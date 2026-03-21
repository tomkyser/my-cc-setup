# Phase 20: Management Hardening - Research

**Researched:** 2026-03-20
**Domain:** Input validation, dependency verification, prompt injection boundary protection
**Confidence:** HIGH

## Summary

Phase 20 addresses three requirements: MGMT-01 (dependency verification in install/health-check), MGMT-08a (input sanitization in the hook dispatcher), and MGMT-08b (boundary markers on additionalContext injection). All three operate on existing, well-understood code paths -- the dispatcher (`cc/hooks/dynamo-hooks.cjs`), the install pipeline (`subsystems/switchboard/install.cjs`), and the health-check pipeline (`subsystems/terminus/health-check.cjs` + `stages.cjs`).

The implementation follows established patterns exactly: new stages for health-check (same `stageXxx()` function convention), new steps for install (same numbered step pattern), validation layer insertion in the dispatcher (between JSON.parse and event routing), and stdout interception for boundary wrapping (monkey-patch `process.stdout.write` in the dispatcher before calling handlers).

**Primary recommendation:** Implement in three clear work areas -- (1) dependency verification stage in stages.cjs + step in install.cjs, (2) input validation layer in dynamo-hooks.cjs, (3) stdout boundary wrapping in dynamo-hooks.cjs -- with tests mirroring the existing mock-by-reassignment pattern used throughout the test suite.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Node.js version check runs in both `dynamo install` and `dynamo health-check`
- Minimum version: Node.js 22.x (LTS -- required for node:test, future node:sqlite)
- Graphiti dependency status: check Docker container reachable + API responding, report pass/fail with actionable remediation message
- On version mismatch: warn and continue during install (don't block deployment); report as stage failure during health-check (informational, not fatal to overall health)
- Version check is a new stage added to the existing stage pipeline in both install.cjs and health-check.cjs
- Validation lives in the dispatcher (`cc/hooks/dynamo-hooks.cjs`) before routing to any handler
- Required field validation: `hook_event_name` must be present and one of the known event enum (SessionStart, UserPromptSubmit, PostToolUse, PreCompact, Stop)
- Type checks on optional fields: `tool_name` (string), `tool_input` (object), `cwd` (string)
- Field length limits: `tool_input` string values capped at 100KB, `cwd` capped at 4096 chars, `hook_event_name` at 64 chars
- On invalid input: log violation details to `hook-errors.log` via `logError()`, exit 0 silently (never block Claude Code)
- Reject malformed JSON early (before any handler is loaded) -- the existing try/catch around `JSON.parse(input)` already handles parse failures, but should log the violation type specifically
- Boundary markers wrap all `additionalContext` output (stdout) from hooks
- Dispatcher wraps all handler stdout in boundary markers (single enforcement point, not per-handler)
- Marker format: structured tags that clearly delimit Dynamo's injected content from user/system content
- All stdout-writing hooks affected: session-start, prompt-augment, preserve-knowledge
- Existing markers like `[GRAPHITI MEMORY CONTEXT]` and `[RELEVANT MEMORY]` are preserved inside the boundary-wrapped content
- The boundary markers should make it clear to Claude that the content inside is from Dynamo's memory system, not from user instructions

### Claude's Discretion
- Exact boundary marker tag names and format (XML-style, bracket-style, or other -- choose based on Claude Code's additionalContext parsing behavior)
- Whether to add a canary/nonce to boundary markers for tamper detection
- Exact error message wording for dependency check failures
- Whether the Node.js version check should also verify `node:test` availability as a smoke test
- Exact field length limit values (100KB/4096/64 are starting points -- adjust based on observed Claude Code input sizes)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MGMT-01 | Install and health-check verify Node.js minimum version and Graphiti dependency status | New `stageNodeVersion()` function in stages.cjs; new step in install.cjs; Graphiti status already checked by existing stageDocker + stageGraphitiApi stages (health-check) and Step 8 post-install health check (install) |
| MGMT-08a | Hook dispatcher validates JSON structure and enforces field length limits on all input | Validation layer in dynamo-hooks.cjs between `JSON.parse(input)` and event routing switch; uses `logError()` for violation logging |
| MGMT-08b | `additionalContext` injection includes boundary markers to prevent prompt injection bleed | Stdout interception in dispatcher using `process.stdout.write` monkey-patch; wraps handler output in XML-style boundary tags |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | Built-in (Node 22+) | Test framework | Zero-dependency, already used for 404+ tests in this project |
| node:assert | Built-in | Assertions | Already used throughout test suite |
| node:fs | Built-in | File system ops | Used by logError(), stages, install |
| node:child_process | Built-in | execSync for Docker/version checks | Already used in stages.cjs for Docker stage |
| node:os | Built-in | Platform detection, homedir | Already used throughout |

### Supporting
No additional libraries needed. All three requirements are pure Node.js built-in work. The project has a strict zero-npm-dependency constraint.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual JSON validation | JSON Schema (ajv) | Would violate zero-dependency constraint. Manual validation is sufficient for 5-field schema |
| process.stdout.write interception | Handler return values | Would require refactoring all 5 handlers to return strings instead of writing to stdout. Interception is non-invasive |

**Installation:**
```bash
# No installation needed -- all Node.js built-ins
```

## Architecture Patterns

### Recommended Implementation Structure
```
cc/hooks/
  dynamo-hooks.cjs           # Add: validation layer + stdout boundary wrapping
subsystems/terminus/
  stages.cjs                 # Add: stageNodeVersion() function
  health-check.cjs           # Add: Node.js version stage to HEALTH_STAGE_DEFS array
subsystems/switchboard/
  install.cjs                # Add: dependency check step before file copying
dynamo/tests/
  ledger/dispatcher.test.cjs # Add: validation and boundary marker tests
  switchboard/
    stages.test.cjs          # Add: stageNodeVersion tests
    health-check.test.cjs    # Update: expect 7 stages instead of 6
    install.test.cjs         # Add: dependency check step tests
```

### Pattern 1: Stage Function Convention (for MGMT-01)
**What:** Each diagnostic/health-check stage is an async function returning `{ status, detail, raw }`.
**When to use:** Adding new stages to the health-check or diagnose pipeline.
**Example:**
```javascript
// Source: subsystems/terminus/stages.cjs (existing convention)
async function stageNodeVersion(options = {}) {
  const { verbose = false } = options;
  try {
    const version = process.version; // e.g., 'v24.13.1'
    const major = parseInt(version.slice(1).split('.')[0], 10);
    if (major >= 22) {
      return ok(`Node.js ${version} (meets minimum v22.x)`);
    }
    return fail(`Node.js ${version} is below minimum v22.x. Install Node.js 22 or later.`);
  } catch (e) {
    return fail(`Version check failed: ${e.message}`);
  }
}
```

### Pattern 2: Install Step Convention (for MGMT-01)
**What:** Each install step pushes `{ name, status, detail }` to the steps array.
**When to use:** Adding new steps to the install pipeline.
**Example:**
```javascript
// Source: subsystems/switchboard/install.cjs (existing convention)
// Step N: Check dependencies
try {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);
  if (major >= 22) {
    steps.push({ name: 'Check dependencies', status: 'OK', detail: `Node.js ${version}` });
  } else {
    steps.push({ name: 'Check dependencies', status: 'WARN', detail: `Node.js ${version} is below minimum v22.x` });
  }
} catch (e) {
  steps.push({ name: 'Check dependencies', status: 'WARN', detail: e.message });
}
```

### Pattern 3: Dispatcher Validation Layer (for MGMT-08a)
**What:** Input validation between JSON.parse and event routing, using early return with logError.
**When to use:** Validating incoming hook event data.
**Example:**
```javascript
// Validate parsed data before routing
const VALID_EVENTS = new Set(['SessionStart', 'UserPromptSubmit', 'PostToolUse', 'PreCompact', 'Stop']);

function validateInput(data) {
  const violations = [];

  // Required: hook_event_name
  if (!data.hook_event_name || typeof data.hook_event_name !== 'string') {
    violations.push('missing or invalid hook_event_name');
  } else if (data.hook_event_name.length > 64) {
    violations.push('hook_event_name exceeds 64 chars');
  } else if (!VALID_EVENTS.has(data.hook_event_name)) {
    violations.push('unknown hook_event_name: ' + data.hook_event_name);
  }

  // Optional type checks
  if (data.tool_name !== undefined && typeof data.tool_name !== 'string') {
    violations.push('tool_name must be a string');
  }
  if (data.tool_input !== undefined && (typeof data.tool_input !== 'object' || data.tool_input === null)) {
    violations.push('tool_input must be an object');
  }
  if (data.cwd !== undefined) {
    if (typeof data.cwd !== 'string') {
      violations.push('cwd must be a string');
    } else if (data.cwd.length > 4096) {
      violations.push('cwd exceeds 4096 chars');
    }
  }

  // Field length: tool_input string values
  if (data.tool_input && typeof data.tool_input === 'object') {
    for (const [key, val] of Object.entries(data.tool_input)) {
      if (typeof val === 'string' && val.length > 102400) {
        violations.push(`tool_input.${key} exceeds 100KB`);
      }
    }
  }

  return violations;
}
```

### Pattern 4: Stdout Boundary Wrapping (for MGMT-08b)
**What:** Intercept handler stdout in the dispatcher using process.stdout.write monkey-patch, then wrap collected output in boundary markers.
**When to use:** Wrapping all additionalContext injection in security boundaries.
**Example:**
```javascript
// In dispatcher, before calling handler:
const chunks = [];
const origWrite = process.stdout.write;
process.stdout.write = (chunk) => {
  chunks.push(typeof chunk === 'string' ? chunk : chunk.toString());
  return true;
};

try {
  await handler(ctx);
} finally {
  process.stdout.write = origWrite;
}

// Wrap collected output in boundary markers
const output = chunks.join('');
if (output) {
  const wrapped = '<dynamo-memory-context>\n' + output + '\n</dynamo-memory-context>';
  origWrite.call(process.stdout, wrapped);
}
```

### Anti-Patterns to Avoid
- **Modifying handlers to return strings:** Would require refactoring 5 handler files and changing their contract. Use stdout interception instead -- non-invasive and centralizes boundary logic.
- **Blocking Claude Code on validation failure:** The invariant is "always exit 0." Validation failures log and exit silently, never throw or use non-zero exit codes.
- **Version-gating install:** Per the locked decision, version mismatch during install is a WARN, not FAIL. Install must complete even on older Node.js to allow emergency operations.
- **Per-handler boundary markers:** Boundary markers belong in the dispatcher (single enforcement point). Adding them to individual handlers creates duplication and risks gaps.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Node.js version parsing | Custom semver parser | `process.version` + `parseInt` for major | process.version is always available, major version check is sufficient |
| JSON schema validation | Full JSON Schema library | Simple function with field checks | Only 5 fields to validate, no nested schemas, zero-dependency constraint |
| Stdout interception | Custom stream wrapper | Monkey-patch `process.stdout.write` | Standard Node.js pattern for capturing output, reversible, well-understood |

**Key insight:** The scope is narrow enough that hand-rolled solutions are actually appropriate here -- no library would simplify a 5-field validation or a version number comparison.

## Common Pitfalls

### Pitfall 1: Forgetting to Restore process.stdout.write
**What goes wrong:** If handler throws and stdout.write is not restored, subsequent output (including error logging to stderr that might conditionally use stdout) breaks.
**Why it happens:** Missing try/finally around the handler call.
**How to avoid:** Always use try/finally to restore the original process.stdout.write, regardless of handler outcome.
**Warning signs:** Tests that capture stdout see empty output or doubled output.

### Pitfall 2: Health-Check Stage Count Hardcoded in Tests
**What goes wrong:** Existing health-check tests assert exactly 6 stages. Adding a 7th stage breaks these assertions.
**Why it happens:** Test file has `assert.strictEqual(result.stages.length, 6)`.
**How to avoid:** Update the count assertion in `health-check.test.cjs` to expect 7, and add a mock for the new stage in all test setups.
**Warning signs:** Test failures in health-check.test.cjs after adding Node.js version stage.

### Pitfall 3: Boundary Markers Breaking JSON Output
**What goes wrong:** If a handler outputs JSON (for `hookSpecificOutput.additionalContext` format), wrapping it in text markers makes it unparseable.
**Why it happens:** Current handlers use plain text stdout, but the format could theoretically change.
**How to avoid:** Current handlers all use plain text stdout (`process.stdout.write('[GRAPHITI MEMORY CONTEXT]\n...')`) -- not JSON. The boundary wrapper should treat all output as plain text, which is correct for the current implementation. If JSON format is ever needed, the wrapper would need to detect and handle it.
**Warning signs:** Claude Code not receiving context from hooks.

### Pitfall 4: Validation Rejecting Unknown Fields
**What goes wrong:** Claude Code may add new fields to the hook input JSON in future versions. If validation rejects unknown fields, hooks break on Claude Code updates.
**Why it happens:** Overly strict schema validation.
**How to avoid:** Only validate KNOWN fields. Ignore unknown fields entirely. The validation is a safety net, not a schema enforcer.
**Warning signs:** Hooks suddenly failing after a Claude Code update.

### Pitfall 5: install.cjs Step Ordering
**What goes wrong:** If the dependency check step is placed after file copying, a failed copy could mask the dependency issue.
**Why it happens:** Not considering the step execution order.
**How to avoid:** Place the dependency check as the first step (Step 0/1) -- it should run before any file operations. Per the locked decision, it warns and continues (doesn't block install).
**Warning signs:** Users seeing "copy failed" errors when the real issue is Node.js version.

### Pitfall 6: PreCompact Hook and additionalContext
**What goes wrong:** According to official Claude Code docs, PreCompact does NOT support additionalContext. The current `preserve-knowledge.cjs` handler writes to stdout, but this output may be silently ignored by Claude Code.
**Why it happens:** Discrepancy between hook implementation and Claude Code's hook event capabilities.
**How to avoid:** Still wrap PreCompact output in boundary markers (it doesn't hurt), but be aware this output may not reach Claude's context. This is an existing behavior, not introduced by Phase 20.
**Warning signs:** PreCompact context not appearing after compaction. This predates Phase 20 and is outside scope.

## Code Examples

### Node.js Version Check Stage
```javascript
// Source: Follows convention from subsystems/terminus/stages.cjs
async function stageNodeVersion(options = {}) {
  const { verbose = false, minMajor = 22 } = options;
  try {
    const version = process.version; // e.g., 'v24.13.1'
    const major = parseInt(version.slice(1).split('.')[0], 10);

    if (isNaN(major)) {
      return fail('Could not parse Node.js version from: ' + version);
    }

    if (major >= minMajor) {
      return ok('Node.js ' + version + ' (meets minimum v' + minMajor + '.x)');
    }

    return fail(
      'Node.js ' + version + ' is below minimum v' + minMajor + '.x. ' +
      'Install Node.js ' + minMajor + ' or later: https://nodejs.org/'
    );
  } catch (e) {
    return fail('Version check error: ' + e.message);
  }
}
```

### Dispatcher Input Validation
```javascript
// Source: Pattern based on existing dispatcher structure in cc/hooks/dynamo-hooks.cjs
const VALID_EVENTS = new Set([
  'SessionStart', 'UserPromptSubmit', 'PostToolUse', 'PreCompact', 'Stop'
]);

const LIMITS = {
  hook_event_name: 64,
  cwd: 4096,
  tool_input_value: 102400  // 100KB per string value
};

function validateInput(data) {
  const violations = [];

  // hook_event_name: required, must be known event
  if (!data.hook_event_name || typeof data.hook_event_name !== 'string') {
    violations.push('missing or non-string hook_event_name');
    return violations; // Can't route without event name
  }
  if (data.hook_event_name.length > LIMITS.hook_event_name) {
    violations.push('hook_event_name exceeds ' + LIMITS.hook_event_name + ' chars');
    return violations;
  }
  if (!VALID_EVENTS.has(data.hook_event_name)) {
    violations.push('unknown hook_event_name: ' + data.hook_event_name.slice(0, 64));
    return violations;
  }

  // Optional field type checks (don't reject unknown fields)
  if (data.tool_name !== undefined && typeof data.tool_name !== 'string') {
    violations.push('tool_name is not a string');
  }
  if (data.tool_input !== undefined && (typeof data.tool_input !== 'object' || data.tool_input === null || Array.isArray(data.tool_input))) {
    violations.push('tool_input is not an object');
  }
  if (data.cwd !== undefined) {
    if (typeof data.cwd !== 'string') {
      violations.push('cwd is not a string');
    } else if (data.cwd.length > LIMITS.cwd) {
      violations.push('cwd exceeds ' + LIMITS.cwd + ' chars');
    }
  }

  // tool_input string value length limits
  if (data.tool_input && typeof data.tool_input === 'object' && !Array.isArray(data.tool_input)) {
    for (const [key, val] of Object.entries(data.tool_input)) {
      if (typeof val === 'string' && val.length > LIMITS.tool_input_value) {
        violations.push('tool_input.' + key + ' exceeds 100KB (' + val.length + ' bytes)');
      }
    }
  }

  return violations;
}
```

### Stdout Boundary Wrapping in Dispatcher
```javascript
// Source: Pattern for wrapping handler stdout in dispatcher
// XML-style tags chosen because:
// 1. Claude Code processes plain text stdout as additionalContext
// 2. XML tags are semantically clear to Claude (LLM-native delimiter)
// 3. They nest well with existing section markers like [GRAPHITI MEMORY CONTEXT]

const BOUNDARY_OPEN = '<dynamo-memory-context source="dynamo-hooks">';
const BOUNDARY_CLOSE = '</dynamo-memory-context>';

// Before handler call:
const stdoutChunks = [];
const originalWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, encoding, callback) => {
  // Capture all handler stdout
  if (typeof chunk === 'string') {
    stdoutChunks.push(chunk);
  } else if (Buffer.isBuffer(chunk)) {
    stdoutChunks.push(chunk.toString(encoding || 'utf8'));
  }
  // Return true to indicate write was handled
  if (typeof callback === 'function') callback();
  return true;
};

try {
  // Route to handler (existing switch statement)
  await handler(ctx);
} finally {
  // ALWAYS restore original stdout
  process.stdout.write = originalWrite;
}

// Wrap and emit collected output
const handlerOutput = stdoutChunks.join('');
if (handlerOutput.length > 0) {
  originalWrite(BOUNDARY_OPEN + '\n' + handlerOutput + '\n' + BOUNDARY_CLOSE);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No input validation | MGMT-08a adds schema validation | Phase 20 | Prevents malformed input from reaching handlers |
| No version verification | MGMT-01 adds Node.js version check | Phase 20 | Early warning for environment issues |
| Raw stdout injection | MGMT-08b adds boundary markers | Phase 20 | Prevents prompt content from bleeding into system instructions |
| Graphiti status checked only in health-check | Now also checked in install Step 8 | Already implemented | Post-install health check already runs all 6 stages including Docker and API |

**Existing Graphiti dependency check:** The health-check already verifies Docker containers (stageDocker) and API health (stageGraphitiApi). The install pipeline already runs health-check as Step 8. MGMT-01 adds Node.js version verification as a NEW stage, but Graphiti dependency status is already covered by existing stages. The CONTEXT.md decision to "report Graphiti dependency status" during health-check is already satisfied -- the new work is adding the Node.js version check.

## Design Decisions (Claude's Discretion)

### Boundary Marker Format: XML-style Tags
**Decision:** Use `<dynamo-memory-context>` and `</dynamo-memory-context>` XML-style tags.

**Rationale:**
1. Claude (the LLM) natively understands XML tag boundaries as semantic delimiters
2. XML tags clearly communicate "this is structured data from a specific source"
3. They are visually distinct from the existing bracket-style section markers (`[GRAPHITI MEMORY CONTEXT]`, `[RELEVANT MEMORY]`)
4. The `source="dynamo-hooks"` attribute identifies the origin unambiguously
5. They are harder to accidentally replicate in user content than bracket markers

**Alternative considered:** Bracket-style `[--- DYNAMO MEMORY CONTEXT START ---]` / `[--- END ---]`. Less semantically clear to Claude, easier to forge in prompts.

### Canary/Nonce: Not Adding
**Decision:** Skip canary nonce in boundary markers for Phase 20.

**Rationale:** Canary tokens are L5 defense in FEATURES.md, explicitly listed as "Add After Validation." The boundary markers (L3) are the current scope. Adding a nonce would require verification logic that detects if the nonce appears in Claude's output, which is a separate monitoring concern. Phase 20 focuses on L1 (schema validation) and L3 (boundary markers).

### Node.js Version Check Smoke Test: Skip
**Decision:** Check `process.version` only, do not run `require('node:test')` as a smoke test.

**Rationale:** If `process.version` reports 22+ but `node:test` is somehow unavailable, that's a corrupted Node.js installation that would manifest in test failures immediately. Adding a smoke test inside the health check adds latency for an edge case that's effectively impossible on standard installations.

### Field Length Limits: Use Starting Values
**Decision:** Keep the CONTEXT.md starting values: 100KB for tool_input string values, 4096 for cwd, 64 for hook_event_name.

**Rationale:** These are generous limits. The largest real-world tool_input is file content from Write/Edit operations, which can be tens of KB for large files. 100KB provides headroom. cwd paths are rarely over 200 chars. hook_event_name is at most 18 chars ("UserPromptSubmit"). These limits are safety nets, not optimization targets.

## Open Questions

1. **PreCompact stdout behavior**
   - What we know: Official Claude Code docs list PreCompact as NOT supporting additionalContext. But the current preserve-knowledge.cjs handler writes to stdout.
   - What's unclear: Whether Claude Code silently ignores PreCompact stdout or processes it as context.
   - Recommendation: Wrap PreCompact output in boundary markers anyway (consistent behavior), but don't rely on it for security guarantees. This is a pre-existing concern, not introduced by Phase 20.

2. **Claude Code future input field additions**
   - What we know: Claude Code may add new fields (e.g., `agent_id`, `agent_type` for subagents) to hook input JSON.
   - What's unclear: Whether any new fields could exceed our length limits.
   - Recommendation: Only validate known fields. Ignore unknown fields. This is explicitly addressed in the validation design.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node 22+) |
| Config file | None -- uses `node --test` CLI |
| Quick run command | `node --test dynamo/tests/ledger/dispatcher.test.cjs dynamo/tests/switchboard/stages.test.cjs dynamo/tests/switchboard/health-check.test.cjs dynamo/tests/switchboard/install.test.cjs` |
| Full suite command | `node --test` (runs all 404+ tests) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MGMT-01 | stageNodeVersion returns OK for Node 22+ | unit | `node --test dynamo/tests/switchboard/stages.test.cjs` | Needs new tests |
| MGMT-01 | stageNodeVersion returns FAIL for Node < 22 | unit | `node --test dynamo/tests/switchboard/stages.test.cjs` | Needs new tests |
| MGMT-01 | Health-check includes Node.js version stage | unit | `node --test dynamo/tests/switchboard/health-check.test.cjs` | Exists, needs update (6 -> 7 stages) |
| MGMT-01 | Install has dependency check step | unit | `node --test dynamo/tests/switchboard/install.test.cjs` | Exists, needs new test |
| MGMT-08a | Dispatcher rejects missing hook_event_name | unit | `node --test dynamo/tests/ledger/dispatcher.test.cjs` | Needs new tests |
| MGMT-08a | Dispatcher rejects unknown hook_event_name | unit | `node --test dynamo/tests/ledger/dispatcher.test.cjs` | Needs new tests |
| MGMT-08a | Dispatcher rejects oversized fields | unit | `node --test dynamo/tests/ledger/dispatcher.test.cjs` | Needs new tests |
| MGMT-08a | Dispatcher logs violations to hook-errors.log | unit | `node --test dynamo/tests/ledger/dispatcher.test.cjs` | Needs new tests |
| MGMT-08b | Dispatcher wraps handler stdout in boundary markers | unit | `node --test dynamo/tests/ledger/dispatcher.test.cjs` | Needs new tests |
| MGMT-08b | Boundary markers present for SessionStart output | unit | `node --test dynamo/tests/ledger/dispatcher.test.cjs` | Needs new tests |
| MGMT-08b | Empty handler output produces no boundary markers | unit | `node --test dynamo/tests/ledger/dispatcher.test.cjs` | Needs new tests |
| MGMT-08b | Existing section markers preserved inside boundaries | unit | `node --test dynamo/tests/ledger/dispatcher.test.cjs` | Needs new tests |

### Sampling Rate
- **Per task commit:** `node --test dynamo/tests/ledger/dispatcher.test.cjs dynamo/tests/switchboard/stages.test.cjs dynamo/tests/switchboard/health-check.test.cjs dynamo/tests/switchboard/install.test.cjs`
- **Per wave merge:** `node --test` (full suite, currently 404 tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New tests in `dynamo/tests/ledger/dispatcher.test.cjs` -- covers MGMT-08a and MGMT-08b (validation + boundary markers)
- [ ] New tests in `dynamo/tests/switchboard/stages.test.cjs` -- covers MGMT-01 stageNodeVersion
- [ ] Update existing tests in `dynamo/tests/switchboard/health-check.test.cjs` -- stage count 6 -> 7
- [ ] New test in `dynamo/tests/switchboard/install.test.cjs` -- covers MGMT-01 dependency check step
- No framework install needed -- node:test is built-in

## Implementation Notes

### Current Dispatcher Flow (dynamo-hooks.cjs)
```
stdin -> JSON.parse -> toggle gate -> detectProject -> SCOPE -> switch(event) -> handler -> exit 0
```

### New Dispatcher Flow (after Phase 20)
```
stdin -> JSON.parse -> LOG malformed JSON specifically (enhanced existing catch)
      -> toggle gate
      -> validateInput() -> violations? log + exit 0
      -> detectProject -> SCOPE
      -> intercept stdout
      -> switch(event) -> handler
      -> restore stdout
      -> wrap output in boundary markers
      -> exit 0
```

### Key Integration Points

1. **stages.cjs:** Add `stageNodeVersion` function to exports. Add `'Node.js Version'` to STAGE_NAMES array (at position 0 or end). Export from module alongside other stage functions.

2. **health-check.cjs:** Add Node.js version to HEALTH_STAGE_DEFS. Best position: as the first stage (index 0) with no dependencies, or as an independent stage like Env Vars. Choose position that doesn't shift dependency indices for existing stages -- safest to append at the end or insert it alongside the independent Env Vars stage.

3. **install.cjs:** Add dependency check as new Step 0 (before file copy). WARN on failure (don't block install).

4. **dynamo-hooks.cjs:** Add `validateInput()` function after JSON.parse block. Add stdout interception around handler calls. Maintain invariant: always exit 0.

### Health-Check Stage Array Update Strategy
The current HEALTH_STAGE_DEFS has 6 entries with index-based dependsOn. Adding a new stage requires careful index management:
- **Safest approach:** Append the Node.js version stage at the END (index 6) with `dependsOn: []` (independent, like Env Vars). This avoids shifting any existing indices.
- **Alternative:** Insert at index 0 (conceptually "first check"). This would require incrementing all existing dependsOn indices. More disruptive.
- **Recommendation:** Append at the end. The stage runs independently and its position in the output doesn't affect correctness.

### Existing Test Patterns to Follow
The test suite uses **mock-by-reassignment** (not node:test mock API). Stage functions are reassigned directly:
```javascript
const origDocker = stagesModule.stageDocker;
stagesModule.stageDocker = async () => okResult('Docker OK');
try { /* test */ } finally { stagesModule.stageDocker = origDocker; }
```
New tests for stageNodeVersion should follow this pattern. For dispatcher tests, the existing tests use source-level assertions (checking file content with `fs.readFileSync`), not behavioral tests. New validation and boundary tests may need behavioral testing via child_process.execSync to actually run the dispatcher with crafted stdin input.

## Sources

### Primary (HIGH confidence)
- `cc/hooks/dynamo-hooks.cjs` -- Current dispatcher implementation (64 LOC, well-understood)
- `subsystems/terminus/stages.cjs` -- Current 13 stage functions, ok/fail/warn/skip helpers
- `subsystems/terminus/health-check.cjs` -- Current 6-stage health check with dependency graph
- `subsystems/switchboard/install.cjs` -- Current 8-step install pipeline
- `lib/core.cjs` -- logError() function, DYNAMO_DIR constant
- `subsystems/ledger/hooks/session-start.cjs` -- Stdout injection pattern: `[GRAPHITI MEMORY CONTEXT]`
- `subsystems/ledger/hooks/prompt-augment.cjs` -- Stdout injection pattern: `[RELEVANT MEMORY]`
- `subsystems/ledger/hooks/preserve-knowledge.cjs` -- Stdout injection pattern: `[PRESERVED KNOWLEDGE]`
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) -- Official documentation on hook input/output format, additionalContext support

### Secondary (MEDIUM confidence)
- `.planning/research/FEATURES.md` -- MGMT-01 and MGMT-08 feature analysis, L1-L6 defense layers
- `.planning/research/SWITCHBOARD-SPEC.md` -- Dispatcher architecture, hook handler contracts
- `.planning/research/DYNAMO-PRD.md` -- Section 6.5 security requirements

### Tertiary (LOW confidence)
- None -- all findings verified against source code or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zero external dependencies, all Node.js built-ins already in use
- Architecture: HIGH - All three requirements extend existing, well-understood patterns (stages, steps, dispatcher flow)
- Pitfalls: HIGH - Identified through source code analysis and Claude Code documentation review

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable patterns, unlikely to change)

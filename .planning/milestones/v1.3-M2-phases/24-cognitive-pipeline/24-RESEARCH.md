# Phase 24: Cognitive Pipeline - Research

**Researched:** 2026-03-20
**Domain:** Cognitive processing pipeline, dual-path routing, subagent integration, curation migration
**Confidence:** HIGH

## Summary

Phase 24 replaces seven pass-through stub handlers with real cognitive processing pipelines. The existing codebase provides a strong foundation: `activation.cjs` (entity extraction, spreading activation, decay, sublimation scoring -- all unit tested), `state.cjs` (atomic load/persist with corruption recovery), and a working dispatcher with dual-mode routing. The phase creates three new core modules (`inner-voice.cjs`, `dual-path.cjs`, `curation.cjs`), rewrites all seven handler internals, creates the `cc/agents/inner-voice.md` subagent definition, and adds new prompt templates for adversarial counter-prompting and session briefings.

The primary technical challenges are: (1) keeping the hot path under 500ms while performing entity extraction, activation updates, sublimation scoring, and template-based injection formatting; (2) implementing the state bridge pattern where SubagentStop writes a correlation-ID-tagged result file that the next UserPromptSubmit atomically consumes via `fs.renameSync`; and (3) migrating all five curation functions from Ledger's OpenRouter/Haiku path to Reverie's subagent-based processing while maintaining template fallbacks for degradation. The subagent spawn mechanism uses `additionalContext` injection from the UserPromptSubmit hook to instruct the main session to spawn the inner-voice subagent -- the hook cannot directly spawn subagents.

**Primary recommendation:** Build bottom-up -- core modules first (inner-voice.cjs, dual-path.cjs, curation.cjs), then handler rewrites (starting with UserPromptSubmit as the most complex), then subagent definition and state bridge, then prompt templates. Each layer is independently testable.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Contextual narrative tone for all injections. Frames facts in context: "When you worked on X last session, you decided Y because Z."
- **D-02:** Distinct formats for hot path vs deliberation. Hot path uses shorter, bullet-oriented narrative (template-based, no LLM). Deliberation produces fuller paragraphs with reasoning and cross-entity connections.
- **D-03:** Light framing for adversarial counter-prompting. Templates wrap facts with "from user's experience" and "as they described it" qualifiers.
- **D-04:** Session-start briefings use the same contextual narrative format as mid-session, just longer (500 tokens vs 150). Consistent voice throughout.
- **D-05:** Full migration. All 5 curation functions move from Ledger to Reverie as subagent-based processing. OpenRouter/Haiku dependency removed entirely from the cortex path.
- **D-06:** Template fallback on degradation. When subagent spawn fails or rate limit is hit, hot-path template formatting produces reduced-quality but functional injections.
- **D-07:** Inner-voice subagent definition lives at `cc/agents/inner-voice.md`.
- **D-08:** Existing cc/prompts/ templates kept for classic mode.
- **D-09:** Adaptive sublimation threshold from conservative posture. Start at 0.6 (spec default).
- **D-10:** Keyword overlap for semantic shift detection (v1.3). Compare entity sets between consecutive prompts.
- **D-11:** Explicit recall ("do you remember X") triggers recall + deliberation. Bypass sublimation threshold entirely AND spawn deliberation subagent.
- **D-12:** Complete silence when predictions match reality.
- **D-13:** No hard budget enforcement in Phase 24. High soft cap (default 50) that warns in logs.
- **D-14:** SessionStart always triggers deliberation.
- **D-15:** Stop always triggers deliberation for REM Tier 3 synthesis.

### Claude's Discretion
- PreCompact deliberation heuristic (when to spawn subagent for compact summary vs state-persistence-only)
- Exact keyword overlap threshold for semantic shift detection calibration
- Threshold adaptation speed (how fast the sublimation threshold adjusts)
- Metacognitive adjustment range (spec says +/- 0.1, exact implementation flexible)
- Hot-path template variable design and structure
- Rate limit recovery timing

### Deferred Ideas (OUT OF SCOPE)
- Embedding-based semantic shift detection (MENH-08, M4) -- using keyword overlap for v1.3
- Narrative session briefings with relational framing (v1.4) -- factual briefings for v1.3
- Full REM consolidation (retroactive evaluation, observation synthesis, cascade promotion) -- deferred to v1.4
- OpenRouter sunset from classic mode -- post-M2, after cortex mode proves reliable
- Hard budget calibration -- gather baseline data during hybrid mode (Phase 25) first
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IV-05 | Injection formatting respects token limits (500/150/50) following Cognitive Load Theory | REVERIE-SPEC Section 2.1, Section 4.2 latency budget; template-based formatting with `tokenEstimate()` function |
| IV-06 | Self-model persists across sessions (attention state, injection mode, confidence, working patterns) | State schema already has `self_model` section in `freshDefaults()` (currently stubbed); Phase 24 activates it |
| IV-07 | Curation functions migrate from Ledger to Reverie as subagent-based processing | `ledger/curation.cjs` has 4 functions (callHaiku, curateResults, summarizeText, generateSessionName); all move to `reverie/curation.cjs` with subagent-based execution |
| IV-08 | Curation templates use adversarial counter-prompting | D-03 decision: light framing with "from user's experience" qualifiers; new `cc/prompts/adversarial-counter.md` template |
| IV-09 | Semantic shift detection triggers injection on topic changes using keyword overlap | D-10 decision: compare entity sets between consecutive prompts; deterministic, <5ms |
| IV-11 | Explicit recall bypass skips sublimation threshold when user asks "do you remember X?" | D-11 decision: pattern match on recall-intent phrases, bypass threshold, spawn deliberation |
| PATH-01 | Deterministic path selection (hot/deliberation/skip) without LLM call | REVERIE-SPEC Section 3.2 `dual-path.cjs` signal table; 6 deterministic signals |
| PATH-02 | Hot path under 500ms with per-step timing instrumentation and 400ms abort threshold | REVERIE-SPEC Section 4.2 latency budget breakdown; `performance.now()` per step |
| PATH-03 | Deliberation path spawns inner-voice subagent (Sonnet, read-only tools, dontAsk) | Claude Code subagent docs confirm: `model: sonnet`, `tools` allowlist, `permissionMode: dontAsk`, `maxTurns: 10` |
| PATH-04 | Deliberation degrades gracefully to hot-path-only when spawn fails or daily cap reached | Existing `checkSpawnBudget()` in `activation.cjs` (OPS-MON-01 from Phase 23); runtime flag pattern |
| PATH-05 | State bridge: SubagentStop writes with correlation ID and 60s TTL, consumed atomically by next UserPromptSubmit via fs.renameSync | REVERIE-SPEC Section 4.3; SubagentStop hook receives `last_assistant_message` and `agent_id` fields |
| PATH-06 | Rate limit detection sets runtime flag; degrades to hot-path-only until cleared | Existing `setRateLimited()` in `activation.cjs` (OPS-MON-02 from Phase 23) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins | 20+ | `fs`, `path`, `os`, `crypto`, `perf_hooks` | Zero dependencies; project uses no npm packages for core logic |
| `node:test` | Node 20+ built-in | Unit testing framework | Established project pattern; all 32 existing test files use `node:test` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `performance.now()` (via `perf_hooks`) | Node 20+ | Sub-millisecond timing for hot path instrumentation | PATH-02 requires per-step timing visible in debug output |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Template-based formatting | Subagent for all formatting | Templates keep hot path under 500ms; subagents add 2-8s latency |
| Keyword overlap for semantic shift | Embedding cosine distance | Embeddings need external API call (latency, cost); keyword overlap is deterministic and <5ms; deferred to M4/MENH-08 |
| `fs.renameSync` for state bridge consumption | `fs.unlinkSync` after read | `renameSync` is atomic on same filesystem; prevents double-consumption race condition |

**Installation:** No new dependencies. All modules use Node.js built-ins.

## Architecture Patterns

### Recommended Project Structure
```
subsystems/reverie/
  inner-voice.cjs       # NEW: Core pipeline orchestrator
  dual-path.cjs         # NEW: Hot/deliberation path routing
  curation.cjs          # NEW: Subagent-based curation (migrated from Ledger)
  activation.cjs        # EXISTING: Entity extraction, activation, decay, scoring
  state.cjs             # EXISTING: State load/persist with corruption recovery
  handlers/
    session-start.cjs   # REWRITE: Replace pass-through with cognitive pipeline
    user-prompt.cjs     # REWRITE: Replace pass-through with cognitive pipeline
    post-tool-use.cjs   # REWRITE: Replace pass-through with activation update
    pre-compact.cjs     # REWRITE: Replace pass-through with REM Tier 1
    stop.cjs            # REWRITE: Replace pass-through with REM Tier 3
    iv-subagent-start.cjs  # REWRITE: Replace no-op with context injection
    iv-subagent-stop.cjs   # REWRITE: Replace no-op with state bridge write

cc/agents/
  inner-voice.md        # NEW: Custom subagent definition (YAML frontmatter + system prompt)

cc/prompts/
  curation.md           # EXISTING: Kept for classic mode
  precompact.md         # EXISTING: Kept for classic mode
  prompt-context.md     # EXISTING: Kept for classic mode
  session-name.md       # EXISTING: Kept for classic mode
  session-summary.md    # EXISTING: Kept for classic mode
  iv-briefing.md        # NEW: Session-start briefing template
  iv-injection.md       # NEW: Mid-session injection template
  iv-adversarial.md     # NEW: Adversarial counter-prompting template
  iv-precompact.md      # NEW: PreCompact summary template
  iv-synthesis.md       # NEW: Session-end synthesis template

Runtime state files (~/.claude/dynamo/):
  inner-voice-state.json               # EXISTING: Extended with active self_model
  inner-voice-deliberation-result.json  # NEW: Transient state bridge file
```

### Pattern 1: Pipeline Orchestrator (inner-voice.cjs)
**What:** Central module that implements per-hook processing pipelines. Each pipeline loads state, processes the event through a sequence of deterministic steps, and returns an injection result or null.
**When to use:** Every handler delegates to inner-voice.cjs for its cognitive processing.
**Example:**
```javascript
// Source: REVERIE-SPEC Section 3.2
module.exports = {
  processUserPrompt(promptData, state, pendingResult, options = {}) {
    // Returns { injection: string|null, updatedState: object }
  },
  processSessionStart(sessionData, state, options = {}) {
    // Returns { briefing: string, updatedState: object }
  },
  processStop(sessionData, state, options = {}) {
    // Returns { synthesis: object, updatedState: object }
  },
  processPreCompact(compactData, state, options = {}) {
    // Returns { summary: string, updatedState: object }
  },
  processPostToolUse(toolData, state, options = {}) {
    // Returns { updatedState: object }
  }
};
```

### Pattern 2: Deterministic Path Selection (dual-path.cjs)
**What:** Signal-based routing that decides hot/deliberation/skip without any LLM call.
**When to use:** Every UserPromptSubmit invocation; SessionStart and Stop have fixed paths (always deliberation).
**Example:**
```javascript
// Source: REVERIE-SPEC Section 3.2, Table of path selection signals
function selectPath(signals, options = {}) {
  // Explicit recall -> always deliberation
  if (signals.explicitRecall) return 'deliberation';
  // Rate limited -> always hot
  if (signals.rateLimited) return 'hot';
  // Semantic shift -> deliberation
  if (signals.semanticShiftScore >= (options.shiftThreshold || 0.4)) return 'deliberation';
  // Low entity confidence -> deliberation
  if (signals.entityConfidence < (options.confidenceThreshold || 0.7)) return 'deliberation';
  // No injection needed -> skip
  if (!signals.needsInjection) return 'skip';
  // Default -> hot
  return 'hot';
}
```

### Pattern 3: State Bridge (SubagentStop -> UserPromptSubmit)
**What:** File-based state bridge with correlation ID, TTL, and atomic consumption.
**When to use:** When the inner-voice subagent completes deliberation and results need to be consumed by the next UserPromptSubmit.
**Example:**
```javascript
// Source: REVERIE-SPEC Section 4.3, Section 7.3
// SubagentStop writes:
const result = {
  status: 'complete',
  correlation_id: state.processing.last_deliberation_id,
  timestamp: new Date().toISOString(),
  injection: input.last_assistant_message || '',
  agent_id: input.agent_id || 'unknown',
  ttl_seconds: 60
};
fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2));

// UserPromptSubmit consumes atomically:
if (fs.existsSync(RESULT_PATH)) {
  const consumed = RESULT_PATH + '.consumed';
  fs.renameSync(RESULT_PATH, consumed);  // Atomic -- prevents double consumption
  const result = JSON.parse(fs.readFileSync(consumed, 'utf8'));
  fs.unlinkSync(consumed);               // Clean up
  const age = Date.now() - new Date(result.timestamp).getTime();
  if (age > (result.ttl_seconds || 60) * 1000) {
    // Stale result -- discard
  } else if (result.correlation_id !== state.processing.last_deliberation_id) {
    // Mismatched correlation -- discard
  } else {
    pendingInjection = result.injection;
  }
}
```

### Pattern 4: Hot Path Timing Instrumentation
**What:** Per-step `performance.now()` timing with 400ms abort threshold and debug-visible output.
**When to use:** Every hot-path execution in UserPromptSubmit handler.
**Example:**
```javascript
// Source: REVERIE-SPEC Section 4.2 latency budget
const { performance } = require('perf_hooks');
const timings = {};
const hotStart = performance.now();

timings.stateLoad = performance.now(); // Mark each step start
// ... state load ...
timings.stateLoad = performance.now() - timings.stateLoad;

// 400ms abort check
if (performance.now() - hotStart > 400) {
  logError('reverie-hot-path', 'Abort: exceeded 400ms at step X');
  return { injection: null, updatedState: state, timings, aborted: true };
}
```

### Pattern 5: Subagent Spawn Trigger via additionalContext
**What:** The hook cannot directly spawn subagents. Instead, the UserPromptSubmit hook returns an `additionalContext` string that instructs the main session to spawn the inner-voice subagent.
**When to use:** When dual-path.cjs selects the deliberation path.
**Example:**
```javascript
// Source: REVERIE-SPEC Section 13.2
// In the handler output, include a spawn instruction:
const spawnInstruction = '\n\n[INNER VOICE: Deep analysis queued. ' +
  'Spawn the inner-voice subagent to process ' + queuedEntities.length +
  ' entities requiring deliberation.]';
// This is included in additionalContext output
```

### Pattern 6: Token Estimation for Injection Budgets
**What:** Approximate token count for injection content to enforce CLT limits.
**When to use:** Before returning any injection from hot path or deliberation result consumption.
**Example:**
```javascript
// Source: Cognitive Load Theory constraints from REVERIE-SPEC Section 2.1
function estimateTokens(text) {
  // Rough heuristic: ~4 chars per token for English text
  return Math.ceil(text.length / 4);
}

function truncateToTokenLimit(text, limit) {
  const estimated = estimateTokens(text);
  if (estimated <= limit) return text;
  // Truncate at word boundary, preserving complete sentences
  const targetChars = limit * 4;
  const truncated = text.slice(0, targetChars);
  const lastSentence = truncated.lastIndexOf('. ');
  return lastSentence > 0 ? truncated.slice(0, lastSentence + 1) : truncated;
}
```

### Anti-Patterns to Avoid
- **LLM call in path selection:** The routing decision itself must never involve an LLM call. All path selection is deterministic based on measurable signals.
- **Blocking on subagent result:** The deliberation path is asynchronous. Never wait for the subagent to complete within a single hook invocation. The result arrives via the state bridge on the *next* UserPromptSubmit.
- **Direct Terminus/MCP imports in Reverie:** Reverie reads through Assay and writes through Ledger. Never import from Terminus directly for graph operations.
- **Shared mutable state between handlers:** Each handler invocation loads state fresh from disk and persists after processing. No in-process shared state.
- **Embedding-based operations on the hot path:** Embeddings are M4/MENH-08. Use keyword overlap for semantic shift detection in v1.3.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic file writes | Custom locking | `fs.writeFileSync(tmp) + fs.renameSync(tmp, target)` | Already established pattern in `state.cjs`; rename is atomic on same filesystem |
| Entity extraction | NLP library | Existing `activation.cjs` `extractEntities()` | Already implemented and tested (49 unit tests) |
| Activation scoring | Custom scoring engine | Existing `activation.cjs` `computeSublimationScore()` | Already implements the full composite threshold function |
| Spawn budget tracking | Custom counter | Existing `activation.cjs` `checkSpawnBudget()` / `recordSpawn()` / `setRateLimited()` | Already implements OPS-MON-01/02 from Phase 23 |
| Config reading | Direct file I/O | Existing `lib/core.cjs` `loadConfig()` | Config loaded fresh from disk on every dispatch |
| Domain classification | Classification model | Existing `activation.cjs` `classifyDomainFrame()` | Keyword/regex heuristic, <1ms, unit tested |
| Prompt template loading | Custom parser | Existing `lib/core.cjs` `loadPrompt()` | Parses YAML frontmatter Markdown format |
| Error logging | Custom logger | Existing `lib/core.cjs` `logError()` | Auto-rotating hook-errors.log |

**Key insight:** Phase 23 built the computational foundation. Phase 24 is primarily orchestration and integration -- wiring existing modules together through the pipeline orchestrator, creating the subagent definition, and writing prompt templates. The heavy computational work (entity extraction, activation propagation, sublimation scoring) is already done.

## Common Pitfalls

### Pitfall 1: SubagentStop Cannot Inject Into Parent Context
**What goes wrong:** Attempting to use `additionalContext` in SubagentStop output to inject deliberation results directly into the parent session.
**Why it happens:** Claude Code GitHub issue #5812 confirms `additionalParentContext` was closed as NOT_PLANNED. SubagentStop hooks can write to files but cannot inject content into the parent session.
**How to avoid:** Use the state bridge pattern: SubagentStop writes to `inner-voice-deliberation-result.json`, next UserPromptSubmit reads and injects.
**Warning signs:** SubagentStop handler returning JSON with `additionalContext` -- this output is ignored by the platform.

### Pitfall 2: Subagent Spawn is Not Direct
**What goes wrong:** Expecting the hook code to directly invoke `claude --agent inner-voice` or similar.
**Why it happens:** Hooks are command-type processes that run and exit. They cannot spawn subagents directly.
**How to avoid:** The UserPromptSubmit hook returns `additionalContext` that includes an instruction for the main session model to spawn the inner-voice subagent. The main session decides whether to follow the instruction.
**Warning signs:** Trying to use `child_process.spawn()` or similar from hook code.

### Pitfall 3: Race Condition on State Bridge File
**What goes wrong:** Two UserPromptSubmit invocations both read the deliberation result file, leading to double injection.
**Why it happens:** `fs.readFileSync` + `fs.unlinkSync` is not atomic. Between read and delete, another hook could read the same file.
**How to avoid:** Use `fs.renameSync` to atomically move the file before reading. Rename is atomic on the same filesystem. The renamed file is private to the consuming process.
**Warning signs:** Deliberation results appearing twice in consecutive prompt responses.

### Pitfall 4: Hot Path Exceeds 500ms Due to Graph Queries
**What goes wrong:** Calling Assay's `combinedSearch()` on the hot path for activation propagation, which involves MCP transport to the Docker-hosted Graphiti server.
**Why it happens:** Each MCP call adds 100-300ms of latency (TCP, JSON-RPC, graph traversal, response).
**How to avoid:** The activation map is maintained in the state file (in-memory during processing). Assay is queried ONLY for full re-propagation events (semantic shift or session start). On normal prompts, activation updates use the cached map only.
**Warning signs:** Hot path timing instrumentation showing >200ms for activation update step.

### Pitfall 5: Stale Deliberation Results After Crash
**What goes wrong:** The inner-voice subagent crashes mid-processing, leaving a partial or stale result file.
**Why it happens:** Process termination before SubagentStop hook writes the complete result.
**How to avoid:** TTL enforcement (60s) on result files. If the result file is older than TTL, discard it. Correlation ID matching ensures the result corresponds to the current deliberation request.
**Warning signs:** Result file exists with `status: "processing"` indefinitely, or with a timestamp older than 60 seconds.

### Pitfall 6: Regex lastIndex State Leak
**What goes wrong:** Entity extraction returns inconsistent results across invocations.
**Why it happens:** Global regex patterns (`/g` flag) retain `lastIndex` state between `exec()` calls. The existing `extractEntities()` already handles this with `pattern.lastIndex = 0` reset.
**How to avoid:** The existing pattern in `activation.cjs` is correct. Any new regex patterns must follow the same reset pattern.
**Warning signs:** Tests passing in isolation but failing in sequence.

### Pitfall 7: Handler Output Format Mismatch
**What goes wrong:** Reverie handler returns JSON but dispatcher expects plain text for stdout boundary wrapping, or vice versa.
**Why it happens:** The dispatcher wraps stdout output in `<dynamo-memory-context>` boundary markers for non-subagent events but outputs raw JSON for SubagentStart/SubagentStop.
**How to avoid:** Non-subagent handlers write injection text to `process.stdout.write()` (the dispatcher intercepts and wraps it). SubagentStart handler returns the `additionalContext` object. SubagentStop handler writes to file, returns empty string.
**Warning signs:** Malformed injection context in Claude Code session; missing or doubled boundary markers.

### Pitfall 8: Curation Migration Breaks Classic Mode
**What goes wrong:** Moving curation functions from Ledger to Reverie breaks the classic mode path that still calls `ledger/curation.cjs`.
**Why it happens:** Classic mode handlers (`ledger/hooks/*.cjs`) import `curateResults` from `ledger/curation.cjs`.
**How to avoid:** D-08 decision is explicit: existing `cc/prompts/` templates and `ledger/curation.cjs` are KEPT for classic mode. The new `reverie/curation.cjs` is a separate module that Reverie handlers import. Ledger's curation module continues to serve classic mode unchanged.
**Warning signs:** Classic mode producing empty injections after Phase 24 changes.

## Code Examples

### Handler Rewrite Pattern (UserPromptSubmit)
```javascript
// Source: REVERIE-SPEC Section 5.1
// subsystems/reverie/handlers/user-prompt.cjs
'use strict';

const resolve = require('../../../lib/resolve.cjs');
const { loadConfig, logError } = require(resolve('lib', 'core.cjs'));
const { loadState, persistState } = require(resolve('reverie', 'state.cjs'));
const innerVoice = require(resolve('reverie', 'inner-voice.cjs'));

module.exports = async function reverieUserPrompt(ctx) {
  const config = loadConfig();
  const state = loadState();

  try {
    // Check for pending deliberation results
    const pendingResult = innerVoice.consumeDeliberationResult(state);

    // Run cognitive pipeline
    const { injection, updatedState } = innerVoice.processUserPrompt(
      { prompt: ctx.prompt, project: ctx.project, scope: ctx.scope },
      state,
      pendingResult,
      { config }
    );

    persistState(updatedState);

    if (injection) {
      process.stdout.write('[RELEVANT MEMORY]\n\n' + injection);
    }
  } catch (err) {
    logError('reverie-user-prompt', 'Handler error: ' + err.message);
  }
};
```

### Semantic Shift Detection (Keyword Overlap)
```javascript
// Source: D-10 decision, REVERIE-SPEC Section 5.1 step 5
function detectSemanticShift(currentEntities, previousEntities, options = {}) {
  const threshold = options.shiftThreshold || 0.3;

  if (!previousEntities || previousEntities.length === 0) {
    return { shifted: false, overlapScore: 1.0 };
  }

  const currentSet = new Set(currentEntities.map(e => e.name.toLowerCase()));
  const previousSet = new Set(previousEntities.map(e => e.name.toLowerCase()));

  const intersection = new Set([...currentSet].filter(x => previousSet.has(x)));
  const union = new Set([...currentSet, ...previousSet]);

  const overlapScore = union.size > 0 ? intersection.size / union.size : 1.0;
  return { shifted: overlapScore < threshold, overlapScore };
}
```

### Explicit Recall Detection
```javascript
// Source: D-11 decision, IV-11 requirement
const RECALL_PATTERNS = [
  /\bdo you (?:remember|recall|know)\b/i,
  /\bwhat do you (?:know|remember) about\b/i,
  /\bhave (?:we|you|I) (?:discussed|talked about|mentioned)\b/i,
  /\bremember when\b/i,
  /\brecall (?:the|our|my)\b/i
];

function detectExplicitRecall(text, options = {}) {
  return RECALL_PATTERNS.some(pattern => pattern.test(text));
}
```

### SubagentStart Context Injection
```javascript
// Source: REVERIE-SPEC Section 8.3, Claude Code hook docs
// subsystems/reverie/handlers/iv-subagent-start.cjs
module.exports = async function reverieSubagentStart(ctx) {
  if (!ctx || ctx.agent_type !== 'inner-voice') return null;

  const state = loadState();
  const context = {
    currentState: {
      self_model: state.self_model,
      relationship_model: state.relationship_model,
      activation_map: state.activation_map,
      predictions: state.predictions,
      domain_frame: state.domain_frame
    },
    deliberationQueue: state.processing.deliberation_queue || null,
    instructions: state.processing.deliberation_type || 'analyze_context'
  };

  // Return additionalContext for injection into the subagent
  return JSON.stringify(context, null, 2);
};
```

### Adaptive Threshold Adjustment
```javascript
// Source: D-09 decision, REVERIE-SPEC Section 6.3
function adjustThreshold(currentThreshold, injectionHistory, options = {}) {
  const maxAdjustment = options.maxAdjustment || 0.1;
  const recentWindow = options.recentWindow || 10;

  const recent = injectionHistory.slice(-recentWindow);
  if (recent.length < 3) return currentThreshold; // Not enough data

  const acknowledged = recent.filter(i => i.acknowledged).length;
  const rate = acknowledged / recent.length;

  if (rate > 0.7) {
    // User engaging well -- lower threshold slightly
    return Math.max(0.3, currentThreshold - 0.02);
  } else if (rate < 0.3) {
    // User ignoring injections -- raise threshold
    return Math.min(0.9, currentThreshold + 0.02);
  }
  return currentThreshold;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| OpenRouter/Haiku for all curation | Native Claude Code subagents | Phase 24 (cortex mode) | Zero marginal cost; removes external API dependency for Dynamo operations |
| Pass-through stubs in Reverie handlers | Full cognitive pipelines | Phase 24 | Handlers become the real Inner Voice processing engine |
| Single-path processing (always curate) | Dual-path hot/deliberation routing | Phase 24 | 95% of operations stay fast (<500ms); 5% get deep analysis |
| Flat memory injection | Sublimation-based selective injection | Phase 24 | Only threshold-crossing insights surface; silence when predictions match |

**Deprecated/outdated:**
- Haiku API calls for curation: Replaced by native subagent processing in cortex mode. Classic mode retains these for backward compatibility.
- Phase 23 pass-through stubs: All seven replaced by real pipeline implementations.

## Open Questions

1. **Subagent spawn reliability via additionalContext instruction**
   - What we know: The UserPromptSubmit hook can include an instruction in `additionalContext` for the main session to spawn the inner-voice subagent (REVERIE-SPEC Section 13.2 recommends this approach).
   - What's unclear: How reliably the main session model follows this instruction. It is a suggestion, not a command. The model may choose not to spawn.
   - Recommendation: Implement the instruction approach. If the model does not spawn, the system degrades gracefully to hot-path-only (per D-06). Track spawn success rate for Phase 25 calibration. The instruction should be clear and actionable, not buried in narrative text.

2. **Session naming during curation migration**
   - What we know: `ledger/curation.cjs` provides `generateSessionName()` via Haiku. The `prompt-augment.cjs` handler calls `generateAndApplyName()` which invokes this.
   - What's unclear: Whether Reverie's UserPromptSubmit handler should replicate the session naming behavior or if this moves to Stop-hook REM processing.
   - Recommendation: Reverie's UserPromptSubmit should NOT replicate session naming. Session naming moves to the Stop hook as part of REM Tier 3 synthesis, where the subagent generates a name based on the full session arc. Preliminary naming at prompt time is a classic-mode pattern; cortex mode names sessions at the end.

3. **Activation map Assay query on session start**
   - What we know: Session start always takes the deliberation path. The subagent can query the knowledge graph via `dynamo search` CLI.
   - What's unclear: Whether the hot-path session-start handler should also do an Assay query to seed the activation map before spawning the subagent.
   - Recommendation: Yes -- the session-start handler should load the previous session's persisted activation map (from state file), decay stale entries, and query Assay for the top activated entities to prime the subagent's context. This is acceptable latency-wise because SessionStart has a 30s timeout per `settings-hooks.json`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` (no external dependency) |
| Config file | None (built-in; no jest.config or similar) |
| Quick run command | `node --test dynamo/tests/reverie/*.test.cjs` |
| Full suite command | `node --test dynamo/tests/**/*.test.cjs` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IV-05 | Injection respects token limits (500/150/50) | unit | `node --test dynamo/tests/reverie/inner-voice.test.cjs` | Wave 0 |
| IV-06 | Self-model persists across sessions | unit | `node --test dynamo/tests/reverie/state.test.cjs` | Existing (extend) |
| IV-07 | Curation migration (subagent-based) | unit | `node --test dynamo/tests/reverie/curation.test.cjs` | Wave 0 |
| IV-08 | Adversarial counter-prompting templates | unit | `node --test dynamo/tests/reverie/inner-voice.test.cjs` | Wave 0 |
| IV-09 | Semantic shift detection (keyword overlap) | unit | `node --test dynamo/tests/reverie/dual-path.test.cjs` | Wave 0 |
| IV-11 | Explicit recall bypass | unit | `node --test dynamo/tests/reverie/dual-path.test.cjs` | Wave 0 |
| PATH-01 | Deterministic path selection | unit | `node --test dynamo/tests/reverie/dual-path.test.cjs` | Wave 0 |
| PATH-02 | Hot path <500ms with timing | unit/smoke | `node --test dynamo/tests/reverie/inner-voice.test.cjs` | Wave 0 |
| PATH-03 | Subagent definition valid | unit | `node --test dynamo/tests/reverie/subagent.test.cjs` | Wave 0 |
| PATH-04 | Graceful degradation on spawn failure | unit | `node --test dynamo/tests/reverie/dual-path.test.cjs` | Wave 0 |
| PATH-05 | State bridge write/consume/TTL/correlation | unit | `node --test dynamo/tests/reverie/state-bridge.test.cjs` | Wave 0 |
| PATH-06 | Rate limit flag sets/clears | unit | `node --test dynamo/tests/reverie/activation.test.cjs` | Existing |

### Sampling Rate
- **Per task commit:** `node --test dynamo/tests/reverie/*.test.cjs`
- **Per wave merge:** `node --test dynamo/tests/**/*.test.cjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `dynamo/tests/reverie/inner-voice.test.cjs` -- covers IV-05, IV-08, PATH-02 (pipeline orchestrator)
- [ ] `dynamo/tests/reverie/dual-path.test.cjs` -- covers PATH-01, PATH-04, IV-09, IV-11 (path selection, semantic shift, recall)
- [ ] `dynamo/tests/reverie/curation.test.cjs` -- covers IV-07 (curation migration, template fallback)
- [ ] `dynamo/tests/reverie/state-bridge.test.cjs` -- covers PATH-05 (state bridge write/consume/TTL)
- [ ] `dynamo/tests/reverie/subagent.test.cjs` -- covers PATH-03 (subagent definition file validation)
- [ ] Extend `dynamo/tests/reverie/state.test.cjs` -- covers IV-06 (self-model activation)
- [ ] Extend `dynamo/tests/reverie/handlers.test.cjs` -- verify handlers no longer pass-through

## Sources

### Primary (HIGH confidence)
- `REVERIE-SPEC.md` -- Full subsystem specification. All processing pipelines (Section 5), state management (Section 3.5, 7), hybrid architecture (Section 4), subagent definition (Section 8), sublimation threshold (Section 6), curation migration (Section 3.2 curation.cjs)
- `INNER-VOICE-ABSTRACT.md` -- Platform-agnostic cognitive architecture. Spreading Activation (Section 5.3), Dual-Process Theory (Section 6), Predictive Processing (Section 3.1.4), Cognitive Load Theory (Section 3.1.7)
- Claude Code official docs (https://code.claude.com/docs/en/sub-agents) -- Custom subagent YAML frontmatter fields, tool restrictions, permissionMode values, memory scopes
- Claude Code official docs (https://code.claude.com/docs/en/hooks) -- SubagentStart/SubagentStop hook input schemas, output formats, exit code behaviors

### Secondary (MEDIUM confidence)
- Existing codebase analysis -- All existing module interfaces, test patterns, and established conventions verified by reading source code directly

### Tertiary (LOW confidence)
- Subagent spawn trigger via additionalContext instruction -- REVERIE-SPEC Section 13.2 recommends this but acknowledges it is "least intrusive" rather than guaranteed. The model may not follow the instruction. Marked for Phase 25 validation during hybrid mode testing.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero external dependencies; all Node.js built-ins; established project patterns
- Architecture: HIGH -- REVERIE-SPEC provides complete module definitions, processing pipelines, and state schemas; existing code validates feasibility
- Pitfalls: HIGH -- each pitfall identified from concrete code analysis, platform documentation, or REVERIE-SPEC adversarial analysis
- Subagent integration: MEDIUM -- Claude Code subagent docs confirm all fields and behaviors, but spawn-via-additionalContext is unproven in practice

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable architecture, no fast-moving external dependencies)

# Phase 23: Foundation and Routing - Research

**Researched:** 2026-03-20
**Domain:** CJS module architecture, feature flag systems, spreading activation algorithms, hook event dispatching, JSON state persistence
**Confidence:** HIGH

## Summary

Phase 23 builds the foundational infrastructure for the Reverie subsystem: a config CLI (`dynamo config get/set`), a dual-mode dispatcher (classic/cortex routing), 7 Reverie handler stubs (5 pass-through + 2 no-op), an atomic JSON state file module, and a standalone activation computation engine. The phase creates no new behavior visible to users in classic mode -- it wires the routing and data structures that Phase 24 will fill with cognitive processing logic.

The technical domain is straightforward: pure Node.js CJS modules with no external dependencies, JSON file I/O with atomic write patterns, deterministic algorithms (spreading activation, entity extraction via regex, domain frame classification via keyword matching), and modifications to the existing dispatcher (`cc/hooks/dynamo-hooks.cjs`) and CLI router (`dynamo.cjs`). All patterns are already established in the codebase (options-based test isolation, branding headers, toggle gates, resolve-based imports).

**Primary recommendation:** Build outward from existing code patterns. The config module extends `core.loadConfig()`. The dispatcher adds a conditional branch before the existing switch/case. The state module follows the session-store.cjs atomic write pattern. The activation module is pure computation with no I/O dependencies. Stub handlers wrap existing Ledger handlers with zero behavioral change.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Stub handlers are pass-through wrappers that delegate to existing Ledger handlers. In cortex mode, the system produces identical output to classic mode.
- **D-02:** All 7 Reverie handlers created in Phase 23: 5 pass-through wrappers (SessionStart, UserPromptSubmit, PostToolUse, PreCompact, Stop) and 2 no-op stubs (SubagentStart, SubagentStop) that log receipt and return null.
- **D-03:** Reverie handlers use REVERIE-SPEC naming (user-prompt.cjs, pre-compact.cjs, stop.cjs, post-tool-use.cjs, iv-subagent-start.cjs, iv-subagent-stop.cjs, session-start.cjs) with a mapping in the dispatcher for cortex mode.
- **D-04:** Dispatcher reads `reverie.mode` from config at dispatch time. Conditional in the existing dispatcher file: if classic, route to Ledger handlers (existing switch/case); if cortex, route to Reverie handlers via name mapping.
- **D-05:** SubagentStart and SubagentStop events registered in settings-hooks.json pointing to the same dispatcher entry point.
- **D-06:** COST-01, COST-02, COST-04 deferred entirely. No cost tracking infrastructure needed.
- **D-07:** Operational monitoring replaces cost tracking: OPS-MON-01 (subagent spawn count with configurable daily cap, default 20) and OPS-MON-02 (rate limit detection with runtime flag and hot-path-only degradation).
- **D-08:** New `lib/config.cjs` module (~100 LOC) with get(dotPath), set(dotPath, value), validate(dotPath, value), getAll() exports. CLI router delegates `dynamo config get/set` to this module.
- **D-09:** Dot notation for nested keys: `dynamo config get reverie.mode`, `dynamo config set reverie.activation.sublimation_threshold 0.5`.
- **D-10:** Validate known keys before writing. Maintain a validation map for known config paths (reverie.mode accepts only classic/hybrid/cortex). Unknown keys accepted freely for extensibility.
- **D-11:** Config changes take effect immediately on next hook event -- config is loaded fresh from disk on every dispatch (existing pattern via core.loadConfig()). No restart required.
- **D-12:** Pure JSON state file (inner-voice-state.json) with atomic write via tmp+rename. Corruption recovery: if JSON parse fails, reset to fresh defaults and log the event.
- **D-13:** Phase 23 LIVE sections: `activation_map`, `domain_frame`, `predictions`, `processing`. Phase 23 STUBBED sections: `self_model`, `relationship_model`, `injection_history`, `pending_associations`.
- **D-14:** State file module lives at `subsystems/reverie/state.cjs` with loadState(path, options) and persistState(state, path) exports.
- **D-15:** Full 1-hop spreading activation implemented in Phase 23 (activation.cjs). Exports: updateActivation, propagate, checkThresholdCrossings, decayAll, computeSublimationScore.

### Claude's Discretion
- Entity extraction pattern set (IV-02) -- what regex/patterns to use for project names, file paths, function names, technical terms
- Domain frame keyword sets for the 5 frame categories (engineering/debugging/architecture/social/general)
- Exact sublimation score formula weights and default thresholds
- Internal module organization within subsystems/reverie/

### Deferred Ideas (OUT OF SCOPE)
- COST-01/02/04: Dollar-cost tracking deferred -- no cost to track on Max subscription
- Session naming migration to subagents: Currently uses Haiku via OpenRouter (ledger/curation.cjs). Will migrate when IV-07 (Phase 24) moves curation to Reverie
- API plan support: If a future need arises for non-subscription deliberation, it can be added as a separate adapter in cc/
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IV-01 | Inner Voice state file loads, processes, and persists atomically with corruption recovery to fresh defaults | state.cjs module pattern, atomic write via tmp+rename, corruption recovery via try/catch JSON.parse with fallback to defaults |
| IV-02 | Entity extraction identifies project names, file paths, function names, and technical terms from prompts via deterministic pattern matching (<5ms) | Regex patterns for each entity type documented in Architecture Patterns; benchmark target achievable with pre-compiled regex |
| IV-03 | Activation map tracks entity relevance with time-based decay and 1-hop spreading activation from anchor entities via Assay graph queries | activation.cjs BFS propagation algorithm, decay formula, convergence bonus, graph data parameter mocked in Phase 23 tests |
| IV-04 | Sublimation threshold evaluates composite score (activation * surprise * relevance * (1 - cognitive_load) * confidence) to determine what surfaces | computeSublimationScore function with 5-factor multiplicative formula; Phase 23 tests validate the formula with known inputs |
| IV-10 | Domain frame classification categorizes prompts into engineering/debugging/architecture/social/general via keyword/regex heuristic (<1ms) | Keyword sets for each frame documented; classification function returns {frame, confidence, active_frames} |
| IV-12 | Predictions state tracks expected topic and activity; surprise factor provides principled reason for silence when expectations are met | predictions section in state schema with expected_topic, expected_activity, confidence; surprise_factor computation in activation.cjs |
| OPS-MON-01 | Subagent spawn tracking enforces daily cap (configurable, default 20); tracks rate limit proximity | spawn_tracker section in state or config with daily counter, reset logic, cap from config.reverie.operational.subagent_daily_cap |
| OPS-MON-02 | Rate limit detection sets runtime flag on spawn failure; system degrades to hot-path-only until cleared | Runtime flag pattern (_rate_limited), checked in dispatcher/handler routing, cleared on session start or timeout |
| FLAG-01 | `reverie.mode` config flag supports classic/hybrid/cortex modes with instant rollback | config.cjs validation map restricts reverie.mode to [classic, hybrid, cortex]; defaults to classic; config loaded fresh each dispatch |
| FLAG-03 | `dynamo config get/set` CLI commands manage feature flags and Reverie configuration | config.cjs module with dot-notation traversal, validation, CLI router integration |
| HOOK-01 | Dispatcher routes events to Reverie handlers or classic Ledger handlers based on `reverie.mode` config value | Conditional branch in dynamo-hooks.cjs before existing switch/case; mode-based handler resolution |
| HOOK-02 | SubagentStart and SubagentStop events registered in settings-hooks.json with inner-voice agent name matcher | New entries in settings-hooks.json using "inner-voice" matcher |
| HOOK-03 | Seven Reverie handler modules exist (SessionStart, UserPromptSubmit, PostToolUse, PreCompact, Stop, SubagentStart, SubagentStop) -- thin wrappers delegating to inner-voice.cjs | 5 pass-through handlers + 2 no-op stubs at subsystems/reverie/handlers/ |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins | v24.13.1 (installed) | All I/O, path resolution, crypto, test framework | Zero external dependency constraint (DYNAMO-PRD 6.4) |
| `node:fs` | built-in | Atomic file writes (writeFileSync + renameSync), config read/write | Established codebase pattern |
| `node:path` | built-in | Cross-platform path joins for state files, config, handlers | Established codebase pattern |
| `node:crypto` | built-in | randomUUID() for tmp file names in atomic writes | Used in REVERIE-SPEC 7.2 pattern |
| `node:test` | built-in | Unit tests for activation.cjs, state.cjs, config.cjs | 374+ existing tests use this framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:assert` | built-in | Test assertions | All test files |
| `node:os` | built-in | homedir() for DYNAMO_DIR, tmpdir() for test isolation | Config and state path resolution |
| `performance.now()` | built-in (globalThis) | Sub-ms timing for benchmark tests | Entity extraction and classification benchmark assertions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON config file | SQLite config store | Overkill; config is <1KB, read-once-per-dispatch, JSON is simpler |
| Regex entity extraction | NLP library (compromise.js) | External dependency violates zero-dep constraint; regex sufficient for structured patterns |
| Manual dot-notation traversal | lodash.get/set | External dependency; trivial to implement in ~20 LOC |

**Installation:** No installation needed. All modules are Node.js built-ins.

## Architecture Patterns

### Recommended Project Structure
```
subsystems/reverie/
  state.cjs                    # State file I/O (loadState, persistState, freshDefaults)
  activation.cjs               # Pure computation (no I/O): entity extraction, activation, decay, classification, sublimation
  handlers/
    session-start.cjs          # Pass-through -> ledger/hooks/session-start.cjs
    user-prompt.cjs            # Pass-through -> ledger/hooks/prompt-augment.cjs
    post-tool-use.cjs          # Pass-through -> ledger/hooks/capture-change.cjs
    pre-compact.cjs            # Pass-through -> ledger/hooks/preserve-knowledge.cjs
    stop.cjs                   # Pass-through -> ledger/hooks/session-summary.cjs
    iv-subagent-start.cjs      # No-op stub: log + return null
    iv-subagent-stop.cjs       # No-op stub: log + return null

lib/
  config.cjs                   # Config get/set/validate with dot-notation

cc/
  hooks/
    dynamo-hooks.cjs           # MODIFIED: add mode-based routing conditional
  settings-hooks.json          # MODIFIED: add SubagentStart/SubagentStop entries
```

### Pattern 1: Config Module with Dot-Notation Traversal
**What:** `lib/config.cjs` provides get(dotPath), set(dotPath, value), validate(dotPath, value), getAll() for reading and writing `config.json`.
**When to use:** Any `dynamo config get/set` CLI invocation; internal config reads that need validation.
**Example:**
```javascript
// Dynamo > Lib > config.cjs
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DYNAMO_DIR = path.join(os.homedir(), '.claude', 'dynamo');
const CONFIG_PATH = path.join(DYNAMO_DIR, 'config.json');

// Validation map for known config keys
const VALIDATORS = {
  'reverie.mode': (v) => ['classic', 'hybrid', 'cortex'].includes(v),
  'reverie.operational.subagent_daily_cap': (v) => typeof v === 'number' && v > 0 && v <= 100,
  'reverie.activation.sublimation_threshold': (v) => typeof v === 'number' && v >= 0 && v <= 1,
  'reverie.activation.decay_rate': (v) => typeof v === 'number' && v >= 0 && v <= 1,
  'reverie.activation.propagation_hops': (v) => typeof v === 'number' && v >= 1 && v <= 3,
  'reverie.activation.convergence_bonus': (v) => typeof v === 'number' && v >= 1 && v <= 3,
  'reverie.activation.domain_frame_bonus': (v) => typeof v === 'number' && v >= 1 && v <= 3,
  'enabled': (v) => typeof v === 'boolean',
};

function get(dotPath, options = {}) {
  const configPath = options.configPath || CONFIG_PATH;
  const raw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(raw);
  const keys = dotPath.split('.');
  let current = config;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}

function set(dotPath, value, options = {}) {
  const configPath = options.configPath || CONFIG_PATH;
  // Validate if known key
  const validationError = validate(dotPath, value);
  if (validationError) throw new Error(validationError);
  // Read, modify, write atomically
  const raw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(raw);
  const keys = dotPath.split('.');
  let current = config;
  for (let i = 0; i < keys.length - 1; i++) {
    if (current[keys[i]] === undefined) current[keys[i]] = {};
    current = current[keys[i]];
  }
  // Type coercion for numeric values
  if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
    value = Number(value);
  }
  if (value === 'true') value = true;
  if (value === 'false') value = false;
  current[keys[keys.length - 1]] = value;
  // Atomic write
  const tmpPath = configPath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2) + '\n');
  fs.renameSync(tmpPath, configPath);
  return value;
}

function validate(dotPath, value) {
  const validator = VALIDATORS[dotPath];
  if (!validator) return null; // Unknown keys accepted freely
  if (!validator(value)) {
    return `Invalid value for ${dotPath}: ${JSON.stringify(value)}`;
  }
  return null;
}

function getAll(options = {}) {
  const configPath = options.configPath || CONFIG_PATH;
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

module.exports = { get, set, validate, getAll, VALIDATORS, CONFIG_PATH };
```

### Pattern 2: Atomic State File with Corruption Recovery
**What:** `subsystems/reverie/state.cjs` loads JSON state, provides defaults for corrupt/missing files, persists atomically.
**When to use:** Every hook invocation loads state at start, persists at end.
**Example:**
```javascript
// Dynamo > Reverie > state.cjs
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const resolve = require('../../lib/resolve.cjs');
const { logError } = require(resolve('lib', 'core.cjs'));

const DEFAULT_STATE_PATH = path.join(os.homedir(), '.claude', 'dynamo', 'inner-voice-state.json');

function freshDefaults() {
  return {
    version: 1,
    last_updated: new Date().toISOString(),
    session_id: null,
    // Phase 23 LIVE sections
    activation_map: {},
    domain_frame: {
      current_frame: 'general',
      frame_confidence: 0.5,
      active_frames: ['general']
    },
    predictions: {
      expected_topic: null,
      expected_activity: null,
      confidence: 0.5,
      last_embedding: null
    },
    processing: {
      deliberation_pending: false,
      last_deliberation_id: null
    },
    // Phase 23 STUBBED sections (empty defaults)
    self_model: {
      attention_state: null,
      injection_mode: 'standard',
      confidence: 0.5,
      recent_performance: { injections_made: 0, injections_acknowledged: 0, last_calibration: null }
    },
    relationship_model: {
      communication_preferences: [],
      working_patterns: [],
      current_projects: [],
      affect_baseline: 'neutral',
      frustration_signals: []
    },
    injection_history: [],
    pending_associations: []
  };
}

function loadState(statePath, options = {}) {
  const filePath = options.statePath || statePath || DEFAULT_STATE_PATH;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    // Merge with defaults to ensure all fields present
    const defaults = freshDefaults();
    return { ...defaults, ...parsed };
  } catch (e) {
    if (e.code !== 'ENOENT') {
      logError('reverie-state', 'Corrupt state file, resetting to defaults: ' + e.message);
    }
    return freshDefaults();
  }
}

function persistState(state, statePath, options = {}) {
  const filePath = options.statePath || statePath || DEFAULT_STATE_PATH;
  state.last_updated = new Date().toISOString();
  const tmpPath = filePath + '.' + crypto.randomUUID().slice(0, 8) + '.tmp';
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
  fs.renameSync(tmpPath, filePath);
}

module.exports = { loadState, persistState, freshDefaults, DEFAULT_STATE_PATH };
```

### Pattern 3: Pass-Through Stub Handler
**What:** Reverie handler that delegates to the corresponding Ledger handler, producing identical output.
**When to use:** All 5 cognitive hook handlers in Phase 23 cortex mode.
**Example:**
```javascript
// Dynamo > Reverie > Handlers > session-start.cjs
'use strict';

const resolve = require('../../../lib/resolve.cjs');

/**
 * Reverie SessionStart handler -- Phase 23 pass-through stub.
 * Delegates to the classic Ledger handler to produce identical output.
 * Phase 24 replaces this with cognitive processing pipeline.
 */
module.exports = async function reverieSessionStart(ctx) {
  const classicHandler = require(resolve('ledger', 'hooks/session-start.cjs'));
  return classicHandler(ctx);
};
```

### Pattern 4: Dispatcher Mode-Based Routing
**What:** Conditional branch in dynamo-hooks.cjs that checks `reverie.mode` before routing to handlers.
**When to use:** Every hook dispatch.
**Example:**
```javascript
// In dynamo-hooks.cjs, before the existing switch/case:
const { loadConfig } = require(resolve('lib', 'core.cjs'));

// Determine routing mode
const config = loadConfig();
const mode = (config.reverie && config.reverie.mode) || 'classic';

if (mode !== 'classic') {
  // Cortex/hybrid mode: route to Reverie handlers
  const REVERIE_HANDLERS = resolve('reverie', 'handlers');
  const REVERIE_ROUTE = {
    'SessionStart':     'session-start.cjs',
    'UserPromptSubmit': 'user-prompt.cjs',
    'PostToolUse':      'post-tool-use.cjs',
    'PreCompact':       'pre-compact.cjs',
    'Stop':             'stop.cjs',
    'SubagentStart':    'iv-subagent-start.cjs',
    'SubagentStop':     'iv-subagent-stop.cjs',
  };
  const handlerFile = REVERIE_ROUTE[event];
  if (handlerFile) {
    await require(path.join(REVERIE_HANDLERS, handlerFile))(ctx);
    // Skip classic routing below
  }
} else {
  // Classic mode: existing switch/case unchanged
  // ...existing switch statement...
}
```

### Pattern 5: Entity Extraction via Compiled Regex
**What:** Deterministic pattern matching for project names, file paths, function names, and technical terms.
**When to use:** activation.cjs extractEntities() function.
**Example:**
```javascript
// Pre-compiled regex patterns for <5ms extraction
const PATTERNS = {
  filePaths: /(?:^|\s|['"`(])([.~]?\/[\w./-]+\.\w{1,10})(?:\s|['"`)]|$)/g,
  functionNames: /\b([a-z][a-zA-Z0-9]*(?:_[a-zA-Z0-9]+)*)\s*\(/g,
  classNames: /\b([A-Z][a-zA-Z0-9]+(?:[A-Z][a-zA-Z0-9]*)*)\b/g,
  projectNames: /\b(dynamo|reverie|ledger|assay|terminus|switchboard|graphiti)\b/gi,
  technicalTerms: /\b(hook|handler|dispatch|activation|sublimation|injection|config|state|session|episode|entity|node|edge|schema|migration|deployment|subagent)\b/gi,
  camelCase: /\b([a-z]+(?:[A-Z][a-z0-9]*)+)\b/g,
  snakeCase: /\b([a-z]+(?:_[a-z0-9]+){2,})\b/g,
};

function extractEntities(text, options = {}) {
  const entities = new Map(); // name -> { type, count, positions }
  for (const [type, pattern] of Object.entries(PATTERNS)) {
    pattern.lastIndex = 0; // Reset for reuse
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1] || match[0];
      const normalized = name.toLowerCase();
      if (!entities.has(normalized)) {
        entities.set(normalized, { name, type, count: 0, positions: [] });
      }
      const entry = entities.get(normalized);
      entry.count++;
      entry.positions.push(match.index);
    }
  }
  return Array.from(entities.values());
}
```

### Pattern 6: Domain Frame Classification
**What:** Keyword/regex heuristic classifying prompts into engineering/debugging/architecture/social/general.
**When to use:** activation.cjs classifyDomainFrame() function.
**Example:**
```javascript
const FRAME_KEYWORDS = {
  engineering: [
    'implement', 'code', 'function', 'module', 'class', 'method', 'variable',
    'import', 'require', 'export', 'const', 'let', 'async', 'await',
    'test', 'spec', 'build', 'compile', 'deploy', 'install', 'npm', 'node',
    'file', 'directory', 'path', 'write', 'read', 'create', 'add', 'update'
  ],
  debugging: [
    'error', 'bug', 'fix', 'broken', 'fail', 'crash', 'issue', 'problem',
    'debug', 'trace', 'stack', 'exception', 'undefined', 'null', 'NaN',
    'not working', 'wrong', 'unexpected', 'incorrect', 'missing', 'typo',
    'timeout', 'hang', 'freeze', 'leak', 'corrupt'
  ],
  architecture: [
    'design', 'architecture', 'pattern', 'structure', 'refactor', 'organize',
    'boundary', 'interface', 'contract', 'dependency', 'coupling', 'cohesion',
    'subsystem', 'layer', 'module', 'component', 'service', 'pipeline',
    'roadmap', 'milestone', 'phase', 'plan', 'spec', 'requirement'
  ],
  social: [
    'remember', 'preference', 'style', 'like', 'prefer', 'always', 'never',
    'convention', 'habit', 'workflow', 'process', 'team', 'collaborate',
    'communication', 'feedback', 'opinion', 'thought', 'feel'
  ],
  // 'general' is the default -- no keywords needed
};

function classifyDomainFrame(text, options = {}) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [frame, keywords] of Object.entries(FRAME_KEYWORDS)) {
    scores[frame] = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[frame]++;
    }
  }
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topFrame = entries[0][1] > 0 ? entries[0][0] : 'general';
  const topScore = entries[0][1];
  const totalKeywords = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalKeywords > 0 ? topScore / totalKeywords : 0.5;
  // Active frames: any frame with score > 0
  const activeFrames = entries.filter(([, s]) => s > 0).map(([f]) => f);
  if (activeFrames.length === 0) activeFrames.push('general');
  return { current_frame: topFrame, frame_confidence: Math.min(confidence, 1.0), active_frames: activeFrames };
}
```

### Pattern 7: SubagentStart/SubagentStop Hook Registration
**What:** New entries in settings-hooks.json for subagent lifecycle events.
**When to use:** settings-hooks.json modification for HOOK-02.
**Example:**
```json
{
  "SubagentStart": [
    {
      "matcher": "inner-voice",
      "hooks": [
        {
          "type": "command",
          "command": "node \"$HOME/.claude/dynamo/cc/hooks/dynamo-hooks.cjs\"",
          "timeout": 10
        }
      ]
    }
  ],
  "SubagentStop": [
    {
      "matcher": "inner-voice",
      "hooks": [
        {
          "type": "command",
          "command": "node \"$HOME/.claude/dynamo/cc/hooks/dynamo-hooks.cjs\"",
          "timeout": 10
        }
      ]
    }
  ]
}
```

### Pattern 8: Operational Monitoring (Spawn Tracking)
**What:** Subagent spawn counter with daily cap enforcement and rate limit detection.
**When to use:** OPS-MON-01 and OPS-MON-02 requirements.
**Example:**
```javascript
// In activation.cjs or a dedicated ops-monitor section

function checkSpawnBudget(state, config) {
  const cap = (config.reverie && config.reverie.operational && config.reverie.operational.subagent_daily_cap) || 20;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const tracker = state.processing.spawn_tracker || { date: today, count: 0, rate_limited: false };

  // Reset counter on new day
  if (tracker.date !== today) {
    tracker.date = today;
    tracker.count = 0;
    tracker.rate_limited = false;
  }

  return {
    allowed: tracker.count < cap && !tracker.rate_limited,
    remaining: cap - tracker.count,
    rate_limited: tracker.rate_limited,
    tracker
  };
}

function recordSpawn(state) {
  if (!state.processing.spawn_tracker) {
    state.processing.spawn_tracker = { date: new Date().toISOString().slice(0, 10), count: 0, rate_limited: false };
  }
  state.processing.spawn_tracker.count++;
  return state;
}

function setRateLimited(state, limited) {
  if (!state.processing.spawn_tracker) {
    state.processing.spawn_tracker = { date: new Date().toISOString().slice(0, 10), count: 0, rate_limited: false };
  }
  state.processing.spawn_tracker.rate_limited = limited;
  return state;
}
```

### Anti-Patterns to Avoid
- **Modifying Ledger handler behavior:** Phase 23 must NOT change any existing Ledger handler. Pass-through stubs call the originals unmodified.
- **Reading config from environment variables:** Config is always from config.json via disk read. Environment overrides break the "no manual config edits" principle.
- **Caching config in module scope:** Config must be read fresh on every dispatch to support instant mode switching (D-11).
- **Using process.stdout.write in SubagentStart/SubagentStop handlers:** These hooks return JSON to Claude Code, not raw text. The output format differs from the existing 5 hooks. SubagentStart returns `hookSpecificOutput.additionalContext`; SubagentStop returns nothing (or decision/reason for blocking).
- **Importing activation.cjs from handlers in Phase 23:** The handlers are pure pass-through stubs. activation.cjs is tested independently. Phase 24 wires them together.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic file writes | Custom write-with-retry | `fs.writeFileSync(tmp) + fs.renameSync(tmp, target)` | rename is atomic on POSIX; the pattern is already used throughout the codebase |
| UUID generation | Random string functions | `crypto.randomUUID()` | Built-in, cryptographically random, standard format |
| Deep object traversal | Recursive generic walker | Simple split('.') + loop | Config paths are at most 3-4 levels deep; a 10-line loop is sufficient |
| JSON schema validation | JSON Schema library | Validation map with simple predicate functions | Zero-dep constraint; validation needs are trivial (type + range checks) |
| Test tmpdir cleanup | Manual try/finally | `node:test` afterEach + `fs.rmSync(tmpDir, { recursive: true })` | Built-in cleanup pattern used by all 374+ existing tests |

**Key insight:** Every "infrastructure" problem in Phase 23 has a simple, established solution in the existing codebase. The risk is over-engineering, not under-engineering.

## Common Pitfalls

### Pitfall 1: SubagentStart/SubagentStop Output Format Mismatch
**What goes wrong:** The existing 5 hooks write raw text to stdout (wrapped in boundary markers). SubagentStart/SubagentStop hooks must output JSON with `hookSpecificOutput` structure, not raw text.
**Why it happens:** Developer copies the existing handler pattern without checking Claude Code's hook output spec.
**How to avoid:** SubagentStart handlers must return JSON to stdout: `{"hookSpecificOutput": {"hookEventName": "SubagentStart", "additionalContext": "..."}}`. SubagentStop handlers return empty or decision JSON. The existing stdout boundary wrapping in the dispatcher must be skipped for these event types.
**Warning signs:** SubagentStart hook runs but subagent receives no context injection; Claude Code logs "failed to parse hook output."

### Pitfall 2: SubagentStart/SubagentStop Input Field Names
**What goes wrong:** Using wrong field names from REVERIE-SPEC (which uses `agent_name`) when Claude Code actually sends `agent_type` for the agent identifier.
**Why it happens:** REVERIE-SPEC was written before the official Claude Code hook docs were verified.
**How to avoid:** Use `agent_type` (not `agent_name`) to match the subagent. Matcher in settings-hooks.json matches on agent type. Input JSON contains `agent_type` and `agent_id`.
**Warning signs:** Handler always skips because `input.agent_name` is undefined.

### Pitfall 3: Config Type Coercion from CLI
**What goes wrong:** `dynamo config set reverie.activation.sublimation_threshold 0.6` passes "0.6" as a string. Without coercion, config stores a string, breaking numeric comparisons.
**Why it happens:** CLI args are always strings. The config module must handle type coercion.
**How to avoid:** The set() function must coerce: if the value looks numeric, convert to Number. Handle "true"/"false" -> boolean. This is explicit in the D-10 validation map.
**Warning signs:** Tests pass but runtime behavior differs because `"0.6" * "0.8"` is NaN in some contexts.

### Pitfall 4: Dispatcher Boundary Markers Applied to SubagentStart/SubagentStop
**What goes wrong:** The existing dispatcher wraps ALL handler output in `<dynamo-memory-context>` boundary markers. But SubagentStart/SubagentStop output JSON that Claude Code parses -- wrapping it in XML-like tags corrupts the JSON.
**Why it happens:** The boundary wrapping code runs unconditionally for all events.
**How to avoid:** Add SubagentStart/SubagentStop to the VALID_EVENTS set AND add conditional logic to skip boundary wrapping for these events. Their output goes directly to stdout as JSON.
**Warning signs:** Hook exit 0 but Claude Code reports "failed to parse hook JSON output."

### Pitfall 5: Config.json Missing Reverie Section on Fresh Install
**What goes wrong:** The current `config.json` has no `reverie` section. Reading `config.reverie.mode` throws if not handled with optional chaining or default values.
**Why it happens:** Phase 23 is the first phase to read reverie config values, but config.json was created before reverie existed.
**How to avoid:** Use defensive access: `(config.reverie && config.reverie.mode) || 'classic'`. The config module's set() creates intermediate objects automatically. The default mode is always `classic`.
**Warning signs:** First hook dispatch after Phase 23 deployment crashes with "Cannot read properties of undefined."

### Pitfall 6: Regex lastIndex Statefulness
**What goes wrong:** Using regex with the `g` flag in entity extraction means `lastIndex` persists between calls if the same regex object is reused.
**Why it happens:** JavaScript regex with `g` flag is stateful. If extractEntities() is called twice, the second call may miss matches.
**How to avoid:** Reset `pattern.lastIndex = 0` before each `exec()` loop, or use `String.matchAll()` which creates a fresh iterator. The example code above demonstrates the reset pattern.
**Warning signs:** Entity extraction returns different results on second invocation with the same input.

### Pitfall 7: Resolve Path for New Reverie Handlers Directory
**What goes wrong:** `resolve('reverie', 'handlers/session-start.cjs')` fails because resolve.cjs checks `fs.existsSync()` and the handler file doesn't exist yet when tests import it.
**Why it happens:** resolve.cjs validates file existence at require time. Test setup must create files before importing.
**How to avoid:** Create handler files before testing the dispatcher. In tests, use `path.join()` directly instead of resolve() when testing handler existence. The resolve check is a development-time safety net.
**Warning signs:** Tests fail with "resolve('reverie', 'handlers/session-start.cjs'): not found" during test setup.

## Code Examples

### Sublimation Score Computation (IV-04)
```javascript
// Source: REVERIE-SPEC Section 6.1 + INNER-VOICE-ABSTRACT Section 5.2
function computeSublimationScore(entity, predictions, currentContext, cognitiveLoad, options = {}) {
  const activationLevel = entity.level || 0;

  // surprise_factor: how unexpected is this entity given predictions
  // Phase 23: keyword overlap proxy (embeddings in v1.4)
  const surpriseFactor = options.surpriseFactor !== undefined
    ? options.surpriseFactor
    : computeSurprise(entity, predictions);

  // relevance_ratio: semantic similarity to current context
  const relevanceRatio = options.relevanceRatio !== undefined
    ? options.relevanceRatio
    : computeRelevance(entity, currentContext);

  // cognitive_load_penalty: 0.0 (idle) to 1.0 (maximum)
  const loadPenalty = typeof cognitiveLoad === 'number' ? cognitiveLoad : 0.3;

  // confidence_weight: time-decayed confidence
  const confidenceWeight = options.confidenceWeight !== undefined
    ? options.confidenceWeight
    : 0.8; // Default high confidence in Phase 23

  return activationLevel * surpriseFactor * relevanceRatio * (1 - loadPenalty) * confidenceWeight;
}

function computeSurprise(entity, predictions) {
  if (!predictions || !predictions.expected_topic) return 0.5; // Neutral surprise
  // Keyword overlap proxy: if entity name appears in expected topic, low surprise
  const expected = (predictions.expected_topic || '').toLowerCase();
  const entityName = (entity.name || '').toLowerCase();
  return expected.includes(entityName) ? 0.2 : 0.8;
}

function computeRelevance(entity, currentContext) {
  if (!currentContext) return 0.5; // Neutral relevance
  const context = currentContext.toLowerCase();
  const entityName = (entity.name || '').toLowerCase();
  return context.includes(entityName) ? 0.9 : 0.3;
}
```

### 1-Hop Spreading Activation (IV-03)
```javascript
// Source: REVERIE-SPEC Section 3.2, INNER-VOICE-ABSTRACT Section 5.3
function propagateActivation(anchorEntities, graphData, options = {}) {
  const hops = options.hops || 1;
  const decayFactor = options.decayFactor || 0.5;
  const minThreshold = options.minThreshold || 0.3;
  const convergenceBonus = options.convergenceBonus || 1.5;
  const domainFrameBonus = options.domainFrameBonus || 1.3;
  const domainFrame = options.domainFrame || null;
  const map = {};

  // Initialize anchor entities
  for (const anchor of anchorEntities) {
    map[anchor.id] = {
      level: anchor.level || 1.0,
      sources: ['direct_mention'],
      last_activated: new Date().toISOString(),
      convergence_count: 1
    };
  }

  // BFS propagation (1-hop in v1.3)
  for (let hop = 0; hop < hops; hop++) {
    const currentIds = Object.keys(map).filter(id => map[id].level >= minThreshold);
    for (const id of currentIds) {
      const neighbors = (graphData && graphData[id]) || [];
      for (const neighbor of neighbors) {
        const propagatedLevel = map[id].level * decayFactor;
        if (propagatedLevel < minThreshold) continue;

        // Apply domain frame bonus if edge matches
        let adjustedLevel = propagatedLevel;
        if (domainFrame && neighbor.domain === domainFrame) {
          adjustedLevel *= domainFrameBonus;
        }

        if (map[neighbor.id]) {
          // Convergent activation: boost existing entry
          map[neighbor.id].level = Math.min(1.0, map[neighbor.id].level + adjustedLevel);
          map[neighbor.id].convergence_count++;
          if (map[neighbor.id].convergence_count >= 2) {
            map[neighbor.id].level = Math.min(1.0, map[neighbor.id].level * convergenceBonus);
          }
          map[neighbor.id].sources.push('association');
        } else {
          map[neighbor.id] = {
            level: Math.min(1.0, adjustedLevel),
            sources: ['association'],
            last_activated: new Date().toISOString(),
            convergence_count: 1
          };
        }
      }
    }
  }

  return map;
}
```

### Time-Based Activation Decay (IV-03)
```javascript
// Source: REVERIE-SPEC Section 3.2
function decayAll(activationMap, options = {}) {
  const decayRate = options.decayRate || 0.1; // per-minute decay
  const now = options.now || new Date();
  const decayed = {};

  for (const [id, entry] of Object.entries(activationMap)) {
    const lastActivated = new Date(entry.last_activated);
    const minutesElapsed = (now - lastActivated) / 60000;
    const decayFactor = Math.exp(-decayRate * minutesElapsed);
    const newLevel = entry.level * decayFactor;

    if (newLevel >= 0.01) { // Prune effectively-zero entries
      decayed[id] = {
        ...entry,
        level: newLevel
      };
    }
  }

  return decayed;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Haiku curation via OpenRouter API | Subagent-based processing (Max subscription) | Phase 24 (planned) | Phase 23 preserves classic Haiku path; Phase 24 migrates to subagents |
| Flat curation pipeline (search -> curate -> inject) | Cognitive pipeline (extract -> activate -> classify -> decide -> format) | Phase 23-24 | Phase 23 builds the data structures; Phase 24 activates the pipeline |
| No feature flags | reverie.mode config flag (classic/hybrid/cortex) | Phase 23 | Enables safe rollback and A/B testing |
| 5 hook events only | 7 hook events (+ SubagentStart, SubagentStop) | Phase 23 | Enables subagent lifecycle integration |

**Deprecated/outdated:**
- None in Phase 23 scope. All existing classic behavior is preserved unchanged.

## Open Questions

1. **SubagentStart/SubagentStop dispatcher output format**
   - What we know: These events use a different JSON output format (`hookSpecificOutput`) than the existing 5 events (raw text to stdout wrapped in boundary markers). The dispatcher currently wraps ALL output in boundary markers.
   - What's unclear: Whether to add a separate code path in the dispatcher for these events, or refactor the boundary wrapping to be event-type-aware.
   - Recommendation: Add these events to VALID_EVENTS and use a conditional check: if event is SubagentStart or SubagentStop, skip boundary wrapping and output JSON directly. Minimal change to existing code.

2. **Config.json default reverie section**
   - What we know: Current config.json has no reverie key. Phase 23 needs `reverie.mode` to default to `classic`.
   - What's unclear: Should install/sync add a default reverie section to config.json, or should the code always apply defaults when the section is missing?
   - Recommendation: Code always applies defaults (defensive reads with `|| 'classic'`). Install pipeline updated in Phase 26 (OPS-03). No config.json modification in Phase 23.

3. **Entity extraction pattern specificity for project context**
   - What we know: REVERIE-SPEC lists project names, file paths, function names, technical terms. The patterns should be project-aware (e.g., recognize "dynamo", "reverie" as project entities).
   - What's unclear: How broad should the technical terms pattern be? Too broad catches noise; too narrow misses important entities.
   - Recommendation: Start conservative with the patterns in the Code Examples section. The keyword lists can be tuned in Phase 24 when actual graph queries validate entity extraction quality.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, v24.13.1) |
| Config file | None (no config file needed; `node --test` discovers *.test.cjs files) |
| Quick run command | `node --test dynamo/tests/reverie/*.test.cjs` |
| Full suite command | `node --test dynamo/tests/*.test.cjs dynamo/tests/ledger/*.test.cjs dynamo/tests/switchboard/*.test.cjs dynamo/tests/reverie/*.test.cjs` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IV-01 | State file load/persist/corruption recovery | unit | `node --test dynamo/tests/reverie/state.test.cjs` | Wave 0 |
| IV-02 | Entity extraction patterns, <5ms benchmark | unit | `node --test dynamo/tests/reverie/activation.test.cjs` | Wave 0 |
| IV-03 | Activation map propagation, decay, convergence | unit | `node --test dynamo/tests/reverie/activation.test.cjs` | Wave 0 |
| IV-04 | Sublimation score computation | unit | `node --test dynamo/tests/reverie/activation.test.cjs` | Wave 0 |
| IV-10 | Domain frame classification, <1ms benchmark | unit | `node --test dynamo/tests/reverie/activation.test.cjs` | Wave 0 |
| IV-12 | Predictions state + surprise factor | unit | `node --test dynamo/tests/reverie/activation.test.cjs` | Wave 0 |
| OPS-MON-01 | Spawn cap tracking | unit | `node --test dynamo/tests/reverie/activation.test.cjs` | Wave 0 |
| OPS-MON-02 | Rate limit flag + degradation | unit | `node --test dynamo/tests/reverie/activation.test.cjs` | Wave 0 |
| FLAG-01 | Config mode validation (classic/hybrid/cortex) | unit | `node --test dynamo/tests/config.test.cjs` | Wave 0 |
| FLAG-03 | Config get/set/validate CLI | unit | `node --test dynamo/tests/config.test.cjs` | Wave 0 |
| HOOK-01 | Dispatcher mode-based routing | unit+integration | `node --test dynamo/tests/ledger/dispatcher.test.cjs` | Existing (needs additions) |
| HOOK-02 | SubagentStart/SubagentStop in settings-hooks.json | unit | `node --test dynamo/tests/ledger/dispatcher.test.cjs` | Existing (needs additions) |
| HOOK-03 | 7 handler modules exist + pass-through behavior | unit | `node --test dynamo/tests/reverie/handlers.test.cjs` | Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test dynamo/tests/reverie/*.test.cjs dynamo/tests/config.test.cjs`
- **Per wave merge:** `node --test dynamo/tests/*.test.cjs dynamo/tests/ledger/*.test.cjs dynamo/tests/switchboard/*.test.cjs dynamo/tests/reverie/*.test.cjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `dynamo/tests/reverie/` directory -- needs creation
- [ ] `dynamo/tests/reverie/state.test.cjs` -- covers IV-01
- [ ] `dynamo/tests/reverie/activation.test.cjs` -- covers IV-02, IV-03, IV-04, IV-10, IV-12, OPS-MON-01, OPS-MON-02
- [ ] `dynamo/tests/reverie/handlers.test.cjs` -- covers HOOK-03
- [ ] `dynamo/tests/config.test.cjs` -- covers FLAG-01, FLAG-03
- [ ] Additions to existing `dynamo/tests/ledger/dispatcher.test.cjs` -- covers HOOK-01, HOOK-02

## Sources

### Primary (HIGH confidence)
- `cc/hooks/dynamo-hooks.cjs` -- Current dispatcher implementation (read directly)
- `cc/settings-hooks.json` -- Current hook registration template (read directly)
- `lib/core.cjs` -- loadConfig(), logError(), isEnabled() implementations (read directly)
- `lib/resolve.cjs`, `lib/layout.cjs` -- Path resolution system (read directly)
- `subsystems/ledger/hooks/*.cjs` -- All 5 existing Ledger handlers (read directly)
- `dynamo/config.json` -- Current config file structure (read directly)
- `dynamo.cjs` -- CLI router structure (read directly)
- `.planning/research/REVERIE-SPEC.md` -- Full Reverie specification (Sections 3-8 read)
- `.planning/research/INNER-VOICE-ABSTRACT.md` -- Platform-agnostic Inner Voice concept (full read)
- `.planning/research/DYNAMO-PRD.md` -- PRD with subsystem boundaries (full read)
- [Claude Code subagents documentation](https://code.claude.com/docs/en/sub-agents) -- SubagentStart/SubagentStop hook configuration, event schemas, output format
- [Claude Code hooks documentation](https://code.claude.com/docs/en/hooks) -- Hook input schemas, exit codes, JSON output structure

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` -- Phase requirement definitions (read directly)
- `.planning/ROADMAP.md` -- Phase success criteria (read directly)
- `.planning/phases/23-foundation-and-routing/23-CONTEXT.md` -- User decisions (read directly)

### Tertiary (LOW confidence)
- Entity extraction regex patterns -- Designed based on common code patterns; will need tuning in Phase 24 when real graph queries validate extraction quality
- Domain frame keyword sets -- Representative but not exhaustive; confidence in classification accuracy is MEDIUM until tested against real user prompts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all built-in Node.js modules, established codebase patterns, zero dependencies
- Architecture: HIGH -- all patterns derived from existing codebase (handlers, dispatcher, state files) and verified REVERIE-SPEC
- Pitfalls: HIGH -- identified from reading existing code, Claude Code hook documentation, and REVERIE-SPEC input/output format differences
- Entity extraction patterns: MEDIUM -- designed from general principles; needs real-world validation
- Domain frame keywords: MEDIUM -- representative but not tuned against actual user prompts

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable domain; no external dependencies to go stale)

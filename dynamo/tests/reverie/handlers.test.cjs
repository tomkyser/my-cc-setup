// Dynamo > Tests > Reverie > handlers.test.cjs
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');
const HANDLERS_DIR = path.join(REPO_ROOT, 'subsystems', 'reverie', 'handlers');

const ALL_HANDLERS = [
  'session-start',
  'user-prompt',
  'post-tool-use',
  'pre-compact',
  'stop',
  'iv-subagent-start',
  'iv-subagent-stop'
];

const COGNITIVE_HANDLERS = [
  'session-start',
  'user-prompt',
  'post-tool-use',
  'pre-compact',
  'stop'
];

const SUBAGENT_HANDLERS = [
  'iv-subagent-start',
  'iv-subagent-stop'
];

// --- Structural tests ---

describe('Reverie handler files exist', () => {
  for (const name of ALL_HANDLERS) {
    it(`${name}.cjs exists at subsystems/reverie/handlers/`, () => {
      const filePath = path.join(HANDLERS_DIR, name + '.cjs');
      assert.ok(fs.existsSync(filePath), `${name}.cjs must exist at ${HANDLERS_DIR}`);
    });
  }
});

describe('Reverie handler branding', () => {
  for (const name of ALL_HANDLERS) {
    it(`${name}.cjs starts with "// Dynamo > Reverie > Handlers >"`, () => {
      const src = fs.readFileSync(path.join(HANDLERS_DIR, name + '.cjs'), 'utf8');
      assert.ok(src.startsWith('// Dynamo > Reverie > Handlers >'), `${name}.cjs must start with Dynamo > Reverie > Handlers > branding`);
    });
  }
});

describe('Reverie handler exports', () => {
  for (const name of ALL_HANDLERS) {
    it(`${name}.cjs exports a function`, () => {
      const handler = require(path.join(HANDLERS_DIR, name + '.cjs'));
      assert.strictEqual(typeof handler, 'function', `${name}.cjs must export a function`);
    });
  }
});

// --- Pipeline delegation: no Ledger pass-through ---

describe('No handler delegates to Ledger', () => {
  for (const name of ALL_HANDLERS) {
    it(`${name}.cjs does NOT contain resolve('ledger' pass-through`, () => {
      const src = fs.readFileSync(path.join(HANDLERS_DIR, name + '.cjs'), 'utf8');
      assert.ok(!src.includes("resolve('ledger'"), `${name}.cjs must NOT delegate to ledger via resolve('ledger'`);
    });
  }
});

// --- Cognitive handlers: inner-voice.cjs pipeline delegation ---

describe('Cognitive handlers import inner-voice.cjs', () => {
  for (const name of COGNITIVE_HANDLERS) {
    it(`${name}.cjs imports from inner-voice.cjs`, () => {
      const src = fs.readFileSync(path.join(HANDLERS_DIR, name + '.cjs'), 'utf8');
      assert.ok(src.includes("resolve('reverie', 'inner-voice.cjs')"), `${name}.cjs must import inner-voice.cjs via resolve`);
    });
  }
});

describe('Cognitive handlers use loadState and persistState', () => {
  for (const name of COGNITIVE_HANDLERS) {
    it(`${name}.cjs calls loadState()`, () => {
      const src = fs.readFileSync(path.join(HANDLERS_DIR, name + '.cjs'), 'utf8');
      assert.ok(src.includes('loadState()'), `${name}.cjs must call loadState()`);
    });

    it(`${name}.cjs calls persistState(`, () => {
      const src = fs.readFileSync(path.join(HANDLERS_DIR, name + '.cjs'), 'utf8');
      assert.ok(src.includes('persistState('), `${name}.cjs must call persistState(`);
    });
  }
});

describe('Cognitive handlers use logError with reverie- prefix', () => {
  for (const name of COGNITIVE_HANDLERS) {
    it(`${name}.cjs contains logError('reverie-`, () => {
      const src = fs.readFileSync(path.join(HANDLERS_DIR, name + '.cjs'), 'utf8');
      assert.ok(src.includes("logError('reverie-"), `${name}.cjs must use logError with reverie- prefix`);
    });
  }
});

describe('Cognitive handlers call correct pipeline functions', () => {
  it('session-start.cjs calls processSessionStart(', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'session-start.cjs'), 'utf8');
    assert.ok(src.includes('processSessionStart('), 'session-start.cjs must call processSessionStart');
  });

  it('user-prompt.cjs calls processUserPrompt(', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'user-prompt.cjs'), 'utf8');
    assert.ok(src.includes('processUserPrompt('), 'user-prompt.cjs must call processUserPrompt');
  });

  it('user-prompt.cjs calls consumeDeliberationResult(', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'user-prompt.cjs'), 'utf8');
    assert.ok(src.includes('consumeDeliberationResult('), 'user-prompt.cjs must consume deliberation results');
  });

  it('user-prompt.cjs writes to process.stdout.write(', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'user-prompt.cjs'), 'utf8');
    assert.ok(src.includes('process.stdout.write('), 'user-prompt.cjs must write injection output to stdout');
  });

  it('post-tool-use.cjs calls processPostToolUse(', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'post-tool-use.cjs'), 'utf8');
    assert.ok(src.includes('processPostToolUse('), 'post-tool-use.cjs must call processPostToolUse');
  });

  it('pre-compact.cjs calls processPreCompact(', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'pre-compact.cjs'), 'utf8');
    assert.ok(src.includes('processPreCompact('), 'pre-compact.cjs must call processPreCompact');
  });

  it('stop.cjs calls processStop(', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'stop.cjs'), 'utf8');
    assert.ok(src.includes('processStop('), 'stop.cjs must call processStop');
  });
});

// --- SubagentStart handler ---

describe('iv-subagent-start.cjs pipeline integration', () => {
  it('does NOT contain stub marker', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-start.cjs'), 'utf8');
    assert.ok(!src.includes("(stub -- no action)"), 'iv-subagent-start.cjs must not be a stub');
  });

  it('calls loadState()', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-start.cjs'), 'utf8');
    assert.ok(src.includes('loadState()'), 'iv-subagent-start.cjs must call loadState()');
  });

  it('builds context package with self_model', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-start.cjs'), 'utf8');
    assert.ok(src.includes('self_model'), 'iv-subagent-start.cjs must include self_model in context package');
  });

  it('builds context package with activation_map', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-start.cjs'), 'utf8');
    assert.ok(src.includes('activation_map'), 'iv-subagent-start.cjs must include activation_map in context package');
  });

  it('contains buildInstructions function', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-start.cjs'), 'utf8');
    assert.ok(src.includes('buildInstructions'), 'iv-subagent-start.cjs must have buildInstructions function');
  });

  it('checks for inner-voice agent name', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-start.cjs'), 'utf8');
    assert.ok(src.includes("'inner-voice'"), 'iv-subagent-start.cjs must check for inner-voice agent name');
  });

  it('returns null for non-inner-voice agents', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-start.cjs'), 'utf8');
    assert.ok(src.includes('return null'), 'iv-subagent-start.cjs must return null for non-inner-voice agents');
  });

  it('uses logError with reverie- prefix', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-start.cjs'), 'utf8');
    assert.ok(src.includes("logError('reverie-"), 'iv-subagent-start.cjs must use logError with reverie- prefix');
  });
});

// --- SubagentStop handler ---

describe('iv-subagent-stop.cjs pipeline integration', () => {
  it('does NOT contain stub marker', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-stop.cjs'), 'utf8');
    assert.ok(!src.includes("(stub -- no action)"), 'iv-subagent-stop.cjs must not be a stub');
  });

  it('calls writeDeliberationResult(', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-stop.cjs'), 'utf8');
    assert.ok(src.includes('writeDeliberationResult('), 'iv-subagent-stop.cjs must call writeDeliberationResult');
  });

  it('returns null (Pitfall 1 compliance)', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-stop.cjs'), 'utf8');
    assert.ok(src.includes('return null'), 'iv-subagent-stop.cjs must return null per Pitfall 1');
  });

  it('clears deliberation_pending flag', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-stop.cjs'), 'utf8');
    assert.ok(src.includes('deliberation_pending = false'), 'iv-subagent-stop.cjs must clear deliberation_pending flag');
  });

  it('calls persistState(', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-stop.cjs'), 'utf8');
    assert.ok(src.includes('persistState('), 'iv-subagent-stop.cjs must persist updated state');
  });

  it('checks for inner-voice agent name', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-stop.cjs'), 'utf8');
    assert.ok(src.includes("'inner-voice'"), 'iv-subagent-stop.cjs must check for inner-voice agent name');
  });

  it('imports inner-voice.cjs', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-stop.cjs'), 'utf8');
    assert.ok(src.includes("resolve('reverie', 'inner-voice.cjs')"), 'iv-subagent-stop.cjs must import inner-voice.cjs');
  });

  it('uses logError with reverie- prefix', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-stop.cjs'), 'utf8');
    assert.ok(src.includes("logError('reverie-"), 'iv-subagent-stop.cjs must use logError with reverie- prefix');
  });
});

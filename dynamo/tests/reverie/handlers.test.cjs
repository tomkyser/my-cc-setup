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

const PASS_THROUGH_HANDLERS = [
  'session-start',
  'user-prompt',
  'post-tool-use',
  'pre-compact',
  'stop'
];

const NO_OP_HANDLERS = [
  'iv-subagent-start',
  'iv-subagent-stop'
];

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

describe('Pass-through handlers delegate to Ledger', () => {
  for (const name of PASS_THROUGH_HANDLERS) {
    it(`${name}.cjs contains resolve('ledger' delegation`, () => {
      const src = fs.readFileSync(path.join(HANDLERS_DIR, name + '.cjs'), 'utf8');
      assert.ok(src.includes("resolve('ledger'"), `${name}.cjs must delegate to ledger via resolve('ledger'`);
    });
  }
});

describe('No-op handlers use logError', () => {
  it('iv-subagent-start.cjs contains logError call', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-start.cjs'), 'utf8');
    assert.ok(src.includes('logError'), 'iv-subagent-start.cjs must use logError');
  });

  it('iv-subagent-stop.cjs contains logError call', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-stop.cjs'), 'utf8');
    assert.ok(src.includes('logError'), 'iv-subagent-stop.cjs must use logError');
  });
});

describe('No-op handlers extract agent_type', () => {
  it('iv-subagent-start.cjs source contains agent_type', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-start.cjs'), 'utf8');
    assert.ok(src.includes('agent_type'), 'iv-subagent-start.cjs must reference agent_type');
  });

  it('iv-subagent-stop.cjs source contains agent_type', () => {
    const src = fs.readFileSync(path.join(HANDLERS_DIR, 'iv-subagent-stop.cjs'), 'utf8');
    assert.ok(src.includes('agent_type'), 'iv-subagent-stop.cjs must reference agent_type');
  });
});

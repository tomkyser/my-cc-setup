// Dynamo > Tests > toggle.test.cjs
'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const CORE_PATH = path.join(__dirname, '..', '..', 'lib', 'core.cjs');
const DYNAMO_PATH = path.join(__dirname, '..', '..', 'dynamo.cjs');
const HOOKS_PATH = path.join(__dirname, '..', '..', 'cc', 'hooks', 'dynamo-hooks.cjs');

// --- Helpers ---

function makeTmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix + '-'));
}

function writeConfig(dir, config) {
  const configPath = path.join(dir, 'config.json');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
  return configPath;
}

function readConfig(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
}

// --- isEnabled() tests ---

describe('isEnabled()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = makeTmpDir('dynamo-toggle');
    // Clean DYNAMO_DEV from env for isolation
    delete process.env.DYNAMO_DEV;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.DYNAMO_DEV;
  });

  it('returns true when config.enabled is true', () => {
    const configPath = writeConfig(tmpDir, { version: '0.1.0', enabled: true });
    const { isEnabled } = require(CORE_PATH);
    assert.strictEqual(isEnabled(configPath), true);
  });

  it('returns false when config.enabled is false and DYNAMO_DEV is not set', () => {
    const configPath = writeConfig(tmpDir, { version: '0.1.0', enabled: false });
    delete process.env.DYNAMO_DEV;
    const { isEnabled } = require(CORE_PATH);
    assert.strictEqual(isEnabled(configPath), false);
  });

  it('returns true when config.enabled is false but DYNAMO_DEV=1', () => {
    const configPath = writeConfig(tmpDir, { version: '0.1.0', enabled: false });
    process.env.DYNAMO_DEV = '1';
    const { isEnabled } = require(CORE_PATH);
    assert.strictEqual(isEnabled(configPath), true);
  });

  it('returns true when config has no enabled field (default = enabled)', () => {
    const configPath = writeConfig(tmpDir, { version: '0.1.0' });
    const { isEnabled } = require(CORE_PATH);
    assert.strictEqual(isEnabled(configPath), true);
  });
});

// --- toggle CLI command tests ---

describe('toggle CLI command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = makeTmpDir('dynamo-toggle-cli');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('toggle off writes enabled:false to config.json', () => {
    writeConfig(tmpDir, { version: '0.1.0', enabled: true });
    execSync(`node "${DYNAMO_PATH}" toggle off`, {
      encoding: 'utf8',
      env: { ...process.env, DYNAMO_CONFIG_PATH: path.join(tmpDir, 'config.json') },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const config = readConfig(tmpDir);
    assert.strictEqual(config.enabled, false);
  });

  it('toggle on writes enabled:true to config.json', () => {
    writeConfig(tmpDir, { version: '0.1.0', enabled: false });
    execSync(`node "${DYNAMO_PATH}" toggle on`, {
      encoding: 'utf8',
      env: { ...process.env, DYNAMO_CONFIG_PATH: path.join(tmpDir, 'config.json') },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const config = readConfig(tmpDir);
    assert.strictEqual(config.enabled, true);
  });
});

// --- status CLI command tests ---

describe('status CLI command', () => {
  it('returns enabled, dev_mode, and effective fields', () => {
    const result = execSync(`node "${DYNAMO_PATH}" status`, {
      encoding: 'utf8',
      env: { ...process.env, DYNAMO_DEV: undefined },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.command, 'status');
    assert.strictEqual(typeof parsed.enabled, 'boolean');
    assert.strictEqual(typeof parsed.dev_mode, 'boolean');
    assert.strictEqual(typeof parsed.effective, 'boolean');
  });
});

// --- Hook dispatcher toggle gate test ---

describe('hook dispatcher toggle gate', () => {
  it('dispatcher source contains isEnabled check and process.exit(0)', () => {
    const content = fs.readFileSync(HOOKS_PATH, 'utf8');
    assert.ok(content.includes('isEnabled'), 'should import/call isEnabled');
    assert.ok(/isEnabled.*process\.exit\(0\)|process\.exit\(0\).*isEnabled/s.test(content) ||
      (content.includes('isEnabled') && content.includes('process.exit(0)')),
      'should have toggle gate with process.exit(0)');
  });
});

// Dynamo > Tests > config.test.cjs
'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Config module path (will be created in GREEN phase)
const configModulePath = path.join(__dirname, '..', '..', 'lib', 'config.cjs');

describe('Config Module', () => {
  let tmpDir;
  let configPath;
  let config;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dynamo-config-test-'));
    configPath = path.join(tmpDir, 'config.json');
    // Write a base config to test against
    fs.writeFileSync(configPath, JSON.stringify({
      version: '0.1.0',
      enabled: true,
      graphiti: { mcp_url: 'http://localhost:8100/mcp' },
      timeouts: { health: 3000 }
    }, null, 2) + '\n');
    config = require(configModulePath);
  });

  afterEach(() => {
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
  });

  describe('get()', () => {
    it('returns value for existing top-level key', () => {
      const result = config.get('version', { configPath });
      assert.strictEqual(result, '0.1.0');
    });

    it('returns value for nested key', () => {
      const result = config.get('graphiti.mcp_url', { configPath });
      assert.strictEqual(result, 'http://localhost:8100/mcp');
    });

    it('returns undefined for nonexistent key', () => {
      const result = config.get('nonexistent.key', { configPath });
      assert.strictEqual(result, undefined);
    });
  });

  describe('set()', () => {
    it('creates intermediate objects and writes value', () => {
      config.set('reverie.activation.sublimation_threshold', 0.7, { configPath });
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.strictEqual(raw.reverie.activation.sublimation_threshold, 0.7);
    });

    it('coerces numeric string to number', () => {
      config.set('reverie.activation.sublimation_threshold', '0.6', { configPath });
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.strictEqual(raw.reverie.activation.sublimation_threshold, 0.6);
      assert.strictEqual(typeof raw.reverie.activation.sublimation_threshold, 'number');
    });

    it('throws on out-of-range sublimation_threshold', () => {
      assert.throws(
        () => config.set('reverie.activation.sublimation_threshold', '2.0', { configPath }),
        (err) => err.message.includes('Invalid')
      );
    });

    it('accepts unknown nested keys freely', () => {
      const result = config.set('unknown.nested.key', 'anything', { configPath });
      assert.strictEqual(result, 'anything');
    });

    it('coerces string true to boolean', () => {
      config.set('enabled', 'true', { configPath });
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.strictEqual(raw.enabled, true);
      assert.strictEqual(typeof raw.enabled, 'boolean');
    });

    it('coerces string false to boolean', () => {
      config.set('enabled', 'false', { configPath });
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.strictEqual(raw.enabled, false);
      assert.strictEqual(typeof raw.enabled, 'boolean');
    });

    it('uses atomic write -- tmp file does not persist after set()', () => {
      config.set('reverie.activation.sublimation_threshold', 0.5, { configPath });
      const tmpFile = configPath + '.tmp';
      assert.strictEqual(fs.existsSync(tmpFile), false);
    });
  });

  describe('validate()', () => {
    it('reverie.mode is not a validated key', () => {
      const result = config.validate('reverie.mode', 'anything');
      assert.strictEqual(result, null);
    });

    it('returns null for unknown key (no validator)', () => {
      const result = config.validate('unknown.key', 'any');
      assert.strictEqual(result, null);
    });

    it('validates sublimation_threshold range', () => {
      const valid = config.validate('reverie.activation.sublimation_threshold', 0.5);
      assert.strictEqual(valid, null);
      const invalid = config.validate('reverie.activation.sublimation_threshold', 2.0);
      assert.ok(typeof invalid === 'string');
    });
  });

  describe('getAll()', () => {
    it('returns full parsed config object', () => {
      const result = config.getAll({ configPath });
      assert.strictEqual(typeof result, 'object');
      assert.strictEqual(result.version, '0.1.0');
      assert.strictEqual(result.enabled, true);
    });
  });

  describe('options.configPath', () => {
    it('overrides default CONFIG_PATH for test isolation', () => {
      // The fact that all tests above pass with configPath option proves this works
      config.set('reverie.activation.sublimation_threshold', 0.8, { configPath });
      const result = config.get('reverie.activation.sublimation_threshold', { configPath });
      assert.strictEqual(result, 0.8);
    });
  });

  describe('VALIDATORS', () => {
    it('does not have reverie.mode validator', () => {
      assert.strictEqual(config.VALIDATORS['reverie.mode'], undefined);
    });

    it('has subagent_daily_cap validator', () => {
      assert.ok(config.VALIDATORS['reverie.operational.subagent_daily_cap']);
    });

    it('has sublimation_threshold validator', () => {
      assert.ok(config.VALIDATORS['reverie.activation.sublimation_threshold']);
    });
  });

  describe('CONFIG_PATH', () => {
    it('is exported and ends with config.json', () => {
      assert.ok(config.CONFIG_PATH.endsWith('config.json'));
    });
  });
});

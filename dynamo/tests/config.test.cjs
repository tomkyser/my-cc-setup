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
    it('returns undefined when no reverie key exists in config', () => {
      const result = config.get('reverie.mode', { configPath });
      assert.strictEqual(result, undefined);
    });

    it('returns value for existing top-level key', () => {
      const result = config.get('version', { configPath });
      assert.strictEqual(result, '0.1.0');
    });

    it('returns value for nested key', () => {
      const result = config.get('graphiti.mcp_url', { configPath });
      assert.strictEqual(result, 'http://localhost:8100/mcp');
    });

    it('returns cortex after set', () => {
      config.set('reverie.mode', 'cortex', { configPath });
      const result = config.get('reverie.mode', { configPath });
      assert.strictEqual(result, 'cortex');
    });
  });

  describe('set()', () => {
    it('creates intermediate objects and writes value', () => {
      config.set('reverie.mode', 'cortex', { configPath });
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.strictEqual(raw.reverie.mode, 'cortex');
    });

    it('throws on invalid reverie.mode value', () => {
      assert.throws(
        () => config.set('reverie.mode', 'invalid', { configPath }),
        (err) => err.message.includes('Invalid value for reverie.mode')
      );
    });

    it('accepts classic mode', () => {
      const result = config.set('reverie.mode', 'classic', { configPath });
      assert.strictEqual(result, 'classic');
    });

    it('accepts hybrid mode', () => {
      const result = config.set('reverie.mode', 'hybrid', { configPath });
      assert.strictEqual(result, 'hybrid');
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
      config.set('reverie.mode', 'cortex', { configPath });
      const tmpFile = configPath + '.tmp';
      assert.strictEqual(fs.existsSync(tmpFile), false);
    });
  });

  describe('validate()', () => {
    it('returns null for valid reverie.mode', () => {
      const result = config.validate('reverie.mode', 'cortex');
      assert.strictEqual(result, null);
    });

    it('returns error string for invalid reverie.mode', () => {
      const result = config.validate('reverie.mode', 'bogus');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('Invalid'));
    });

    it('returns null for unknown key (no validator)', () => {
      const result = config.validate('unknown.key', 'any');
      assert.strictEqual(result, null);
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
      config.set('reverie.mode', 'cortex', { configPath });
      const result = config.get('reverie.mode', { configPath });
      assert.strictEqual(result, 'cortex');
    });
  });

  describe('VALIDATORS', () => {
    it('has reverie.mode validator', () => {
      assert.ok(config.VALIDATORS['reverie.mode']);
    });

    it('reverie.mode validator accepts only classic/hybrid/cortex', () => {
      const v = config.VALIDATORS['reverie.mode'];
      assert.strictEqual(v('classic'), true);
      assert.strictEqual(v('hybrid'), true);
      assert.strictEqual(v('cortex'), true);
      assert.strictEqual(v('invalid'), false);
      assert.strictEqual(v(''), false);
    });
  });

  describe('CONFIG_PATH', () => {
    it('is exported and ends with config.json', () => {
      assert.ok(config.CONFIG_PATH.endsWith('config.json'));
    });
  });
});

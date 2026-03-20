// Dynamo > Tests > Reverie > state.test.cjs
'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// State module path (will be created in GREEN phase)
const stateModulePath = path.join(__dirname, '..', '..', '..', 'subsystems', 'reverie', 'state.cjs');

describe('Reverie State Module', () => {
  let tmpDir;
  let statePath;
  let stateModule;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dynamo-state-test-'));
    statePath = path.join(tmpDir, 'inner-voice-state.json');
    stateModule = require(stateModulePath);
  });

  afterEach(() => {
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
  });

  describe('freshDefaults()', () => {
    it('returns object with all expected top-level keys', () => {
      const defaults = stateModule.freshDefaults();
      const expectedKeys = [
        'version', 'last_updated', 'session_id',
        'activation_map', 'domain_frame', 'predictions', 'processing',
        'self_model', 'relationship_model', 'injection_history', 'pending_associations'
      ];
      for (const key of expectedKeys) {
        assert.ok(key in defaults, `Missing key: ${key}`);
      }
    });

    it('has domain_frame.current_frame === general', () => {
      const defaults = stateModule.freshDefaults();
      assert.strictEqual(defaults.domain_frame.current_frame, 'general');
    });

    it('has predictions.confidence === 0.5', () => {
      const defaults = stateModule.freshDefaults();
      assert.strictEqual(defaults.predictions.confidence, 0.5);
    });

    it('has processing.deliberation_pending === false', () => {
      const defaults = stateModule.freshDefaults();
      assert.strictEqual(defaults.processing.deliberation_pending, false);
    });

    it('has version === 1', () => {
      const defaults = stateModule.freshDefaults();
      assert.strictEqual(defaults.version, 1);
    });

    it('has session_id === null', () => {
      const defaults = stateModule.freshDefaults();
      assert.strictEqual(defaults.session_id, null);
    });

    it('has empty activation_map', () => {
      const defaults = stateModule.freshDefaults();
      assert.deepStrictEqual(defaults.activation_map, {});
    });

    it('has self_model with expected structure', () => {
      const defaults = stateModule.freshDefaults();
      assert.strictEqual(defaults.self_model.attention_state, null);
      assert.strictEqual(defaults.self_model.injection_mode, 'standard');
      assert.strictEqual(defaults.self_model.confidence, 0.5);
      assert.strictEqual(defaults.self_model.recent_performance.injections_made, 0);
    });

    it('has relationship_model with expected structure', () => {
      const defaults = stateModule.freshDefaults();
      assert.deepStrictEqual(defaults.relationship_model.communication_preferences, []);
      assert.strictEqual(defaults.relationship_model.affect_baseline, 'neutral');
    });

    it('has empty arrays for injection_history and pending_associations', () => {
      const defaults = stateModule.freshDefaults();
      assert.deepStrictEqual(defaults.injection_history, []);
      assert.deepStrictEqual(defaults.pending_associations, []);
    });
  });

  describe('loadState()', () => {
    it('returns freshDefaults() on missing file', () => {
      const state = stateModule.loadState(null, { statePath });
      assert.strictEqual(state.version, 1);
      assert.strictEqual(state.domain_frame.current_frame, 'general');
      assert.strictEqual(state.predictions.confidence, 0.5);
    });

    it('returns freshDefaults() on corrupt JSON and logs error', () => {
      fs.writeFileSync(statePath, '{"truncated": true', 'utf8'); // Invalid JSON
      const state = stateModule.loadState(null, { statePath });
      assert.strictEqual(state.version, 1);
      assert.strictEqual(state.domain_frame.current_frame, 'general');
    });

    it('merges loaded state with defaults (missing fields get defaults)', () => {
      // Write partial state -- missing several keys
      fs.writeFileSync(statePath, JSON.stringify({
        version: 1,
        session_id: 'test-session',
        activation_map: { foo: { level: 0.8 } }
      }, null, 2));
      const state = stateModule.loadState(null, { statePath });
      // Loaded fields preserved
      assert.strictEqual(state.session_id, 'test-session');
      assert.deepStrictEqual(state.activation_map, { foo: { level: 0.8 } });
      // Default fields filled in
      assert.strictEqual(state.domain_frame.current_frame, 'general');
      assert.strictEqual(state.predictions.confidence, 0.5);
    });

    it('options.statePath overrides default for test isolation', () => {
      const customPath = path.join(tmpDir, 'custom-state.json');
      fs.writeFileSync(customPath, JSON.stringify({ version: 2 }));
      const state = stateModule.loadState(null, { statePath: customPath });
      assert.strictEqual(state.version, 2);
    });
  });

  describe('persistState()', () => {
    it('round-trips correctly -- all fields preserved', () => {
      const original = stateModule.freshDefaults();
      original.session_id = 'round-trip-test';
      original.activation_map = { entity1: { level: 0.9 } };
      stateModule.persistState(original, null, { statePath });
      const loaded = stateModule.loadState(null, { statePath });
      assert.strictEqual(loaded.session_id, 'round-trip-test');
      assert.deepStrictEqual(loaded.activation_map, { entity1: { level: 0.9 } });
    });

    it('uses atomic write -- tmp file not present after persist', () => {
      const state = stateModule.freshDefaults();
      stateModule.persistState(state, null, { statePath });
      // No .tmp files should remain
      const files = fs.readdirSync(tmpDir);
      const tmpFiles = files.filter(f => f.endsWith('.tmp'));
      assert.strictEqual(tmpFiles.length, 0);
    });

    it('creates parent directories if missing', () => {
      const deepPath = path.join(tmpDir, 'deep', 'nested', 'state.json');
      const state = stateModule.freshDefaults();
      stateModule.persistState(state, null, { statePath: deepPath });
      assert.ok(fs.existsSync(deepPath));
    });

    it('updates last_updated timestamp', () => {
      const state = stateModule.freshDefaults();
      const before = new Date().toISOString();
      stateModule.persistState(state, null, { statePath });
      const loaded = stateModule.loadState(null, { statePath });
      // last_updated should be a valid ISO string
      assert.ok(loaded.last_updated);
      assert.ok(new Date(loaded.last_updated).toISOString() === loaded.last_updated);
    });
  });

  describe('DEFAULT_STATE_PATH', () => {
    it('is exported and ends with inner-voice-state.json', () => {
      assert.ok(stateModule.DEFAULT_STATE_PATH.endsWith('inner-voice-state.json'));
    });

    it('contains .claude/dynamo in the path', () => {
      assert.ok(stateModule.DEFAULT_STATE_PATH.includes(path.join('.claude', 'dynamo')));
    });
  });
});

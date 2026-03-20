// Dynamo > Tests > resolve.test.cjs
'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.join(__dirname, '..', '..');
const resolve = require(path.join(REPO_ROOT, 'lib', 'resolve.cjs'));

describe('lib/resolve.cjs', () => {
  beforeEach(() => {
    resolve._reset();
  });

  describe('resolve paths (six-subsystem layout)', () => {
    it('resolves assay/search.cjs to absolute path in subsystems/assay/', () => {
      const result = resolve('assay', 'search.cjs');
      assert.ok(path.isAbsolute(result), 'should be absolute path');
      assert.ok(result.endsWith(path.join('subsystems', 'assay', 'search.cjs')), `path should end with subsystems/assay/search.cjs, got: ${result}`);
      assert.ok(fs.existsSync(result), 'resolved path should exist');
    });

    it('resolves lib/core.cjs to absolute path ending in lib/core.cjs', () => {
      const result = resolve('lib', 'core.cjs');
      assert.ok(path.isAbsolute(result), 'should be absolute path');
      assert.ok(result.endsWith(path.join('lib', 'core.cjs')), `path should end with lib/core.cjs, got: ${result}`);
      assert.ok(fs.existsSync(result), 'resolved path should exist');
    });

    it('resolves lib/scope.cjs to absolute path ending in lib/scope.cjs', () => {
      const result = resolve('lib', 'scope.cjs');
      assert.ok(path.isAbsolute(result), 'should be absolute path');
      assert.ok(result.endsWith(path.join('lib', 'scope.cjs')), `path should end with lib/scope.cjs, got: ${result}`);
      assert.ok(fs.existsSync(result), 'resolved path should exist');
    });

    it('resolves lib/pretty.cjs to absolute path ending in lib/pretty.cjs', () => {
      const result = resolve('lib', 'pretty.cjs');
      assert.ok(path.isAbsolute(result), 'should be absolute path');
      assert.ok(result.endsWith(path.join('lib', 'pretty.cjs')), `path should end with lib/pretty.cjs, got: ${result}`);
      assert.ok(fs.existsSync(result), 'resolved path should exist');
    });

    it('resolves switchboard/sync.cjs to absolute path in subsystems/switchboard/', () => {
      const result = resolve('switchboard', 'sync.cjs');
      assert.ok(path.isAbsolute(result), 'should be absolute path');
      assert.ok(result.endsWith(path.join('subsystems', 'switchboard', 'sync.cjs')), `path should end with subsystems/switchboard/sync.cjs, got: ${result}`);
      assert.ok(fs.existsSync(result), 'resolved path should exist');
    });

    it('resolves terminus/mcp-client.cjs to absolute path in subsystems/terminus/', () => {
      const result = resolve('terminus', 'mcp-client.cjs');
      assert.ok(path.isAbsolute(result), 'should be absolute path');
      assert.ok(result.endsWith(path.join('subsystems', 'terminus', 'mcp-client.cjs')), `path should end with subsystems/terminus/mcp-client.cjs, got: ${result}`);
      assert.ok(fs.existsSync(result), 'resolved path should exist');
    });

    it('resolves lib/resolve.cjs to absolute path ending in lib/resolve.cjs', () => {
      const result = resolve('lib', 'resolve.cjs');
      assert.ok(path.isAbsolute(result), 'should be absolute path');
      assert.ok(result.endsWith(path.join('lib', 'resolve.cjs')), `path should end with lib/resolve.cjs, got: ${result}`);
      assert.ok(fs.existsSync(result), 'resolved path should exist');
    });
  });

  describe('error handling', () => {
    it('throws for unknown subsystem with descriptive message', () => {
      assert.throws(
        () => resolve('bogus', 'file.cjs'),
        (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes("unknown subsystem 'bogus'"), `message should contain "unknown subsystem 'bogus'", got: ${err.message}`);
          assert.ok(err.message.includes('Known:'), `message should contain "Known:", got: ${err.message}`);
          return true;
        }
      );
    });

    it('throws for missing file with checked path in message', () => {
      assert.throws(
        () => resolve('ledger', 'nonexistent-file.cjs'),
        (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('not found'), `message should contain "not found", got: ${err.message}`);
          assert.ok(err.message.includes('nonexistent-file.cjs'), `message should contain the file name, got: ${err.message}`);
          return true;
        }
      );
    });
  });

  describe('cache reset', () => {
    it('resolves correctly after _reset()', () => {
      // Call resolve to populate cache
      resolve('lib', 'core.cjs');

      // Reset and verify resolution still works (cache cleared, re-populated)
      resolve._reset();
      const result = resolve('lib', 'core.cjs');
      assert.ok(fs.existsSync(result), 'should resolve after reset');
    });
  });

  describe('subsystem names', () => {
    it('throws not-found (not unknown-subsystem) for known subsystem with nonexistent file', () => {
      assert.throws(
        () => resolve('assay', 'foo.cjs'),
        (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('not found'), `should say "not found", got: ${err.message}`);
          assert.ok(!err.message.includes('unknown subsystem'), `should NOT say "unknown subsystem", got: ${err.message}`);
          return true;
        }
      );
    });
  });

  describe('directory resolution', () => {
    it('resolves ledger/hooks directory path', () => {
      const result = resolve('ledger', 'hooks');
      assert.ok(path.isAbsolute(result), 'should be absolute path');
      assert.ok(result.endsWith(path.join('subsystems', 'ledger', 'hooks')), `path should end with subsystems/ledger/hooks, got: ${result}`);
      assert.ok(fs.existsSync(result), 'resolved path should exist');
    });
  });
});

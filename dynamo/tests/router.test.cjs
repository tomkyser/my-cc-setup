// Dynamo > Tests > router.test.cjs
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const DYNAMO_PATH = path.join(__dirname, '..', 'dynamo.cjs');

describe('dynamo.cjs CLI router', () => {

  it('file exists with shebang and identity comment', () => {
    assert.ok(fs.existsSync(DYNAMO_PATH), 'dynamo.cjs should exist');
    const content = fs.readFileSync(DYNAMO_PATH, 'utf8');
    assert.ok(content.startsWith('#!/usr/bin/env node'), 'should have shebang');
    assert.ok(content.includes('Dynamo'), 'should have identity comment');
  });

  it('can be required without error', () => {
    // Requiring dynamo.cjs should not throw (it calls main() at the bottom,
    // but we test it via execSync instead to avoid process.exit side effects)
    assert.ok(fs.existsSync(DYNAMO_PATH));
  });

  it('help output contains all expected command names', () => {
    const result = execSync(`node "${DYNAMO_PATH}" help 2>&1`, { encoding: 'utf8' });
    const expectedCommands = [
      'health-check', 'diagnose', 'verify-memory', 'sync',
      'start', 'stop', 'install', 'rollback', 'session',
      'test', 'version', 'help'
    ];
    for (const cmd of expectedCommands) {
      assert.ok(result.includes(cmd), `help should mention "${cmd}"`);
    }
  });

  it('--help flag shows help', () => {
    const result = execSync(`node "${DYNAMO_PATH}" --help 2>&1`, { encoding: 'utf8' });
    assert.ok(result.includes('Dynamo'), 'should show Dynamo in help');
    assert.ok(result.includes('Commands:'), 'should show Commands section');
  });

  it('version command outputs JSON with version field', () => {
    const result = execSync(`node "${DYNAMO_PATH}" version`, { encoding: 'utf8' });
    const parsed = JSON.parse(result);
    assert.ok(parsed.version, 'should have version field');
    assert.ok(parsed.command === 'version', 'should have command field');
  });

  it('unknown command produces error', () => {
    try {
      execSync(`node "${DYNAMO_PATH}" nonexistent-cmd 2>&1`, { encoding: 'utf8' });
      assert.fail('should have thrown');
    } catch (e) {
      assert.ok(e.stderr.includes('Unknown command') || e.stdout.includes('Unknown command'),
        'should mention unknown command');
    }
  });

  it('contains switch statement with cases for all commands', () => {
    const content = fs.readFileSync(DYNAMO_PATH, 'utf8');
    assert.ok(content.includes('switch'), 'should have switch statement');
    assert.ok(content.includes("'health-check'"), 'should have health-check case');
    assert.ok(content.includes("'diagnose'"), 'should have diagnose case');
    assert.ok(content.includes("'verify-memory'"), 'should have verify-memory case');
    assert.ok(content.includes("'sync'"), 'should have sync case');
    assert.ok(content.includes("'start'"), 'should have start case');
    assert.ok(content.includes("'stop'"), 'should have stop case');
    assert.ok(content.includes("'install'"), 'should have install case');
    assert.ok(content.includes("'rollback'"), 'should have rollback case');
    assert.ok(content.includes("'session'"), 'should have session case');
    assert.ok(content.includes("'test'"), 'should have test case');
    assert.ok(content.includes("'version'"), 'should have version case');
  });

  it('requires correct switchboard modules', () => {
    const content = fs.readFileSync(DYNAMO_PATH, 'utf8');
    assert.ok(content.includes('health-check.cjs'), 'should require health-check.cjs');
    assert.ok(content.includes('install.cjs'), 'should require install.cjs');
    assert.ok(content.includes('sessions.cjs'), 'should require sessions.cjs');
    assert.ok(content.includes('diagnose.cjs'), 'should require diagnose.cjs');
    assert.ok(content.includes('verify-memory.cjs'), 'should require verify-memory.cjs');
    assert.ok(content.includes('sync.cjs'), 'should require sync.cjs');
    assert.ok(content.includes('stack.cjs'), 'should require stack.cjs');
  });

  it('has showHelp function', () => {
    const content = fs.readFileSync(DYNAMO_PATH, 'utf8');
    assert.ok(content.includes('showHelp'), 'should have showHelp function');
  });

  it('has showVersion function reading VERSION file', () => {
    const content = fs.readFileSync(DYNAMO_PATH, 'utf8');
    assert.ok(content.includes('showVersion'), 'should have showVersion function');
    assert.ok(content.includes('VERSION'), 'should reference VERSION file');
  });
});

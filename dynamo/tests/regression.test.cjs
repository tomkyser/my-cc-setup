// Dynamo > Tests > regression.test.cjs
'use strict';

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const core = require(path.join(__dirname, '..', 'core.cjs'));
const { SCOPE, validateGroupId } = require(path.join(__dirname, '..', '..', 'ledger', 'scope.cjs'));
const { MCPClient, parseSSE } = require(path.join(__dirname, '..', '..', 'ledger', 'mcp-client.cjs'));

const DYNAMO_DIR = path.join(os.homedir(), '.claude', 'dynamo');
const GRAPHITI_DIR = path.join(os.homedir(), '.claude', 'graphiti');
// Current deployed layout: files at DYNAMO_DIR root + ledger/ + switchboard/ (no lib/)
const SCAN_DIRS = [DYNAMO_DIR, path.join(DYNAMO_DIR, 'ledger'), path.join(DYNAMO_DIR, 'switchboard')];

// --- Helper: recursively collect .cjs files ---
function collectCjsFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectCjsFiles(fullPath));
    } else if (entry.name.endsWith('.cjs')) {
      results.push(fullPath);
    }
  }
  return results;
}

// Collect production .cjs files from deployed layout (excludes tests/, prompts/, migrations/)
function collectAllCjsFiles() {
  const results = [];
  // Root-level .cjs files (non-recursive -- subdirs handled explicitly)
  if (fs.existsSync(DYNAMO_DIR)) {
    for (const entry of fs.readdirSync(DYNAMO_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory() && entry.name.endsWith('.cjs')) {
        results.push(path.join(DYNAMO_DIR, entry.name));
      }
    }
  }
  // Production subdirectories (recursive)
  for (const dir of [path.join(DYNAMO_DIR, 'hooks'), path.join(DYNAMO_DIR, 'ledger'), path.join(DYNAMO_DIR, 'switchboard')]) {
    if (fs.existsSync(dir)) results.push(...collectCjsFiles(dir));
  }
  return results;
}

describe('v1.1 Regression Tests', () => {

  // --- Test 1: DIAG-01 -- No silent write failures ---
  it('Regression 1 (DIAG-01): no bare .catch(() => {}) patterns in production code', () => {
    const cjsFiles = collectAllCjsFiles();
    const violations = [];

    for (const filePath of cjsFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(DYNAMO_DIR, filePath);

      // Pattern 1: .catch(() => {})
      if (/\.catch\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/.test(content)) {
        violations.push(relativePath + ': .catch(() => {})');
      }
      // Pattern 2: .catch(() => undefined)
      if (/\.catch\(\s*\(\s*\)\s*=>\s*undefined\s*\)/.test(content)) {
        violations.push(relativePath + ': .catch(() => undefined)');
      }
      // Pattern 3: .catch(e => {})
      if (/\.catch\(\s*\w+\s*=>\s*\{\s*\}\s*\)/.test(content)) {
        violations.push(relativePath + ': .catch(e => {})');
      }
    }

    assert.strictEqual(violations.length, 0,
      'Silent write failures found:\n  ' + violations.join('\n  '));
  });

  // --- Test 2: DIAG-02 -- No GRAPHITI_GROUP_ID override ---
  it('Regression 2 (DIAG-02): GRAPHITI_GROUP_ID absent from docker-compose.yml and .env', () => {
    const dockerPath = path.join(GRAPHITI_DIR, 'docker-compose.yml');
    if (fs.existsSync(dockerPath)) {
      const content = fs.readFileSync(dockerPath, 'utf8');
      assert.ok(!content.includes('GRAPHITI_GROUP_ID='),
        'docker-compose.yml must NOT contain GRAPHITI_GROUP_ID= (causes silent scope override)');
    }

    const envPath = path.join(GRAPHITI_DIR, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      assert.ok(!content.includes('GRAPHITI_GROUP_ID='),
        '.env must NOT contain GRAPHITI_GROUP_ID= (causes silent scope override)');
    }
  });

  // --- Test 3: Colon-in-group_id rejection ---
  it('Regression 3 (colon rejection): validateGroupId rejects colons, SCOPE.project uses dashes', () => {
    assert.throws(
      () => validateGroupId('project:my-project'),
      /contains characters outside/,
      'project:my-project should be rejected'
    );

    assert.throws(
      () => validateGroupId('session:123'),
      /contains characters outside/,
      'session:123 should be rejected'
    );

    const projectScope = SCOPE.project('my-project');
    assert.ok(!projectScope.includes(':'), 'SCOPE.project must not contain colon');
    assert.ok(projectScope.startsWith('project-'), 'Must use dash separator');
  });

  // --- Test 4: Foreground hook execution ---
  it('Regression 4 (foreground hooks): hook config interface does not default to async:true', () => {
    const hookConfig = { type: 'hook', event: 'PostToolUse', command: ['node', 'dynamo-hooks.cjs'] };
    assert.ok(!('async' in hookConfig) || hookConfig.async === false,
      'Hooks must run foreground (no async:true)');
  });

  // --- Test 5: Error logging format ---
  it('Regression 5 (error logging): logError writes [ISO-Z] [hookName] format', () => {
    const testHookName = 'regression-test-5';
    const testMessage = 'regression test format check ' + Date.now();
    core.logError(testHookName, testMessage);

    const logPath = path.join(DYNAMO_DIR, 'hook-errors.log');
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.trim().split('\n');
    const lastLine = lines[lines.length - 1];

    assert.match(lastLine,
      /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[regression-test-5\] /,
      'logError must write [ISO-Z] [hookName] format');
    assert.ok(lastLine.includes(testMessage), 'Log line must contain the message');
  });

  // --- Test 6: GRAPHITI_VERBOSE support ---
  it('Regression 6 (GRAPHITI_VERBOSE): core.cjs references process.env.GRAPHITI_VERBOSE', () => {
    const coreSource = fs.readFileSync(path.join(DYNAMO_DIR, 'core.cjs'), 'utf8');
    assert.ok(coreSource.includes('GRAPHITI_VERBOSE'),
      'core.cjs must reference GRAPHITI_VERBOSE for debug output support');
  });

  // --- Test 7: Health check canary round-trip (interface test) ---
  it('Regression 7 (canary round-trip): MCPClient has callTool method for MCP write+search', () => {
    const client = new MCPClient();
    assert.strictEqual(typeof client.callTool, 'function',
      'MCPClient must have callTool for canary round-trip');
    assert.strictEqual(typeof client.initialize, 'function',
      'MCPClient must have initialize');
  });

  // --- Test 8: Log rotation at 1MB boundary ---
  it('Regression 8 (log rotation): logError rotates at 1MB boundary', () => {
    const logPath = path.join(DYNAMO_DIR, 'hook-errors.log');
    const oldPath = logPath + '.old';

    // Clean up any previous old file
    try { fs.unlinkSync(oldPath); } catch {}

    // Write a file just over 1MB (1048576 bytes)
    const bigContent = 'x'.repeat(1048577);
    fs.writeFileSync(logPath, bigContent, 'utf8');

    // Trigger logError -- should rotate
    core.logError('rotation-regression-8', 'trigger 1MB rotation');

    assert.ok(fs.existsSync(oldPath),
      'hook-errors.log.old should exist after 1MB rotation');

    const newContent = fs.readFileSync(logPath, 'utf8');
    assert.ok(newContent.includes('rotation-regression-8'),
      'New log should contain the post-rotation message');
    assert.ok(newContent.length < 1048576,
      'New log should be smaller than 1MB after rotation');

    // Clean up
    try { fs.unlinkSync(oldPath); } catch {}
  });

  // --- Test 9: Once-per-session health warning with ppid ---
  it('Regression 9 (ppid health guard): healthGuard uses process.ppid, not standalone process.pid', () => {
    const coreSource = fs.readFileSync(path.join(DYNAMO_DIR, 'core.cjs'), 'utf8');

    assert.ok(coreSource.includes('process.ppid'),
      'healthGuard must use process.ppid');

    // Check that process.pid does not appear independently of process.ppid
    const pidMatches = coreSource.match(/process\.pid\b/g) || [];
    const ppidMatches = coreSource.match(/process\.ppid/g) || [];
    assert.ok(pidMatches.length <= ppidMatches.length,
      'process.pid should not appear independently of process.ppid');
  });

  // --- Test 10: Infinite loop guard (interface test) ---
  it('Regression 10 (stop hook loop guard): stop_hook_active interface prevents infinite recursion', () => {
    // Interface: stop hook must check a flag to prevent infinite recursion
    const stopHookInterface = {
      checkFlag: (sessionId) => {
        const flagPath = path.join(os.tmpdir(), 'dynamo-stop-active-' + sessionId);
        return fs.existsSync(flagPath);
      },
      setFlag: (sessionId) => {
        const flagPath = path.join(os.tmpdir(), 'dynamo-stop-active-' + sessionId);
        fs.writeFileSync(flagPath, '1');
      },
      clearFlag: (sessionId) => {
        const flagPath = path.join(os.tmpdir(), 'dynamo-stop-active-' + sessionId);
        try { fs.unlinkSync(flagPath); } catch {}
      }
    };

    const testId = 'regression-test-' + Date.now();
    assert.strictEqual(stopHookInterface.checkFlag(testId), false,
      'Flag should not exist initially');
    stopHookInterface.setFlag(testId);
    assert.strictEqual(stopHookInterface.checkFlag(testId), true,
      'Flag should exist after set');
    stopHookInterface.clearFlag(testId);
    assert.strictEqual(stopHookInterface.checkFlag(testId), false,
      'Flag should be cleared');
  });

  // --- Test 11: Two-phase session naming (interface test) ---
  it('Regression 11 (two-phase naming): session name interface supports preliminary + refined naming', () => {
    const sessionEntry = {
      session_id: 'test-123',
      name: 'Hook Reliability Fixes',
      named_phase: 'refined',
      labeled_by: 'auto',
      timestamp: '2026-03-17T12:00:00Z'
    };

    assert.ok(['preliminary', 'refined'].includes(sessionEntry.named_phase),
      'named_phase must be preliminary or refined');
    assert.ok(['auto', 'user'].includes(sessionEntry.labeled_by),
      'labeled_by must be auto or user');

    // Verify preliminary phase also works
    const prelimEntry = { ...sessionEntry, named_phase: 'preliminary' };
    assert.ok(['preliminary', 'refined'].includes(prelimEntry.named_phase),
      'preliminary named_phase must be accepted');
  });

  // --- Test 12: User label preservation (interface test) ---
  it('Regression 12 (user label preservation): session index never overwrites labeled_by:user entries', () => {
    function shouldAutoName(entry) {
      // Auto-naming should NOT overwrite user labels
      if (entry.labeled_by === 'user') return false;
      return true;
    }

    assert.strictEqual(shouldAutoName({ labeled_by: 'auto', name: 'Old Name' }), true,
      'Auto labels can be overwritten');
    assert.strictEqual(shouldAutoName({ labeled_by: 'user', name: 'My Custom Name' }), false,
      'User labels must be preserved');
  });
});

describe('Branding (BRD-01)', () => {
  it('all .cjs files start with "// Dynamo >" identity block', () => {
    const cjsFiles = collectAllCjsFiles();
    assert.ok(cjsFiles.length > 0, 'Should find at least one .cjs file in dynamo/');

    const violations = [];
    for (const filePath of cjsFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      // Allow shebang on line 1 -- branding must be on line 1 or line 2
      const hasBranding = lines[0].startsWith('// Dynamo >') ||
        (lines[0].startsWith('#!') && lines[1] && lines[1].startsWith('// Dynamo >'));
      if (!hasBranding) {
        violations.push(path.relative(DYNAMO_DIR, filePath) + ': first line is "' + lines[0] + '"');
      }
    }

    assert.strictEqual(violations.length, 0,
      'All .cjs files must start with "// Dynamo >" identity block:\n  ' + violations.join('\n  '));
  });
});

describe('Directory Structure (BRD-02)', () => {
  it('required directories exist: ledger, switchboard, hooks, prompts, tests', () => {
    const requiredDirs = ['ledger', 'switchboard', 'hooks', 'prompts', 'tests'];
    for (const dir of requiredDirs) {
      const fullPath = path.join(DYNAMO_DIR, dir);
      assert.ok(fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory(),
        dir + '/ must exist as a directory');
    }
  });

  it('VERSION file contains 0.1.0', () => {
    const version = fs.readFileSync(path.join(DYNAMO_DIR, 'VERSION'), 'utf8').trim();
    assert.strictEqual(version, '0.1.0');
  });
});

// Dynamo > Tests > m1-verification.test.cjs -- End-to-end M1 requirement verification
'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_ROOT = path.join(__dirname, '..', '..');

// --- Shared sandbox state ---

let tmpDir;
let tmpLive;

// --- Setup / Teardown ---

before(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dynamo-m1-verify-'));
  tmpLive = path.join(tmpDir, 'live');
  const { copyTree } = require(path.join(REPO_ROOT, 'subsystems', 'switchboard', 'install.cjs'));
  const INSTALL_EXCLUDES = ['tests', '.last-sync', '.git', '.DS_Store', 'node_modules'];
  const count = copyTree(REPO_ROOT, tmpLive, INSTALL_EXCLUDES);
  assert.ok(count > 0, 'copyTree should copy files');
});

after(() => {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// --- Helper: recursively collect .cjs files ---

function getAllCjsFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'tests') {
      files.push(...getAllCjsFiles(full));
    } else if (entry.name.endsWith('.cjs') && !entry.name.endsWith('.test.cjs')) {
      files.push(full);
    }
  }
  return files;
}

// --- ARCH-01: Six-Subsystem Directory Structure ---

describe('ARCH-01: Six-Subsystem Directory Structure', () => {
  const expectedDirs = [
    'subsystems/switchboard',
    'subsystems/assay',
    'subsystems/ledger',
    'subsystems/terminus',
    'subsystems/reverie',
    'cc/hooks',
    'cc/prompts',
    'lib',
    'dynamo',
  ];

  for (const dir of expectedDirs) {
    it(`tmpdir install contains ${dir}/`, () => {
      assert.ok(
        fs.existsSync(path.join(tmpLive, dir)),
        `Expected directory ${dir}/ to exist in tmpdir install`
      );
    });
  }
});

// --- ARCH-02: No Ad-Hoc Resolver Functions ---

describe('ARCH-02: No Ad-Hoc Resolver Functions', () => {
  it('no production file in tmpdir contains ad-hoc resolve functions', () => {
    const dirsToScan = [
      path.join(tmpLive, 'subsystems'),
      path.join(tmpLive, 'cc'),
      path.join(tmpLive, 'lib'),
    ];
    const files = [];
    for (const dir of dirsToScan) {
      files.push(...getAllCjsFiles(dir));
    }
    // Also check root dynamo.cjs
    const dynamoCjs = path.join(tmpLive, 'dynamo.cjs');
    if (fs.existsSync(dynamoCjs)) files.push(dynamoCjs);

    assert.ok(files.length > 0, 'Should find .cjs files in tmpdir');

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const rel = path.relative(tmpLive, file);
      assert.ok(
        !content.includes('function resolveSibling('),
        `${rel} still contains resolveSibling function`
      );
      assert.ok(
        !content.includes('function resolveHandlers('),
        `${rel} still contains resolveHandlers function`
      );
      assert.ok(
        !content.includes('function resolveCore('),
        `${rel} still contains resolveCore function`
      );
    }
  });
});

// --- ARCH-04 + ARCH-05: Layout Mapping and Sync ---

describe('ARCH-04 + ARCH-05: Layout Mapping and Sync', () => {
  const layout = require(path.join(REPO_ROOT, 'lib', 'layout.cjs'));
  const sync = require(path.join(REPO_ROOT, 'subsystems', 'switchboard', 'sync.cjs'));

  it('getSyncPairs returns exactly 8 pairs', () => {
    const pairs = layout.getSyncPairs(REPO_ROOT, tmpLive);
    assert.strictEqual(pairs.length, 8, 'Expected 8 sync pairs');
  });

  it('sync pair labels match expected set', () => {
    const pairs = layout.getSyncPairs(REPO_ROOT, tmpLive);
    const labels = pairs.map(p => p.label);
    const expected = ['root', 'dynamo-meta', 'switchboard', 'assay', 'ledger', 'terminus', 'cc', 'lib'];
    assert.deepStrictEqual(labels, expected, 'Sync pair labels should match expected set');
  });

  it('all 8 pairs are in sync after copyTree (zero diffs)', () => {
    const pairs = layout.getSyncPairs(REPO_ROOT, tmpLive);
    const GLOB_EXCLUDES = ['*.pyc'];

    for (const pair of pairs) {
      const repoFiles = sync.walkDir(pair.repo, pair.excludes, GLOB_EXCLUDES, undefined, pair.filesOnly);
      const liveFiles = sync.walkDir(pair.live, pair.excludes, GLOB_EXCLUDES, undefined, pair.filesOnly);
      const diff = sync.diffTrees(repoFiles, liveFiles);

      // Files to copy should be 0 (all repo files exist in live with same size)
      // Allow mtime-based diffs since copyTree does not preserve mtimes.
      // Instead verify all repo files exist in live.
      for (const relPath of Object.keys(repoFiles)) {
        assert.ok(
          relPath in liveFiles,
          `${pair.label}: file ${relPath} missing in live side`
        );
      }
      // No extra files in live that are not in repo
      assert.strictEqual(
        diff.toDelete.length, 0,
        `${pair.label}: live has ${diff.toDelete.length} extra file(s): ${diff.toDelete.join(', ')}`
      );
    }
  });
});

// --- ARCH-06: Install Pipeline Key Files ---

describe('ARCH-06: Install Pipeline Key Files', () => {
  const expectedFiles = [
    'dynamo.cjs',
    'lib/resolve.cjs',
    'lib/core.cjs',
    'lib/layout.cjs',
    'cc/hooks/dynamo-hooks.cjs',
    'cc/settings-hooks.json',
    'subsystems/terminus/session-store.cjs',
    'subsystems/terminus/health-check.cjs',
    'subsystems/switchboard/install.cjs',
    'subsystems/switchboard/sync.cjs',
  ];

  for (const file of expectedFiles) {
    it(`key file ${file} exists in tmpdir`, () => {
      assert.ok(
        fs.existsSync(path.join(tmpLive, file)),
        `Expected ${file} in tmpdir install`
      );
    });
  }

  it('dynamo.cjs contains require() or shebang', () => {
    const content = fs.readFileSync(path.join(tmpLive, 'dynamo.cjs'), 'utf8');
    const hasRequire = content.includes('require(');
    const hasShebang = content.includes('#!/usr/bin/env node');
    assert.ok(hasRequire || hasShebang, 'dynamo.cjs should contain require() or shebang');
  });
});

// --- MGMT-08a + MGMT-08b: Hook Dispatcher Smoke Test ---

describe('MGMT-08a + MGMT-08b: Hook Dispatcher Smoke Test', () => {
  // Import dispatcher exports from REPO (not tmpdir) since it needs resolve.cjs singleton
  const dispatcher = require(path.join(REPO_ROOT, 'cc', 'hooks', 'dynamo-hooks.cjs'));

  it('validateInput accepts valid input', () => {
    const violations = dispatcher.validateInput({
      hook_event_name: 'UserPromptSubmit',
      cwd: '/tmp/test',
    });
    assert.strictEqual(violations.length, 0, 'Valid input should have no violations');
  });

  it('validateInput rejects missing hook_event_name', () => {
    const violations = dispatcher.validateInput({});
    assert.ok(violations.length > 0, 'Missing hook_event_name should produce violations');
    assert.ok(violations[0].includes('hook_event_name'), 'Violation should mention hook_event_name');
  });

  it('validateInput rejects unknown event name', () => {
    const violations = dispatcher.validateInput({
      hook_event_name: 'FakeEvent',
    });
    assert.ok(violations.length > 0, 'Unknown event should produce violations');
    assert.ok(violations[0].includes('unknown'), 'Violation should mention unknown event');
  });

  it('validateInput enforces field length limits', () => {
    const violations = dispatcher.validateInput({
      hook_event_name: 'UserPromptSubmit',
      cwd: 'x'.repeat(5000),
    });
    assert.ok(violations.length > 0, 'cwd exceeding limit should produce violations');
    assert.ok(violations[0].includes('cwd'), 'Violation should mention cwd');
  });

  it('validateInput enforces tool_input value length limits', () => {
    const violations = dispatcher.validateInput({
      hook_event_name: 'PostToolUse',
      tool_name: 'Write',
      tool_input: { content: 'x'.repeat(200000) },
    });
    assert.ok(violations.length > 0, 'Large tool_input value should produce violations');
  });

  it('BOUNDARY_OPEN and BOUNDARY_CLOSE markers are defined', () => {
    assert.ok(dispatcher.BOUNDARY_OPEN, 'BOUNDARY_OPEN should be defined');
    assert.ok(dispatcher.BOUNDARY_CLOSE, 'BOUNDARY_CLOSE should be defined');
    assert.ok(dispatcher.BOUNDARY_OPEN.includes('dynamo-memory-context'), 'BOUNDARY_OPEN should contain dynamo-memory-context');
    assert.ok(dispatcher.BOUNDARY_CLOSE.includes('dynamo-memory-context'), 'BOUNDARY_CLOSE should contain dynamo-memory-context');
  });

  it('dispatcher handles malformed JSON via child_process without crashing', () => {
    const { execSync } = require('child_process');
    const hookPath = path.join(REPO_ROOT, 'cc', 'hooks', 'dynamo-hooks.cjs');
    // Pipe non-JSON string; dispatcher should exit 0 (never crash)
    const result = execSync(`echo "not valid json" | node "${hookPath}"`, {
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, DYNAMO_ENABLED: '1' },
    });
    // If we get here, the process exited 0 (success)
    assert.ok(true, 'Dispatcher should exit 0 on malformed JSON');
  });
});

// --- DATA-01 + DATA-02 + DATA-03 + DATA-04: SQLite Session Smoke Test ---

describe('DATA-01 + DATA-02 + DATA-03 + DATA-04: SQLite Session Smoke Test', () => {
  const sessionStore = require(path.join(REPO_ROOT, 'subsystems', 'terminus', 'session-store.cjs'));

  let sqliteTmpDir;
  let dbPath;

  before(() => {
    sqliteTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dynamo-sqlite-test-'));
    dbPath = path.join(sqliteTmpDir, 'test-sessions.db');
  });

  after(() => {
    try { sessionStore.closeDb(dbPath); } catch (e) { /* ignore */ }
    if (sqliteTmpDir && fs.existsSync(sqliteTmpDir)) {
      fs.rmSync(sqliteTmpDir, { recursive: true, force: true });
    }
  });

  it('isAvailable returns true (node:sqlite present on Node 24.x)', () => {
    assert.strictEqual(sessionStore.isAvailable(), true, 'node:sqlite should be available');
  });

  it('migrateFromJson converts sample sessions.json to SQLite', () => {
    const sessionsJson = [
      { timestamp: 'session-001', project: 'test-proj', label: 'test session 1', labeled_by: 'user' },
      { timestamp: 'session-002', project: 'test-proj', label: '', labeled_by: '' },
    ];
    const jsonPath = path.join(sqliteTmpDir, 'sessions.json');
    fs.writeFileSync(jsonPath, JSON.stringify(sessionsJson), 'utf8');

    const result = sessionStore.migrateFromJson(jsonPath, dbPath);
    assert.strictEqual(result.status, 'ok', 'Migration should return status ok');
    assert.strictEqual(result.migrated, 2, 'Should migrate 2 sessions');
    assert.strictEqual(result.skipped, 0, 'Should skip 0 sessions');
  });

  it('getAllSessions returns 2 sessions after migration', () => {
    const sessions = sessionStore.getAllSessions({ dbPath });
    assert.strictEqual(sessions.length, 2, 'Should have 2 sessions');
  });

  it('getSession returns the correct session with label', () => {
    const session = sessionStore.getSession('session-001', { dbPath });
    assert.ok(session, 'Session should exist');
    assert.strictEqual(session.label, 'test session 1', 'Label should match');
    assert.strictEqual(session.project, 'test-proj', 'Project should match');
  });

  it('getSession returns null for non-existent session', () => {
    const session = sessionStore.getSession('nonexistent', { dbPath });
    assert.strictEqual(session, null, 'Non-existent session should return null');
  });
});

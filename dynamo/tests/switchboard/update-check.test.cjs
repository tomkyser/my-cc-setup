// Dynamo > Tests > update-check.test.cjs
'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const os = require('os');

const MOD_PATH = path.join(__dirname, '..', '..', '..', 'subsystems', 'switchboard', 'update-check.cjs');

// All tests use temp directories -- never touch real ~/.claude/
function makeTmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix + '-'));
}

function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('update-check.cjs', () => {

  it('module exists and exports checkUpdate and compareVersions', () => {
    assert.ok(fs.existsSync(MOD_PATH), 'update-check.cjs should exist');
    const mod = require(MOD_PATH);
    assert.ok(typeof mod.checkUpdate === 'function', 'should export checkUpdate');
    assert.ok(typeof mod.compareVersions === 'function', 'should export compareVersions');
  });

  it('has identity comment', () => {
    const content = fs.readFileSync(MOD_PATH, 'utf8');
    assert.ok(content.includes('Dynamo > Switchboard > update-check.cjs'), 'should have identity comment');
  });

});

describe('compareVersions', () => {
  // Lazy-load to avoid crashing if module doesn't exist yet
  let compareVersions;

  beforeEach(() => {
    compareVersions = require(MOD_PATH).compareVersions;
  });

  it('returns 1 when a > b', () => {
    assert.equal(compareVersions('0.2.0', '0.1.0'), 1);
  });

  it('returns -1 when a < b', () => {
    assert.equal(compareVersions('0.1.0', '0.2.0'), -1);
  });

  it('returns 0 when equal', () => {
    assert.equal(compareVersions('0.1.0', '0.1.0'), 0);
  });

  it('compares numerically not lexicographically', () => {
    assert.equal(compareVersions('0.10.0', '0.9.0'), 1);
  });

  it('handles major version differences', () => {
    assert.equal(compareVersions('1.0.0', '0.99.99'), 1);
  });

  it('handles missing patch as zero', () => {
    assert.equal(compareVersions('1.0', '1.0.0'), 0);
  });

});

describe('checkUpdate', () => {
  let checkUpdate;
  let tmpDir;

  beforeEach(() => {
    checkUpdate = require(MOD_PATH).checkUpdate;
    tmpDir = makeTmpDir('uc');
  });

  afterEach(() => {
    rmrf(tmpDir);
  });

  it('reads version from custom versionPath', async () => {
    const versionFile = path.join(tmpDir, 'VERSION');
    fs.writeFileSync(versionFile, '0.5.0\n', 'utf8');

    // Use a port that refuses connection so we don't need a real server
    const result = await checkUpdate({ versionPath: versionFile, apiUrl: 'http://localhost:1/' });
    assert.equal(result.current, '0.5.0', 'should read custom version');
  });

  it('returns update_available false on network error', async () => {
    const result = await checkUpdate({ apiUrl: 'http://localhost:1/' });
    assert.equal(result.update_available, false, 'should not claim update available on network error');
    assert.ok(result.error.includes('Unable to check'), 'should have friendly error message');
  });

  it('returns update_available false on 404 (no releases)', async () => {
    // Use the actual GitHub API which currently returns 404 for this repo's releases
    // Guard with a short timeout to skip gracefully if network is unavailable
    const result = await checkUpdate({
      apiUrl: 'https://api.github.com/repos/tomkyser/dynamo/releases/latest',
      timeout: 5000
    });
    // Either we get a 404 (no releases) or a network error -- both should return update_available: false
    assert.equal(result.update_available, false, 'should not claim update available on 404');
  });

  it('defaults current version to 0.0.0 when VERSION file missing', async () => {
    const result = await checkUpdate({
      versionPath: '/nonexistent/path/VERSION',
      apiUrl: 'http://localhost:1/'
    });
    assert.equal(result.current, '0.0.0', 'should default to 0.0.0 when VERSION missing');
  });

});

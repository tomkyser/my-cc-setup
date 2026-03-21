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

  it('module exists and exports checkUpdate, compareVersions, and normalizeVersion', () => {
    assert.ok(fs.existsSync(MOD_PATH), 'update-check.cjs should exist');
    const mod = require(MOD_PATH);
    assert.ok(typeof mod.checkUpdate === 'function', 'should export checkUpdate');
    assert.ok(typeof mod.compareVersions === 'function', 'should export compareVersions');
    assert.ok(typeof mod.normalizeVersion === 'function', 'should export normalizeVersion');
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

describe('compareVersions - milestone ordering', () => {
  let compareVersions;

  beforeEach(() => {
    compareVersions = require(MOD_PATH).compareVersions;
  });

  it('M1 < M2 for same base version', () => {
    assert.equal(compareVersions('1.3.0-M1', '1.3.0-M2'), -1);
  });

  it('M2 > M1 for same base version', () => {
    assert.equal(compareVersions('1.3.0-M2', '1.3.0-M1'), 1);
  });

  it('equal milestones', () => {
    assert.equal(compareVersions('1.3.0-M2', '1.3.0-M2'), 0);
  });

  it('M3 > M2', () => {
    assert.equal(compareVersions('1.3.0-M3', '1.3.0-M2'), 1);
  });

  it('release > any milestone of same base', () => {
    assert.equal(compareVersions('1.3.0', '1.3.0-M99'), 1);
  });

  it('milestone < release of same base', () => {
    assert.equal(compareVersions('1.3.0-M99', '1.3.0'), -1);
  });

  it('higher base with milestone > lower base release', () => {
    assert.equal(compareVersions('2.0.0-M1', '1.3.0'), 1);
  });

  it('lower base milestone < higher base release', () => {
    assert.equal(compareVersions('1.3.0-M5', '2.0.0'), -1);
  });

  it('milestone of higher base > milestone of lower base', () => {
    assert.equal(compareVersions('2.0.0-M1', '1.3.0-M5'), 1);
  });

  it('standard semver still works with no milestones', () => {
    assert.equal(compareVersions('1.2.0', '1.3.0'), -1);
  });

});

describe('normalizeVersion', () => {
  let normalizeVersion;

  beforeEach(() => {
    normalizeVersion = require(MOD_PATH).normalizeVersion;
  });

  it('strips v prefix and inserts .0 patch', () => {
    assert.equal(normalizeVersion('v1.3-M2'), '1.3.0-M2');
  });

  it('strips v prefix, keeps existing patch', () => {
    assert.equal(normalizeVersion('v1.3.0-M2'), '1.3.0-M2');
  });

  it('strips v prefix, no suffix', () => {
    assert.equal(normalizeVersion('v1.3.0'), '1.3.0');
  });

  it('no v prefix, inserts patch', () => {
    assert.equal(normalizeVersion('1.3-M2'), '1.3.0-M2');
  });

  it('passthrough for already-normalized', () => {
    assert.equal(normalizeVersion('1.3.0-M2'), '1.3.0-M2');
  });

  it('handles major.minor without suffix', () => {
    assert.equal(normalizeVersion('v2.0'), '2.0.0');
  });

  it('handles empty string gracefully', () => {
    assert.equal(normalizeVersion(''), '');
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

  it('reads milestone version from VERSION file correctly', async () => {
    const versionFile = path.join(tmpDir, 'VERSION');
    fs.writeFileSync(versionFile, '1.3.0-M2\n', 'utf8');

    const result = await checkUpdate({ versionPath: versionFile, apiUrl: 'http://localhost:1/' });
    assert.equal(result.current, '1.3.0-M2', 'should read milestone version correctly');
  });

});

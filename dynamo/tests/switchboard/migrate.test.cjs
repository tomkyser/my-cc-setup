// Dynamo > Tests > migrate.test.cjs
'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const os = require('os');

const MOD_PATH = path.join(__dirname, '..', '..', '..', 'subsystems', 'terminus', 'migrate.cjs');

// --- Helpers ---

function makeTmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix + '-'));
}

function writeJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Write a test migration script to the given directory.
 * @param {string} dir - Directory to write the migration file
 * @param {string} from - Source version (e.g. '0.1.0')
 * @param {string} to - Target version (e.g. '0.2.0')
 * @param {object} options - Options: { fail: boolean }
 */
function writeMigration(dir, from, to, options = {}) {
  const filename = `${from}-to-${to}.cjs`;
  const shouldFail = options.fail || false;
  const content = `'use strict';
module.exports = {
  description: 'Test migration ${from} to ${to}',
  async migrate(opts = {}) {
    ${shouldFail ? "throw new Error('Intentional test failure');" : ''}
    const fs = require('fs');
    const marker = require('path').join(opts.configPath ? require('path').dirname(opts.configPath) : '/tmp', '${from}-to-${to}.marker');
    fs.writeFileSync(marker, 'migrated', 'utf8');
    return { transformed: ['marker'] };
  }
};`;
  fs.writeFileSync(path.join(dir, filename), content, 'utf8');
}

// --- Tests ---

describe('migrate.cjs', () => {

  it('module exists and exports discoverMigrations and runMigrations', () => {
    assert.ok(fs.existsSync(MOD_PATH), 'migrate.cjs should exist');
    const mod = require(MOD_PATH);
    assert.ok(typeof mod.discoverMigrations === 'function', 'should export discoverMigrations');
    assert.ok(typeof mod.runMigrations === 'function', 'should export runMigrations');
    assert.ok(typeof mod.compareVersions === 'function', 'should export compareVersions');
  });

  it('has identity comment', () => {
    const content = fs.readFileSync(MOD_PATH, 'utf8');
    assert.ok(content.includes('Dynamo > Switchboard > migrate.cjs'), 'should have identity comment');
  });
});

describe('compareVersions (migrate)', () => {

  it('sorts numerically not lexicographically', () => {
    const { compareVersions } = require(MOD_PATH);
    assert.strictEqual(compareVersions('0.10.0', '0.9.0'), 1, '0.10.0 should be greater than 0.9.0');
    assert.strictEqual(compareVersions('0.9.0', '0.10.0'), -1, '0.9.0 should be less than 0.10.0');
    assert.strictEqual(compareVersions('1.0.0', '1.0.0'), 0, 'equal versions should return 0');
  });
});

describe('discoverMigrations', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = makeTmpDir('dm');
  });

  afterEach(() => {
    rmrf(tmpDir);
  });

  it('finds migrations in version range', () => {
    writeMigration(tmpDir, '0.1.0', '0.2.0');
    writeMigration(tmpDir, '0.2.0', '0.3.0');

    const { discoverMigrations } = require(MOD_PATH);
    const result = discoverMigrations('0.1.0', '0.3.0', tmpDir);

    assert.strictEqual(result.length, 2, 'should find both migrations');
    assert.strictEqual(result[0].from, '0.1.0');
    assert.strictEqual(result[0].to, '0.2.0');
    assert.strictEqual(result[1].from, '0.2.0');
    assert.strictEqual(result[1].to, '0.3.0');
  });

  it('filters out-of-range migrations', () => {
    writeMigration(tmpDir, '0.1.0', '0.2.0');
    writeMigration(tmpDir, '0.2.0', '0.3.0');

    const { discoverMigrations } = require(MOD_PATH);
    const result = discoverMigrations('0.1.0', '0.2.0', tmpDir);

    assert.strictEqual(result.length, 1, 'should find only one migration');
    assert.strictEqual(result[0].to, '0.2.0');
  });

  it('returns empty array for nonexistent directory', () => {
    const { discoverMigrations } = require(MOD_PATH);
    const result = discoverMigrations('0.1.0', '0.2.0', '/nonexistent/dir');

    assert.deepStrictEqual(result, []);
  });

  it('returns empty array for empty directory', () => {
    const { discoverMigrations } = require(MOD_PATH);
    const result = discoverMigrations('0.1.0', '0.2.0', tmpDir);

    assert.deepStrictEqual(result, []);
  });

  it('ignores non-migration files', () => {
    writeMigration(tmpDir, '0.1.0', '0.2.0');
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Migrations', 'utf8');

    const { discoverMigrations } = require(MOD_PATH);
    const result = discoverMigrations('0.1.0', '0.2.0', tmpDir);

    assert.strictEqual(result.length, 1, 'should find only the .cjs migration');
    assert.strictEqual(result[0].from, '0.1.0');
  });

  it('sorts migrations numerically', () => {
    writeMigration(tmpDir, '0.9.0', '0.10.0');
    writeMigration(tmpDir, '0.1.0', '0.2.0');

    const { discoverMigrations } = require(MOD_PATH);
    const result = discoverMigrations('0.1.0', '0.10.0', tmpDir);

    assert.strictEqual(result[0].from, '0.1.0', 'first migration should be 0.1.0 (sorted numerically)');
    assert.strictEqual(result[1].from, '0.9.0', 'second migration should be 0.9.0');
  });
});

describe('runMigrations', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = makeTmpDir('rm');
  });

  afterEach(() => {
    rmrf(tmpDir);
  });

  it('runs migrations in order and returns success', async () => {
    const migrationsDir = path.join(tmpDir, 'migrations');
    fs.mkdirSync(migrationsDir, { recursive: true });
    writeMigration(migrationsDir, '0.1.0', '0.2.0');

    // Create a config file so the migration marker can be placed alongside it
    const configPath = path.join(tmpDir, 'config.json');
    writeJSON(configPath, { version: '0.1.0' });

    const { runMigrations } = require(MOD_PATH);
    const result = await runMigrations('0.1.0', '0.2.0', {
      migrationsDir,
      configPath
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.applied, 1);
  });

  it('returns success with 0 applied when no migrations needed', async () => {
    const migrationsDir = path.join(tmpDir, 'migrations');
    fs.mkdirSync(migrationsDir, { recursive: true });

    const { runMigrations } = require(MOD_PATH);
    const result = await runMigrations('0.1.0', '0.1.0', { migrationsDir });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.applied, 0);
  });

  it('aborts on first failure and returns error', async () => {
    const migrationsDir = path.join(tmpDir, 'migrations');
    fs.mkdirSync(migrationsDir, { recursive: true });

    const configPath = path.join(tmpDir, 'config.json');
    writeJSON(configPath, { version: '0.1.0' });

    // First migration passes, second fails
    writeMigration(migrationsDir, '0.1.0', '0.2.0');
    writeMigration(migrationsDir, '0.2.0', '0.3.0', { fail: true });

    const { runMigrations } = require(MOD_PATH);
    const result = await runMigrations('0.1.0', '0.3.0', {
      migrationsDir,
      configPath
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.failedAt.from, '0.2.0');
    assert.strictEqual(result.failedAt.to, '0.3.0');
    assert.ok(result.error.includes('Intentional test failure'));
  });

  it('passes options to migration scripts', async () => {
    const migrationsDir = path.join(tmpDir, 'migrations');
    fs.mkdirSync(migrationsDir, { recursive: true });

    const configPath = path.join(tmpDir, 'config.json');
    writeJSON(configPath, { version: '0.1.0' });

    writeMigration(migrationsDir, '0.1.0', '0.2.0');

    const { runMigrations } = require(MOD_PATH);
    const result = await runMigrations('0.1.0', '0.2.0', {
      migrationsDir,
      configPath,
      settingsPath: path.join(tmpDir, 'settings.json')
    });

    assert.strictEqual(result.success, true);

    // Verify the migration script received the configPath option by checking the marker file
    // The marker is written to the same directory as configPath
    const markerPath = path.join(tmpDir, '0.1.0-to-0.2.0.marker');
    assert.ok(fs.existsSync(markerPath), 'migration should have written marker file using configPath option');
    assert.strictEqual(fs.readFileSync(markerPath, 'utf8'), 'migrated');
  });
});

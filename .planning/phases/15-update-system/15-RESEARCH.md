# Phase 15: Update System - Research

**Researched:** 2026-03-18
**Domain:** Self-updating CLI system -- version checking, dual-mode upgrade, migration, rollback
**Confidence:** HIGH

## Summary

Phase 15 implements STAB-05: a self-managing update system for Dynamo. The codebase already contains most of the building blocks -- `fetchWithTimeout` for HTTP, `copyTree` for directory snapshots, `mergeSettings` for settings management, `health-check.cjs` for post-update verification, and the CLI router pattern for adding new commands. The primary new work is: (1) a GitHub Releases API client for version checking, (2) a dual-mode upgrade flow (git pull for devs, tarball download for users), (3) a version-keyed migration harness, and (4) a full-snapshot rollback mechanism that evolves the existing legacy-specific rollback.

The zero npm dependency constraint means semver comparison must be hand-rolled (trivial for standard X.Y.Z versions) and tarball extraction must use the system `tar` command via `execSync` (macOS bsdtar is always available). Node.js 24 is the runtime, so `fetch`, `fs.cpSync`, and all modern APIs are available.

**Primary recommendation:** Build three new switchboard modules (`update-check.cjs`, `update.cjs`, `migrate.cjs`) plus a `dynamo/migrations/` directory, evolve the existing `rollback` command in `install.cjs`, and wire everything through the CLI router with `check-update`, `update`, and `rollback` commands.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Check latest version via **GitHub Releases API** (no auth needed for public repo)
- Manual only: `dynamo check-update` command -- no automatic background checks
- Output: inline status -- current vs latest version + one-line summary
- Graceful fail when offline/rate-limited: print "Unable to check for updates (network unavailable)" and exit 0
- Standard `--format json` flag for structured output
- Two modes, auto-detected: **Dev mode** (git pull + install) and **User mode** (tarball download + install)
- Auto-detection: check if script's directory is inside a git repo with known remote (`tomkyser/dynamo`)
- After pulling new code, automatically run `install.cjs` to deploy -- one command does everything
- **Version-keyed migration scripts** in `dynamo/migrations/` (e.g., `0.1.0-to-0.2.0.cjs`)
- Migrations handle both config.json and settings.json (hook registrations)
- **Abort + rollback on failure**: any migration failure aborts entire update
- **Pre-update snapshot**: backup `~/.claude/dynamo/`, `config.json`, and `settings.json` to `~/.claude/dynamo-backup/`
- **One snapshot retained**: single backup, overwritten each update
- **Dual trigger rollback**: automatic on failure, manual via `dynamo rollback`
- **Post-update health check**: reuse existing 6-stage health check; auto-rollback on failure

### Claude's Discretion
- Exact GitHub API URL construction and response parsing
- Tarball extraction implementation details (Node built-in tar handling vs exec)
- Migration script internal structure and execution harness
- Backup directory cleanup and edge cases
- Error message formatting and verbosity levels
- How to handle version comparison (semver parsing approach)
- Test structure and isolation patterns for update/rollback flows

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STAB-05 | Update/upgrade system -- version checks, migration, rollback | Full coverage: GitHub API for version checks, dual-mode upgrade flow, version-keyed migrations, snapshot-based rollback with auto-trigger on failure |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fetch` | Node 24.13.1 | GitHub API calls, tarball download | Already used via `fetchWithTimeout` in core.cjs; zero dependency |
| Node.js `fs` | Node 24.13.1 | File operations, snapshot backup | Already used everywhere in codebase |
| Node.js `child_process` | Node 24.13.1 | `execSync` for git operations and tar extraction | Already used in install.cjs, stages.cjs, core.cjs |
| System `tar` (bsdtar 3.5.3) | macOS built-in | Tarball extraction with `--strip-components=1` | Available on all macOS systems; avoids npm tar dependency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dynamo/core.cjs` | existing | `fetchWithTimeout`, `safeReadFile`, `output`, `error`, `loadConfig` | All new modules import shared substrate |
| `switchboard/install.cjs` | existing | `copyTree`, `mergeSettings`, `run()` (full install pipeline) | Called by update after code pull |
| `switchboard/health-check.cjs` | existing | `run([], false, true)` returns result object | Post-update verification |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| System `tar` via execSync | Node.js streams + zlib.createGunzip() | Pure JS but complex; system tar is simpler and always available on macOS |
| Hand-rolled semver compare | npm `semver` package | npm package more robust but violates zero-dependency constraint |
| GitHub Releases API | GitHub Tags API | Tags API is simpler but doesn't provide release notes or tarball URLs |

**No installation needed** -- all dependencies are Node.js built-ins and existing codebase modules.

## Architecture Patterns

### Recommended Project Structure
```
switchboard/
  install.cjs          # EXISTING -- evolve rollback(), add createSnapshot(), restoreSnapshot()
  update-check.cjs     # NEW -- GitHub API version check
  update.cjs           # NEW -- Orchestrates: check -> snapshot -> pull/download -> migrate -> install -> verify -> rollback-on-fail
  migrate.cjs          # NEW -- Migration harness: discover, sort, execute migration scripts

dynamo/
  dynamo.cjs           # EXISTING -- add check-update, update cases to router
  VERSION              # EXISTING -- source of truth for current version
  migrations/          # NEW directory
    README.md          # Convention documentation for writing migrations
    0.1.0-to-0.2.0.cjs # EXAMPLE -- first migration (created when needed, not in this phase)
```

### Pattern 1: Update Check Module (update-check.cjs)
**What:** Queries GitHub Releases API, compares version with local VERSION file
**When to use:** `dynamo check-update` command
**Example:**
```javascript
// Source: GitHub REST API docs + existing core.cjs patterns
'use strict';
const { fetchWithTimeout, safeReadFile, output, error } = require(resolveCore());

const GITHUB_API = 'https://api.github.com/repos/tomkyser/dynamo/releases/latest';
const VERSION_PATH = path.join(__dirname, '..', 'VERSION');

async function checkUpdate(options = {}) {
  const currentVersion = (safeReadFile(options.versionPath || VERSION_PATH) || '0.0.0').trim();

  let release;
  try {
    const resp = await fetchWithTimeout(GITHUB_API, {
      headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'dynamo-updater' }
    }, options.timeout || 5000);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    release = await resp.json();
  } catch (e) {
    return { current: currentVersion, latest: null, update_available: false,
             error: 'Unable to check for updates (network unavailable)' };
  }

  const latestVersion = (release.tag_name || '').replace(/^v/, '');
  const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;

  return {
    current: currentVersion,
    latest: latestVersion,
    update_available: updateAvailable,
    release_name: release.name || null,
    tarball_url: release.tarball_url || null
  };
}
```

### Pattern 2: Semver Comparison (hand-rolled, no deps)
**What:** Compare two X.Y.Z version strings
**When to use:** Determining if an update is available, ordering migration scripts
**Example:**
```javascript
// Pure JS semver comparison -- handles X.Y.Z format used by Dynamo
function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}
```

### Pattern 3: Dev Mode Detection
**What:** Detect whether running from a git repo clone with the known remote
**When to use:** Auto-selecting between git pull and tarball download
**Example:**
```javascript
function isDevMode(options = {}) {
  const scriptDir = options.scriptDir || __dirname;
  try {
    const remote = execSync('git config --get remote.origin.url', {
      cwd: scriptDir, timeout: 3000, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return remote.includes('tomkyser/dynamo');
  } catch (e) {
    return false;
  }
}
```

### Pattern 4: Migration Harness
**What:** Discover and execute version-keyed migration scripts in sequence
**When to use:** During update, between code pull and install
**Example:**
```javascript
function discoverMigrations(fromVersion, toVersion, migrationsDir) {
  // List files matching X.Y.Z-to-X.Y.Z.cjs pattern
  // Filter to only those in range (from < migration.from && migration.to <= to)
  // Sort by source version ascending
  // Return ordered list of { from, to, path }
}

async function runMigrations(fromVersion, toVersion, options = {}) {
  const migrations = discoverMigrations(fromVersion, toVersion, options.migrationsDir);
  for (const migration of migrations) {
    try {
      const mod = require(migration.path);
      await mod.migrate(options);  // Each migration exports migrate(options)
    } catch (e) {
      return { success: false, failedAt: migration, error: e.message };
    }
  }
  return { success: true, applied: migrations.length };
}
```

### Pattern 5: Snapshot Backup and Restore
**What:** Full directory snapshot of `~/.claude/dynamo/` plus config/settings files
**When to use:** Before any update begins, restored on failure
**Example:**
```javascript
const BACKUP_DIR = path.join(os.homedir(), '.claude', 'dynamo-backup');

function createSnapshot(options = {}) {
  const liveDir = options.liveDir || LIVE_DIR;
  const backupDir = options.backupDir || BACKUP_DIR;

  // Remove old backup
  if (fs.existsSync(backupDir)) fs.rmSync(backupDir, { recursive: true, force: true });

  // Copy entire live dir
  copyTree(liveDir, backupDir, []);

  // Also backup settings.json
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    fs.copyFileSync(settingsPath, path.join(backupDir, 'settings.json.snapshot'));
  }

  return { backed_up: true, backup_dir: backupDir };
}

function restoreSnapshot(options = {}) {
  const liveDir = options.liveDir || LIVE_DIR;
  const backupDir = options.backupDir || BACKUP_DIR;

  if (!fs.existsSync(backupDir)) {
    return { restored: false, error: 'No backup found' };
  }

  // Remove current live dir and restore from backup
  if (fs.existsSync(liveDir)) fs.rmSync(liveDir, { recursive: true, force: true });
  copyTree(backupDir, liveDir, ['settings.json.snapshot']);

  // Restore settings.json
  const snapshotSettings = path.join(backupDir, 'settings.json.snapshot');
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  if (fs.existsSync(snapshotSettings)) {
    fs.copyFileSync(snapshotSettings, settingsPath);
  }

  return { restored: true };
}
```

### Pattern 6: Update Orchestrator
**What:** Single command that chains: check -> snapshot -> pull/download -> migrate -> install -> verify
**When to use:** `dynamo update` command
**Example:**
```javascript
async function update(args = [], pretty = false) {
  const steps = [];

  // 1. Check for update
  const check = await checkUpdate();
  if (!check.update_available) {
    // Already up to date
    return output({ command: 'update', status: 'up-to-date', version: check.current });
  }

  // 2. Create snapshot
  createSnapshot();
  steps.push({ name: 'Snapshot', status: 'OK' });

  try {
    // 3. Pull code (dev mode) or download tarball (user mode)
    if (isDevMode()) {
      execSync('git pull origin master', { cwd: repoRoot, ... });
    } else {
      // Download tarball to tmp, extract
      await downloadAndExtract(check.tarball_url, tmpDir);
    }
    steps.push({ name: 'Pull code', status: 'OK' });

    // 4. Run migrations
    const migrationResult = await runMigrations(check.current, check.latest);
    if (!migrationResult.success) throw new Error('Migration failed: ' + migrationResult.error);
    steps.push({ name: 'Migrations', status: 'OK', detail: migrationResult.applied + ' applied' });

    // 5. Run install
    await install.run([], false);
    steps.push({ name: 'Install', status: 'OK' });

    // 6. Health check
    const hc = await healthCheck.run([], false, true);
    if (!hc.summary.ok) throw new Error('Health check failed after update');
    steps.push({ name: 'Health check', status: 'OK' });

  } catch (e) {
    // Auto-rollback on any failure
    restoreSnapshot();
    steps.push({ name: 'Rollback', status: 'OK', detail: 'Restored previous version' });
    return output({ command: 'update', status: 'rolled-back', error: e.message, steps });
  }

  return output({ command: 'update', status: 'updated',
                   from: check.current, to: check.latest, steps });
}
```

### Anti-Patterns to Avoid
- **Partial migration state:** Never leave config.json or settings.json in a half-migrated state. Migrations must be all-or-nothing with snapshot rollback as the safety net.
- **Version comparison via string sort:** `'0.9.0' > '0.10.0'` is true in string comparison. Always parse to numeric components.
- **Direct `process.exit()` in update modules:** The update orchestrator needs to catch errors and rollback. Use throw/return, not process.exit. Only the CLI router calls `output()` which exits.
- **Modifying VERSION before install completes:** The VERSION file should only reflect the new version after a successful install. During update, read the new version from the pulled/downloaded source, not from the deployed VERSION file.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Directory snapshots | Custom recursive copy | Reuse existing `copyTree()` from install.cjs | Already proven, handles excludes, edge cases |
| Settings.json merge | Custom JSON merge | Reuse existing `mergeSettings()` from install.cjs | Handles hook deduplication, permissions, atomic writes |
| Full deploy pipeline | Custom file-by-file deploy | Call `install.cjs run()` after code pull | 6-step pipeline already handles copy, config gen, settings merge, health check |
| Health verification | Custom post-update checks | Reuse `health-check.cjs run([], false, true)` | 6-stage health check already exists with cascading skip logic |
| HTTP with timeout | Custom fetch wrapper | Use `fetchWithTimeout()` from core.cjs | Already handles AbortSignal.timeout |
| Tarball extraction | Node.js stream pipeline with zlib | `execSync('tar xzf ... --strip-components=1')` | macOS bsdtar is always available; simpler, zero deps |

**Key insight:** The update system is primarily an orchestration layer. Nearly every low-level operation it needs already exists in the codebase. The new code is glue that sequences existing capabilities with GitHub API calls and migration logic.

## Common Pitfalls

### Pitfall 1: GitHub API Rate Limiting
**What goes wrong:** Unauthenticated GitHub API requests are limited to 60/hour per IP. Repeated `check-update` calls can exhaust this.
**Why it happens:** No auth token, shared IP in corporate/VPN environments.
**How to avoid:** Graceful degradation already decided -- return friendly message and exit 0. Consider caching the last check result with a TTL (e.g., 1 hour) to avoid redundant API calls.
**Warning signs:** HTTP 403 response with `X-RateLimit-Remaining: 0` header.

### Pitfall 2: Tarball Directory Structure
**What goes wrong:** GitHub tarballs have a top-level directory named `owner-repo-sha/` that wraps all content. Extracting without `--strip-components=1` creates a nested directory.
**Why it happens:** GitHub's tarball generation always includes this prefix directory.
**How to avoid:** Always use `tar xzf file.tar.gz -C destination --strip-components=1` to flatten the top-level directory.
**Warning signs:** After extraction, files are nested one level deeper than expected.

### Pitfall 3: Rollback During Active Claude Session
**What goes wrong:** Rolling back while hooks are actively running in another Claude Code session could cause file-not-found errors or inconsistent state.
**Why it happens:** The deployed `~/.claude/dynamo/` is shared across all Claude threads.
**How to avoid:** The `dynamo update` command should warn the user. Since disruption awareness is a project constraint, print a warning before proceeding. The update itself is fast (seconds), so the window is small.
**Warning signs:** Hook errors in `hook-errors.log` during or immediately after update.

### Pitfall 4: Migration Script Ordering
**What goes wrong:** Migrations applied out of order can produce invalid state (e.g., renaming a config key that a later migration expects under the old name).
**Why it happens:** Filesystem ordering of filenames is not guaranteed to be semver-sorted. `0.9.0-to-0.10.0.cjs` sorts AFTER `0.10.0-to-0.11.0.cjs` alphabetically.
**How to avoid:** Parse migration filenames into version tuples and sort numerically, not alphabetically. Use `compareVersions()` on the source version of each migration.
**Warning signs:** Migration fails with "key not found" when the key was supposed to be created by a prior migration.

### Pitfall 5: No Releases Exist Yet
**What goes wrong:** `GET /repos/tomkyser/dynamo/releases/latest` returns 404 when no releases have been published (confirmed: currently returns 404).
**Why it happens:** The repo has git tags (v1.1, v1.2, v1.2-legacy-archive) but no GitHub Releases.
**How to avoid:** Handle 404 gracefully -- treat it the same as "already up to date" with a message like "No releases published yet." A GitHub Release must be created (manually or via `gh release create`) before the update system can function.
**Warning signs:** 404 from the releases API.

### Pitfall 6: install.cjs run() Calls output() Which Exits
**What goes wrong:** Calling `install.cjs run()` from within the update orchestrator causes `process.exit(0)` before the update flow completes.
**Why it happens:** `output()` in core.cjs always calls `process.exit(0)`.
**How to avoid:** Either (a) refactor `install.run()` to accept a `_returnOnly` flag like `health-check.run()` already does, or (b) create a separate internal install function that returns results without calling output(). The health-check pattern is already established.
**Warning signs:** Update command exits immediately after install step, skipping health check and completion message.

## Code Examples

### GitHub API Response Parsing
```javascript
// Source: GitHub REST API docs (https://docs.github.com/en/rest/releases/releases)
// Response shape for GET /repos/{owner}/{repo}/releases/latest:
// {
//   "tag_name": "v0.2.0",
//   "name": "v0.2.0 - Migration support",
//   "body": "### Changes\n- Added migration harness...",
//   "tarball_url": "https://api.github.com/repos/tomkyser/dynamo/tarball/v0.2.0",
//   "prerelease": false,
//   "draft": false,
//   "published_at": "2026-03-20T12:00:00Z"
// }
// Note: tarball_url redirects (302) to codeload.github.com -- fetch follows redirects by default
```

### Tarball Download and Extract (User Mode)
```javascript
// Download tarball to tmp, extract to staging directory
async function downloadAndExtract(tarballUrl, destDir, options = {}) {
  const tmpFile = path.join(os.tmpdir(), `dynamo-update-${Date.now()}.tar.gz`);

  try {
    // Download with redirect following (fetch handles 302 automatically)
    const resp = await fetchWithTimeout(tarballUrl, {
      headers: { 'Accept': 'application/octet-stream', 'User-Agent': 'dynamo-updater' }
    }, options.timeout || 30000);

    if (!resp.ok) throw new Error(`Download failed: HTTP ${resp.status}`);

    // Write to tmp file
    const buffer = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(tmpFile, buffer);

    // Extract with strip-components to flatten GitHub's owner-repo-sha/ prefix
    fs.mkdirSync(destDir, { recursive: true });
    execSync(`tar xzf "${tmpFile}" -C "${destDir}" --strip-components=1`, {
      timeout: 30000, stdio: ['pipe', 'pipe', 'pipe']
    });

    return { success: true, files: destDir };
  } finally {
    // Cleanup tmp tarball
    try { fs.unlinkSync(tmpFile); } catch (e) { /* no-op */ }
  }
}
```

### Migration Script Template
```javascript
// dynamo/migrations/0.1.0-to-0.2.0.cjs
// Each migration exports: { migrate(options), description }
'use strict';

module.exports = {
  description: 'Add new_config_key to config.json',

  async migrate(options = {}) {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    // Config migration
    const configPath = options.configPath || path.join(os.homedir(), '.claude', 'dynamo', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Transform: add new key with default value
    config.new_section = config.new_section || { key: 'default_value' };

    // Write atomically
    const tmpPath = configPath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
    fs.renameSync(tmpPath, configPath);

    return { transformed: ['config.json'] };
  }
};
```

### Evolving the Existing Rollback Command
```javascript
// The existing rollback in install.cjs handles settings.json.bak + Python restoration.
// The new rollback adds full snapshot restore for update failures.
// Key: detect which type of rollback is needed based on what backup exists.

async function rollback(args = [], pretty = false) {
  const BACKUP_DIR = path.join(os.homedir(), '.claude', 'dynamo-backup');

  if (fs.existsSync(BACKUP_DIR)) {
    // Full snapshot rollback (from update system)
    const result = restoreSnapshot({ backupDir: BACKUP_DIR });
    output({ command: 'rollback', type: 'full-snapshot', ...result });
  } else if (fs.existsSync(SETTINGS_BACKUP)) {
    // Legacy settings-only rollback
    restoreSettings();
    output({ command: 'rollback', type: 'settings-only', status: 'ok' });
  } else {
    output({ command: 'rollback', type: 'none', status: 'no-backup-found' });
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual file replacement | Atomic write (tmp + rename) | Phase 10 (install.cjs) | Safe against partial writes |
| Legacy Python/Bash rollback | Settings.json.bak only | Phase 10 | Limited to settings restoration |
| No version tracking | VERSION file + config.json version | Phase 8 | Foundation for update checking |
| No update mechanism | Manual git pull + reinstall | Current state | Phase 15 automates this |

**Deprecated/outdated:**
- `restorePython()` in install.cjs: Legacy function for moving Python files back from `graphiti-legacy/`. Python system is fully archived. This function still exists but the legacy dir was cleaned in Phase 13.

## Open Questions

1. **When to create the first GitHub Release?**
   - What we know: The repo has tags (v1.1, v1.2) but no GitHub Releases. The update system checks releases, not tags.
   - What's unclear: Should the first release be created as part of this phase, or is that a separate milestone activity?
   - Recommendation: Create a v1.2.1 GitHub Release after this phase ships (as part of milestone closure). The update system should gracefully handle the "no releases yet" case during development.

2. **Should install.cjs be refactored to support _returnOnly?**
   - What we know: `health-check.cjs` already has a `_returnOnly` parameter pattern. `install.cjs run()` calls `output()` which exits the process.
   - What's unclear: Is refactoring install.cjs in scope, or should the update module work around it?
   - Recommendation: Add `_returnOnly` parameter to `install.run()` matching the health-check pattern. This is a small, safe change that follows the established convention.

3. **Tarball download for user mode: what source directory layout does it expect?**
   - What we know: The repo has `dynamo/`, `ledger/`, `switchboard/` as root dirs. `install.cjs` expects `REPO_ROOT` to be the parent of these.
   - What's unclear: The tarball will extract to a tmp dir. The update module needs to either (a) run install.cjs from the extracted dir or (b) copy files from extracted dir to repo layout.
   - Recommendation: Extract tarball to tmp dir, then run install.cjs with the extracted dir as the effective repo root. This may require install.cjs to accept a configurable `REPO_ROOT` option.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node 24.13.1) |
| Config file | none -- uses `node --test` CLI |
| Quick run command | `node --test dynamo/tests/switchboard/install.test.cjs` |
| Full suite command | `node --test dynamo/tests/*.test.cjs dynamo/tests/ledger/*.test.cjs dynamo/tests/switchboard/*.test.cjs` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAB-05a | Version check against GitHub API | unit | `node --test dynamo/tests/switchboard/update-check.test.cjs -x` | No -- Wave 0 |
| STAB-05b | Semver comparison logic | unit | `node --test dynamo/tests/switchboard/update-check.test.cjs -x` | No -- Wave 0 |
| STAB-05c | Dev mode detection (git repo check) | unit | `node --test dynamo/tests/switchboard/update.test.cjs -x` | No -- Wave 0 |
| STAB-05d | Migration discovery and ordering | unit | `node --test dynamo/tests/switchboard/migrate.test.cjs -x` | No -- Wave 0 |
| STAB-05e | Migration execution (config + settings) | unit | `node --test dynamo/tests/switchboard/migrate.test.cjs -x` | No -- Wave 0 |
| STAB-05f | Snapshot create/restore | unit | `node --test dynamo/tests/switchboard/update.test.cjs -x` | No -- Wave 0 |
| STAB-05g | Update orchestration (check -> snapshot -> pull -> migrate -> install -> verify) | integration | `node --test dynamo/tests/switchboard/update.test.cjs -x` | No -- Wave 0 |
| STAB-05h | Auto-rollback on failure | unit | `node --test dynamo/tests/switchboard/update.test.cjs -x` | No -- Wave 0 |
| STAB-05i | CLI router integration (check-update, update, rollback commands) | unit | `node --test dynamo/tests/router.test.cjs -x` | Partial (router.test.cjs exists but no update commands) |
| STAB-05j | Graceful offline handling | unit | `node --test dynamo/tests/switchboard/update-check.test.cjs -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test dynamo/tests/switchboard/update-check.test.cjs dynamo/tests/switchboard/update.test.cjs dynamo/tests/switchboard/migrate.test.cjs`
- **Per wave merge:** `node --test dynamo/tests/*.test.cjs dynamo/tests/ledger/*.test.cjs dynamo/tests/switchboard/*.test.cjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `dynamo/tests/switchboard/update-check.test.cjs` -- covers STAB-05a, STAB-05b, STAB-05j
- [ ] `dynamo/tests/switchboard/update.test.cjs` -- covers STAB-05c, STAB-05f, STAB-05g, STAB-05h
- [ ] `dynamo/tests/switchboard/migrate.test.cjs` -- covers STAB-05d, STAB-05e
- [ ] `dynamo/tests/router.test.cjs` -- extend with check-update, update, rollback command tests (STAB-05i)

### Test Isolation Strategy
All tests must use the options-based injection pattern:
- `options.versionPath` for VERSION file location (use tmpdir)
- `options.apiUrl` for GitHub API endpoint (use mock or skip network)
- `options.liveDir` for deployed directory (use tmpdir)
- `options.backupDir` for backup directory (use tmpdir)
- `options.migrationsDir` for migration scripts directory (use tmpdir with test fixtures)
- `options.configPath` for config.json location (use tmpdir)
- `options.settingsPath` for settings.json location (use tmpdir)
- `options.repoRoot` for repo root override (use tmpdir with test fixtures)

Never touch real `~/.claude/` in tests. Never make real GitHub API calls in unit tests.

## Sources

### Primary (HIGH confidence)
- [GitHub REST API - Releases](https://docs.github.com/en/rest/releases/releases) -- Endpoint format, response schema, latest release behavior
- Existing codebase: `switchboard/install.cjs`, `dynamo/core.cjs`, `switchboard/health-check.cjs` -- Reusable functions and patterns
- Existing codebase: `dynamo/dynamo.cjs` -- CLI router pattern, command registration
- GitHub API live test: `curl https://api.github.com/repos/tomkyser/dynamo/releases/latest` -- confirmed 404 (no releases yet)

### Secondary (MEDIUM confidence)
- [GitHub API Rate Limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) -- 60 req/hour unauthenticated
- [GitHub tarball download patterns](https://www.baeldung.com/linux/github-download-tarball) -- tarball URL redirect to codeload.github.com, strip-components usage

### Tertiary (LOW confidence)
- None -- all findings verified against official docs or live codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools are Node.js built-ins or existing codebase modules; zero new dependencies
- Architecture: HIGH -- patterns derived from existing codebase conventions (router, options injection, output pattern)
- Pitfalls: HIGH -- verified against live API behavior (404 confirmed), codebase analysis (output/exit pattern confirmed), and documented GitHub API limits

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable -- all dependencies are built-in or existing codebase)

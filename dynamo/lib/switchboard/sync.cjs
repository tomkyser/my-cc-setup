// Dynamo > Switchboard > sync.cjs
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { DYNAMO_DIR, output, error } = require(path.join(__dirname, '..', 'core.cjs'));

// --- Constants ---

const REPO_DIR = path.join(__dirname, '..', '..');  // dynamo/ in repo
const LIVE_DIR = path.join(os.homedir(), '.claude', 'dynamo');
const SYNC_STAMP = path.join(REPO_DIR, '.last-sync');

const SYNC_EXCLUDES = [
  '.env', '.env.example', '.venv', '__pycache__', 'sessions.json',
  'hook-errors.log', '.DS_Store', '.last-sync', 'node_modules',
  'config.json', 'tests'   // tests stay in repo only
];

const GLOB_EXCLUDES = ['*.pyc'];  // pattern-based excludes

// --- Helpers ---

/**
 * Recursively walk a directory tree, returning { relativePath: { mtime, size } }.
 * Skips entries matching name-based excludes and glob-pattern excludes.
 */
function walkDir(dir, excludes, globExcludes, base) {
  base = base || dir;
  const files = {};

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return files;
  }

  for (const entry of entries) {
    const name = entry.name;

    // Skip name-based excludes
    if (excludes.indexOf(name) !== -1) continue;

    // Skip glob-pattern excludes (e.g., '*.pyc' -> endsWith('.pyc'))
    let globMatch = false;
    for (const pattern of globExcludes) {
      if (pattern.startsWith('*.')) {
        const ext = pattern.slice(1);  // '.pyc'
        if (name.endsWith(ext)) {
          globMatch = true;
          break;
        }
      }
    }
    if (globMatch) continue;

    const fullPath = path.join(dir, name);

    if (entry.isDirectory()) {
      const subFiles = walkDir(fullPath, excludes, globExcludes, base);
      Object.assign(files, subFiles);
    } else if (entry.isFile()) {
      const stat = fs.statSync(fullPath);
      const relPath = path.relative(base, fullPath);
      files[relPath] = { mtime: stat.mtimeMs, size: stat.size };
    }
  }

  return files;
}

/**
 * Compare source and destination file trees.
 * Returns { toCopy: [], toDelete: [] }.
 * toCopy: files in src missing from dst, or with different size/newer mtime.
 * toDelete: files in dst not present in src.
 */
function diffTrees(srcFiles, dstFiles) {
  const toCopy = [];
  const toDelete = [];

  // Files to copy: in src but missing/different in dst
  for (const relPath of Object.keys(srcFiles)) {
    if (!(relPath in dstFiles)) {
      toCopy.push(relPath);
    } else {
      const src = srcFiles[relPath];
      const dst = dstFiles[relPath];
      if (src.size !== dst.size || src.mtime > dst.mtime) {
        toCopy.push(relPath);
      }
    }
  }

  // Files to delete: in dst but not in src
  for (const relPath of Object.keys(dstFiles)) {
    if (!(relPath in srcFiles)) {
      toDelete.push(relPath);
    }
  }

  return { toCopy, toDelete };
}

/**
 * Detect conflicts: files that exist in both directories with different content.
 * Uses byte-by-byte comparison via Buffer.compare.
 * Returns list of conflicting relative paths.
 */
function detectConflicts(srcDir, dstDir, srcFiles, dstFiles) {
  const conflicts = [];

  for (const relPath of Object.keys(srcFiles)) {
    if (!(relPath in dstFiles)) continue;

    const srcEntry = srcFiles[relPath];
    const dstEntry = dstFiles[relPath];

    // Same size: compare content byte-by-byte
    if (srcEntry.size === dstEntry.size) {
      try {
        const srcBuf = fs.readFileSync(path.join(srcDir, relPath));
        const dstBuf = fs.readFileSync(path.join(dstDir, relPath));
        if (Buffer.compare(srcBuf, dstBuf) !== 0) {
          conflicts.push(relPath);
        }
      } catch (e) {
        // If we can't read, treat as conflict
        conflicts.push(relPath);
      }
    } else {
      // Different size = definitely different content = conflict
      conflicts.push(relPath);
    }
  }

  return conflicts;
}

/**
 * Copy files from srcDir to dstDir, creating parent directories as needed.
 */
function copyFiles(srcDir, dstDir, relativePaths) {
  for (const relPath of relativePaths) {
    const srcPath = path.join(srcDir, relPath);
    const dstPath = path.join(dstDir, relPath);
    fs.mkdirSync(path.dirname(dstPath), { recursive: true });
    fs.copyFileSync(srcPath, dstPath);
  }
}

/**
 * Delete files from dstDir by relative path. Silently skips non-existent files.
 */
function deleteFiles(dstDir, relativePaths) {
  for (const relPath of relativePaths) {
    const fullPath = path.join(dstDir, relPath);
    try {
      fs.unlinkSync(fullPath);
    } catch (e) {
      // File already gone -- no-op
    }
  }
}

/**
 * Read last sync timestamp from .last-sync file.
 */
function readLastSync() {
  try {
    return fs.readFileSync(SYNC_STAMP, 'utf8').trim();
  } catch (e) {
    return null;
  }
}

/**
 * Write current timestamp to .last-sync file.
 */
function writeLastSync() {
  fs.writeFileSync(SYNC_STAMP, new Date().toISOString() + '\n', 'utf8');
}

// --- Main command ---

async function run(args, pretty) {
  args = args || [];
  pretty = pretty || false;

  // Parse direction and flags
  let direction = null;
  let dryRun = false;
  let force = false;

  for (const arg of args) {
    if (arg === '--dry-run') { dryRun = true; }
    else if (arg === '--force') { force = true; }
    else if (arg === '--pretty') { pretty = true; }
    else if (!direction) { direction = arg; }
  }

  const validDirections = ['live-to-repo', 'repo-to-live', 'status'];
  if (!direction || validDirections.indexOf(direction) === -1) {
    error('Usage: dynamo sync <live-to-repo|repo-to-live|status> [--dry-run] [--force]');
    return;
  }

  // Walk both trees
  const repoFiles = walkDir(REPO_DIR, SYNC_EXCLUDES, GLOB_EXCLUDES);
  const liveFiles = walkDir(LIVE_DIR, SYNC_EXCLUDES, GLOB_EXCLUDES);

  // --- Status ---
  if (direction === 'status') {
    const repoToLive = diffTrees(repoFiles, liveFiles);
    const liveToRepo = diffTrees(liveFiles, repoFiles);
    const result = {
      command: 'sync',
      subcommand: 'status',
      repo_to_live: repoToLive,
      live_to_repo: liveToRepo,
      last_sync: readLastSync()
    };

    if (pretty) {
      const rtl = repoToLive.toCopy.length + repoToLive.toDelete.length;
      const ltr = liveToRepo.toCopy.length + liveToRepo.toDelete.length;
      process.stderr.write('Sync Status\n');
      process.stderr.write('  Repo: ' + REPO_DIR + '\n');
      process.stderr.write('  Live: ' + LIVE_DIR + '\n');
      process.stderr.write('  Last sync: ' + (result.last_sync || 'never') + '\n');
      process.stderr.write('  repo -> live: ' + rtl + ' changes\n');
      process.stderr.write('  live -> repo: ' + ltr + ' changes\n');
    }

    output(result);
    return;
  }

  // --- Sync (live-to-repo or repo-to-live) ---
  let srcDir, dstDir, srcFileMap, dstFileMap;
  if (direction === 'live-to-repo') {
    srcDir = LIVE_DIR;  dstDir = REPO_DIR;
    srcFileMap = liveFiles;  dstFileMap = repoFiles;
  } else {
    srcDir = REPO_DIR;  dstDir = LIVE_DIR;
    srcFileMap = repoFiles;  dstFileMap = liveFiles;
  }

  const diff = diffTrees(srcFileMap, dstFileMap);

  // Conflict detection (unless --force or --dry-run)
  let conflicts = [];
  if (!force && !dryRun) {
    conflicts = detectConflicts(srcDir, dstDir, srcFileMap, dstFileMap);
    if (conflicts.length > 0) {
      const result = {
        command: 'sync',
        subcommand: direction,
        status: 'conflict',
        conflicts: conflicts,
        message: 'Both sides have changes. Use --force to override or --dry-run to preview.'
      };

      if (pretty) {
        process.stderr.write('CONFLICT: Both sides have changes.\n');
        for (const c of conflicts) {
          process.stderr.write('  ' + c + '\n');
        }
        process.stderr.write('Use --force to override.\n');
      }

      output(result);
      return;
    }
  }

  // Dry run
  if (dryRun) {
    const result = {
      command: 'sync',
      subcommand: direction,
      direction: direction,
      dry_run: true,
      files_to_copy: diff.toCopy,
      files_to_delete: diff.toDelete,
      files_copied: 0,
      files_deleted: 0,
      conflicts: []
    };

    if (pretty) {
      process.stderr.write('DRY RUN: ' + direction + '\n');
      if (diff.toCopy.length) {
        process.stderr.write('  Would copy:\n');
        for (const f of diff.toCopy) process.stderr.write('    + ' + f + '\n');
      }
      if (diff.toDelete.length) {
        process.stderr.write('  Would delete:\n');
        for (const f of diff.toDelete) process.stderr.write('    - ' + f + '\n');
      }
      if (!diff.toCopy.length && !diff.toDelete.length) {
        process.stderr.write('  (no changes)\n');
      }
    }

    output(result);
    return;
  }

  // Execute sync
  copyFiles(srcDir, dstDir, diff.toCopy);
  deleteFiles(dstDir, diff.toDelete);
  writeLastSync();

  const result = {
    command: 'sync',
    subcommand: direction,
    direction: direction,
    dry_run: false,
    files_copied: diff.toCopy.length,
    files_deleted: diff.toDelete.length,
    conflicts: []
  };

  if (pretty) {
    process.stderr.write('Sync complete: ' + direction + '\n');
    process.stderr.write('  Copied: ' + diff.toCopy.length + ' files\n');
    process.stderr.write('  Deleted: ' + diff.toDelete.length + ' files\n');
  }

  output(result);
}

module.exports = { run, walkDir, diffTrees, detectConflicts, copyFiles, deleteFiles };

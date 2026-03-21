// Dynamo > Switchboard > update-check.cjs
'use strict';

const path = require('path');
const fs = require('fs');

const resolve = require('../../lib/resolve.cjs');
const { fetchWithTimeout, safeReadFile } = require(resolve('lib', 'core.cjs'));

const GITHUB_API = 'https://api.github.com/repos/tomkyser/dynamo/releases/latest';
const VERSION_PATH = path.join(__dirname, '..', '..', 'dynamo', 'VERSION');

/**
 * Normalize a version string to X.Y.Z[-M{N}] format.
 * Strips leading 'v', inserts .0 patch if only major.minor given.
 *
 * Examples:
 *   'v1.3-M2'   -> '1.3.0-M2'
 *   'v1.3.0-M2' -> '1.3.0-M2'
 *   'v1.3.0'    -> '1.3.0'
 *   '1.3-M2'    -> '1.3.0-M2'
 *   '1.3.0'     -> '1.3.0'
 *
 * @param {string} tag - Version string, possibly with v prefix and/or milestone suffix
 * @returns {string} Normalized version string
 */
function normalizeVersion(tag) {
  if (!tag) return '';
  const m = tag.match(/^v?(\d+)\.(\d+)(?:\.(\d+))?(-M\d+)?$/);
  if (!m) return tag;
  const major = m[1];
  const minor = m[2];
  const patch = m[3] !== undefined ? m[3] : '0';
  const suffix = m[4] || '';
  return `${major}.${minor}.${patch}${suffix}`;
}

/**
 * Parse a version string into its base segments and optional milestone number.
 * @param {string} v - Version string (e.g. '1.3.0-M2')
 * @returns {{ base: number[], milestone: number|null }}
 */
function parseVersion(v) {
  const parts = v.split('-M');
  const base = parts[0].split('.').map(Number);
  const milestone = parts.length > 1 ? parseInt(parts[1], 10) : null;
  return { base, milestone };
}

/**
 * Compare two semver version strings with optional -M{N} milestone suffixes.
 * Returns 1 if a > b, -1 if a < b, 0 if equal.
 * Compares base version numerically first, then applies milestone logic:
 *   - Release (no suffix) > milestone of same base version
 *   - M1 < M2 < M3 ... for same base version
 *
 * @param {string} a - First version string
 * @param {string} b - Second version string
 * @returns {number} 1, -1, or 0
 */
function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);

  // Compare base version segments (X.Y.Z)
  for (let i = 0; i < 3; i++) {
    const va = pa.base[i] || 0;
    const vb = pb.base[i] || 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }

  // Base versions are equal -- apply milestone logic
  if (pa.milestone === null && pb.milestone === null) return 0;
  if (pa.milestone === null && pb.milestone !== null) return 1;  // release > milestone
  if (pa.milestone !== null && pb.milestone === null) return -1;  // milestone < release

  // Both have milestones -- compare numerically
  if (pa.milestone > pb.milestone) return 1;
  if (pa.milestone < pb.milestone) return -1;
  return 0;
}

/**
 * Read changelog entries between two versions.
 * Extracts entries from CHANGELOG.md between latestVersion (inclusive) and currentVersion (exclusive).
 *
 * @param {string} currentVersion - Current installed version
 * @param {string} latestVersion - Latest available version
 * @param {object} [options={}] - Options
 * @param {string} [options.changelogPath] - Override path to CHANGELOG.md
 * @returns {string} Extracted changelog text, or empty string if not found
 */
function readChangelog(currentVersion, latestVersion, options = {}) {
  const changelogPath = options.changelogPath || path.join(__dirname, '..', '..', 'CHANGELOG.md');
  try {
    const content = fs.readFileSync(changelogPath, 'utf8');
    const sections = content.split(/^## /m);
    const relevant = [];
    let collecting = false;
    for (const section of sections) {
      const versionMatch = section.match(/^\[([^\]]+)\]/);
      if (!versionMatch) continue;
      const ver = versionMatch[1];
      if (ver === 'Unreleased') continue;
      if (compareVersions(ver, currentVersion) <= 0) break;
      if (compareVersions(ver, latestVersion) <= 0) collecting = true;
      if (collecting) relevant.push('## ' + section);
    }
    return relevant.join('\n').trim();
  } catch (e) {
    return '';
  }
}

/**
 * Check for available updates by querying GitHub Releases API.
 *
 * @param {object} [options={}] - Options for test isolation
 * @param {string} [options.versionPath] - Override path to VERSION file
 * @param {string} [options.apiUrl] - Override GitHub API URL
 * @param {number} [options.timeout] - Override fetch timeout in ms
 * @returns {Promise<object>} Result with current, latest, update_available, and optional error
 */
async function checkUpdate(options = {}) {
  const currentVersion = (safeReadFile(options.versionPath || VERSION_PATH) || '0.0.0').trim();

  let release;
  try {
    const resp = await fetchWithTimeout(
      options.apiUrl || GITHUB_API,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'dynamo-updater'
        }
      },
      options.timeout || 5000
    );

    if (resp.status === 404) {
      return {
        current: currentVersion,
        latest: null,
        update_available: false,
        error: 'No releases published yet.'
      };
    }

    if (!resp.ok) {
      throw new Error('HTTP ' + resp.status);
    }

    release = await resp.json();
  } catch (e) {
    return {
      current: currentVersion,
      latest: null,
      update_available: false,
      error: 'Unable to check for updates (network unavailable)'
    };
  }

  const latestVersion = normalizeVersion(release.tag_name || '');
  const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;

  const result = {
    current: currentVersion,
    latest: latestVersion,
    update_available: updateAvailable,
    release_name: release.name || null,
    tarball_url: release.tarball_url || null
  };

  if (updateAvailable) {
    result.changelog = readChangelog(currentVersion, latestVersion, options);
  }

  return result;
}

module.exports = { checkUpdate, compareVersions, readChangelog, normalizeVersion };

// Dynamo > Lib > resolve.cjs
'use strict';

const path = require('path');
const fs = require('fs');

let _paths = null;

/**
 * Build the subsystem path map.
 * Repo and deployed layouts are identical (six-subsystem structure).
 * @returns {Object<string, string>} Map of subsystem name -> directory path
 */
function getPaths() {
  if (_paths) return _paths;
  const root = path.join(__dirname, '..');
  _paths = require('./layout.cjs').getLayoutPaths(root);
  return _paths;
}

/**
 * Resolve a module path by logical subsystem name.
 * @param {string} subsystem - Logical name ('dynamo', 'ledger', 'switchboard', etc.)
 * @param {string} file - File name or relative path within the subsystem
 * @returns {string} Absolute file path
 * @throws {Error} If subsystem unknown or file not found
 */
function resolve(subsystem, file) {
  const paths = getPaths();
  const dir = paths[subsystem];
  if (!dir) {
    throw new Error(
      `resolve('${subsystem}', '${file}'): unknown subsystem '${subsystem}'. ` +
      `Known: ${Object.keys(paths).join(', ')}`
    );
  }
  const fullPath = path.join(dir, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(
      `resolve('${subsystem}', '${file}'): not found. ` +
      `Checked: ${fullPath}`
    );
  }
  return fullPath;
}

// Expose internals for testing
resolve._reset = () => { _paths = null; };

module.exports = resolve;

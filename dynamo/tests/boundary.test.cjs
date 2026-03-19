// Dynamo > Tests > boundary.test.cjs -- Import boundary enforcement
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Discover repo root: from dynamo/tests/ go up 2 levels
const REPO_ROOT = path.join(__dirname, '..', '..');

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

function extractRequires(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const requires = [];
  // Match require('...') and require(path.join(...)) patterns
  // Look for string literals containing component names
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('require(') || line.includes('require.resolve(')) {
      requires.push({ line: i + 1, text: line.trim() });
    }
  }
  return requires;
}

describe('Import boundary enforcement', () => {
  const ledgerDir = path.join(REPO_ROOT, 'ledger');
  const switchboardDir = path.join(REPO_ROOT, 'switchboard');

  it('ledger files never import from switchboard', () => {
    const files = getAllCjsFiles(ledgerDir);
    assert.ok(files.length > 0, 'Should find ledger .cjs files');
    for (const file of files) {
      const requires = extractRequires(file);
      for (const req of requires) {
        assert.ok(
          !req.text.includes("'switchboard") && !req.text.includes('"switchboard') && !req.text.includes("switchboard'") && !req.text.includes('switchboard"') && !req.text.includes("'switchboard'"),
          `${path.relative(REPO_ROOT, file)}:${req.line} imports from switchboard: ${req.text}`
        );
      }
    }
  });

  it('switchboard files never import from ledger', () => {
    const files = getAllCjsFiles(switchboardDir);
    assert.ok(files.length > 0, 'Should find switchboard .cjs files');
    for (const file of files) {
      const requires = extractRequires(file);
      for (const req of requires) {
        assert.ok(
          !req.text.includes("'ledger") && !req.text.includes('"ledger') && !req.text.includes("ledger'") && !req.text.includes('ledger"') && !req.text.includes("'ledger'"),
          `${path.relative(REPO_ROOT, file)}:${req.line} imports from ledger: ${req.text}`
        );
      }
    }
  });

  it('dynamo/core.cjs is allowed to import from ledger (orchestrator privilege)', () => {
    const corePath = path.join(REPO_ROOT, 'dynamo', 'core.cjs');
    assert.ok(fs.existsSync(corePath), 'dynamo/core.cjs must exist');
    // This test documents and validates the orchestrator exception
    const content = fs.readFileSync(corePath, 'utf8');
    assert.ok(content.includes('MCPClient'), 'core.cjs should re-export MCPClient');
    assert.ok(content.includes('SCOPE'), 'core.cjs should re-export SCOPE');
  });

  it('directory structure has three root-level component dirs', () => {
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'dynamo')), 'dynamo/ must exist');
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'ledger')), 'ledger/ must exist');
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'switchboard')), 'switchboard/ must exist');
  });

  it('graphiti Docker infra is under ledger/graphiti/', () => {
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'ledger', 'graphiti', 'docker-compose.yml')),
      'ledger/graphiti/docker-compose.yml must exist');
  });

  it('no lib/ directory remains in dynamo/', () => {
    assert.ok(!fs.existsSync(path.join(REPO_ROOT, 'dynamo', 'lib')),
      'dynamo/lib/ must not exist after restructure');
  });
});

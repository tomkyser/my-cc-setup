// Dynamo > Tests > search.test.cjs
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const { searchFacts, searchNodes, combinedSearch } = require(
  path.join(__dirname, '..', '..', '..', 'ledger', 'search.cjs')
);

// --- Exports ---

describe('exports', () => {
  it('searchFacts is a function', () => {
    assert.strictEqual(typeof searchFacts, 'function');
  });

  it('searchNodes is a function', () => {
    assert.strictEqual(typeof searchNodes, 'function');
  });

  it('combinedSearch is a function', () => {
    assert.strictEqual(typeof combinedSearch, 'function');
  });
});

// Note: Deep testing of search functions deferred to integration tests
// since they require a live Graphiti MCP server connection.

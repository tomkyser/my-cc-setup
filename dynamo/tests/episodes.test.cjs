// Dynamo > Tests > episodes.test.cjs
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const { addEpisode, extractContent } = require(
  path.join(__dirname, '..', 'lib', 'ledger', 'episodes.cjs')
);

// --- extractContent ---

describe('extractContent', () => {
  it('returns empty string for null response', () => {
    assert.strictEqual(extractContent(null), '');
  });

  it('returns empty string for undefined response', () => {
    assert.strictEqual(extractContent(undefined), '');
  });

  it('returns empty string for response with error property', () => {
    const response = { error: { code: -1, message: 'fail' } };
    assert.strictEqual(extractContent(response), '');
  });

  it('returns empty string for response with empty content array', () => {
    const response = { result: { content: [] } };
    assert.strictEqual(extractContent(response), '');
  });

  it('returns text from valid MCP response with single text item', () => {
    const response = { result: { content: [{ type: 'text', text: 'hello' }] } };
    assert.strictEqual(extractContent(response), 'hello');
  });

  it('returns concatenated text items from valid MCP response', () => {
    const response = {
      result: {
        content: [
          { type: 'text', text: 'first' },
          { type: 'text', text: 'second' }
        ]
      }
    };
    assert.strictEqual(extractContent(response), 'first\nsecond');
  });

  it('ignores non-text content items', () => {
    const response = {
      result: {
        content: [
          { type: 'text', text: 'a' },
          { type: 'image', data: 'base64...' },
          { type: 'text', text: 'b' }
        ]
      }
    };
    assert.strictEqual(extractContent(response), 'a\nb');
  });

  it('ignores text items with empty/falsy text', () => {
    const response = {
      result: {
        content: [
          { type: 'text', text: '' },
          { type: 'text', text: 'valid' }
        ]
      }
    };
    assert.strictEqual(extractContent(response), 'valid');
  });

  it('returns empty string for response with no result key', () => {
    assert.strictEqual(extractContent({}), '');
  });

  it('returns empty string for response with result but no content', () => {
    assert.strictEqual(extractContent({ result: {} }), '');
  });
});

// --- addEpisode ---

describe('addEpisode', () => {
  it('is exported and is typeof function', () => {
    assert.strictEqual(typeof addEpisode, 'function');
  });
});

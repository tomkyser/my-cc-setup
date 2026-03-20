// Dynamo > Tests > curation.test.cjs
'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const { callHaiku, curateResults, summarizeText, generateSessionName } = require(
  path.join(__dirname, '..', '..', '..', 'subsystems', 'ledger', 'curation.cjs')
);

// --- Environment save/restore ---

let savedApiKey;

beforeEach(() => {
  savedApiKey = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
});

afterEach(() => {
  if (savedApiKey !== undefined) {
    process.env.OPENROUTER_API_KEY = savedApiKey;
  } else {
    delete process.env.OPENROUTER_API_KEY;
  }
});

// --- callHaiku ---

describe('callHaiku', () => {
  it('returns { text: "", uncurated: true } when OPENROUTER_API_KEY is not set', async () => {
    const result = await callHaiku('curation', { memories: 'test' });
    assert.strictEqual(result.uncurated, true);
    assert.strictEqual(result.text, '');
  });

  it('returns { text: fallback, uncurated: true } when fallback provided and no API key', async () => {
    const result = await callHaiku('curation', { memories: 'test', fallback: 'my-fallback' });
    assert.strictEqual(result.uncurated, true);
    assert.strictEqual(result.text, 'my-fallback');
  });

  it('returns uncurated when prompt name does not exist', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    const result = await callHaiku('nonexistent-prompt-xyz', {
      content: 'test',
      fallback: 'fallback-value'
    });
    assert.strictEqual(result.uncurated, true);
    assert.strictEqual(result.text, 'fallback-value');
  });
});

// --- curateResults ---

describe('curateResults', () => {
  it('returns empty string when memories is empty/falsy', async () => {
    const result = await curateResults('', 'some context');
    assert.strictEqual(result, '');
  });

  it('returns empty string when memories is null', async () => {
    const result = await curateResults(null, 'some context');
    assert.strictEqual(result, '');
  });

  it('returns [uncurated] + truncated text when no API key', async () => {
    const result = await curateResults('some memories here', 'context');
    assert.ok(result.startsWith('[uncurated]\n'), 'Should start with [uncurated] marker');
    assert.ok(result.includes('some memories here'));
  });

  it('truncates to 500 chars when no API key and memories is long', async () => {
    const longMemories = 'x'.repeat(1000);
    const result = await curateResults(longMemories, 'context');
    assert.ok(result.startsWith('[uncurated]\n'));
    // [uncurated]\n + 500 chars
    assert.strictEqual(result.length, '[uncurated]\n'.length + 500);
  });
});

// --- summarizeText ---

describe('summarizeText', () => {
  it('returns truncated input (first 200 chars) when no API key', async () => {
    const longText = 'A'.repeat(300);
    const result = await summarizeText(longText);
    assert.strictEqual(result, longText.slice(0, 200));
  });

  it('returns empty string for empty input when no API key', async () => {
    const result = await summarizeText('');
    assert.strictEqual(result, '');
  });
});

// --- generateSessionName ---

describe('generateSessionName', () => {
  it('returns empty string when no API key', async () => {
    const result = await generateSessionName('some session summary');
    assert.strictEqual(result, '');
  });
});

// --- Exports ---

describe('exports', () => {
  it('callHaiku is a function', () => {
    assert.strictEqual(typeof callHaiku, 'function');
  });

  it('curateResults is a function', () => {
    assert.strictEqual(typeof curateResults, 'function');
  });

  it('summarizeText is a function', () => {
    assert.strictEqual(typeof summarizeText, 'function');
  });

  it('generateSessionName is a function', () => {
    assert.strictEqual(typeof generateSessionName, 'function');
  });
});

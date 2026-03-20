// Dynamo > Reverie > Handlers > user-prompt.cjs
'use strict';

const resolve = require('../../../lib/resolve.cjs');

/**
 * Reverie UserPromptSubmit handler -- Phase 23 pass-through stub.
 * Delegates to the classic Ledger handler to produce identical output.
 * Phase 24 replaces this with cognitive processing pipeline.
 */
module.exports = async function reverieUserPrompt(ctx) {
  const classicHandler = require(resolve('ledger', 'hooks/prompt-augment.cjs'));
  return classicHandler(ctx);
};

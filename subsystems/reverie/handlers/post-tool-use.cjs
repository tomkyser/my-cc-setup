// Dynamo > Reverie > Handlers > post-tool-use.cjs
'use strict';

const resolve = require('../../../lib/resolve.cjs');

/**
 * Reverie PostToolUse handler -- Phase 23 pass-through stub.
 * Delegates to the classic Ledger handler to produce identical output.
 * Phase 24 replaces this with cognitive processing pipeline.
 */
module.exports = async function reveriePostToolUse(ctx) {
  const classicHandler = require(resolve('ledger', 'hooks/capture-change.cjs'));
  return classicHandler(ctx);
};

// Dynamo > Reverie > Handlers > pre-compact.cjs
'use strict';

const resolve = require('../../../lib/resolve.cjs');

/**
 * Reverie PreCompact handler -- Phase 23 pass-through stub.
 * Delegates to the classic Ledger handler to produce identical output.
 * Phase 24 replaces this with cognitive processing pipeline.
 */
module.exports = async function reveriePreCompact(ctx) {
  const classicHandler = require(resolve('ledger', 'hooks/preserve-knowledge.cjs'));
  return classicHandler(ctx);
};

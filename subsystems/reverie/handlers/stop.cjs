// Dynamo > Reverie > Handlers > stop.cjs
'use strict';

const resolve = require('../../../lib/resolve.cjs');

/**
 * Reverie Stop handler -- Phase 23 pass-through stub.
 * Delegates to the classic Ledger handler to produce identical output.
 * Phase 24 replaces this with cognitive processing pipeline.
 */
module.exports = async function reverieStop(ctx) {
  const classicHandler = require(resolve('ledger', 'hooks/session-summary.cjs'));
  return classicHandler(ctx);
};

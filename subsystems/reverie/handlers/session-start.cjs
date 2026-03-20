// Dynamo > Reverie > Handlers > session-start.cjs
'use strict';

const resolve = require('../../../lib/resolve.cjs');

/**
 * Reverie SessionStart handler -- Phase 23 pass-through stub.
 * Delegates to the classic Ledger handler to produce identical output.
 * Phase 24 replaces this with cognitive processing pipeline.
 */
module.exports = async function reverieSessionStart(ctx) {
  const classicHandler = require(resolve('ledger', 'hooks/session-start.cjs'));
  return classicHandler(ctx);
};

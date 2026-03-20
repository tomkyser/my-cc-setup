// Dynamo > Reverie > Handlers > iv-subagent-start.cjs
'use strict';

const resolve = require('../../../lib/resolve.cjs');
const { logError } = require(resolve('lib', 'core.cjs'));

/**
 * Reverie SubagentStart handler -- Phase 23 no-op stub.
 * Logs receipt of subagent start event and returns null.
 * Phase 24 wires this to activation context preparation.
 */
module.exports = async function reverieSubagentStart(ctx) {
  const agentType = (ctx && ctx.agent_type) || 'unknown';
  logError('reverie-subagent-start', 'Received SubagentStart for agent_type=' + agentType + ' (stub -- no action)');
  return null;
};

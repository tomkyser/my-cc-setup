// Dynamo > Reverie > Handlers > iv-subagent-stop.cjs
'use strict';

const resolve = require('../../../lib/resolve.cjs');
const { logError } = require(resolve('lib', 'core.cjs'));

/**
 * Reverie SubagentStop handler -- Phase 23 no-op stub.
 * Logs receipt of subagent stop event and returns null.
 * Phase 24 wires this to activation context teardown and REM consolidation.
 */
module.exports = async function reverieSubagentStop(ctx) {
  const agentType = (ctx && ctx.agent_type) || 'unknown';
  const correlationId = (ctx && ctx.correlation_id) || 'none';
  logError('reverie-subagent-stop', 'Received SubagentStop for agent_type=' + agentType + ', correlation_id=' + correlationId + ' (stub -- no action)');
  return null;
};

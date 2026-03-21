// Dynamo > Reverie > Handlers > iv-subagent-stop.cjs
'use strict';

const resolve = require('../../../lib/resolve.cjs');
const { logError } = require(resolve('lib', 'core.cjs'));
const { loadState, persistState } = require(resolve('reverie', 'state.cjs'));
const innerVoice = require(resolve('reverie', 'inner-voice.cjs'));

/**
 * Reverie SubagentStop handler -- writes deliberation result to state bridge file.
 * Called when the inner-voice subagent completes. The next UserPromptSubmit
 * atomically consumes the result via consumeDeliberationResult().
 *
 * Per Pitfall 1: SubagentStop CANNOT inject into parent context.
 * Output goes to state bridge file, NOT stdout.
 */
module.exports = async function reverieSubagentStop(ctx) {
  try {
    // Only respond to inner-voice subagent type
    const agentName = (ctx && (ctx.agent_name || ctx.agent_type)) || 'unknown';
    if (!agentName.includes('inner-voice')) {
      return null; // Not our subagent -- ignore
    }

    const state = loadState();

    // Extract the subagent's output from the stop event
    const lastMessage = ctx.last_assistant_message || '';
    const agentId = ctx.agent_id || 'inner-voice';

    // Parse structured output if the subagent produced JSON
    let injection = lastMessage;
    let resultType = state.processing.deliberation_type || 'deliberation';
    try {
      const parsed = JSON.parse(lastMessage);
      if (parsed.injection) injection = parsed.injection;
      if (parsed.type) resultType = parsed.type;

      // If synthesis with session_name, update state
      if (parsed.session_name) {
        state.self_model.last_session_name = parsed.session_name;
      }
      if (parsed.self_model_updates) {
        Object.assign(state.self_model, parsed.self_model_updates);
      }
      if (parsed.predictions) {
        Object.assign(state.predictions, parsed.predictions);
      }
    } catch (e) {
      // Not JSON -- use raw text as injection
    }

    // Write to state bridge (PATH-05)
    innerVoice.writeDeliberationResult({
      injection,
      agent_id: agentId,
      type: resultType
    }, state);

    // Clear deliberation pending flag
    state.processing.deliberation_pending = false;

    // Persist updated state (with any self-model updates from subagent output)
    persistState(state);

    logError('reverie-subagent-stop', 'Deliberation result written, correlation_id=' +
      (state.processing.last_deliberation_id || 'none') + ', type=' + resultType);

    return null; // Per Pitfall 1: SubagentStop returns null (no stdout injection)
  } catch (err) {
    logError('reverie-subagent-stop', 'Handler error: ' + err.message);
    return null;
  }
};

// Dynamo > Reverie > Handlers > iv-subagent-start.cjs
'use strict';

const resolve = require('../../../lib/resolve.cjs');
const { logError } = require(resolve('lib', 'core.cjs'));
const { loadState } = require(resolve('reverie', 'state.cjs'));

/**
 * Reverie SubagentStart handler -- provides Inner Voice state as additionalContext
 * for the inner-voice subagent. Called when Claude Code spawns the inner-voice agent.
 *
 * Returns: additionalContext string (serialized IV state for the subagent to process)
 * The dispatcher wraps this in hookSpecificOutput JSON for the platform.
 */
module.exports = async function reverieSubagentStart(ctx) {
  try {
    // Only respond to inner-voice subagent type
    const agentName = (ctx && (ctx.agent_name || ctx.agent_type)) || 'unknown';
    if (!agentName.includes('inner-voice')) {
      return null; // Not our subagent -- ignore
    }

    const state = loadState();

    // Build context package for the subagent
    const context = {
      currentState: {
        self_model: state.self_model,
        relationship_model: state.relationship_model,
        activation_map: state.activation_map,
        predictions: state.predictions,
        domain_frame: state.domain_frame
      },
      deliberationQueue: state.processing.deliberation_queue || null,
      deliberationType: state.processing.deliberation_type || 'analyze_context',
      correlationId: state.processing.last_deliberation_id || null,
      instructions: buildInstructions(state)
    };

    return JSON.stringify(context, null, 2);
  } catch (err) {
    logError('reverie-subagent-start', 'Handler error: ' + err.message);
    return null;
  }
};

function buildInstructions(state) {
  const type = state.processing.deliberation_type;
  switch (type) {
    case 'explicit_recall':
      return 'User has asked an explicit recall question. Query the knowledge graph thoroughly for all relevant entities. Provide a comprehensive response grounded in the user\'s experience. Bypass threshold -- surface everything above 0.2 activation.';
    case 'semantic_shift':
      return 'A significant topic shift has been detected. Analyze the new topic context, identify relevant memories and connections, and prepare a contextual injection if relevant memories exist.';
    case 'session_briefing':
      return 'Generate a comprehensive session-start briefing. Review recent sessions, active entities, and current project state. Frame everything from the user\'s perspective.';
    case 'rem_synthesis':
      return 'Perform session-end synthesis (REM Tier 3). Consolidate what happened, key decisions, patterns observed, and predictions for the next session. Generate a session name. Update self-model assessments.';
    default:
      return 'Analyze the current context and determine if any relevant memories or connections should be surfaced.';
  }
}

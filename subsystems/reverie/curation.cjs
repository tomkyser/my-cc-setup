// Dynamo > Reverie > curation.cjs
'use strict';

const resolve = require('../../lib/resolve.cjs');
const { logError, loadPrompt } = require(resolve('lib', 'core.cjs'));

/**
 * Token limits per injection type, derived from Cognitive Load Theory (REVERIE-SPEC Section 2.1).
 * Pattern 6 from 24-RESEARCH.md: 500 session-start, 150 mid-session, 50 urgent.
 */
const TOKEN_LIMITS = {
  session_start: 500,
  mid_session: 150,
  urgent: 50
};

/**
 * Common stop words for session name extraction.
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'that', 'which',
  'who', 'whom', 'this', 'these', 'those', 'it', 'its', 'as', 'if',
  'not', 'no', 'all', 'each', 'every', 'some', 'any', 'few', 'more',
  'most', 'other', 'into', 'over', 'such', 'than', 'too', 'very', 'just',
  'about', 'up', 'out', 'so', 'also'
]);

/**
 * Truncate text to a token limit using character-based estimation.
 * ~4 chars per token for English text. Truncates at sentence boundary when possible.
 * @param {string} text - Text to truncate
 * @param {number} tokenLimit - Maximum tokens
 * @returns {string} Truncated text
 */
function truncateToTokenLimit(text, tokenLimit) {
  const charLimit = tokenLimit * 4;
  if (text.length <= charLimit) return text;

  const truncated = text.slice(0, charLimit);
  const lastSentence = truncated.lastIndexOf('. ');
  if (lastSentence > charLimit * 0.5) {
    return truncated.slice(0, lastSentence + 1);
  }
  // Fall back to last space to avoid mid-word cut
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
}

/**
 * Format entities for mid-session injection using template-based formatting.
 * Applies adversarial counter-prompting per D-03: wraps facts with user-experience qualifiers.
 * Hot-path implementation -- synchronous, no LLM calls.
 *
 * @param {Array|null} entities - Extracted entities with activation levels
 * @param {string} contextText - Current context/prompt text
 * @param {Object} state - Current inner voice state
 * @param {Object} [options={}] - Options including tokenLimit override
 * @returns {string|null} Formatted injection string or null if no entities
 */
function curateForInjection(entities, contextText, state, options = {}) {
  if (!entities || !Array.isArray(entities) || entities.length === 0) {
    return null;
  }

  // Load template for variable reference (non-critical -- formatting works without it)
  try {
    loadPrompt('iv-injection');
  } catch (e) {
    // Template load failure is non-critical for template-based fallback
  }

  const tokenLimit = options.tokenLimit || TOKEN_LIMITS.mid_session;
  const lines = [];

  // Sort entities by activation level (highest first)
  const sorted = [...entities].sort((a, b) => (b.activation || 0) - (a.activation || 0));

  for (const entity of sorted) {
    const context = entity.context || 'this was relevant to your current work';
    const line = `- From your experience, when you worked on ${entity.name}, ${context}.`;
    lines.push(line);
  }

  const formatted = lines.join('\n');
  return truncateToTokenLimit(formatted, tokenLimit);
}

/**
 * Format session-start briefing using template-based formatting.
 * Contextual narrative covering recent activity, active entities, predictions.
 * Per D-04: same narrative format as mid-session, just longer (500 tokens).
 *
 * @param {Object} sessionData - Session data including project, recent sessions
 * @param {Array} entities - Active entities with activation levels
 * @param {Object} state - Current inner voice state
 * @param {Object} [options={}] - Options
 * @returns {string} Formatted briefing string
 */
function formatBriefing(sessionData, entities, state, options = {}) {
  if (!sessionData || (Object.keys(sessionData).length === 0 && (!entities || entities.length === 0))) {
    return 'Starting a new session.';
  }

  const parts = [];
  const project = sessionData.project || '';

  // Project context
  if (project) {
    parts.push(`Session context for ${project}.`);
  }

  // Recent sessions
  if (sessionData.recent && Array.isArray(sessionData.recent) && sessionData.recent.length > 0) {
    const recentItems = sessionData.recent.slice(0, 5);
    parts.push('Recent activity, from your experience:');
    for (const item of recentItems) {
      parts.push(`- ${item}`);
    }
  }

  // Active entities
  if (entities && Array.isArray(entities) && entities.length > 0) {
    const sorted = [...entities].sort((a, b) => (b.activation || 0) - (a.activation || 0));
    const topEntities = sorted.slice(0, 10);
    const entityList = topEntities.map(e => {
      const level = e.activation ? ` (${(e.activation * 100).toFixed(0)}%)` : '';
      return `${e.name}${level}`;
    }).join(', ');
    parts.push(`Active context: ${entityList}.`);
  }

  // Predictions
  if (sessionData.predictions) {
    parts.push(`As you described it, expected focus: ${sessionData.predictions}.`);
  }

  if (parts.length === 0) {
    if (project) {
      return `Starting a new session for ${project}.`;
    }
    return 'Starting a new session.';
  }

  const briefing = parts.join('\n');
  return truncateToTokenLimit(briefing, TOKEN_LIMITS.session_start);
}

/**
 * Format session-end synthesis using template-based formatting.
 * Returns structured object with synthesis narrative, session name, model updates, predictions.
 * Per D-15: REM Tier 3 consolidation.
 *
 * @param {Object} sessionData - Session data including summary
 * @param {Object} state - Current inner voice state
 * @param {Object} [options={}] - Options
 * @returns {Object} Synthesis object with synthesis, session_name, self_model_updates, predictions
 */
function formatSynthesis(sessionData, state, options = {}) {
  const summary = (sessionData && sessionData.summary) ? sessionData.summary : '';
  const safeState = state || {};

  // Build synthesis narrative
  const synthesis = summary
    ? `From your experience this session: ${summary}`
    : 'Session completed.';

  // Generate session name from summary
  const sessionName = summary
    ? extractSessionName(summary)
    : 'Session ' + new Date().toISOString().slice(0, 16).replace('T', ' ');

  // Self-model updates from state
  const selfModel = safeState.self_model || {};
  const selfModelUpdates = {
    injections_made: selfModel.injections_made || 0,
    acknowledged: selfModel.acknowledged || 0
  };

  // Predictions from active entities and domain frame
  const activationMap = safeState.activation_map || {};
  const domainFrame = safeState.domain_frame || {};
  const activeEntities = (activationMap.entities || []).filter(e => (e.activation || 0) > 0.5);
  const predictions = {
    expected_topic: activeEntities.length > 0
      ? activeEntities[0].name
      : 'general',
    expected_activity: domainFrame.current_frame || 'general',
    confidence: activeEntities.length > 0 ? 0.6 : 0.3
  };

  return { synthesis, session_name: sessionName, self_model_updates: selfModelUpdates, predictions };
}

/**
 * Format pre-compact state preservation summary.
 * Extracts high-activation entities and formats compact state for context window survival.
 * REM Tier 1: minimum viable context preservation.
 *
 * @param {Object} state - Current inner voice state
 * @param {Object} [options={}] - Options
 * @returns {string} Compact summary string
 */
function formatPreCompact(state, options = {}) {
  const safeState = state || {};
  const activationMap = safeState.activation_map || {};
  const entities = activationMap.entities || [];
  const domainFrame = safeState.domain_frame || {};
  const processing = safeState.processing || {};

  const parts = [];

  // High-activation entities (> 0.5)
  const highActivation = entities
    .filter(e => (e.activation || 0) > 0.5)
    .sort((a, b) => (b.activation || 0) - (a.activation || 0));

  if (highActivation.length > 0) {
    const entityNames = highActivation.map(e => e.name).join(', ');
    parts.push(`Active: ${entityNames}.`);
  }

  // Domain frame
  if (domainFrame.current_frame) {
    parts.push(`Frame: ${domainFrame.current_frame}.`);
  }

  // Deliberation status
  if (processing.deliberation_pending) {
    parts.push('Pending: deliberation in progress.');
  } else {
    parts.push('Pending: none.');
  }

  const compact = parts.join(' ');
  return truncateToTokenLimit(compact, 200);
}

/**
 * Generate a session name from summary text.
 * Per D-06: template fallback produces timestamp-based name for empty input.
 *
 * @param {string} summaryText - Summary text to extract name from
 * @param {Object} [options={}] - Options
 * @returns {string} Short session name (3-7 words)
 */
function generateSessionName(summaryText, options = {}) {
  if (!summaryText || summaryText.trim().length < 10) {
    return 'Session ' + new Date().toISOString().slice(0, 16).replace('T', ' ');
  }

  return extractSessionName(summaryText);
}

/**
 * Extract key words from text to form a session name.
 * Simple heuristic: split on spaces, filter stop words, take first 3-5 significant words.
 *
 * @param {string} text - Source text
 * @returns {string} Short name (3-5 words)
 */
function extractSessionName(text) {
  const words = text
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !STOP_WORDS.has(w.toLowerCase()));

  if (words.length === 0) {
    return 'Session ' + new Date().toISOString().slice(0, 16).replace('T', ' ');
  }

  // Take 3-5 significant words, capitalize first
  const selected = words.slice(0, 5);
  if (selected.length < 3 && words.length >= 3) {
    // If filtering was too aggressive, relax and take more
    const relaxed = text.split(/\s+/).filter(w => w.length > 2).slice(0, 5);
    return relaxed.join(' ');
  }

  return selected.join(' ');
}

module.exports = {
  curateForInjection,
  formatBriefing,
  formatSynthesis,
  formatPreCompact,
  generateSessionName,
  TOKEN_LIMITS
};

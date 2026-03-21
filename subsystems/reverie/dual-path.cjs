// Dynamo > Reverie > dual-path.cjs
'use strict';

// Deterministic dual-path routing module.
// Decides hot/deliberation/skip without any LLM call.
// All inputs via function parameters, all outputs via return values.

// --- Section 1: Path Selection (PATH-01) ---

/**
 * Deterministic path selection based on signal priority.
 * Priority order per spec: predictionsMatch -> skip, explicitRecall -> deliberation,
 * rateLimited -> hot, semanticShift >= threshold -> deliberation,
 * entityConfidence < threshold -> deliberation, !needsInjection -> skip, default -> hot
 *
 * @param {Object} signals - Input signals
 * @param {boolean} [signals.predictionsMatch] - D-12: predictions match reality
 * @param {boolean} [signals.explicitRecall] - D-11: user explicitly asked for recall
 * @param {boolean} [signals.rateLimited] - PATH-06: rate limited state
 * @param {number} [signals.semanticShiftScore] - IV-09: semantic shift score (0-1)
 * @param {number} [signals.shiftThreshold] - threshold for semantic shift
 * @param {number} [signals.entityConfidence] - entity confidence (0-1)
 * @param {number} [signals.confidenceThreshold] - threshold for entity confidence
 * @param {boolean} [signals.needsInjection] - whether injection is needed
 * @param {Object} [options] - Additional options
 * @returns {'hot'|'deliberation'|'skip'}
 */
function selectPath(signals, options = {}) {
  const shiftThreshold = signals.shiftThreshold || options.shiftThreshold || 0.4;
  const confidenceThreshold = signals.confidenceThreshold || options.confidenceThreshold || 0.7;

  // D-12: Complete silence when predictions match reality
  if (signals.predictionsMatch) return 'skip';

  // D-11: Explicit recall always triggers deliberation
  if (signals.explicitRecall) return 'deliberation';

  // PATH-06: Rate limited always routes to hot path
  if (signals.rateLimited) return 'hot';

  // IV-09: Semantic shift above threshold triggers deliberation
  if (signals.semanticShiftScore !== undefined &&
      signals.semanticShiftScore >= shiftThreshold) {
    return 'deliberation';
  }

  // Low entity confidence triggers deliberation
  if (signals.entityConfidence !== undefined &&
      signals.entityConfidence < confidenceThreshold) {
    return 'deliberation';
  }

  // No injection needed -> skip
  if (signals.needsInjection === false) return 'skip';

  // Default -> hot
  return 'hot';
}

// --- Section 2: Semantic Shift Detection (D-10, IV-09) ---

/**
 * Detect semantic shift using Jaccard overlap of entity names.
 * Compares current and previous entity sets using lowercased names.
 *
 * @param {Array<{name: string}>} currentEntities - Current prompt entities
 * @param {Array<{name: string}>|null} previousEntities - Previous prompt entities
 * @param {Object} [options] - Options
 * @param {number} [options.shiftThreshold=0.3] - Overlap threshold below which shift is detected
 * @returns {{shifted: boolean, overlapScore: number}}
 */
function detectSemanticShift(currentEntities, previousEntities, options = {}) {
  const threshold = options.shiftThreshold || 0.3;

  if (!previousEntities || previousEntities.length === 0) {
    return { shifted: false, overlapScore: 1.0 };
  }

  const currentSet = new Set(currentEntities.map(e => e.name.toLowerCase()));
  const previousSet = new Set(previousEntities.map(e => e.name.toLowerCase()));

  const intersection = new Set([...currentSet].filter(x => previousSet.has(x)));
  const union = new Set([...currentSet, ...previousSet]);

  const overlapScore = union.size > 0 ? intersection.size / union.size : 1.0;
  return { shifted: overlapScore < threshold, overlapScore };
}

// --- Section 3: Explicit Recall Detection (D-11, IV-11) ---

const RECALL_PATTERNS = [
  /\bdo you (?:remember|recall|know)\b/i,
  /\bwhat do you (?:know|remember) about\b/i,
  /\bhave (?:we|you|I) (?:discussed|talked about|mentioned)\b/i,
  /\bremember when\b/i,
  /\brecall (?:the|our|my)\b/i
];

/**
 * Detect explicit recall phrases in user text.
 * Patterns match recall-intent phrases per D-11 / IV-11.
 *
 * @param {string} text - User prompt text
 * @param {Object} [options] - Options (reserved for future use)
 * @returns {boolean}
 */
function detectExplicitRecall(text, options = {}) {
  return RECALL_PATTERNS.some(pattern => pattern.test(text));
}

// --- Section 4: Token Estimation (IV-05) ---

/**
 * Estimate token count from text length.
 * Rough heuristic: ~4 chars per token for English text.
 *
 * @param {string} text - Input text
 * @returns {number} Estimated token count
 */
function estimateTokens(text) {
  if (!text || text.length === 0) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within a token limit.
 * Prefers sentence boundaries, falls back to word boundaries.
 *
 * @param {string} text - Input text
 * @param {number} limit - Maximum token count
 * @returns {string} Truncated text
 */
function truncateToTokenLimit(text, limit) {
  const estimated = estimateTokens(text);
  if (estimated <= limit) return text;

  const targetChars = limit * 4;
  const truncated = text.slice(0, targetChars);

  // Try to find last sentence boundary
  const lastSentence = truncated.lastIndexOf('. ');
  if (lastSentence > 0) {
    return truncated.slice(0, lastSentence + 1);
  }

  // Fall back to word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace);
  }

  return truncated;
}

// --- Section 5: Hot-Path Injection Formatting (D-01, D-02, D-03) ---

/**
 * Format hot-path injection using template-based contextual narrative.
 * No LLM call -- deterministic template formatting.
 * Uses adversarial framing per D-03: wraps facts with "from your experience" qualifiers.
 *
 * @param {Array<{id: string, level: number}>} crossedEntities - Entities that crossed threshold
 * @param {Object} state - Current inner-voice state
 * @param {Object} [options] - Options
 * @param {number} [options.tokenLimit=150] - Maximum injection tokens (mid-session default)
 * @returns {string|null} Formatted injection or null if nothing qualifies
 */
function formatHotPathInjection(crossedEntities, state, options = {}) {
  if (!crossedEntities || crossedEntities.length === 0) return null;

  const tokenLimit = options.tokenLimit || 150;
  const activationMap = (state && state.activation_map) || {};
  const parts = [];

  for (const entity of crossedEntities) {
    const entry = activationMap[entity.id];
    if (!entry) continue;

    const convergence = entry.convergence_count || 1;
    const sources = entry.sources || [];

    // Contextual narrative per D-01
    if (convergence >= 2) {
      parts.push(
        `From your experience, "${entity.id}" has come up repeatedly (${convergence} times). ` +
        `As you described it, this appears to be a significant focus area.`
      );
    } else if (sources.includes('association')) {
      parts.push(
        `From your experience, "${entity.id}" is connected to your current work context.`
      );
    } else {
      parts.push(
        `From your experience, "${entity.id}" is relevant to what you are working on.`
      );
    }
  }

  if (parts.length === 0) return null;

  let injection = parts.join(' ');

  // Enforce token limit
  injection = truncateToTokenLimit(injection, tokenLimit);

  return injection;
}

// --- Section 6: Threshold Adaptation (D-09) ---

/**
 * Adjust sublimation threshold based on injection acknowledgment rate.
 * Self-calibrating across sessions per D-09.
 *
 * @param {number} currentThreshold - Current sublimation threshold
 * @param {Array<{acknowledged: boolean}>} injectionHistory - Recent injection records
 * @param {Object} [options] - Options
 * @param {number} [options.recentWindow=10] - Number of recent entries to consider
 * @returns {number} Adjusted threshold
 */
function adjustThreshold(currentThreshold, injectionHistory, options = {}) {
  const recentWindow = options.recentWindow || 10;

  const recent = injectionHistory.slice(-recentWindow);
  if (recent.length < 3) return currentThreshold; // Not enough data

  const acknowledged = recent.filter(i => i.acknowledged).length;
  const rate = acknowledged / recent.length;

  if (rate > 0.7) {
    // User engaging well -- lower threshold slightly
    return Math.max(0.3, currentThreshold - 0.02);
  } else if (rate < 0.3) {
    // User ignoring injections -- raise threshold
    return Math.min(0.9, currentThreshold + 0.02);
  }
  return currentThreshold;
}

// --- Exports ---

module.exports = {
  selectPath,
  detectSemanticShift,
  detectExplicitRecall,
  estimateTokens,
  truncateToTokenLimit,
  formatHotPathInjection,
  adjustThreshold
};

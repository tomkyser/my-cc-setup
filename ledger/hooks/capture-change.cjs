// Dynamo > Ledger > Hooks > capture-change.cjs
'use strict';

const path = require('path');
const fs = require('fs');

// Resolve core.cjs: deployed layout (../../core.cjs) or repo layout (../../dynamo/core.cjs)
function resolveCore() {
  const deployed = path.join(__dirname, '..', '..', 'core.cjs');
  if (fs.existsSync(deployed)) return deployed;
  return path.join(__dirname, '..', '..', 'dynamo', 'core.cjs');
}

const { healthGuard, logError } = require(resolveCore());
const { addEpisode } = require(path.join(__dirname, '..', 'episodes.cjs'));

/**
 * PostToolUse handler -- capture file change episodes in Graphiti.
 * Receives ctx object from dispatcher (includes project, scope, tool_name, tool_input, etc).
 */
module.exports = async function captureChange(ctx) {
  // Only process file-editing tools (match Python behavior: Write, Edit, MultiEdit)
  if (!/^(Write|Edit|MultiEdit)$/.test(ctx.tool_name)) return;

  // Health check
  const health = healthGuard(() => ({ healthy: true, detail: 'deferred to episode write' }));
  if (!health.healthy) return;

  try {
    // Extract file path from tool input
    const filePath = (ctx.tool_input && (ctx.tool_input.file_path || ctx.tool_input.filePath)) || 'unknown file';

    // Build episode content (keep brief, don't include file content)
    const content = 'File change: ' + ctx.tool_name + ' on ' + filePath;

    await addEpisode(content, ctx.scope, { hookName: 'capture-change' });
    // No stdout output (PostToolUse is silent for Dynamo)
  } catch (err) {
    logError('capture-change', 'Handler error: ' + err.message);
  }
};

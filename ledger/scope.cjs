// Dynamo > Ledger > scope.cjs
'use strict';

// Scope constants and validation for Graphiti group_id values.
// This module is STANDALONE -- it does NOT require core.cjs or any other dynamo module.

const SCOPE_PATTERN = /^[a-zA-Z0-9_-]+$/;

function sanitize(name) {
  return name
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'unknown';
}

const SCOPE = {
  global: 'global',
  project: (name) => `project-${sanitize(name)}`,
  session: (ts) => `session-${ts}`,
  task: (desc) => `task-${sanitize(desc)}`
};

function validateGroupId(groupId) {
  if (typeof groupId !== 'string' || !groupId) {
    throw new Error('group_id must be a non-empty string');
  }
  if (!SCOPE_PATTERN.test(groupId)) {
    throw new Error(
      'Invalid group_id "' + groupId + '": contains characters outside [a-zA-Z0-9_-]. ' +
      'Use dash separator, not colon (e.g., project-myproject, not project:myproject).'
    );
  }
  return groupId;
}

module.exports = { SCOPE, SCOPE_PATTERN, validateGroupId, sanitize };

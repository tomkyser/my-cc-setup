// Dynamo > Tests > health-check.test.cjs
'use strict';

const { describe, it, before, after, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const path = require('path');

// We test the orchestrator by mocking stage functions.
// The health-check module imports stages.cjs and calls the 8 health-check stage functions.
// We mock the stages module to control return values.

const healthCheckPath = path.join(__dirname, '..', '..', '..', 'subsystems', 'terminus', 'health-check.cjs');

// Helper: create mock stage results
function okResult(detail) { return { status: 'OK', detail: detail || 'ok', raw: '' }; }
function failResult(detail) { return { status: 'FAIL', detail: detail || 'failed', raw: '' }; }
function warnResult(detail) { return { status: 'WARN', detail: detail || 'warning', raw: '' }; }

// Helper: save and restore all 8 stage functions for a test block
function saveStages(stagesModule) {
  return {
    stageDocker: stagesModule.stageDocker,
    stageNeo4j: stagesModule.stageNeo4j,
    stageGraphitiApi: stagesModule.stageGraphitiApi,
    stageMcpSession: stagesModule.stageMcpSession,
    stageEnvVars: stagesModule.stageEnvVars,
    stageCanaryWriteRead: stagesModule.stageCanaryWriteRead,
    stageNodeVersion: stagesModule.stageNodeVersion,
    stageSessionStorage: stagesModule.stageSessionStorage
  };
}

function restoreStages(stagesModule, saved) {
  stagesModule.stageDocker = saved.stageDocker;
  stagesModule.stageNeo4j = saved.stageNeo4j;
  stagesModule.stageGraphitiApi = saved.stageGraphitiApi;
  stagesModule.stageMcpSession = saved.stageMcpSession;
  stagesModule.stageEnvVars = saved.stageEnvVars;
  stagesModule.stageCanaryWriteRead = saved.stageCanaryWriteRead;
  stagesModule.stageNodeVersion = saved.stageNodeVersion;
  stagesModule.stageSessionStorage = saved.stageSessionStorage;
}

function mockAllOk(stagesModule, overrides) {
  stagesModule.stageDocker = async () => okResult('Docker OK');
  stagesModule.stageNeo4j = async () => okResult('Neo4j OK');
  stagesModule.stageGraphitiApi = async () => okResult('API OK');
  stagesModule.stageMcpSession = async () => okResult('MCP OK');
  stagesModule.stageEnvVars = async () => okResult('Env OK');
  stagesModule.stageCanaryWriteRead = async () => okResult('Canary OK');
  stagesModule.stageNodeVersion = async () => okResult('Node.js OK');
  stagesModule.stageSessionStorage = async () => okResult('Storage OK');
  if (overrides) Object.assign(stagesModule, overrides);
}

describe('health-check module', () => {
  let healthCheck;
  let stagesModule;
  let originalOutput;
  let capturedOutput;
  let originalExit;

  before(() => {
    // Load the stages module so we can mock its functions
    const stagesPath = path.join(__dirname, '..', '..', '..', 'subsystems', 'terminus', 'stages.cjs');
    stagesModule = require(stagesPath);

    // Load health-check module (it requires stages.cjs internally)
    healthCheck = require(healthCheckPath);
  });

  describe('module exports', () => {
    it('exports a run function', () => {
      assert.strictEqual(typeof healthCheck.run, 'function');
    });
  });

  describe('result shape', () => {
    it('returns { command, timestamp, stages, summary }', async () => {
      const saved = saveStages(stagesModule);
      mockAllOk(stagesModule);

      try {
        const result = await healthCheck.run([], false, true);
        assert.strictEqual(result.command, 'health-check');
        assert.strictEqual(typeof result.timestamp, 'string');
        assert.ok(Array.isArray(result.stages));
        assert.ok(result.summary);
        assert.strictEqual(typeof result.summary.passed, 'number');
        assert.strictEqual(typeof result.summary.total, 'number');
        assert.strictEqual(typeof result.summary.ok, 'boolean');
      } finally {
        restoreStages(stagesModule, saved);
      }
    });

    it('has exactly 8 stage entries', async () => {
      const saved = saveStages(stagesModule);
      mockAllOk(stagesModule);

      try {
        const result = await healthCheck.run([], false, true);
        assert.strictEqual(result.stages.length, 8);
      } finally {
        restoreStages(stagesModule, saved);
      }
    });
  });

  describe('all stages pass', () => {
    it('summary.ok is true when all stages return OK', async () => {
      const saved = saveStages(stagesModule);
      mockAllOk(stagesModule);

      try {
        const result = await healthCheck.run([], false, true);
        assert.strictEqual(result.summary.ok, true);
        assert.strictEqual(result.summary.passed, result.summary.total);
      } finally {
        restoreStages(stagesModule, saved);
      }
    });

    it('WARN stages still count as passed', async () => {
      const saved = saveStages(stagesModule);
      mockAllOk(stagesModule, {
        stageEnvVars: async () => warnResult('OPENROUTER_API_KEY missing')
      });

      try {
        const result = await healthCheck.run([], false, true);
        assert.strictEqual(result.summary.ok, true);
        assert.strictEqual(result.summary.passed, 8);
      } finally {
        restoreStages(stagesModule, saved);
      }
    });
  });

  describe('cascading skip - Docker failure', () => {
    it('when Docker fails, stages 2-4 and 6 are SKIP, stages 5, 7, and 8 still run', async () => {
      const saved = saveStages(stagesModule);
      mockAllOk(stagesModule, {
        stageDocker: async () => failResult('No containers')
      });

      try {
        const result = await healthCheck.run([], false, true);

        // Stage 1 (Docker): FAIL
        assert.strictEqual(result.stages[0].status, 'FAIL');

        // Stages 2-4 (Neo4j, Graphiti API, MCP Session): SKIP
        assert.strictEqual(result.stages[1].status, 'SKIP');
        assert.strictEqual(result.stages[2].status, 'SKIP');
        assert.strictEqual(result.stages[3].status, 'SKIP');

        // Stage 5 (Env Vars): OK (runs independently)
        assert.strictEqual(result.stages[4].status, 'OK');

        // Stage 6 (Canary): SKIP
        assert.strictEqual(result.stages[5].status, 'SKIP');

        // Stage 7 (Node.js Version): OK (runs independently like Env Vars)
        assert.strictEqual(result.stages[6].status, 'OK');

        // Stage 8 (Session Storage): OK (runs independently)
        assert.strictEqual(result.stages[7].status, 'OK');

        // Summary: ok is false
        assert.strictEqual(result.summary.ok, false);
      } finally {
        restoreStages(stagesModule, saved);
      }
    });
  });

  describe('cascading skip - Neo4j failure', () => {
    it('when Neo4j fails but Docker OK, stages 3-4 and 6 SKIP, stages 1, 5, 7, and 8 show real results', async () => {
      const saved = saveStages(stagesModule);
      mockAllOk(stagesModule, {
        stageDocker: async () => okResult('Docker running'),
        stageNeo4j: async () => failResult('Neo4j down'),
        stageEnvVars: async () => okResult('Env set')
      });

      try {
        const result = await healthCheck.run([], false, true);

        // Stage 1 (Docker): OK
        assert.strictEqual(result.stages[0].status, 'OK');
        // Stage 2 (Neo4j): FAIL
        assert.strictEqual(result.stages[1].status, 'FAIL');
        // Stages 3-4 (Graphiti API, MCP Session): SKIP
        assert.strictEqual(result.stages[2].status, 'SKIP');
        assert.strictEqual(result.stages[3].status, 'SKIP');
        // Stage 5 (Env Vars): OK
        assert.strictEqual(result.stages[4].status, 'OK');
        // Stage 6 (Canary): SKIP
        assert.strictEqual(result.stages[5].status, 'SKIP');
        // Stage 7 (Node.js Version): OK (runs independently)
        assert.strictEqual(result.stages[6].status, 'OK');
        // Stage 8 (Session Storage): OK (runs independently)
        assert.strictEqual(result.stages[7].status, 'OK');
      } finally {
        restoreStages(stagesModule, saved);
      }
    });
  });

  describe('verbose flag', () => {
    it('--verbose flag is passed through to stage options', async () => {
      let capturedOptions = {};
      const saved = saveStages(stagesModule);
      mockAllOk(stagesModule, {
        stageDocker: async (opts) => { capturedOptions = opts; return okResult(); }
      });

      try {
        await healthCheck.run(['--verbose'], false, true);
        assert.strictEqual(capturedOptions.verbose, true);
      } finally {
        restoreStages(stagesModule, saved);
      }
    });
  });

  describe('summary counts', () => {
    it('passed counts non-SKIP stages with OK or WARN; total counts non-SKIP stages', async () => {
      const saved = saveStages(stagesModule);
      // Docker FAIL -> skip Neo4j, Graphiti, MCP, Canary. Env, Node.js Version, and Session Storage run OK.
      mockAllOk(stagesModule, {
        stageDocker: async () => failResult('fail'),
        stageEnvVars: async () => okResult('env ok'),
        stageNodeVersion: async () => okResult('Node.js OK'),
        stageSessionStorage: async () => okResult('Storage OK')
      });

      try {
        const result = await healthCheck.run([], false, true);
        // Non-SKIP stages: Docker (FAIL), Env Vars (OK), Node.js Version (OK), Session Storage (OK) = 4 total
        // Passed: Env Vars (OK) + Node.js Version (OK) + Session Storage (OK) = 3
        assert.strictEqual(result.summary.total, 4);
        assert.strictEqual(result.summary.passed, 3);
        assert.strictEqual(result.summary.ok, false);
      } finally {
        restoreStages(stagesModule, saved);
      }
    });
  });

  describe('Node.js Version stage', () => {
    it('Node.js Version stage runs independently (no dependencies)', async () => {
      // Mock all stages: Docker FAIL, all others OK
      // Node.js Version (index 6) should still run and return OK
      const saved = saveStages(stagesModule);
      mockAllOk(stagesModule, {
        stageDocker: async () => failResult('No containers'),
        stageNodeVersion: async () => okResult('Node.js OK')
      });

      try {
        const result = await healthCheck.run([], false, true);
        assert.strictEqual(result.stages[6].status, 'OK');
        assert.strictEqual(result.stages[6].name, 'Node.js Version');
      } finally {
        restoreStages(stagesModule, saved);
      }
    });
  });

  describe('Session Storage stage', () => {
    it('Session Storage stage runs independently (no dependencies)', async () => {
      // Mock all stages: Docker FAIL, all others OK
      // Session Storage (index 7) should still run and return OK
      const saved = saveStages(stagesModule);
      mockAllOk(stagesModule, {
        stageDocker: async () => failResult('No containers'),
        stageSessionStorage: async () => okResult('SQLite backend active')
      });

      try {
        const result = await healthCheck.run([], false, true);
        assert.strictEqual(result.stages[7].status, 'OK');
        assert.strictEqual(result.stages[7].name, 'Session Storage');
      } finally {
        restoreStages(stagesModule, saved);
      }
    });
  });
});

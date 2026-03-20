// Dynamo > Tests > health-check.test.cjs
'use strict';

const { describe, it, before, after, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const path = require('path');

// We test the orchestrator by mocking stage functions.
// The health-check module imports stages.cjs and calls the 6 health-check stage functions.
// We mock the stages module to control return values.

const healthCheckPath = path.join(__dirname, '..', '..', '..', 'subsystems', 'terminus', 'health-check.cjs');

// Helper: create mock stage results
function okResult(detail) { return { status: 'OK', detail: detail || 'ok', raw: '' }; }
function failResult(detail) { return { status: 'FAIL', detail: detail || 'failed', raw: '' }; }
function warnResult(detail) { return { status: 'WARN', detail: detail || 'warning', raw: '' }; }

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
      // Mock all stages to return OK
      const origDocker = stagesModule.stageDocker;
      const origNeo4j = stagesModule.stageNeo4j;
      const origGraphiti = stagesModule.stageGraphitiApi;
      const origMcp = stagesModule.stageMcpSession;
      const origEnv = stagesModule.stageEnvVars;
      const origCanary = stagesModule.stageCanaryWriteRead;

      stagesModule.stageDocker = async () => okResult('Docker OK');
      stagesModule.stageNeo4j = async () => okResult('Neo4j OK');
      stagesModule.stageGraphitiApi = async () => okResult('API OK');
      stagesModule.stageMcpSession = async () => okResult('MCP OK');
      stagesModule.stageEnvVars = async () => okResult('Env OK');
      stagesModule.stageCanaryWriteRead = async () => okResult('Canary OK');

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
        stagesModule.stageDocker = origDocker;
        stagesModule.stageNeo4j = origNeo4j;
        stagesModule.stageGraphitiApi = origGraphiti;
        stagesModule.stageMcpSession = origMcp;
        stagesModule.stageEnvVars = origEnv;
        stagesModule.stageCanaryWriteRead = origCanary;
      }
    });

    it('has exactly 6 stage entries', async () => {
      const origDocker = stagesModule.stageDocker;
      const origNeo4j = stagesModule.stageNeo4j;
      const origGraphiti = stagesModule.stageGraphitiApi;
      const origMcp = stagesModule.stageMcpSession;
      const origEnv = stagesModule.stageEnvVars;
      const origCanary = stagesModule.stageCanaryWriteRead;

      stagesModule.stageDocker = async () => okResult();
      stagesModule.stageNeo4j = async () => okResult();
      stagesModule.stageGraphitiApi = async () => okResult();
      stagesModule.stageMcpSession = async () => okResult();
      stagesModule.stageEnvVars = async () => okResult();
      stagesModule.stageCanaryWriteRead = async () => okResult();

      try {
        const result = await healthCheck.run([], false, true);
        assert.strictEqual(result.stages.length, 6);
      } finally {
        stagesModule.stageDocker = origDocker;
        stagesModule.stageNeo4j = origNeo4j;
        stagesModule.stageGraphitiApi = origGraphiti;
        stagesModule.stageMcpSession = origMcp;
        stagesModule.stageEnvVars = origEnv;
        stagesModule.stageCanaryWriteRead = origCanary;
      }
    });
  });

  describe('all stages pass', () => {
    it('summary.ok is true when all stages return OK', async () => {
      const origDocker = stagesModule.stageDocker;
      const origNeo4j = stagesModule.stageNeo4j;
      const origGraphiti = stagesModule.stageGraphitiApi;
      const origMcp = stagesModule.stageMcpSession;
      const origEnv = stagesModule.stageEnvVars;
      const origCanary = stagesModule.stageCanaryWriteRead;

      stagesModule.stageDocker = async () => okResult();
      stagesModule.stageNeo4j = async () => okResult();
      stagesModule.stageGraphitiApi = async () => okResult();
      stagesModule.stageMcpSession = async () => okResult();
      stagesModule.stageEnvVars = async () => okResult();
      stagesModule.stageCanaryWriteRead = async () => okResult();

      try {
        const result = await healthCheck.run([], false, true);
        assert.strictEqual(result.summary.ok, true);
        assert.strictEqual(result.summary.passed, result.summary.total);
      } finally {
        stagesModule.stageDocker = origDocker;
        stagesModule.stageNeo4j = origNeo4j;
        stagesModule.stageGraphitiApi = origGraphiti;
        stagesModule.stageMcpSession = origMcp;
        stagesModule.stageEnvVars = origEnv;
        stagesModule.stageCanaryWriteRead = origCanary;
      }
    });

    it('WARN stages still count as passed', async () => {
      const origDocker = stagesModule.stageDocker;
      const origNeo4j = stagesModule.stageNeo4j;
      const origGraphiti = stagesModule.stageGraphitiApi;
      const origMcp = stagesModule.stageMcpSession;
      const origEnv = stagesModule.stageEnvVars;
      const origCanary = stagesModule.stageCanaryWriteRead;

      stagesModule.stageDocker = async () => okResult();
      stagesModule.stageNeo4j = async () => okResult();
      stagesModule.stageGraphitiApi = async () => okResult();
      stagesModule.stageMcpSession = async () => okResult();
      stagesModule.stageEnvVars = async () => warnResult('OPENROUTER_API_KEY missing');
      stagesModule.stageCanaryWriteRead = async () => okResult();

      try {
        const result = await healthCheck.run([], false, true);
        assert.strictEqual(result.summary.ok, true);
        assert.strictEqual(result.summary.passed, 6);
      } finally {
        stagesModule.stageDocker = origDocker;
        stagesModule.stageNeo4j = origNeo4j;
        stagesModule.stageGraphitiApi = origGraphiti;
        stagesModule.stageMcpSession = origMcp;
        stagesModule.stageEnvVars = origEnv;
        stagesModule.stageCanaryWriteRead = origCanary;
      }
    });
  });

  describe('cascading skip - Docker failure', () => {
    it('when Docker fails, stages 2-4 and 6 are SKIP, stage 5 still runs', async () => {
      const origDocker = stagesModule.stageDocker;
      const origNeo4j = stagesModule.stageNeo4j;
      const origGraphiti = stagesModule.stageGraphitiApi;
      const origMcp = stagesModule.stageMcpSession;
      const origEnv = stagesModule.stageEnvVars;
      const origCanary = stagesModule.stageCanaryWriteRead;

      stagesModule.stageDocker = async () => failResult('No containers');
      stagesModule.stageNeo4j = async () => okResult('should not be called');
      stagesModule.stageGraphitiApi = async () => okResult('should not be called');
      stagesModule.stageMcpSession = async () => okResult('should not be called');
      stagesModule.stageEnvVars = async () => okResult('Env vars set');
      stagesModule.stageCanaryWriteRead = async () => okResult('should not be called');

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

        // Summary: ok is false
        assert.strictEqual(result.summary.ok, false);
      } finally {
        stagesModule.stageDocker = origDocker;
        stagesModule.stageNeo4j = origNeo4j;
        stagesModule.stageGraphitiApi = origGraphiti;
        stagesModule.stageMcpSession = origMcp;
        stagesModule.stageEnvVars = origEnv;
        stagesModule.stageCanaryWriteRead = origCanary;
      }
    });
  });

  describe('cascading skip - Neo4j failure', () => {
    it('when Neo4j fails but Docker OK, stages 3-4 and 6 SKIP, stages 1 and 5 show real results', async () => {
      const origDocker = stagesModule.stageDocker;
      const origNeo4j = stagesModule.stageNeo4j;
      const origGraphiti = stagesModule.stageGraphitiApi;
      const origMcp = stagesModule.stageMcpSession;
      const origEnv = stagesModule.stageEnvVars;
      const origCanary = stagesModule.stageCanaryWriteRead;

      stagesModule.stageDocker = async () => okResult('Docker running');
      stagesModule.stageNeo4j = async () => failResult('Neo4j down');
      stagesModule.stageGraphitiApi = async () => okResult('should not be called');
      stagesModule.stageMcpSession = async () => okResult('should not be called');
      stagesModule.stageEnvVars = async () => okResult('Env set');
      stagesModule.stageCanaryWriteRead = async () => okResult('should not be called');

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
      } finally {
        stagesModule.stageDocker = origDocker;
        stagesModule.stageNeo4j = origNeo4j;
        stagesModule.stageGraphitiApi = origGraphiti;
        stagesModule.stageMcpSession = origMcp;
        stagesModule.stageEnvVars = origEnv;
        stagesModule.stageCanaryWriteRead = origCanary;
      }
    });
  });

  describe('verbose flag', () => {
    it('--verbose flag is passed through to stage options', async () => {
      let capturedOptions = {};

      const origDocker = stagesModule.stageDocker;
      const origNeo4j = stagesModule.stageNeo4j;
      const origGraphiti = stagesModule.stageGraphitiApi;
      const origMcp = stagesModule.stageMcpSession;
      const origEnv = stagesModule.stageEnvVars;
      const origCanary = stagesModule.stageCanaryWriteRead;

      stagesModule.stageDocker = async (opts) => { capturedOptions = opts; return okResult(); };
      stagesModule.stageNeo4j = async () => okResult();
      stagesModule.stageGraphitiApi = async () => okResult();
      stagesModule.stageMcpSession = async () => okResult();
      stagesModule.stageEnvVars = async () => okResult();
      stagesModule.stageCanaryWriteRead = async () => okResult();

      try {
        await healthCheck.run(['--verbose'], false, true);
        assert.strictEqual(capturedOptions.verbose, true);
      } finally {
        stagesModule.stageDocker = origDocker;
        stagesModule.stageNeo4j = origNeo4j;
        stagesModule.stageGraphitiApi = origGraphiti;
        stagesModule.stageMcpSession = origMcp;
        stagesModule.stageEnvVars = origEnv;
        stagesModule.stageCanaryWriteRead = origCanary;
      }
    });
  });

  describe('summary counts', () => {
    it('passed counts non-SKIP stages with OK or WARN; total counts non-SKIP stages', async () => {
      const origDocker = stagesModule.stageDocker;
      const origNeo4j = stagesModule.stageNeo4j;
      const origGraphiti = stagesModule.stageGraphitiApi;
      const origMcp = stagesModule.stageMcpSession;
      const origEnv = stagesModule.stageEnvVars;
      const origCanary = stagesModule.stageCanaryWriteRead;

      // Docker FAIL -> skip Neo4j, Graphiti, MCP, Canary. Env runs OK.
      stagesModule.stageDocker = async () => failResult('fail');
      stagesModule.stageNeo4j = async () => okResult();
      stagesModule.stageGraphitiApi = async () => okResult();
      stagesModule.stageMcpSession = async () => okResult();
      stagesModule.stageEnvVars = async () => okResult('env ok');
      stagesModule.stageCanaryWriteRead = async () => okResult();

      try {
        const result = await healthCheck.run([], false, true);
        // Non-SKIP stages: Docker (FAIL), Env Vars (OK) = 2 total
        // Passed: Env Vars (OK) = 1
        assert.strictEqual(result.summary.total, 2);
        assert.strictEqual(result.summary.passed, 1);
        assert.strictEqual(result.summary.ok, false);
      } finally {
        stagesModule.stageDocker = origDocker;
        stagesModule.stageNeo4j = origNeo4j;
        stagesModule.stageGraphitiApi = origGraphiti;
        stagesModule.stageMcpSession = origMcp;
        stagesModule.stageEnvVars = origEnv;
        stagesModule.stageCanaryWriteRead = origCanary;
      }
    });
  });
});

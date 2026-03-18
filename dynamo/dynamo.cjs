#!/usr/bin/env node
// Dynamo > dynamo.cjs -- CLI router
'use strict';

const path = require('path');
const fs = require('fs');
const { output, error, safeReadFile } = require(path.join(__dirname, 'core.cjs'));

// --- Help ---

function showHelp() {
  const help = `
Dynamo — Unified CLI for the Dynamo memory system

Usage: node dynamo.cjs <command> [options]

Commands:
  health-check   Run 6-stage health check (Docker, Neo4j, API, MCP, env, canary)
  diagnose       Run all 13 diagnostic stages (deep system inspection)
  verify-memory  Run 6 pipeline checks (write, read, scope isolation, sessions)
  sync           Bidirectional sync between repo and live deployment
  start          Start the Graphiti Docker stack with health wait
  stop           Stop the Graphiti Docker stack (preserves data)
  install        Deploy CJS system to ~/.claude/dynamo/ and retire Python
  rollback       Restore settings.json.bak and undo retirement
  session        Session management (list, view, label, backfill)
  test           Run the Dynamo test suite
  version        Show Dynamo version
  help           Show this help message

Options:
  --pretty       Human-readable output (default: JSON)
  --verbose      Show detailed stage output
  --help         Show command-specific help

Examples:
  node dynamo.cjs health-check --pretty
  node dynamo.cjs sync repo-to-live --dry-run
  node dynamo.cjs session list --pretty
`.trim();
  process.stderr.write(help + '\n');
}

// --- Command-specific help ---

const COMMAND_HELP = {
  'health-check': 'Usage: dynamo health-check [--pretty] [--verbose]\n  Run 6-stage health check.',
  'diagnose':     'Usage: dynamo diagnose [--pretty] [--verbose]\n  Run all 13 diagnostic stages.',
  'verify-memory':'Usage: dynamo verify-memory [--pretty] [--verbose]\n  Run 6 pipeline checks.',
  'sync':         'Usage: dynamo sync <repo-to-live|live-to-repo|status> [--dry-run] [--pretty]\n  Bidirectional sync.',
  'start':        'Usage: dynamo start [--pretty]\n  Start Graphiti Docker stack.',
  'stop':         'Usage: dynamo stop [--pretty]\n  Stop Graphiti Docker stack.',
  'install':      'Usage: dynamo install [--pretty]\n  Deploy CJS system and retire Python.',
  'rollback':     'Usage: dynamo rollback [--pretty]\n  Restore settings.json.bak and undo retirement.',
  'session':      'Usage: dynamo session <list|view|label|backfill> [args] [--pretty]\n  Session management.',
  'test':         'Usage: dynamo test\n  Run the Dynamo test suite.',
  'version':      'Usage: dynamo version\n  Show Dynamo version.'
};

// --- Version ---

function showVersion() {
  const versionFile = path.join(__dirname, 'VERSION');
  const version = safeReadFile(versionFile) || 'unknown';
  output({ command: 'version', version: version.trim() });
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const pretty = args.includes('--pretty');
  const restArgs = args.slice(1).filter(a => a !== '--pretty');

  // No command or help
  if (!command || command === 'help' || command === '--help') {
    showHelp();
    return;
  }

  // Command-specific help
  if (restArgs.includes('--help')) {
    const helpText = COMMAND_HELP[command];
    if (helpText) {
      process.stderr.write(helpText + '\n');
    } else {
      process.stderr.write('No help available for: ' + command + '\n');
    }
    return;
  }

  switch (command) {
    case 'health-check':
      await require(path.join(__dirname, '..', 'switchboard', 'health-check.cjs')).run(restArgs, pretty);
      break;

    case 'diagnose':
      await require(path.join(__dirname, '..', 'switchboard', 'diagnose.cjs')).run(restArgs, pretty);
      break;

    case 'verify-memory':
      await require(path.join(__dirname, '..', 'switchboard', 'verify-memory.cjs')).run(restArgs, pretty);
      break;

    case 'sync':
      await require(path.join(__dirname, '..', 'switchboard', 'sync.cjs')).run(restArgs, pretty);
      break;

    case 'start':
      await require(path.join(__dirname, '..', 'switchboard', 'stack.cjs')).start(restArgs, pretty);
      break;

    case 'stop':
      await require(path.join(__dirname, '..', 'switchboard', 'stack.cjs')).stop(restArgs, pretty);
      break;

    case 'install':
      await require(path.join(__dirname, '..', 'switchboard', 'install.cjs')).run(restArgs, pretty);
      break;

    case 'rollback':
      await require(path.join(__dirname, '..', 'switchboard', 'install.cjs')).rollback(restArgs, pretty);
      break;

    case 'session': {
      const sessions = require(path.join(__dirname, '..', 'ledger', 'sessions.cjs'));
      const subCmd = restArgs[0];
      switch (subCmd) {
        case 'list':
          output({ command: 'session', subcommand: 'list', sessions: sessions.listSessions({ pretty }) });
          break;
        case 'view':
          output({ command: 'session', subcommand: 'view', session: sessions.viewSession(restArgs[1]) });
          break;
        case 'label':
          sessions.labelSession(restArgs[1], restArgs[2]);
          output({ command: 'session', subcommand: 'label', status: 'ok' });
          break;
        case 'backfill':
          await sessions.backfillSessions();
          output({ command: 'session', subcommand: 'backfill', status: 'ok' });
          break;
        default:
          error('Usage: dynamo session <list|view|label|backfill>');
      }
      break;
    }

    case 'test': {
      const { execSync } = require('child_process');
      const testDir = path.join(__dirname, 'tests');
      const cmd = 'node --test ' + path.join(testDir, '*.test.cjs') + ' ' + path.join(testDir, 'ledger', '*.test.cjs') + ' ' + path.join(testDir, 'switchboard', '*.test.cjs');
      execSync(cmd, { stdio: 'inherit' });
      break;
    }

    case 'version':
      showVersion();
      break;

    default:
      error('Unknown command: ' + command + '. Run "dynamo help" for usage.');
  }
}

main().catch(e => { error(e.message); process.exitCode = 1; });

# Architecture

**Generated:** 2026-03-20
**Context:** v1.3-M1 shipped -- six-subsystem architecture

## Architectural Pattern

**Modular CJS with shared substrate.** Six subsystems with strict boundary rules communicate through a shared `lib/` layer. No build step, no framework -- pure Node.js CJS modules.

## Six-Subsystem Model

```
                    +-----------------+
                    |    dynamo.cjs   |  CLI Router (25 commands)
                    +--------+--------+
                             |
              +--------------+--------------+
              |              |              |
    +---------v--+  +--------v---+  +-------v------+
    | Switchboard|  |    Assay   |  |   Terminus    |
    | (Ops)      |  | (Read)     |  | (Infra)      |
    +------------+  +------------+  +--------------+
         |               |              |
    install.cjs    search.cjs    health-check.cjs
    sync.cjs       sessions.cjs  diagnose.cjs
    update.cjs                   mcp-client.cjs
    update-check               session-store.cjs
                                 stack.cjs
                                 stages.cjs
                                 migrate.cjs
                                 verify-memory.cjs

    +---------+    +--------+    +--------+
    |  Ledger |    |Reverie |    |  cc/   |
    | (Write) |    | (M2)   |    | (Hook  |
    +---------+    +--------+    | Disp.) |
         |            stub       +--------+
    curation.cjs                dynamo-hooks.cjs
    episodes.cjs
    hooks/ (5 handlers)
```

## Subsystem Boundaries

| Subsystem | Boundary Rule | Directory |
|-----------|--------------|-----------|
| **Dynamo** | Routes commands; does not implement subsystem logic | `dynamo.cjs`, `dynamo/`, `lib/` |
| **Switchboard** | Manages lifecycle; does not implement handler logic | `subsystems/switchboard/` |
| **Ledger** | Writes data; never reads the knowledge graph | `subsystems/ledger/` |
| **Assay** | Reads data; never writes to the knowledge graph | `subsystems/assay/` |
| **Terminus** | Provides infrastructure; does not decide what flows through it | `subsystems/terminus/` |
| **Reverie** | Reads through Assay, writes through Ledger; owns intelligence | `subsystems/reverie/` (stub) |

**Import boundaries:** Subsystems import from `lib/` (shared substrate) but never cross-import from other subsystems.

## Shared Substrate (lib/)

| Module | Purpose |
|--------|---------|
| `lib/core.cjs` | Config loading, env vars, logging, prompt loading, toggle gate, health guard |
| `lib/resolve.cjs` | Centralized path resolver for all subsystem module locations |
| `lib/layout.cjs` | Layout paths (`getLayoutPaths`) and sync pairs (`getSyncPairs`) -- ARCH-04 |
| `lib/scope.cjs` | Scope constants (SCOPE), validation (validateGroupId), sanitization |
| `lib/pretty.cjs` | Human-readable output formatting for CLI commands |
| `lib/dep-graph.cjs` | Static circular dependency detector with allowlist |

## Data Flow

### Hook Path (automatic, event-driven)

```
Claude Code hook event
  -> JSON on stdin
  -> cc/hooks/dynamo-hooks.cjs (dispatcher)
     -> toggle gate check
     -> input validation (MGMT-08a)
     -> boundary markers (MGMT-08b)
     -> route to subsystems/ledger/hooks/{handler}.cjs
        -> MCPClient (subsystems/terminus/mcp-client.cjs)
           -> Graphiti MCP Server
              -> Neo4j
```

### CLI Path (user-invoked)

```
node dynamo.cjs <command> [args]
  -> switch/case router
  -> resolve handler via lib/resolve.cjs
  -> delegate to subsystem module
     -> MCPClient if graph access needed
```

### Session Storage Path

```
Session events
  -> subsystems/assay/sessions.cjs (interface)
     -> subsystems/terminus/session-store.cjs (SQLite)
     -> ~/.claude/graphiti/sessions.json (JSON backup)
```

## Entry Points

| Entry Point | Type | File |
|-------------|------|------|
| CLI | User command | `dynamo.cjs` |
| Hook Dispatcher | Claude Code hook | `cc/hooks/dynamo-hooks.cjs` |

## Key Architectural Decisions

- **No dual-layout detection** -- deployed layout mirrors repo layout exactly (since Phase 19)
- **Single source of truth** -- `lib/layout.cjs` defines all paths and sync pairs
- **Options-based injection** -- all modules accept options for test isolation
- **Graceful degradation** -- hooks exit 0 always, log errors silently
- **Foreground execution** -- hooks run synchronously with timeouts

---
*Architecture analysis for: Dynamo v1.3-M1*

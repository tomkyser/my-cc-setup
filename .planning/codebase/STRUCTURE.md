# Directory Structure

**Generated:** 2026-03-20
**Context:** v1.3-M1 shipped -- six-subsystem architecture

## Repository Layout

```
dynamo/                                 # Repository root
  dynamo.cjs                            # CLI router (25 commands, 422 LOC)
  dynamo/                               # Meta directory
    config.json                         # Runtime configuration
    VERSION                             # Semantic version (0.1.0)
    migrations/                         # Version-keyed migration scripts
      README.md
  cc/                                   # Claude Code platform adapter
    hooks/
      dynamo-hooks.cjs                  # Hook dispatcher (input validation, boundary markers)
    prompts/                            # Curation prompt templates
      curation.md                       # Memory curation system/user prompts
      precompact.md                     # Pre-compaction summary prompts
      prompt-context.md                 # Prompt augmentation prompts
      session-name.md                   # Session auto-naming prompts
      session-summary.md                # Session summary prompts
    settings-hooks.json                 # Hook registration template
    CLAUDE.md.template                  # Deployed CLAUDE.md template
  lib/                                  # Shared substrate
    core.cjs                            # Config, env, logging, toggle, health guard
    resolve.cjs                         # Centralized path resolver
    layout.cjs                          # Layout paths and sync pair definitions
    scope.cjs                           # Scope constants and validation
    pretty.cjs                          # Output formatting
    dep-graph.cjs                       # Dependency graph cycle detector
  subsystems/
    switchboard/                        # Operations subsystem
      install.cjs                       # 10-step installer
      sync.cjs                          # Bidirectional sync (8 pairs)
      update.cjs                        # Update with rollback
      update-check.cjs                  # GitHub Releases API check
    assay/                              # Data access subsystem (read-only)
      search.cjs                        # Combined/fact/node graph search
      sessions.cjs                      # Session management (SQLite delegation)
    ledger/                             # Data construction subsystem (write-only)
      curation.cjs                      # Haiku curation pipeline
      episodes.cjs                      # Episode add/extract
      hooks/                            # 5 hook handlers
        capture-change.cjs              # PostToolUse: file change capture
        preserve-knowledge.cjs          # PreCompact: knowledge preservation
        prompt-augment.cjs              # UserPromptSubmit: semantic search
        session-start.cjs               # SessionStart: context injection
        session-summary.cjs             # Stop: session summary
    terminus/                           # Data infrastructure subsystem
      mcp-client.cjs                    # MCPClient + SSE parsing
      health-check.cjs                  # 8-stage health check
      diagnose.cjs                      # 13-stage diagnostics
      stages.cjs                        # Stage runner framework
      session-store.cjs                 # SQLite session storage (node:sqlite)
      stack.cjs                         # Docker start/stop
      migrate.cjs                       # Migration harness
      verify-memory.cjs                 # Memory pipeline verification
    reverie/                            # Inner Voice subsystem (M2 stub)
      .gitkeep
  dynamo/tests/                         # All test files
    *.test.cjs                          # 14 root-level test files
    ledger/                             # 7 Ledger-subsystem test files
    switchboard/                        # 11 Switchboard/Terminus test files
```

## Deployed Layout

The installer (`subsystems/switchboard/install.cjs`) copies this structure to `~/.claude/dynamo/`, mirroring the repo layout exactly:

```
~/.claude/dynamo/
  dynamo.cjs
  dynamo/config.json, VERSION, migrations/
  cc/hooks/, cc/prompts/
  lib/core.cjs, resolve.cjs, layout.cjs, scope.cjs, pretty.cjs
  subsystems/switchboard/, assay/, ledger/, terminus/, reverie/
```

Tests and planning files are excluded from deployment.

## Sync Pairs (8 total)

Defined in `lib/layout.cjs` via `getSyncPairs()`:

| Label | Repo Path | Deployed Path |
|-------|-----------|---------------|
| root | `./` (files only) | `~/.claude/dynamo/` |
| dynamo-meta | `dynamo/` | `~/.claude/dynamo/dynamo/` |
| switchboard | `subsystems/switchboard/` | `~/.claude/dynamo/subsystems/switchboard/` |
| assay | `subsystems/assay/` | `~/.claude/dynamo/subsystems/assay/` |
| ledger | `subsystems/ledger/` | `~/.claude/dynamo/subsystems/ledger/` |
| terminus | `subsystems/terminus/` | `~/.claude/dynamo/subsystems/terminus/` |
| cc | `cc/` | `~/.claude/dynamo/cc/` |
| lib | `lib/` | `~/.claude/dynamo/lib/` |

## File Counts

| Category | Count | LOC |
|----------|-------|-----|
| Production modules | 27 | ~5,335 |
| Test files | 28 | ~6,500 |
| Prompt templates | 5 | ~120 |
| Config/meta | 3 | ~30 |

## Naming Conventions

- **File names:** kebab-case (e.g., `session-store.cjs`, `health-check.cjs`)
- **Branding header:** Every `.cjs` file starts with `// Dynamo > Subsystem > filename.cjs`
- **Test files:** Same name as module + `.test.cjs` suffix
- **Test subdirectories:** Mirror subsystem names (`ledger/`, `switchboard/`)

---
*Structure analysis for: Dynamo v1.3-M1*

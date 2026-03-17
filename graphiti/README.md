# Graphiti Memory System for Claude Code

A temporal knowledge graph that gives Claude Code persistent memory across sessions using [Graphiti](https://github.com/getzep/graphiti) and Neo4j.

## What This Does

- **Persistent memory**: Claude Code remembers decisions, patterns, and context across sessions
- **Session management**: List, view, label, and auto-name sessions
- **Health monitoring**: Diagnostic tools to verify the full memory pipeline
- **Hook integration**: Automatic memory capture on file changes, session start/end, and context preservation

## Prerequisites

- Docker and Docker Compose
- Python 3.10+
- Claude Code CLI (`claude`)
- An OpenAI API key (for Graphiti's LLM-powered entity extraction)
- An OpenRouter API key (optional, for Haiku-powered session naming and context curation)

## Quick Start

1. **Clone and configure:**
   ```bash
   git clone <repo-url>
   cd <repo-name>
   cp graphiti/.env.example graphiti/.env
   # Edit graphiti/.env with your API keys
   ```

2. **Run the installer:**
   ```bash
   ./install.sh
   ```
   This copies files to `~/.claude/graphiti/`, sets up a Python venv, installs dependencies, and registers the Graphiti MCP server.

3. **Start the Docker stack:**
   ```bash
   ~/.claude/graphiti/start-graphiti.sh
   ```
   This starts the Graphiti server and Neo4j database.

4. **Register hooks in Claude Code:**
   Merge the hook configuration from `claude-config/settings-hooks.json` into your `~/.claude/settings.json`. The hooks section maps Claude Code lifecycle events to the shell scripts in `~/.claude/graphiti/hooks/`.

5. **Verify the installation:**
   ```bash
   ~/.claude/graphiti/.venv/bin/python3 ~/.claude/graphiti/graphiti-helper.py verify-memory
   ```
   You should see `PASS: Memory system healthy` with all checks green.

## File Structure

| File | Purpose |
|------|---------|
| `graphiti-helper.py` | CLI bridge with 12 subcommands (search, add-episode, session management, verify-memory) |
| `diagnose.py` | 13-stage deep diagnostic for debugging pipeline issues |
| `health-check.py` | 6-stage quick health check with canary round-trip |
| `docker-compose.yml` | Graphiti server + Neo4j database stack |
| `config.yaml` | Graphiti server configuration |
| `.env.example` | Template for API keys and passwords |
| `SCOPE_FALLBACK.md` | Documents the scope format constraint and fallback strategy |
| `start-graphiti.sh` | Start the Docker stack |
| `stop-graphiti.sh` | Stop the Docker stack |
| `curation/prompts.yaml` | Haiku prompt templates for curation and session naming |
| `hooks/` | 6 hook scripts for Claude Code lifecycle events |

## Hooks

| Hook Script | Claude Code Event | What It Does |
|-------------|-------------------|--------------|
| `session-start.sh` | SessionStart | Loads relevant memories for the current project |
| `prompt-augment.sh` | UserPromptSubmit | Searches for relevant context; generates preliminary session name |
| `capture-change.sh` | PostToolUse (Write/Edit) | Records file changes to the knowledge graph |
| `preserve-knowledge.sh` | PreCompact | Saves key knowledge before context compression |
| `session-summary.sh` | Stop | Summarizes the session and stores it; generates refined session name |
| `health-check.sh` | (manual) | Shell wrapper for health-check.py |

## Session Management

```bash
# List all sessions
graphiti-helper.py list-sessions --all

# View a specific session
graphiti-helper.py view-session --timestamp 2026-03-17T04:00:00Z

# Label a session
graphiti-helper.py label-session --timestamp 2026-03-17T04:00:00Z --label "Fixed auth bug"

# Backfill session index from Graphiti
graphiti-helper.py backfill-sessions
```

## Troubleshooting

```bash
# Quick health check
graphiti-helper.py verify-memory

# Deep diagnostic (13 stages)
~/.claude/graphiti/.venv/bin/python3 ~/.claude/graphiti/diagnose.py

# Check hook error log
cat ~/.claude/graphiti/hook-errors.log

# Verbose mode for debugging
GRAPHITI_VERBOSE=1 graphiti-helper.py add-episode --text "test"
```

## Syncing Changes

If you modify files in `~/.claude/graphiti/` (live) and want to update this repo:

```bash
./sync-graphiti.sh status          # See what differs
./sync-graphiti.sh live-to-repo    # Copy live to repo
git diff                            # Review changes
git add -p graphiti/                # Stage selectively
```

To deploy repo changes to live:

```bash
./sync-graphiti.sh repo-to-live    # Copy repo to live
```

If both sides have changes, the script will show a conflict warning and exit. Use `--force` to override:

```bash
./sync-graphiti.sh live-to-repo --force   # Overwrite repo with live (ignoring repo changes)
```

## Known Limitations

- **Scope format**: Graphiti v1.21.0 rejects colons in `group_id`. All data uses dash separators (e.g., `project-my-cc-setup`). See `SCOPE_FALLBACK.md`.
- **Canary delay**: Write-then-read verification may show WARN due to Graphiti's async indexing (1-3 second delay). This is not a failure.
- **No delete API**: Graphiti MCP does not expose an episode deletion tool. Canary test data is left to natural entity resolution cleanup.

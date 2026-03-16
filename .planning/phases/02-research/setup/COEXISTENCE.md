# Coexistence Strategy — Global Scope Tool Harmony

> **Audience:** Dual — structured for Claude Code to execute commands from, readable for user to review.
>
> **Verified against:** `~/.claude.json` and `~/.claude/settings.json` as of 2026-03-16.

---

## Overview

Multiple tools share the `~/.claude/` namespace. Without coordination, they can silently overwrite each other's hook registrations, MCP server names, plugin identifiers, and skills folders. This document maps the current state of all namespaces, identifies interaction risks, and defines prerequisites before adding any new global tool.

**Current global tools:**
1. **Claude Code (CC)** — config owner for `~/.claude.json` and `~/.claude/settings.json`
2. **GSD (Get-Shit-Done)** — planning framework installed at `~/.claude/get-shit-done/`
3. **Graphiti** — temporal knowledge graph with hooks at `~/.claude/graphiti/`

---

## Config File Map

| File / Directory | Owner | Contents | Modified By |
|-----------------|-------|----------|-------------|
| `~/.claude.json` | CC core | `mcpServers` (global), `numStartups`, `autoUpdates`, `projects` (per-project settings), user ID | `claude mcp add/remove` only — never hand-edit |
| `~/.claude/settings.json` | CC core | `hooks`, `permissions`, `env`, `model`, `enabledPlugins`, `statusLine`, `effortLevel` | Edit file directly (structured JSON); GSD and Graphiti both write to this file during setup |
| `~/.claude/get-shit-done/` | GSD | Workflows, references, templates, bin/gsd-tools.cjs, VERSION | GSD installer (`npx get-shit-done-cc`) |
| `~/.claude/commands/gsd/` | GSD | 38 slash commands | GSD installer |
| `~/.claude/agents/gsd-*` | GSD | Agent markdown files (executor, planner, verifier, etc.) | GSD installer |
| `~/.claude/hooks/gsd-*.js` | GSD | Hook scripts: gsd-check-update.js, gsd-context-monitor.js, gsd-statusline.js | GSD installer |
| `~/.claude/graphiti/` | Graphiti | Docker-compose stack, config files, hook shell scripts | Manual setup / Graphiti docs |
| `~/.claude/hooks/` (non-gsd) | Mixed | Graphiti hooks registered here via settings.json paths | Graphiti setup; GSD adds gsd-*.js here |
| `~/.claude/cache/` | CC / GSD | GSD stores `gsd-update-check.json` here | GSD hook (gsd-check-update.js) |

---

## Hook Namespace

All hooks registered in `~/.claude/settings.json` as of 2026-03-16, organized by event:

### SessionStart (3 hooks)

| Matcher | Tool | Command | Timeout |
|---------|------|---------|---------|
| `startup\|resume` | Graphiti | `$HOME/.claude/graphiti/hooks/session-start.sh` | 30s |
| `compact` | Graphiti | `$HOME/.claude/graphiti/hooks/session-start.sh` | 30s |
| *(no matcher — runs always)* | GSD | `node "/Users/tom.kyser/.claude/hooks/gsd-check-update.js"` | none set |

### UserPromptSubmit (1 hook)

| Matcher | Tool | Command | Timeout |
|---------|------|---------|---------|
| *(no matcher — runs always)* | Graphiti | `$HOME/.claude/graphiti/hooks/prompt-augment.sh` | 15s |

### PostToolUse (2 hooks)

| Matcher | Tool | Command | Timeout |
|---------|------|---------|---------|
| `Write\|Edit\|MultiEdit` | Graphiti | `$HOME/.claude/graphiti/hooks/capture-change.sh` | 10s |
| *(no matcher — runs always)* | GSD | `node "/Users/tom.kyser/.claude/hooks/gsd-context-monitor.js"` | none set |

### PreCompact (1 hook)

| Matcher | Tool | Command | Timeout |
|---------|------|---------|---------|
| *(no matcher — runs always)* | Graphiti | `$HOME/.claude/graphiti/hooks/preserve-knowledge.sh` | 30s |

### Stop (1 hook)

| Matcher | Tool | Command | Timeout |
|---------|------|---------|---------|
| *(no matcher — runs always)* | Graphiti | `$HOME/.claude/graphiti/hooks/session-summary.sh` | 30s |

**Total registered hooks: 8**

**Status line:** Managed by GSD — `node "/Users/tom.kyser/.claude/hooks/gsd-statusline.js"`

---

## MCP Server Namespace

Registered in `~/.claude.json` under `mcpServers`:

| Server Name | Type | URL / Command | Owner |
|-------------|------|---------------|-------|
| `graphiti` | `http` | `http://localhost:8100/mcp` | Graphiti |

**Naming convention in use:** Tools use their own name as the server key (e.g., `graphiti` → Graphiti tool). This is simple but leaves no room for name collisions if two tools happen to share a name.

**Current MCP tool permissions** (in `settings.json` allow list):
- `mcp__graphiti__add_memory`
- `mcp__graphiti__search_nodes`
- `mcp__graphiti__search_memory_facts`
- `mcp__graphiti__get_episodes`
- `mcp__graphiti__delete_episode`
- `mcp__graphiti__get_entity_edge`
- `mcp__graphiti__get_status`

---

## Plugin Namespace

From `~/.claude/settings.json` `enabledPlugins`:

| Plugin ID | Status | Owner |
|-----------|--------|-------|
| `plugin-dev@claude-plugins-official` | enabled | CC official |

**Naming convention:** Official plugins use format `plugin-name@registry-namespace`. Third-party plugins risk collision if they omit the `@scope` suffix.

---

## Skills Namespace

Skills live in `~/.claude/skills/` (global) or `.claude/skills/` (project-level). No skills are currently registered globally in this installation.

**Convention:** Use descriptive, unique subfolder names. If two tools both install a skill called `research/`, the second install silently overwrites the first.

---

## Interaction Risks

| # | Risk | Trigger | Current Status | Mitigation |
|---|------|---------|----------------|------------|
| 1 | **mcpServers key collision** | Two tools register an MCP server with the same key in `~/.claude.json` | Low risk today (only `graphiti`) | Use namespaced server names (e.g., `graphiti-neo4j` not `graphiti`); check existing keys before adding |
| 2 | **Hook timeout cascade** | Multiple hooks on the same event; one slow hook delays all subsequent hooks and may cause CC to appear hung | Moderate risk — SessionStart has 3 hooks; Graphiti hooks have timeouts (30s/15s/10s), GSD hooks have none set | Set explicit timeouts on all hooks; keep hook scripts fast (< 5s) |
| 3 | **enabledPlugins collision** | Two tools register a plugin with the same identifier | Low risk today (one plugin) | Use scoped plugin IDs (`name@scope`); verify no collision before enabling |
| 4 | **skills/ subfolder collision** | Two tools install a skill with the same subfolder name | No skills currently installed globally | Use unique descriptive subfolder names; never use generic names like `research/` or `writing/` |
| 5 | **PATH not set for stdio MCPs** | stdio MCP servers require PATH to be set in the `env` block of `settings.json`; without it, the process spawned for the MCP cannot find node, python, or other executables | **CRITICAL — PATH is not in the current env block** | See critical finding below |

### Critical Finding: PATH Not Configured

The current `~/.claude/settings.json` `env` block contains:

```json
"env": {
  "DISABLE_TELEMETRY": "1",
  "DISABLE_ERROR_REPORTING": "1",
  "CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY": "1",
  "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
  "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "64000"
}
```

**PATH is absent.** The current `graphiti` MCP uses `type: "http"` (no subprocess), so it works without PATH. However, any stdio MCP added in the future (which spawns a subprocess) will fail silently or with confusing errors if PATH is not set.

**Prerequisite before adding any stdio MCP:** Add PATH to the `env` block:

```json
"PATH": "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
```

This ensures node, python, and Homebrew-installed executables are findable by MCP subprocesses.

---

## Prerequisites for Adding New Global Tools

Before registering any new global tool (MCP, plugin, hook-based tool, or skill set):

1. **Check ANTI-FEATURES.md pre-filter**
   Path: `.planning/phases/01-methodology/ANTI-FEATURES.md`
   Action: Verify the tool does not appear on the exclusion list before spending time on assessment.

2. **Verify MCP server name doesn't collide**
   Check existing keys:
   ```bash
   cat ~/.claude.json | grep -A5 '"mcpServers"'
   ```
   Action: Choose a unique, namespaced server name if the tool registers an MCP server.

3. **If the tool uses a stdio MCP: ensure PATH is set**
   Check current env block:
   ```bash
   grep -A10 '"env"' ~/.claude/settings.json
   ```
   If PATH is absent, add it before proceeding:
   ```json
   "PATH": "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
   ```

4. **If the tool registers hooks: verify no matcher conflicts**
   Review existing hook matchers for the target event in `~/.claude/settings.json`.
   Action: Confirm the new hook's matcher is either distinct from existing ones, or intentionally overlaps (and that overlap is acceptable).

5. **If the tool installs skills: use a unique subfolder**
   Check for existing global skills:
   ```bash
   ls ~/.claude/skills/ 2>/dev/null || echo "no global skills"
   ```
   Action: Name the subfolder after the specific tool or domain (e.g., `context7-wp/` not `wordpress/`).

6. **If the tool enables plugins: check for ID collision**
   Check current plugins:
   ```bash
   grep -A5 '"enabledPlugins"' ~/.claude/settings.json
   ```
   Action: Use scoped plugin IDs (`name@registry`).

# Scope Format: Dash Separators

**Date:** 2026-03-17
**Status:** RESOLVED — proper project scoping works with dash separator

## Constraint

Graphiti MCP server v1.21.0 validates `group_id` values and rejects any containing
characters outside alphanumeric, dashes, and underscores.

## Solution

Use dash instead of colon as the scope separator:

| Scope | Format | Example |
|-------|--------|---------|
| Global | `global` | `global` |
| Project | `project-{name}` | `project-my-cc-setup` |
| Session | `session-{timestamp}` | `session-2026-03-17T03:28:25Z` |
| Task | `task-{descriptor}` | `task-fix-auth` |

## Verification

- diagnose.py: 10/10 stages pass (including project-scope write + read)
- Scope isolation confirmed: project-scoped facts are NOT visible in global scope
- All hooks updated to use `project-{name}` format
- Read hooks (session-start.sh, prompt-augment.sh) updated to search `project-{name}`
- CLAUDE.md scope table updated

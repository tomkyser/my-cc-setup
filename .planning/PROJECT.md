# Claude Code Global Setup Enhancers

## What This Is

A research project to identify, vet, and rank the best MCPs, CLI tools, and Claude Code plugins that enhance general-purpose Claude Code capabilities. The deliverable is a ranked report of 5-8 tools that are actively maintained, community-trusted, and can be fully self-managed by Claude Code — installed in the global `~/.claude` scope so they're available across all projects.

## Core Value

Every recommended tool must be self-manageable by Claude Code (install, configure, update, troubleshoot) without requiring manual user intervention in config files.

## Requirements

### Validated

- ✓ Graphiti MCP for memory/knowledge graph — existing, fully operational
- ✓ DDEV + Docker local dev environment — existing
- ✓ GSD framework for project planning/execution — existing

### Active

<!-- v1.1: Fix Memory System -->
- [ ] Diagnose why Graphiti memory hooks fail silently (appear to work but don't persist data)
- [ ] Diagnose why project-scoped memories are not being stored
- [ ] Fix hook reliability — ensure MCP calls succeed or surface errors visibly
- [ ] Verify memory system works end-to-end across sessions and projects

### Out of Scope

- Memory/knowledge graph MCPs — already solved with Graphiti
- Project-specific or workflow-specific tools — this is general-purpose only
- Per-project configuration — everything lives in global scope (~/.claude)
- Database/SQL access MCPs — not requested
- Installation or configuration of chosen tools — research only, install later
- Abandoned tools — no updates within the past month disqualifies

## Context

- User is a full-stack developer, primarily WordPress/PHP projects on macOS
- Current setup: Claude Code with Graphiti MCP, GSD framework, DDEV/Docker, zsh shell, Homebrew
- Previously used superclaude framework and its bundled MCPs
- Happy with current memory setup — not looking for memory alternatives
- Looking for enhancers in categories like: language references, documentation lookup, linting, formatting, code quality, dev tooling
- All tools must be global-scope (not per-project)

## Constraints

- **Maintenance**: Tool must have commits within the past month (as of March 2026)
- **Trust**: Must have meaningful GitHub stars/community adoption
- **Self-management**: Claude Code must be able to fully manage the tool lifecycle (install, configure, update, troubleshoot) without user touching config files
- **Quantity**: Final recommendations capped at 5-8 tools
- **Scope**: Global only — lives in ~/.claude or global config, available to all projects
- **Platform**: macOS (Darwin), zsh, Homebrew available

## Current Milestone: v1.1 Fix Memory System

**Goal:** Diagnose and fix the Graphiti memory system — hooks appear to work but silently fail to persist data, especially for project-scoped memories.

**Target features:**
- Root cause diagnosis of silent hook failures
- Fix hook → Graphiti MCP data persistence pipeline
- Error visibility when memory operations fail
- End-to-end verification that memories persist across sessions and projects

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Research only, no install | User wants vetted list first, will install later | — Pending |
| Global scope only | Tools should be universally available, not per-project | — Pending |
| Full lifecycle self-management | User never wants to manually edit config files for these tools | — Pending |
| Lean final list (5-8) | Quality over quantity — only the best earn a spot | — Pending |

---
*Last updated: 2026-03-16 after milestone v1.1 start*

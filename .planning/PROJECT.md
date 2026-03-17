# Claude Code Global Setup Enhancers

## What This Is

A research and implementation project for enhancing Claude Code's global capabilities. v1.0 produced a ranked report of vetted MCPs and tools. v1.1 diagnosed and fixed the Graphiti memory system — hooks now persist data reliably, sessions are navigable, and the system is verified end-to-end.

## Core Value

Every recommended tool must be self-manageable by Claude Code (install, configure, update, troubleshoot) without requiring manual user intervention in config files.

## Requirements

### Validated

- ✓ Graphiti MCP for memory/knowledge graph — existing, fully operational
- ✓ DDEV + Docker local dev environment — existing
- ✓ GSD framework for project planning/execution — existing
- ✓ Vetting protocol with 4 binary hard gates — v1.0
- ✓ Anti-features list with named exclusions — v1.0
- ✓ Ranked report with 5 primary + 2 conditional tool recommendations — v1.0
- ✓ Root cause diagnosis of silent hook failures (GRAPHITI_GROUP_ID override) — v1.1
- ✓ Root cause diagnosis of missing project-scoped memories — v1.1
- ✓ Hook reliability: all hooks persist or visibly fail, with error logging — v1.1
- ✓ Session management: list, view, label, auto-name via CLI — v1.1
- ✓ Memory system verified end-to-end with verify-memory command — v1.1
- ✓ Bidirectional sync between live ~/.claude and this repo — v1.1

### Active

(None — planning next milestone)

### Out of Scope

- Memory/knowledge graph MCPs — already solved with Graphiti
- Project-specific or workflow-specific tools — general-purpose only
- Per-project configuration — everything lives in global scope (~/.claude)
- Database/SQL access MCPs — not requested
- Memory system redesign — fixed, not redesigned
- Real-time chat/notification for errors — visible error output is sufficient

## Context

Shipped v1.0 (research) and v1.1 (memory fixes) across 7 phases and 16 plans.
Tech stack: Python (graphiti-helper.py, diagnose.py, health-check.py), Bash (hooks, sync), Claude Haiku (session naming via OpenRouter).
Total project: ~22,700 LOC across Python, Bash, Markdown, JSON, YAML.
Memory system is now healthy: hooks persist data, errors surface visibly, sessions auto-name.

Future requirements identified in v1.0 research (hook enhancements, memory quality, web research tools, WordPress MCP) are documented in the v1.1 requirements archive.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Research only, no install | User wants vetted list first, will install later | ✓ Good — clean separation |
| Global scope only | Tools should be universally available, not per-project | ✓ Good |
| Full lifecycle self-management | User never wants to manually edit config files | ✓ Good |
| Lean final list (5-8) | Quality over quantity | ✓ Good — 5+2 recommendations |
| Diagnostic-first milestone (v1.1) | Fix memory before adding features | ✓ Good — root causes found and fixed |
| Global scope + [project] content prefix | Graphiti v1.21.0 rejects colon in group_id | ✓ Good — workaround documented in SCOPE_FALLBACK.md |
| Two-phase auto-naming via Haiku | Cost-efficient (~$0.001/call) with graceful degradation | ✓ Good |
| Foreground hook execution with 5s timeout | Error capture requires foreground; fast timeout prevents blocking | ✓ Good |

## Constraints

- **Maintenance**: Tool must have commits within the past month (as of March 2026)
- **Trust**: Must have meaningful GitHub stars/community adoption
- **Self-management**: Claude Code must be able to fully manage the tool lifecycle
- **Quantity**: Final recommendations capped at 5-8 tools
- **Scope**: Global only — lives in ~/.claude or global config
- **Platform**: macOS (Darwin), zsh, Homebrew available

---
*Last updated: 2026-03-17 after v1.1 milestone*

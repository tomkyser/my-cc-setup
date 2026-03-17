# Dynamo

## What This Is

A Claude Code power-user platform comprising two systems: **Ledger** (memory — knowledge storage, retrieval, inference) and **Switchboard** (management — hooks, skills, agents, dependencies). v1.0 researched and ranked tools. v1.1 diagnosed and fixed the Graphiti-based memory system. v1.2 rebuilds the foundation on Node/CJS architecture with feature parity, establishing the substrate both systems build on.

## Core Value

Every capability must be self-manageable by Claude Code (install, configure, update, troubleshoot) without requiring manual user intervention in config files.

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

- [ ] CJS architectural foundation (shared substrate for Ledger + Switchboard)
- [ ] Dynamo/Ledger/Switchboard branding and project restructure
- [ ] Modular injection pattern established
- [ ] Feature parity: existing hooks, session mgmt, health checks, sync on CJS
- [ ] Master Roadmap: prioritize and assign backlog to v1.3–v2.0

### Out of Scope

- New memory features (decision engine, preload engine) — deferred to v1.3+
- UI/dashboard — deferred to v1.4+
- Domain-specific skills/agents (WPCS, Context7, Playwright) — deferred to v1.3+
- Council-style AI deliberation — deferred, needs research
- Database/SQL access MCPs — not requested
- Real-time chat/notification for errors — visible error output is sufficient

## Current Milestone: v1.2 Dynamo Foundation

**Goal:** Rewrite the Python/Bash foundation to Node/CJS architecture with full feature parity, establishing the shared substrate for Ledger (memory) and Switchboard (management).

**Target features:**
- CJS architectural foundation (modular, testable, GSD-pattern)
- Dynamo/Ledger/Switchboard branding and identity
- Modular injection pattern for hooks and capabilities
- Feature parity with existing system on new architecture
- Master Roadmap document for v1.3–v2.0

## Context

Shipped v1.0 (research) and v1.1 (memory fixes) across 7 phases and 16 plans.
Current tech stack: Python (graphiti-helper.py, diagnose.py, health-check.py), Bash (hooks, sync), Claude Haiku (session naming via OpenRouter).
Total project: ~22,700 LOC across Python, Bash, Markdown, JSON, YAML.
Memory system is now healthy: hooks persist data, errors surface visibly, sessions auto-name.

v1.2 migrates to Node/CJS architecture following GSD patterns (see github.com/gsd-build/get-shit-done).
Project rebranded: **Dynamo** (umbrella), **Ledger** (memory system), **Switchboard** (management system).
Ledger = what Claude knows. Switchboard = how Claude behaves. Independently upgradeable, connected via shared CJS substrate.

Future backlog (hook enhancements, memory quality, web research tools, WordPress MCP, UI, domain skills) documented in Master Roadmap and v1.1 requirements archive.

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
| Rebrand to Dynamo/Ledger/Switchboard | Separate memory (Ledger) from management (Switchboard) for independent evolution | — Pending |
| CJS rewrite over Python/Bash | GSD-pattern CJS is proven, modular, testable; unifies tech stack | — Pending |
| Feature parity before new features | Stable foundation first, new capabilities in v1.3+ | — Pending |

## Constraints

- **Maintenance**: Tool must have commits within the past month (as of March 2026)
- **Trust**: Must have meaningful GitHub stars/community adoption
- **Self-management**: Claude Code must be able to fully manage the tool lifecycle
- **Quantity**: Final recommendations capped at 5-8 tools
- **Scope**: Global only — lives in ~/.claude or global config
- **Platform**: macOS (Darwin), zsh, Homebrew available

---
*Last updated: 2026-03-17 after v1.2 milestone start*

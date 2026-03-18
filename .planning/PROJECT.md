# Dynamo

## What This Is

A Claude Code power-user platform comprising two systems: **Ledger** (memory — knowledge storage, retrieval, inference via Graphiti) and **Switchboard** (management — hooks, diagnostics, sync, stack, CLI). Built on a Node/CJS shared substrate at `~/.claude/dynamo/` with 272 passing tests. v1.0 researched and ranked tools. v1.1 diagnosed and fixed the memory system. v1.2 rewrote the entire foundation from Python/Bash to CJS with full feature parity.

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
- ✓ CJS architectural foundation (shared substrate for Ledger + Switchboard) — v1.2
- ✓ Dynamo/Ledger/Switchboard branding and project restructure — v1.2
- ✓ Modular injection pattern established — v1.2
- ✓ Feature parity: existing hooks, session mgmt, health checks, sync on CJS — v1.2
- ✓ Master Roadmap: prioritize and assign backlog to v1.3-v2.0 — v1.2

### Active

(None — next milestone requirements defined via `/gsd:new-milestone`)

### Out of Scope

- Database/SQL access MCPs — not requested
- Real-time chat/notification for errors — visible error output is sufficient
- ESM modules — CJS is the standard in this ecosystem

## Context

Shipped v1.0 (research), v1.1 (memory fixes), and v1.2 (CJS rewrite) across 11 phases and 24 plans.
Tech stack: Node/CJS (dynamo/), Docker (Graphiti stack), Claude Haiku (session naming via OpenRouter).
Total project: ~7,000 LOC CJS (3,585 production + 3,382 test) plus prompts.
Python/Bash legacy retired to `~/.claude/graphiti-legacy/`.
Future backlog (26 items across memory enhancement, management, UI) documented in MASTER-ROADMAP.md.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Research only, no install | User wants vetted list first, will install later | ✓ Good — clean separation |
| Global scope only | Tools should be universally available, not per-project | ✓ Good |
| Full lifecycle self-management | User never wants to manually edit config files | ✓ Good |
| Lean final list (5-8) | Quality over quantity | ✓ Good — 5+2 recommendations |
| Diagnostic-first milestone (v1.1) | Fix memory before adding features | ✓ Good — root causes found and fixed |
| Global scope + [project] content prefix | Graphiti v1.21.0 rejects colon in group_id | ✓ Good — workaround documented |
| Two-phase auto-naming via Haiku | Cost-efficient (~$0.001/call) with graceful degradation | ✓ Good |
| Foreground hook execution with 5s timeout | Error capture requires foreground; fast timeout prevents blocking | ✓ Good |
| Rebrand to Dynamo/Ledger/Switchboard | Separate memory from management for independent evolution | ✓ Good — clean architecture |
| CJS rewrite over Python/Bash | GSD-pattern CJS is proven, modular, testable; unifies tech stack | ✓ Good — 272 tests, feature parity |
| Feature parity before new features | Stable foundation first, new capabilities in v1.3+ | ✓ Good — foundation solid |
| Content-based sync (Buffer.compare) | More accurate than mtime-only conflict detection | ✓ Good |
| Options-based test isolation | Stage/module functions accept overrides for test isolation | ✓ Good — all tests use tmpdir |
| Settings.json backup before modification | Atomic write (tmp+rename) with .bak for rollback | ✓ Good — safe cutover |

## Constraints

- **Self-management**: Claude Code must be able to fully manage the tool lifecycle
- **Scope**: Global only — lives in ~/.claude or global config
- **Platform**: macOS (Darwin), zsh, Homebrew available
- **Architecture**: Node/CJS, zero npm dependencies beyond js-yaml
- **Testing**: node:test built-in, 100% test isolation via tmpdir

---
*Last updated: 2026-03-18 after v1.2 milestone complete*

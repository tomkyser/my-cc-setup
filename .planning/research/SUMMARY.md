# Research Summary: v1.3-M1 Foundation and Infrastructure Refactor

**Domain:** CJS application restructure + infrastructure features for Dynamo
**Researched:** 2026-03-19
**Overall confidence:** HIGH

## Executive Summary

v1.3-M1 transforms Dynamo from a 3-directory flat layout (dynamo/, ledger/, switchboard/) into a 6-subsystem architecture (subsystems/{switchboard, assay, ledger, terminus, reverie} + cc/ + lib/) while simultaneously adding 5 infrastructure capabilities: transport flexibility (MENH-06), model selection (MENH-07), dependency management (MGMT-01), jailbreak protection (MGMT-08), and SQLite session index (MGMT-11).

The research confirmed all 6 requirements are achievable within the zero-npm-dependency constraint. `node:sqlite` (DatabaseSync) is available and verified working on Node.js v24.13.1 with a synchronous API that matches existing CJS patterns. The Anthropic Messages API is a simple REST endpoint callable via the existing `fetchWithTimeout()` utility. Claude Code's custom subagent system provides native Haiku model selection at zero marginal cost on Max subscription.

The critical finding is that the directory restructure is the load-bearing prerequisite for every other feature. Transport needs Terminus to exist. SQLite needs Assay and Terminus to exist. Jailbreak protection needs cc/hooks/ to exist. The restructure must happen first, in carefully ordered waves that maintain all 374 tests green at every commit.

The migration architecture uses a 5-wave approach with re-export shims to prevent big-bang breakage: (1) create lib/ shared substrate, (2) populate Terminus from Ledger and Switchboard infrastructure modules, (3) split Ledger into Assay (read) + narrowed Ledger (write), (4) move Switchboard operations and create cc/ platform adapter, (5) cleanup shims and finalize. Each wave is independently testable and leaves the deployed `~/.claude/dynamo/` layout functional.

## Key Findings

**Stack:** Zero new npm dependencies. All capabilities use Node.js built-ins: `node:sqlite` for sessions, native `fetch` for Anthropic API, `node:test` for testing. Verified on Node.js v24.13.1.

**Architecture:** 5-wave migration order driven by dependency depth (leaves first, roots last). Transport abstraction adds llm-transport.cjs as a peer to mcp-client.cjs in Terminus (not a wrapper). SQLite ownership split: Terminus owns the DB file/schema, Assay owns the query functions.

**Critical pitfall:** CJS circular dependencies during restructure. The current core.cjs already mitigates one circular chain (core -> ledger -> core). The restructure creates new cross-subsystem require() chains that must be mapped before any files move. Silent failures (empty objects) make these extremely hard to detect without explicit testing.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Directory Restructure -- Waves 1-3** (lib/, Terminus, Assay/Ledger split)
   - Addresses: 6-subsystem architecture foundation
   - Avoids: Circular dependency pitfall (CP-01) by moving leaves first
   - Estimated scope: ~25 file moves, ~15 import path updates, ~10 new shims

2. **Directory Restructure -- Waves 4-5** (Switchboard, cc/, cleanup)
   - Addresses: Platform adapter pattern, dispatcher migration
   - Avoids: Settings.json breaking change (handled by migration script)
   - Estimated scope: ~8 file moves, dispatcher path update, shim removal

3. **Dependency Management (MGMT-01)**
   - Addresses: Self-contained dependency verification
   - Dependencies: lib/ must exist (Phase 1)
   - Estimated scope: 1 new module + install/health-check integration

4. **Jailbreak Protection (MGMT-08)**
   - Addresses: Hook input/output sanitization
   - Avoids: Prompt injection via additionalContext
   - Dependencies: cc/hooks/ must exist (Phase 2)
   - Estimated scope: 1 new module + dispatcher integration

5. **Transport Flexibility (MENH-06)**
   - Addresses: OpenRouter SPOF removal, direct Anthropic API
   - Dependencies: Terminus must exist (Phase 1)
   - Estimated scope: 3 new modules (transport layer + 2 backends)

6. **Model Selection (MENH-07)**
   - Addresses: Per-path model routing (Haiku hot path, Sonnet deliberation)
   - Dependencies: Transport layer (Phase 5)
   - Estimated scope: Config extension + routing logic

7. **SQLite Session Index (MGMT-11)**
   - Addresses: sessions.json replacement with indexed queries
   - Avoids: Session count performance degradation
   - Dependencies: Assay + Terminus (Phase 1), deps verification (Phase 3)
   - Estimated scope: 2 new modules + session function rewrite + migration script

**Phase ordering rationale:**
- Restructure first because every other feature needs the new directories to exist
- Waves 1-3 before 4-5 because subsystem modules must land before dispatcher migration
- Dependency management early because SQLite needs feature verification
- Security before transport because it is smaller and independent
- Transport before model selection because model routing depends on the transport layer
- SQLite last because it is highest risk (modifying the session data store) and benefits from stable infrastructure

**Research flags for phases:**
- Phase 1-2 (restructure): HIGH complexity -- needs careful import chain mapping before execution
- Phase 4 (jailbreak): MEDIUM -- defense patterns are well-documented but effectiveness varies
- Phase 5 (transport): LOW risk -- simple REST API, verified endpoints
- Phase 7 (SQLite): MEDIUM -- node:sqlite is experimental (though verified working)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified locally. node:sqlite tested on v24.13.1. Anthropic API docs confirmed. |
| Features | HIGH | All 6 requirements achievable within constraints. No blocking technical issues found. |
| Architecture | HIGH | Migration order derived from dependency analysis of actual codebase (not specs alone). Import chains inspected. |
| Pitfalls | HIGH | Circular dependency risk identified from actual core.cjs code. Dual-layout gotchas documented from existing resolveSibling pattern. |

## Gaps to Address

- **Reverie handler migration timing:** The 5 hook handlers in `ledger/hooks/` need to move to `subsystems/reverie/handlers/` but Reverie is an M2 deliverable. M1 should create the Reverie stub but leave handlers in their current location with a path forward documented for M2.
- **curation.cjs split timing:** The LLM functions (callHaiku, curateResults, etc.) move to Reverie in M2, but the transport extraction happens in M1 Phase 5. The curation functions need to be updated to use the new transport layer in M1 while staying in their current file location until M2 moves them.
- **Test reorganization:** The current test directory (`dynamo/tests/{ledger,switchboard}/`) assumes the 3-dir layout. Tests need to be reorganized to mirror the new structure, but this can be done incrementally by updating require paths rather than moving test files.
- **Sync SYNC_PAIRS update:** The current sync system maps 3 directory pairs. After restructure, it must map the new layout. This is a mechanical change but must be correct on first try or sync will silently skip files.
- **ExperimentalWarning from node:sqlite:** The SQLite module emits a warning to stderr that could pollute hook output. Needs suppression strategy (documented in STACK.md).

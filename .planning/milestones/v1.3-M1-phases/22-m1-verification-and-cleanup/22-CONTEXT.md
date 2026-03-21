# Phase 22: M1 Verification and Cleanup - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

End-to-end validation of all v1.3-M1 deliverables in deployed layout. Verify fresh install, health-check, sync round-trip, and all M1 requirements (ARCH-01 through ARCH-07, MGMT-01, MGMT-08a, MGMT-08b, DATA-01 through DATA-04). Clean up migration artifacts, dead code, and stale documentation. Close out the milestone with tag, roadmap updates, and full PROJECT.md evolution.

</domain>

<decisions>
## Implementation Decisions

### Verification approach
- Two-phase verification: tmpdir sandbox first (automated, no risk), then real fresh install (scripted with user confirmation)
- Tmpdir sandbox covers: fresh install to temp directory, health-check against it, sync round-trip validation
- Real fresh install: script backs up `~/.claude/dynamo/`, installs fresh, runs health-check, pauses for user confirmation before restoring
- Automated checks must cover: full test suite (479+ tests), boundary enforcement (circular-deps + boundary tests), hook dispatch smoke test (sample JSON through dispatcher with boundary markers and input validation), SQLite migration path (sessions.json to SQLite with sample data, fallback test)
- VERIFICATION.md report produced as persistent milestone evidence documenting what was checked, results, and any issues found

### Shim cleanup scope
- Audit core.cjs re-exports (MCPClient, SCOPE, loadSessions, etc.) -- evaluate whether consumers should import directly from subsystems instead of through core.cjs indirection. Fix unnecessary re-exports in this phase.
- Full dead code scan for old migration artifacts: grep for `detectLayout`, `resolveSibling`, `resolveHandlers`, old 3-directory path constants, commented-out fallbacks, unused layout detection functions
- Remove anything that's truly dead. This is cleanup, not a new capability.

### Stale artifact cleanup
- Regenerate all 7 codebase maps in `.planning/codebase/` via `/gsd:map-codebase` -- STRUCTURE.md, ARCHITECTURE.md, CONVENTIONS.md, INTEGRATIONS.md, STACK.md, CONCERNS.md, TESTING.md
- Update stale comments in production code that reference old directory names (e.g., `ledger/hooks/` when it's now `subsystems/ledger/hooks/`)
- Full README refresh to reflect six-subsystem architecture (directory tree, Mermaid diagram, command reference)
- Update CLAUDE.md template (`cc/CLAUDE.md.template`) to reflect any changed paths or commands from M1

### Milestone closure
- Tag on dev branch (v1.3-M1) -- do NOT merge dev to master (master merge deferred until full v1.3 ships)
- Full PROJECT.md evolution: update "What This Is", current state, context section, LOC/test counts, add decision records from Phases 18-21
- Update MASTER-ROADMAP.md to mark M1 as shipped
- Update ROADMAP.md to mark Phase 22 and M1 as complete

### Claude's Discretion
- Exact VERIFICATION.md structure and sections
- Order of operations between verification, cleanup, and documentation tasks
- Whether to split into multiple plans or execute as one
- Exact grep patterns for dead code detection
- How to structure the real fresh install backup/restore script

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture and Requirements
- `.planning/REQUIREMENTS.md` -- All 14 M1 requirements (ARCH-01 through ARCH-07, MGMT-01, MGMT-08a/b, DATA-01 through DATA-04) and their validation status
- `.planning/research/DYNAMO-PRD.md` -- Six-subsystem architecture definition, boundary rules, platform adapter pattern
- `.planning/ROADMAP.md` -- Phase 22 success criteria and M1 milestone scope

### Prior Phase Context
- `.planning/phases/18-restructure-prerequisites/18-CONTEXT.md` -- Resolver design and layout map decisions
- `.planning/phases/19-six-subsystem-directory-restructure/19-CONTEXT.md` -- Migration strategy, deployed layout mapping, module ownership decisions
- `.planning/phases/20-management-hardening/20-CONTEXT.md` -- Dependency verification, input sanitization, boundary marker decisions
- `.planning/phases/21-sqlite-session-index/21-CONTEXT.md` -- Storage ownership, migration strategy, fallback behavior decisions

### Current Implementation (verification targets)
- `lib/core.cjs` -- Re-exports to audit (lines 337-348): MCPClient, SCOPE, loadSessions
- `lib/layout.cjs` -- Single source of truth for layout paths and sync pairs (8 pairs)
- `lib/resolve.cjs` -- Centralized resolver (should have no dual-layout detection remnants)
- `cc/hooks/dynamo-hooks.cjs` -- Hook dispatcher with input validation and boundary markers
- `subsystems/switchboard/install.cjs` -- Install pipeline (should produce functional deployment)
- `subsystems/terminus/health-check.cjs` -- 8-stage health check (Docker, Neo4j, API, MCP, env, canary, Node.js, session storage)
- `subsystems/terminus/session-store.cjs` -- SQLite session storage via node:sqlite
- `subsystems/assay/sessions.cjs` -- Session management with SQLite delegation and JSON fallback

### Documentation (update targets)
- `README.md` -- Needs six-subsystem architecture refresh (directory tree, Mermaid diagram)
- `cc/CLAUDE.md.template` -- Deployed template, needs path/command updates for M1 changes
- `.planning/codebase/*.md` -- All 7 maps stale (pre-Phase 19 3-dir layout), regenerate via /gsd:map-codebase
- `.planning/PROJECT.md` -- Needs full evolution with M1 decision records and updated metrics

### Milestone artifacts
- `.planning/research/MASTER-ROADMAP.md` -- M1 milestone entry to mark as shipped

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/layout.cjs`: `getLayoutPaths()` and `getSyncPairs()` -- single source of truth for all path references, drives sync and install
- `subsystems/terminus/stages.cjs`: Stage runner pattern (runStages/runDiagnosticStages) -- verification can reuse the health-check pipeline
- `dynamo/tests/boundary.test.cjs`: Existing boundary enforcement tests that verify subsystem isolation
- `dynamo/tests/circular-deps.test.cjs`: Circular dependency detector scanning all subsystem directories
- Options-based test isolation pattern: all modules accept options overrides -- enables tmpdir-based install verification

### Established Patterns
- Health-check 8-stage pipeline: Docker, Neo4j, API, MCP, env, canary, Node.js version, session storage
- Install step-based pipeline with numbered steps and progress reporting
- Sync uses `getSyncPairs()` from `lib/layout.cjs` (8 pairs: root, dynamo-meta, switchboard, assay, ledger, terminus, cc, lib)
- All hooks exit 0 regardless of errors; violations logged to `hook-errors.log`
- Atomic write pattern (tmp + rename) for safe file modifications

### Integration Points
- `dynamo install` is the primary verification target -- must produce functional deployment from scratch
- `dynamo sync` must round-trip all 8 sync pairs without silent file skips
- `dynamo health-check` must report 8/8 stages green on fresh deployment
- Hook dispatcher must accept valid JSON, reject invalid, and wrap output in boundary markers

</code_context>

<specifics>
## Specific Ideas

- Tmpdir sandbox verification first (safe), then real fresh install with scripted backup/restore and user confirmation pause
- Re-export audit should evaluate whether the core.cjs pattern of re-exporting subsystem modules is still the right architectural call, not just whether shims exist
- Codebase maps should be regenerated fresh via `/gsd:map-codebase` rather than manually patching -- ensures accuracy for M2 planning
- Tag as v1.3-M1 on dev branch only; master merge waits for full v1.3

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 22-m1-verification-and-cleanup*
*Context gathered: 2026-03-20*

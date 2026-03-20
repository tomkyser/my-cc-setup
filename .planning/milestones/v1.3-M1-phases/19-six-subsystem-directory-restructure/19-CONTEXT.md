# Phase 19: Six-Subsystem Directory Restructure - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Move files from the current 3-directory layout (dynamo/, ledger/, switchboard/) to the six-subsystem architecture (subsystems/switchboard/, subsystems/assay/, subsystems/ledger/, subsystems/terminus/, subsystems/reverie/, cc/, lib/) with all operational pipelines (sync, install, deploy) updated and working. No functional changes to module internals -- this is a pure structural reorganization.

</domain>

<decisions>
## Implementation Decisions

### Migration sequencing
- All-at-once migration: all files move in a single coordinated commit (not subsystem-by-subsystem)
- Prep wave first: extract lib/layout.cjs from resolve.cjs AND move core.cjs, scope.cjs, pretty.cjs into lib/ BEFORE any subsystem directories move
- Main migration wave: create subsystems/*, cc/*, move all remaining files, update resolve.cjs layout map, update SYNC_PAIRS, update install.cjs
- Use `git mv` for all file moves to preserve rename detection and blame history
- Tests must be green after each commit (prep wave, migration wave, pipeline update wave)

### Deployed layout mapping
- Deployed layout (~/.claude/dynamo/) mirrors repo structure exactly: subsystems/switchboard/, subsystems/assay/, cc/hooks/, lib/, etc.
- Resolver works identically in both layouts (same directory structure eliminates divergence)
- SYNC_PAIRS updated to map new subsystem directories (replacing the old 3+1 pairs)
- Settings.json hook paths updated from dynamo/hooks/dynamo-hooks.cjs to cc/hooks/dynamo-hooks.cjs via install.cjs (clean cutover, no symlinks)
- dynamo.cjs CLI router moves to repo root (not inside any subsystem -- it's the entry point)
- config.json and VERSION placement: Claude's Discretion (lib/ vs shared/)

### Module ownership splits
- Files move to PRD-defined subsystems but module internals are NOT refactored (move only, no split)
- search.cjs and sessions.cjs move to subsystems/assay/ as-is (functional Ledger/Assay split deferred to 1.3-M2)
- mcp-client.cjs moves to subsystems/terminus/ (infrastructure, not data construction)
- pretty.cjs moves to lib/ (shared formatter). stages.cjs placement: Claude's Discretion (terminus vs lib/)
- Hook dispatcher and handlers placement: Claude's Discretion (all to cc/hooks/ vs dispatcher in cc/ with handlers in subsystems)
- episodes.cjs stays in subsystems/ledger/ (write operations)
- curation.cjs stays in subsystems/ledger/ (write operations -- Haiku curation pipeline)

### Future subsystems and platform artifacts
- subsystems/reverie/ created as empty directory with .gitkeep (implementation in 1.3-M2)
- ledger/graphiti/ (Docker infrastructure) moves to subsystems/terminus/graphiti/
- claude-config/ contents (CLAUDE.md.template, settings-hooks.json) move to cc/ and old directory deleted
- dynamo/prompts/ moves to cc/prompts/ (Claude Code platform artifacts)

### Claude's Discretion
- config.json and VERSION: lib/ or shared/ directory
- stages.cjs: subsystems/terminus/ or lib/
- Hook handlers: all in cc/hooks/ or dispatcher in cc/ with handlers in respective subsystems
- Test directory organization (dynamo/tests/ may need reorganization to match new subsystem structure)
- Exact SYNC_PAIRS structure for the new layout
- Update system (update.cjs, update-check.cjs) stays in switchboard per PRD

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture specifications
- `.planning/research/DYNAMO-PRD.md` -- Six-subsystem architecture, target directory structure (section 2.2), `lib/` shared substrate definition (section 2.3), `cc/` adapter pattern (section 2.1), subsystem boundaries (section 3.1)
- `.planning/research/SWITCHBOARD-SPEC.md` -- Dispatcher migration to cc/, handler ownership model, install/sync updates
- `.planning/research/TERMINUS-SPEC.md` -- Transport layer, MCP client migration, health/diagnostics consolidation
- `.planning/research/ASSAY-SPEC.md` -- Read operations split from Ledger, session management, search migration
- `.planning/research/LEDGER-SPEC.md` -- Write-only narrowing, curation split, capture handler extraction
- `.planning/REQUIREMENTS.md` -- ARCH-01, ARCH-04, ARCH-05, ARCH-06, ARCH-07 requirement definitions

### Codebase maps
- `.planning/codebase/STRUCTURE.md` -- Current repo and deployed directory layouts, all key files
- `.planning/codebase/ARCHITECTURE.md` -- Component architecture, import boundaries, deployment model
- `.planning/codebase/CONVENTIONS.md` -- Module patterns, export patterns, test conventions

### Phase 18 context (prerequisites)
- `.planning/phases/18-restructure-prerequisites/18-CONTEXT.md` -- Resolver design, layout map scope, migration strategy decisions that directly feed into Phase 19
- `lib/resolve.cjs` -- Centralized resolver with 8-subsystem layout map (created in Phase 18, updated in Phase 19)
- `lib/dep-graph.cjs` -- Circular dependency detector (must still pass after restructure)

### Operational pipeline
- `switchboard/sync.cjs` -- SYNC_PAIRS constant (lines 25-30) -- must be updated for new layout
- `switchboard/install.cjs` -- 6-step deployment pipeline -- must be updated for new paths
- `claude-config/settings-hooks.json` -- Hook path definitions -- must reference cc/hooks/

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/resolve.cjs`: Already handles both current and future 6-subsystem layout maps. Phase 19 extracts the layout data to lib/layout.cjs and updates the paths
- `lib/dep-graph.cjs`: Circular dependency test scans all subsystem directories -- scan paths need updating after restructure
- `dynamo/tests/circular-deps.test.cjs`: Scans 4 directories currently (dynamo, ledger, switchboard, lib) -- needs to scan subsystems/*, cc/, lib/ after restructure

### Established Patterns
- Bootstrap require pattern: `require('../lib/resolve.cjs')` -- bootstrap depths change when files move to subsystems/*
- SYNC_PAIRS: Currently 4 pairs (dynamo, ledger, switchboard, lib) -- becomes N pairs for new layout
- Options-based test isolation: All modules accept options overrides -- path changes don't affect test isolation pattern
- Dual-layout conditional bootstrap in dynamo/ root files (core.cjs, dynamo.cjs) -- may simplify when deployed layout mirrors repo

### Integration Points
- `switchboard/sync.cjs` SYNC_PAIRS: Complete rewrite of pair definitions for new directory structure
- `switchboard/install.cjs`: copyTree calls updated for new source directories, hook registration updated for cc/hooks/
- `claude-config/settings-hooks.json`: Hook command paths change to cc/hooks/dynamo-hooks.cjs
- `dynamo/hooks/dynamo-hooks.cjs`: Handler requires change when handlers move (currently requires from ../../ledger/hooks/)
- `dynamo/tests/boundary.test.cjs`: Boundary enforcement tests need updating for new directory names

</code_context>

<specifics>
## Specific Ideas

- Phase 18 CONTEXT explicitly planned: "Phase 19 will: (a) extract layout data to lib/layout.cjs, (b) move core.cjs, scope.cjs, pretty.cjs into lib/" -- honor this sequencing
- Resolver's 8-subsystem layout map was designed to include all future paths so Phase 19 restructure needs zero resolver logic changes -- only path value updates
- All-at-once migration pattern proven in Phase 18 (resolver migration touched 23 files successfully)

</specifics>

<deferred>
## Deferred Ideas

- Functional Ledger/Assay split (actual read vs write separation in module internals) -- milestone 1.3-M2
- Reverie implementation -- milestone 1.3-M2
- Test directory reorganization to match subsystem structure -- evaluate after restructure

</deferred>

---

*Phase: 19-six-subsystem-directory-restructure*
*Context gathered: 2026-03-19*

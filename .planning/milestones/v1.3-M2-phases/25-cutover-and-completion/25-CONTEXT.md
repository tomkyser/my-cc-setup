# Phase 25: Cutover & Completion - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Classic mode removed entirely -- Reverie is the only processing pipeline, no mode switching. Voice CLI commands provide Inner Voice visibility and state management. Bare CLI invocation works without node prefix. Update notes workflow integrated into check-update and update commands. Install and sync pipelines deploy all new Reverie files and actively clean up removed classic-mode artifacts. Merged from original Phases 25 (Graduated Rollout) and 26 (Operational Completion) -- user rejected hybrid comparison mode entirely.

</domain>

<decisions>
## Implementation Decisions

### Classic Mode Removal
- **D-01:** Remove classic Ledger curation path entirely. Delete routing from dispatcher, remove `ledger/curation.cjs` callHaiku function, eliminate all OpenRouter/Haiku dependency from the codebase. Reverie is the only path.
- **D-02:** Remove `reverie.mode` config key entirely. No mode switching. Reverie is always on when Dynamo is enabled. The existing `isEnabled()` toggle gate is the only on/off mechanism.
- **D-03:** Delete the 5 original cc/prompts/ templates (curation.md, precompact.md, prompt-context.md, session-name.md, session-summary.md). Only the 5 iv-* templates remain. Clean break.
- **D-04:** Remove all OpenRouter references, env var checks, and callHaiku function entirely. Session naming now uses the inner-voice subagent or timestamp fallback. No OpenRouter dependency remains in any code path.
- **D-05:** The dispatcher (`dynamo-hooks.cjs`) no longer checks `reverie.mode`. It always routes cognitive events to Reverie handlers. The classic switch/case for Ledger handlers is removed for cognitive events.
- **D-06:** Update `lib/config.cjs` VALIDATORS map -- remove `reverie.mode` entry. Remove any references to classic/hybrid/cortex mode values throughout the codebase.

### Voice CLI Commands
- **D-07:** `dynamo voice status` shows detailed state dump: all entities with activation scores, domain frame, predictions, self-model, injection history, sublimation threshold, spawn count. Multi-screen, full visibility.
- **D-08:** `dynamo voice explain` shows rationale for the last injection decision. Claude's discretion on whether this reads from state file or a separate log -- pick based on what inner-voice-state.json already stores.
- **D-09:** `dynamo voice reset` performs partial reset: clears self-model, predictions, and injection history but preserves activation map. Entity knowledge is expensive to rebuild from graph queries.
- **D-10:** Additional voice subcommands beyond status/explain/reset are Claude's discretion. Consider whether `voice history` (recent injection decisions) adds value.

### Install & Deploy Pipeline
- **D-11:** Deploy pipeline approach for new files (cc/agents/, cc/prompts/iv-*, new Reverie modules) is Claude's discretion. Audit install.cjs and sync.cjs to determine the right approach.
- **D-12:** Active cleanup on install: remove old classic prompt templates and unreachable classic-mode code from deployed copies at ~/.claude/dynamo/. Clean slate, not passive orphaning.

### Bare CLI & Update Notes
- **D-13:** Symlink shim for bare `dynamo` CLI invocation. Install creates a symlink at a PATH-accessible location pointing to a shim script that runs `node ~/.claude/dynamo/dynamo.cjs`. Symlink location is Claude's discretion (consider /usr/local/bin vs ~/.local/bin for macOS/zsh).
- **D-14:** CHANGELOG.md generated from git tags and commit messages. `dynamo check-update` shows the diff between current and latest. `dynamo update` displays notes after updating.

### Claude's Discretion
- Voice explain data source (state file vs separate log)
- Whether to add `dynamo voice history` subcommand
- Symlink location (/usr/local/bin vs ~/.local/bin)
- Exact sync pair additions for new file deployments
- CHANGELOG.md generation format and level of detail
- How to handle DYNAMO_DEV=1 override for the symlink shim

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Reverie Architecture
- `.planning/research/REVERIE-SPEC.md` -- Hybrid architecture (Section 4, now simplified to single mode), curation migration (Section 3), subagent definition (Section 8), CLI routing (Section 3.4)
- `.planning/research/DYNAMO-PRD.md` -- Subsystem boundaries (Section 3), platform adapter pattern (Section 2), non-functional requirements (Section 6)

### Requirements and Roadmap
- `.planning/REQUIREMENTS.md` -- FLAG-02, FLAG-04, OPS-01, OPS-02, OPS-03
- `.planning/ROADMAP.md` -- Phase 25 merged goal and success criteria

### Prior Phase Context
- `.planning/phases/23-foundation-and-routing/23-CONTEXT.md` -- D-04 dispatcher routing (being changed), D-08 config CLI (being simplified), D-10 config validation (being updated)
- `.planning/phases/24-cognitive-pipeline/24-CONTEXT.md` -- D-05 full curation migration (completed), D-07 inner-voice subagent location, D-08 classic templates kept (being reversed)

### Existing Code (Key Integration Points)
- `cc/hooks/dynamo-hooks.cjs` -- Dispatcher with mode-based routing at line 120 (must remove mode check)
- `lib/config.cjs` -- VALIDATORS map with reverie.mode entry at line 14 (must remove)
- `dynamo.cjs` -- CLI router (must add `voice` command case)
- `subsystems/switchboard/install.cjs` -- Install pipeline (must add new files, add cleanup step)
- `subsystems/switchboard/sync.cjs` -- Sync pairs (must add new file deployments)
- `subsystems/ledger/curation.cjs` -- Classic curation with callHaiku (being removed)
- `cc/prompts/` -- 5 classic templates (being deleted) + 5 iv-* templates (kept)
- `subsystems/reverie/inner-voice.cjs` -- Pipeline orchestrator (voice commands read from this)
- `subsystems/reverie/state.cjs` -- State file module (voice status reads state, voice reset calls freshDefaults variant)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `subsystems/reverie/state.cjs` loadState/persistState: Voice status reads state, voice reset writes partial fresh defaults. freshDefaults() already exists but resets everything -- need a partial variant.
- `subsystems/reverie/inner-voice.cjs`: Pipeline orchestrator whose processing results feed `voice explain`. May need to store more detail about last decision.
- `dynamo.cjs` CLI router: Well-established case-based routing pattern. `voice` command follows the same `session`-style subcommand pattern (switch within a case).
- `subsystems/switchboard/install.cjs`: Existing install pipeline with file copy, settings.json modification, and .bak backup. Extending for cleanup step.
- `subsystems/switchboard/sync.cjs`: SYNC_PAIRS data structure maps repo paths to deployed paths with per-pair excludes.

### Established Patterns
- Options-based test isolation: all modules accept `options = {}` for dependency injection in tests
- Branding header: `// Dynamo > Reverie > module-name.cjs` on line 1
- Atomic write pattern (tmp+rename) used throughout codebase
- Toggle gate: every entry point checks isEnabled() before processing
- CLI subcommand pattern: `case 'session'` with inner switch for `list/view/label/backfill` -- `voice` follows same pattern

### Integration Points
- `dynamo.cjs` line ~411 `case 'config'`: Reference for how CLI subcommands are structured
- `dynamo.cjs` line ~383 `case 'session'`: Direct pattern for `voice` subcommand routing
- `cc/hooks/dynamo-hooks.cjs` line 120: Mode check to be removed
- `lib/config.cjs` line 14: Validator to be removed

</code_context>

<specifics>
## Specific Ideas

- User explicitly rejected graduated rollout: "I don't care to compare classic mode to new. We don't need to stagger roll out. I want to immediately switch to the new mode and drop classic."
- User rejected "cortex" branding: "cortex is not a thing. Reverie is. drop that name entirely, there is no need to brand the mode when reverie only has one mode to care about."
- User wants active cleanup, not passive orphaning of classic files
- Partial reset preserves activation map because entity knowledge is expensive to rebuild from graph queries across sessions

</specifics>

<deferred>
## Deferred Ideas

- Hard budget calibration for deliberation spawns -- gather baseline data during live usage first (from Phase 24 D-13)
- Embedding-based semantic shift detection (MENH-08, M4)
- Full REM consolidation (M4)

</deferred>

---

*Phase: 25-cutover-and-completion*
*Context gathered: 2026-03-20*

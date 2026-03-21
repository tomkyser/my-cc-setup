# Phase 25: Cutover & Completion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-20
**Phase:** 25-cutover-and-completion
**Areas discussed:** Classic mode removal, Voice CLI commands, Install & deploy pipeline, Bare CLI & update notes

---

## Classic Mode Removal

| Option | Description | Selected |
|--------|-------------|----------|
| Remove entirely | Delete classic routing from dispatcher, remove reverie.mode config key, delete ledger/curation.cjs callHaiku function | ✓ |
| Keep as degradation fallback | Reverie is default, classic stays as internal fallback when subagent spawn fails | |
| Keep code, remove routing | Dispatcher always routes to Reverie, old code sits unused | |

**User's choice:** Remove entirely
**Notes:** User was emphatic: "I don't care to compare classic mode to new. We don't need to stagger roll out."

---

### Config key

| Option | Description | Selected |
|--------|-------------|----------|
| Remove reverie.mode entirely | No mode switching. Reverie always on when Dynamo enabled. | ✓ |
| Keep as boolean reverie.enabled | Simplified on/off separate from global toggle | |
| You decide | Claude picks cleanest approach | |

**User's choice:** Remove reverie.mode entirely

---

### Templates

| Option | Description | Selected |
|--------|-------------|----------|
| Remove originals | Delete 5 classic cc/prompts/ templates. Only iv-* remain. | ✓ |
| Keep both | Originals stay as reference | |
| You decide | Claude checks imports | |

**User's choice:** Remove originals

---

### OpenRouter

| Option | Description | Selected |
|--------|-------------|----------|
| Remove entirely | Delete all OpenRouter references, env var checks, callHaiku | ✓ |
| Keep for session backfill | Keep backfill function, remove rest | |
| You decide | Claude audits usage | |

**User's choice:** Remove entirely

---

## Voice CLI Commands

### Voice status

| Option | Description | Selected |
|--------|-------------|----------|
| Compact summary | One-screen overview: top 5 entities, threshold, last injection | |
| Detailed state dump | Full state file: all entities, domain frame, predictions, self-model, history | ✓ |
| You decide | Claude picks right density | |

**User's choice:** Detailed state dump

---

### Voice explain

| Option | Description | Selected |
|--------|-------------|----------|
| From state file | Read last_injection from inner-voice-state.json | |
| From separate log | Dedicated injection-log.json | |
| You decide | Claude picks based on current state schema | ✓ |

**User's choice:** You decide

---

### Voice reset

| Option | Description | Selected |
|--------|-------------|----------|
| Full reset | Clear everything including activation map | |
| Partial reset | Clear self-model and history, keep activation map | ✓ |
| You decide | Claude picks scope | |

**User's choice:** Partial reset
**Notes:** Activation map is expensive to rebuild from graph queries

---

### Additional subcommands

| Option | Description | Selected |
|--------|-------------|----------|
| Just those three | status, explain, reset. Keep it lean. | |
| Add voice history | Show recent injection decisions | |
| You decide | Claude determines if more needed | ✓ |

**User's choice:** You decide

---

## Install & Deploy Pipeline

### Deploy approach

| Option | Description | Selected |
|--------|-------------|----------|
| Extend SYNC_PAIRS | Add new pairs for cc/agents/ and iv-* templates | |
| You decide | Claude audits install.cjs and sync.cjs | ✓ |

**User's choice:** You decide

---

### Cleanup aggressiveness

| Option | Description | Selected |
|--------|-------------|----------|
| Active cleanup | Install removes old classic files from deployments | ✓ |
| Passive cleanup | New files deploy, old files sit unused | |
| You decide | Claude picks safer approach | |

**User's choice:** Active cleanup

---

## Bare CLI & Update Notes

### Bare CLI mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Symlink shim | Install creates symlink at PATH-accessible location | ✓ |
| Shell alias | Add alias to ~/.zshrc | |
| You decide | Claude picks for macOS/zsh | |

**User's choice:** Symlink shim

---

### Update notes

| Option | Description | Selected |
|--------|-------------|----------|
| CHANGELOG.md from git | Generate from tags and commits | ✓ |
| Hand-written notes | Human-maintained CHANGELOG.md | |
| You decide | Claude picks for existing update system | |

**User's choice:** CHANGELOG.md from git

---

### Symlink location

| Option | Description | Selected |
|--------|-------------|----------|
| /usr/local/bin/dynamo | Standard macOS, may need sudo | |
| ~/.local/bin/dynamo | User-local, no sudo | |
| You decide | Claude picks for macOS | ✓ |

**User's choice:** You decide

---

## Claude's Discretion

- Voice explain data source (state file vs separate log)
- Whether to add `dynamo voice history` subcommand
- Symlink location (/usr/local/bin vs ~/.local/bin)
- Exact sync pair additions for new file deployments
- CHANGELOG.md generation format
- DYNAMO_DEV=1 override mechanism

## Deferred Ideas

- Hard budget calibration (gather baseline first)
- Embedding-based semantic shift detection (M4)
- Full REM consolidation (M4)

## Pre-Discussion Corrections

User provided three major corrections before discussion began:
1. "I don't care to compare classic mode to new. We don't need to stagger roll out. I want to immediately switch to the new mode and drop classic."
2. "'cortex' is not a thing. Reverie is. drop that name entirely, there is no need to brand the mode when reverie only has one mode to care about."
3. "Merge the scope with phase 26"

These corrections fundamentally reshaped Phase 25 from a graduated rollout to a direct cutover + operational completion.

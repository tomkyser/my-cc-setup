---
phase: 260319-fzc
plan: "03"
subsystem: "Ledger (Data Construction) + Assay (Data Access)"
tags: [architecture, specification, subsystem-split, read-write-boundary]
dependency_graph:
  requires:
    - "260319-fzc-01 (Dynamo PRD -- defines subsystem boundaries)"
  provides:
    - "LEDGER-SPEC.md -- Data Construction Layer specification"
    - "ASSAY-SPEC.md -- Data Access Layer specification"
  affects:
    - "260319-fzc-04 (Reverie spec -- defines interfaces with Ledger and Assay)"
    - "260319-fzc-05 (Roadmap refactor -- references subsystem specs)"
tech_stack:
  added: []
  patterns:
    - "Read/write subsystem split"
    - "Transport delegation through Terminus"
    - "Domain cohesion for session management"
    - "Re-export shim strategy for backward compatibility"
key_files:
  created:
    - ".planning/research/LEDGER-SPEC.md"
    - ".planning/research/ASSAY-SPEC.md"
  modified: []
decisions:
  - "Ledger retains zero LLM calls -- all intelligence moves to Reverie"
  - "Assay owns session index writes (local file I/O) despite read-layer designation"
  - "extractContent utility moves to shared lib/transport-utils.cjs"
  - "curation.cjs splits: LLM functions to Reverie, deterministic to Ledger format.cjs"
metrics:
  duration: "~7 minutes"
  completed: "2026-03-19T17:07:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 260319-fzc Plan 03: Ledger + Assay Subsystem Specs Summary

Clean read/write split of current Ledger into two focused subsystems: Ledger (Data Construction, write-only) and Assay (Data Access, read-only), with every current ledger/ file assigned a defined destination across six subsystems.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write Ledger Specification (Data Construction) | 8948f8d | .planning/research/LEDGER-SPEC.md |
| 2 | Write Assay Specification (Data Access) | c4c7a90 | .planning/research/ASSAY-SPEC.md |

## What Was Built

### LEDGER-SPEC.md (Data Construction Layer)

Full 7-section specification defining Ledger in its narrowed scope. Ledger retains only 2-3 files from its current 8 (episodes.cjs, format.cjs, capture.cjs). The spec covers:

- **Responsibilities and boundaries:** Write-only subsystem. No reads, no decisions, no LLM calls.
- **Architecture:** 3-module structure (episodes, format, capture) with clear dependency graph.
- **Interfaces:** Reverie calls Ledger to write; Switchboard dispatches PostToolUse to capture handler; CLI routes `dynamo remember` to addEpisode. All writes through Terminus MCP transport.
- **curation.cjs split detail:** LLM functions (curateResults, summarizeText, generateSessionName, callHaiku) move to Reverie. Deterministic functions (formatEpisodeContent, buildGroupId, sanitizeContent) stay as format.cjs.
- **Migration path:** Every file in current ledger/ has a defined destination (Ledger, Assay, Terminus, Reverie, or shared lib).
- **Data contracts:** Episode write request/response schemas, structured episode request, capture event schema.

### ASSAY-SPEC.md (Data Access Layer)

Full 7-section specification defining the new Assay subsystem. Created by splitting read operations out of Ledger. The spec covers:

- **Responsibilities and boundaries:** Read-only for the knowledge graph. Manages the local session index (reads AND writes to sessions.json).
- **Architecture:** 3-module structure (search, sessions, inspect) with no imports from Ledger.
- **Session write boundary resolution:** Assay writes to the local session index (sessions.json) but never to the knowledge graph. The boundary rule is "Assay never writes to the knowledge graph via Terminus," not "Assay never writes to anything."
- **Interfaces:** Reverie is primary consumer for graph queries and session context. CLI routes search, session, edge, and recall commands. All graph reads through Terminus.
- **Migration path:** Direct move of search.cjs and sessions.cjs with re-export shims for backward compatibility.
- **New inspect.cjs:** Entity/edge inspection functions (getEdge, getEntity, getRecentEpisodes) for CLI commands.
- **MGMT-11 readiness:** SQLite session index is an Assay internal improvement with no signature changes.

## Decisions Made

1. **Zero LLM calls in Ledger.** All curation intelligence moves to Reverie. Ledger is a pure construction module -- deterministic, stateless, fast.

2. **Assay owns session index writes.** The session write boundary question was resolved in favor of domain cohesion: Assay manages the session index (local file), Ledger writes session episodes to the knowledge graph. Two different data stores, two different subsystems.

3. **extractContent moves to shared utility.** Currently in `ledger/episodes.cjs`, used by both Ledger and Assay. Moves to `lib/transport-utils.cjs` to prevent cross-subsystem imports.

4. **curation.cjs splits cleanly.** The dividing line: if it requires an LLM call, it is Reverie's job. If it is deterministic data shaping, it is Ledger's job.

5. **Re-export shim strategy for migration.** Old import paths maintained as thin shims during 1.3-M1, removed after all consumers are updated.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- Ledger spec covers ONLY write operations (episodes, capture, formatting)
- Assay spec covers ONLY read operations (search, sessions, entity inspection)
- No file is claimed by both Ledger and Assay
- Both reference Terminus as their transport layer
- Migration paths account for every file currently in ledger/
- Interface contracts are consistent between specs

## Self-Check: PASSED

- FOUND: .planning/research/LEDGER-SPEC.md
- FOUND: .planning/research/ASSAY-SPEC.md
- FOUND: 260319-fzc-03-SUMMARY.md
- FOUND: 8948f8d (Ledger commit)
- FOUND: c4c7a90 (Assay commit)

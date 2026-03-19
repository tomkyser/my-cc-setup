---
phase: 260319-fzc
plan: 02
subsystem: architecture
tags: [terminus, switchboard, specification, subsystem-boundaries, migration-path, infrastructure, dispatcher]

# Dependency graph
requires:
  - phase: 260319-fzc-01
    provides: "Dynamo PRD with 6-subsystem boundary definitions"
provides:
  - "Terminus specification: Data Infrastructure Layer (MCP transport, Docker stack, health, diagnostics, migrations)"
  - "Switchboard specification: Dispatcher and Operations Layer (hook dispatching, install/sync/update, cc/ adapter)"
affects: [260319-fzc-03, 260319-fzc-04, 260319-fzc-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "7-section subsystem spec template: summary, boundaries, architecture, interfaces, implementation, migration, open questions"
    - "Handler ownership model: Switchboard dispatches events but does not implement handler logic"
    - "cc/ platform adapter pattern: isolates Claude Code specifics from subsystem logic"

key-files:
  created:
    - ".planning/research/TERMINUS-SPEC.md"
    - ".planning/research/SWITCHBOARD-SPEC.md"
  modified: []

key-decisions:
  - "Terminus is stateless transport -- provides the pipe, does not decide what flows through it"
  - "Switchboard dispatches but does not handle -- handlers belong to owning subsystems (Reverie, Ledger)"
  - "Hook handler routing is static (hardcoded table), not dynamic registration"
  - "graphiti/ directory stays top-level, referenced by Terminus through config, not contained by it"
  - "SQLite session index (MGMT-11): Terminus owns schema/storage, Assay owns queries"
  - "cc/ directory owned by Switchboard for deployment; content authored by Reverie for agents/prompts"
  - "Backward compatibility via re-export shims during 1.3-M1 migration period"

patterns-established:
  - "Subsystem spec structure: 7 sections with consistent depth and interface definitions"
  - "Migration path documentation: current-to-new file mapping with breaking changes and backward compatibility"
  - "Cross-subsystem reference pattern: specs reference each other via Document References table"

requirements-completed: [TERMINUS-SPEC, SWITCHBOARD-SPEC]

# Metrics
duration: 7min
completed: 2026-03-19
---

# Plan 02: Terminus + Switchboard Subsystem Specs Summary

**Terminus (data infrastructure) and Switchboard (dispatcher/operations) specifications with 7-section template, file migration paths, interface contracts, and clear ownership boundaries between dispatching and handling**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-19T17:00:09Z
- **Completed:** 2026-03-19T17:06:42Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Terminus spec maps all infrastructure files (MCP client, stack, health, diagnostics, verify-memory, stages, migrate) from current ledger/ and switchboard/ directories to subsystems/terminus/
- Switchboard spec establishes the handler ownership model: Switchboard dispatches events, handlers live in owning subsystems (Reverie for cognitive hooks, Ledger for capture hooks)
- Both specs define complete migration paths with breaking changes, backward compatibility shims, and import path updates
- Interface contracts between subsystems are consistent (Terminus provides transport for Ledger and Assay; Switchboard calls Terminus for lifecycle operations)
- No file is assigned to both Terminus and Switchboard

## Task Commits

Each task was committed atomically:

1. **Task 1: Write Terminus Specification** - `b8a35d7` (feat)
2. **Task 2: Write Switchboard Specification** - `c4d4274` (feat)

## Files Created

- `.planning/research/TERMINUS-SPEC.md` - Data Infrastructure Layer spec: MCP transport, Docker stack, health checks, diagnostics, pipeline verification, migrations
- `.planning/research/SWITCHBOARD-SPEC.md` - Dispatcher and Operations Layer spec: hook dispatching, install/sync/update lifecycle, cc/ adapter pattern, handler routing

## Decisions Made

1. **Terminus is stateless.** It provides transport functions and infrastructure operations. It maintains no application state beyond transient connection lifecycle.

2. **Switchboard dispatches, does not handle.** The handler for UserPromptSubmit lives in Reverie, not Switchboard. PostToolUse handler lives in Ledger. Switchboard routes events to the correct subsystem.

3. **Static handler routing.** The routing table is hardcoded in the dispatcher and updated during install/update. Dynamic registration adds unnecessary complexity for a subscriber list that is known at build time.

4. **graphiti/ stays top-level.** The Docker infrastructure directory remains a peer directory referenced by Terminus through config, not contained within subsystems/terminus/. Rationale: .env file location stability, Docker Compose path references, and conceptual separation of backend infrastructure from Terminus transport code.

5. **cc/ owned by Switchboard.** The Claude Code platform adapter directory is managed by Switchboard for deployment purposes. Content (agent definitions, prompts) may be authored by Reverie but deployed by Switchboard's install/sync mechanism.

6. **Backward compatibility shims.** During the 1.3-M1 migration, old file paths temporarily re-export from new locations. Shims are removed at the end of 1.3-M1.

7. **SQLite session index ownership split.** Terminus owns the storage backend and schema management. Assay owns the query functions. Follows the same pattern as the knowledge graph (Terminus provides transport, Assay provides query logic).

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

- Terminus and Switchboard specs establish the infrastructure and operations boundaries
- Ledger and Assay specs (Plan 03, parallel track B) can reference Terminus for transport interfaces
- Reverie spec (Plan 04) can reference both Terminus (transport) and Switchboard (dispatching) for its interface definitions
- All migration paths from current codebase to new 6-subsystem architecture are documented for these two subsystems

---
*Plan: 260319-fzc-02*
*Completed: 2026-03-19*

# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.3-M1 — Foundation and Infrastructure Refactor

**Shipped:** 2026-03-20
**Phases:** 5 | **Plans:** 13 | **Commits:** ~75 | **Production LOC:** ~5,335 CJS | **Tests:** 515

### What Was Built
- Centralized path resolver (`lib/resolve.cjs`) with logical name API for 8 subsystems and DFS circular dependency detector (`lib/dep-graph.cjs`)
- Six-subsystem directory restructure: 27 files moved via `git mv` from `dynamo/`/`ledger/`/`switchboard/` to `subsystems/`, `cc/`, `lib/` with unified `lib/layout.cjs`
- Management hardening: Node.js >= 22 version check (health-check stage 7, install Step 0), hook dispatcher input validation (type/length/event checks), `<dynamo-memory-context>` boundary markers
- SQLite session storage (`subsystems/terminus/session-store.cjs`): `node:sqlite` DatabaseSync, dual-write JSON compat, transparent fallback, install migration (314 sessions)
- M1 verification suite: 36-test tmpdir sandbox, real fresh install (45 files, 8/8 health stages), core.cjs re-export audit (7 removed)

### What Worked
- Prerequisite-first ordering: Phase 18 (resolver, dep-graph) before Phase 19 (restructure) meant zero path breakage during the 27-file migration
- Unified layout mapping (`lib/layout.cjs`) as single source of truth eliminated scattered path constants — sync, install, resolver all derive from one module
- SQLite placed last (Phase 21) after infrastructure was stable, reducing integration risk
- Phase 22 verification caught the `loadPrompt` path bug (cc/prompts vs prompts) and stale regression test paths — would have shipped broken without it
- Milestone audit caught 2 tech debt items (help text + backfill wiring) that were resolved before archival

### What Was Inefficient
- Phase 19 required 3 plans for what was conceptually one migration — prep wave could have been folded into the main migration with careful ordering
- Re-export shims created in Phase 19 (to maintain backward compatibility) were immediately removed in Phase 22 — could have skipped the shim step entirely
- SYNC_PAIRS count changed from 4→7→8 across plans as edge cases were discovered — upfront mapping would have avoided the churn

### Patterns Established
- Centralized resolver pattern: `resolve('subsystem-name')` returns absolute path for any subsystem in any layout
- Layout-as-data: `lib/layout.cjs` exports `getLayoutPaths()`, `getSyncPairs()`, `SUBSYSTEM_DIRS` — all path knowledge lives here
- Connection map per dbPath: SQLite connections keyed by file path for complete test isolation
- Boundary markers: `<dynamo-memory-context>` wraps all hook injection output to contain prompt bleed
- Input validation at dispatcher entry: reject malformed/unknown events before any handler runs

### Key Lessons
1. Prerequisites phases pay for themselves — Phase 18's resolver investment made Phase 19's 27-file migration mechanical rather than error-prone
2. "Layout as single source of truth" should be established early in any restructure — it eliminates an entire class of sync/install/deploy bugs
3. Dual-write patterns (SQLite + JSON) provide safe migration paths but add ongoing maintenance cost — plan to remove the legacy path in a future milestone
4. End-to-end verification phases (Phase 22) consistently find integration bugs that per-phase verification misses — make them standard for infrastructure milestones
5. Re-export shims for backward compatibility during migration are often unnecessary if you can do a single-pass migration — avoid creating debt you'll immediately pay down

### Cost Observations
- Model mix: opus (executor, planner, researcher), sonnet (verifier, plan-checker, Nyquist auditor)
- 5 phases completed across 2 days of wall time (2026-03-19 to 2026-03-20)
- 13 plans executed with ~75 commits
- Milestone audit confirmed zero gaps — cleanest audit to date

---

## Milestone: v1.2.1 — Stabilization and Polish

**Shipped:** 2026-03-19
**Phases:** 6 | **Plans:** 17 | **Commits:** 104 | **Production LOC:** 9,253 CJS | **Tests:** 374

### What Was Built
- Directory restructure to 3 root-level components (`dynamo/`, `ledger/`, `switchboard/`) with import boundary enforcement tests
- Global on/off toggle with complete blackout — CLI gate, hook gate, MCP deregistration, no bypass paths
- 8 CLI memory commands replacing Graphiti MCP tools, all toggle-gated
- Legacy Python/Bash system archived (tagged `v1.2-legacy-archive`) and fully removed
- README rewrite (537 lines, Mermaid architecture diagram, 25 CLI commands), CLAUDE.md template (20+ commands), 19 architecture decision records, 7 codebase maps
- Self-updating system: GitHub Releases API version checks, dual-mode update (git pull/tarball), migration harness, snapshot rollback
- Deploy pipeline hardening: dual-layout path resolution (resolveSibling/resolveHandlers), defensive MCP deregistration, CLAUDE.md template deployment

### What Worked
- Milestone audit after Phase 16 caught 6 integration/flow gaps that would have shipped broken — audit-then-fix pattern validated
- `resolveSibling()` pattern established in Phase 16 for CLI router was directly reusable in Phase 17 for hook dispatcher
- Gap closure phases (16, 17) were small and focused — 1-3 plans each, fast turnaround
- Human verification checkpoint in Phase 17 caught the deployment working correctly first try — no rework needed
- 374 tests provided high confidence during refactoring — zero regressions across directory restructure

### What Was Inefficient
- Phase 12 scope was large (4 plans) — could have been split into directory restructure + toggle as separate phases
- Milestone audit discovered gaps that could have been caught by integration testing during Phase 15 execution
- Some test file scanning bugs (regression tests scanning their own test files for production patterns) only surfaced during Phase 17 execution

### Patterns Established
- Dual-layout path resolution: `resolveSibling()` / `resolveHandlers()` — check repo path first, fall back to deployed path
- Defensive deregistration: `claude mcp remove` on install to prevent stale MCP registrations
- CLAUDE.md template deployment: installer copies template to `~/.claude/CLAUDE.md` ensuring live file stays current
- Milestone audit → gap closure phase pattern: audit finds integration gaps, create focused phase to close them
- 8-step installer: copy files, generate config, merge settings, deregister MCP, deploy CLAUDE.md, clean stale dirs, retire legacy, health check

### Key Lessons
1. Milestone audits should be mandatory before archival — they consistently find integration gaps that per-phase verification misses
2. Deploy pipeline testing needs both unit tests AND deployed environment verification — unit tests can pass while deployed code fails
3. Stale directories/registrations from prior architectures persist across installs — defensive cleanup steps are worth the cost
4. Documentation phases should come after ALL code changes, including deploy pipeline fixes — Phase 14 docs were partially outdated by Phase 17 fixes

### Cost Observations
- Model mix: opus (executor, planner, researcher), sonnet (verifier, plan-checker)
- 6 phases completed across 2 days of wall time
- 17 plans executed with 104 commits
- Phase 17 human verification confirmed all automated checks — zero manual fixes needed

---

## Milestone: v1.2 — Dynamo Foundation

**Shipped:** 2026-03-18
**Phases:** 4 | **Plans:** 12 | **Production LOC:** 3,585 CJS | **Test LOC:** 3,382 CJS

### What Was Built
- CJS shared substrate (core.cjs) with 11 exports: config loading, .env parsing, project detection, MCP client, scope validation, health guard
- 5 hook handlers migrated to CJS dispatcher with full behavioral parity (curation pipeline, session naming, error propagation)
- 13 async diagnostic stage functions powering health-check (6 stages), diagnose (13 stages), and verify-memory (6 checks)
- Bidirectional pure-fs sync (replacing rsync) and Docker stack start/stop wrappers
- Unified CLI router (dynamo.cjs) dispatching 12 commands across Ledger and Switchboard
- CJS installer with settings.json merge, Python retirement, and rollback capability
- Master Roadmap assigning 26 deferred requirements to v1.3-v2.0 milestones

### What Worked
- TDD (red-green) pattern on every plan: 272 tests written before implementation, zero post-hoc test failures
- Wave-based parallelism: Plans 10-01 and 10-03 ran simultaneously with no conflicts
- Options-based test isolation: every module accepts overrides (graphitiDir, settingsPath, etc.) enabling tmpdir testing without touching live system
- Content-based conflict detection (Buffer.compare) proved more accurate than mtime-only for sync
- Single-session execution: all 4 phases completed in one extended session

### What Was Inefficient
- API 500 errors caused two failed agent spawns before 10-04 succeeded — no retry logic in orchestrator
- Env var check in health-check reports FAIL when run outside the hook dispatcher (expected but confusing to users)
- Canary write/read shows WARN due to Graphiti eventual consistency — not a real failure but noisy

### Patterns Established
- Module identity blocks: every .cjs file starts with `// Dynamo > Subsystem > module.cjs`
- Options object pattern for test isolation (all modules accept path overrides)
- Switch-case CLI dispatch following gsd-tools.cjs pattern
- Atomic settings write: backup to .bak, write to .tmp, rename
- Retirement pattern: move legacy files to -legacy/ directory (reversible)
- Stage function contract: `{ status: 'OK'|'FAIL'|'WARN'|'SKIP', detail: string }`

### Key Lessons
1. TDD with built-in node:test requires zero setup — just write tests and run. No framework overhead.
2. Pure-fs sync (readdir + copyFile + stat) replaces rsync with zero external dependencies and better testability
3. Post-install health checks should be informational, not gatekeeping — a WARN on canary doesn't mean the install failed
4. The dispatcher pattern (single entry point routing to handlers) scales cleanly from 5 hooks to 12 CLI commands

### Cost Observations
- Model mix: 100% opus (executor, planner, verifier used sonnet)
- All 4 phases completed in ~2 hours of wall time
- 12 plans executed with 29 feat/test commits

---

## Milestone: v1.1 — Fix Memory System

**Shipped:** 2026-03-17
**Phases:** 4 | **Plans:** 8 | **Commits:** 34

### What Was Built
- 10-stage diagnostic probe (diagnose.py) and 6-stage health check (health-check.py) for the full memory pipeline
- Rewrote all 3 write hooks with error propagation, file logging, foreground execution, and 5s timeout
- 6 new graphiti-helper.py subcommands for session management (list, view, label, backfill, index, generate-name)
- Two-phase auto-naming system using Claude Haiku via OpenRouter
- verify-memory quick pass/fail command (6 checks)
- sync-graphiti.sh for bidirectional file sync between live ~/.claude and this repo

### What Worked
- Diagnostic-first approach: identifying root causes before writing fixes prevented wasted effort
- Incremental verification: each phase built on the previous one's tools (diagnose.py -> health-check.py -> verify-memory)
- Scope fallback decision (global + [project] prefix) was made quickly when the colon constraint was discovered, avoiding blocking
- Two-phase auto-naming design gave graceful degradation for abnormal session termination

### What Was Inefficient
- Some STATE.md decision entries were duplicated (same decision recorded twice with slightly different phrasing)
- Phase 4/5 plan checkboxes in ROADMAP.md were left unchecked (`[ ]`) despite plans being complete — cosmetic inconsistency

### Patterns Established
- SCOPE_FALLBACK.md pattern: document workaround decisions with rationale in a standalone file
- PPID-keyed /tmp flag files for once-per-session behavior in hooks
- Two-phase naming: preliminary at first prompt, refined at session end
- foreground hook execution with layered timeouts (hook-level 10s, MCPClient 5s)
- rsync-based sync with dual --dry-run conflict detection

### Key Lessons
1. Server-side environment variables can silently override per-request parameters — always test at the API level, not just the client level
2. When an external API has undocumented constraints (colon in group_id), document the fallback immediately rather than filing for later
3. Hooks that run in background (`&`) lose error context — foreground with fast timeouts is the better pattern for reliability

### Cost Observations
- Model mix: 100% opus (executor and planner)
- Haiku used only for session naming (~$0.001/call via OpenRouter)
- All 4 phases completed in a single day

---

## Milestone: v1.0 — Research and Ranked Report

**Shipped:** 2026-03-17
**Phases:** 3 | **Plans:** 8 | **Commits:** ~26

### What Was Built
- Vetting protocol with 4 binary hard gates and anti-features list
- Individual assessments of 5 named MCP/tool candidates
- Creative and technical writing tool research
- GSD framework lifecycle runbook and coexistence strategy
- Memory system research (browsing, session visibility, hook gaps)
- Ranked report with 5 primary + 2 conditional recommendations

### What Worked
- Binary hard gates eliminated subjective judgment from tool vetting
- Batched assessments (3 tools per plan, then 2) balanced parallelism with thoroughness
- Cross-cutting review (02-06) caught gaps before synthesis phase

### What Was Inefficient
- Research-only milestone meant no code was shipped — harder to verify completeness objectively
- Some research findings (memory hook gaps) immediately spawned v1.1, suggesting tighter scope might have caught issues earlier

### Patterns Established
- 4-gate vetting protocol: stars, recency, self-management, CC duplication check
- Tiered recommendation system: INCLUDE / CONSIDER / SKIP
- Research-then-fix milestone sequencing

### Key Lessons
1. Research milestones benefit from a synthesis phase that forces cross-cutting review
2. When research reveals operational issues (broken hooks), consider inserting a fix phase before moving to the next milestone
3. Writing tools research showed that the market is immature — documenting "no viable candidates" is a valid and useful outcome

### Cost Observations
- Model mix: 100% opus
- 3 phases completed in under a day
- 6-plan research phase was the largest — wave-based parallelism helped

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Commits | Phases | Plans | Tests | Key Change |
|-----------|---------|--------|-------|-------|------------|
| v1.0 | ~26 | 3 | 8 | 0 | Established vetting protocol and research patterns |
| v1.1 | 34 | 4 | 8 | 0 | Added diagnostic-first approach and verification tools |
| v1.2 | 29 | 4 | 12 | 272 | CJS rewrite with TDD, full feature parity |
| v1.2.1 | 104 | 6 | 17 | 374 | Stabilization: restructure, toggle, docs, update system, deploy hardening |
| v1.3-M1 | ~75 | 5 | 13 | 515 | Six-subsystem architecture, centralized resolver, SQLite sessions, management hardening |

### Top Lessons (Verified Across Milestones)

1. Cross-cutting review phases catch gaps that per-plan verification misses
2. Document decisions immediately when constraints are discovered — don't defer
3. Each milestone should produce reusable tools (vetting protocol, diagnose.py, verify-memory) not just outcomes
4. TDD with zero-dependency test runners (node:test) eliminates framework overhead and speeds execution
5. Options-based dependency injection enables complete test isolation without mocking frameworks
6. Milestone audits before archival consistently find integration gaps — make them mandatory
7. Dual-layout path resolution patterns are reusable across modules — establish once, apply everywhere
8. Prerequisite phases (resolver, layout mapping) before large restructures prevent cascading path breakage
9. "Layout as single source of truth" eliminates an entire class of sync/install/deploy bugs — establish early

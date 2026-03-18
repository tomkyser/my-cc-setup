# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

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

| Milestone | Commits | Phases | Key Change |
|-----------|---------|--------|------------|
| v1.0 | ~26 | 3 | Established vetting protocol and research patterns |
| v1.1 | 34 | 4 | Added diagnostic-first approach and verification tools |
| v1.2 | 29 | 4 | CJS rewrite with TDD, 272 tests, full feature parity |

### Top Lessons (Verified Across Milestones)

1. Cross-cutting review phases catch gaps that per-plan verification misses
2. Document decisions immediately when constraints are discovered — don't defer
3. Each milestone should produce reusable tools (vetting protocol, diagnose.py, verify-memory) not just outcomes
4. TDD with zero-dependency test runners (node:test) eliminates framework overhead and speeds execution
5. Options-based dependency injection enables complete test isolation without mocking frameworks

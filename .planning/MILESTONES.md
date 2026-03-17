# Milestones

## v1.1 Fix Memory System (Shipped: 2026-03-17)

**Phases completed:** 4 phases, 8 plans
**Commits:** 34 | **Files changed:** 44 | **Lines:** +7,579
**Timeline:** 2026-03-16 to 2026-03-17

**Key accomplishments:**
- Diagnosed root causes: server-level GRAPHITI_GROUP_ID override forcing all writes to global scope; API v1.21.0 echoing requested group_id but storing differently
- Fixed hook reliability: rewrote all 3 write hooks with foreground execution, error propagation, file logging, and 5s timeout
- Built session management: 6 new subcommands (list, view, label, backfill, index, generate-name) with two-phase auto-naming via Haiku
- Created verification tools: verify-memory quick pass/fail (6 checks), diagnose.py extended to 13 stages, health-check.py for pipeline monitoring
- Published and synced: sync-graphiti.sh for bidirectional sync, updated installer, README for GitHub visitors

---

## v1.0 Research and Ranked Report (Shipped: 2026-03-17)

**Phases completed:** 3 phases, 8 plans
**Timeline:** 2026-03-16 to 2026-03-17

**Key accomplishments:**
- Established vetting protocol with 4 binary hard gates and anti-features list
- Assessed 5 named MCP/tool candidates plus creative and technical writing tools
- Documented GSD framework lifecycle and global scope coexistence strategy
- Researched memory browsing, session visibility, and identified Graphiti hook gaps
- Produced ranked report with 5 primary + 2 conditional tool recommendations

---

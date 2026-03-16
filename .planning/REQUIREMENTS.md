# Requirements: Claude Code Global Setup Enhancers

**Defined:** 2025-03-16
**Core Value:** Every recommended tool must be self-manageable by Claude Code and work harmoniously in the global scope

## v1 Requirements

### Research & Documentation

- [ ] **DOCS-01**: Produce vetted assessment of Context7 MCP — GitHub activity, stars, self-management capability, install method, context cost, PHP/WP coverage depth
- [ ] **DOCS-02**: Produce vetted assessment of WPCS Skill — scope, maintenance approach, how CC self-manages it, zero context cost verification

### Dev Tools

- [ ] **DEVT-01**: Produce vetted assessment of GitHub MCP — GitHub activity, stars, self-management capability, PAT requirements, permissions model
- [ ] **DEVT-02**: Produce vetted assessment of Playwright MCP — GitHub activity, stars, self-management capability, install method, context cost
- [ ] **DEVT-03**: Produce vetted assessment of Sequential Thinking MCP — GitHub activity, stars, self-management capability, install method, context cost

### Writing Tools

- [ ] **WRIT-01**: Research and vet tools/MCPs that enhance creative writing capabilities (storytelling, content creation, copywriting)
- [ ] **WRIT-02**: Research and vet tools/MCPs that enhance technical writing capabilities (documentation, API docs, READMEs)

### Global Tool Management

- [ ] **GMGR-01**: Document GSD framework self-management lifecycle — install, update (git pull + version check), troubleshoot, how CC manages it globally
- [ ] **GMGR-02**: Document harmonious coexistence strategy — how all tools (MCPs + GSD + Graphiti + plugins) share global scope without conflicts

### Memory System Enhancements

- [ ] **MEMO-01**: Research approaches for a memory browsing interface — view all nodes, facts, episodes across scopes (web UI, CLI tool, CC skill, or MCP-based)
- [ ] **MEMO-02**: Research approaches for session management visibility — list sessions, select/review past sessions, session timeline
- [ ] **MEMO-03**: Identify potential enhancements to current Graphiti hook system — gaps in capture, curation quality, performance, missing lifecycle hooks

### Infrastructure

- [ ] **INFR-01**: Document vetting protocol — programmatic criteria (GitHub stars, commit recency <30 days, security, self-management capability)
- [ ] **INFR-02**: Document anti-features list with reasoning (tools to explicitly avoid and why)
- [ ] **INFR-03**: Document self-management lifecycle for each recommended tool (install, configure, update, troubleshoot commands)

### Deliverable

- [ ] **DLVR-01**: Produce ranked report in markdown — categories, ratings, pros/cons, final recommendations (5-8 tools)
- [ ] **DLVR-02**: Report includes context cost estimates per tool (token overhead)
- [ ] **DLVR-03**: Report includes security assessment per tool (mcp-scan or equivalent)

## v2 Requirements

### Web Research & Scraping

- **WEBS-01**: Evaluate Brave Search MCP after v1 tools are in use (may overlap with CC built-in WebSearch)
- **WEBS-02**: Evaluate Firecrawl MCP after v1 tools are in use (may overlap with CC built-in WebFetch)

### WordPress-Specific

- **WPRD-01**: Evaluate WordPress MCP Adapter after WP 7.0 core integration (April 2026)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Memory/knowledge graph MCPs | Already solved with Graphiti |
| Per-project tool configuration | Everything lives in global scope |
| Installing or configuring chosen tools | Research only — install later |
| Abandoned tools (no updates in 30 days) | Hard disqualifier |
| Filesystem/Fetch MCP servers | Duplicate CC built-in tools |
| PHP-specific MCP servers | Immature/abandoned ecosystem — use native phpstan/phpcs via Bash |
| SSE-transport MCPs | Deprecated protocol as of March 2026 |
| Database/SQL access MCPs | Not requested |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DOCS-01 | TBD | Pending |
| DOCS-02 | TBD | Pending |
| DEVT-01 | TBD | Pending |
| DEVT-02 | TBD | Pending |
| DEVT-03 | TBD | Pending |
| WRIT-01 | TBD | Pending |
| WRIT-02 | TBD | Pending |
| GMGR-01 | TBD | Pending |
| GMGR-02 | TBD | Pending |
| MEMO-01 | TBD | Pending |
| MEMO-02 | TBD | Pending |
| MEMO-03 | TBD | Pending |
| INFR-01 | TBD | Pending |
| INFR-02 | TBD | Pending |
| INFR-03 | TBD | Pending |
| DLVR-01 | TBD | Pending |
| DLVR-02 | TBD | Pending |
| DLVR-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 0
- Unmapped: 18

---
*Requirements defined: 2025-03-16*
*Last updated: 2025-03-16 after initial definition*

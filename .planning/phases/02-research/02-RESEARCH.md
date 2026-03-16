# Phase 2: Research - Research

**Researched:** 2026-03-16
**Domain:** Tool assessment methodology, writing tool discovery, GSD self-management, Graphiti memory architecture
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Writing Tools Discovery (WRIT-01, WRIT-02)**
- Scope is wide: MCPs, CC plugins, CLI tools CC can invoke via Bash, prompt libraries, writing frameworks — anything CC can leverage globally
- Surface top 5 candidates per category (creative writing, technical writing) before vetting
- Creative writing covers both professional content (copywriting, marketing, blog posts) and personal/fiction (storytelling, worldbuilding, narrative) — equal weight
- Technical writing covers documentation, API docs, READMEs, and similar
- All discovered candidates go through the full Phase 1 4-gate vetting protocol
- If no viable candidates exist in a category: document the gap, flag the requirement for v2 re-evaluation. Do not force workarounds.

**Memory System Research (MEMO-01, MEMO-02, MEMO-03)**
- MEMO-01 (browsing interface) and MEMO-02 (session visibility): research existing tools only — no custom build proposals
- Any tools discovered during memory research go through the full Phase 1 4-gate vetting protocol (same standards as named candidates)
- MEMO-03 (hook gaps): compare current hooks against an ideal memory capture system to identify gaps — define what a perfect system would capture, then diff against what exists
- Output format for all three: approach comparison (table of approaches found, pros/cons per approach, recommendation) — similar structure to an ADR

**Existing Setup Documentation (GMGR-01, GMGR-02)**
- Audience: dual — structured for Claude Code to execute commands from, readable for the user to review and understand
- GMGR-01 (GSD lifecycle): operational runbook depth — install, update (git pull + version check), config structure, troubleshooting decision tree, known issues, recovery procedures
- GMGR-02 (coexistence strategy): primary focus on config conflict prevention — how GSD, Graphiti, and new tools share ~/.claude without stepping on each other's config files, hooks, or settings
- Coexistence doc flags interaction risks but does NOT include full recovery procedures — recovery can be figured out when needed

**Plan Organization**
- Claude's discretion on plan grouping, optimized for execution efficiency
- 5 named tool assessments run in parallel (batch), followed by a cross-cutting review pass to check overlaps and consistency before finalizing
- Writing tools research runs concurrently with named assessments (independent work stream)
- Memory research and setup docs can run concurrently (independent of assessments)
- A dedicated final review plan reads all deliverables, checks for gaps, inconsistencies, and ensures every requirement is fully addressed before Phase 3

### Claude's Discretion
- Exact plan grouping and count — optimize for parallelism while keeping plans manageable
- How to structure the cross-cutting review (checklist, narrative, or whatever catches gaps most effectively)
- Whether GMGR-01 and GMGR-02 are one plan or two (they share context)
- Assessment order within batches

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOCS-01 | Vetted assessment of Context7 MCP — GitHub activity, stars, self-management capability, install method, context cost, PHP/WP coverage depth | Scorecard template in VETTING-PROTOCOL.md; existing FEATURES.md data (49,270 stars, last commit 2026-03-16); install command confirmed |
| DOCS-02 | Vetted assessment of WPCS Skill — scope, maintenance approach, how CC self-manages it, zero context cost verification | Skills file pattern documented; ~/.claude/skills/ path confirmed; gate 1 stars threshold is N/A for file-based skills (different rules apply) |
| DEVT-01 | Vetted assessment of GitHub MCP — GitHub activity, stars, self-management capability, PAT requirements, permissions model | Scorecard template ready; FEATURES.md data (27,944 stars, HTTP transport, PAT-based auth); PAT scope verification flagged as gap |
| DEVT-02 | Vetted assessment of Playwright MCP — GitHub activity, stars, self-management capability, install method, context cost | Scorecard template ready; FEATURES.md data (29,037 stars, npx install, auto-installs browsers); context cost research needed |
| DEVT-03 | Vetted assessment of Sequential Thinking MCP — GitHub activity, stars, self-management capability, install method, context cost | Scorecard template ready; part of modelcontextprotocol/servers (81,234 stars); install via npx confirmed |
| WRIT-01 | Research and vet tools/MCPs that enhance creative writing capabilities | Discovery approach defined; candidates identified (haowjy/creative-writing-skills 79 stars — fails gate 1; alirezarezvani/claude-skills 5,384 stars has creative content; mcpmarket skills exist); likely sparse viable candidates |
| WRIT-02 | Research and vet tools/MCPs that enhance technical writing capabilities | Discovery approach defined; candidates identified (alirezarezvani/claude-skills, levnikolaevich/claude-code-skills, Jeffallan/claude-skills 6,844 stars); skills-based approach more viable than MCP-based |
| GMGR-01 | Document GSD framework self-management lifecycle | GSD fully understood: npm package get-shit-done-cc v1.25.1, /gsd:update command, install/uninstall/update commands documented in update.md workflow; GitHub gsd-build/get-shit-done (31,023 stars) |
| GMGR-02 | Document harmonious coexistence strategy | Config file separation: ~/.claude.json (MCP registry) vs ~/.claude/settings.json (behavior/hooks); GSD installs to ~/.claude/get-shit-done/ and ~/.claude/commands/; Graphiti hooks in ~/.claude/graphiti/hooks/ |
| MEMO-01 | Research approaches for memory browsing interface | Neo4j browser at localhost:7475 exists; Graphiti MCP tools (search_nodes, search_facts) available; mcp-neo4j-cypher from neo4j-contrib is an option; existing CLAUDE.md directs to MCP tools |
| MEMO-02 | Research approaches for session management visibility | session_summary.sh stores in session:{timestamp} scope; get_episodes MCP tool available; no dedicated session listing UI exists currently |
| MEMO-03 | Identify potential enhancements to current Graphiti hook system | Current hooks: SessionStart, UserPromptSubmit, PostToolUse(Write/Edit/MultiEdit), PreCompact, Stop — all 5 major lifecycle events are covered; gap analysis against ideal system needed |
</phase_requirements>

---

## Summary

Phase 2 is purely a documentation/research execution phase. Its work is applying a pre-defined vetting protocol (from Phase 1) to 5 named tool candidates, discovering and vetting writing tool candidates, researching memory system enhancement approaches, and documenting the GSD and Graphiti setups that already exist on this machine.

The key planning insight is that this phase has well-understood parallel work streams. The 5 named assessments (DOCS-01, DOCS-02, DEVT-01, DEVT-02, DEVT-03) share the same scorecard template and can be executed as a batch. Writing tool discovery (WRIT-01, WRIT-02) is independent and can run concurrently. Memory research (MEMO-01, MEMO-02, MEMO-03) and setup documentation (GMGR-01, GMGR-02) are also independent work streams that share no dependencies between them. A final review plan must read all deliverables and verify every requirement is satisfied.

The research finding with the most downstream impact on planning: the writing tools category is sparse for high-quality, maintained options. Creative writing MCPs essentially do not exist as a category — the viable candidates are all CC Skills (file-based), not MCP servers. This means the vetting protocol's stars gate must be interpreted appropriately for skills vs. MCPs. For file-based skills, Gate 1 (GitHub stars) applies to the hosting repository; Gate 2 (commit recency) applies to the repository. The protocol as written is MCP-centric but applies equally to skills repositories.

**Primary recommendation:** Organize Phase 2 into 4 parallel-eligible plans: (A) batch assessment of 5 named candidates, (B) writing tools discovery and assessment, (C) memory research and setup docs, (D) final cross-cutting review. Plans A, B, and C run concurrently; Plan D runs after all three complete.

---

## Standard Stack

### Core Tools for Phase 2 Execution

| Tool | Purpose | Self-Manageable by CC |
|------|---------|----------------------|
| gh CLI | GitHub API lookups (stars, last commit date, issue health) for all gate evaluations | YES — `gh api repos/{owner}/{repo}` |
| npm view | Verify package version and publish date on npm registry | YES — `npm view {package} version` |
| WebFetch | Fetch official docs for self-management command verification | YES — built-in CC tool |
| WebSearch | Discover writing tool candidates | YES — built-in CC tool |
| Bash | Run health checks, inspect local files, verify installed versions | YES — built-in CC tool |

### Reusable Assets (Phase 1 Deliverables)

| Asset | Location | What It Provides |
|-------|----------|-----------------|
| Vetting Protocol | `.planning/phases/01-methodology/VETTING-PROTOCOL.md` | Scorecard template (Section 2), 4 hard gates, tier criteria |
| Anti-Features List | `.planning/phases/01-methodology/ANTI-FEATURES.md` | Pre-filter before gate evaluation |
| FEATURES.md | `.planning/research/FEATURES.md` | Existing stars/commit data for 5 named candidates |

**Key insight:** All 5 named candidate assessments start with data already in FEATURES.md. Assessors should verify this data is still current (it was collected 2026-03-16, same day) and fill in the scorecard template fields that require deeper investigation (context cost, self-management commands, security notes).

---

## Architecture Patterns

### Phase 2 Deliverable Structure

All deliverables go in `.planning/phases/02-research/`. No subdirectory is required per the CONTEXT.md pattern section.

```
.planning/phases/02-research/
├── 02-CONTEXT.md            (exists — user decisions)
├── 02-RESEARCH.md           (this file)
├── 02-PLAN-01.md            (batch named assessments — or individual files per assessment)
├── 02-PLAN-02.md            (writing tools)
├── 02-PLAN-03.md            (memory research + setup docs)
├── 02-PLAN-04.md            (final review)
├── assessments/
│   ├── CONTEXT7.md
│   ├── GITHUB-MCP.md
│   ├── PLAYWRIGHT-MCP.md
│   ├── SEQUENTIAL-THINKING-MCP.md
│   └── WPCS-SKILL.md
├── writing-tools/
│   ├── CREATIVE-WRITING.md
│   └── TECHNICAL-WRITING.md
├── memory/
│   ├── MEMO-01-BROWSING.md
│   ├── MEMO-02-SESSIONS.md
│   └── MEMO-03-HOOK-GAPS.md
└── setup/
    ├── GSD-LIFECYCLE.md
    └── COEXISTENCE.md
```

**Note on WPCS Skill:** Gate 1 (stars) does not apply to file-based skills the way it applies to MCPs. A Skill is a markdown file placed in `~/.claude/skills/`. There is no GitHub repo with meaningful star count for WPCS specifically — it's content, not a package. The assessor should document this in the scorecard and note that the "maintenance" gate applies to the underlying standard (WPCS is actively maintained by the WordPress project), not to a GitHub repo.

### Assessment Scorecard Pattern

Copy the template from VETTING-PROTOCOL.md Section 2 for each named candidate. Fill every field — even "N/A" with explanation is acceptable for fields that don't apply (e.g., "Context Cost: N/A — file-based skill, zero token overhead by design").

### Memory Research Output Pattern (ADR-style)

Per CONTEXT.md decisions, all three MEMO deliverables follow an approach-comparison structure:

```markdown
## [Topic] — Approach Comparison

### Problem Statement
[What gap exists]

### Approaches Considered

| Approach | Description | Pros | Cons | Viability |
|----------|-------------|------|------|-----------|
| [name] | [what it is] | [upsides] | [downsides] | [VIABLE/NOT VIABLE + reason] |

### Recommendation
[Single recommended approach with rationale]

### If Recommended Approach Is Not Viable
[Fallback / flag for v2]
```

### Anti-Patterns to Avoid

- **Forcing a writing tool verdict:** The protocol explicitly allows "no viable candidates" as a valid finding. Do not recommend a tool that fails gates just to have something to recommend.
- **Skipping the pre-filter:** ANTI-FEATURES.md must be checked before applying gates to any candidate.
- **Conflating MCP tools and Skills:** They are different extension mechanisms with different gate interpretations. Skills don't have npm packages or transport types.
- **Custom build proposals for MEMO-01/MEMO-02:** The locked decision says "research existing tools only." Do not propose writing a new browsing UI even if no good option exists.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub data collection for gates | A scraper or parser | `gh api repos/{owner}/{repo}` | Authoritative, rate-limited correctly, returns structured JSON |
| Stars threshold lookup | Inline logic | VETTING-PROTOCOL.md Section 1, Gate 1 table | Already defined with publisher-type tiers |
| Tier assignment logic | Judgment at assessment time | VETTING-PROTOCOL.md Section 3 tier criteria | Pre-defined conditions; assessors apply, not deliberate |
| Writing candidate discovery | Ad-hoc search | Structured discovery: check MCP Registry, awesome-mcp-servers, awesome-agent-skills, mcpmarket.com, GitHub topics claude-code-skills | Systematic coverage prevents missing candidates |

---

## Common Pitfalls

### Pitfall 1: WPCS Skill Stars Gate Confusion

**What goes wrong:** The assessor tries to find a GitHub repo for "WPCS Skill" and can't find one, fails the assessment, or makes up a repo.

**Why it happens:** WPCS Skill is a file-based CC Skill (SKILL.md in ~/.claude/skills/wordpress/), not an MCP server. It has no package registry entry and no dedicated repo.

**How to avoid:** Document in the scorecard: "Gate 1 (Stars) — N/A: File-based Skills are not distributed via GitHub repositories with star counts. Maintenance is assessed against the WordPress Coding Standards project (actively maintained by WordPress core team)." Proceed to remaining gates.

**Warning signs:** Searching npm or GitHub for "wpcs-skill" returns nothing — this is expected.

---

### Pitfall 2: Writing Tools Discovery Stops at MCPs

**What goes wrong:** The assessor searches only for MCP servers tagged as "writing" and finds few viable candidates, concluding the ecosystem is empty.

**Why it happens:** Writing-focused MCPs are sparse. The viable writing tools for Claude Code are CC Skills (file-based), not MCP servers.

**How to avoid:** Search all categories in scope: MCPs, CC Skills, CC Plugins, CLI tools CC can invoke via Bash, prompt libraries. The discovery step surfaces top 5 candidates per category from all types before vetting begins.

**Warning signs:** "Only found 1 candidate" for either writing category likely means the search was too narrow.

---

### Pitfall 3: Sequential Thinking MCP Stars Attribution Error

**What goes wrong:** The assessor records "81,234 stars" for Sequential Thinking MCP because it's in the modelcontextprotocol/servers monorepo.

**Why it happens:** Sequential Thinking MCP lives at `/src/sequentialthinking/` inside the monorepo. The stars belong to the monorepo, not to the specific server.

**How to avoid:** Record stars as "81,234 (monorepo — modelcontextprotocol/servers)" and note it is an official Anthropic-maintained reference server. The stars threshold for an "official vendor" (Anthropic) is 100 — easily met. The monorepo attribution is contextually documented in the assessment.

---

### Pitfall 4: MEMO-01/MEMO-02 Recommending Custom Builds

**What goes wrong:** The assessor researches browsing interfaces and session visibility, finds no perfect existing tool, and recommends building a custom solution.

**Why it happens:** The locked decision prohibiting custom builds is easy to miss under the pressure of wanting to have a recommendation.

**How to avoid:** If no viable existing tool is found for MEMO-01 or MEMO-02, the correct output is: document the gap, note the available workarounds (e.g., Neo4j browser at localhost:7475 for browsing), and flag for v2. Do not propose custom development.

---

### Pitfall 5: GSD Lifecycle Doc Missing Update Path Details

**What goes wrong:** GMGR-01 documents install but treats update as "run install again," missing the changelog check, version comparison, and clean install warning.

**Why it happens:** The update workflow is more complex than just re-running install.

**How to avoid:** Read `~/.claude/get-shit-done/workflows/update.md` fully — it defines a multi-step update process: (1) detect installed version, (2) check npm for latest, (3) fetch and display changelog between versions, (4) confirm with user, (5) run `npx get-shit-done-cc@latest --claude --global`, (6) clear update cache. All 6 steps must be in the runbook.

---

### Pitfall 6: GMGR-02 Missing Hook Namespace Conflicts

**What goes wrong:** The coexistence doc focuses only on MCP config file conflicts and misses hook conflicts as a risk.

**Why it happens:** Hook conflicts are less visible than config file conflicts.

**How to avoid:** The coexistence doc must include both config namespaces (`~/.claude.json` mcpServers, `~/.claude/settings.json` hooks/permissions/env) and hook interaction risks. Specifically: GSD runs hooks at SessionStart (gsd-check-update.js) and PostToolUse (gsd-context-monitor.js); Graphiti runs hooks at SessionStart, UserPromptSubmit, PostToolUse, PreCompact, and Stop. Any new tool's hooks must not conflict with these hook entries. The risk is: two hooks with the same matcher on the same event — they both run, which is usually fine (CC runs all matching hooks), but ordering and timeout interactions must be considered.

---

## Code Examples

Verified command patterns for executing Phase 2 work:

### Gate 1: Stars Check via gh CLI
```bash
# Source: gh CLI docs, verified locally
gh api repos/{owner}/{repo} --jq '{stars: .stargazers_count, last_commit: .pushed_at, description: .description}'
# Example:
gh api repos/upstash/context7 --jq '{stars: .stargazers_count, last_commit: .pushed_at}'
```

### Gate 2: Commit Recency Calculation
```bash
# Get last commit date and calculate days ago
LAST_COMMIT=$(gh api repos/{owner}/{repo} --jq '.pushed_at')
DAYS_AGO=$(( ( $(date +%s) - $(date -jf "%Y-%m-%dT%H:%M:%SZ" "$LAST_COMMIT" +%s 2>/dev/null || date -d "$LAST_COMMIT" +%s) ) / 86400 ))
echo "Last commit: $LAST_COMMIT — $DAYS_AGO days ago"
```

### Gate 3: Self-Management Command Verification Pattern
```bash
# Verify install command works (dry run / --help)
npx -y @upstash/context7-mcp@latest --help 2>&1 | head -5
# Verify update command
npm view @upstash/context7-mcp version
```

### GSD Version Check Pattern
```bash
# Installed version
cat ~/.claude/get-shit-done/VERSION
# Latest on npm
npm view get-shit-done-cc version
```

### Graphiti Health Check Pattern
```bash
# Verify Graphiti is operational
curl -s http://localhost:8100/health
# Check MCP registration
claude mcp list
```

### Config File Conflict Check Pattern
```bash
# Verify single mcpServers key in .claude.json
python3 -c "import sys,json; d=json.load(open('$HOME/.claude.json')); keys=[k for k in d if k=='mcpServers']; print(len(keys),'mcpServers key(s)')"
# Count hooks registered
python3 -c "import sys,json; d=json.load(open('$HOME/.claude/settings.json')); hooks=d.get('hooks',{}); [print(k,len(v),'hooks') for k,v in hooks.items()]"
```

---

## State of the Art

| Area | Current State (2026-03-16) | Implication for Phase 2 |
|------|---------------------------|------------------------|
| Writing MCPs | Essentially none pass gates — writing tools exist as CC Skills only, not MCP servers | WRIT-01/02 assessments will be skills-focused, not MCP-focused |
| CC Skills ecosystem | Large and growing (11K+ stars awesome-agent-skills, 5K+ alirezarezvani/claude-skills) | Strong candidate pool for writing skills discovery |
| GSD framework | v1.25.1 installed, latest also v1.25.1 — already current | GMGR-01 documents current state; no update needed pre-documentation |
| Graphiti hooks | All 5 lifecycle events covered (SessionStart, UserPromptSubmit, PostToolUse, PreCompact, Stop) | MEMO-03 gap analysis starts from a well-covered baseline |
| Neo4j browser | Running at localhost:7475 (port offset from default to avoid DDEV conflicts) | MEMO-01 has one built-in browsing option already available |
| MCP transport | SSE deprecated as of March 2026; stdio and HTTP are the two valid transports | Any candidate using SSE-only is flagged per ANTI-FEATURES Not Evaluated section |

**Deprecated/outdated:**
- SSE transport: removed from MCP spec as of March 2026; tools with SSE as only transport go to "Not Evaluated" section in assessments
- Manual ~/.claude.json editing: anti-pattern — `claude mcp add` is the only safe approach
- `--scope global`: old name for `--scope user` — assessors should document the current correct flag

---

## The Five Named Candidates — Pre-Research Summary

This section arms assessors with all data collected before Phase 2 begins, reducing redundant lookup work.

### Context7 MCP (DOCS-01)

| Field | Value | Source |
|-------|-------|--------|
| Repo | upstash/context7 | FEATURES.md |
| Stars | 49,270 | GitHub API, 2026-03-16 |
| Last Commit | 2026-03-16 | GitHub API, 2026-03-16 |
| Publisher Type | established-org (Upstash) | FEATURES.md |
| Stars Gate | Threshold 500 — 49,270 — PASS | Gate 1 |
| Recency Gate | 0 days ago — PREFERRED | Gate 2 |
| Transport | stdio (npx) | FEATURES.md |
| Install Command | `claude mcp add context7 -- npx -y @upstash/context7-mcp@latest` | FEATURES.md |
| Known Issues | Free tier: 60 req/hr, 1,000/month; verify PHP/WP doc coverage depth | STATE.md blockers |

**What the assessor must still do:** Verify configure/update/troubleshoot commands from official docs; estimate context cost (token overhead); verify PHP/WP library coverage; complete pros/cons; assign INCLUDE/CONSIDER/DEFER tier.

---

### WPCS Skill (DOCS-02)

| Field | Value | Source |
|-------|-------|--------|
| Type | CC Skill (file-based markdown) | FEATURES.md |
| Location | ~/.claude/skills/wordpress/SKILL.md | Pattern from PROJECT.md |
| Stars Gate | N/A — file-based skill | See Pitfall 1 above |
| Maintenance | WordPress Coding Standards, actively maintained by WP core team | N/A |
| Context Cost | ~30-50 tokens (Skills file overhead) — design goal of Skills format | FEATURES.md |
| Self-Management | CC can Write/Edit files autonomously | FEATURES.md |

**What the assessor must still do:** Define what the WPCS Skill content should cover (WPCS rules most relevant to CC coding assistance); document the CC self-management commands (Write to install, Edit to update, read to verify); verify zero-context-cost claim is accurate for Skills; document pros/cons; assign tier.

---

### GitHub MCP (DEVT-01)

| Field | Value | Source |
|-------|-------|--------|
| Repo | github/github-mcp-server | FEATURES.md |
| Stars | 27,944 | GitHub API, 2026-03-16 |
| Last Commit | 2026-03-16 | GitHub API, 2026-03-16 |
| Publisher Type | vendor-official (GitHub/Microsoft) | FEATURES.md |
| Stars Gate | Threshold 100 — 27,944 — PASS | Gate 1 |
| Recency Gate | 0 days ago — PREFERRED | Gate 2 |
| Transport | HTTP | FEATURES.md |
| Auth | GitHub PAT (Personal Access Token) | FEATURES.md |
| Known Issue | PAT minimum scope not verified | STATE.md blockers |

**What the assessor must still do:** Verify exact install command from official docs; document PAT scope requirements (check GitHub OAuth docs for minimum scopes for read repos + issues read/write); verify configure/update/troubleshoot commands; estimate context cost; CC duplication check (does GitHub MCP duplicate CC's Bash-based `gh` CLI access? answer: gh CLI is manual shell invocation, GitHub MCP provides structured tool-level access — NOT a duplicate); assign tier.

---

### Playwright MCP (DEVT-02)

| Field | Value | Source |
|-------|-------|--------|
| Repo | microsoft/playwright-mcp | FEATURES.md |
| Stars | 29,037 | GitHub API, 2026-03-16 |
| Last Commit | 2026-03-16 | GitHub API, 2026-03-16 |
| Publisher Type | vendor-official (Microsoft) | FEATURES.md |
| Stars Gate | Threshold 100 — 29,037 — PASS | Gate 1 |
| Recency Gate | 0 days ago — PREFERRED | Gate 2 |
| Transport | stdio (npx) | FEATURES.md |
| Install Command | `npx @playwright/mcp@latest` (auto-installs Chromium) | FEATURES.md |

**What the assessor must still do:** Verify configure/update/troubleshoot commands; measure context cost (number of tools exposed, estimated token overhead); CC duplication check (CC has WebFetch and WebSearch built in — does Playwright MCP duplicate? No: Playwright provides stateful browser automation, accessibility snapshots, form interaction — CC's tools are stateless HTTP fetches, not a duplicate); assess security notes (browser can access internal DDEV sites); assign tier.

---

### Sequential Thinking MCP (DEVT-03)

| Field | Value | Source |
|-------|-------|--------|
| Repo | modelcontextprotocol/servers (monorepo) | FEATURES.md |
| Stars | 81,234 (monorepo) | GitHub API, 2026-03-16 |
| Last Commit | 2026-03-15 | GitHub API, 2026-03-16 |
| Publisher Type | vendor-official (Anthropic) | FEATURES.md |
| Stars Gate | Threshold 100 — 81,234 — PASS | Gate 1 |
| Recency Gate | 1 day ago — PREFERRED | Gate 2 |
| Transport | stdio (npx) | FEATURES.md |
| Install Command | `npx @modelcontextprotocol/server-sequential-thinking` | FEATURES.md |
| API Key | None required | FEATURES.md |

**What the assessor must still do:** Verify configure/update/troubleshoot commands; measure context cost (1 tool exposed: `sequentialthinking` — estimated very low overhead); CC duplication check (CC has native reasoning capabilities via model — does Sequential Thinking duplicate? Judgment call: it structures reasoning explicitly via thought chains, which is additive to, not duplicative of, model-native reasoning); verify community fork warning is documented; assign tier.

---

## Writing Tools Candidate Pool

### Creative Writing (WRIT-01)

Discovery from research — candidates to evaluate in Phase 2:

| Candidate | Type | Stars | Last Commit | Publisher | Notes |
|-----------|------|-------|-------------|-----------|-------|
| haowjy/creative-writing-skills | CC Skills collection | 79 | 2025-11-02 | Community | 6 skills (prose, brainstorming, critique, style); last commit 4+ months ago — will FAIL Gate 2 (>90 days) at time of assessment |
| alirezarezvani/claude-skills | CC Skills collection | 5,384 | 2026-03-15 | Community | 192+ skills including marketing/copywriting content; PASSES all gates; subset relevant to creative writing |
| Jeffallan/claude-skills | CC Skills collection | 6,844 | 2026-03-06 | Community | 66 skills for full-stack devs; check for creative writing coverage |
| VoltAgent/awesome-agent-skills | Aggregator/index | 11,475 | 2026-03-12 | Community | Curated list — not a skill itself, use as discovery source for candidates |
| haowjy/creative-writing-skills mcpmarket equivalent | CC Skill (mcpmarket) | N/A | N/A | Community | mcpmarket.com/es/tools/skills/creative-writing-craft-3 — needs GitHub repo lookup |

**Assessment note for WRIT-01:** The primary finding is that writing MCPs are nearly absent from the ecosystem. The viable tools are CC Skills (file-based). The assessor should document this landscape finding at the top of the CREATIVE-WRITING.md deliverable, then surface top 5 candidates and apply gates.

**High probability finding:** haowjy/creative-writing-skills will FAIL Gate 2 (last commit 2025-11-02, 135+ days ago at time of assessment). The assessor should document this clearly. The alirezarezvani/claude-skills repo is the strongest bet for creative writing coverage given its 5,384 stars and active maintenance.

---

### Technical Writing (WRIT-02)

| Candidate | Type | Stars | Last Commit | Publisher | Notes |
|-----------|------|-------|-------------|-----------|-------|
| alirezarezvani/claude-skills | CC Skills collection | 5,384 | 2026-03-15 | Community | 192+ skills including technical writing/documentation skills |
| Jeffallan/claude-skills | CC Skills collection | 6,844 | 2026-03-06 | Community | Production-ready skills for full delivery workflow; documentation skills included |
| levnikolaevich/claude-code-skills | CC Skills collection | Unknown | Unknown | Community | References DIATAXIS documentation framework; check stars/recency |
| VoltAgent/awesome-agent-skills | Aggregator | 11,475 | 2026-03-12 | Community | NeoLabHQ/write-concisely listed: applies Elements of Style for cleaner docs |
| mcpmarket.com/tools/skills/technical-writing-expert | CC Skill | N/A | N/A | Community | Needs GitHub repo lookup for gate evaluation |

**Assessment note for WRIT-02:** Technical writing skills are better represented than creative writing in the CC Skills ecosystem. DIATAXIS framework integration, structured documentation, and README skills appear across multiple repos. The assessor should surface top 5 from these and apply gates.

---

## Memory System — Existing Setup Analysis (MEMO-03 Foundation)

This section documents the current Graphiti hook system so the MEMO-03 gap analysis starts from an accurate baseline.

### Current Hook Coverage

| Hook Event | Trigger | Script | What It Captures |
|------------|---------|--------|-----------------|
| SessionStart (startup/resume) | CC session start | session-start.sh | User preferences (global), project context, recent session summaries — curated by Haiku |
| SessionStart (compact) | After compaction | session-start.sh | Same as above — re-injects context post-compaction |
| UserPromptSubmit | Every prompt >15 chars | prompt-augment.sh | Semantic search of project + global scope, Haiku-curated to 3-5 items |
| PostToolUse (Write/Edit/MultiEdit) | File write/edit | capture-change.sh | File path + tool name stored as episode (async, non-blocking) |
| PreCompact | Before context compaction | preserve-knowledge.sh | Haiku session summary extracted and stored; re-injected as [PRESERVED CONTEXT] |
| Stop | Session end | session-summary.sh | Haiku summary stored in project scope + session:{timestamp} scope |

### Current Hook Gaps (Preliminary Analysis for MEMO-03)

The MEMO-03 assessor must define "ideal capture" and diff against this list. Based on reading the hooks:

| Gap Category | What's Missing | Severity |
|--------------|---------------|---------|
| Bash tool capture | PostToolUse does not fire on Bash executions — commands run, outputs produced, but not captured in memory | MEDIUM — shell commands contain rich context (errors, discovered paths, test results) |
| Read tool capture | File reads are not captured — CC reads many files, but which files were consulted is not stored | LOW — mostly noise, but key reference files could be tracked |
| TodoWrite capture | Task creation/completion is not captured in memory | LOW — GSD manages todos, not Graphiti |
| Explicit user memory commands | Graphiti MCP tools (add_memory, search_memory_facts) are available in CLAUDE.md but there's no systematic prompt to capture explicit user statements like "remember that..." | MEDIUM — relies on model following CLAUDE.md instructions |
| Error/failure capture | When Bash commands fail, the error is not stored as a BugPattern or TechDebt entity | MEDIUM — lost diagnostic context |
| Context quality metrics | No feedback loop on whether curated memories are actually being used — no way to identify which memories are never retrieved and could be pruned | LOW — operational optimization gap |
| Cross-project global preference capture | When user makes a preference statement in a project scope session, it isn't automatically promoted to global scope | LOW — scope escalation logic is absent |

---

## Memory Browsing and Session Visibility — Preliminary Options (MEMO-01, MEMO-02)

### MEMO-01: Browsing Interface Options

| Approach | What It Is | Pros | Cons | Viability |
|----------|-----------|------|------|-----------|
| Neo4j Browser (localhost:7475) | Built-in Neo4j web UI, already running | Already available, no install needed; full Cypher query support; visual graph view; no new tools | Requires knowing Cypher; not indexed on CC entities specifically; technical UX | VIABLE — exists today |
| Graphiti MCP tools (search_nodes, search_memory_facts, get_episodes) | CC can query the graph directly | Already installed, no new tool needed; CC-native interface | No "browse all" capability — requires query; not a browsing UI | VIABLE as workaround — not a true browse UI |
| mcp-neo4j-cypher (neo4j-contrib) | MCP that converts natural language to Cypher queries | Natural language interface to the graph; neo4j-contrib org (community) | Additional MCP = context budget cost; neo4j-contrib not official Neo4j vendor (different org); must pass gates | NEEDS ASSESSMENT — apply vetting protocol |
| Neo4j Aura console | Cloud-hosted Neo4j UI | Full featured | Graphiti runs locally, not on Aura | NOT VIABLE — wrong deployment model |

**MEMO-01 assessor task:** Apply vetting protocol to mcp-neo4j-cypher as a candidate. Document Neo4j browser as the already-available workaround. If mcp-neo4j-cypher passes gates, recommend it as the improved browsing approach.

### MEMO-02: Session Visibility Options

| Approach | What It Is | Pros | Cons | Viability |
|----------|-----------|------|------|-----------|
| get_episodes MCP tool | Retrieve episodes by group_id | Already installed; can retrieve session:{timestamp} scope entries | No listing of available session scopes — must know the timestamp | VIABLE as workaround — limited discoverability |
| Custom CC command | A slash command that lists all session:* scope entries | CC-native | Requires custom build — locked decision says no custom builds for MEMO-01/02 | NOT VIABLE per locked decision |
| search_memory_facts for session summaries | Search "session summary" across all scopes | Already installed | Returns summaries, not a structured session list | VIABLE as workaround |
| Graphiti Python client directly | Run graphiti-helper.py commands from CC Bash | CC can run Bash; helper exists | CLI-only, not a browsing UI; requires Graphiti server running | VIABLE as workaround |

**MEMO-02 assessor task:** Document the gap (no structured session listing exists), document available workarounds, flag for v2 if no existing tool is found that passes gates.

---

## GSD Self-Management Commands (GMGR-01 Foundation)

The GMGR-01 runbook author has all necessary data already on this machine. This section summarizes what was discovered during research.

### GSD Installed State

| Property | Value |
|----------|-------|
| Installed version | 1.25.1 |
| Latest npm version | 1.25.1 (already current as of 2026-03-16) |
| Install location | ~/.claude/get-shit-done/ |
| Commands location | ~/.claude/commands/gsd/ |
| Agents location | ~/.claude/agents/gsd-* |
| Hook scripts | ~/.claude/hooks/gsd-check-update.js, gsd-context-monitor.js, gsd-statusline.js |
| GitHub repo | gsd-build/get-shit-done (31,023 stars, last commit 2026-03-16T19:42:35Z) |
| npm package | get-shit-done-cc |

### GSD Lifecycle Commands

| Operation | Command | Notes |
|-----------|---------|-------|
| Install (global) | `npx get-shit-done-cc@latest --claude --global` | Installs to ~/.claude/ |
| Install (local) | `npx get-shit-done-cc@latest --claude --local` | Installs to ./.claude/ |
| Update (CC command) | `/gsd:update` | Checks npm, shows changelog, confirms, runs install |
| Update (raw) | `npx get-shit-done-cc@latest --claude --global` | Wipes and reinstalls |
| Uninstall | `npx get-shit-done-cc --claude --global --uninstall` | Removes gsd commands, agents, hooks |
| Check version | `cat ~/.claude/get-shit-done/VERSION` | Current installed version |
| Check latest | `npm view get-shit-done-cc version` | Latest available on npm |
| Troubleshoot | `node ~/.claude/get-shit-done/bin/gsd-tools.cjs validate health` | GSD health check |
| Health check | `/gsd:health` or `node ~/.claude/get-shit-done/bin/gsd-tools.cjs validate health` | Validates .planning/ integrity |

**Update process detail (from update.md):** The `/gsd:update` command performs: (1) detect installed version from VERSION file, (2) `npm view get-shit-done-cc version` for latest, (3) if update available: fetch changelog from GitHub raw URL, extract entries between versions, display preview, confirm with user, (4) run `npx get-shit-done-cc@latest --claude --global`, (5) clear update cache `rm -f ~/.claude/cache/gsd-update-check.json`. The installer backs up locally modified GSD files to `gsd-local-patches/` before overwriting.

---

## Coexistence Strategy Foundation (GMGR-02)

### Config File Separation (Current State)

| File | Owner | Contents | Managed By |
|------|-------|----------|------------|
| `~/.claude.json` | CC core | MCP registrations (mcpServers key), numStartups, autoUpdates | `claude mcp add/remove` commands only — never manual edits |
| `~/.claude/settings.json` | CC core | hooks, permissions (allow/deny/ask), env vars, model, plugins, statusLine | Edit file (structured JSON) |
| `~/.claude/get-shit-done/` | GSD | Workflows, references, templates, VERSION, bin/ | `npx get-shit-done-cc` installer |
| `~/.claude/commands/gsd/` | GSD | User-facing slash commands | `npx get-shit-done-cc` installer |
| `~/.claude/agents/gsd-*` | GSD | Agent markdown files | `npx get-shit-done-cc` installer |
| `~/.claude/hooks/` | GSD | gsd-check-update.js, gsd-context-monitor.js, gsd-statusline.js | `npx get-shit-done-cc` installer |
| `~/.claude/graphiti/` | Graphiti | Docker stack, config, helper, hooks scripts | Manual (docker compose, python scripts) |
| `~/.claude/graphiti/hooks/` | Graphiti | 5 bash hook scripts | Manual / Graphiti setup |

### Current Hook Registrations in settings.json

| Event | Hooks Registered |
|-------|-----------------|
| SessionStart | 2: graphiti/session-start.sh (startup/resume), graphiti/session-start.sh (compact), gsd-check-update.js (no matcher) |
| UserPromptSubmit | 1: graphiti/prompt-augment.sh |
| PostToolUse | 2: graphiti/capture-change.sh (Write/Edit/MultiEdit), gsd-context-monitor.js (no matcher) |
| PreCompact | 1: graphiti/preserve-knowledge.sh |
| Stop | 1: graphiti/session-summary.sh |

### Coexistence Risks

| Risk | Description | Mitigation |
|------|-------------|-----------|
| mcpServers key collision | If two tools both add an entry named the same thing to ~/.claude.json, one silently overrides the other | Use namespaced server names (e.g., `graphiti`, `context7`, `github-mcp`) — already done for graphiti |
| Hook timeout cascade | Multiple hooks on same event with tight timeouts — if first hook is slow, CC waits before running next | GSD hooks have no timeout configured; Graphiti hooks have 10-30s timeouts. New tools' hooks should have explicit timeouts ≤10s |
| Plugin enabledPlugins key collision | Two plugins with same identifier — last one registered wins | Use unique plugin identifiers; document currently enabled plugins (plugin-dev@claude-plugins-official, superpowers-extended-cc@superpowers-extended-cc-marketplace) |
| ~/.claude/skills/ namespace | If two skill packages use same folder name, files overwrite silently | Use descriptive subfolder names (e.g., skills/wordpress/, skills/writing/) |
| PATH not set for new stdio MCPs | New stdio MCP using npx fails silently if PATH not in settings.json env block | Current settings.json does NOT have explicit PATH env var — this is a potential risk for new stdio MCPs. Document as coexistence requirement. |

**Critical finding:** The current `~/.claude/settings.json` does NOT include an explicit PATH env variable in the `env` block. FEATURES.md and PITFALLS.md both flag this as required for stdio MCPs using npx to work reliably. The coexistence doc must flag this as a prerequisite for adding any new stdio MCP tools.

---

## Open Questions

1. **Context7 PHP/WP coverage depth**
   - What we know: Context7 has 49K+ stars and covers many libraries
   - What's unclear: Whether PHP 8.x core functions and WordPress 6.x API coverage are complete at the free tier
   - Recommendation: Document as a known gap; note free tier limits (60 req/hr); verify in Phase 3 (hands-on testing)

2. **GitHub MCP PAT minimum scope**
   - What we know: Requires a GitHub PAT; should be narrow-scoped
   - What's unclear: Exact minimum scopes for the full GitHub MCP feature set (repo read, issues, PRs, code search)
   - Recommendation: Check official github-mcp-server README for documented minimum scopes; document finding in DEVT-01 assessment

3. **Writing tools viable candidate count**
   - What we know: haowjy/creative-writing-skills is likely to fail Gate 2 (135+ days since last commit); writing MCP servers don't meaningfully exist
   - What's unclear: Whether any single skills repo passes all gates AND has meaningful writing-specific coverage worth recommending vs. just noting "this general skills repo has some writing content"
   - Recommendation: WRIT-01/02 assessor must determine whether to recommend the whole skills repo (e.g., alirezarezvani/claude-skills) or document "no single-purpose writing tool found; general skills repos have partial coverage"

4. **mcp-neo4j-cypher gate eligibility (MEMO-01)**
   - What we know: neo4j-contrib/mcp-neo4j exists; the cypher server converts natural language to Cypher queries
   - What's unclear: Stars count, last commit date, whether it passes all 4 gates
   - Recommendation: MEMO-01 assessor must run full gate evaluation on neo4j-contrib/mcp-neo4j before recommending it

5. **PATH requirement for new stdio MCPs**
   - What we know: Current settings.json has no PATH in env block; PITFALLS.md identifies this as a risk
   - What's unclear: Whether existing MCPs (only graphiti, which is HTTP not stdio) have been affected; whether this is an immediate issue or future risk
   - Recommendation: GMGR-02 must document this as a prerequisite — before adding any stdio MCP, add PATH to settings.json env block: `"PATH": "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"`

---

## Validation Architecture

> nyquist_validation is enabled in .planning/config.json.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | N/A — Phase 2 produces markdown documentation only, no code |
| Config file | None required |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements — Test Map

This phase produces documentation artifacts (markdown files). "Testing" means verification that each deliverable exists and contains required content.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOCS-01 | Context7 assessment exists with all scorecard fields filled | Manual review | Check `.planning/phases/02-research/assessments/CONTEXT7.md` exists and contains all gate results | ❌ Wave 0 |
| DOCS-02 | WPCS Skill assessment exists with all scorecard fields filled | Manual review | Check `.planning/phases/02-research/assessments/WPCS-SKILL.md` exists | ❌ Wave 0 |
| DEVT-01 | GitHub MCP assessment complete | Manual review | Check `.planning/phases/02-research/assessments/GITHUB-MCP.md` exists | ❌ Wave 0 |
| DEVT-02 | Playwright MCP assessment complete | Manual review | Check `.planning/phases/02-research/assessments/PLAYWRIGHT-MCP.md` exists | ❌ Wave 0 |
| DEVT-03 | Sequential Thinking MCP assessment complete | Manual review | Check `.planning/phases/02-research/assessments/SEQUENTIAL-THINKING-MCP.md` exists | ❌ Wave 0 |
| WRIT-01 | Creative writing research document with top 5 candidates and gate results | Manual review | Check `.planning/phases/02-research/writing-tools/CREATIVE-WRITING.md` exists | ❌ Wave 0 |
| WRIT-02 | Technical writing research document with top 5 candidates and gate results | Manual review | Check `.planning/phases/02-research/writing-tools/TECHNICAL-WRITING.md` exists | ❌ Wave 0 |
| GMGR-01 | GSD lifecycle runbook complete with all 4 lifecycle operations | Manual review | Check `.planning/phases/02-research/setup/GSD-LIFECYCLE.md` exists | ❌ Wave 0 |
| GMGR-02 | Coexistence strategy doc covers config files and hook namespaces | Manual review | Check `.planning/phases/02-research/setup/COEXISTENCE.md` exists | ❌ Wave 0 |
| MEMO-01 | Browsing interface approach comparison with recommendation | Manual review | Check `.planning/phases/02-research/memory/MEMO-01-BROWSING.md` exists | ❌ Wave 0 |
| MEMO-02 | Session visibility approach comparison with recommendation | Manual review | Check `.planning/phases/02-research/memory/MEMO-02-SESSIONS.md` exists | ❌ Wave 0 |
| MEMO-03 | Hook gap analysis with ideal-vs-actual diff | Manual review | Check `.planning/phases/02-research/memory/MEMO-03-HOOK-GAPS.md` exists | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** Verify the deliverable file exists and is non-empty
- **Per wave merge:** Review all deliverables against their requirement criteria
- **Phase gate:** Final review plan (Plan D) reads all 12 deliverables and verifies every requirement criterion is satisfied before `/gsd:verify-work`

### Wave 0 Gaps

All 12 deliverable files need to be created during Phase 2 execution. No test infrastructure setup is required — verification is manual file existence + content review.

- [ ] `assessments/CONTEXT7.md` — DOCS-01
- [ ] `assessments/GITHUB-MCP.md` — DEVT-01
- [ ] `assessments/PLAYWRIGHT-MCP.md` — DEVT-02
- [ ] `assessments/SEQUENTIAL-THINKING-MCP.md` — DEVT-03
- [ ] `assessments/WPCS-SKILL.md` — DOCS-02
- [ ] `writing-tools/CREATIVE-WRITING.md` — WRIT-01
- [ ] `writing-tools/TECHNICAL-WRITING.md` — WRIT-02
- [ ] `setup/GSD-LIFECYCLE.md` — GMGR-01
- [ ] `setup/COEXISTENCE.md` — GMGR-02
- [ ] `memory/MEMO-01-BROWSING.md` — MEMO-01
- [ ] `memory/MEMO-02-SESSIONS.md` — MEMO-02
- [ ] `memory/MEMO-03-HOOK-GAPS.md` — MEMO-03

---

## Sources

### Primary (HIGH confidence)

- `.planning/phases/01-methodology/VETTING-PROTOCOL.md` — 4 hard gates, scorecard template, tier criteria (read directly)
- `.planning/phases/01-methodology/ANTI-FEATURES.md` — 7 named exclusions, 4 category rules (read directly)
- `.planning/research/FEATURES.md` — Stars/commit data for all 5 named candidates, verified 2026-03-16 via GitHub API (read directly)
- `.planning/research/PITFALLS.md` — Config corruption patterns, self-management failure modes (read directly)
- `.planning/research/SUMMARY.md` — Architecture patterns, config file relationships (read directly)
- `~/.claude/settings.json` — Actual hook registrations and permissions (read directly)
- `~/.claude.json` — MCP server registrations, autoUpdates setting (read directly)
- `~/.claude/graphiti/hooks/*.sh` — All 5 hook scripts (read directly)
- `~/.claude/graphiti/docker-compose.yml` — Container configuration (read directly)
- `~/.claude/graphiti/PLAN.md` — Graphiti implementation plan with full architecture detail (read directly)
- `~/.claude/get-shit-done/VERSION` — Installed version 1.25.1 (read directly)
- `~/.claude/get-shit-done/workflows/update.md` — Full update lifecycle procedure (read directly)
- `gh api repos/gsd-build/get-shit-done` — 31,023 stars, last commit 2026-03-16 (verified via gh CLI)
- `npm view get-shit-done-cc version` — Latest version 1.25.1 (verified)

### Secondary (MEDIUM confidence)

- GitHub API via gh CLI: stars and last commit for haowjy/creative-writing-skills (79 stars, 2025-11-02), alirezarezvani/claude-skills (5,384 stars, 2026-03-15), Jeffallan/claude-skills (6,844 stars, 2026-03-06), VoltAgent/awesome-agent-skills (11,475 stars, 2026-03-12), Chat2AnyLLM/awesome-claude-skills (95 stars, 2026-03-16) — verified
- WebSearch: Writing tools ecosystem overview, CC Skills landscape 2026 — cross-referenced with GitHub data
- WebSearch: Neo4j MCP server options, mcp-neo4j-cypher existence confirmed — github.com/neo4j-contrib/mcp-neo4j (stars/recency not yet verified — MEMO-01 assessor must verify)
- WebSearch: GSD install/update commands — cross-referenced with update.md workflow file

### Tertiary (LOW confidence — verify during execution)

- mcpmarket.com skills listings for technical-writing-expert and creative-writing-craft — exists but GitHub repo backing each not verified (429 errors fetching; WRIT-01/02 assessors must verify)
- Context7 free tier limits (60 req/hr, 1,000/month) — sourced from blog post; verify against current upstash.com/context7 pricing page at assessment time
- levnikolaevich/claude-code-skills DIATAXIS reference — stars and last commit not verified (WRIT-02 assessor must check)

---

## Metadata

**Confidence breakdown:**
- Named candidate data (FEATURES.md): HIGH — GitHub API verified same day
- Writing tools landscape: MEDIUM — discovery phase, specific candidates' gates not yet run
- GSD lifecycle commands: HIGH — verified against local installation and update.md
- Graphiti hook coverage: HIGH — all 5 hook scripts read directly
- Memory browsing options: MEDIUM — options identified, not yet gate-evaluated
- Coexistence risks: HIGH — derived from reading actual config files and documented pitfalls

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (30 days — stable enough; writing tools landscape faster moving, re-check if WRIT discovery is >14 days old)

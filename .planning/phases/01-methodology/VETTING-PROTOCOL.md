# Vetting Protocol: Claude Code Global Setup Enhancers

**Effective Date:** 2026-03-16
**Version:** 1.0
**Purpose:** This protocol defines the binary gates, assessment scorecard, and recommendation tier criteria applied to every MCP/tool candidate in Phase 2. Hard gates are pass/fail with no judgment calls. Recommendation tiers have pre-defined conditions.

---

## Section 1: Decision Tree — Hard Gates

Every candidate tool must pass all four gates in sequence. Failure at any gate ends the assessment immediately with a recorded reason — no further evaluation is performed.

```
Gate 1 → Gate 2 → Gate 3 → Gate 4 → Scorecard
```

---

### Gate 1: GitHub Stars (Tiered by Publisher)

**Question:** Does the tool's GitHub repo meet the minimum star threshold for its publisher type?

| Publisher Type | Examples | Minimum Stars |
|----------------|----------|---------------|
| Official vendor | GitHub, Microsoft, Anthropic, Brave, WordPress | 100 |
| Established org | Upstash, Firecrawl | 500 |
| Community/individual | Any repo not from a recognized vendor or established org | 1,000 |

**PASS:** Stars >= threshold for publisher type → Proceed to Gate 2
**FAIL:** Stars < threshold → Record "Stars: [count] below [tier] threshold of [required]" → ELIMINATED

---

### Gate 2: Commit Recency (Graduated Window)

**Question:** When was the last commit to the repository's default branch?

| Window | Classification | Action |
|--------|---------------|--------|
| ≤30 days | PREFERRED | Proceed to Gate 3 |
| 31–90 days | ACCEPTABLE | Proceed to Gate 3 with mandatory justification note |
| >90 days | HARD FAIL | ELIMINATED |

**PREFERRED record format:** "Last commit [YYYY-MM-DD] — [N] days ago — PREFERRED"
**ACCEPTABLE record format:** "Last commit [YYYY-MM-DD] — [N] days ago — ACCEPTABLE: [justification, e.g., 'stable release, no open security issues']"
**FAIL record format:** "Last commit [YYYY-MM-DD] — [N] days ago — hard fail (>90 days)" → ELIMINATED

---

### Gate 3: Self-Management Capability (4 Operations)

**Question:** Can Claude Code perform ALL four lifecycle operations via documented commands?

| Operation | Requirement |
|-----------|-------------|
| Install | Must have a documented command Claude Code can run without user touching config files |
| Configure | Must have a documented command for all required configuration (API keys, env vars, etc.) |
| Update | Must have a documented command to update the server package and verify the update |
| Troubleshoot | Must have a documented command to diagnose failures (list, status, log check) |

Each operation must have a documented command from official sources.

**PASS:** All 4 ops have documented commands → Proceed to Gate 4
**FAIL:** Any op missing → Record "Self-management FAIL: [op name(s)] not documented" → ELIMINATED

**Note:** Self-management is PASSED only when all four operations have documented commands from official sources. Partial documentation = FAIL.

---

### Gate 4: CC Built-in Duplication Check

**Question:** Does this tool duplicate a capability Claude Code provides natively?

| CC Built-in Capability | Native Tool | Duplicating MCP (examples) |
|------------------------|-------------|---------------------------|
| File read/write/edit | Read, Write, Edit | Filesystem MCP |
| File search by pattern | Glob | Filesystem MCP |
| Content search | Grep | Filesystem MCP |
| Shell execution | Bash | Desktop Commander |
| Web page fetching | WebFetch | Fetch MCP |
| Web search | WebSearch | (evaluate carefully) |
| Subagent spawning | Task | — |
| Task tracking | TodoWrite | — |

**PASS:** No duplication → Proceed to scorecard
**FAIL:** Duplicates a built-in → Record "CC duplication: duplicates [tool name]" → ELIMINATED

**Note:** Tools that enhance or extend a CC built-in (e.g., Brave Search providing a different search index than WebSearch) are NOT duplicates. Only tools that replicate the same capability with no additional value are eliminated.

---

## Section 2: Assessment Scorecard Template

> Copy this template for each Phase 2 assessment. Every structured field must be answerable by: (a) running a CLI command, (b) visiting a single specific URL, or (c) applying a rule from this protocol. If completing a field requires judgment or open-ended research, it belongs in Pros/Cons, not in a structured field.

---

```markdown
## Tool Assessment: [Tool Name]

**Assessment Date:** [YYYY-MM-DD]
**Assessor:** Claude Code
**Source Repo:** [GitHub URL]

### Identity

| Field | Value |
|-------|-------|
| Name | [tool name] |
| Repo URL | [GitHub URL] |
| Stars | [count] (as of [date]) |
| Last Commit | [YYYY-MM-DD] |
| Transport Type | [stdio / http / sse] |
| Publisher | [vendor-official / established-org / community] |

### Hard Gate Results

| Gate | Threshold | Actual | Result |
|------|-----------|--------|--------|
| Stars | [tier threshold] | [count] | PASS / FAIL |
| Commit Recency | ≤30 days preferred, ≤90 hard limit | [days ago] | PASS / ACCEPTABLE / FAIL |
| Self-Management: Install | Must have documented command | [command or MISSING] | PASS / FAIL |
| Self-Management: Configure | Must have documented command | [command or MISSING] | PASS / FAIL |
| Self-Management: Update | Must have documented command | [command or MISSING] | PASS / FAIL |
| Self-Management: Troubleshoot | Must have documented command | [command or MISSING] | PASS / FAIL |
| CC Duplication | Must not duplicate CC built-in | [duplicates X / no duplication] | PASS / FAIL |

**Gate Summary:** [ALL PASS → continue to scorecard] / [FAILED: Gate N — reason → ELIMINATED]

### Context Cost Estimate

| Field | Value |
|-------|-------|
| Tool count exposed | [number] |
| Estimated token overhead | [~N tokens] |
| Source | [how measured] |

### Self-Management Commands

| Operation | Command | Source |
|-----------|---------|--------|
| Install | `[command]` | [official docs URL] |
| Configure | `[command]` | [official docs URL] |
| Update | `[command]` | [official docs URL] |
| Troubleshoot | `[command]` | [official docs URL] |

### Security Findings

**mcp-scan result:** [not yet run — Phase 3 / clean / [findings]]
**Known CVEs:** [none / list]
**Risk level:** [LOW / MEDIUM / HIGH]
**Notes:** [any specific concerns]

> Security is informational only — not a hard gate. Findings are presented in the Phase 3 ranked report for user decision.

### WordPress/PHP Relevance

*(Complete if tool has PHP/WP-specific value; omit if general-purpose with no stack-specific considerations.)*

[value description or omitted]

### Pros and Cons

**Pros:**
- [strength]

**Cons / Caveats:**
- [weakness or caveat]

### Verdict

**Tier:** [INCLUDE / CONSIDER / DEFER / ELIMINATED]
**Rationale:** [1-2 sentences applying tier criteria from vetting protocol]
```

---

## Section 3: Recommendation Tier Criteria

Pre-defined conditions for each tier. Phase 2 assessors assign tiers at assessment time by applying these conditions directly — no deliberation required at Phase 3.

| Tier | Conditions |
|------|-----------|
| INCLUDE | Passes all 4 hard gates + fills a capability gap CC doesn't cover natively + no known overlap with another INCLUDE candidate |
| CONSIDER | Passes all 4 hard gates + provides value but overlaps with another INCLUDE candidate OR requires API key with potential cost implications OR scope is partially project-level rather than purely global |
| DEFER | Passes all 4 hard gates + genuinely valuable but has a timing dependency (e.g., awaiting WP 7.0), OR is a v2 requirement per REQUIREMENTS.md, OR adds value only after v1 tools are validated |
| ELIMINATED | Failed one or more hard gates — do not include in ranked report |

**Note:** Tier assignment is made at assessment time by the Phase 2 assessor, applying these conditions. If an edge case arises that doesn't cleanly match a tier, the assessor records the ambiguity in Pros/Cons and assigns the closest matching tier with an explanatory note.

---

## Section 4: SSE Transport Deprecation Notice

Tools using SSE (Server-Sent Events) transport are NOT automatically disqualified. SSE is flagged as a deprecation risk in the Identity section of the assessment scorecard. The risk is documented for the user's decision in the Phase 3 ranked report. Assessors should note whether the tool has an alternative transport (HTTP or stdio) available. Tools with SSE as their only transport option and no HTTP/stdio alternative are flagged accordingly; the user decides whether to include them given the deprecation trajectory.

---

## Section 5: Community Fork Policy

Community forks of official vendor servers are assessed case-by-case — they are not blanket-excluded. A fork that adds genuine value over the official server is assessed on its own merits against all four gates. However, when an official vendor server exists and meets all gates, a community fork must demonstrate clear, documented superiority (not just additional features) to be preferred over the official server. When in doubt, the official vendor server is preferred due to verifiable authorship and accountability. See also: ANTI-FEATURES.md for the supply chain risk category covering generic community forks.

---

*Protocol version: 1.0*
*Effective: 2026-03-16*
*Feeds into: Phase 2 tool assessments*
*Pre-filter: ANTI-FEATURES.md (check before applying this protocol)*

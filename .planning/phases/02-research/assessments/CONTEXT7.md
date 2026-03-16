## Tool Assessment: Context7 MCP

**Assessment Date:** 2026-03-16
**Assessor:** Claude Code
**Source Repo:** https://github.com/upstash/context7

---

### Pre-Filter Check (ANTI-FEATURES.md)

Context7 MCP is not listed in the named exclusion list. Category rules:
- Not a CC built-in duplicate (CC has no native library documentation lookup tool)
- Not abandoned/archived (actively maintained, 49,280 stars)
- Not out-of-scope (documentation tool for WP/PHP developer — in scope per DOCS-01)
- Not a security/supply chain risk (Upstash is an established org with verified authorship)

**Result: Pre-filter PASSED — proceed to gate evaluation.**

---

### Identity

| Field | Value |
|-------|-------|
| Name | Context7 MCP |
| Repo URL | https://github.com/upstash/context7 |
| Stars | 49,280 (as of 2026-03-16) |
| Last Commit | 2026-03-16 |
| Transport Type | stdio (npx) — MCP mode; also supports HTTP remote endpoint |
| Publisher | established-org (Upstash) |

---

### Hard Gate Results

| Gate | Threshold | Actual | Result |
|------|-----------|--------|--------|
| Stars | 500 (established-org threshold) | 49,280 | PASS |
| Commit Recency | ≤30 days preferred, ≤90 hard limit | 0 days ago (same day) | PASS |
| Self-Management: Install | Must have documented command | `claude mcp add-json context7 '{"type":"http","url":"https://mcp.context7.com/mcp"}'` or `npx ctx7 setup --claude` | PASS |
| Self-Management: Configure | Must have documented command | No API key required for free tier; optional: `export CONTEXT7_API_KEY=your_key` for higher limits | PASS |
| Self-Management: Update | Must have documented command | HTTP transport: server-side managed (Upstash handles); stdio: same install command with `@latest` pulls newest version | PASS |
| Self-Management: Troubleshoot | Must have documented command | `claude mcp list` to verify registration; `npx -y @upstash/context7-mcp@latest --help` to verify binary; `/mcp` command in CC to check status | PASS |
| CC Duplication | Must not duplicate CC built-in | No duplication — CC has no native library documentation lookup; WebFetch can fetch docs but provides no library indexing or version-specific retrieval | PASS |

**Gate Summary:** ALL PASS — proceed to scorecard.

---

### Context Cost Estimate

| Field | Value |
|-------|-------|
| Tool count exposed | 2 MCP tools: `resolve-library-id` and `query-docs` |
| Estimated token overhead | ~300–500 tokens (2 tools × ~150–250 tokens per tool definition, including parameter schemas) |
| Source | Official README — "Available Tools" section lists 2 MCP tools; confirmed via https://github.com/upstash/context7 README |

**Note:** Context7 uses CC's 2026 Tool Search lazy-loading feature, so tool definitions are only loaded when invoked — not at session start. Runtime token overhead from retrieved documentation varies: each `query-docs` response returns documentation snippets injected into context (estimated 1K–5K tokens per lookup depending on library and query).

---

### Self-Management Commands

| Operation | Command | Source |
|-----------|---------|--------|
| Install (HTTP) | `claude mcp add-json context7 '{"type":"http","url":"https://mcp.context7.com/mcp"}'` | https://context7.com/docs/resources/all-clients |
| Install (stdio/npx) | `claude mcp add context7 -- npx -y @upstash/context7-mcp@latest` | https://github.com/upstash/context7 README |
| Install (automated setup) | `npx ctx7 setup --claude` | https://github.com/upstash/context7 README — runs OAuth + installs to CC |
| Configure (free tier) | No action required — free tier works without API key (60 req/hr, 1,000/month) | https://context7.com/dashboard — free tier limits documented |
| Configure (paid tier) | `export CONTEXT7_API_KEY=your_key_here` then re-register | https://context7.com/dashboard |
| Update (HTTP mode) | Server-side managed — Upstash deploys updates; no user action needed | https://mcp.context7.com/mcp is always current |
| Update (stdio mode) | Re-run install command: `claude mcp add context7 -- npx -y @upstash/context7-mcp@latest` (npx `@latest` fetches newest) | https://github.com/upstash/context7 README |
| Troubleshoot | `claude mcp list` to verify registration; `npx -y @upstash/context7-mcp@latest --help` to verify binary works; use `/mcp` in CC session to check server status | https://github.com/upstash/context7 README Troubleshooting section |

---

### Security Findings

**mcp-scan result:** not yet run — Phase 3
**Known CVEs:** none published (checked `gh api repos/upstash/context7/security/advisories` — no advisories returned)
**Risk level:** LOW
**Notes:**
- HTTP transport mode: queries are sent to Upstash servers at mcp.context7.com; documentation queries are visible to Upstash — do not include sensitive internal code fragments in library queries
- stdio/npx mode: runs as local process, fetches docs from Upstash API over HTTPS
- No file system access, no code execution beyond the MCP process itself
- Free tier has observable rate limits (60 req/hr, 1,000/month) — hitting limits causes silent degradation, not errors; monitor usage in heavy sessions

---

### WordPress/PHP Relevance

Context7's library coverage for PHP and WordPress at the free tier is a flagged gap from STATE.md: "Context7 PHP/WP coverage depth unverified at free tier."

**What is known from public documentation:**
- Context7 indexes documentation from community-contributed library submissions — any project can be added
- PHP standard library documentation is available (PHP docs are indexed)
- WordPress core API documentation: the WordPress project is listed in Context7's index (searchable at context7.com)
- WP-CLI, WooCommerce, and major WordPress plugins have varying coverage levels depending on community contributions

**Unverified at free tier (recommend hands-on testing in Phase 3):**
- Depth of PHP 8.x-specific API coverage vs. general PHP docs
- WordPress hook reference coverage (do_action, apply_filters parameter signatures)
- Coverage of WP 6.x vs. WP 7.0 versioned documentation
- Whether free tier rate limits (1,000 req/month) are sufficient for a heavy PHP/WP development session

**Assessment:** Context7's primary value (preventing hallucinated APIs, version-specific docs) applies equally to PHP/WordPress as it does to JavaScript frameworks. The gap is depth and breadth of the PHP/WP index, not the tool's capability itself. Recommend Phase 3 hands-on testing with `/wordpress/wordpress` and `/php/php` library IDs to validate coverage before finalizing recommendation.

---

### Pros and Cons

**Pros:**
- Extremely high community adoption (49,280 stars) with Upstash as a credible established org
- Only 2 MCP tools exposed — minimal context overhead compared to multi-tool MCPs
- Directly addresses AI hallucination problem for library APIs — the single most common source of incorrect AI-generated code
- Supports both HTTP (zero local install) and stdio (offline-capable) transport
- Free tier requires no API key to start — zero friction onboarding
- Tool Search lazy-loading means definitions only load when needed
- Active maintenance: last commit same day as assessment

**Cons / Caveats:**
- Free tier limits (60 req/hr, 1,000/month) may constrain heavy documentation sessions; free tier was reduced 92% in January 2026 (from 12,000/month to 1,000/month per public report)
- PHP/WordPress library coverage depth at free tier is unverified — may require paid tier ($10/month) for production WP development use
- Cloud dependency: relies on Upstash servers; no offline operation in HTTP mode (stdio mode works locally but still calls Upstash API for docs)
- Documentation quality depends on community contributions — some libraries may have sparse or outdated indexed docs
- Context injection can consume significant tokens for complex documentation queries (1K–5K tokens per lookup adds up in long sessions)

---

### Verdict

**Tier:** INCLUDE
**Rationale:** Context7 passes all 4 hard gates, fills a capability gap CC does not cover natively (version-specific library documentation lookup with hallucination prevention), and has no overlap with another INCLUDE candidate. The PHP/WP coverage gap is an operational question to verify in Phase 3 hands-on testing, not a gate failure — the tool's architecture is sound and the free tier provides a no-cost entry point for evaluation.

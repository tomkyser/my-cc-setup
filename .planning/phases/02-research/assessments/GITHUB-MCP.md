## Tool Assessment: GitHub MCP Server

**Assessment Date:** 2026-03-16
**Assessor:** Claude Code
**Source Repo:** https://github.com/github/github-mcp-server

---

### Pre-Filter Check (ANTI-FEATURES.md)

GitHub MCP Server is not listed in the named exclusion list. Category rules:
- Not a CC built-in duplicate — CC has `gh` CLI via Bash but the GitHub MCP provides structured semantic tool access (see Gate 4 for full analysis)
- Not abandoned/archived — 27,945 stars, last commit 2026-03-16; official GitHub/Microsoft server
- Not out-of-scope — GitHub integration for source control, PR/issue management is in scope for a developer workflow
- Not a security/supply chain risk — official GitHub repository with verified authorship

**Result: Pre-filter PASSED — proceed to gate evaluation.**

---

### Identity

| Field | Value |
|-------|-------|
| Name | GitHub MCP Server |
| Repo URL | https://github.com/github/github-mcp-server |
| Stars | 27,945 (as of 2026-03-16) |
| Last Commit | 2026-03-16 |
| Transport Type | HTTP (Streamable HTTP) — remote server at `https://api.githubcopilot.com/mcp`; local Docker/binary option also available |
| Publisher | vendor-official (GitHub / Microsoft) |

---

### Hard Gate Results

| Gate | Threshold | Actual | Result |
|------|-----------|--------|--------|
| Stars | 100 (vendor-official threshold) | 27,945 | PASS |
| Commit Recency | ≤30 days preferred, ≤90 hard limit | 0 days ago (same day) | PASS |
| Self-Management: Install | Must have documented command | `claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp","headers":{"Authorization":"Bearer YOUR_GITHUB_PAT"}}'` | PASS |
| Self-Management: Configure | Must have documented command | `export GITHUB_PAT=ghp_xxx` then include in install command; PAT scopes: `repo`, `read:org` documented in official README | PASS |
| Self-Management: Update | Must have documented command | HTTP transport: server-side managed by GitHub; no local update needed. Verify: `claude mcp get github` | PASS |
| Self-Management: Troubleshoot | Must have documented command | `claude mcp list` to verify registration; `claude mcp get github` to inspect config; `/mcp` in CC session to check server status | PASS |
| CC Duplication | Must not duplicate CC built-in | CC has `gh` CLI via Bash tool — see Gate 4 analysis below | PASS (not a duplicate — see analysis) |

**Gate Summary:** ALL PASS — all gates pass including Gate 4 (gh CLI overlap analyzed and determined not to be a duplicate).

**Gate 4 — CC Duplication Analysis (`gh` CLI vs. GitHub MCP):**

Claude Code can invoke `gh` CLI via its native Bash tool. This raises the question of whether the GitHub MCP duplicates an existing CC capability. The analysis:

| Dimension | `gh` CLI via CC Bash | GitHub MCP Structured Tools |
|-----------|---------------------|------------------------------|
| Access pattern | Raw shell command — Claude constructs and executes `gh issue list --json number,title` | Semantic tool call — `issue_read`, `list_issues`, `search_issues` with typed parameters |
| Parameter validation | None — Claude must know exact `gh` flag syntax; errors are string output | Tool-level schema validation — parameters are typed and validated before the API call |
| Composability | Each `gh` call is a separate Bash invocation; chaining requires string parsing | Tools are composable in agent workflows; results are structured objects, not raw JSON strings |
| Discoverability | Claude must know `gh` commands from training data | MCP exposes tool definitions dynamically; Claude sees available operations |
| Context overhead | `gh` is always available — zero token overhead | ~84 tools × ~150 tokens = ~12,600 tokens for full toolset; configurable via toolsets filter |
| Scope of access | Full `gh` CLI capabilities | Structured subset mapped to MCP tools (84 tools covering repos, issues, PRs, code search, security, actions, discussions, etc.) |

**Conclusion:** The GitHub MCP is NOT a duplicate of `gh` CLI. The distinction is semantic tool access vs. raw shell invocation. The MCP provides:
1. Structured tool-call interface with typed parameters and validated responses
2. Agent-native composability — tools are first-class operations, not shell strings
3. Dynamic tool discovery — Claude sees available GitHub operations without training data

However, `gh` CLI via Bash IS a functional alternative for basic GitHub operations. The MCP's value is in structured, agent-native access — not in unique capability that `gh` lacks entirely. This makes the overlap distinction meaningful for the tier verdict (see below).

**Gate 4 result: PASS** — not a duplicate (provides structured semantic access that `gh` CLI via Bash does not; different interface paradigm, not the same capability).

---

### Context Cost Estimate

| Field | Value |
|-------|-------|
| Tool count exposed | 84 tools (verified by counting tool definitions in README) |
| Estimated token overhead | ~12,600 tokens (84 tools × ~150 tokens per tool definition with parameter schemas) |
| Source | `gh api repos/github/github-mcp-server/readme` — counted 84 tool entries in the `## Tools` section of README; estimate based on ~150 tokens per tool definition |

**HIGH context cost — mitigation available:**

The GitHub MCP is one of the highest context-cost MCPs in this plan. Mitigation options:
- **Toolset filtering:** Only enable the toolsets needed (e.g., `repos,issues,pull_requests`) via the `X-MCP-Toolsets` header or `GITHUB_TOOLSETS` env var
- **Tool Search lazy-loading:** CC's 2026 Tool Search feature loads tool definitions only when invoked — reduces startup context cost
- **Minimum toolset:** A minimal read-only `repos,issues` toolset exposes ~15 tools (~2,250 tokens) — viable for most workflows

**Default toolsets (enabled by default):** repos, issues, pull_requests, git (confirmed from docs/toolsets-and-icons.md)

---

### Self-Management Commands

| Operation | Command | Source |
|-----------|---------|--------|
| Install (HTTP, CC 2.1.1+) | `claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp","headers":{"Authorization":"Bearer YOUR_GITHUB_PAT"}}'` | https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-claude.md |
| Install with env var | `claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp","headers":{"Authorization":"Bearer '"$(grep GITHUB_PAT .env \| cut -d '=' -f2)"'"}}'` | install-claude.md |
| Install (older CC, legacy) | `claude mcp add --transport http github https://api.githubcopilot.com/mcp -H "Authorization: Bearer YOUR_GITHUB_PAT"` | install-claude.md (legacy format) |
| Configure: Create PAT | GitHub Settings > Developer settings > Personal access tokens (classic) > New token; grant `repo`, `read:org` scopes | https://github.com/settings/personal-access-tokens/new |
| Configure: Store PAT | `export GITHUB_PAT=ghp_your_token_here` (add to shell profile for persistence) | install-claude.md — Environment Variables section |
| Update | HTTP transport: GitHub manages server-side updates automatically; no user action needed | Server hosted at api.githubcopilot.com — always current |
| Verify installed version | `claude mcp get github` to inspect current config; `claude mcp list` to confirm registration | install-claude.md — Verification section |
| Troubleshoot | `claude mcp list` — verify server registered; `claude mcp get github` — inspect config; use `/mcp` command in CC session; check CC logs via `ls ~/Library/Logs/Claude/` | install-claude.md — Troubleshooting section |
| Troubleshoot: re-register | `claude mcp remove github` then re-run install command | install-claude.md — Troubleshooting section |

---

### Security Findings

**mcp-scan result:** not yet run — Phase 3
**Known CVEs:** none published (official GitHub repository with active security monitoring)
**Risk level:** MEDIUM
**Notes:**

**PAT Security — Primary Concern:**

The GitHub MCP requires a Personal Access Token (PAT) that grants direct access to the user's GitHub account. Key security considerations:

- **Minimum required scopes for standard use:**
  - `repo` — Full repository access (read/write to code, commits, branches, releases, issues, PRs)
  - `read:org` — Read-only access to organization membership, teams
  - *(Optional)* `read:packages` — For Docker image access if using local server

- **Scope risk:** `repo` scope grants write access to all private repositories, not just read. A narrower scope (`public_repo` for public-only, or fine-grained PATs with repository-specific permissions) reduces the attack surface significantly. Fine-grained PATs (GitHub beta feature) allow per-repository scoping.

- **Token storage:** PAT must be stored and passed on each `claude mcp add-json` invocation. Storing in `.env` file is recommended over shell profile to avoid accidental exposure.

- **Recommended security posture:**
  1. Use a fine-grained PAT (not classic PAT) scoped to only the repositories you work with
  2. Grant minimum permissions: `contents:read`, `issues:write`, `pull_requests:write`, `metadata:read`
  3. Set a 90-day expiration on the PAT and rotate it
  4. Add `.env` to `.gitignore` to prevent accidental commit of the PAT

**Network access:** HTTP transport sends all tool calls to `api.githubcopilot.com` — GitHub's own API endpoint; requests are visible to GitHub/Microsoft (expected behavior for a GitHub-managed service).

---

### WordPress/PHP Relevance

General-purpose developer tool — relevant to all repositories regardless of technology stack. No PHP or WordPress-specific considerations.

The GitHub MCP is equally valuable for WordPress plugin repositories, PHP library repos, and any other GitHub-hosted project. The `search_code` tool can search PHP syntax across repositories. The issue/PR management tools apply to any project.

No stack-specific configuration required.

---

### Pros and Cons

**Pros:**
- Official vendor server (GitHub/Microsoft) — highest trust level, verified authorship, no supply chain risk
- 27,945 stars — strong adoption signal; most popular developer tool MCP in this plan
- HTTP transport — zero local installation (no Docker, no npm); API is hosted and maintained by GitHub
- Structured semantic tools enable agent-native workflows (create_issue, search_code, create_pull_request as discrete callable operations)
- 84 tools covering the full GitHub API surface: repos, issues, PRs, actions, security, discussions, gists, organizations
- Toolset filtering allows narrow scope (e.g., only `issues,pull_requests`) to reduce context overhead
- Tool Search lazy-loading mitigates high context cost in practice
- PAT-based auth allows fine-grained access control with fine-grained PATs

**Cons / Caveats:**
- HIGH context cost: 84 tools × ~150 tokens = ~12,600 tokens at full toolset; manageable with toolset filtering but requires configuration
- `repo` scope on classic PAT grants write access to all private repos — over-privileged if most operations are read-only; mitigated by fine-grained PATs
- CC already has `gh` CLI via Bash — for simple operations (`gh issue list`, `gh pr create`), the MCP adds overhead without changing outcomes
- PAT rotation is a recurring maintenance task (especially with 90-day expiry)
- Remote server requires network connectivity to api.githubcopilot.com — no offline operation
- Tool count will grow over time — future additions may increase context cost further
- `repo` write scope means an accidental or adversarial tool call could push commits or merge PRs — higher stakes than a read-only API

---

### Verdict

**Tier:** CONSIDER
**Rationale:** GitHub MCP passes all 4 hard gates and provides genuine value through structured semantic GitHub tool access. However, CC already provides `gh` CLI via Bash (functional overlap even if not duplication), the PAT requires security-conscious configuration, and the 84-tool context cost is the highest of any tool in this plan. The MCP adds agent-native composability and typed tool access over raw `gh` shell calls, but users who primarily use GitHub via `gh` in Bash may not find the MCP overhead worthwhile. Assign CONSIDER pending Phase 3 evaluation of whether the structured tool access justifies the context cost and PAT management burden.

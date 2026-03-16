## Tool Assessment: WPCS Skill

**Assessment Date:** 2026-03-16
**Assessor:** Claude Code
**Source Repo:** N/A — file-based CC Skill; underlying standard at https://github.com/WordPress/WordPress-Coding-Standards

---

### Pre-Filter Check (ANTI-FEATURES.md)

WPCS Skill is not listed in the named exclusion list. Category rules:
- Not a CC built-in duplicate — CC has no persistent WordPress coding standards knowledge beyond training data; a Skill file provides version-specific, persistent WPCS rules
- Not abandoned/archived — the WPCS standard itself (WordPress/WordPress-Coding-Standards) has 2,737 stars, last commit 2026-03-06; actively maintained by the WordPress core team
- Not out-of-scope — WordPress coding standards are directly in scope for a WordPress/PHP developer (DOCS-02)
- Not a security/supply chain risk — file-based markdown, no code execution, no network access, no external dependencies

**Result: Pre-filter PASSED — proceed to adapted gate evaluation.**

**Important caveat for assessors:** WPCS Skill is a file-based CC Skill (SKILL.md in `~/.claude/skills/wordpress/`), NOT an MCP server. The scorecard gates are adapted below. Do not search npm or GitHub for a "wpcs-skill" package — no such package exists. The assessment evaluates the Skill format applied to the WPCS standard.

---

### Identity

| Field | Value |
|-------|-------|
| Name | WPCS Skill (WordPress Coding Standards) |
| Repo URL | N/A — file-based CC Skill; no GitHub repo for the Skill itself |
| Underlying Standard Repo | https://github.com/WordPress/WordPress-Coding-Standards |
| Stars | N/A for Skill itself; WPCS repo: 2,737 stars (as of 2026-03-16) |
| Last Commit | N/A for Skill (CC writes/manages the file); WPCS repo: 2026-03-06 (10 days ago) |
| Transport Type | N/A — file-based Skill; loaded by CC at session start, no transport layer |
| Publisher | vendor-official (WordPress core team maintains the WPCS standard) |

---

### Hard Gate Results

| Gate | Threshold | Actual | Result |
|------|-----------|--------|--------|
| Stars | N/A for file-based Skills — see note | N/A — see note | PASS (adapted) |
| Commit Recency | ≤30 days preferred, ≤90 hard limit | WPCS repo: 10 days ago — PREFERRED | PASS |
| Self-Management: Install | Must have documented command | CC `Write` tool: `Write ~/.claude/skills/wordpress/SKILL.md` with WPCS content | PASS |
| Self-Management: Configure | Must have documented command | No configuration required — Skills are automatically loaded by CC at session start when present in `~/.claude/skills/` | PASS |
| Self-Management: Update | Must have documented command | CC `Edit` tool on `~/.claude/skills/wordpress/SKILL.md`; CC can also `Read` updated WPCS docs from developer.wordpress.org to refresh content | PASS |
| Self-Management: Troubleshoot | Must have documented command | CC `Read` on `~/.claude/skills/wordpress/SKILL.md` to verify content; CC `Bash`: `ls ~/.claude/skills/wordpress/` to verify file exists | PASS |
| CC Duplication | Must not duplicate CC built-in | No duplication — CC has no native persistent WPCS knowledge; a Skill provides always-available, version-specific WPCS rules without relying on training data | PASS |

**Gate Summary:** ALL PASS — all gates pass (Stars gate adapted with explanation for file-based Skill format).

**Stars Gate Adaptation Note:** File-based CC Skills are not distributed via GitHub repositories with star counts. There is no npm package to install, no binary to download, and no repository to star. The star gate is designed to filter out abandoned or untrustworthy external projects. For a Skill file, the equivalent quality signal is: (a) the underlying standard being maintained by a trusted source, and (b) the CC Skills format being an official CC feature. Both conditions are met: WPCS is maintained by the WordPress core team (vendor-official), and CC Skills are a documented CC feature. Gate recorded as PASS with this explanation.

---

### Context Cost Estimate

| Field | Value |
|-------|-------|
| Tool count exposed | 0 — Skills are not tools; they load as system context at session start |
| Estimated token overhead | ~30–130 tokens for the SKILL.md index file itself |
| Source | CC Skills architecture documentation — SKILL.md is a lightweight index (~130 lines max per architecture spec); rules/*.md files load on-demand, not at startup |

**Token overhead detail:**
- SKILL.md (lightweight index): ~30–130 tokens loaded automatically at every session
- `rules/*.md` files: loaded on-demand only when CC invokes them for a specific task; not loaded at session start
- Total startup overhead: minimal — substantially less than any MCP server tool definition

**Comparison:** The smallest MCP (Context7 with 2 tools) costs ~300–500 tokens. A WPCS SKILL.md index costs ~30–130 tokens. The Skill is the most context-efficient format for persistent knowledge.

---

### Self-Management Commands

| Operation | Command | Source |
|-----------|---------|--------|
| Install | CC `Write` tool — create `~/.claude/skills/wordpress/SKILL.md` with WPCS rules content | CC Skills documentation: skills are SKILL.md files in `~/.claude/skills/` subdirectories |
| Configure | No action required — CC automatically loads Skills from `~/.claude/skills/` at session start; no configuration file to edit | CC Skills architecture — zero-config loading |
| Update | CC `Edit` tool to modify `~/.claude/skills/wordpress/SKILL.md`; optionally CC can `Read` https://developer.wordpress.org/coding-standards/ to fetch current WPCS rules and incorporate changes | CC native `Edit` tool |
| Troubleshoot | CC `Read` tool on `~/.claude/skills/wordpress/SKILL.md` to verify content is present; CC `Bash`: `ls ~/.claude/skills/wordpress/` to confirm file exists; if missing, re-run Install | CC native `Read` and `Bash` tools |

**All operations use CC native tools — no CLI commands, no npm packages, no API keys, no environment variables required.**

---

### Security Findings

**mcp-scan result:** N/A — not an MCP server; mcp-scan is not applicable to file-based Skills
**Known CVEs:** N/A — local markdown file; no executable code, no network calls, no dependencies
**Risk level:** VERY LOW
**Notes:**
- File-based markdown Skill: no code execution, no network access, no external API calls
- Content risk: the Skill file contains coding standards rules (plain text); no secrets, no credentials
- The only "risk" is incorrect or outdated WPCS content in the file — mitigated by CC's ability to read current WPCS docs from developer.wordpress.org when updating

---

### WordPress/PHP Relevance

This IS the WordPress-specific tool. The WPCS Skill is purpose-built for WordPress/PHP development.

**WPCS rules the Skill should cover:**

1. **Naming Conventions**
   - Variables and functions: `lowercase_with_underscores`
   - Classes: `Capitalized_Words`
   - Constants: `UPPERCASE_WITH_UNDERSCORES`
   - Hooks: `lowercase_with_underscores`

2. **Yoda Conditions** — constant/literal on the left side: `if ( true === $condition )` not `if ( $condition === true )`

3. **Hook Registration Patterns**
   - `add_action()` and `add_filter()` with proper priority and accepted_args
   - Naming hooks with plugin prefix: `plugin_slug_hook_name`
   - Late static binding via closures vs. named callbacks

4. **Sanitization and Escaping Requirements**
   - Sanitize inputs: `sanitize_text_field()`, `absint()`, `wp_kses_post()`, etc.
   - Escape outputs: `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses()`, etc.
   - Never pass raw `$_GET`/`$_POST`/`$_REQUEST` to database queries

5. **Database Query Patterns**
   - Use `$wpdb->prepare()` for all queries with dynamic data
   - Use `get_posts()`, `WP_Query`, or `WP_User_Query` over direct SQL when possible
   - Cache expensive queries with `wp_cache_get()`/`wp_cache_set()`

6. **Internationalization (i18n)**
   - Use `__()`, `_e()`, `_n()`, `_x()` with text domain parameter
   - Never concatenate strings that contain translatable content

7. **Asset Enqueuing**
   - Always use `wp_enqueue_script()` and `wp_enqueue_style()` — never `echo <script>` or `echo <link>`
   - Hook into `wp_enqueue_scripts` for frontend, `admin_enqueue_scripts` for admin

8. **Deprecated Function Avoidance**
   - Track functions deprecated in WP 6.x and avoid them
   - Use `apply_filters()` not `apply_filters_ref_array()` unless needed

9. **PHP 8.x Compatibility**
   - Named arguments, match expressions, nullsafe operator usage
   - Avoid `create_function()` (removed in PHP 8.0)
   - Type declarations and return types for new functions

10. **Code Formatting**
    - Tabs for indentation (not spaces) — WordPress uses tabs
    - Space inside parentheses: `if ( $condition )`
    - Braces on same line for control structures

**Assessment:** The WPCS Skill has the highest WordPress/PHP relevance score of any tool in this plan — it is literally the WordPress Coding Standards encoded as a persistent CC knowledge file.

---

### Pros and Cons

**Pros:**
- Zero installation dependencies — pure markdown file; CC writes and manages it
- Minimal context overhead (~30–130 tokens) — most efficient format for persistent knowledge
- No API key, no npm, no external service, no rate limits
- Automatically applied at every CC session when `~/.claude/skills/` exists — zero user friction
- Underlying WPCS standard actively maintained by WordPress core team (2,737 stars, updated 10 days ago)
- CC can autonomously update the Skill by reading current WPCS docs — full lifecycle self-management
- No transport deprecation risk — not an MCP server, not subject to SSE/HTTP protocol changes

**Cons / Caveats:**
- Content must be curated manually the first time — CC must author the SKILL.md with the right WPCS rules; no auto-import from WPCS GitHub
- No auto-update from WPCS releases — CC must proactively check developer.wordpress.org when WPCS publishes a new version and update the file; relies on CC being prompted or instructed to refresh
- Skills only load in CC sessions — not available in Claude.ai web, Claude Desktop (without Skills configured), or other clients
- File is only as accurate as the last time it was written or updated; stale content is possible if not maintained

---

### Verdict

**Tier:** INCLUDE
**Rationale:** WPCS Skill passes all adapted gates for a file-based CC Skill format, fills a clear capability gap (persistent WordPress coding standards knowledge applied globally without manual reminders), and has no overlap with any other INCLUDE candidate. It is the most context-efficient tool in this plan and requires no external dependencies — every operation is performed with CC native tools.

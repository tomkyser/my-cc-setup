# Phase 8: Foundation and Branding - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the CJS shared substrate under ~/.claude/dynamo/ with Ledger/Switchboard directory structure, all foundation modules (core, MCP client, scope, logger, health guard, HTTP utility), regression tests for all 12 v1.1 fixes, and Dynamo/Ledger/Switchboard branding applied. Phase 8 does NOT register any hooks or change settings.json — the existing Python/Bash system continues running untouched.

</domain>

<decisions>
## Implementation Decisions

### Branding in output
- Subtle branding: Dynamo name appears in headers/banners only, individual output lines are clean (GSD pattern)
- Module identity block at top of each .cjs file: `// Dynamo > Ledger > mcp-client.cjs` showing system/subsystem/file hierarchy
- Independent semver starting at 0.1.0 (not tied to project milestone version)
- Hook-injected context keeps `[GRAPHITI MEMORY CONTEXT]` tag — don't break existing CLAUDE.md references

### Config format
- Curation prompts: separate .md files per prompt (GSD pattern — `prompts/curation.md`, `prompts/session-summary.md`, etc.), read via `fs.readFileSync`
- Dynamo settings: JSON format (`config.json`), matches GSD pattern
- **Zero npm dependencies** — prompts as .md and config as .json eliminate the need for js-yaml entirely
- .env file continues to work for environment-specific values (Graphiti URL, API keys)

### Coexistence period
- Phase 8 builds dynamo/ but does NOT register hooks or modify settings.json — graphiti hooks keep running as-is
- Phase 9 will switch hooks over; Phase 10 completes cutover
- After cutover: graphiti/ renamed to graphiti-legacy/ (kept as reference, not deleted)
- docker-compose.yml stays in graphiti/ — Docker stack management isn't moving

### Testing
- Three test entry points sharing the same underlying node:test runner:
  - `dynamo test` — on-demand during development/debugging
  - `verify-memory` — runtime confirmation (live system health)
  - Auto-run on install — catches deployment problems, fails deployment if tests fail
- Test output verbosity: Claude's discretion based on context (verbose for `dynamo test`, compact for install/verify)

### Claude's Discretion
- Test output verbosity per entry point
- Exact spacing, formatting, and error message phrasing
- Internal module structure within lib/core.cjs (how config, env, project detection are organized)
- Whether .env loading uses a single function or is split across callers

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### GSD CJS patterns (reference implementation)
- `~/.claude/get-shit-done/bin/gsd-tools.cjs` — CLI router pattern, subcommand dispatch, output formatting
- `~/.claude/get-shit-done/templates/` — Prompt/template file organization (separate .md files per prompt)
- `~/.claude/hooks/gsd-context-monitor.js` — CJS hook pattern: stdin reading, JSON parsing, timeout guard, process.exit conventions

### Current Python/Bash system (port source)
- `~/.claude/graphiti/graphiti-helper.py` — MCP client, search, episodes, session management (944 LOC)
- `~/.claude/graphiti/health-check.py` — 6-stage health check (553 LOC)
- `~/.claude/graphiti/hooks/` — 6 Bash hook scripts (~350 LOC total)
- `~/.claude/graphiti/curation/prompts.yaml` — Curation prompt templates (convert to .md files)
- `~/.claude/graphiti/config.yaml` — Current config (convert to config.json)
- `~/.claude/graphiti/SCOPE_FALLBACK.md` — Dash separator constraint docs

### Research outputs
- `.planning/research/SUMMARY.md` — Architecture decisions, stack choices, pitfall mitigations
- `.planning/research/ARCHITECTURE.md` — Directory structure, module boundaries, build order
- `.planning/research/PITFALLS.md` — 12 regression risks with prevention strategies
- `.planning/research/STACK.md` — Technology choices, Node.js built-in mapping

### V1.1 diagnostics (regression context)
- `.planning/milestones/v1.1-phases/04-diagnostics/04-DIAGNOSTIC-REPORT.md` — DIAG-01, DIAG-02 root causes
- `.planning/milestones/v1.1-phases/05-hook-reliability/05-VERIFICATION.md` — 8/8 truths verified

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `gsd-context-monitor.js`: Proven CJS hook pattern — stdin buffering with 3s timeout guard, JSON parse, session_id extraction, process.exit conventions. Direct model for dynamo-hooks.cjs dispatcher.
- `gsd-tools.cjs`: CLI router with subcommand dispatch. Direct model for `dynamo.cjs` entry point.
- `~/.claude/package.json`: Already `{"type":"commonjs"}` — no changes needed.

### Established Patterns
- GSD uses `require()` + `module.exports` exclusively (14 .cjs files, zero ESM)
- Hook I/O: JSON on stdin, JSON/text on stdout, exit code 0 (success) or 2 (block)
- Templates as separate .md files read via `fs.readFileSync`
- Config as JSON (config.json)

### Integration Points
- `~/.claude/settings.json` — Hook registrations (NOT modified in Phase 8)
- `~/.claude/graphiti/.env` — Environment variables for Graphiti URL, API keys
- `~/.claude/graphiti/docker-compose.yml` — Docker stack (stays in graphiti/)
- `~/.claude/graphiti/sessions.json` — Session index (will be read by CJS in Phase 9)

</code_context>

<specifics>
## Specific Ideas

- Follow GSD patterns exactly where applicable — don't reinvent when a proven pattern exists in the same environment
- Zero npm dependencies is a strong principle — prompts as .md and config as .json achieve this
- Module identity blocks (`// Dynamo > Ledger > mcp-client.cjs`) provide clear provenance without being noisy

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-foundation-and-branding*
*Context gathered: 2026-03-17*

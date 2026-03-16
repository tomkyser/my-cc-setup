# Session Management Visibility Research

**Research Date:** 2026-03-16
**Requirement:** MEMO-02
**Constraint:** Existing tools only — no custom build proposals

---

## Session Management Visibility — Approach Comparison

### Problem Statement

No structured way exists to list all past sessions, select a specific session for review, or see a session timeline. Sessions are stored in Graphiti as `session:{timestamp}` scoped episodes by `session-summary.sh`, but there is no listing or discovery mechanism.

The core gap: to retrieve a session, you must already know the exact `session:{timestamp}` group_id (e.g., `session:2026-03-16T20:00:00Z`). There is no "list all session keys" endpoint in the Graphiti API. This means past sessions exist in the knowledge graph but are effectively undiscoverable without the original timestamp.

A secondary gap: sessions are stored in both `project:{name}` scope (for the session summary text) and `session:{timestamp}` scope (for fine-grained retrieval). The dual-storage approach in `session-summary.sh` means a session can be found via project-scoped search, but individual `session:*` scope entries have no directory.

---

### Approaches Considered

| Approach | Description | Pros | Cons | Viability |
|----------|-------------|------|------|-----------|
| `get_episodes` MCP tool | Retrieve episodes by group_id (`session:{timestamp}`) | Already installed, retrieves full session content, structured results | Must know exact timestamp — no listing of available sessions; discovery requires guessing timestamps | VIABLE as workaround — limited discoverability |
| `search_memory_facts` for session summaries | Search "session summary" across project scope | Already installed, returns session summary content from project-scoped storage | Returns flat results, not a structured session list with timeline; relevance-ranked, not chronological | VIABLE as workaround |
| graphiti-helper.py via CC Bash | Run `search` command directly from Bash tool | Already installed at `~/.claude/graphiti/graphiti-helper.py`; `search` command confirmed; requires Graphiti server running | CLI-only, requires venv Python, same search limitations as MCP tools; no session listing | VIABLE as workaround |
| Custom CC slash command | A command listing all `session:*` scope entries | Could provide a true session directory | Explicitly ruled out by locked decision: "research existing tools only — no custom build proposals" | NOT VIABLE — locked decision |

---

### Approach Detail: `get_episodes` MCP Tool

**Available since:** Graphiti installation (already registered in `~/.claude/settings.json` permissions)

**How it works:** Takes a `group_id` parameter and returns all episodes stored in that scope. For session retrieval, the `group_id` would be `session:{timestamp}`.

**Gap: No session listing.** There is no `list_groups` or `list_scopes` API in the Graphiti MCP server. To retrieve a session via `get_episodes`, the caller must already know the session timestamp. This requires either:
1. Recording timestamps externally (not currently done)
2. Querying via Neo4j Browser or Cypher directly to enumerate `EpisodicNode` entries by group_id prefix

**Partial workaround:** Session summaries are also stored in `project:{name}` scope by `session-summary.sh`. Calling `get_episodes` with `group_id = "project:my-cc-setup"` returns all project-scoped episodes, including session summaries. These can be scanned manually to locate sessions.

**Verdict:** Viable workaround. Sessions are retrievable but not through a clean listing interface.

---

### Approach Detail: `search_memory_facts` for Session Summaries

**How it works:** Search for the phrase "session summary" across project scope. The `session-summary.sh` hook stores episodes with the text prefix `"Session summary ({timestamp}): ..."`, making them searchable.

**Usage from Claude Code:**
```
search_memory_facts(query="session summary accomplished decisions", group_id="project:my-cc-setup")
```

**Gap: Unstructured results.** The search returns relevance-ranked results, not a chronological list. Recent sessions show up, but older or less-referenced sessions may not surface in a simple search. There is no "sort by date" option on the MCP tool.

**Positive finding:** The dual-storage approach in `session-summary.sh` (stores in both `project:{name}` scope AND `session:{timestamp}` scope) means session summaries ARE retrievable via project-scoped search. They will appear with their timestamp in the episode text.

**Verdict:** Viable workaround for finding recent sessions. Historical session discovery degrades over time as newer sessions dominate search results.

---

### Approach Detail: graphiti-helper.py via CC Bash

**Confirmed exists:** `/Users/tom.kyser/.claude/graphiti/graphiti-helper.py`

**Supported commands (from docstring):**
```
graphiti-helper.py health-check
graphiti-helper.py detect-project [--cwd PATH]
graphiti-helper.py search --query QUERY [--scope SCOPE] [--limit N] [--curate CONTEXT]
graphiti-helper.py add-episode --text TEXT [--scope SCOPE] [--source SOURCE]
graphiti-helper.py summarize-session [--scope SCOPE]
```

**Requires venv Python:** Must be run via `~/.claude/graphiti/.venv/bin/python3 ~/.claude/graphiti/graphiti-helper.py`

**Session search workaround:**
```bash
~/.claude/graphiti/.venv/bin/python3 ~/.claude/graphiti/graphiti-helper.py \
  search --query "session summary" --scope "project:my-cc-setup" --limit 20
```

**Gap:** The `search` command is the only retrieval mechanism. The `graphiti-helper.py` has no `list-sessions` or `list-scopes` command. It wraps the same Graphiti API endpoints as the MCP tools, providing no new session listing capability.

**Verdict:** Viable workaround, same limitations as MCP tools. Useful for scripted or pipeline access to session data outside of a Claude Code session.

---

### Approach Detail: Custom CC Slash Command — NOT VIABLE

A custom slash command (e.g., `/list-sessions`) could enumerate all episodes with `group_id` matching `session:*` by querying Neo4j directly or using the Graphiti API. This would provide a true session directory with timestamps, counts, and summaries.

**However:** This approach is explicitly excluded by the locked decision: "MEMO-01 (browsing interface) and MEMO-02 (session visibility): research existing tools only — no custom build proposals."

The locked decision covers both slash commands and any other custom implementation. This approach is **NOT VIABLE** per project constraint.

**Verdict: NOT VIABLE — ruled out by locked decision.**

---

### Web Search: Existing MCP Tools for Session/Conversation History

No existing MCP tool discovered during research provides session listing or conversation history browsing compatible with Graphiti's storage model:

- Graphiti is a custom knowledge graph solution; its storage schema is not standard across memory tools
- No third-party MCP tools query arbitrary Neo4j databases for session data in a Graphiti-compatible way
- `mcp-neo4j-cypher` (evaluated in MEMO-01) could theoretically query session data via Cypher, but it already failed Gate 1 (stars)
- The "Memory MCP Server" (official Anthropic reference server) is excluded per ANTI-FEATURES.md (already solved with Graphiti)

**Finding: No existing external tool solves the session listing gap.**

---

### Gap Documentation

The session listing gap has two dimensions:

1. **Discovery gap:** No `list_groups` endpoint in Graphiti MCP API means you cannot enumerate what `session:{timestamp}` keys exist. The only workaround is querying the project-scoped storage where sessions are also stored.

2. **Chronological access gap:** Existing retrieval tools are relevance-ranked, not chronological. A user cannot simply say "show me sessions from last week" without additional tooling.

**Impact assessment:**
- **Current impact:** LOW to MEDIUM. Session summaries are retrievable via project-scoped search for active projects. The gap matters most for historical archaeology (reviewing sessions from weeks or months ago).
- **Future impact:** MEDIUM. As the knowledge graph grows with many sessions, relevance search will return increasingly noisy results, making historical session review harder.

---

### Recommendation

**Recommended approach: Combined MCP tools as workaround; flag session listing for v2**

No existing tool provides structured session listing. The combination of existing approaches is the best available option:

1. **For recent sessions:** Use `search_memory_facts` with query "session summary" in project scope — recent sessions surface reliably.
2. **For specific session retrieval:** If the timestamp is known, use `get_episodes` with `group_id = "session:{timestamp}"`.
3. **For session discovery via graph:** Use Neo4j Browser at `localhost:7475` with query: `MATCH (e:EpisodicNode) WHERE e.group_id STARTS WITH 'session:' RETURN e.group_id, e.created_at ORDER BY e.created_at DESC LIMIT 25`

**v2 flag:** A proper session listing command — either a `list_group_ids` endpoint in the Graphiti MCP API (upstream contribution) or a lightweight `list-sessions` command in `graphiti-helper.py` — would close this gap cleanly. File as: "MEMO-02-V2: Add session listing capability to graphiti-helper.py."

---

### If Recommended Approach Is Not Viable

If the Graphiti server is offline or MCP tools are unavailable:

1. Use Neo4j Browser Cypher query to browse sessions directly (requires Neo4j Docker running even if Graphiti HTTP API is down)
2. Parse `~/.claude/graphiti/` logs if any exist for session timestamps
3. Document the gap as unresolved and proceed — session history browsing is a convenience feature, not a correctness requirement

The locked decision prohibits custom builds. If all existing workarounds fail, the answer is: accept the gap and flag for v2.

---

*Requirement: MEMO-02*
*Feeds into: Phase 3 ranked report — memory system section*
*v2 flag: Add `list-sessions` to graphiti-helper.py or `list_group_ids` to Graphiti MCP API*

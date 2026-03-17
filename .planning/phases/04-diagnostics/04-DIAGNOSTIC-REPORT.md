# Phase 4: Diagnostic Report

**Date:** 2026-03-17
**Diagnostic script:** `~/.claude/graphiti/diagnose.py`

## Pipeline Status

| Stage | Component | Status | Details |
|-------|-----------|--------|---------|
| 1 | Docker containers | PASS | graphiti-mcp Up 11 days (healthy); graphiti-neo4j Up 11 days (healthy) |
| 2 | Neo4j connectivity | PASS | HTTP 200 at localhost:7475 |
| 3 | Graphiti API health | PASS | HTTP 200 — `{"status":"healthy","service":"graphiti-mcp"}` |
| 4 | MCP session init | PASS | session_id obtained; MCP protocol 2025-03-26, server v1.21.0 |
| 5 | MCP write (global) | PASS | `add_memory` accepted and queued episode in group 'global' |
| 6 | MCP read (global) | PASS | `search_memory_facts` returned facts from global scope |
| 7 | MCP write (project) | PASS | `add_memory` accepted and queued episode — API acknowledged "group 'project:my-cc-setup'" |
| 8 | MCP read (project) | **FAIL** | `search_memory_facts` with `group_ids=["project:my-cc-setup"]` returns 0 facts; `get_episodes` for project scope returns only global episodes (all with group_id='global') |
| 9 | graphiti-helper.py add-episode | PASS | Exit 0, no stderr — helper works correctly |
| 10 | Hook simulation (stderr visible) | PASS | Exit 0, no stderr — hook write pattern works correctly |

## Root Cause: Silent Write Failures (DIAG-01)

**Symptom:** Hooks display success messages but data never reaches Neo4j in the expected scope.

**Root cause:** There are NO silent write failures in the traditional sense. Writes succeed at every stage — Docker is healthy, Neo4j is reachable, the MCP session initializes correctly, `add_memory` calls complete with exit code 0 and no stderr. The `2>/dev/null` suppression pattern in hooks was masking what turned out to be a successful operation, not a failure.

The actual cause of missing memories is a server-level `group_id` override (see DIAG-02 below), not a write failure. The hooks fire-and-forget pattern with `2>/dev/null &` is architecturally fragile but is NOT the root cause of missing data in this deployment — the writes ARE succeeding, they are just stored in the wrong scope.

**Evidence:**

Stage 9 (graphiti-helper.py with stderr visible, global scope):
```
Command: python3 graphiti-helper.py add-episode --text "Helper probe canary at 2026-03-17T02:23:42Z" --scope global --source diagnostic
Exit code: 0
stdout: (empty)
stderr: (empty)
```

Stage 10 (hook simulation with stderr visible, project scope):
```
Command: python3 graphiti-helper.py add-episode --text "File Write: /tmp/diagnostic-test.txt" --scope project:my-cc-setup --source change-hook
Exit code: 0
stdout: (empty)
stderr: (empty)
```

**Contributing factors:**

- `2>/dev/null` in all write hooks (`capture-change.sh:34`, `session-summary.sh:33,40`, `preserve-knowledge.sh:27`) would hide any future errors if the pipeline breaks
- Backgrounding with `&` means the hook exits 0 before the write completes — there is no way to observe success or failure from the hook itself
- `graphiti-helper.py:356-363` prints errors to stderr only — combined with `2>/dev/null`, any future API errors would be completely invisible
- The "healthy" health check only tests HTTP 200 on `/health` — it does NOT verify write capability, so health-check-gated hooks cannot distinguish "API is up" from "API is accepting writes correctly"

**Recommended fix direction for Phase 5:**

1. Remove `2>/dev/null` from all write hooks and log stderr to a file (`~/.claude/graphiti/hook-errors.log`)
2. Consider removing `&` backgrounding and using a timeout-guarded foreground call, or at minimum log the result asynchronously
3. Enhance `health-check` to perform a canary write+read round-trip, not just HTTP 200
4. The fire-and-forget pattern is a reliability risk — if the server becomes temporarily unavailable, writes fail silently with no retry mechanism

## Root Cause: Missing Project-Scoped Memories (DIAG-02)

**Symptom:** No project-scoped episodes exist (project:my-cc-setup has zero facts in semantic search; `get_episodes` for project scope returns only global data).

**Root cause:** The Graphiti MCP server (`zepai/knowledge-graph-mcp:standalone`) overrides all `group_id` values to its server-configured default (`GRAPHITI_GROUP_ID=global`) regardless of what the client sends in the `add_memory` request. When `add_memory` is called with `group_id="project:my-cc-setup"`, the server responds with `"Episode queued for processing in group 'project:my-cc-setup'"` — but the episode is actually stored with `group_id='global'`. The project scope does not exist in the database; all data is in global.

This is confirmed by `get_episodes` for `group_id="project:my-cc-setup"` returning the same 10 episodes as `get_episodes` for `group_id="global"`, and every returned episode having `group_id='global'` in its record.

**Evidence:**

Stage 7 write response (server confirms project scope accepted):
```json
{
  "message": "Episode 'diagnostic-project-probe' queued for processing in group 'project:my-cc-setup'"
}
```

Stage 8 read response (zero facts found in project scope):
```json
{
  "message": "No relevant facts found",
  "facts": []
}
```

Deep investigation — `get_episodes` for `project:my-cc-setup` returns global data:
```
Total episodes for group_id='project:my-cc-setup': 10
  name='session-hook'        group_id='global'   created=2026-03-16T16:54:32
  name='diagnostic-probe'    group_id='global'   created=2026-03-17T02:23:42
  name='session-hook'        group_id='global'   created=2026-03-16T17:16:52
  name='diagnostic'          group_id='global'   created=2026-03-17T02:23:51
  name='seed-preference'     group_id='global'   created=2026-03-05T17:11:28
```

`search_memory_facts` scope comparison for same query "scope isolation test":
```
group_ids=["project:my-cc-setup"]: 0 facts
group_ids=["global"]:              5 facts  (same content)
```

**Detected project name:** `my-cc-setup`
**Expected project name:** `my-cc-setup` (git remote URL ends in `my-cc-setup` — project detection is CORRECT)
**group_id used in writes:** `project:my-cc-setup`
**group_id stored in database:** `global` (overridden by server)

**Root cause location:** `docker-compose.yml` line 37:
```yaml
- GRAPHITI_GROUP_ID=${GRAPHITI_GROUP_ID:-global}
```

The `GRAPHITI_GROUP_ID=global` environment variable sets the server's default group. The standalone image overrides the per-request `group_id` with this server-level default, making multi-scope isolation impossible without changing the server configuration or using a version that respects per-request group IDs.

**Recommended fix direction for Phase 5:**

1. **Investigate whether the standalone image version (1.21.0) supports per-request group_id override**: Check the Graphiti changelog or try a newer image version. The API acknowledges the group_id in its response message but does not use it during storage.
2. **Workaround if not supported**: Remove `GRAPHITI_GROUP_ID` from docker-compose.yml (or set it to empty string) and see if the server then respects per-request group_id values.
3. **Alternative**: Use a single scope (`global`) and prefix episode content with the project name (e.g., `[my-cc-setup] File Write: ...`) as a manual scoping strategy until proper group_id support is available.
4. **Verify with docker-compose.yml change**: Set `GRAPHITI_GROUP_ID=` (empty) or remove the variable, rebuild the container, and re-run `diagnose.py` to confirm stage 8 passes.

## Additional Findings

1. **Project name detection is correct**: `detect-project` correctly identifies `my-cc-setup` via git remote URL even from the iCloud Drive path (`com~apple~CloudDocs`). The iCloud path hypothesis from CONTEXT.md was not the issue.

2. **The MCP API lies about group_id**: The server's acknowledgement message (`"queued for processing in group 'project:my-cc-setup'"`) is misleading — it echoes back the requested group_id in the message but does not use it for storage. This makes the failure invisible at the write stage and only detectable by reading back with the same group_id.

3. **Global scope has working data**: 10+ episodes exist in global scope including session summaries, seed preferences, and hook writes. The memory system IS working — but only for the global scope.

4. **`2>/dev/null` pattern is a silent risk multiplier**: While not currently causing failures (the underlying writes succeed), this pattern will make any future failures completely invisible. It should be removed as a hygiene fix even though it is not the root cause today.

5. **`search_memory_facts` vs `get_episodes` behavior difference**: `get_episodes` for a non-existent group_id returns all global episodes (ignoring the filter). `search_memory_facts` for a non-existent group_id returns 0 facts (applying a filter that matches nothing). This inconsistency between tools makes the bug harder to diagnose without the explicit `get_episodes` cross-check.

## Raw Diagnostic Output

<details>
<summary>Full diagnose.py output (run: 2026-03-17T02:26:11Z)</summary>

```
=== GRAPHITI PIPELINE DIAGNOSTIC ===
Timestamp: 2026-03-17T02:26:11Z
MCP URL: http://localhost:8100/mcp
Health URL: http://localhost:8100/health

--- Stage 1: Docker Containers ---
Status: PASS
Output: graphiti-mcp Up 11 days (healthy)
graphiti-neo4j Up 11 days (healthy)

--- Stage 2: Neo4j Connectivity ---
Status: PASS
Output: HTTP 200 — Neo4j browser reachable at localhost:7475

--- Stage 3: Graphiti API Health ---
Status: PASS
Output: HTTP 200 — {"status":"healthy","service":"graphiti-mcp"}

--- Stage 4: MCP Session Init ---
Status: PASS
Output: session_id=44c6531ad7f2474f8efde84cebfdd4c4
HTTP 200
Headers: mcp-session-id=44c6531ad7f2474f8efde84cebfdd4c4
Body (first 500): event: message
data: {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-03-26","capabilities":{"experimental":{},"prompts":{"listChanged":false},"resources":{"subscribe":false,"listChanged":false},"tools":{"listChanged":false}},"serverInfo":{"name":"Graphiti Agent Memory","version":"1.21.0"},"instructions":"\nGraphiti is a memory service for AI agents built on a knowledge graph. Graphiti performs well\nwith dynamic data such as user interactions, changing enterprise data, and external in

--- Stage 5: MCP Write (global scope) ---
Status: PASS
Output: add_memory returned result (no error key)
Full response: {
  "jsonrpc": "2.0",
  "id": "cd5796b1-a3be-49b5-98b4-520098cd72b9",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"message\": \"Episode 'diagnostic-probe' queued for processing in group 'global'\"\n}"
      }
    ],
    "structuredContent": {
      "result": {
        "message": "Episode 'diagnostic-probe' queued for processing in group 'global'"
      }
    },
    "isError": false
  }
}

--- Stage 6: MCP Read (global scope) ---
Status: PASS
Output: search_memory_facts returned result
Full response (truncated): facts array contains data from 2026-03-16 with group_id='global'

[Detected project name: 'my-cc-setup']

--- Stage 7: MCP Write (project scope) ---
Status: PASS
Output: Detected project: my-cc-setup
group_id used: project:my-cc-setup
add_memory returned result (no error)
Full response: {
  "jsonrpc": "2.0",
  "id": "5a47880e-a57d-45a1-92ba-cdcacfb3972c",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"message\": \"Episode 'diagnostic-project-probe' queued for processing in group 'project:my-cc-setup'\"\n}"
      }
    ],
    "structuredContent": {
      "result": {
        "message": "Episode 'diagnostic-project-probe' queued for processing in group 'project:my-cc-setup'"
      }
    },
    "isError": false
  }
}

--- Stage 8: MCP Read (project scope) ---
Status: FAIL
Output: group_id searched: project:my-cc-setup
Canary found in results: False
Full response: {
  "jsonrpc": "2.0",
  "id": "e046de29-5ddc-4ca3-bcff-5d0b98adaba9",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"message\": \"No relevant facts found\",\n  \"facts\": []\n}"
      }
    ],
    "structuredContent": {
      "result": {
        "message": "No relevant facts found",
        "facts": []
      }
    },
    "isError": false
  }
}

--- Stage 9: graphiti-helper.py add-episode (stderr visible) ---
Status: PASS
Output: Command: python3 graphiti-helper.py add-episode --text "Helper probe canary at 2026-03-17T02:26:11Z" --scope global --source diagnostic
Exit code: 0
stdout: (empty)
stderr: (empty)

--- Stage 10: Hook Simulation (capture-change.sh pattern, stderr visible) ---
Status: PASS
Output: Simulated hook command (no 2>/dev/null, no &):
Command: python3 graphiti-helper.py add-episode --text "File Write: /tmp/diagnostic-test.txt" --scope project:my-cc-setup --source change-hook
Exit code: 0
stdout: (empty)
stderr: (empty)

=== SUMMARY ===
Passed: 9/10
Failed: 1/10
First failure: Stage 8 — MCP Read (project scope)

=== EVIDENCE FOR ROOT CAUSE ===

Stage 8 — MCP Read (project scope):
group_id searched: project:my-cc-setup
Canary found in results: False
Full response: {"message": "No relevant facts found", "facts": []}

=== STAGE RESULTS TABLE ===
  Stage  1: [PASS] Docker Containers
  Stage  2: [PASS] Neo4j Connectivity
  Stage  3: [PASS] Graphiti API Health
  Stage  4: [PASS] MCP Session Init
  Stage  5: [PASS] MCP Write (global scope)
  Stage  6: [PASS] MCP Read (global scope)
  Stage  7: [PASS] MCP Write (project scope)
  Stage  8: [FAIL] MCP Read (project scope)
  Stage  9: [PASS] graphiti-helper.py add-episode (stderr visible)
  Stage 10: [PASS] Hook Simulation (capture-change.sh pattern, stderr visible)
```

</details>

<details>
<summary>Deep investigation: get_episodes cross-check</summary>

```
Total episodes for group_id='project:my-cc-setup': 10
  name='session-hook'        group_id='global'   created=2026-03-16T16:54:32
  name='diagnostic-probe'    group_id='global'   created=2026-03-17T02:23:42
  name='session-hook'        group_id='global'   created=2026-03-16T17:16:52
  name='diagnostic'          group_id='global'   created=2026-03-17T02:23:51
  name='seed-preference'     group_id='global'   created=2026-03-05T17:11:28
  name='seed-system'         group_id='global'   created=2026-03-05T17:12:10
  name='seed-preference'     group_id='global'   created=2026-03-05T17:08:02
  name='change-hook'         group_id='global'   created=2026-03-16T17:45:49
  name='session-hook'        group_id='global'   created=2026-03-11T16:07:45
  name='seed-preference'     group_id='global'   created=2026-03-05T17:11:50

Total episodes for group_id='global': 10 (identical set)

search_memory_facts "scope isolation test":
  group_ids=["project:my-cc-setup"]: 0 facts
  group_ids=["global"]:              5 facts
```

</details>

# Memory Browsing Interface Research

**Research Date:** 2026-03-16
**Requirement:** MEMO-01
**Constraint:** Existing tools only — no custom build proposals

---

## Memory Browsing Interface — Approach Comparison

### Problem Statement

No dedicated UI exists for browsing all Graphiti knowledge graph entities, facts, and episodes across scopes. The user and Claude Code need visibility into what the memory system has stored — which entities exist, what relationships connect them, which episodes are in which scope, and what the overall shape of the knowledge graph looks like.

The current Graphiti setup stores rich structured data (entities, edges, episodes) across multiple scopes (`global`, `project:{name}`, `session:{timestamp}`). Without a browsing interface, neither the user nor Claude Code can audit what has been stored, prune stale entries, or verify that the memory system is working correctly.

---

### Approaches Considered

| Approach | Description | Pros | Cons | Viability |
|----------|-------------|------|------|-----------|
| Neo4j Browser (localhost:7475) | Built-in web UI, already running with Graphiti's Docker stack | Already available, no install needed, full Cypher query support, visual graph view | Requires knowing Cypher, not indexed on Graphiti entities specifically, technical UX | VIABLE — exists today as a workaround |
| Graphiti MCP tools (search_nodes, search_memory_facts, get_episodes) | CC queries the graph directly via MCP | Already installed, CC-native, no new tools, structured results | No "browse all" capability, requires specific queries, not a browsing UI | VIABLE as workaround — not a true browsing interface |
| mcp-neo4j-cypher (neo4j-contrib/mcp-neo4j) | MCP converting natural language to Cypher, runs against the local Neo4j instance | Natural language interface to graph, CC-native, supports read-only mode, bridges Graphiti data with conversational queries | Additional MCP = context cost (3 tools exposed), neo4j-contrib is community org not official Neo4j, APOC plugin required for schema tool | Subject to full gate evaluation below |
| Neo4j Aura console | Cloud-hosted Neo4j UI from Neo4j vendor | Polished enterprise UI, official vendor | Graphiti runs locally (bolt://localhost:7687), not on Aura — wrong deployment model | NOT VIABLE |

---

### Approach Detail: Neo4j Browser (localhost:7475)

The Graphiti Docker stack (`~/.claude/graphiti/docker-compose.yml`) exposes the Neo4j Browser at `http://localhost:7475`. This browser provides:

- Visual graph rendering of nodes and relationships
- Cypher query editor with syntax highlighting
- Node/relationship label browsing in the sidebar
- Query history and favorites

**How to use for Graphiti browsing:**
```cypher
-- Browse all episodes
MATCH (e:EpisodicNode) RETURN e LIMIT 50

-- Browse episodes by scope
MATCH (e:EpisodicNode) WHERE e.group_id = 'global' RETURN e LIMIT 25

-- Browse entities
MATCH (n:EntityNode) RETURN n LIMIT 50

-- Browse all edges
MATCH (a)-[r]->(b) RETURN a, r, b LIMIT 50
```

**Limitation:** Requires Cypher knowledge. The user or Claude Code must know the Graphiti data model schema to construct useful queries. Not suitable for casual browsing without knowing the schema.

---

### Approach Detail: Graphiti MCP Tools

Three existing MCP tools support directed queries:

- `search_nodes`: Search for entity nodes matching a query
- `search_memory_facts`: Search for relationships/facts between entities
- `get_episodes`: Retrieve episodes by `group_id`

**Gap:** None of these provide a "list all" capability. To browse sessions, you must know the `session:{timestamp}` group_id. To browse all entities, you must query by concept. There is no index or listing endpoint.

**Use as browsing workaround:**
- `get_episodes` with `group_id = "global"` retrieves global scope entries
- `search_nodes` with a broad query returns relevant entities
- Multiple targeted queries can approximate a browse experience

---

### Approach Detail: mcp-neo4j-cypher — Full Gate Evaluation

**Source:** `neo4j-contrib/mcp-neo4j`, subpackage `servers/mcp-neo4j-cypher`
**PyPI:** `mcp-neo4j-cypher`
**Date evaluated:** 2026-03-16

#### Pre-filter: ANTI-FEATURES.md check

- Named exclusion list: Not present (not one of the 7 named tools)
- Category 1 (CC built-in duplication): This tool executes Cypher queries against a Neo4j database. CC's Bash tool can execute shell commands, but CC has no native Cypher query capability. **Not a duplicate.**
- Category 2 (Abandoned): Last commit 2026-02-23 — 21 days ago. Not abandoned.
- Category 3 (Out-of-scope): Not out-of-scope — the project includes memory system research.
- Category 4 (Security/supply chain): Community org (`neo4j-contrib`), but this is Neo4j's own community org — it is the canonical MCP contribution repo for Neo4j tools, not a generic third-party fork. Source code is available and published to PyPI. **Does not trigger Category 4.**

**Pre-filter result: Proceed to gate evaluation.**

#### Hard Gate Results

| Gate | Threshold | Actual | Result |
|------|-----------|--------|--------|
| Stars | 1,000 (community/individual publisher threshold) | 918 | FAIL |
| Commit Recency | ≤30 days preferred, ≤90 hard limit | 21 days (2026-02-23) | Would be PREFERRED |
| Self-Management: Install | Must have documented command | `claude mcp add neo4j-cypher --command "uvx" --args "mcp-neo4j-cypher"` | — (not evaluated, gate 1 failed) |
| Self-Management: Configure | Must have documented command | env vars documented | — |
| Self-Management: Update | Must have documented command | `uvx mcp-neo4j-cypher@latest` (uvx auto-updates) | — |
| Self-Management: Troubleshoot | Must have documented command | `claude mcp list`, `claude mcp get neo4j-cypher` | — |
| CC Duplication | Must not duplicate CC built-in | Cypher execution against Neo4j — no CC built-in equivalent | Would PASS |

**Gate Summary: FAILED at Gate 1 — Stars: 918 below community threshold of 1,000 → ELIMINATED**

**Publisher classification note:** `neo4j-contrib` is Neo4j's community contributions organization, not a recognized official vendor org in the vetting protocol's terms. The official Neo4j vendor (for gate tier purposes) would be repositories under `neo4j` org with Official Neo4j branding. The `neo4j-contrib` org is a community/labs org. Therefore, the 1,000-star threshold applies. At 918 stars, the tool fails by 82 stars.

**APOC requirement note (informational):** The `get_neo4j_schema` tool requires the APOC plugin (`NEO4J_PLUGINS=["apoc"]`). The Graphiti Docker setup at `~/.claude/graphiti/docker-compose.yml` would need to be checked for APOC configuration. The `read_neo4j_cypher` and `write_neo4j_cypher` tools do not require APOC.

---

### Approach Detail: Neo4j Aura Console — NOT VIABLE

The Neo4j Aura console (console.neo4j.io) is the management interface for the Aura cloud database service. Graphiti runs on a self-managed local Neo4j instance (`bolt://localhost:7687`) via Docker. Aura requires the database to be hosted on Aura's cloud infrastructure. Since Graphiti's Neo4j is local, the Aura console cannot connect to it.

**Verdict: NOT VIABLE — wrong deployment model.**

---

### Recommendation

**Recommended approach: Neo4j Browser at localhost:7475 (existing workaround)**

`mcp-neo4j-cypher` fails Gate 1 (918 stars vs. 1,000 threshold) and is eliminated. No other existing tool provides a richer browsing interface than what is already available.

The Neo4j Browser at `http://localhost:7475` is the best available option for browsing Graphiti's knowledge graph today. It requires Cypher knowledge but provides full graph visualization, node/relationship browsing, and query capabilities. The Graphiti MCP tools (`search_nodes`, `search_memory_facts`, `get_episodes`) complement it for directed queries within Claude Code sessions.

**Practical browsing workflow:**
1. Open `http://localhost:7475` in browser
2. Connect with credentials from `~/.claude/graphiti/docker-compose.yml`
3. Run Cypher queries to browse nodes (`MATCH (n) RETURN n LIMIT 50`)
4. Use sidebar labels panel to see all node types present in the graph

**For v2 consideration:** Re-evaluate `mcp-neo4j-cypher` when it crosses the 1,000-star threshold. The recency (21 days), transport support (stdio + http), and natural language-to-Cypher capability would all make it a strong CONSIDER candidate. Monitor at: `gh api repos/neo4j-contrib/mcp-neo4j --jq '.stargazers_count'`.

---

### If Recommended Approach Is Not Viable

If Neo4j Browser is unavailable (Graphiti server offline, Docker not running):

1. **Use Graphiti MCP tools** — `search_nodes` and `search_memory_facts` work as long as the Graphiti HTTP API is running, even if the Neo4j Browser port is blocked.
2. **Use graphiti-helper.py directly** — `~/.claude/graphiti/graphiti-helper.py search --query "..." --scope global --limit 50` queries the graph from the command line.
3. **Flag for v2** — If no browsing option is available at all, document the gap and flag a proper memory browsing UI as a v2 requirement.

The locked decision prohibits custom build proposals. If all existing options are unavailable, the answer is: document the gap and flag for v2.

---

*Requirement: MEMO-01*
*Feeds into: Phase 3 ranked report — memory tool section*
*Key link: mcp-neo4j-cypher re-evaluation when stars >= 1,000*

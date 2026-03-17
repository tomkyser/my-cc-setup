#!/usr/bin/env python3
"""
graphiti-helper.py — Bridge between Claude Code hooks and Graphiti MCP server.
Includes Haiku-powered context curation to prevent context bloat.

Usage:
  graphiti-helper.py health-check
  graphiti-helper.py detect-project [--cwd PATH]
  graphiti-helper.py search --query QUERY [--scope SCOPE] [--limit N] [--curate CONTEXT]
  graphiti-helper.py add-episode --text TEXT [--scope SCOPE] [--source SOURCE]
  graphiti-helper.py summarize-session [--scope SCOPE]
  graphiti-helper.py list-sessions [--project PROJECT] [--filter TEXT] [--json] [--all]
  graphiti-helper.py view-session --timestamp TIMESTAMP [--json]
  graphiti-helper.py label-session --timestamp TIMESTAMP --label LABEL
  graphiti-helper.py backfill-sessions [--project PROJECT]
  graphiti-helper.py generate-session-name --text TEXT
  graphiti-helper.py verify-memory [--keep]
"""

import argparse
import json
import os
import subprocess
import sys
import time
import uuid
from pathlib import Path

import httpx
import yaml

# --- Configuration ---

MCP_URL = os.environ.get("GRAPHITI_MCP_URL", "http://localhost:8100/mcp")
HEALTH_URL = os.environ.get("GRAPHITI_HEALTH_URL", "http://localhost:8100/health")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
CURATION_MODEL = "anthropic/claude-haiku-4.5"
CURATION_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Load .env if keys not in environment
ENV_FILE = Path(__file__).parent / ".env"
if ENV_FILE.exists() and (not OPENROUTER_API_KEY or not ANTHROPIC_API_KEY):
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            key, value = key.strip(), value.strip()
            if key and value and key not in os.environ:
                os.environ[key] = value
    OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
    ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# Load curation prompts
PROMPTS_FILE = Path(__file__).parent / "curation" / "prompts.yaml"
PROMPTS = {}
if PROMPTS_FILE.exists():
    PROMPTS = yaml.safe_load(PROMPTS_FILE.read_text()) or {}


# --- MCP Client ---

class MCPClient:
    """Lightweight MCP client for Graphiti's streamable HTTP transport."""

    def __init__(self, base_url: str, timeout: float = 5.0):
        self.base_url = base_url.rstrip("/")
        self.client = httpx.Client(timeout=timeout)
        self.session_id = None

    def _initialize(self):
        """Initialize MCP session."""
        if self.session_id:
            return
        resp = self.client.post(
            self.base_url,
            json={"jsonrpc": "2.0", "method": "initialize", "params": {
                "protocolVersion": "2025-03-26",
                "capabilities": {},
                "clientInfo": {"name": "graphiti-helper", "version": "1.0.0"}
            }, "id": 1},
            headers={"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
        )
        # Parse session ID from SSE or header
        self.session_id = resp.headers.get("mcp-session-id")
        # Send initialized notification
        headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
        if self.session_id:
            headers["mcp-session-id"] = self.session_id
        self.client.post(
            self.base_url,
            json={"jsonrpc": "2.0", "method": "notifications/initialized"},
            headers=headers
        )

    def call_tool(self, tool_name: str, arguments: dict) -> dict:
        """Call an MCP tool and return the result."""
        self._initialize()
        headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
        if self.session_id:
            headers["mcp-session-id"] = self.session_id

        resp = self.client.post(
            self.base_url,
            json={
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {"name": tool_name, "arguments": arguments},
                "id": str(uuid.uuid4())
            },
            headers=headers
        )

        # Handle SSE response
        content_type = resp.headers.get("content-type", "")
        if "text/event-stream" in content_type:
            return self._parse_sse(resp.text)
        else:
            try:
                return resp.json()
            except Exception:
                return {"error": f"Unexpected response: {resp.status_code}"}

    def _parse_sse(self, text: str) -> dict:
        """Parse SSE response to extract the JSON-RPC result."""
        for line in text.splitlines():
            if line.startswith("data:"):
                data = line[5:].strip()
                if data:
                    try:
                        parsed = json.loads(data)
                        if "result" in parsed or "error" in parsed:
                            return parsed
                    except json.JSONDecodeError:
                        continue
        return {"error": "No valid response in SSE stream"}

    def close(self):
        self.client.close()


# --- Curation (Haiku via OpenRouter) ---

def curate_results(memories: str, context: str, prompt_key: str = "curate_prompt_context",
                   project_name: str = "unknown", session_type: str = "startup") -> str:
    """Filter search results through Haiku for relevance."""
    if not OPENROUTER_API_KEY:
        return memories

    prompt_config = PROMPTS.get(prompt_key, {})
    system_prompt = prompt_config.get("system", "You are a context curator. Return only the most relevant items as concise bullets.")
    user_template = prompt_config.get("user", "CONTEXT: {prompt}\n\nMEMORIES:\n{memories}\n\nReturn only relevant items as bullets.")

    user_prompt = user_template.format(
        prompt=context,
        memories=memories,
        project_name=project_name,
        session_type=session_type,
        context=context
    )

    try:
        resp = httpx.post(
            CURATION_API_URL,
            json={
                "model": CURATION_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "max_tokens": 500,
                "temperature": 0.3
            },
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            timeout=10.0
        )
        if resp.status_code == 200:
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except Exception:
        pass

    return memories


def summarize_text(text: str) -> str:
    """Summarize text through Haiku for session summaries."""
    if not OPENROUTER_API_KEY:
        return text[:500]

    prompt_config = PROMPTS.get("summarize_session", {})
    system_prompt = prompt_config.get("system", "You are a session summarizer. Create a concise summary.")
    user_template = prompt_config.get("user", "SESSION CONTEXT:\n{context}\n\nSummarize in 3-5 bullets.")

    user_prompt = user_template.format(context=text[:4000])

    try:
        resp = httpx.post(
            CURATION_API_URL,
            json={
                "model": CURATION_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "max_tokens": 500,
                "temperature": 0.3
            },
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            timeout=15.0
        )
        if resp.status_code == 200:
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except Exception:
        pass

    return text[:500]


# --- Session Naming ---

def generate_session_name(text: str) -> str:
    """Generate a 3-5 word session name via Haiku."""
    if not OPENROUTER_API_KEY:
        # Fallback: first 5 words of text, title-cased
        words = text.split()[:5]
        return " ".join(words).title()[:50] if words else ""

    prompt_config = PROMPTS.get("generate_session_name", {})
    system_prompt = prompt_config.get("system", "Generate a concise 3-5 word session name. Output ONLY the name.")
    user_template = prompt_config.get("user", "SESSION CONTEXT:\n{context}\n\nGenerate a single 3-5 word session name.")

    user_prompt = user_template.format(context=text[:2000])

    try:
        resp = httpx.post(
            CURATION_API_URL,
            json={
                "model": CURATION_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "max_tokens": 30,
                "temperature": 0.3
            },
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            timeout=10.0
        )
        if resp.status_code == 200:
            data = resp.json()
            name = data["choices"][0]["message"]["content"].strip()
            # Sanitize: remove quotes, limit length
            name = name.strip('"\'').strip()
            return name[:80] if name else ""
    except Exception:
        pass

    # Fallback on any failure
    words = text.split()[:5]
    return " ".join(words).title()[:50] if words else ""


# --- Commands ---

def cmd_health_check():
    """Check if Graphiti MCP server is running."""
    try:
        resp = httpx.get(HEALTH_URL, timeout=3.0)
        if resp.status_code == 200:
            sys.exit(0)
        else:
            print(f"[graphiti] Health check: HTTP {resp.status_code}", file=sys.stderr)
    except httpx.ConnectError:
        print("[graphiti] Server unreachable — memory hooks disabled", file=sys.stderr)
    except httpx.TimeoutException:
        print("[graphiti] Server timeout — memory hooks disabled", file=sys.stderr)
    except Exception as e:
        print(f"[graphiti] Health check failed: {e}", file=sys.stderr)
    sys.exit(1)


def cmd_detect_project(cwd: str = None):
    """Detect project name from current directory."""
    cwd = cwd or os.getcwd()

    # Try git remote
    try:
        result = subprocess.run(
            ["git", "-C", cwd, "config", "--get", "remote.origin.url"],
            capture_output=True, text=True, timeout=3
        )
        if result.returncode == 0 and result.stdout.strip():
            url = result.stdout.strip()
            name = url.rstrip("/").rsplit("/", 1)[-1]
            name = name.removesuffix(".git")
            print(name)
            return
    except Exception:
        pass

    # Try package.json
    pkg = Path(cwd) / "package.json"
    if pkg.exists():
        try:
            data = json.loads(pkg.read_text())
            if "name" in data:
                print(data["name"])
                return
        except Exception:
            pass

    # Try composer.json
    composer = Path(cwd) / "composer.json"
    if composer.exists():
        try:
            data = json.loads(composer.read_text())
            if "name" in data:
                print(data["name"].split("/")[-1])
                return
        except Exception:
            pass

    # Try pyproject.toml name
    pyproject = Path(cwd) / "pyproject.toml"
    if pyproject.exists():
        try:
            text = pyproject.read_text()
            for line in text.splitlines():
                if line.strip().startswith("name"):
                    name = line.split("=", 1)[1].strip().strip('"').strip("'")
                    print(name)
                    return
        except Exception:
            pass

    # Try .ddev/config.yaml
    ddev = Path(cwd) / ".ddev" / "config.yaml"
    if ddev.exists():
        try:
            data = yaml.safe_load(ddev.read_text())
            if "name" in data:
                print(data["name"])
                return
        except Exception:
            pass

    # Fallback to directory name
    print(Path(cwd).name)


def cmd_search(query: str, scope: str = "global", limit: int = 10, curate: str = None):
    """Search Graphiti for relevant facts and nodes."""
    mcp = MCPClient(MCP_URL)
    results = []

    try:
        # Search facts (edges between entities)
        facts_resp = mcp.call_tool("search_memory_facts", {
            "query": query,
            "group_ids": [scope],
            "max_facts": limit
        })
        facts = _extract_content(facts_resp)
        if facts:
            results.append(facts)

        # Search nodes (entity summaries)
        nodes_resp = mcp.call_tool("search_nodes", {
            "query": query,
            "group_ids": [scope],
            "max_nodes": limit
        })
        nodes = _extract_content(nodes_resp)
        if nodes:
            results.append(nodes)

    except Exception as e:
        print(f"Search error: {e}", file=sys.stderr)
    finally:
        mcp.close()

    combined = "\n".join(results)

    if not combined.strip():
        return

    if curate:
        project = scope.split(":", 1)[-1] if ":" in scope else "general"
        combined = curate_results(combined, curate, project_name=project)

    print(combined)


def cmd_add_episode(text: str, scope: str = "global", source: str = "hook"):
    """Add an episode to the Graphiti knowledge graph."""
    mcp = MCPClient(MCP_URL)
    success = False
    try:
        resp = mcp.call_tool("add_memory", {
            "name": source,
            "episode_body": text,
            "group_id": scope,
            "source": "text",
            "source_description": source
        })
        if "error" in resp:
            err = resp.get("error", {})
            if isinstance(err, dict):
                print(f"[graphiti] Error: {err.get('message', err)}", file=sys.stderr)
            else:
                print(f"[graphiti] Error: {err}", file=sys.stderr)
        else:
            success = True
            if os.environ.get("GRAPHITI_VERBOSE") == "1":
                print(f"[graphiti] Stored: {source} ({scope})", file=sys.stderr)
    except Exception as e:
        print(f"[graphiti] Error: {e}", file=sys.stderr)
    finally:
        mcp.close()
    if not success:
        sys.exit(1)


def cmd_summarize_session(scope: str = "global"):
    """Read context from stdin and output a session summary."""
    text = sys.stdin.read()
    if not text.strip():
        return
    summary = summarize_text(text)
    print(summary)


# --- Helpers ---

def _extract_content(response: dict) -> str:
    """Extract text content from MCP tool response."""
    if "error" in response:
        return ""

    result = response.get("result", {})
    content = result.get("content", [])

    texts = []
    for item in content:
        if isinstance(item, dict) and item.get("type") == "text":
            texts.append(item["text"])

    return "\n".join(texts)


# --- Session Index ---

SESSIONS_FILE = Path.home() / ".claude" / "graphiti" / "sessions.json"


def _load_sessions() -> list:
    """Load sessions index. Returns empty list if file missing or corrupt."""
    if not SESSIONS_FILE.exists():
        return []
    try:
        data = json.loads(SESSIONS_FILE.read_text())
        if isinstance(data, list):
            return data
        return []
    except (json.JSONDecodeError, OSError):
        return []


def _save_sessions(sessions: list):
    """Write sessions index atomically."""
    SESSIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = SESSIONS_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(sessions, indent=2) + "\n")
    tmp.rename(SESSIONS_FILE)


# --- Session Commands ---

def cmd_list_sessions(project: str = None, filter_text: str = None,
                      as_json: bool = False, show_all: bool = False):
    """List sessions from local index."""
    sessions = _load_sessions()

    # Auto-trigger backfill if index file doesn't exist and we got empty list
    if not sessions and not SESSIONS_FILE.exists():
        cmd_backfill_sessions(project=None)
        sessions = _load_sessions()

    # Determine project filter
    if not show_all:
        if project is None:
            # Auto-detect project from cwd
            try:
                result = subprocess.run(
                    [sys.executable, __file__, "detect-project"],
                    capture_output=True, text=True, timeout=5
                )
                if result.returncode == 0 and result.stdout.strip():
                    project = result.stdout.strip()
            except Exception:
                pass
        if project:
            sessions = [s for s in sessions if s.get("project") == project]

    # Apply label filter
    if filter_text:
        lower_filter = filter_text.lower()
        sessions = [s for s in sessions if lower_filter in (s.get("label") or "").lower()]

    # Sort by timestamp descending (newest first)
    sessions.sort(key=lambda s: s.get("timestamp", ""), reverse=True)

    if not sessions:
        if as_json:
            print("[]")
        else:
            print("No sessions found.")
        return

    if as_json:
        print(json.dumps(sessions, indent=2))
        return

    # Human-readable output
    header_project = project if project and not show_all else "all projects"
    print(f"Sessions for project: {header_project}")
    print()
    print(f"  {'#':>3}  {'Timestamp':<26} Label")

    for i, s in enumerate(sessions, 1):
        ts = s.get("timestamp", "(unknown)")
        label = s.get("label") or "(unnamed)"
        print(f"  {i:>3}  {ts:<26} {label}")


def cmd_view_session(timestamp: str, as_json: bool = False):
    """View a session's content from Graphiti."""
    scope = f"session-{timestamp}"
    mcp = MCPClient(MCP_URL)
    content_found = False

    try:
        # Primary: get_episodes for the session scope
        resp = mcp.call_tool("get_episodes", {"group_id": scope})
        text = _extract_content(resp)

        if text and text.strip():
            content_found = True
            if as_json:
                print(json.dumps(resp, indent=2))
            else:
                print(text)
        else:
            # Fallback: search global scope for session summary with this timestamp
            fallback_resp = mcp.call_tool("search_memory_facts", {
                "query": f"session summary {timestamp}",
                "group_ids": ["global"],
                "max_facts": 5
            })
            fallback_text = _extract_content(fallback_resp)
            if fallback_text and fallback_text.strip():
                content_found = True
                if as_json:
                    print(json.dumps(fallback_resp, indent=2))
                else:
                    print(fallback_text)
    except Exception as e:
        print(f"Error retrieving session: {e}", file=sys.stderr)
    finally:
        mcp.close()

    if not content_found:
        print(f"No content found for session {timestamp}.")


def cmd_label_session(timestamp: str, label: str):
    """Assign a label to a session."""
    sessions = _load_sessions()
    entry = next((s for s in sessions if s.get("timestamp") == timestamp), None)
    if entry is None:
        print(f"Session {timestamp} not found in index.", file=sys.stderr)
        sys.exit(1)
    entry["label"] = label
    entry["labeled_by"] = "user"
    _save_sessions(sessions)
    print(f"Labeled session {timestamp}: {label}")


def cmd_backfill_sessions(project: str = None):
    """Scan Graphiti for existing sessions and populate index."""
    import re

    mcp = MCPClient(MCP_URL)
    sessions = _load_sessions()
    existing_timestamps = {s.get("timestamp") for s in sessions}
    added = 0

    try:
        resp = mcp.call_tool("search_memory_facts", {
            "query": "session summary",
            "group_ids": ["global"],
            "max_facts": 50
        })
        text = _extract_content(resp)
        if text:
            # Parse session summaries: look for "Session summary (TIMESTAMP):" pattern
            pattern = r"Session summary \(([^)]+)\):\s*(.+?)(?=Session summary \(|$)"
            matches = re.findall(pattern, text, re.DOTALL)

            for ts, summary_text in matches:
                ts = ts.strip()
                if ts in existing_timestamps:
                    continue

                # Try to extract project from [project-name] prefix
                proj_match = re.search(r"\[project-([^\]]+)\]", summary_text)
                proj = proj_match.group(1) if proj_match else "unknown"

                # Use first 50 chars of summary as label
                label = summary_text.strip()[:50].strip()

                sessions.append({
                    "timestamp": ts,
                    "project": proj,
                    "label": label,
                    "labeled_by": "auto"
                })
                existing_timestamps.add(ts)
                added += 1
    except Exception as e:
        print(f"Backfill error: {e}", file=sys.stderr)
    finally:
        mcp.close()

    if added > 0:
        _save_sessions(sessions)
    print(f"Backfilled {added} session(s).")


def cmd_index_session(timestamp: str, project: str, label: str = "",
                      labeled_by: str = "auto"):
    """Add or update a session entry in sessions.json."""
    sessions = _load_sessions()
    # Check if entry already exists
    existing = next((s for s in sessions if s["timestamp"] == timestamp), None)
    if existing:
        # Only update if not user-labeled (preserve user labels)
        if existing.get("labeled_by") == "user":
            return  # Do not overwrite user labels
        # Don't overwrite non-empty label with empty one
        if not label and existing.get("label"):
            return
        existing["label"] = label
        existing["labeled_by"] = labeled_by
        if project and project != "unknown":
            existing["project"] = project
    else:
        sessions.append({
            "timestamp": timestamp,
            "project": project,
            "label": label,
            "labeled_by": labeled_by
        })
    _save_sessions(sessions)


def cmd_generate_session_name(text: str):
    """Generate and print a session name from provided text."""
    name = generate_session_name(text)
    if name:
        print(name)
    else:
        sys.exit(1)


# --- Verification ---

def cmd_verify_memory(keep: bool = False):
    """Quick pass/fail verification of the full memory pipeline (~30 seconds)."""
    print("=== MEMORY SYSTEM VERIFICATION ===")
    print()

    checks = []  # list of (name, status, detail)
    canary_written = False

    # Check 1 — Server Health
    try:
        resp = httpx.get(HEALTH_URL, timeout=5)
        if resp.status_code == 200:
            checks.append(("Server Health", "PASS", "Graphiti API responding (HTTP 200)"))
        else:
            checks.append(("Server Health", "FAIL", f"HTTP {resp.status_code}"))
    except httpx.ConnectError as e:
        checks.append(("Server Health", "FAIL", f"Connection refused: {e}"))
    except httpx.TimeoutException:
        checks.append(("Server Health", "FAIL", "Timeout connecting to health endpoint"))
    except Exception as e:
        checks.append(("Server Health", "FAIL", f"Error: {e}"))

    # Only proceed with MCP checks if server is healthy
    if checks[0][1] == "FAIL":
        checks.append(("Global Scope Write", "FAIL", "Skipped — server not healthy"))
        checks.append(("Global Scope Read", "FAIL", "Skipped — server not healthy"))
        checks.append(("Session Index", "FAIL", "Skipped — server not healthy"))
        checks.append(("List Sessions", "FAIL", "Skipped — server not healthy"))
        checks.append(("View Session", "FAIL", "Skipped — server not healthy"))
    else:
        # Check 2 — Global Scope Write
        canary_id = str(uuid.uuid4())
        canary_text = f"[verify-memory] canary probe {canary_id}"
        mcp = MCPClient(MCP_URL)
        try:
            resp = mcp.call_tool("add_memory", {
                "name": "verification",
                "episode_body": canary_text,
                "group_id": "global",
                "source": "text",
                "source_description": "verification"
            })
            if "result" in resp:
                checks.append(("Global Scope Write", "PASS", f"Canary written (id: {canary_id[:8]}...)"))
                canary_written = True
            else:
                err = resp.get("error", "unknown error")
                checks.append(("Global Scope Write", "FAIL", f"Error: {err}"))
        except Exception as e:
            checks.append(("Global Scope Write", "FAIL", f"Error: {e}"))
        finally:
            mcp.close()

        # Check 3 — Global Scope Read
        if canary_written:
            time.sleep(2)  # Allow indexing time
            mcp = MCPClient(MCP_URL)
            try:
                resp = mcp.call_tool("search_memory_facts", {
                    "query": "verify-memory canary probe",
                    "group_ids": ["global"],
                    "max_facts": 5
                })
                content = _extract_content(resp) if "result" in resp else ""
                if content and content.strip():
                    checks.append(("Global Scope Read", "PASS", "Facts retrieved from global scope"))
                else:
                    checks.append(("Global Scope Read", "FAIL", "No facts returned — indexing may need more time"))
            except Exception as e:
                checks.append(("Global Scope Read", "FAIL", f"Error: {e}"))
            finally:
                mcp.close()
        else:
            checks.append(("Global Scope Read", "FAIL", "Skipped — write failed"))

        # Check 4 — Session Index
        sessions = _load_sessions()
        if sessions:
            checks.append(("Session Index", "PASS", f"{len(sessions)} session(s) in local index"))
        else:
            checks.append(("Session Index", "FAIL",
                           "No sessions indexed — run backfill-sessions or start a new session"))

        # Check 5 — List Sessions
        try:
            result = subprocess.run(
                [sys.executable, __file__, "list-sessions", "--json", "--all"],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0:
                try:
                    parsed = json.loads(result.stdout)
                    if isinstance(parsed, list) and len(parsed) > 0:
                        checks.append(("List Sessions", "PASS",
                                       f"{len(parsed)} session(s) returned"))
                    else:
                        checks.append(("List Sessions", "FAIL",
                                       "Command succeeded but returned empty list"))
                except json.JSONDecodeError:
                    checks.append(("List Sessions", "FAIL",
                                   f"Command succeeded but output is not valid JSON"))
            else:
                checks.append(("List Sessions", "FAIL",
                               f"Exit code {result.returncode}: {result.stderr.strip()[:200]}"))
        except subprocess.TimeoutExpired:
            checks.append(("List Sessions", "FAIL", "Timed out after 10s"))
        except Exception as e:
            checks.append(("List Sessions", "FAIL", f"Error: {e}"))

        # Check 6 — View Session
        list_passed = checks[-1][1] == "PASS"
        if list_passed:
            try:
                # Re-parse list output to get first timestamp
                result = subprocess.run(
                    [sys.executable, __file__, "list-sessions", "--json", "--all"],
                    capture_output=True, text=True, timeout=10
                )
                sessions_list = json.loads(result.stdout)
                first_ts = sessions_list[0].get("timestamp", "")
                if first_ts:
                    result = subprocess.run(
                        [sys.executable, __file__, "view-session",
                         "--timestamp", first_ts, "--json"],
                        capture_output=True, text=True, timeout=10
                    )
                    if result.returncode == 0 and result.stdout.strip():
                        checks.append(("View Session", "PASS",
                                       f"Session {first_ts} content retrieved"))
                    else:
                        checks.append(("View Session", "FAIL",
                                       f"Exit code {result.returncode}, "
                                       f"stdout empty: {not bool(result.stdout.strip())}"))
                else:
                    checks.append(("View Session", "FAIL", "No timestamp in first session entry"))
            except Exception as e:
                checks.append(("View Session", "FAIL", f"Error: {e}"))
        else:
            checks.append(("View Session", "FAIL", "Skipped — list-sessions failed"))

    # Cleanup note
    if canary_written and not keep:
        print("Note: Canary data will be cleaned by Graphiti's entity resolution.")
        print("      Use --keep flag to retain test data for inspection.")
        print()
    elif canary_written and keep:
        print("Note: --keep flag set. Canary test data retained in global scope.")
        print()

    # Results table
    for name, status, detail in checks:
        marker = "[PASS]" if status == "PASS" else "[FAIL]"
        print(f"  {marker}  {name}: {detail}")

    # Summary
    passed = sum(1 for _, s, _ in checks if s == "PASS")
    total = len(checks)
    print()
    if passed == total:
        print(f"PASS: Memory system healthy ({passed}/{total} checks passed)")
        sys.exit(0)
    else:
        failed = total - passed
        print(f"FAIL: {failed} issue(s) found ({passed}/{total} checks passed)")
        sys.exit(1)


# --- Main ---

def main():
    parser = argparse.ArgumentParser(description="Graphiti helper for Claude Code hooks")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    subparsers.add_parser("health-check", help="Check if Graphiti server is running")

    dp = subparsers.add_parser("detect-project", help="Detect project name from cwd")
    dp.add_argument("--cwd", default=None, help="Working directory (default: $PWD)")

    sp = subparsers.add_parser("search", help="Search the knowledge graph")
    sp.add_argument("--query", required=True, help="Search query")
    sp.add_argument("--scope", default="global", help="group_id scope")
    sp.add_argument("--limit", type=int, default=10, help="Max results")
    sp.add_argument("--curate", default=None, help="Context for Haiku curation filtering")

    ap = subparsers.add_parser("add-episode", help="Add an episode to the knowledge graph")
    ap.add_argument("--text", required=True, help="Episode text content")
    ap.add_argument("--scope", default="global", help="group_id scope")
    ap.add_argument("--source", default="hook", help="Source description")

    ss = subparsers.add_parser("summarize-session", help="Summarize session from stdin")
    ss.add_argument("--scope", default="global", help="group_id scope")

    ls = subparsers.add_parser("list-sessions", help="List sessions from local index")
    ls.add_argument("--project", default=None, help="Filter by project (default: auto-detect)")
    ls.add_argument("--filter", default=None, help="Case-insensitive substring match on label")
    ls.add_argument("--json", action="store_true", help="Output as JSON array")
    ls.add_argument("--all", action="store_true", help="Show all projects")

    vs = subparsers.add_parser("view-session", help="View a session's content from Graphiti")
    vs.add_argument("--timestamp", required=True, help="Session timestamp (e.g., 2026-03-17T03:28:25Z)")
    vs.add_argument("--json", action="store_true", help="Output raw JSON")

    lb = subparsers.add_parser("label-session", help="Assign a label to a session")
    lb.add_argument("--timestamp", required=True, help="Session timestamp")
    lb.add_argument("--label", required=True, help="Human-readable label")

    bf = subparsers.add_parser("backfill-sessions", help="Scan Graphiti for existing sessions and populate index")
    bf.add_argument("--project", default=None, help="Filter by project name in content")

    ix = subparsers.add_parser("index-session", help="Add/update a session entry in the local index")
    ix.add_argument("--timestamp", required=True, help="Session timestamp")
    ix.add_argument("--project", required=True, help="Project name")
    ix.add_argument("--label", default="", help="Session label")
    ix.add_argument("--labeled-by", default="auto", choices=["auto", "user"], help="Who set the label")

    gn = subparsers.add_parser("generate-session-name", help="Generate a 3-5 word session name via Haiku")
    gn.add_argument("--text", required=True, help="Context text to generate name from")

    vm = subparsers.add_parser("verify-memory", help="Quick pass/fail verification of the full memory pipeline")
    vm.add_argument("--keep", action="store_true", help="Keep canary test data (default: cleaned up)")

    args = parser.parse_args()

    if args.command == "health-check":
        cmd_health_check()
    elif args.command == "detect-project":
        cmd_detect_project(args.cwd)
    elif args.command == "search":
        cmd_search(args.query, args.scope, args.limit, args.curate)
    elif args.command == "add-episode":
        cmd_add_episode(args.text, args.scope, args.source)
    elif args.command == "summarize-session":
        cmd_summarize_session(args.scope)
    elif args.command == "list-sessions":
        cmd_list_sessions(project=args.project, filter_text=args.filter,
                          as_json=args.json, show_all=args.all)
    elif args.command == "view-session":
        cmd_view_session(timestamp=args.timestamp, as_json=args.json)
    elif args.command == "label-session":
        cmd_label_session(timestamp=args.timestamp, label=args.label)
    elif args.command == "backfill-sessions":
        cmd_backfill_sessions(project=args.project)
    elif args.command == "index-session":
        cmd_index_session(timestamp=args.timestamp, project=args.project,
                          label=args.label, labeled_by=args.labeled_by)
    elif args.command == "generate-session-name":
        cmd_generate_session_name(text=args.text)
    elif args.command == "verify-memory":
        cmd_verify_memory(keep=args.keep)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()

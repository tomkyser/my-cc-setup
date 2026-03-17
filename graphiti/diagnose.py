#!/usr/bin/env python3
"""
diagnose.py — Diagnostic probe for the Graphiti memory pipeline.

Tests each stage of the hook -> graphiti-helper.py -> Graphiti MCP -> Neo4j pipeline
independently and reports exactly where failures occur.

Usage:
    ~/.claude/graphiti/.venv/bin/python3 ~/.claude/graphiti/diagnose.py
"""

import json
import subprocess
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

# Add graphiti dir to path so we can optionally import MCPClient
GRAPHITI_DIR = Path(__file__).parent
sys.path.insert(0, str(GRAPHITI_DIR))

import httpx

# --- Configuration (mirrors graphiti-helper.py) ---
import os

ENV_FILE = GRAPHITI_DIR / ".env"
if ENV_FILE.exists():
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            key, value = key.strip(), value.strip()
            if key and value and key not in os.environ:
                os.environ[key] = value

MCP_URL = os.environ.get("GRAPHITI_MCP_URL", "http://localhost:8100/mcp")
HEALTH_URL = os.environ.get("GRAPHITI_HEALTH_URL", "http://localhost:8100/health")
HELPER_PYTHON = str(GRAPHITI_DIR / ".venv" / "bin" / "python3")
HELPER_SCRIPT = str(GRAPHITI_DIR / "graphiti-helper.py")

ISO_TIMESTAMP = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# --- Results tracking ---

results = []  # list of (stage_num, stage_name, status, output)


def record(stage_num: int, stage_name: str, status: str, output: str):
    results.append((stage_num, stage_name, status, output))
    print(f"\n--- Stage {stage_num}: {stage_name} ---")
    print(f"Status: {status}")
    print(f"Output: {output}")


# --- MCP session helpers (inline reimplementation to avoid import side effects) ---

def mcp_initialize(client: httpx.Client) -> tuple[str | None, str]:
    """Initialize MCP session. Returns (session_id, log_output)."""
    try:
        resp = client.post(
            MCP_URL,
            json={
                "jsonrpc": "2.0",
                "method": "initialize",
                "params": {
                    "protocolVersion": "2025-03-26",
                    "capabilities": {},
                    "clientInfo": {"name": "diagnose", "version": "1.0.0"}
                },
                "id": 1
            },
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream"
            }
        )
        session_id = resp.headers.get("mcp-session-id")
        log = f"HTTP {resp.status_code}\nHeaders: mcp-session-id={session_id}\nBody (first 500): {resp.text[:500]}"

        if session_id:
            # Send initialized notification
            init_headers = {
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream",
                "mcp-session-id": session_id
            }
            client.post(
                MCP_URL,
                json={"jsonrpc": "2.0", "method": "notifications/initialized"},
                headers=init_headers
            )

        return session_id, log
    except Exception as e:
        return None, f"Exception: {e}"


def mcp_call_tool(client: httpx.Client, session_id: str | None, tool_name: str, arguments: dict) -> tuple[dict, str]:
    """Call an MCP tool. Returns (parsed_result, raw_log)."""
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"
    }
    if session_id:
        headers["mcp-session-id"] = session_id

    try:
        resp = client.post(
            MCP_URL,
            json={
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {"name": tool_name, "arguments": arguments},
                "id": str(uuid.uuid4())
            },
            headers=headers
        )
        raw = resp.text
        log = f"HTTP {resp.status_code}\nBody (first 1000): {raw[:1000]}"

        content_type = resp.headers.get("content-type", "")
        if "text/event-stream" in content_type:
            parsed = parse_sse(raw)
        else:
            try:
                parsed = resp.json()
            except Exception:
                parsed = {"error": f"Unexpected response: {resp.status_code} {raw[:200]}"}

        return parsed, log
    except Exception as e:
        return {"error": str(e)}, f"Exception: {e}"


def parse_sse(text: str) -> dict:
    """Parse SSE stream to extract JSON-RPC result."""
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
    return {"error": "No valid response in SSE stream", "raw": text[:500]}


# ============================================================
# PROBES
# ============================================================

def probe_docker() -> tuple[str, str]:
    """Stage 1: Check Docker containers are running."""
    try:
        result = subprocess.run(
            ["docker", "ps", "--filter", "name=graphiti", "--format", "{{.Names}} {{.Status}}"],
            capture_output=True, text=True, timeout=10
        )
        output = result.stdout.strip()
        if not output:
            return "FAIL", "No graphiti containers found in docker ps output"

        neo4j_up = any("graphiti-neo4j" in line and "Up" in line for line in output.splitlines())
        mcp_up = any("graphiti-mcp" in line and "Up" in line for line in output.splitlines())

        if neo4j_up and mcp_up:
            return "PASS", output
        else:
            issues = []
            if not neo4j_up:
                issues.append("graphiti-neo4j not running or not healthy")
            if not mcp_up:
                issues.append("graphiti-mcp not running or not healthy")
            return "FAIL", f"{'; '.join(issues)}\nFull docker ps output:\n{output}"
    except FileNotFoundError:
        return "FAIL", "Docker not found in PATH"
    except subprocess.TimeoutExpired:
        return "FAIL", "docker ps timed out after 10s"
    except Exception as e:
        return "FAIL", f"Exception: {e}"


def probe_neo4j() -> tuple[str, str]:
    """Stage 2: Check Neo4j is reachable from the host (port 7475)."""
    try:
        resp = httpx.get("http://localhost:7475", timeout=5.0)
        return "PASS", f"HTTP {resp.status_code} — Neo4j browser reachable at localhost:7475"
    except httpx.ConnectError as e:
        return "FAIL", f"Connection refused at localhost:7475 — Neo4j not reachable from host: {e}"
    except httpx.TimeoutException:
        return "FAIL", "Timeout connecting to localhost:7475"
    except Exception as e:
        return "FAIL", f"Exception: {e}"


def probe_graphiti_health() -> tuple[str, str]:
    """Stage 3: Check Graphiti MCP health endpoint."""
    try:
        resp = httpx.get(HEALTH_URL, timeout=5.0)
        if resp.status_code == 200:
            return "PASS", f"HTTP {resp.status_code} — {resp.text[:200]}"
        else:
            return "FAIL", f"HTTP {resp.status_code} — {resp.text[:200]}"
    except httpx.ConnectError as e:
        return "FAIL", f"Connection refused at {HEALTH_URL}: {e}"
    except httpx.TimeoutException:
        return "FAIL", f"Timeout connecting to {HEALTH_URL}"
    except Exception as e:
        return "FAIL", f"Exception: {e}"


def probe_mcp_session(client: httpx.Client) -> tuple[str | None, str, str]:
    """Stage 4: Test MCP session initialization. Returns (session_id, status, output)."""
    session_id, log = mcp_initialize(client)
    if session_id:
        return session_id, "PASS", f"session_id={session_id}\n{log}"
    else:
        return None, "FAIL", f"No mcp-session-id returned\n{log}"


def probe_mcp_write(client: httpx.Client, session_id: str | None) -> tuple[str, str]:
    """Stage 5: Test MCP add_memory tool call (global scope)."""
    args = {
        "name": "diagnostic-probe",
        "episode_body": f"Diagnostic canary write at {ISO_TIMESTAMP}",
        "group_id": "global",
        "source": "text",
        "source_description": "diagnostic-probe"
    }
    parsed, log = mcp_call_tool(client, session_id, "add_memory", args)

    if "error" in parsed:
        err = parsed["error"]
        return "FAIL", f"Error in response: {err}\nFull response: {json.dumps(parsed, indent=2)[:1000]}\n{log}"
    else:
        return "PASS", f"add_memory returned result (no error key)\nFull response: {json.dumps(parsed, indent=2)[:500]}\n{log}"


def probe_mcp_read(client: httpx.Client, session_id: str | None) -> tuple[str, str]:
    """Stage 6: Test MCP search_memory_facts tool call."""
    args = {
        "query": "diagnostic canary",
        "group_ids": ["global"],
        "max_facts": 5
    }
    parsed, log = mcp_call_tool(client, session_id, "search_memory_facts", args)

    if "error" in parsed:
        err = parsed["error"]
        return "FAIL", f"Error in response: {err}\nFull response: {json.dumps(parsed, indent=2)[:1000]}\n{log}"
    else:
        return "PASS", f"search_memory_facts returned result\nFull response: {json.dumps(parsed, indent=2)[:500]}\n{log}"


def detect_project() -> str:
    """Run graphiti-helper.py detect-project and return the project name."""
    try:
        cwd = "/Users/tom.kyser/Library/Mobile Documents/com~apple~CloudDocs/dev/my-cc-setup"
        result = subprocess.run(
            [HELPER_PYTHON, HELPER_SCRIPT, "detect-project", "--cwd", cwd],
            capture_output=True, text=True, timeout=10
        )
        name = result.stdout.strip()
        if name:
            return name
        return f"unknown (stderr: {result.stderr.strip()[:100]})"
    except Exception as e:
        return f"unknown (exception: {e})"


def probe_project_scope_write(client: httpx.Client, session_id: str | None, project_name: str) -> tuple[str, str]:
    """Stage 7: Test writing to project scope specifically."""
    group_id = f"project-{project_name}"
    args = {
        "name": "diagnostic-project-probe",
        "episode_body": f"Diagnostic project-scope canary at {ISO_TIMESTAMP}",
        "group_id": group_id,
        "source": "text",
        "source_description": "diagnostic-project-probe"
    }
    parsed, log = mcp_call_tool(client, session_id, "add_memory", args)

    if "error" in parsed:
        err = parsed["error"]
        return "FAIL", f"Detected project: {project_name}\ngroup_id used: {group_id}\nError: {err}\nFull response: {json.dumps(parsed, indent=2)[:1000]}\n{log}"
    else:
        return "PASS", f"Detected project: {project_name}\ngroup_id used: {group_id}\nadd_memory returned result (no error)\nFull response: {json.dumps(parsed, indent=2)[:500]}\n{log}"


def probe_project_scope_read(client: httpx.Client, session_id: str | None, project_name: str) -> tuple[str, str]:
    """Stage 8: Verify project-scoped write is retrievable."""
    import time
    time.sleep(5)  # Allow Graphiti time to index the episode from Stage 7
    group_id = f"project-{project_name}"
    args = {
        "query": "diagnostic project-scope canary",
        "group_ids": [group_id],
        "max_facts": 5
    }
    parsed, log = mcp_call_tool(client, session_id, "search_memory_facts", args)

    if "error" in parsed:
        err = parsed["error"]
        return "FAIL", f"group_id searched: {group_id}\nError: {err}\nFull response: {json.dumps(parsed, indent=2)[:1000]}\n{log}"
    else:
        result_text = json.dumps(parsed, indent=2)
        # Check if ANY facts were returned from the project scope — this proves scope isolation works
        structured = parsed.get("result", {}).get("structuredContent", {}).get("result", {})
        if not structured:
            # Try extracting from content text
            for item in parsed.get("result", {}).get("content", []):
                if item.get("type") == "text":
                    try:
                        structured = json.loads(item["text"])
                    except (json.JSONDecodeError, KeyError):
                        pass
        facts = structured.get("facts", [])
        has_project_facts = any(f.get("group_id") == group_id for f in facts) if facts else False
        canary_found = "diagnostic" in result_text.lower() or has_project_facts
        status = "PASS" if canary_found else "FAIL (write succeeded but no facts found in project scope — possible indexing delay)"
        return status.split(" ")[0], f"group_id searched: {group_id}\nFacts in project scope: {len(facts)}\nProject-scoped facts found: {has_project_facts}\nFull response: {result_text[:800]}\n{log}"


def probe_helper_add_episode(project_name: str) -> tuple[str, str]:
    """Stage 9: Test graphiti-helper.py add-episode command WITH stderr visible."""
    cmd = [
        HELPER_PYTHON, HELPER_SCRIPT,
        "add-episode",
        "--text", f"Helper probe canary at {ISO_TIMESTAMP}",
        "--scope", "global",
        "--source", "diagnostic"
    ]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True, text=True, timeout=60
        )
        stdout = result.stdout.strip()
        stderr = result.stderr.strip()
        exit_code = result.returncode

        log = f"Command: {' '.join(cmd)}\nExit code: {exit_code}\nstdout: {stdout or '(empty)'}\nstderr: {stderr or '(empty)'}"

        if exit_code == 0 and not stderr:
            return "PASS", log
        elif exit_code == 0 and stderr:
            return "FAIL", f"Exit 0 but stderr contains error messages (these are what 2>/dev/null hides in hooks)\n{log}"
        else:
            return "FAIL", f"Non-zero exit code {exit_code}\n{log}"
    except subprocess.TimeoutExpired:
        return "FAIL", f"Command timed out after 60s\nCommand: {' '.join(cmd)}"
    except Exception as e:
        return "FAIL", f"Exception running command: {e}"


def probe_hook_simulation(project_name: str) -> tuple[str, str]:
    """Stage 10: Simulate capture-change.sh hook write path WITH stderr visible."""
    scope = f"project-{project_name}" if project_name and project_name not in ("unknown", "tom.kyser") else "global"
    cmd = [
        HELPER_PYTHON, HELPER_SCRIPT,
        "add-episode",
        "--text", f"File Write: /tmp/diagnostic-test.txt",
        "--scope", scope,
        "--source", "change-hook"
    ]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True, text=True, timeout=60
        )
        stdout = result.stdout.strip()
        stderr = result.stderr.strip()
        exit_code = result.returncode

        log = f"Simulated hook command (no 2>/dev/null, no &):\nCommand: {' '.join(cmd)}\nExit code: {exit_code}\nstdout: {stdout or '(empty)'}\nstderr: {stderr or '(empty)'}"

        if exit_code == 0 and not stderr:
            return "PASS", log
        elif exit_code == 0 and stderr:
            return "FAIL", f"This is what 2>/dev/null was hiding in the actual hook!\n{log}"
        else:
            return "FAIL", f"Non-zero exit code {exit_code}\n{log}"
    except subprocess.TimeoutExpired:
        return "FAIL", f"Simulated hook timed out after 60s\nScope used: {scope}\nCommand: {' '.join(cmd)}"
    except Exception as e:
        return "FAIL", f"Exception: {e}"


def probe_session_list() -> tuple[str, str]:
    """Stage 11: Check list-sessions returns valid session data."""
    cmd = [
        sys.executable, str(GRAPHITI_DIR / "graphiti-helper.py"),
        "list-sessions", "--json", "--all"
    ]
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            try:
                parsed = json.loads(result.stdout)
                if isinstance(parsed, list):
                    return "PASS", f"list-sessions returned {len(parsed)} session(s)\nstdout: {result.stdout.strip()[:500]}"
                else:
                    return "FAIL", f"Output is not a JSON array: {result.stdout.strip()[:200]}"
            except json.JSONDecodeError:
                return "FAIL", f"Output is not valid JSON: {result.stdout.strip()[:200]}"
        else:
            return "FAIL", f"Exit code {result.returncode}\nstderr: {result.stderr.strip()[:300]}"
    except subprocess.TimeoutExpired:
        return "FAIL", "list-sessions timed out after 10s"
    except Exception as e:
        return "FAIL", f"Exception: {e}"


def probe_session_view(sessions_json: list) -> tuple[str, str]:
    """Stage 12: Check view-session returns content for a known session."""
    if not sessions_json:
        return "SKIP", "No sessions available — cannot test view-session"

    first = sessions_json[0]
    timestamp = first.get("timestamp", "")
    if not timestamp:
        return "FAIL", f"First session entry has no timestamp field: {first}"

    cmd = [
        sys.executable, str(GRAPHITI_DIR / "graphiti-helper.py"),
        "view-session", "--timestamp", timestamp, "--json"
    ]
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0 and result.stdout.strip():
            return "PASS", f"view-session for {timestamp} returned content\nstdout (first 500): {result.stdout.strip()[:500]}"
        elif result.returncode == 0:
            return "FAIL", f"view-session for {timestamp} returned empty output"
        else:
            return "FAIL", f"Exit code {result.returncode}\nstderr: {result.stderr.strip()[:300]}"
    except subprocess.TimeoutExpired:
        return "FAIL", f"view-session for {timestamp} timed out after 10s"
    except Exception as e:
        return "FAIL", f"Exception: {e}"


def probe_session_backfill() -> tuple[str, str]:
    """Stage 13: Check backfill-sessions runs without errors."""
    cmd = [
        sys.executable, str(GRAPHITI_DIR / "graphiti-helper.py"),
        "backfill-sessions"
    ]
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            return "PASS", f"backfill-sessions completed\nstdout: {result.stdout.strip()[:300]}"
        else:
            return "FAIL", f"Exit code {result.returncode}\nstderr: {result.stderr.strip()[:300]}"
    except subprocess.TimeoutExpired:
        return "FAIL", "backfill-sessions timed out after 30s"
    except Exception as e:
        return "FAIL", f"Exception: {e}"


# ============================================================
# MAIN
# ============================================================

def main():
    print("=== GRAPHITI PIPELINE DIAGNOSTIC ===")
    print(f"Timestamp: {ISO_TIMESTAMP}")
    print(f"MCP URL: {MCP_URL}")
    print(f"Health URL: {HEALTH_URL}")

    # Stage 1: Docker
    status, output = probe_docker()
    record(1, "Docker Containers", status, output)

    # Stage 2: Neo4j
    status, output = probe_neo4j()
    record(2, "Neo4j Connectivity", status, output)

    # Stage 3: Graphiti health
    status, output = probe_graphiti_health()
    record(3, "Graphiti API Health", status, output)

    # Create shared HTTP client for MCP stages
    client = httpx.Client(timeout=30.0)
    session_id = None

    try:
        # Stage 4: MCP session init
        session_id, status, output = probe_mcp_session(client)
        record(4, "MCP Session Init", status, output)

        # Stage 5: MCP write (global)
        status, output = probe_mcp_write(client, session_id)
        record(5, "MCP Write (global scope)", status, output)

        # Stage 6: MCP read (global)
        status, output = probe_mcp_read(client, session_id)
        record(6, "MCP Read (global scope)", status, output)

        # Detect project name for stages 7-8 and 10
        project_name = detect_project()
        print(f"\n[Detected project name: {project_name!r}]")

        # Stage 7: Project scope write
        status, output = probe_project_scope_write(client, session_id, project_name)
        record(7, "MCP Write (project scope)", status, output)

        # Stage 8: Project scope read
        status, output = probe_project_scope_read(client, session_id, project_name)
        record(8, "MCP Read (project scope)", status, output)

    finally:
        client.close()

    # Stage 9: graphiti-helper.py add-episode (subprocess, stderr visible)
    status, output = probe_helper_add_episode(project_name if 'project_name' in dir() else "unknown")
    record(9, "graphiti-helper.py add-episode (stderr visible)", status, output)

    # Stage 10: Hook simulation (exact hook command, stderr visible, no &)
    status, output = probe_hook_simulation(project_name if 'project_name' in dir() else "unknown")
    record(10, "Hook Simulation (capture-change.sh pattern, stderr visible)", status, output)

    # Stage 11: Session List
    status, output = probe_session_list()
    record(11, "Session List (list-sessions --json --all)", status, output)

    # Stage 12: Session View
    sessions_data = None
    if status == "PASS":
        try:
            sessions_data = json.loads(subprocess.run(
                [sys.executable, str(GRAPHITI_DIR / "graphiti-helper.py"), "list-sessions", "--json", "--all"],
                capture_output=True, text=True, timeout=10
            ).stdout)
        except Exception:
            sessions_data = []
    status, output = probe_session_view(sessions_data or [])
    record(12, "Session View (view-session)", status, output)

    # Stage 13: Session Backfill
    status, output = probe_session_backfill()
    record(13, "Session Backfill (backfill-sessions)", status, output)

    # --- SUMMARY ---
    passed = sum(1 for _, _, s, _ in results if s == "PASS")
    failed = len(results) - passed
    first_failure = next(((n, name) for n, name, s, _ in results if s != "PASS"), None)

    print("\n=== SUMMARY ===")
    print(f"Passed: {passed}/{len(results)}")
    print(f"Failed: {failed}/{len(results)}")
    if first_failure:
        print(f"First failure: Stage {first_failure[0]} — {first_failure[1]}")
    else:
        print("First failure: None — all stages passed")

    # --- EVIDENCE FOR ROOT CAUSE ---
    print("\n=== EVIDENCE FOR ROOT CAUSE ===")
    failed_stages = [(n, name, output) for n, name, status, output in results if status != "PASS"]
    if not failed_stages:
        print("No failures detected — all pipeline stages are functioning correctly.")
        print("If hooks are still not storing memories, the issue may be timing/race conditions")
        print("from the fire-and-forget (&) pattern, not a connectivity failure.")
    else:
        for stage_num, stage_name, output in failed_stages:
            print(f"\nStage {stage_num} — {stage_name}:")
            print(output)

    # --- FULL OUTPUT SUMMARY TABLE ---
    print("\n=== STAGE RESULTS TABLE ===")
    for n, name, status, _ in results:
        marker = "PASS" if status == "PASS" else "FAIL"
        print(f"  Stage {n:2d}: [{marker}] {name}")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

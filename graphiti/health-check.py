#!/usr/bin/env python3
"""
health-check.py — Graphiti memory pipeline health check.

Tests each stage of the memory pipeline from Docker through MCP canary write/read,
giving a clear pass/fail report for every component.

Usage:
    ~/.claude/graphiti/.venv/bin/python3 ~/.claude/graphiti/health-check.py
    ~/.claude/graphiti/.venv/bin/python3 ~/.claude/graphiti/health-check.py --json
    ~/.claude/graphiti/.venv/bin/python3 ~/.claude/graphiti/health-check.py --verbose
    ~/.claude/graphiti/hooks/health-check.sh [--json] [--verbose]
"""

import argparse
import json
import os
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import httpx

# --- Configuration (mirrors graphiti-helper.py) ---

GRAPHITI_DIR = Path(__file__).parent
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

ISO_TIMESTAMP = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# Status label constants
OK = "OK"
FAIL = "FAIL"
WARN = "WARN"
SKIP = "SKIP"


# --- MCP session helpers (inline to avoid import side effects) ---

def mcp_initialize(client: httpx.Client, verbose: bool = False) -> tuple:
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
                    "clientInfo": {"name": "health-check", "version": "1.0.0"}
                },
                "id": 1
            },
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream"
            }
        )
        session_id = resp.headers.get("mcp-session-id")

        if verbose:
            log = f"HTTP {resp.status_code}\nHeaders: mcp-session-id={session_id}\nBody (first 500): {resp.text[:500]}"
        else:
            log = f"session_id={session_id[:8]}..." if session_id else "no session_id in response"

        if session_id:
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
    except httpx.ConnectError as e:
        return None, f"httpx.ConnectError — connection refused: {e}"
    except httpx.TimeoutException:
        return None, "Timeout waiting for MCP session initialization"
    except Exception as e:
        return None, f"Exception: {e}"


def mcp_call_tool(client: httpx.Client, session_id, tool_name: str, arguments: dict, verbose: bool = False) -> tuple:
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

        content_type = resp.headers.get("content-type", "")
        if "text/event-stream" in content_type:
            parsed = parse_sse(resp.text)
        else:
            try:
                parsed = resp.json()
            except Exception:
                parsed = {"error": f"Unexpected response: {resp.status_code} {resp.text[:200]}"}

        if verbose:
            log = f"HTTP {resp.status_code}\nBody: {resp.text[:1000]}"
        else:
            log = f"HTTP {resp.status_code}"

        return parsed, log
    except httpx.ConnectError as e:
        return {"error": f"httpx.ConnectError — connection refused: {e}"}, str(e)
    except httpx.TimeoutException as e:
        return {"error": f"Timeout calling {tool_name}"}, str(e)
    except Exception as e:
        return {"error": str(e)}, str(e)


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


def extract_result_text(parsed: dict) -> str:
    """Extract the inner result text from a tool call response."""
    try:
        content = parsed.get("result", {}).get("content", [])
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text = item.get("text", "")
                try:
                    return json.loads(text).get("message", text)
                except Exception:
                    return text
    except Exception:
        pass
    return json.dumps(parsed)[:200]


# --- Health check stages ---

def check_docker(verbose: bool = False) -> tuple:
    """Stage 1: Docker containers graphiti-neo4j and graphiti-mcp running."""
    try:
        result = subprocess.run(
            ["docker", "ps", "--filter", "name=graphiti", "--format", "{{.Names}} {{.Status}}"],
            capture_output=True, text=True, timeout=10
        )
        output = result.stdout.strip()

        if not output:
            return FAIL, "No graphiti containers found — are the containers started?", output

        neo4j_up = any("graphiti-neo4j" in line and "Up" in line for line in output.splitlines())
        mcp_up = any("graphiti-mcp" in line and "Up" in line for line in output.splitlines())

        if neo4j_up and mcp_up:
            # Build compact status
            statuses = []
            for line in output.splitlines():
                parts = line.split(" ", 1)
                name = parts[0]
                status_str = parts[1] if len(parts) > 1 else "unknown"
                # Extract short status like "Up 11 days (healthy)"
                statuses.append(f"{name} ({status_str.split('(')[1].rstrip(')') if '(' in status_str else status_str.split()[0]})")
            detail = ", ".join(statuses)
            return OK, detail, output
        else:
            issues = []
            if not neo4j_up:
                issues.append("graphiti-neo4j not running or not healthy")
            if not mcp_up:
                issues.append("graphiti-mcp not running or not healthy")
            return FAIL, "; ".join(issues), output

    except FileNotFoundError:
        return FAIL, "docker not found in PATH", ""
    except subprocess.TimeoutExpired:
        return FAIL, "docker ps timed out after 10s", ""
    except Exception as e:
        return FAIL, f"Exception: {e}", ""


def check_neo4j(verbose: bool = False) -> tuple:
    """Stage 2: Neo4j HTTP reachable on localhost:7475."""
    try:
        resp = httpx.get("http://localhost:7475", timeout=5.0)
        detail = f"HTTP reachable on port 7475"
        if verbose:
            detail += f" (HTTP {resp.status_code})"
        return OK, detail, resp.text[:200]
    except httpx.ConnectError as e:
        return FAIL, f"Connection refused at localhost:7475 — {e}", ""
    except httpx.TimeoutException:
        return FAIL, "Timeout connecting to localhost:7475", ""
    except Exception as e:
        return FAIL, f"Exception: {e}", ""


def check_graphiti_api(verbose: bool = False) -> tuple:
    """Stage 3: Graphiti health endpoint at localhost:8100/health."""
    try:
        resp = httpx.get(HEALTH_URL, timeout=5.0)
        if resp.status_code == 200:
            detail = "healthy"
            if verbose:
                detail += f" — {resp.text[:200]}"
            return OK, detail, resp.text[:200]
        else:
            return FAIL, f"HTTP {resp.status_code} — {resp.text[:200]}", resp.text[:200]
    except httpx.ConnectError as e:
        return FAIL, f"Connection refused at {HEALTH_URL} — {e}", ""
    except httpx.TimeoutException:
        return FAIL, f"Timeout connecting to {HEALTH_URL}", ""
    except Exception as e:
        return FAIL, f"Exception: {e}", ""


def check_mcp_session(client: httpx.Client, verbose: bool = False) -> tuple:
    """Stage 4: MCP session initialization succeeds."""
    session_id, log = mcp_initialize(client, verbose=verbose)
    if session_id:
        detail = f"initialized (session_id: {session_id[:8]}...)"
        return OK, detail, session_id, log
    else:
        return FAIL, log, None, log


def check_env_vars(verbose: bool = False) -> tuple:
    """Stage 5: Required environment variables are set."""
    required = ["OPENROUTER_API_KEY", "NEO4J_PASSWORD"]
    missing = []
    present = []

    for var in required:
        val = os.environ.get(var, "")
        if val:
            present.append(f"{var} set")
        else:
            missing.append(f"{var} missing")

    if missing:
        return FAIL, "; ".join(missing + present), ""
    else:
        return OK, ", ".join(present), ""


def check_canary_roundtrip(client: httpx.Client, session_id, verbose: bool = False) -> tuple:
    """Stage 6: Write a canary episode and read it back."""
    canary_id = f"diag-canary-{str(uuid.uuid4())[:8]}"
    canary_body = f"Health check canary: {canary_id} at {ISO_TIMESTAMP}"

    # Write
    write_args = {
        "name": "health-check",
        "episode_body": canary_body,
        "group_id": "global",
        "source": "text",
        "source_description": "health-check"
    }
    parsed_write, log_write = mcp_call_tool(client, session_id, "add_memory", write_args, verbose=verbose)

    if "error" in parsed_write and not parsed_write.get("result"):
        err = parsed_write.get("error", "unknown error")
        return FAIL, f"write failed — {err}", f"Write error: {err}\n{log_write}"

    # Check write response for error indicator
    write_text = extract_result_text(parsed_write)
    if verbose:
        write_detail = f"Write response: {write_text}"
    else:
        write_detail = "write succeeded"

    # Wait for Graphiti to process (entity extraction is async)
    time.sleep(2)

    # Read back
    read_args = {
        "query": f"health check canary {canary_id}",
        "group_ids": ["global"],
        "max_facts": 3
    }
    parsed_read, log_read = mcp_call_tool(client, session_id, "search_memory_facts", read_args, verbose=verbose)

    if "error" in parsed_read and not parsed_read.get("result"):
        err = parsed_read.get("error", "unknown error")
        return FAIL, f"write succeeded but read failed — {err}", f"{write_detail}\nRead error: {err}\n{log_read}"

    # Check if canary appears in results
    read_text = json.dumps(parsed_read)
    canary_found = canary_id in read_text

    if verbose:
        read_detail = f"Read response: {read_text[:500]}"
    else:
        read_detail = ""

    if canary_found:
        detail = f"write succeeded, read found canary {canary_id}"
        return OK, detail, f"{write_detail}\n{read_detail}".strip()
    else:
        detail = f"write succeeded but read returned empty (canary {canary_id} not found — server may need more time for indexing, or scope override is active)"
        return WARN, detail, f"{write_detail}\n{read_detail}".strip()


# --- Main runner ---

def run_health_check(verbose: bool = False) -> dict:
    """Run all health checks and return results dict."""
    checks = {}
    skipped_reason = None

    # Stage 1: Docker
    status, detail, raw = check_docker(verbose=verbose)
    checks["docker"] = {"status": status, "detail": detail, "raw": raw, "name": "Docker"}
    if status == FAIL:
        skipped_reason = "Docker"

    # Stage 2: Neo4j (skip if docker failed)
    if skipped_reason:
        checks["neo4j"] = {"status": SKIP, "detail": f"(skipped — {skipped_reason} failed)", "raw": "", "name": "Neo4j"}
    else:
        status, detail, raw = check_neo4j(verbose=verbose)
        checks["neo4j"] = {"status": status, "detail": detail, "raw": raw, "name": "Neo4j"}
        if status == FAIL:
            skipped_reason = "Neo4j"

    # Stage 3: Graphiti API (skip if neo4j failed)
    if skipped_reason:
        checks["graphiti_api"] = {"status": SKIP, "detail": f"(skipped — {skipped_reason} failed)", "raw": "", "name": "Graphiti API"}
    else:
        status, detail, raw = check_graphiti_api(verbose=verbose)
        checks["graphiti_api"] = {"status": status, "detail": detail, "raw": raw, "name": "Graphiti API"}
        if status == FAIL:
            skipped_reason = "Graphiti API"

    # MCP client for remaining stages
    client = httpx.Client(timeout=30.0)
    session_id = None

    try:
        # Stage 4: MCP Session (skip if API failed)
        if skipped_reason:
            checks["mcp_session"] = {"status": SKIP, "detail": f"(skipped — {skipped_reason} failed)", "raw": "", "name": "MCP Session"}
        else:
            result = check_mcp_session(client, verbose=verbose)
            if result[0] == OK:
                status, detail, session_id, raw = result
            else:
                status, detail, _, raw = result
            checks["mcp_session"] = {"status": status, "detail": detail, "raw": raw, "name": "MCP Session"}
            if status == FAIL:
                skipped_reason = "MCP Session"

        # Stage 5: Environment (independent of MCP — always run)
        status, detail, raw = check_env_vars(verbose=verbose)
        checks["env_vars"] = {"status": status, "detail": detail, "raw": raw, "name": "Environment"}

        # Stage 6: Canary round-trip (skip if MCP session failed)
        if skipped_reason and skipped_reason != "Graphiti API":
            # If MCP session specifically failed, skip canary
            if "MCP Session" in (skipped_reason or ""):
                checks["canary"] = {"status": SKIP, "detail": "(skipped — MCP session failed)", "raw": "", "name": "Canary round-trip"}
            elif skipped_reason:
                checks["canary"] = {"status": SKIP, "detail": f"(skipped — {skipped_reason} failed)", "raw": "", "name": "Canary round-trip"}
        else:
            if session_id is None:
                checks["canary"] = {"status": SKIP, "detail": "(skipped — no MCP session)", "raw": "", "name": "Canary round-trip"}
            else:
                status, detail, raw = check_canary_roundtrip(client, session_id, verbose=verbose)
                checks["canary"] = {"status": status, "detail": detail, "raw": raw, "name": "Canary round-trip"}

    finally:
        client.close()

    return checks


def format_status_label(status: str) -> str:
    """Format status label padded for alignment."""
    return f"[{status:<4}]"


def print_human_report(checks: dict, timestamp: str):
    """Print the human-readable health check report."""
    print("=== Graphiti Memory Pipeline Health Check ===")
    print(f"Timestamp: {timestamp}")
    print()

    order = ["docker", "neo4j", "graphiti_api", "mcp_session", "env_vars", "canary"]
    labels = {
        "docker": "Docker",
        "neo4j": "Neo4j",
        "graphiti_api": "Graphiti API",
        "mcp_session": "MCP Session",
        "env_vars": "Environment",
        "canary": "Canary round-trip"
    }

    passed = 0
    total = len(order)
    first_failure = None

    for key in order:
        check = checks.get(key, {"status": SKIP, "detail": "(not run)", "name": labels.get(key, key)})
        status = check["status"]
        detail = check["detail"]
        label = format_status_label(status)
        name = labels.get(key, check.get("name", key))

        print(f"{label}  {name}: {detail}")

        if status == OK:
            passed += 1
        elif status == WARN:
            passed += 1  # WARN counts as partial pass for summary
        elif status == SKIP:
            total -= 1  # Skipped stages don't count against total
        elif status == FAIL and first_failure is None:
            first_failure = name

    print()
    if first_failure:
        print(f"Result: {passed}/{total} checks passed — pipeline UNHEALTHY")
        print(f"First failure: {first_failure}")
        return False
    else:
        warn_count = sum(1 for k in order if checks.get(k, {}).get("status") == WARN)
        if warn_count > 0:
            print(f"Result: {passed}/{total} checks passed — pipeline DEGRADED (warnings present)")
        else:
            print(f"Result: {passed}/{total} checks passed — pipeline healthy")
        return True


def print_json_report(checks: dict, timestamp: str) -> bool:
    """Print JSON report and return pass/fail status."""
    order = ["docker", "neo4j", "graphiti_api", "mcp_session", "env_vars", "canary"]

    stages = {}
    passed = 0
    failed = 0
    warned = 0
    skipped = 0

    for key in order:
        check = checks.get(key, {"status": SKIP, "detail": "(not run)", "name": key})
        status = check["status"]
        stages[key] = {
            "name": check.get("name", key),
            "status": status,
            "detail": check["detail"]
        }
        if status == OK:
            passed += 1
        elif status == WARN:
            warned += 1
        elif status == FAIL:
            failed += 1
        elif status == SKIP:
            skipped += 1

    healthy = failed == 0
    output = {
        "timestamp": timestamp,
        "healthy": healthy,
        "summary": {
            "passed": passed,
            "warned": warned,
            "failed": failed,
            "skipped": skipped,
            "total": passed + warned + failed
        },
        "stages": stages
    }

    print(json.dumps(output, indent=2))
    return healthy


def main():
    parser = argparse.ArgumentParser(
        description="Graphiti memory pipeline health check",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Human-readable report
  ~/.claude/graphiti/.venv/bin/python3 ~/.claude/graphiti/health-check.py

  # JSON output for programmatic consumption
  ~/.claude/graphiti/.venv/bin/python3 ~/.claude/graphiti/health-check.py --json

  # Include full HTTP response bodies
  ~/.claude/graphiti/.venv/bin/python3 ~/.claude/graphiti/health-check.py --verbose

  # Via shell wrapper
  ~/.claude/graphiti/hooks/health-check.sh [--json] [--verbose]
"""
    )
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    parser.add_argument("--verbose", action="store_true", help="Include full HTTP response bodies")
    args = parser.parse_args()

    checks = run_health_check(verbose=args.verbose)

    if args.json:
        healthy = print_json_report(checks, ISO_TIMESTAMP)
    else:
        healthy = print_human_report(checks, ISO_TIMESTAMP)

    sys.exit(0 if healthy else 1)


if __name__ == "__main__":
    main()

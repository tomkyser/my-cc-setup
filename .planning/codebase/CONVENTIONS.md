# Coding Conventions

**Analysis Date:** 2026-03-16

## Naming Patterns

**Files:**
- Bash hooks: kebab-case with descriptive purpose (e.g., `prompt-augment.sh`, `session-start.sh`)
- Python modules: snake_case (e.g., `graphiti-helper.py`)
- Configuration: yaml format with hyphenated keys (e.g., `config.yaml`, `prompts.yaml`)
- Template files: `.template` suffix (e.g., `CLAUDE.md.template`)

**Functions:**
- Python: snake_case with descriptive names (e.g., `cmd_health_check`, `curate_results`, `summarize_text`)
- Bash: snake_case functions prefixed with context (e.g., `cmd_detect_project`, `_extract_content`)
- Private helpers: leading underscore convention (e.g., `_parse_sse`, `_extract_content`)

**Variables:**
- Bash: UPPERCASE for constants/exports (e.g., `MCP_URL`, `HELPER`, `PROJECT`, `SCOPE`)
- Bash: lowercase for local temporaries (e.g., `resp`, `results`, `project`)
- Python: UPPERCASE for module constants (e.g., `MCP_URL`, `HEALTH_URL`, `CURATION_MODEL`)
- Python: lowercase for function parameters and local variables

**Types:**
- Python: Full type hints in function signatures (e.g., `def call_tool(self, tool_name: str, arguments: dict) -> dict`)
- Dictionary keys: lowercase with underscores in JSON/YAML (e.g., `group_ids`, `max_facts`, `api_key`)

## Code Style

**Formatting:**
- **Python**: PEP 8 style - 4-space indentation, max line length reasonable
- **Bash**: 2-4 space indentation, consistent quoting of variables
- No automatic formatter configured; style enforced by review

**Linting:**
- Not detected - no eslintrc, prettierrc, or flake8 config present
- Code appears hand-written to consistent style without automated enforcement

## Import Organization

**Order (Python):**
1. Standard library: `import argparse`, `import json`, `import os`, `import subprocess`, `import sys`, `import uuid`
2. Standard library path utilities: `from pathlib import Path`
3. Third-party packages: `import httpx`, `import yaml`
4. Relative imports: N/A in this codebase

**Path Aliases:**
- No path aliases detected; all imports use full module names
- Environment variable lookups for configuration (e.g., `os.environ.get("GRAPHITI_MCP_URL", "http://localhost:8100/mcp")`)

## Error Handling

**Patterns:**
- Python: Bare `except Exception:` blocks that fail silently (graceful degradation pattern) in functions like `curate_results()`, `summarize_text()`, `cmd_search()`
- Bash: `set -uo pipefail` at script start for strict error handling; individual commands often piped with `2>/dev/null` to suppress error output
- Health checks fail silently: if Graphiti server is down, hooks exit cleanly with `exit 0` rather than crashing
- API response validation: check `resp.status_code == 200` before parsing JSON
- MCP response parsing: check for "error" key before using "result" key (see `_extract_content` in `graphiti-helper.py`)

**Error messages:**
- Python: Print errors to stderr: `print(f"Error: {msg}", file=sys.stderr)`
- Bash: Errors suppressed with `2>/dev/null` in hooks to prevent context pollution; important errors logged via stdout
- Critical errors in install.sh: use `{ echo "ERROR: ..."; exit 1; }`

## Logging

**Framework:** Standard output (stdout) for informational messages, stderr for errors

**Patterns:**
- Install script logs progress: `echo "=== Graphiti Memory System Installer ==="`
- Hooks output structured messages: `echo "[GRAPHITI MEMORY CONTEXT]"`, `echo "[RELEVANT MEMORY]"`, `echo "[PRESERVED CONTEXT]"`
- Python helper scripts return results or errors via stdout/stderr
- No structured logging library used; plain text messages only

## Comments

**When to Comment:**
- Shebang on every script: `#!/usr/bin/env bash`, `#!/usr/bin/env python3`
- Purpose header at top of each file with usage examples (see `graphiti-helper.py` header)
- Inline comments explaining non-obvious logic, especially in bash where syntax is cryptic

**JSDoc/TSDoc:**
- Not applicable - Python and Bash codebase
- Python docstrings used in class docstring format: `"""Lightweight MCP client for Graphiti's streamable HTTP transport."""`
- Docstrings for classes and public methods only

**Example from `graphiti-helper.py` line 57-58:**
```python
class MCPClient:
    """Lightweight MCP client for Graphiti's streamable HTTP transport."""
```

## Function Design

**Size:** Functions are small and focused, typically 10-20 lines

**Parameters:**
- Python: Explicit parameter names with defaults (e.g., `def cmd_search(query: str, scope: str = "global", limit: int = 10, curate: str = None)`)
- Bash: Positional parameters with optional flags (e.g., `cmd_detect_project(cwd: str = None)` equivalent)
- Use keyword arguments for configuration to avoid positional ambiguity

**Return Values:**
- Python: Explicit return types (e.g., `-> dict`, `-> str`)
- Functions return results directly: dicts for structured data, strings for text
- Exit codes in bash: 0 for success, 1 for error (explicit `sys.exit(0)`, `sys.exit(1)`)
- Successful Bash functions output results to stdout; failures exit with non-zero code

**Example from `graphiti-helper.py` lines 137-153:**
```python
def curate_results(memories: str, context: str, prompt_key: str = "curate_prompt_context",
                   project_name: str = "unknown", session_type: str = "startup") -> str:
    """Filter search results through Haiku for relevance."""
    if not OPENROUTER_API_KEY:
        return memories
```

## Module Design

**Exports:**
- Python: Class at module level (`MCPClient`) used as main export
- Functions organized by category (MCP client, curation, commands, helpers)
- No explicit `__all__` definition; all functions used as needed

**Barrel Files:**
- Not applicable; single-file Python modules only

## Bash Script Structure

**Standard template observed:**
1. Shebang: `#!/usr/bin/env bash`
2. Comments: purpose and usage
3. Settings: `set -euo pipefail` or `set -uo pipefail` (strict mode)
4. Variable setup: read from input, set local vars
5. Health check: Graphiti server availability
6. Business logic: search/detect/summarize operations
7. Exit: `exit 0` (graceful)

**Example structure from `prompt-augment.sh` lines 1-42:**
```bash
#!/usr/bin/env bash
# purpose comment
set -uo pipefail

HELPER="..."      # Constants in UPPERCASE
INPUT=$(cat)      # Read from stdin
PROMPT=$(...)     # Derived variables

# Guard clauses
if [ condition ]; then
  exit 0
fi

# Main logic
RESULTS=$($HELPER search --query "$PROMPT" ...)

# Output
echo "[STRUCTURED MARKER]"
echo "$RESULTS"

exit 0
```

## Python Script Structure

**Standard patterns observed:**
1. Module docstring at top with usage examples
2. Configuration block: environment variables and file loading
3. Class definitions (e.g., `MCPClient`)
4. Helper functions (prefixed with `_` if private)
5. Command functions (prefixed with `cmd_`)
6. Main function with argparse
7. Entry point guard: `if __name__ == "__main__"`

**Example from `graphiti-helper.py` lines 395-438:**
```python
def main():
    parser = argparse.ArgumentParser(description="...")
    subparsers = parser.add_subparsers(dest="command", help="...")

    sp = subparsers.add_parser("search", help="...")
    sp.add_argument("--query", required=True, help="...")

    args = parser.parse_args()

    if args.command == "health-check":
        cmd_health_check()
    # ... other commands
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
```

## Configuration Patterns

**Environment variables:**
- Configuration read from environment first, then fallback to `.env` file (see `graphiti-helper.py` lines 25-45)
- Variables always have defaults using `os.environ.get(key, default_value)`
- Example: `MCP_URL = os.environ.get("GRAPHITI_MCP_URL", "http://localhost:8100/mcp")`

**YAML configuration:**
- `config.yaml`: Hierarchical structure with environment variable substitution (e.g., `${OPENAI_API_KEY}`)
- `prompts.yaml`: Dictionary of prompt templates with `system` and `user` keys

**JSON parsing:**
- Bash uses `jq` for JSON extraction: `echo "$INPUT" | jq -r '.field // default'`
- Python uses `json.loads()` for parsing

## Shell Script Best Practices

**Strict mode:** Scripts use `set -uo pipefail` (understand pipeline failures, no unset variables) to catch errors early

**Quoting:** Variables quoted with double quotes for safety: `"$HELPER"`, `"$PROJECT"`, `"$CWD"`

**Input handling:** Read from stdin with `$(cat)` and pipe to `jq` for field extraction

**Error suppression:** Commands append `2>/dev/null` to suppress errors in hooks (graceful degradation)

**Background execution:** Long-running or non-blocking operations backgrounded with `&` suffix (e.g., in `capture-change.sh`, `session-summary.sh`)

---

*Convention analysis: 2026-03-16*

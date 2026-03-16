# Testing Patterns

**Analysis Date:** 2026-03-16

## Test Framework

**Runner:**
- Not detected - no jest.config.js, vitest.config.js, pytest.ini, or equivalent test config present

**Assertion Library:**
- Not detected - no test files present in codebase

**Run Commands:**
```bash
# No test scripts configured
# Run commands would be: python -m pytest, pytest, or python -m unittest
```

## Test File Organization

**Location:**
- Not applicable - no tests found in codebase

**Naming:**
- Pattern would follow: `test_*.py` or `*_test.py` for Python (convention)
- Pattern would follow: `*.test.sh` or `*.spec.sh` for Bash (if implemented)

**Structure:**
```
[Not present in current codebase]
```

## Test Coverage Status

**Current State:**
- **No automated tests present** in the codebase
- Code is manually tested through integration with Claude Code hooks and MCP interactions
- Testing appears to be **manual and operational** rather than automated unit/integration tests

**Critical Components Without Tests:**
- `MCPClient` class: MCP protocol handling, session initialization, tool invocation
- `curate_results()`: Haiku API calls and LLM-based filtering
- `summarize_text()`: Session summarization via Haiku
- `cmd_detect_project()`: Multiple project detection strategies (git, package.json, composer.json, pyproject.toml, .ddev)
- `cmd_search()`: Graphiti fact and node searching with curation
- Hook scripts: All bash hooks (`prompt-augment.sh`, `session-start.sh`, etc.) - purely operational

## Testing Strategy Recommendations

**Unit Test Scope (Python - `graphiti-helper.py`):**

1. **MCPClient initialization and session management:**
   - Test `_initialize()` with mocked HTTP responses
   - Test MCP session ID extraction from headers and SSE
   - Test timeout behavior on slow/non-responsive endpoints

2. **MCPClient.call_tool():**
   - Test successful tool calls with JSON-RPC responses
   - Test SSE response parsing (`_parse_sse()`)
   - Test error response handling
   - Test header management with/without session ID

3. **Curation functions:**
   - Test `curate_results()` with/without OPENROUTER_API_KEY
   - Mock OpenRouter API responses
   - Test fallback behavior when API calls fail
   - Test prompt template substitution (`.format()` calls)

4. **Project detection:**
   - Test `cmd_detect_project()` with mocked filesystem and subprocess calls
   - Test detection priority: git remote → package.json → composer.json → pyproject.toml → .ddev → directory name
   - Test edge cases: missing files, invalid JSON/YAML, git command failures

5. **Search and add-episode:**
   - Test `cmd_search()` MCP calls and result extraction
   - Test fact/node search combination
   - Test curation triggering based on `curate` parameter
   - Test `cmd_add_episode()` episode creation with various scopes

6. **Configuration loading:**
   - Test environment variable reading with defaults
   - Test .env file parsing when environment vars not set
   - Test YAML prompt file loading

**Bash Script Testing (Integration tests):**

1. **Hook behavior with server up/down:**
   - Test health-check success/failure handling
   - Test graceful degradation when Graphiti offline
   - Verify exit codes (always 0 for hooks to not break Claude Code)

2. **Input/output handling:**
   - Test jq field extraction with various input formats
   - Test handling of missing fields (using `// default` fallback)
   - Test output formatting and structured markers

3. **Project detection in hooks:**
   - Test `detect-project` integration in `prompt-augment.sh` and `session-start.sh`
   - Verify scope selection (global vs project:name)

**Integration Test Scope:**

1. **End-to-end hook execution:**
   - Start Graphiti server
   - Simulate Claude Code hook invocations with various inputs
   - Verify Graphiti knowledge graph state changes

2. **MCP communication:**
   - Test HTTP client against real Graphiti MCP server
   - Verify session management persists across multiple calls
   - Test streaming response handling

## Suggested Test Structure (Python)

```python
# tests/test_mcp_client.py
import pytest
from unittest.mock import Mock, patch, MagicMock
from graphiti_helper import MCPClient

class TestMCPClient:
    """Test MCPClient HTTP communication."""

    @patch('httpx.Client')
    def test_initialize_creates_session(self, mock_client_class):
        """Test MCP initialization extracts session ID."""
        mock_response = Mock()
        mock_response.headers = {"mcp-session-id": "session-123"}
        mock_client_class.return_value.post.return_value = mock_response

        client = MCPClient("http://localhost:8100/mcp")
        client._initialize()

        assert client.session_id == "session-123"

    @patch('httpx.Client')
    def test_call_tool_with_valid_response(self, mock_client_class):
        """Test tool call with successful JSON-RPC response."""
        mock_response = Mock()
        mock_response.headers = {"content-type": "application/json"}
        mock_response.json.return_value = {"result": {"content": [{"type": "text", "text": "result"}]}}
        mock_client_class.return_value.post.return_value = mock_response

        client = MCPClient("http://localhost:8100/mcp")
        result = client.call_tool("search_memory_facts", {"query": "test"})

        assert "result" in result

    @patch('httpx.Client')
    def test_parse_sse_extracts_json_rpc(self, mock_client_class):
        """Test SSE response parsing."""
        sse_response = """data: {"result": {"content": [{"type": "text", "text": "data"}]}}"""
        client = MCPClient("http://localhost:8100/mcp")
        result = client._parse_sse(sse_response)

        assert result["result"]["content"][0]["text"] == "data"

# tests/test_curation.py
class TestCuration:
    """Test Haiku curation pipeline."""

    @patch('httpx.post')
    def test_curate_results_filters_memories(self, mock_post):
        """Test Haiku filtering of search results."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "Filtered result"}}]
        }
        mock_post.return_value = mock_response

        result = curate_results(
            memories="Item 1\nItem 2\nItem 3",
            context="Looking for X",
            project_name="myapp"
        )

        assert result == "Filtered result"
        mock_post.assert_called_once()

    def test_curate_results_fallback_without_api_key(self):
        """Test curation falls back to original when no API key."""
        with patch.dict('os.environ', {'OPENROUTER_API_KEY': ''}):
            result = curate_results("Original", "context", project_name="test")
            assert result == "Original"

# tests/test_project_detection.py
class TestProjectDetection:
    """Test auto-detection of project names."""

    @patch('subprocess.run')
    def test_detect_from_git_remote(self, mock_run):
        """Test detection from git remote URL."""
        mock_run.return_value = Mock(returncode=0, stdout="https://github.com/user/my-project.git\n")

        name = cmd_detect_project()

        assert name == "my-project"

    @patch('pathlib.Path.exists')
    @patch('pathlib.Path.read_text')
    def test_detect_from_package_json(self, mock_read, mock_exists):
        """Test detection from package.json name."""
        mock_exists.side_effect = [False, True]  # git fails, package.json exists
        mock_read.return_value = '{"name": "my-app"}'

        name = cmd_detect_project()

        assert name == "my-app"

# tests/test_bash_hooks.py (using bats framework or similar)
# Not included here but would test:
# - Hook input/output handling
# - jq field extraction
# - Scope selection logic
# - Background job handling (&)
```

## Testing Approach Going Forward

**Manual Testing (Current):**
- Hooks tested by running Claude Code sessions and observing memory context injection
- MCP client tested by invoking tools from Claude Code and checking Graphiti state
- API integration tested with live Graphiti server and OpenRouter API

**Recommended Additions:**

1. **Add pytest unit tests** for Python `graphiti-helper.py`:
   - Mock external HTTP calls (OpenRouter, Graphiti)
   - Isolate configuration loading
   - Test error handling paths
   - Target: 70%+ coverage of Python module

2. **Add bats (Bash Testing) for hooks:**
   - Mock `jq`, `$HELPER` calls
   - Verify output formatting
   - Test conditional logic (health checks, empty results)

3. **Integration tests with Docker:**
   - Bring up test Graphiti instance
   - Execute hooks with test inputs
   - Verify knowledge graph state

4. **CI/CD setup:**
   - Run tests on every commit
   - Test matrix: Python 3.11+, Bash 4.0+
   - Fail on uncaught errors in critical paths

## Areas Currently at Risk (No Tests)

1. **MCP protocol compliance** - relies on manual testing with Claude Code
2. **Haiku curation quality** - no regression tests for prompt effectiveness
3. **Project detection edge cases** - untested for unusual git setups, broken manifests
4. **Hook output format** - no validation that output is properly structured
5. **Concurrency** - backgrounded hooks (`&`) not tested for race conditions
6. **Graceful degradation** - error paths not systematically tested

---

*Testing analysis: 2026-03-16*

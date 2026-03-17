#!/usr/bin/env bash
# session-summary.sh — Summarize and store session in Graphiti on Stop
set -uo pipefail

HELPER="$HOME/.claude/graphiti/.venv/bin/python3 $HOME/.claude/graphiti/graphiti-helper.py"
LOG_FILE="$HOME/.claude/graphiti/hook-errors.log"
HOOK_NAME="session-summary"

# Rotate log if > 1MB
if [ -f "$LOG_FILE" ] && [ "$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)" -gt 1048576 ]; then
  mv "$LOG_FILE" "${LOG_FILE}.old"
fi

log_error() {
  local msg="$1"
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [$HOOK_NAME] $msg" >> "$LOG_FILE" 2>/dev/null
  echo "$msg" >&2
}

INPUT=$(cat)

# CRITICAL: Guard against infinite loops
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# Once-per-session health check: warn on first failure, stay silent after
HEALTH_FLAG="/tmp/graphiti-health-warned-${PPID:-$$}"
if ! $HELPER health-check 2>/dev/null; then
  if [ ! -f "$HEALTH_FLAG" ]; then
    echo "[graphiti] Server unreachable — memory hooks disabled for this session" >&2
    touch "$HEALTH_FLAG"
  fi
  exit 0
fi

CWD=$(echo "$INPUT" | jq -r '.cwd // ""')
PROJECT=$($HELPER detect-project ${CWD:+--cwd "$CWD"} 2>/dev/null || echo "unknown")
if [ "$PROJECT" != "unknown" ] && [ "$PROJECT" != "tom.kyser" ]; then
  SCOPE="project-${PROJECT}"
else
  SCOPE="global"
fi
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Generate session summary via Haiku (stderr goes visible, stdout is the summary)
SUMMARY=$(echo "$INPUT" | $HELPER summarize-session || echo "")

if [ -n "$SUMMARY" ]; then
  # Store in project/global scope
  if ! $HELPER add-episode \
    --text "Session summary (${TIMESTAMP}): ${SUMMARY}" \
    --scope "$SCOPE" \
    --source "session-hook"; then
    log_error "Failed to store session summary (scope=$SCOPE)"
  fi

  # Also store in session scope for fine-grained retrieval
  if ! $HELPER add-episode \
    --text "Session summary: ${SUMMARY}" \
    --scope "session-${TIMESTAMP}" \
    --source "session-hook"; then
    log_error "Failed to store session episode (scope=session-${TIMESTAMP})"
  fi
fi

# Generate refined session name from summary
SESSION_NAME=""
if [ -n "$SUMMARY" ]; then
  SESSION_NAME=$($HELPER generate-session-name --text "$SUMMARY" 2>/dev/null || echo "")
fi

# Write session entry to local index with refined name
if ! $HELPER index-session \
    --timestamp "$TIMESTAMP" \
    --project "$PROJECT" \
    --label "$SESSION_NAME" \
    --labeled-by "auto"; then
  log_error "Failed to write session index entry"
fi

exit 0

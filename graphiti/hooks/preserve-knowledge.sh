#!/usr/bin/env bash
# preserve-knowledge.sh — Extract and preserve key knowledge before context compaction
set -uo pipefail

HELPER="$HOME/.claude/graphiti/.venv/bin/python3 $HOME/.claude/graphiti/graphiti-helper.py"
LOG_FILE="$HOME/.claude/graphiti/hook-errors.log"
HOOK_NAME="preserve-knowledge"

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

# Extract key knowledge via Haiku summarization (stderr goes visible, stdout is the summary)
SUMMARY=$(echo "$INPUT" | $HELPER summarize-session || echo "")

if [ -n "$SUMMARY" ]; then
  # Store the extracted knowledge (foreground, with error capture)
  if ! $HELPER add-episode \
    --text "Pre-compaction knowledge extract: ${SUMMARY}" \
    --scope "$SCOPE" \
    --source "precompact-hook"; then
    log_error "Failed to store pre-compaction knowledge (scope=$SCOPE)"
  fi

  # Re-inject critical context so Claude doesn't lose it
  echo "[PRESERVED CONTEXT]"
  echo "$SUMMARY"
fi

exit 0

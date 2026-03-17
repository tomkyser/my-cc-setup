#!/usr/bin/env bash
# capture-change.sh — Store file change episodes in Graphiti (foreground, with error propagation)

set -uo pipefail

HELPER="$HOME/.claude/graphiti/.venv/bin/python3 $HOME/.claude/graphiti/graphiti-helper.py"
LOG_FILE="$HOME/.claude/graphiti/hook-errors.log"
HOOK_NAME="capture-change"

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
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')

# Only process file-editing tools
case "$TOOL_NAME" in
  Write|Edit|MultiEdit) ;;
  *) exit 0 ;;
esac

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // "unknown"')
CWD=$(echo "$INPUT" | jq -r '.cwd // ""')

# Once-per-session health check: warn on first failure, stay silent after
HEALTH_FLAG="/tmp/graphiti-health-warned-${PPID:-$$}"
if ! $HELPER health-check 2>/dev/null; then
  if [ ! -f "$HEALTH_FLAG" ]; then
    echo "[graphiti] Server unreachable — memory hooks disabled for this session" >&2
    touch "$HEALTH_FLAG"
  fi
  exit 0
fi

PROJECT=$($HELPER detect-project ${CWD:+--cwd "$CWD"} 2>/dev/null || echo "unknown")
if [ "$PROJECT" != "unknown" ] && [ "$PROJECT" != "tom.kyser" ]; then
  SCOPE="project-${PROJECT}"
else
  SCOPE="global"
fi

EPISODE_TEXT="File ${TOOL_NAME}: ${FILE_PATH}"

if ! $HELPER add-episode \
  --text "$EPISODE_TEXT" \
  --scope "$SCOPE" \
  --source "change-hook"; then
  log_error "Failed to store episode (scope=$SCOPE, file=$FILE_PATH)"
fi

exit 0

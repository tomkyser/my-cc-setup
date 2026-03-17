#!/usr/bin/env bash
# sync-graphiti.sh -- Sync Graphiti memory system files between live and repo
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LIVE="$HOME/.claude/graphiti"
REPO="$SCRIPT_DIR/graphiti"

# Files and directories to exclude from sync
EXCLUDES=(
  ".env"
  ".env.example"
  ".venv"
  "__pycache__"
  "sessions.json"
  "hook-errors.log"
  "PLAN.md"
  "README.md"
  ".DS_Store"
  "*.pyc"
  ".last-sync"
)

# Sync timestamp file
SYNC_STAMP="$REPO/.last-sync"

usage() {
  echo "Usage: $0 <direction> [--dry-run] [--force]"
  echo ""
  echo "Directions:"
  echo "  live-to-repo   Copy from ~/.claude/graphiti/ to graphiti/"
  echo "  repo-to-live   Copy from graphiti/ to ~/.claude/graphiti/"
  echo "  status         Show which files differ between live and repo"
  echo ""
  echo "Options:"
  echo "  --dry-run      Show what would be copied without copying"
  echo "  --force        Force sync even when both sides have changes (conflict)"
  echo ""
  echo "Excluded from sync: ${EXCLUDES[*]}"
}

# Build rsync exclude args
build_excludes() {
  local args=()
  for excl in "${EXCLUDES[@]}"; do
    args+=(--exclude "$excl")
  done
  echo "${args[@]}"
}

do_status() {
  echo "=== Sync Status ==="
  echo "Live: $LIVE"
  echo "Repo: $REPO"
  echo ""

  if [ -f "$SYNC_STAMP" ]; then
    echo "Last sync: $(cat "$SYNC_STAMP")"
  else
    echo "Last sync: never"
  fi
  echo ""

  # Compare files using rsync dry-run
  echo "Files that differ (live -> repo):"
  rsync -rlcn --delete $(build_excludes) "$LIVE/" "$REPO/" 2>/dev/null | grep -v "^$" || echo "  (none -- in sync)"
  echo ""
  echo "Files that differ (repo -> live):"
  rsync -rlcn --delete $(build_excludes) "$REPO/" "$LIVE/" 2>/dev/null | grep -v "^$" || echo "  (none -- in sync)"
}

# Check for conflicts: both sides changed since last sync
# Returns 0 if no conflict, 1 if conflict detected
check_conflict() {
  local src="$1"
  local dst="$2"

  # Get changes in the requested direction (src -> dst)
  local forward_changes
  forward_changes=$(rsync -rlcn --delete $(build_excludes) "$src/" "$dst/" 2>/dev/null | grep -v "^$" || true)

  # Get changes in the REVERSE direction (dst -> src)
  local reverse_changes
  reverse_changes=$(rsync -rlcn --delete $(build_excludes) "$dst/" "$src/" 2>/dev/null | grep -v "^$" || true)

  if [ -n "$forward_changes" ] && [ -n "$reverse_changes" ]; then
    echo ""
    echo "CONFLICT: Both sides have changes since they diverged."
    echo ""
    echo "--- Changes in source ($src) ---"
    echo "$forward_changes"
    echo ""
    echo "--- Changes in destination ($dst) ---"
    echo "$reverse_changes"
    echo ""
    echo "To proceed, re-run with --force to overwrite the destination."
    echo "To inspect first, run: $0 status"
    return 1
  fi

  return 0
}

do_sync() {
  local src="$1"
  local dst="$2"
  local label="$3"
  local dry_run="${4:-}"
  local force="${5:-}"

  echo "=== Syncing: $label ==="
  echo "From: $src"
  echo "To:   $dst"
  echo ""

  # Conflict detection (per locked decision): check if both sides changed.
  # Skip conflict check on --dry-run (just show what would happen) or --force.
  if [ "$dry_run" != "--dry-run" ] && [ "$force" != "--force" ]; then
    if ! check_conflict "$src" "$dst"; then
      exit 1
    fi
  fi

  local flags="-rlc --delete"
  if [ "$dry_run" = "--dry-run" ]; then
    flags="$flags -n"
    echo "(DRY RUN -- no files will be copied)"
    echo ""
  fi

  rsync $flags $(build_excludes) "$src/" "$dst/" 2>/dev/null

  if [ "$dry_run" != "--dry-run" ]; then
    # Record sync timestamp
    date -u +"%Y-%m-%dT%H:%M:%SZ" > "$SYNC_STAMP"
    echo ""
    echo "Sync complete. Review changes with 'git diff' and commit manually."
  fi
}

# --- Main ---
if [ $# -lt 1 ]; then
  usage
  exit 1
fi

DIRECTION="$1"
shift

# Parse remaining flags
DRY_RUN=""
FORCE=""
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN="--dry-run" ;;
    --force)   FORCE="--force" ;;
    *)         echo "ERROR: Unknown option '$arg'"; usage; exit 1 ;;
  esac
done

case "$DIRECTION" in
  status)
    do_status
    ;;
  live-to-repo)
    do_sync "$LIVE" "$REPO" "live -> repo" "$DRY_RUN" "$FORCE"
    ;;
  repo-to-live)
    do_sync "$REPO" "$LIVE" "repo -> live" "$DRY_RUN" "$FORCE"
    ;;
  *)
    echo "ERROR: Unknown direction '$DIRECTION'"
    usage
    exit 1
    ;;
esac

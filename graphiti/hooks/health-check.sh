#!/usr/bin/env bash
# health-check.sh — Run Graphiti memory pipeline health check
# Usage: ~/.claude/graphiti/hooks/health-check.sh [--json] [--verbose]
exec "$HOME/.claude/graphiti/.venv/bin/python3" "$HOME/.claude/graphiti/health-check.py" "$@"

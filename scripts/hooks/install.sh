#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_PATH_REL="scripts/hooks/git"
HOOKS_PATH_ABS="$REPO_ROOT/$HOOKS_PATH_REL"

mkdir -p "$HOOKS_PATH_ABS"
chmod +x "$HOOKS_PATH_ABS/pre-push"

git config core.hooksPath "$HOOKS_PATH_REL"

echo "[atctl] Configured git hooks path to $HOOKS_PATH_REL"
echo "        Pre-push hook now runs 'node scripts/atctl.mjs check --auto' before every push."
echo "        Set SKIP_ATCTL_CHECK=1 if you need to bypass temporarily."

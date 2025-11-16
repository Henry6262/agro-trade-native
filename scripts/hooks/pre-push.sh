#!/usr/bin/env bash

set -euo pipefail

if [[ "${SKIP_ATCTL_CHECK:-0}" == "1" ]]; then
  echo "[atctl] SKIP_ATCTL_CHECK=1 -> skipping automatic check."
  exit 0
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "[atctl] Running pre-push checks..."
node scripts/atctl.mjs check --auto

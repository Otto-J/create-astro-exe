#!/bin/bash
# One-click launcher for macOS
# Usage: double-click run.command

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="${DIR}"

cd "$ROOT" || exit 1

mkdir -p "${ROOT}/logs"
export NODE_ENV=production

# Run and append logs
# Show output AND write to logs
node "${ROOT}/scripts/run.mjs" 2>&1 | tee -a "${ROOT}/logs/app.log"

#!/usr/bin/env bash
# =============================================================================
#  Finance Atlas - serve the built site with the zero-dependency Node server.
#  Requires the site to be built first (tools/build.sh) and Node installed.
#
#  Usage:
#    tools/serve.sh              serve site/ on http://localhost:8080
#    tools/serve.sh 3000         serve on port 3000
#    tools/serve.sh --dir foo    serve a different folder
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found on PATH. Install it from https://nodejs.org" >&2
  exit 1
fi

exec node "$SCRIPT_DIR/serve.mjs" "$@"

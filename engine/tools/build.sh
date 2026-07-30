#!/usr/bin/env bash
# =============================================================================
#  Atlas build - Linux/macOS entry point (engine tool; atlas name/paths come
#  from atlas.config.json at the repo root). Invoked via the atlas's 2-line
#  shim at tools/build.sh so the CI contract `bash tools/build.sh` is stable.
#
#  On a normal (non-Google-Drive) filesystem there is no need for the C:\
#  mirror dance that build.ps1 does on Windows, so this builds in place:
#    0. verify the vendored engine is untouched          (verify_manifest.py)
#    1. validate the catalog -- hard gate                (validate_catalog.py)
#    2. regenerate app/public/data/                      (build_data.py)
#    3. npm ci / npm install (first run only) + build    (in app/)
#    4. copy app/dist/ -> site/
#
#  Usage:
#    tools/build.sh                 full build -> site/
#    tools/build.sh --dev           regenerate data, then start the Vite dev server
#    tools/build.sh --skip-data     app-only change: skip validate + data regen
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # tools/engine
PROJ="$(dirname "$(dirname "$SCRIPT_DIR")")"                  # atlas root
APP="$PROJ/app"
SITE="$PROJ/site"

skip_data=0
dev=0
for arg in "$@"; do
  case "$arg" in
    --dev|-Dev|-dev)            dev=1 ;;
    --skip-data|-SkipData|-skip-data) skip_data=1 ;;
    -h|--help) sed -n '3,18p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown argument: $arg (try --help)" >&2; exit 2 ;;
  esac
done

PY="$(command -v python3 || command -v python || true)"
if [ -z "$PY" ]; then echo "error: python3 not found on PATH" >&2; exit 1; fi
if ! command -v npm >/dev/null 2>&1; then echo "error: npm not found on PATH" >&2; exit 1; fi

NAME="$(ATLAS_ROOT="$PROJ" "$PY" -c 'import json,os;print(json.load(open(os.path.join(os.environ["ATLAS_ROOT"],"atlas.config.json"),encoding="utf-8"))["name"])')"
echo "== $NAME build =="

echo "-> Verifying vendored engine ..."
"$PY" "$SCRIPT_DIR/verify_manifest.py"

if [ "$skip_data" -eq 0 ]; then
  echo "-> Validating catalog ..."
  "$PY" "$SCRIPT_DIR/validate_catalog.py"
  echo "-> Regenerating data/ from resources + content/ ..."
  "$PY" "$SCRIPT_DIR/build_data.py"
fi

cd "$APP"
if [ ! -d node_modules ]; then
  if [ -f package-lock.json ]; then
    echo "-> npm ci ..."
    npm ci
  else
    echo "-> npm install (no lockfile) ..."
    npm install
  fi
fi

if [ "$dev" -eq 1 ]; then
  echo "-> Starting dev server (Ctrl+C to stop) ..."
  exec npm run dev
fi

echo "-> Building ..."
npm run build

echo "-> Copying dist/ -> $SITE ..."
rm -rf "$SITE"
mkdir -p "$SITE"
cp -R "$APP/dist/." "$SITE/"

index="$SITE/index.html"
size_kb=$(( $(wc -c < "$index") / 1024 ))
echo "== Done. Open $index  (index.html = ${size_kb} KB) =="

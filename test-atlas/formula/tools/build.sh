#!/usr/bin/env bash
# Shim: the real build lives in the vendored engine. CI contract stays
# `bash tools/build.sh` regardless of engine version.
exec bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/engine/build.sh" "$@"

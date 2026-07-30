#!/usr/bin/env python3
"""Fail the build if any vendored engine file was edited in the atlas.

The engine is vendored by atlas-engine's tools/sync_engine.py, which writes
ENGINE_MANIFEST.json (sha256 per file, line-ending normalized so git's
CRLF/LF handling can't cause false positives). Local edits to vendored files
are the divergence failure mode this exists to prevent: fix in atlas-engine
and re-sync instead.

Stdlib only. Exit 1 on any mismatch.
"""
import hashlib
import json
import sys
from pathlib import Path

VENDOR_DIRS = ("app/src/engine", "tools/engine")


def file_hash(p: Path) -> str:
    data = p.read_bytes().replace(b"\r\n", b"\n")
    return hashlib.sha256(data).hexdigest()


def main():
    root = Path(__file__).resolve().parent.parent.parent  # tools/engine/ -> root
    mf = root / "ENGINE_MANIFEST.json"
    if not mf.is_file():
        sys.exit("ENGINE_MANIFEST.json missing — run atlas-engine's sync_engine.py")
    manifest = json.loads(mf.read_text(encoding="utf-8"))
    problems = []
    for rel, want in manifest["files"].items():
        p = root / rel
        if not p.is_file():
            problems.append(f"missing:  {rel}")
        elif file_hash(p) != want:
            problems.append(f"modified: {rel}")
    for d in VENDOR_DIRS:
        base = root / d
        if not base.is_dir():
            continue
        for p in base.rglob("*"):
            if p.is_file() and "__pycache__" not in p.parts:
                rel = p.relative_to(root).as_posix()
                if rel not in manifest["files"]:
                    problems.append(f"untracked in vendored dir: {rel}")
    if problems:
        print("ENGINE VENDOR CHECK FAILED — vendored engine files were changed locally:")
        for pr in problems:
            print("  " + pr)
        print(
            "\nEdit these files in the atlas-engine repo instead, then re-vendor:\n"
            "  python <atlas-engine>/tools/sync_engine.py --to <this repo>\n"
            f"(engine version pinned here: {manifest.get('engine', '?')})"
        )
        sys.exit(1)
    print(f"engine vendor check OK ({manifest.get('engine', '?')}, {len(manifest['files'])} files)")


if __name__ == "__main__":
    main()

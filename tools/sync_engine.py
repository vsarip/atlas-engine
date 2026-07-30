#!/usr/bin/env python3
"""Vendor the atlas engine into a consuming atlas (one-way sync).

Usage (from anywhere; paths may be relative):
    python tools/sync_engine.py --to <atlas-root>     # (re)vendor into an atlas
    python tools/sync_engine.py --init <new-dir>      # scaffold a new atlas from
                                                      # templates/, then vendor

Owns EXACTLY two directories in the target and clean-replaces them:
    <atlas>/app/src/engine/   <-  engine/app/
    <atlas>/tools/engine/     <-  engine/tools/

Also writes at the atlas root:
    ENGINE_VERSION            git tag/sha + date of the engine checkout
    ENGINE_MANIFEST.json      sha256 per vendored file (line-ending normalized)

The atlas build scripts verify the manifest and hard-fail if a vendored file
was edited locally — fix in atlas-engine and re-sync instead. Sync never
writes outside the two vendored dirs + the two root files.

Stdlib only.
"""
import hashlib
import json
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path

ENGINE_ROOT = Path(__file__).resolve().parent.parent
VENDOR_MAP = {
    "engine/app": "app/src/engine",
    "engine/tools": "tools/engine",
}


def engine_version() -> str:
    try:
        tag = subprocess.run(
            ["git", "-C", str(ENGINE_ROOT), "describe", "--tags", "--always", "--dirty"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
    except Exception:
        tag = "unknown"
    return f"{tag} ({date.today().isoformat()})"


def file_hash(p: Path) -> str:
    data = p.read_bytes().replace(b"\r\n", b"\n")
    return hashlib.sha256(data).hexdigest()


def vendor_into(atlas_root: Path):
    atlas_root = atlas_root.resolve()
    if not atlas_root.is_dir():
        sys.exit(f"target is not a directory: {atlas_root}")
    files = {}
    for src_rel, dst_rel in VENDOR_MAP.items():
        src = ENGINE_ROOT / src_rel
        dst = atlas_root / dst_rel
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
        for p in sorted(dst.rglob("*")):
            if p.is_file():
                files[p.relative_to(atlas_root).as_posix()] = file_hash(p)
    version = engine_version()
    (atlas_root / "ENGINE_VERSION").write_text(version + "\n", encoding="utf-8")
    (atlas_root / "ENGINE_MANIFEST.json").write_text(
        json.dumps({"engine": version, "files": files}, indent=1, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"vendored engine {version}")
    print(f"  -> {atlas_root} ({len(files)} files across {', '.join(VENDOR_MAP.values())})")


def init_atlas(new_dir: Path):
    new_dir = new_dir.resolve()
    templates = ENGINE_ROOT / "templates"
    new_dir.mkdir(parents=True, exist_ok=True)
    copied, skipped = 0, 0
    for src in sorted(templates.rglob("*")):
        if not src.is_file():
            continue
        rel = src.relative_to(templates)
        dst = new_dir / rel
        if dst.exists():
            skipped += 1
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        copied += 1
    print(f"scaffolded {copied} template files into {new_dir}"
          + (f" ({skipped} already existed, left untouched)" if skipped else ""))
    vendor_into(new_dir)
    print(
        "\nNext steps:\n"
        "  1. Fill in atlas.config.json + app/src/atlas.config.jsx (name, taxonomy, sections)\n"
        "  2. Author resources/ catalog + content/\n"
        "  3. Generate a lockfile (npm install on a C:\\ mirror), then tools/build.(cmd|sh)\n"
        "  See atlas-engine/docs/NEW_ATLAS.md for the full checklist."
    )


def main():
    args = sys.argv[1:]
    if len(args) == 2 and args[0] == "--to":
        vendor_into(Path(args[1]))
    elif len(args) == 2 and args[0] == "--init":
        init_atlas(Path(args[1]))
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()

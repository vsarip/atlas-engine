#!/usr/bin/env python3
"""Locate and load the consuming atlas's atlas.config.json.

Engine tools are vendored to <atlas>/tools/engine/, so the atlas root is
found by walking up from this file until atlas.config.json appears. All
engine Python tools import this module; none hardcode atlas facts.

Stdlib only.
"""
import json
from pathlib import Path


def find_root(start=None):
    p = Path(start) if start else Path(__file__).resolve().parent
    for d in [p, *p.parents]:
        if (d / "atlas.config.json").is_file():
            return d
    raise SystemExit(f"atlas.config.json not found above {p}")


def load(start=None):
    """Return (config dict, atlas root Path)."""
    root = find_root(start)
    cfg = json.loads((root / "atlas.config.json").read_text(encoding="utf-8"))
    return cfg, root


def load_plugin(root, relpath):
    """Import an atlas-local Python plugin file (e.g. tools/atlas_build.py)."""
    import importlib.util

    p = root / relpath
    if not p.is_file():
        raise SystemExit(f"plugin not found: {relpath}")
    spec = importlib.util.spec_from_file_location(p.stem, p)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

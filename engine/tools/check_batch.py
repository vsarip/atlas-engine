#!/usr/bin/env python3
"""Validate enrichment files for given batch keys (engine tool).

Usage: python tools/engine/check_batch.py [batch-key ...]   (default: all)
Prints PASS/FAIL per batch with problem details; exit 1 if any fail/missing.

atlas.config.json keys used:
    catalog            path to catalog json
    widget_types       atlas-local widget type strings (merged with engine generics)
    content_required   required top-level fields in every content/<id>.json
    latex_conversion   when true, every string is checked for balanced unescaped $
    content_validators [atlas-local py files] each exposing
                       check_content(d, entry, cfg, root) -> [problem strings]
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import atlas_config

ENGINE_WIDGETS = {"formula-explorer", "grapher", "distribution"}


def main():
    cfg, root = atlas_config.load()
    widgets = ENGINE_WIDGETS | set(cfg.get("widget_types", []))
    required = cfg.get(
        "content_required",
        ["intuition", "why", "example", "applications", "history",
         "derivation", "related", "links"],
    )
    dollar_check = cfg.get("latex_conversion", True)
    validators = [
        atlas_config.load_plugin(root, rel)
        for rel in cfg.get("content_validators", [])
    ]

    manifest_path = root / "tools" / "enrichment" / "assignments" / "manifest.json"
    if not manifest_path.is_file():
        sys.exit("assignments/manifest.json missing — run make_assignments.py first")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    cat = json.loads((root / cfg["catalog"]).read_text(encoding="utf-8"))
    valid_ids = {e["id"] for e in cat["entries"]}
    entries_by_id = {e["id"]: e for e in cat["entries"]}

    keys = sys.argv[1:]
    batches = [m for m in manifest if m["batch"] in keys] if keys else manifest
    fail = False
    for m in batches:
        probs, missing = [], []
        for i in m["ids"]:
            p = root / "content" / f"{i}.json"
            if not p.is_file():
                missing.append(i)
                continue
            try:
                d = json.loads(p.read_text(encoding="utf-8"))
            except Exception as ex:
                probs.append(f"id {i}: JSON parse error: {ex}")
                continue
            if d.get("id") != i:
                probs.append(f"id {i}: id field is {d.get('id')}")
            for r in d.get("related", []):
                if r not in valid_ids:
                    probs.append(f"id {i}: bad related id {r}")
            w = d.get("widget")
            if w is not None and w.get("type") not in widgets:
                probs.append(f"id {i}: unknown widget type {w.get('type')!r}")
            for req in required:
                if req not in d:
                    probs.append(f"id {i}: missing field {req!r}")

            if dollar_check:
                def walk(v, path):
                    if isinstance(v, str):
                        if v.replace("\\$", "").count("$") % 2:
                            probs.append(f"id {i} {path}: odd $ count :: {v[:90]!r}")
                    elif isinstance(v, list):
                        for j, x in enumerate(v):
                            walk(x, f"{path}[{j}]")
                    elif isinstance(v, dict):
                        for k, x in v.items():
                            walk(x, f"{path}.{k}")
                walk(d, "")

            for plugin in validators:
                probs.extend(
                    f"id {i}: {msg}"
                    for msg in plugin.check_content(d, entries_by_id.get(i), cfg, root)
                )

        status = "PASS" if not probs and not missing else "FAIL"
        if status == "FAIL":
            fail = True
        print(f"{status} {m['batch']}  ({len(m['ids'])} ids)")
        if missing:
            print(f"   MISSING: {missing}")
        for pb in probs:
            print(f"   {pb}")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()

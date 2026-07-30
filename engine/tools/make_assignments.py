#!/usr/bin/env python3
"""Generate per-batch assignment files + manifest for content author agents.

Usage: python tools/engine/make_assignments.py [start_batch_no]
Scans content/ for already-enriched ids and chunks the remainder into
discipline-scoped batches, writing tools/enrichment/assignments/<key>.md +
manifest.json. Pass the next free batch number after the highest already
committed (see `git log --oneline | grep -o "batch [0-9]*"`).

atlas.config.json keys used:
    catalog        path to catalog json
    batch_size     max entries per batch (default 16)
    flagship_ids   ids offered as cross-discipline `related` links
                   (default [1..20])
"""
import json
import math
import sys
from collections import OrderedDict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import atlas_config


def slug(s):
    return "".join(c if c.isalnum() else "-" for c in s.lower()).strip("-").replace("--", "-")[:34]


def main():
    cfg, root = atlas_config.load()
    batch_size = cfg.get("batch_size", 16)
    out = root / "tools" / "enrichment" / "assignments"
    out.mkdir(parents=True, exist_ok=True)

    cat = json.loads((root / cfg["catalog"]).read_text(encoding="utf-8"))
    done = {int(f.stem) for f in (root / "content").glob("*.json")} if (root / "content").is_dir() else set()
    by_id = {e["id"]: e for e in cat["entries"]}

    field_order = [f["name"] if isinstance(f, dict) else f for f in cat["fields"]]

    disc = OrderedDict()
    for e in cat["entries"]:
        disc.setdefault((e["field"], e["discipline"]), []).append(e)

    flagship_ids = cfg.get("flagship_ids", list(range(1, 21)))
    flagships = [by_id[i] for i in flagship_ids if i in by_id]

    manifest = []
    batch_no = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    start_no = batch_no
    for field in field_order:
        for (f, d), entries in disc.items():
            if f != field:
                continue
            todo = [e for e in entries if e["id"] not in done]
            if not todo:
                continue
            nparts = math.ceil(len(todo) / batch_size)
            size = math.ceil(len(todo) / nparts)
            for p in range(nparts):
                chunk = todo[p * size:(p + 1) * size]
                if not chunk:
                    continue
                key = f"{batch_no:03d}-{slug(d)}" + (f"-p{p+1}" if nparts > 1 else "")
                path = out / (key + ".md")
                with open(path, "w", encoding="utf-8") as fh:
                    fh.write(f"# Assignment {key}\n\n")
                    fh.write(f"Field: {f}\nDiscipline: {d}\n\n")
                    fh.write(
                        f"Write the file `content/<id>.json` in the repo for EACH of "
                        f"these {len(chunk)} entries:\n\n"
                    )
                    for e in chunk:
                        fh.write(f"## id {e['id']} | {e['name']}  ({e['type']})\n")
                        fh.write(f"statement: {e['statement']}\n\n")
                    fh.write("## Discipline roster (primary pool for `related` ids)\n\n")
                    for e in entries:
                        mark = " [enriched]" if e["id"] in done else ""
                        fh.write(f"- {e['id']}: {e['name']}{mark}\n")
                    if flagships:
                        fh.write("\n## Flagship ids (good cross-discipline `related` links)\n\n")
                        for e in flagships:
                            fh.write(f"- {e['id']}: {e['name']} ({e['discipline']})\n")
                manifest.append({
                    "batch": key, "field": f, "discipline": d,
                    "ids": [e["id"] for e in chunk], "file": str(path), "status": "todo",
                })
                batch_no += 1

    with open(out / "manifest.json", "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=1)
    print(
        f"{len(manifest)} batches, {sum(len(m['ids']) for m in manifest)} entries, "
        f"numbering from {start_no:03d}"
    )
    for m in manifest:
        print(m["batch"], len(m["ids"]))


if __name__ == "__main__":
    main()

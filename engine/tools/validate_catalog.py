#!/usr/bin/env python3
"""Validate the atlas catalog against its taxonomy (engine tool).

    python tools/engine/validate_catalog.py            # errors + warnings
    python tools/engine/validate_catalog.py --report   # per-discipline counts vs targets

atlas.config.json keys used:
    catalog            path to catalog json
    taxonomy_quotas    {field: {discipline: target count}}
    types              canonical type list (order matters)
    latex_conversion   when false, formula/LaTeX statement checks are skipped
    statement_rules    { "forbid_chars": "...", "max_len": N }
    extra_validators   [atlas-local py files] each exposing
                       validate(entries, content_by_id, cfg, root) -> (errors, warnings)

Stdlib only. Exits 1 on errors; warnings never fail the run.
This runs as a hard gate inside tools/engine/build.sh (CI).
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import atlas_config
import build_data  # converter tables + is_prose

# Typographic punctuation acceptable in prose statements (rendered as plain text).
PROSE_EXTRA = set("‘’“”—–…")
FORMULA_TYPES = {"Formula / Equation", "Ratio / Metric"}


def load_content_by_id(root):
    out = {}
    cdir = root / "content"
    if cdir.is_dir():
        for f in sorted(cdir.glob("*.json")):
            try:
                d = json.loads(f.read_text(encoding="utf-8"))
                if isinstance(d.get("id"), int):
                    out[d["id"]] = d
            except Exception:
                pass  # build_data / check_batch report parse errors with context
    return out


def main():
    report = "--report" in sys.argv[1:]
    cfg, root = atlas_config.load()
    taxonomy = cfg["taxonomy_quotas"]
    types = cfg["types"]
    latex_on = cfg.get("latex_conversion", True)
    rules = cfg.get("statement_rules", {})
    forbidden = set(rules.get("forbid_chars", ""))
    max_len = rules.get("max_len", 200)

    data = json.loads((root / cfg["catalog"]).read_text(encoding="utf-8"))
    entries = data.get("entries", [])
    errors, warnings = [], []

    if data.get("fields") != list(taxonomy):
        errors.append("top-level 'fields' does not match the canonical field list/order")
    if data.get("types") != types:
        errors.append("top-level 'types' does not match the canonical type list/order")
    if data.get("count") != len(entries):
        errors.append(f"'count' is {data.get('count')} but there are {len(entries)} entries")

    ids = [e.get("id") for e in entries]
    if ids != list(range(1, len(entries) + 1)):
        errors.append("ids are not contiguous 1..N in file order (never renumber; append only)")

    names = {}
    for e in entries:
        key = e.get("name", "").strip().lower()
        if key in names:
            errors.append(f"id {e['id']}: duplicate name '{e['name']}' (also id {names[key]})")
        names[key] = e.get("id")

    convertible = (
        set(build_data.SUPERSCRIPTS) | set(build_data.SUBSCRIPTS)
        | set(build_data.SYMBOLS) | set(build_data.COMBINING)
    )

    for e in entries:
        eid = e.get("id")
        field, disc, typ = e.get("field"), e.get("discipline"), e.get("type")
        stmt = e.get("statement", "")
        if field not in taxonomy:
            errors.append(f"id {eid}: unknown field '{field}'")
        elif disc not in taxonomy[field]:
            errors.append(f"id {eid}: unknown discipline '{disc}' for field '{field}'")
        if typ not in types:
            errors.append(f"id {eid}: unknown type '{typ}'")
        if not e.get("name", "").strip():
            errors.append(f"id {eid}: empty name")
        if not stmt.strip():
            errors.append(f"id {eid}: empty statement")
        if len(stmt) > max_len:
            warnings.append(f"id {eid}: statement is {len(stmt)} chars (cap {max_len})")

        bad = sorted(set(stmt) & forbidden)
        if bad:
            errors.append(f"id {eid}: forbidden character(s) {bad} in statement")

        if latex_on:
            prose = build_data.is_prose(stmt)
            allowed = convertible | (PROSE_EXTRA if prose else set())
            stray = sorted({c for c in stmt if ord(c) > 127 and c not in allowed})
            if stray:
                errors.append(f"id {eid}: non-ASCII not covered by the LaTeX converter: {stray}")
            if typ in FORMULA_TYPES and prose:
                warnings.append(
                    f"id {eid}: type '{typ}' but statement reads as prose "
                    "(no relation char) — it will render as text, not math"
                )

    content_by_id = load_content_by_id(root)
    for rel in cfg.get("extra_validators", []):
        plugin = atlas_config.load_plugin(root, rel)
        errs, warns = plugin.validate(entries, content_by_id, cfg, root)
        errors.extend(f"[{Path(rel).stem}] {m}" for m in errs)
        warnings.extend(f"[{Path(rel).stem}] {m}" for m in warns)

    counts = {f: {d: 0 for d in ds} for f, ds in taxonomy.items()}
    for e in entries:
        f, d = e.get("field"), e.get("discipline")
        if f in counts and d in counts[f]:
            counts[f][d] += 1

    for msg in errors:
        print(f"ERROR   {msg}")
    for msg in warnings:
        print(f"warning {msg}")

    if report:
        print(f"\n{'Field / Discipline':<58}{'have':>6}{'target':>8}")
        total = 0
        for f, ds in taxonomy.items():
            fh, ft = sum(counts[f].values()), sum(ds.values())
            total += fh
            print(f"{f:<58}{fh:>6}{ft:>8}")
            for d, target in ds.items():
                mark = " *" if counts[f][d] >= target else ""
                print(f"  {d:<56}{counts[f][d]:>6}{target:>8}{mark}")
        print(f"{'TOTAL':<58}{total:>6}{sum(sum(d.values()) for d in taxonomy.values()):>8}")

    print(f"\n{len(entries)} entries — {len(errors)} error(s), {len(warnings)} warning(s)")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()

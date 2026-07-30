# atlas-engine

The shared engine behind the "Atlas" family of fully-static educational sites
(Science Atlas, Finance Atlas, Country Atlas, …). Extracted from finance-atlas
2026-07-30. One React+Vite single-file app shell + a stdlib-Python data
pipeline, configured per atlas; consuming repos **vendor** the engine and stay
fully self-contained.

## How atlases consume it

```
python tools/sync_engine.py --to <atlas-root>     # (re)vendor into an atlas
python tools/sync_engine.py --init <new-dir>      # scaffold a brand-new atlas
```

Sync owns exactly two directories in the atlas — `app/src/engine/` and
`tools/engine/` — plus `ENGINE_VERSION` / `ENGINE_MANIFEST.json` at its root.
The atlas build hard-fails if a vendored file was edited locally (the
manifest check), so engine fixes happen HERE, get tagged, and propagate by
re-running sync in each atlas. Nothing else about an atlas repo changes: CI
still runs `bash tools/build.sh` (a 2-line shim onto the vendored engine).

## Layout

```
engine/app/      React app shell: router, search, sidebar/tree, views,
                 sections library, widget framework + generic widgets,
                 math adapters (katex/plain), engine.css
engine/tools/    build_data.py, validate_catalog.py, check_batch.py,
                 make_assignments.py, verify_manifest.py, build scripts —
                 all driven by the atlas's atlas.config.json
templates/       scaffold used by --init
test-atlas/      two buildable fixtures: formula-shaped (KaTeX) and
                 fact-shaped (no KaTeX) — CI builds both on every push
tools/           sync_engine.py (the vendoring tool)
docs/            CONFIG.md, NEW_ATLAS.md, DATA_FORMAT.md
```

## Per-atlas surface

An atlas owns: `atlas.config.json` (Python/build side), `app/src/atlas.config.jsx`
(app side: branding, taxonomy, sections array, widget registry, math adapter),
`app/src/atlas.css`, its catalog + content + assets, bespoke widgets/sections,
`wrangler.jsonc`, and docs. Everything else is vendored engine.

KaTeX is optional per atlas: it enters the bundle only via the atlas importing
`engine/math/katex.jsx`; a no-math atlas imports `engine/math/plain.jsx` and
drops ~1.7 MB (fixture proof: 1,870 KB vs 182 KB single-file builds).

## Rules

- Config is plain JS importing components. Nothing becomes configurable until
  a second atlas needs it different.
- No dynamic imports in engine code (breaks the singlefile/file:// invariant).
- Data loads via classic `<script src>` tags only — never fetch()/ESM.
- Route tokens (`#/field/`, `#/d/`, `#/c/`, `#/search/`) and compact data keys
  (`i,s,n,f,d,t,u,x,r`) are frozen across all atlases (docs/DATA_FORMAT.md).
- Python tools are stdlib-only.

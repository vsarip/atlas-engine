# CLAUDE.md

## What this is

**atlas-engine** — the shared engine behind the Atlas family of fully-static
educational sites (science-atlas, finance-atlas, country-atlas, …). Extracted
from finance-atlas 2026-07-30. Consuming atlases **vendor** `engine/app` →
`app/src/engine/` and `engine/tools` → `tools/engine/` via
`tools/sync_engine.py`; a sha256 manifest check in every atlas build fails
loudly if vendored files are edited in place. Read `README.md` first;
config reference in `docs/CONFIG.md`; frozen invariants in
`docs/DATA_FORMAT.md`.

## Commands

```
python tools/sync_engine.py --to <atlas-root>    # vendor into an atlas
python tools/sync_engine.py --init <dir>         # scaffold a new atlas
test-atlas\formula\tools\build.cmd               # build the KaTeX fixture (Windows)
test-atlas\fact\tools\build.cmd                  # build the no-math fixture
```

Before building fixtures locally, vendor into them first (CI does the same):
`python tools/sync_engine.py --to test-atlas/formula` (and fact). CI
(`.github/workflows/smoke.yml`) builds both fixtures on every push and
asserts KaTeX is bundled ONLY in the formula fixture (marker: `KaTeX_` font
prefix — bare "katex" matches inert CSS selectors).

## Rules (violating these breaks the deployed atlases)

- **Data via classic `<script src>` only** — never fetch()/ESM imports; must
  work from file://.
- **No dynamic imports** in engine code (vite-plugin-singlefile + file://).
- **KaTeX is imported ONLY in `engine/app/math/katex.jsx`** — that is the
  whole optional-math mechanism.
- Route tokens and compact index keys are **frozen** (docs/DATA_FORMAT.md).
- Engine reads atlas config at **runtime** via `engine/app/config.js`
  (`getConfig()`), never at module top level — avoids import cycles.
- Python tools: **stdlib only**, all driven by the atlas's
  `atlas.config.json` through `engine/tools/atlas_config.py`.
- Nothing becomes configurable until a second atlas needs it different.
- After changing engine code: build BOTH fixtures, tag (`vX.Y.Z`), then
  re-sync consuming atlases (each gets a `engine: sync to vX.Y.Z` commit).

## Google Drive constraint

This folder is on `G:\` (Google Drive): no node_modules/Vite builds here.
Fixture build.ps1 mirrors to `C:\_builds\atlas_fixture_*` automatically —
same dance as every atlas (see any atlas's docs/build-filesystem-constraint.md).

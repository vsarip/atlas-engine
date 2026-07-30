# Changelog

## v0.1.0 — 2026-07-30

Initial extraction from finance-atlas (the ahead twin: escape-aware `\$`
parser, catalog validator, enrichment kit).

Engine-new over the twins:
- Config-driven app shell: taxonomy/branding/strings/sections/widgets from
  `atlas.config.jsx`; Python side from `atlas.config.json`.
- Detail page = configurable sections array; header stays structural.
- **ErrorBoundary** around every section + widget body (malformed content no
  longer white-screens the app).
- **Markdown emphasis** (`**strong**` / `*em*`) in RichText prose — fixes the
  literal-asterisk defect on both live twins.
- **Optional KaTeX** via math adapters (`katex.jsx` / `plain.jsx`): no-math
  atlases drop ~1.7 MB (fixture proof 1,870 KB → 182 KB).
- Search: `META.count`-derived placeholders (fixes finance showing science's
  1,136), config `extraFields` scoring (aliases, codes, exact match).
- validate_catalog wired into build.sh/ps1 as a hard CI gate; verify_manifest
  guards vendored engine integrity (line-ending-normalized sha256).
- build_data: latex on/off, `data_assets` passthrough, build-plugin hooks
  (prepare / index_record / shard_payload / post_build).
- npm ci when a lockfile exists.

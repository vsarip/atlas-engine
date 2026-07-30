# Atlas configuration reference

Two config files per atlas. They overlap only on the display name.

## `atlas.config.json` (repo root — Python tools + build scripts)

| Key | Used by | Meaning |
|---|---|---|
| `name` | all | Site/display name ("Country Atlas") |
| `project` | build.ps1 | C:\_builds\<project> mirror dir name |
| `catalog` | all | Path to the source-of-truth catalog json |
| `latex_conversion` | build_data, validators | `false` for no-math atlases: skips Unicode→LaTeX + prose detection, `$`-balance checks, LaTeX statement rules |
| `types` | validate_catalog | Canonical type list (order matters) |
| `taxonomy_quotas` | validate_catalog | `{field: {discipline: target count}}` — build-blocking |
| `statement_rules` | validate_catalog | `{forbid_chars, max_len}` |
| `widget_types` | check_batch | Atlas-local widget type strings (engine generics are implicit) |
| `content_required` | check_batch | Required top-level fields in content/<id>.json |
| `extra_validators` | validate_catalog | Atlas py files: `validate(entries, content_by_id, cfg, root) -> (errors, warnings)` |
| `content_validators` | check_batch | Atlas py files: `check_content(d, entry, cfg, root) -> [problems]` |
| `build_plugin` | build_data | Atlas py file with optional hooks `prepare(dataset, content, cfg, root)`, `index_record(rec, entry, content_item)`, `shard_payload(payload, entry)`, `post_build(out_dir, cfg, root)` |
| `data_assets` | build_data | Dirs copied verbatim into `data/` (flags, map data) |
| `batch_size`, `flagship_ids` | make_assignments | Enrichment batching knobs |

## `app/src/atlas.config.jsx` (app side)

```jsx
import { katexMath } from "./engine/math/katex.jsx"; // or plain.jsx
import * as S from "./engine/sections/index.jsx";
import { genericWidgets } from "./engine/widgets/index.jsx";
import "./atlas.css";

export default {
  name, brand: { mark, nameParts: [a, b] },
  strings: { entity, group, subgroup,          // ["singular","plural"] pairs
             richBadge?, ofTheDay?, loadingNote?, leanNote?, groupFilterLabel? },
  hero: { titlePrefix?, tagline: (count) => string | string },
  taxonomy: { FieldName: { slug, color, emoji } },
  typeBadges: { TypeName: "◆" },
  math: katexMath | plainMath,                 // KaTeX bundles ONLY via this import
  search: { extraFields?: [{ key, weight, exact? }] },
  sections: [S.Intuition, ..., LocalSection],  // ordered detail-page renderers
  widgets: { ...genericWidgets, "my-widget": MyWidget },
  features: { randomButton?: boolean },
};
```

Section contract: `({ entry, shard }) => JSX | null` — return null when the
section's data is absent. `entry` = compact catalog record, `shard` =
enrichment payload (`{}` while loading/absent). Engine exports the `Section`
titled frame and generic `FactsTable` for atlas-local sections to reuse.

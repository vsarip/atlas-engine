# Frozen data contract

These are identical across every atlas. Changing any of them breaks deployed
deep links or cross-atlas tooling — don't.

## Routes (hash-only, file:// safe)

```
#/                      home
#/field/<slug>          top-level group ("field" slot: Physics / Personal
                        Finance / Africa …)
#/d/<field>/<disc>      second-level group ("discipline" slot)
#/c/<id>-<slug>         entry detail
#/search/<query>        search
```

Display labels are configurable (`strings.group` etc.); URL tokens are not.

## Compact index record (`window.ATLAS_INDEX`)

| Key | Meaning |
|---|---|
| `i` | id (permanent — never renumber) |
| `s` | slug |
| `n` | name |
| `f` | top group (abstract "field" slot) |
| `d` | second group (abstract "discipline" slot) |
| `t` | type |
| `u` | unicode statement / one-line description |
| `x` | LaTeX override (optional; absent when latex_conversion off) |
| `r` | 1 = enriched (has a shard) |

Atlases may ADD compact keys via the build plugin's `index_record` hook
(e.g. countries: `a` aliases, `c2` iso2); they must never repurpose the core
nine.

## Loading mechanism

`data/index.js` sets `window.ATLAS_META` + `window.ATLAS_INDEX`; shards
`data/concepts/c<id>.js` call `window.__atlasShard(payload)`. Classic
`<script src>` injection only — never fetch()/ESM — so file://, vite dev and
static hosting behave identically. Static assets (flags, images) are plain
files under `data/` referenced by relative `<img src>` (also file://-safe).

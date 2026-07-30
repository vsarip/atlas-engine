# Standing up a new atlas

1. **Scaffold + vendor**
   ```
   python tools/sync_engine.py --init "G:\My Drive\ONLINE\_VarmaSaripalli\aiprojects\<new_atlas>"
   cd <new_atlas> && git init
   ```
2. **Fill in the two configs** (see CONFIG.md):
   - `atlas.config.json`: name, project, catalog path, latex on/off, types,
     taxonomy_quotas, statement_rules, content_required
   - `app/src/atlas.config.jsx`: brand, strings, taxonomy colors/emoji,
     math adapter (katex vs plain — **remove `katex` from app/package.json
     for a no-math atlas**), sections order, widgets
   - `app/index.html`: title + meta description; `app/src/atlas.css`: glow colors
   - `wrangler.jsonc`: worker name + custom domain
3. **Author the catalog** at the path in `atlas.config.json`
   (`{title, count, fields, types, entries:[{id, field, discipline, type,
   name, statement, ...extra keys}]}`), then
   `python tools/engine/validate_catalog.py --report` until clean.
4. **Lockfile** (Windows/Drive): mirror `app/` to `C:\_builds\<project>\app`,
   `npm install` there, copy `package-lock.json` back, commit it.
5. **Build**: `tools\build.cmd` (Windows) / `bash tools/build.sh` (CI).
   Double-click `site/index.html` to smoke-test from file://.
6. **Deploy** (Cloudflare Workers Builds — same as every atlas):
   create the GitHub repo & push; grant the Cloudflare GitHub App access to
   the repo (GitHub → Settings → Applications) BEFORE looking for it in the
   Cloudflare picker; create the Workers Builds project with build command
   `bash tools/build.sh`, deploy command `npx wrangler deploy`. First deploy
   auto-creates DNS + cert for the custom domain.
   Generic doc: `ailab/docs/deploying-static-sites-cloudflare-workers-builds.md`.
7. **Monitoring**: `app/public/health` + `_headers` ship in the template;
   add an Uptime Kuma monitor (keyword `"status":"ok"`).
8. **Enrichment pipeline**: write the atlas's AUTHORING_GUIDE (copy a sibling's
   as the starting point), then
   `python tools/engine/make_assignments.py 1` → spawn one author agent per
   batch → `python tools/engine/check_batch.py` → commit per batch.

## Updating the engine in an existing atlas

```
# in atlas-engine: fix, commit, tag vX.Y.Z
python tools/sync_engine.py --to <atlas-root>
# in the atlas: build, eyeball, commit "engine: sync to vX.Y.Z"
```
Never edit files under `app/src/engine/` or `tools/engine/` in an atlas —
the build's manifest check will fail loudly.

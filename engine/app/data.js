// Catalog access + on-demand shard loading.
// All data arrives via classic <script> tags (never fetch/import) so the same
// files work on file://, `vite dev`, and any static host.
//
// Taxonomy metadata (per-field slug/color/emoji, type badges) comes from the
// atlas config — this module owns only the loading + derived structures.

import { getConfig } from "./config.js";

// Base URL that `data/` sits under, relative to the current document.
function dataBase() {
  // document.baseURI ends with the html file (or dir on web); resolve "data/".
  return new URL("data/", document.baseURI).href;
}

export function injectScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

// ---- module state ----------------------------------------------------------

export let META = null;
export let ALL = []; // catalog entries {i,s,n,f,d,t,u,x?,r?,...}
const byId = new Map();
const bySlug = new Map();
let fieldsCache = null;
let disciplineCache = null;

export function loadCatalog() {
  return injectScript(dataBase() + "index.js").then(() => {
    if (!window.ATLAS_INDEX || !window.ATLAS_META) {
      throw new Error("data/index.js did not define the catalog");
    }
    META = window.ATLAS_META;
    ALL = window.ATLAS_INDEX;
    for (const e of ALL) {
      byId.set(e.i, e);
      bySlug.set(e.s, e);
    }
  });
}

export function getById(id) {
  return byId.get(Number(id)) || null;
}

export const fieldMeta = (field) =>
  getConfig().taxonomy[field] || { slug: "other", color: "#64748b", emoji: "•" };

export const typeBadge = (type) => (getConfig().typeBadges || {})[type] || "•";

// Fields with counts, in the catalog's declared order.
export function fields() {
  if (fieldsCache) return fieldsCache;
  const counts = new Map();
  for (const e of ALL) counts.set(e.f, (counts.get(e.f) || 0) + 1);
  fieldsCache = META.fields.map((name) => ({
    name,
    count: counts.get(name) || 0,
    ...fieldMeta(name),
  }));
  return fieldsCache;
}

// Field -> ordered disciplines (each with its concepts), built once.
export function tree() {
  if (disciplineCache) return disciplineCache;
  const map = new Map();
  for (const e of ALL) {
    if (!map.has(e.f)) map.set(e.f, new Map());
    const disc = map.get(e.f);
    if (!disc.has(e.d)) disc.set(e.d, []);
    disc.get(e.d).push(e);
  }
  disciplineCache = META.fields
    .filter((f) => map.has(f))
    .map((f) => ({
      name: f,
      ...fieldMeta(f),
      disciplines: [...map.get(f).entries()].map(([dName, items]) => ({
        name: dName,
        field: f,
        key: fieldMeta(f).slug + "/" + slugify(dName),
        items,
      })),
    }));
  return disciplineCache;
}

export function fieldBySlug(slug) {
  return tree().find((f) => f.slug === slug) || null;
}

export function disciplineByKey(key) {
  for (const f of tree()) {
    const d = f.disciplines.find((x) => x.key === key);
    if (d) return { field: f, discipline: d };
  }
  return { field: null, discipline: null };
}

export function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

// ---- shard loading (entry detail enrichment) -------------------------------

const shardCache = new Map(); // id -> payload | null(=none)
let shardResolver = null;

// shard files call window.__atlasShard(payload)
window.__atlasShard = (payload) => {
  if (shardResolver) shardResolver(payload);
};

export function loadShard(id) {
  id = Number(id);
  if (shardCache.has(id)) return Promise.resolve(shardCache.get(id));
  const entry = getById(id);
  if (!entry || !entry.r) {
    shardCache.set(id, null);
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    shardResolver = (payload) => {
      shardResolver = null;
      shardCache.set(id, payload);
      resolve(payload);
    };
    injectScript(dataBase() + "concepts/c" + id + ".js").catch(() => {
      shardResolver = null;
      shardCache.set(id, null);
      resolve(null);
    });
  });
}

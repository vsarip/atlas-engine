import { ALL } from "./data.js";
import { getConfig } from "./config.js";

// Lightweight scored search over the whole catalog (a few hundred to ~1k
// items -> fine to scan on every keystroke). Matches name > statement >
// discipline > type, with a bonus for word-start and exact matches, plus a
// subsequence fallback. Atlases add domain fields (aliases, capitals, …) via
// config.search.extraFields: [{ key, weight, exact }] — `key` is a compact
// index key whose value may be a string or an array of strings; `exact: true`
// scores only a whole-value match (good for codes like ISO "jp").

function norm(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

function subsequence(query, text) {
  // returns true if query chars appear in order within text
  let qi = 0;
  for (let i = 0; i < text.length && qi < query.length; i++) {
    if (text[i] === query[qi]) qi++;
  }
  return qi === query.length;
}

function scoreField(q, text, weight) {
  if (!text) return 0;
  const t = norm(text);
  const idx = t.indexOf(q);
  if (idx === 0) return weight * 3;
  if (idx > 0) {
    // word-boundary bonus
    const boundary = idx > 0 && /\W/.test(t[idx - 1]);
    return weight * (boundary ? 2 : 1.4);
  }
  if (q.length >= 3 && subsequence(q, t)) return weight * 0.6;
  return 0;
}

function scoreExtra(q, value, { weight, exact }) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  let best = 0;
  for (const v of values) {
    const s = exact
      ? norm(String(v)) === q
        ? weight
        : 0
      : scoreField(q, String(v), weight);
    if (s > best) best = s;
  }
  return best;
}

export function search(query, { field = null, type = null, limit = 60 } = {}) {
  const extra = (getConfig().search || {}).extraFields || [];
  const q = norm(query.trim());
  const results = [];
  for (const e of ALL) {
    if (field && e.f !== field) continue;
    if (type && e.t !== type) continue;
    if (!q) {
      results.push({ e, score: 0 });
      continue;
    }
    let score =
      scoreField(q, e.n, 10) +
      scoreField(q, e.u, 4) +
      scoreField(q, e.d, 3) +
      scoreField(q, e.t, 1) +
      scoreField(q, e.f, 1);
    for (const ef of extra) score += scoreExtra(q, e[ef.key], ef);
    if (e.r) score *= 1.08; // nudge enriched entries up
    if (score > 0) results.push({ e, score });
  }
  results.sort((a, b) => b.score - a.score || a.e.n.localeCompare(b.e.n));
  const total = results.length;
  return { items: results.slice(0, limit).map((r) => r.e), total };
}

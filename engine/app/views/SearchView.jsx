import React, { useEffect, useState } from "react";
import { search } from "../search.js";
import { META, fieldMeta } from "../data.js";
import { href, navigate } from "../router.js";
import { str, getConfig } from "../config.js";
import ConceptCard from "../components/ConceptCard.jsx";

// Full-page search results with field/type filter chips.
export default function SearchView({ query }) {
  const [q, setQ] = useState(query || "");
  const [field, setField] = useState(null);
  const [type, setType] = useState(null);
  const [limit, setLimit] = useState(60);

  useEffect(() => setQ(query || ""), [query]);
  useEffect(() => setLimit(60), [q, field, type]);

  const { items, total } = search(q, { field, type, limit });
  const groupLabel = (getConfig().strings || {}).groupFilterLabel;

  return (
    <div className="search-view">
      <header className="view-head">
        <h1>Search</h1>
        <div className="search-page-box">
          <span className="search-icon" aria-hidden>
            🔍
          </span>
          <input
            autoFocus
            className="search-input big"
            value={q}
            placeholder={`Search ${META?.count?.toLocaleString() ?? ""} ${str(
              "entity",
              META?.count ?? 2
            )}…`}
            onChange={(e) => {
              setQ(e.target.value);
              navigate(href.search(e.target.value));
            }}
          />
        </div>
      </header>

      <div className="filters">
        <div className="filter-row">
          <span className="filter-label">{groupLabel || cap(str("group", 1))}</span>
          <Chip active={!field} onClick={() => setField(null)}>
            All
          </Chip>
          {META.fields.map((f) => {
            const fm = fieldMeta(f);
            return (
              <Chip
                key={f}
                active={field === f}
                color={fm.color}
                onClick={() => setField(field === f ? null : f)}
              >
                {fm.emoji} {f}
              </Chip>
            );
          })}
        </div>
        <div className="filter-row">
          <span className="filter-label">Type</span>
          <Chip active={!type} onClick={() => setType(null)}>
            All
          </Chip>
          {META.types.map((t) => (
            <Chip key={t} active={type === t} onClick={() => setType(type === t ? null : t)}>
              {t}
            </Chip>
          ))}
        </div>
      </div>

      <p className="result-count">
        {q.trim()
          ? `${total} result${total === 1 ? "" : "s"}`
          : "Type to search, or use the filters to browse."}
      </p>

      <div className="card-grid">
        {items.map((e) => (
          <ConceptCard key={e.i} entry={e} showField />
        ))}
      </div>

      {total > items.length && (
        <button className="load-more" onClick={() => setLimit((l) => l + 60)}>
          Show more ({total - items.length} remaining)
        </button>
      )}
    </div>
  );
}

function Chip({ active, color, onClick, children }) {
  return (
    <button
      className={"filter-chip" + (active ? " active" : "")}
      style={active && color ? { "--field": color, borderColor: color } : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

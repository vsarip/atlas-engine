import React, { useEffect, useRef, useState } from "react";
import { search } from "../search.js";
import { href, navigate } from "../router.js";
import { fieldMeta, META } from "../data.js";
import { str } from "../config.js";

// Compact instant-search box with a live dropdown of top hits.
export default function SearchBar() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);

  const results = q.trim() ? search(q, { limit: 8 }) : { items: [], total: 0 };
  const placeholder = `Search ${META?.count?.toLocaleString() ?? ""} ${str(
    "entity",
    META?.count ?? 2
  )}…`;

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => setActive(0), [q]);

  function go(entry) {
    setOpen(false);
    setQ("");
    navigate(href.concept(entry));
  }

  function onKey(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.items.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (active < results.items.length) go(results.items[active]);
      else if (q.trim()) {
        setOpen(false);
        navigate(href.search(q.trim()));
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="searchbar" ref={boxRef}>
      <span className="search-icon" aria-hidden>
        🔍
      </span>
      <input
        className="search-input"
        type="text"
        placeholder={placeholder}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        aria-label={"Search " + str("entity", 2)}
      />
      {q && (
        <button className="search-clear" onClick={() => setQ("")} aria-label="Clear">
          ×
        </button>
      )}
      {open && q.trim() && (
        <div className="search-drop">
          {results.items.length === 0 && (
            <div className="search-empty">No matches for “{q}”.</div>
          )}
          {results.items.map((e, i) => {
            const fm = fieldMeta(e.f);
            return (
              <button
                key={e.i}
                className={"search-hit" + (i === active ? " active" : "")}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(e)}
              >
                <span className="hit-dot" style={{ background: fm.color }} />
                <span className="hit-name">{e.n}</span>
                <span className="hit-field">{e.d}</span>
              </button>
            );
          })}
          {results.total > results.items.length && (
            <button
              className={
                "search-hit see-all" +
                (active === results.items.length ? " active" : "")
              }
              onClick={() => {
                setOpen(false);
                navigate(href.search(q.trim()));
              }}
            >
              See all {results.total} results →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

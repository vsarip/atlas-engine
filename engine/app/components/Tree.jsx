import React, { useEffect, useState } from "react";
import { tree } from "../data.js";
import { href } from "../router.js";

// Field -> Discipline -> concept collapsible navigation.
export default function Tree({ route }) {
  const data = tree();
  const [open, setOpen] = useState(() => new Set());

  // Auto-expand the field/discipline that matches the current route.
  useEffect(() => {
    if (route.name === "field") {
      const f = data.find((x) => x.slug === route.slug);
      if (f) setOpen((s) => new Set(s).add("f:" + f.name));
    } else if (route.name === "discipline") {
      for (const f of data) {
        const d = f.disciplines.find((x) => x.key === route.key);
        if (d) {
          setOpen((s) => new Set(s).add("f:" + f.name).add("d:" + d.key));
          break;
        }
      }
    } else if (route.name === "concept") {
      for (const f of data) {
        for (const d of f.disciplines) {
          if (d.items.some((e) => e.i === route.id)) {
            setOpen((s) => new Set(s).add("f:" + f.name).add("d:" + d.key));
            return;
          }
        }
      }
    }
  }, [route, data]);

  const toggle = (key) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  return (
    <nav className="tree">
      {data.map((f) => {
        const fOpen = open.has("f:" + f.name);
        return (
          <div className="tree-field" key={f.name}>
            <div className="tree-row field-row" style={{ "--field": f.color }}>
              <button
                className="tree-caret"
                onClick={() => toggle("f:" + f.name)}
                aria-expanded={fOpen}
              >
                {fOpen ? "▾" : "▸"}
              </button>
              <a
                className={
                  "tree-label" +
                  (route.name === "field" && route.slug === f.slug
                    ? " current"
                    : "")
                }
                href={href.field(f.slug)}
              >
                <span className="field-emoji">{f.emoji}</span>
                {f.name}
                <span className="tree-count">{f.count}</span>
              </a>
            </div>
            {fOpen && (
              <div className="tree-children">
                {f.disciplines.map((d) => {
                  const dOpen = open.has("d:" + d.key);
                  return (
                    <div className="tree-disc" key={d.key}>
                      <div className="tree-row disc-row" style={{ "--field": f.color }}>
                        <button
                          className="tree-caret"
                          onClick={() => toggle("d:" + d.key)}
                          aria-expanded={dOpen}
                        >
                          {dOpen ? "▾" : "▸"}
                        </button>
                        <a
                          className={
                            "tree-label" +
                            (route.name === "discipline" && route.key === d.key
                              ? " current"
                              : "")
                          }
                          href={href.discipline(d.key)}
                        >
                          {d.name}
                          <span className="tree-count">{d.items.length}</span>
                        </a>
                      </div>
                      {dOpen && (
                        <ul className="tree-leaves">
                          {d.items.map((e) => (
                            <li key={e.i}>
                              <a
                                className={
                                  "tree-leaf" +
                                  (route.name === "concept" && route.id === e.i
                                    ? " current"
                                    : "") +
                                  (e.r ? " rich" : "")
                                }
                                href={href.concept(e)}
                              >
                                {e.n}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

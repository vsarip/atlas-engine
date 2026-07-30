import React, { useMemo, useState } from "react";
import { ALL, fieldMeta } from "../data.js";
import { href } from "../router.js";

// Alphabetical A–Z index of every concept, jump-linked by first letter.
export default function IndexList() {
  const groups = useMemo(() => {
    const map = new Map();
    for (const e of [...ALL].sort((a, b) => a.n.localeCompare(b.n))) {
      let letter = e.n[0].toUpperCase();
      if (!/[A-Z]/.test(letter)) letter = "#";
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter).push(e);
    }
    return map;
  }, []);

  const letters = [...groups.keys()].sort((a, b) =>
    a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)
  );
  const [active, setActive] = useState(letters[0]);

  return (
    <div className="index-list">
      <div className="alpha-bar">
        {letters.map((l) => (
          <button
            key={l}
            className={"alpha" + (l === active ? " active" : "")}
            onClick={() => {
              setActive(l);
              document
                .getElementById("alpha-" + l)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="index-scroll">
        {letters.map((l) => (
          <section key={l} id={"alpha-" + l} className="index-group">
            <h4 className="index-letter">{l}</h4>
            <ul>
              {groups.get(l).map((e) => {
                const fm = fieldMeta(e.f);
                return (
                  <li key={e.i}>
                    <a className="index-item" href={href.concept(e)}>
                      <span
                        className="hit-dot"
                        style={{ background: fm.color }}
                      />
                      <span className="index-name">{e.n}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

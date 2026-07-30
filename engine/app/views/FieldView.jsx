import React from "react";
import { fieldBySlug } from "../data.js";
import { href } from "../router.js";
import { str } from "../config.js";

// One field -> a grid of its disciplines (drill down to entry lists).
export default function FieldView({ slug }) {
  const field = fieldBySlug(slug);
  if (!field) return <NotFound what={str("group", 1)} />;
  const total = field.disciplines.reduce((n, d) => n + d.items.length, 0);

  return (
    <div className="field-view" style={{ "--field": field.color }}>
      <nav className="crumbs">
        <a href={href.home()}>Home</a> <span>/</span>{" "}
        <span className="crumb-current">
          {field.emoji} {field.name}
        </span>
      </nav>
      <header className="view-head">
        <h1 style={{ color: field.color }}>
          {field.emoji} {field.name}
        </h1>
        <p className="view-sub">
          {total} {str("entity", total)} across {field.disciplines.length}{" "}
          {str("subgroup", field.disciplines.length)}.
        </p>
      </header>
      <div className="disc-grid">
        {field.disciplines.map((d) => (
          <a
            key={d.key}
            className="disc-card"
            href={href.discipline(d.key)}
            style={{ "--field": field.color }}
          >
            <h3>{d.name}</h3>
            <span className="disc-count">
              {d.items.length} {str("entity", d.items.length)}
            </span>
            <ul className="disc-peek">
              {d.items.slice(0, 4).map((e) => (
                <li key={e.i}>{e.n}</li>
              ))}
              {d.items.length > 4 && <li className="more">+{d.items.length - 4} more…</li>}
            </ul>
          </a>
        ))}
      </div>
    </div>
  );
}

function NotFound({ what }) {
  return (
    <div className="notfound">
      <h1>That {what} doesn’t exist.</h1>
      <a href={href.home()}>← Back to the atlas</a>
    </div>
  );
}

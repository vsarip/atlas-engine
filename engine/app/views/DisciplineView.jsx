import React from "react";
import { disciplineByKey } from "../data.js";
import { href } from "../router.js";
import { str } from "../config.js";
import ConceptCard from "../components/ConceptCard.jsx";

// One discipline -> the full grid of its entry cards.
export default function DisciplineView({ routeKey }) {
  const { field, discipline } = disciplineByKey(routeKey);
  if (!discipline) {
    return (
      <div className="notfound">
        <h1>That {str("subgroup", 1)} doesn’t exist.</h1>
        <a href={href.home()}>← Back to the atlas</a>
      </div>
    );
  }
  return (
    <div className="discipline-view" style={{ "--field": field.color }}>
      <nav className="crumbs">
        <a href={href.home()}>Home</a> <span>/</span>{" "}
        <a href={href.field(field.slug)}>
          {field.emoji} {field.name}
        </a>{" "}
        <span>/</span> <span className="crumb-current">{discipline.name}</span>
      </nav>
      <header className="view-head">
        <h1 style={{ color: field.color }}>{discipline.name}</h1>
        <p className="view-sub">
          {discipline.items.length} {str("entity", discipline.items.length)}
        </p>
      </header>
      <div className="card-grid">
        {discipline.items.map((e) => (
          <ConceptCard key={e.i} entry={e} />
        ))}
      </div>
    </div>
  );
}

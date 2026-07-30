import React from "react";
import { Statement } from "../richtext.jsx";
import { fieldMeta, typeBadge } from "../data.js";
import { getConfig } from "../config.js";
import { href } from "../router.js";

// A single entry tile: name, rendered statement, meta chips, rich badge.
export default function ConceptCard({ entry, showField = false }) {
  const fm = fieldMeta(entry.f);
  const cardBadge = (getConfig().strings || {}).richBadge || "✦ interactive";
  return (
    <a
      className="concept-card"
      href={href.concept(entry)}
      style={{ "--field": fm.color }}
    >
      <div className="card-head">
        <span className="card-type" title={entry.t}>
          {typeBadge(entry.t)} {entry.t}
        </span>
        {entry.r ? <span className="card-rich">{cardBadge}</span> : null}
      </div>
      <h3 className="card-name">{entry.n}</h3>
      <div className="card-statement">
        <Statement entry={entry} />
      </div>
      <div className="card-foot">
        {showField && (
          <span className="chip chip-field">
            {fm.emoji} {entry.f}
          </span>
        )}
        <span className="chip">{entry.d}</span>
      </div>
    </a>
  );
}

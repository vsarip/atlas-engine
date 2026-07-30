import React, { useEffect, useState } from "react";
import { getById, loadShard, fieldMeta, typeBadge, slugify } from "../data.js";
import { href } from "../router.js";
import { getConfig, str } from "../config.js";
import { Statement, Math as Tex } from "../richtext.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

// Full detail page for one entry. The header (crumbs, tags, title, statement)
// is structural and fixed; everything below it is the atlas's config.sections
// array, each section wrapped in an ErrorBoundary so malformed content can't
// take down the page.
export default function ConceptView({ id }) {
  const cfg = getConfig();
  const entry = getById(id);
  const [shard, setShard] = useState(undefined); // undefined=loading, null=none

  useEffect(() => {
    let live = true;
    setShard(undefined);
    loadShard(id).then((s) => live && setShard(s));
    return () => {
      live = false;
    };
  }, [id]);

  if (!entry) {
    return (
      <div className="notfound">
        <h1>{cap(str("entity", 1))} not found.</h1>
        <a href={href.home()}>← Back to the atlas</a>
      </div>
    );
  }

  const fm = fieldMeta(entry.f);
  const c = shard || {};

  return (
    <article className="concept" style={{ "--field": fm.color }}>
      <nav className="crumbs">
        <a href={href.home()}>Home</a> <span>/</span>{" "}
        <a href={href.field(fm.slug)}>
          {fm.emoji} {entry.f}
        </a>{" "}
        <span>/</span>{" "}
        <a href={href.discipline(fm.slug + "/" + slugify(entry.d))}>{entry.d}</a>
      </nav>

      <header className="concept-head">
        <div className="concept-tags">
          <span className="tag tag-type">
            {typeBadge(entry.t)} {entry.t}
          </span>
          <span className="tag">{entry.d}</span>
        </div>
        <h1 className="concept-title">{entry.n}</h1>
        <div className="concept-eq">
          {c.latex ? <Tex tex={c.latex} display /> : <Statement entry={entry} />}
        </div>
      </header>

      {shard === undefined && entry.r && (
        <div className="loading-note">
          {(cfg.strings || {}).loadingNote || "Loading the full explainer…"}
        </div>
      )}

      {cfg.sections.map((S, i) => (
        <ErrorBoundary key={i} label={S.displayName || S.name}>
          <S entry={entry} shard={c} />
        </ErrorBoundary>
      ))}

      {!entry.r && (
        <p className="lean-note">
          {(cfg.strings || {}).leanNote ||
            `A full interactive explainer for this ${str(
              "entity",
              1
            )} is on the way. In the meantime, here’s its statement and how it fits into ${
              entry.f
            }.`}
        </p>
      )}
    </article>
  );
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

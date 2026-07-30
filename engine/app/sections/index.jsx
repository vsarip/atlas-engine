import React from "react";
import { getById } from "../data.js";
import { RichText } from "../richtext.jsx";
import Widget from "../widgets/index.jsx";
import ConceptCard from "../components/ConceptCard.jsx";

// Detail-page section renderers. The atlas config lists which of these (plus
// any atlas-local ones) render, in order: config.sections = [Intuition, ...].
// Contract: a section is ({ entry, shard }) => JSX | null — return null when
// its data is absent. `entry` is the compact catalog record; `shard` is the
// enrichment payload ({} while loading / when the entry has none).

// Titled section frame, exported for atlas-local sections to reuse.
export function Section({ title, icon, children }) {
  return (
    <section className="concept-section">
      <h2 className="section-h">
        <span className="section-icon" aria-hidden>
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Intuition({ shard }) {
  if (!shard.intuition) return null;
  return (
    <Section title="Intuition" icon="💡">
      <RichText text={shard.intuition} className="prose" />
    </Section>
  );
}

export function Why({ shard }) {
  if (!shard.why) return null;
  return (
    <Section title="Why it matters" icon="🌟">
      <RichText text={shard.why} className="prose" />
    </Section>
  );
}

export function WidgetSection({ shard }) {
  if (!shard.widget) return null;
  return <Widget widget={shard.widget} />;
}

export function WorkedExample({ shard }) {
  const ex = shard.example;
  if (!ex) return null;
  return (
    <Section title="Worked example" icon="🔢">
      <div className="worked">
        {ex.setup && (
          <p className="worked-setup">
            <RichText text={ex.setup} />
          </p>
        )}
        {Array.isArray(ex.steps) && (
          <ol className="worked-steps">
            {ex.steps.map((s, i) => (
              <li key={i}>
                <RichText text={s} />
              </li>
            ))}
          </ol>
        )}
        {ex.result && (
          <p className="worked-result">
            <RichText text={ex.result} />
          </p>
        )}
      </div>
    </Section>
  );
}

export function Applications({ shard }) {
  if (!Array.isArray(shard.applications) || shard.applications.length === 0)
    return null;
  return (
    <Section title="In the real world" icon="🌍">
      <ul className="applications">
        {shard.applications.map((a, i) => (
          <li key={i}>
            <RichText text={a} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function History({ shard }) {
  if (!shard.history) return null;
  return (
    <Section title="History & people" icon="📜">
      <RichText text={shard.history} className="prose" />
    </Section>
  );
}

export function Derivation({ shard }) {
  if (!Array.isArray(shard.derivation) || shard.derivation.length === 0)
    return null;
  return (
    <details className="derivation">
      <summary>
        <span className="deeper-icon">🧠</span> Deeper dive — where it comes
        from
      </summary>
      <ol className="derivation-steps">
        {shard.derivation.map((s, i) => (
          <li key={i}>
            <RichText text={s} />
          </li>
        ))}
      </ol>
    </details>
  );
}

export function Related({ shard, title = "Related concepts" }) {
  if (!Array.isArray(shard.related) || shard.related.length === 0) return null;
  const items = shard.related.map(getById).filter(Boolean);
  if (!items.length) return null;
  return (
    <section className="concept-section">
      <h2 className="section-h">
        <span className="section-icon" aria-hidden>
          🔗
        </span>
        {title}
      </h2>
      <div className="card-grid related-grid">
        {items.map((e) => (
          <ConceptCard key={e.i} entry={e} showField />
        ))}
      </div>
    </section>
  );
}

export function Links({ entry, shard }) {
  const all = [
    ...(shard.links || []),
    {
      label: "Wikipedia",
      url:
        "https://en.wikipedia.org/wiki/Special:Search?search=" +
        encodeURIComponent(entry.n),
    },
  ];
  return (
    <div className="links-row">
      {all.map((l, i) => (
        <a
          key={i}
          className="ext-link"
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {l.label} ↗
        </a>
      ))}
    </div>
  );
}

// Generic labeled-rows fact table. Fact-entity atlases map their snapshot
// data into rows and wrap this in a small atlas-local section:
//   rows: [{ label, value, asOf?, src? }]
export function FactsTable({ rows, footnote }) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return (
    <div className="facts-table-wrap">
      <table className="facts-table">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <th scope="row">{r.label}</th>
              <td>
                {r.value}
                {r.asOf ? <span className="facts-asof"> (as of {r.asOf})</span> : null}
                {r.src ? <sup className="facts-src">{r.src}</sup> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {footnote ? <p className="facts-footnote">{footnote}</p> : null}
    </div>
  );
}

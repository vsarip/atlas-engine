import React, { useMemo } from "react";
import { fields, tree, ALL } from "../data.js";
import { href } from "../router.js";
import { getConfig, str } from "../config.js";
import ConceptCard from "../components/ConceptCard.jsx";

// Landing page: hero, field entry cards, and an "entry of the day".
export default function HomeView() {
  const cfg = getConfig();
  const fs = fields();
  const data = tree();
  const potd = useMemo(pickOfTheDay, []);

  const tagline =
    typeof cfg.hero.tagline === "function"
      ? cfg.hero.tagline(ALL.length)
      : cfg.hero.tagline;

  return (
    <div className="home">
      <section className="hero">
        <h1 className="hero-title">
          {cfg.hero.titlePrefix || "The"}{" "}
          <span className="grad">{cfg.name}</span>
        </h1>
        <p className="hero-sub">{tagline}</p>
      </section>

      <section className="field-grid">
        {fs.map((f) => {
          const discCount =
            data.find((x) => x.name === f.name)?.disciplines.length || 0;
          return (
            <a
              key={f.name}
              className="field-card"
              href={href.field(f.slug)}
              style={{ "--field": f.color }}
            >
              <span className="field-card-emoji">{f.emoji}</span>
              <span className="field-card-name">{f.name}</span>
              <span className="field-card-meta">
                {f.count} {str("entity", f.count)} · {discCount}{" "}
                {str("subgroup", discCount)}
              </span>
            </a>
          );
        })}
      </section>

      {potd && (
        <section className="cotd">
          <h2 className="section-title">
            ✦ {(cfg.strings || {}).ofTheDay || `${cap(str("entity", 1))} of the day`}
          </h2>
          <ConceptCard entry={potd} showField />
        </section>
      )}
    </div>
  );
}

// Deterministic per-day pick (prefers enriched entries).
function pickOfTheDay() {
  if (!ALL.length) return null;
  const day = Math.floor(Date.now() / 86400000);
  const rich = ALL.filter((e) => e.r);
  const pool = rich.length ? rich : ALL;
  return pool[day % pool.length];
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

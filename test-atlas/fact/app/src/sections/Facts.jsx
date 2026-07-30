import React from "react";
import { Section, FactsTable } from "../engine/sections/index.jsx";
import { RichText } from "../engine/richtext.jsx";

// Atlas-local sections: map the shard's facts block onto the engine's
// generic FactsTable, plus a simple prose overview.

export function Facts({ shard }) {
  if (!shard.facts) return null;
  const rows = Object.entries(shard.facts).map(([label, v]) => ({
    label,
    value: String(v && v.v !== undefined ? v.v : v),
    asOf: v && v.year,
    src: v && v.src,
  }));
  return (
    <Section title="At a glance" icon="📊">
      <FactsTable rows={rows} footnote="WB = World Bank (fixture data)" />
    </Section>
  );
}

export function Overview({ shard }) {
  if (!shard.overview) return null;
  return (
    <Section title="Overview" icon="🌍">
      <RichText text={shard.overview} className="prose" />
    </Section>
  );
}

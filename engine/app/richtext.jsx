import React, { useMemo } from "react";
import { getConfig } from "./config.js";

// Text rendering over the atlas's math adapter (config.math). Prose fields
// support inline math (adapter-defined, e.g. $…$ under KaTeX) plus a minimal
// markdown subset: **strong** and *emphasis* in non-math text runs.

// Single math/LaTeX string via the adapter.
export function Math(props) {
  const A = getConfig().math.Math;
  return <A {...props} />;
}

// Prose that may contain inline math and markdown emphasis.
export function RichText({ text, className = "" }) {
  if (!text) return null;
  const math = getConfig().math;
  const nodes = useMemo(() => math.parse(text), [text, math]);
  return (
    <span className={className}>
      {nodes.map((n, i) =>
        n.math ? <Math key={i} tex={n.value} /> : <Emphasis key={i} text={n.value} />
      )}
    </span>
  );
}

// Display equation, choosing LaTeX when present else the Unicode statement.
export function Statement({ entry, display = true }) {
  if (entry.x) return <Math tex={entry.x} display={display} />;
  return <span className="statement-unicode">{entry.u}</span>;
}

// Minimal emphasis renderer: **strong** then *em*, conservative delimiters
// (content must hug the asterisks) so stray multiplication signs pass through.
const STRONG = /\*\*(?!\s)([^*]+?)(?<!\s)\*\*/;
const EM = /\*(?!\s)([^*]+?)(?<!\s)\*/;

function Emphasis({ text }) {
  return <>{emphasize(text)}</>;
}

function emphasize(text, key = 0) {
  for (const [re, Tag] of [
    [STRONG, "strong"],
    [EM, "em"],
  ]) {
    const m = re.exec(text);
    if (m) {
      const El = Tag;
      return [
        ...(m.index > 0 ? emphasize(text.slice(0, m.index), key) : []),
        <El key={key + "e" + m.index}>{emphasize(m[1], key + 1)}</El>,
        ...emphasize(text.slice(m.index + m[0].length), key + 2),
      ];
    }
  }
  return text ? [text] : [];
}

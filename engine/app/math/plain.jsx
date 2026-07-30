import React from "react";

// No-math adapter for atlases with no formulas (e.g. fact-entity atlases).
// `$` has no special meaning in prose, LaTeX never renders, and KaTeX stays
// out of the bundle entirely.

function Math({ tex, className = "" }) {
  return <span className={"statement-unicode " + className}>{tex}</span>;
}

function parse(text) {
  return [{ math: false, value: text }];
}

export const plainMath = { Math, parse };

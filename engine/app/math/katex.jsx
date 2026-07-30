import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// KaTeX math adapter. This file is the ONLY place the engine touches the
// `katex` package — an atlas that imports the plain adapter instead never
// bundles KaTeX at all (~1 MB saved).

// Render a single LaTeX string. Never throws — falls back to raw text.
function Math({ tex, display = false, className = "" }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        trust: false,
      });
    } catch {
      return null;
    }
  }, [tex, display]);
  if (html == null) return <span className="math-fallback">{tex}</span>;
  return (
    <span
      className={(display ? "math-display " : "math-inline ") + className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// `\$` is a literal dollar sign: it renders as "$" in text and stays `\$`
// inside math so KaTeX prints it. Only unescaped `$` toggles math mode; a
// lone unterminated `$` falls back to plain text.
function parse(text) {
  const out = [];
  let value = "";
  let inMath = false;
  const push = () => {
    if (value) out.push({ math: inMath, value });
    value = "";
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\\" && text[i + 1] === "$") {
      value += inMath ? "\\$" : "$";
      i++;
    } else if (ch === "$") {
      push();
      inMath = !inMath;
    } else {
      value += ch;
    }
  }
  if (inMath) out.push({ math: false, value: "$" + value });
  else push();
  return out;
}

export const katexMath = { Math, parse };

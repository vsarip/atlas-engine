import React, { useMemo, useState } from "react";
import Slider from "./Slider.jsx";
import { Math as Tex } from "../richtext.jsx";

// The universal workhorse: sliders for each variable + a live-computed result.
// params = {
//   vars: [{ sym, label, min, max, step, value, unit }],
//   expr: "0.5*m*v*v",          // JS expression over the var syms (authored data)
//   result: { sym, label, unit, precision },
//   latex: "KE = \\tfrac12 m v^2"
// }
export default function FormulaExplorer({ params }) {
  const { vars = [], expr, result = {}, latex } = params;
  const [vals, setVals] = useState(() =>
    Object.fromEntries(vars.map((v) => [v.sym, v.value ?? (v.min + v.max) / 2]))
  );

  const compute = useMemo(() => {
    try {
      // eslint-disable-next-line no-new-func
      return new Function(...vars.map((v) => v.sym), `return (${expr});`);
    } catch {
      return null;
    }
  }, [expr, vars]);

  let out = NaN;
  if (compute) {
    try {
      out = compute(...vars.map((v) => vals[v.sym]));
    } catch {
      out = NaN;
    }
  }

  // Scale bar relative to the result's range at slider extremes (rough).
  const extent = useMemo(() => estimateMax(compute, vars), [compute, vars]);
  const pct = extent > 0 && isFinite(out) ? clamp((out / extent) * 100, 0, 100) : 0;

  return (
    <div className="w-formula">
      {latex && (
        <div className="w-formula-eq">
          <Tex tex={latex} display />
        </div>
      )}
      <div className="w-sliders">
        {vars.map((v) => (
          <Slider
            key={v.sym}
            {...v}
            value={vals[v.sym]}
            onChange={(nv) => setVals((s) => ({ ...s, [v.sym]: nv }))}
          />
        ))}
      </div>
      <div className="w-result">
        <div className="w-result-bar">
          <span style={{ width: pct + "%" }} />
        </div>
        <div className="w-result-value">
          <span className="w-result-label">
            {result.label || "Result"}
            {result.sym ? <em> ({result.sym})</em> : null}
          </span>
          <span className="w-result-number">
            {formatResult(out, result.precision)}
            {result.unit ? <span className="w-result-unit"> {result.unit}</span> : null}
          </span>
        </div>
      </div>
    </div>
  );
}

function estimateMax(compute, vars) {
  if (!compute) return 0;
  try {
    return Math.abs(compute(...vars.map((v) => v.max)));
  } catch {
    return 0;
  }
}
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

function formatResult(v, precision = 3) {
  if (!isFinite(v)) return "—";
  if (v !== 0 && (Math.abs(v) >= 1e5 || Math.abs(v) < 1e-3))
    return v.toExponential(precision);
  const p = Math.pow(10, precision);
  return (Math.round(v * p) / p).toLocaleString();
}

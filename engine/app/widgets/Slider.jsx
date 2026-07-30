import React from "react";

// Labeled range slider used by most widgets.
export default function Slider({ label, sym, value, min, max, step, unit, onChange }) {
  return (
    <label className="wslider">
      <span className="wslider-top">
        <span className="wslider-label">
          {sym ? <em className="wslider-sym">{sym}</em> : null}
          {label}
        </span>
        <span className="wslider-val">
          {fmt(value)}
          {unit ? <span className="wslider-unit"> {unit}</span> : null}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? (max - min) / 100}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

function fmt(v) {
  if (Math.abs(v) >= 1000 || (v !== 0 && Math.abs(v) < 0.01))
    return v.toPrecision(3);
  return Math.round(v * 1000) / 1000;
}

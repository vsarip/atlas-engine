import React, { useState } from "react";
import Slider from "./Slider.jsx";
import { useCanvas, themeColor } from "./canvasKit.js";

// Normal-distribution explorer: adjust mean & standard deviation, watch the
// bell curve and the 68/95/99.7 shaded bands move.
export default function Distribution({ params = {} }) {
  const [mu, setMu] = useState(params.mu ?? 0);
  const [sd, setSd] = useState(params.sd ?? 1);
  const color = themeColor("--field", "#8b5cf6");

  const xmin = -6;
  const xmax = 6;
  const pdf = (x) =>
    Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));

  const ref = useCanvas(
    (ctx, w, h) => {
      const X = (x) => ((x - xmin) / (xmax - xmin)) * w;
      const peak = 1 / (Math.max(0.35, sd) * Math.sqrt(2 * Math.PI));
      const Y = (y) => h - 20 - (y / (peak * 1.05)) * (h - 34);

      // baseline
      ctx.strokeStyle = themeColor("--axis", "rgba(140,150,170,0.5)");
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, h - 20);
      ctx.lineTo(w, h - 20);
      ctx.stroke();

      // ±1σ shaded band
      shade(ctx, X, Y, pdf, mu - sd, mu + sd, addAlpha(color, 0.28), h);
      shade(ctx, X, Y, pdf, mu - 2 * sd, mu - sd, addAlpha(color, 0.16), h);
      shade(ctx, X, Y, pdf, mu + sd, mu + 2 * sd, addAlpha(color, 0.16), h);

      // curve
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 300; i++) {
        const x = xmin + ((xmax - xmin) * i) / 300;
        const px = X(x);
        const py = Y(pdf(x));
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();

      // mean line
      ctx.strokeStyle = addAlpha(color, 0.7);
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(X(mu), Y(pdf(mu)));
      ctx.lineTo(X(mu), h - 20);
      ctx.stroke();
      ctx.setLineDash([]);
    },
    [mu, sd, color]
  );

  return (
    <div className="w-dist">
      <canvas className="w-canvas" ref={ref} />
      <div className="w-sliders two-col">
        <Slider sym="μ" label="mean" value={mu} min={-4} max={4} step={0.1} onChange={setMu} />
        <Slider sym="σ" label="std. dev." value={sd} min={0.35} max={3} step={0.05} onChange={setSd} />
      </div>
      <p className="w-hint">
        The shaded bands are ±1σ and ±2σ — about 68% and 95% of all outcomes.
        Change σ and the curve widens or sharpens, but the area stays exactly 1.
      </p>
    </div>
  );
}
function shade(ctx, X, Y, pdf, a, b, fill, h) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(X(a), h - 20);
  for (let i = 0; i <= 60; i++) {
    const x = a + ((b - a) * i) / 60;
    ctx.lineTo(X(x), Y(pdf(x)));
  }
  ctx.lineTo(X(b), h - 20);
  ctx.closePath();
  ctx.fill();
}
function addAlpha(hex, al) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${al})`;
}

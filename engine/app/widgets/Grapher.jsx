import React, { useMemo, useState } from "react";
import Slider from "./Slider.jsx";
import { useCanvas, themeColor } from "./canvasKit.js";

// Plots y = f(x; params) with live parameter sliders.
// params = {
//   fn: "Math.sin(k*x)",  params: [{sym,label,min,max,step,value}],
//   xmin, xmax, ymin, ymax, samples
// }
export default function Grapher({ params }) {
  const {
    fn,
    params: knobs = [],
    xmin = -6.283,
    xmax = 6.283,
    ymin = -1.5,
    ymax = 1.5,
    samples = 240,
  } = params;
  const [vals, setVals] = useState(() =>
    Object.fromEntries(knobs.map((k) => [k.sym, k.value ?? (k.min + k.max) / 2]))
  );

  const compute = useMemo(() => {
    try {
      // eslint-disable-next-line no-new-func
      return new Function("x", ...knobs.map((k) => k.sym), `return (${fn});`);
    } catch {
      return null;
    }
  }, [fn, knobs]);

  const color = themeColor("--field", "#2f6df6");

  const ref = useCanvas(
    (ctx, w, h) => {
      const grid = themeColor("--grid", "rgba(140,150,170,0.18)");
      const axis = themeColor("--axis", "rgba(140,150,170,0.5)");
      const X = (x) => ((x - xmin) / (xmax - xmin)) * w;
      const Y = (y) => h - ((y - ymin) / (ymax - ymin)) * h;

      // grid
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      for (let gx = Math.ceil(xmin); gx <= xmax; gx++) {
        ctx.beginPath();
        ctx.moveTo(X(gx), 0);
        ctx.lineTo(X(gx), h);
        ctx.stroke();
      }
      for (let gy = Math.ceil(ymin); gy <= ymax; gy++) {
        ctx.beginPath();
        ctx.moveTo(0, Y(gy));
        ctx.lineTo(w, Y(gy));
        ctx.stroke();
      }
      // axes
      ctx.strokeStyle = axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, Y(0));
      ctx.lineTo(w, Y(0));
      ctx.moveTo(X(0), 0);
      ctx.lineTo(X(0), h);
      ctx.stroke();

      if (!compute) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      let started = false;
      const args = knobs.map((k) => vals[k.sym]);
      for (let i = 0; i <= samples; i++) {
        const x = xmin + ((xmax - xmin) * i) / samples;
        let y;
        try {
          y = compute(x, ...args);
        } catch {
          y = NaN;
        }
        if (!isFinite(y)) {
          started = false;
          continue;
        }
        const px = X(x);
        const py = Y(clamp(y, ymin - 5, ymax + 5));
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    },
    [vals, compute, xmin, xmax, ymin, ymax, samples, color]
  );

  return (
    <div className="w-grapher">
      <canvas className="w-canvas" ref={ref} />
      {knobs.length > 0 && (
        <div className="w-sliders">
          {knobs.map((k) => (
            <Slider
              key={k.sym}
              {...k}
              value={vals[k.sym]}
              onChange={(nv) => setVals((s) => ({ ...s, [k.sym]: nv }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

import { useEffect, useRef } from "react";

// Hi-DPI canvas + optional animation loop. `draw(ctx, w, h, t)` is called each
// frame (t = seconds since mount) when `animate`, else on resize/deps change.
export function useCanvas(draw, deps = [], { animate = false } = {}) {
  const ref = useRef(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let start = performance.now();
    let disposed = false;

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    }

    let dims = size();
    const onResize = () => {
      dims = size();
      if (!animate) render();
    };
    window.addEventListener("resize", onResize);

    function render() {
      const t = (performance.now() - start) / 1000;
      ctx.clearRect(0, 0, dims.w, dims.h);
      drawRef.current(ctx, dims.w, dims.h, t);
    }

    if (animate) {
      const loop = () => {
        if (disposed) return;
        render();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    } else {
      render();
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

// Read a CSS custom property / theme color from the document.
export function themeColor(name, fallback) {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

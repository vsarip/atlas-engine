import React from "react";
import { getConfig } from "../config.js";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import FormulaExplorer from "./FormulaExplorer.jsx";
import Grapher from "./Grapher.jsx";
import Distribution from "./Distribution.jsx";

// Engine-provided generic widgets. The atlas merges these with its own in
// atlas.config.jsx:  widgets: { ...genericWidgets, "my-widget": MyWidget }
// Content JSON references widgets by `widget.type` string.
export const genericWidgets = {
  "formula-explorer": FormulaExplorer,
  grapher: Grapher,
  distribution: Distribution,
};

export function hasWidget(type) {
  return Boolean((getConfig().widgets || {})[type]);
}

// Renders the widget for a content `widget` block, with a titled frame.
// The body sits inside an ErrorBoundary: malformed params degrade to an
// inline error instead of white-screening the app.
export default function Widget({ widget }) {
  if (!widget || !widget.type) return null;
  const Comp = (getConfig().widgets || {})[widget.type];
  if (!Comp) return null;
  return (
    <div className="widget-frame">
      <div className="widget-head">
        <span className="widget-badge">✦ Interactive</span>
        {widget.title ? <h3 className="widget-title">{widget.title}</h3> : null}
      </div>
      <div className="widget-body">
        <ErrorBoundary label={widget.type}>
          <Comp params={widget.params || {}} />
        </ErrorBoundary>
      </div>
    </div>
  );
}

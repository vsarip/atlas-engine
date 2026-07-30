import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/engine.css";
import { setConfig } from "./config.js";
import { loadCatalog } from "./data.js";
import AppShell from "./AppShell.jsx";

// Entry point called by the atlas's main.jsx: boot(atlasConfig).
// The catalog ships as a classic <script> (window.ATLAS_INDEX) so it loads
// identically from file://, dev, and web. Inject it, wait, then mount React.
export function boot(config) {
  setConfig(config);
  document.title = config.name;
  const root = createRoot(document.getElementById("root"));
  loadCatalog()
    .then(() => root.render(<AppShell />))
    .catch((err) => {
      root.render(
        <div className="fatal">
          <h1>Could not load the data.</h1>
          <p>{String(err)}</p>
          <p>
            Make sure the <code>data/</code> folder sits next to{" "}
            <code>index.html</code>.
          </p>
        </div>
      );
    });
}

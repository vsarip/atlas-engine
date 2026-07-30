import React, { useEffect, useState } from "react";
import { useRoute, href, navigate } from "./router.js";
import { getConfig, str } from "./config.js";
import Sidebar from "./components/Sidebar.jsx";
import HomeView from "./views/HomeView.jsx";
import FieldView from "./views/FieldView.jsx";
import DisciplineView from "./views/DisciplineView.jsx";
import SearchView from "./views/SearchView.jsx";
import ConceptView from "./views/ConceptView.jsx";
import { META } from "./data.js";

function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("atlas-theme") || "dark"
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("atlas-theme", theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "dark" ? "light" : "dark"))];
}

export default function AppShell() {
  const cfg = getConfig();
  const route = useRoute();
  const [theme, toggleTheme] = useTheme();
  const [navOpen, setNavOpen] = useState(false);

  // close mobile nav on route change
  useEffect(() => setNavOpen(false), [route]);

  const features = cfg.features || {};

  return (
    <div className={"app" + (navOpen ? " nav-open" : "")}>
      <header className="topbar">
        <button
          className="hamburger"
          aria-label="Toggle navigation"
          onClick={() => setNavOpen((v) => !v)}
        >
          ☰
        </button>
        <a className="brand" href={href.home()}>
          <span className="brand-mark" aria-hidden>
            {cfg.brand.mark}
          </span>
          <span className="brand-text">
            {cfg.brand.nameParts[0]}
            <span className="brand-accent">{cfg.brand.nameParts[1]}</span>
          </span>
        </a>
        <div className="topbar-spacer" />
        {features.randomButton !== false && (
          <button
            className="dice"
            title={"Random " + str("entity", 1)}
            onClick={randomEntry}
          >
            🎲 <span className="dice-label">Surprise me</span>
          </button>
        )}
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </header>

      <div className="layout">
        <Sidebar route={route} />
        <main className="main">
          <View route={route} />
          <footer className="site-footer">
            <span>
              {META?.count?.toLocaleString()} {str("entity", META?.count ?? 2)}{" "}
              across {META?.fields?.length} {str("group", META?.fields?.length ?? 2)}{" "}
              · {cfg.name}
            </span>
          </footer>
        </main>
      </div>
      <div className="scrim" onClick={() => setNavOpen(false)} />
    </div>
  );
}

function View({ route }) {
  switch (route.name) {
    case "field":
      return <FieldView slug={route.slug} />;
    case "discipline":
      return <DisciplineView routeKey={route.key} />;
    case "concept":
      return <ConceptView id={route.id} />;
    case "search":
      return <SearchView query={route.query} />;
    default:
      return <HomeView />;
  }
}

function randomEntry() {
  const arr = window.ATLAS_INDEX || [];
  if (!arr.length) return;
  const e = arr[Math.floor(Math.random() * arr.length)];
  navigate(href.concept(e));
}

import { useEffect, useState } from "react";

// Hash-only routing so everything works from file://.
// Routes:
//   #/                       -> { name: "home" }
//   #/field/<slug>           -> { name: "field", slug }
//   #/d/<field>/<disc>       -> { name: "discipline", key: "field/disc" }
//   #/c/<id>[-<slug>]        -> { name: "concept", id }
//   #/search/<query>         -> { name: "search", query }

export function parseHash(hash) {
  const h = (hash || "").replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts.length === 0) return { name: "home" };
  switch (parts[0]) {
    case "field":
      return { name: "field", slug: parts[1] || "" };
    case "d":
      return { name: "discipline", key: `${parts[1] || ""}/${parts[2] || ""}` };
    case "c": {
      const id = parseInt(parts[1] || "", 10);
      return Number.isNaN(id) ? { name: "home" } : { name: "concept", id };
    }
    case "search":
      return { name: "search", query: parts.slice(1).join("/") };
    default:
      return { name: "home" };
  }
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export const href = {
  home: () => "#/",
  field: (slug) => `#/field/${slug}`,
  discipline: (key) => `#/d/${key}`,
  concept: (e) => `#/c/${typeof e === "object" ? `${e.i}-${e.s}` : e}`,
  search: (q) => `#/search/${encodeURIComponent(q)}`,
};

export function navigate(hash) {
  if (location.hash === hash) {
    window.scrollTo(0, 0);
  } else {
    location.hash = hash;
  }
}

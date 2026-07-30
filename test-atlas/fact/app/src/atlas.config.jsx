import { plainMath } from "./engine/math/plain.jsx";
import * as S from "./engine/sections/index.jsx";
import { Facts, Overview } from "./sections/Facts.jsx";
import "./atlas.css";

// Fact-shaped fixture: no KaTeX in the bundle (plainMath + no katex import,
// and package.json has no katex dependency), fact table first, local sections.
export default {
  name: "Fact Fixture Atlas",
  brand: { mark: "🌍", nameParts: ["Fact", "Fixture"] },
  strings: {
    entity: ["country", "countries"],
    group: ["continent", "continents"],
    subgroup: ["region", "regions"],
    richBadge: "✦ full profile",
    ofTheDay: "Country of the day",
    loadingNote: "Loading the full profile…",
    leanNote: "A full profile for this country is on the way.",
  },
  hero: {
    tagline: (n) => `${n} fixture countries exercising the fact-shaped engine path.`,
  },
  taxonomy: {
    Europe: { slug: "europe", color: "#2f6df6", emoji: "🏰" },
    Oceania: { slug: "oceania", color: "#0ea5e9", emoji: "🌊" },
  },
  typeBadges: { "UN Member State": "🌐", Territory: "🏝️" },
  math: plainMath,
  search: { extraFields: [{ key: "a", weight: 8 }] },
  sections: [Facts, Overview, S.Related, S.Links],
  widgets: {},
  features: { randomButton: true },
};

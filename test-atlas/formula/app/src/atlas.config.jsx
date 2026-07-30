import { katexMath } from "./engine/math/katex.jsx";
import * as S from "./engine/sections/index.jsx";
import { genericWidgets } from "./engine/widgets/index.jsx";
import "./atlas.css";

export default {
  name: "Formula Fixture Atlas",
  brand: { mark: "⚗️", nameParts: ["Formula", "Fixture"] },
  strings: {
    entity: ["concept", "concepts"],
    group: ["field", "fields"],
    subgroup: ["area", "areas"],
  },
  hero: {
    tagline: (n) => `${n} fixture concepts exercising the formula-shaped engine path.`,
  },
  taxonomy: {
    Physics: { slug: "physics", color: "#2f6df6", emoji: "⚛️" },
    Mathematics: { slug: "mathematics", color: "#8b5cf6", emoji: "📐" },
  },
  typeBadges: { Law: "§", Theorem: "∴", "Formula / Equation": "=" },
  math: katexMath,
  sections: [
    S.Intuition,
    S.Why,
    S.WidgetSection,
    S.WorkedExample,
    S.Applications,
    S.History,
    S.Derivation,
    S.Related,
    S.Links,
  ],
  widgets: { ...genericWidgets },
  features: { randomButton: true },
};

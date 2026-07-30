// Atlas configuration — the ONLY app-side file an atlas must own (plus
// atlas.css and any bespoke widgets/sections). Everything under src/engine/
// is vendored from atlas-engine: never edit it here.
import { katexMath } from "./engine/math/katex.jsx"; // or ./engine/math/plain.jsx for a no-math atlas
import * as S from "./engine/sections/index.jsx";
import { genericWidgets } from "./engine/widgets/index.jsx";
import "./atlas.css";

export default {
  name: "My Atlas",
  brand: { mark: "🧭", nameParts: ["My", "Atlas"] },
  strings: {
    entity: ["concept", "concepts"],
    group: ["field", "fields"],
    subgroup: ["area", "areas"],
  },
  hero: {
    tagline: (n) =>
      `${n.toLocaleString()} concepts — browse the tree, flip through the index, or search.`,
  },
  // field name -> { slug, color, emoji }; colors mirrored nowhere else.
  taxonomy: {
    "Example Field": { slug: "example-field", color: "#2f6df6", emoji: "🧪" },
  },
  typeBadges: { Concept: "◆" },
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

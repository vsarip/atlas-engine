// Import order matters: engine (and engine.css) first, atlas config (atlas.css) second
// so atlas overrides win equal-specificity CSS ties.
import { boot } from "./engine/boot.jsx";
import config from "./atlas.config.jsx";

boot(config);

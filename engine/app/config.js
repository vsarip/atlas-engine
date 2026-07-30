// Atlas config registry. The consuming atlas's main.jsx calls boot(config)
// (engine/boot.jsx), which stores the config here before anything renders.
// Engine modules read it at runtime via getConfig() — never at module top
// level — so there are no import cycles between engine code and the atlas's
// atlas.config.jsx.

let config = null;

export function setConfig(c) {
  config = c;
}

export function getConfig() {
  if (!config) throw new Error("atlas config not set — boot() must run first");
  return config;
}

// Pluralizing helper over config.strings entries like ["concept", "concepts"].
export function str(key, n) {
  const pair = (getConfig().strings || {})[key] || [key, key + "s"];
  return n === 1 ? pair[0] : pair[1];
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// The atlas builds to ONE self-contained index.html (JS+CSS+fonts all inlined)
// that works from file://. The data/ folder is NOT inlined -- it is copied
// verbatim from public/ and loaded via classic <script src> tags so the same
// files work identically on file://, `vite dev`, and any static host.
export default defineConfig({
  base: "./", // relative asset URLs -> works when opened from disk
  plugins: [react(), viteSingleFile()],
  build: {
    target: "es2018",
    assetsInlineLimit: 100_000_000, // inline all fonts/images into the HTML
    cssCodeSplit: false,
    chunkSizeWarningLimit: 5000,
  },
});

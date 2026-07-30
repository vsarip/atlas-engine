#!/usr/bin/env node
// Zero-dependency static web server for the built Finance Atlas site.
//
//   node tools/serve.mjs                 # serve ./site on http://localhost:8080
//   node tools/serve.mjs --port 3000     # choose a port
//   node tools/serve.mjs --dir some/dir  # serve a different folder
//   PORT=9000 node tools/serve.mjs       # port via env var
//
// The site is fully static (single index.html + a data/ folder of .js shards,
// hash-routed), so plain file serving from the web root is all that's needed.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

// -------- args --------
const args = process.argv.slice(2);
function argVal(names) {
  for (const n of names) {
    const i = args.indexOf(n);
    if (i !== -1 && args[i + 1] != null) return args[i + 1];
    const pref = args.find((a) => a.startsWith(n + "="));
    if (pref) return pref.slice(n.length + 1);
  }
  return undefined;
}
const bareNum = /^\d+$/.test(args[0] ?? "") ? args[0] : undefined; // allow: serve.mjs 3000
const PORT = Number(argVal(["--port", "-p"]) ?? bareNum ?? process.env.PORT ?? 8080);
const HOST = argVal(["--host"]) ?? process.env.HOST ?? "0.0.0.0";
const ROOT = path.resolve(REPO_ROOT, argVal(["--dir", "-d"]) ?? "site");

if (!fs.existsSync(path.join(ROOT, "index.html"))) {
  console.error(`No index.html found in ${ROOT}`);
  console.error("Build the site first:  tools\\build.cmd   (or)   tools/build.sh");
  process.exit(1);
}

// -------- mime types --------
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Cache-Control": "no-cache", ...headers });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  } catch {
    return send(res, 400, "Bad request");
  }
  if (urlPath === "/") urlPath = "/index.html";

  // Resolve inside ROOT, blocking path traversal.
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) return send(res, 403, "Forbidden");

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // Hash-routed app: unknown paths that aren't files fall back to index.html.
      if (!path.extname(urlPath)) {
        return fs.readFile(path.join(ROOT, "index.html"), (e, buf) =>
          e
            ? send(res, 404, "Not found")
            : send(res, 200, buf, { "Content-Type": MIME[".html"] })
        );
      }
      return send(res, 404, "Not found");
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Content-Length": stat.size, "Cache-Control": "no-cache" });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  const shown = HOST === "0.0.0.0" ? "localhost" : HOST;
  console.log(`Finance Atlas served from ${ROOT}`);
  console.log(`  http://${shown}:${PORT}`);
  console.log("Press Ctrl+C to stop.");
});

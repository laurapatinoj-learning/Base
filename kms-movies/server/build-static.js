#!/usr/bin/env node
"use strict";
/**
 * Genera la versión estática del juego para GitHub Pages (o cualquier hosting de archivos).
 *
 *   KMS_API_URL=https://kms-movies.onrender.com node build-static.js dist
 *
 * Resultado en la carpeta de salida:
 *   index.html   página única con el CSS y todo el JavaScript dentro
 *   config.js    dirección del servidor (se puede editar a mano después)
 *   img/ media/  imágenes y videos
 *
 * El juego necesita un servidor en tiempo real (server.js): GitHub Pages solo sirve la página.
 */
const fs = require("fs");
const path = require("path");

const out = path.resolve(process.argv[2] || "dist");
const api = (process.env.KMS_API_URL || "").trim().replace(/\/+$/, "");
const src = path.join(__dirname, "public");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(src, "img"), path.join(out, "img"), { recursive: true });
fs.cpSync(path.join(src, "media"), path.join(out, "media"), { recursive: true });

let html = fs.readFileSync(path.join(src, "index.html"), "utf8");
for (const f of ["team.js", "minigames.js", "app.js"]) {
  const tag = `<script src="${f}"></script>`;
  if (!html.includes(tag)) throw new Error("No encuentro " + tag + " en index.html");
  const code = fs.readFileSync(path.join(src, f), "utf8").replace(/<\/script/gi, "<\\/script");
  html = html.replace(tag, () => `<script>\n${code}\n</script>`);
}
fs.writeFileSync(path.join(out, "index.html"), html);
fs.writeFileSync(path.join(out, "config.js"), `/* Dirección del servidor del juego (Render). Vacío = mismo origen. */\nwindow.KMS_CONFIG = { api: ${JSON.stringify(api)} };\n`);
fs.writeFileSync(path.join(out, ".nojekyll"), "");

const size = d => { let t = 0; for (const e of fs.readdirSync(d, { withFileTypes: true })) t += e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size; return t; };
console.log(`Listo: ${out} (${(size(out) / 1048576).toFixed(1)} MB). API: ${api || "(mismo origen)"}`);
if (!api) console.warn("Aviso: KMS_API_URL está vacío. En GitHub Pages el juego no funcionará hasta que config.js apunte a tu servidor.");

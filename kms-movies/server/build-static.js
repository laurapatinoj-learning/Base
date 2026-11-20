#!/usr/bin/env node
"use strict";
/**
 * Genera la versión estática del juego para GitHub Pages (o cualquier hosting de archivos).
 *
 *   KMS_API_URL=https://kms-movies.onrender.com node build-static.js dist
 *   KMS_API_URL=https://kms-movies.onrender.com node build-static.js kms-movies.html --single
 *
 * Con --single todo queda en un solo archivo .html (CSS, JavaScript e imágenes incrustados).
 * Los videos no se incluyen: sin ellos se usan las animaciones de respaldo.
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

const single = process.argv.includes("--single");
const out = path.resolve(process.argv.find((a, i) => i >= 2 && !a.startsWith("--")) || (single ? "kms-movies.html" : "dist"));
const api = (process.env.KMS_API_URL || "").trim().replace(/\/+$/, "");
const src = path.join(__dirname, "public");

const walk = (d, base = "") => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name), base + e.name + "/") : [base + e.name]);
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };

if (single) {
  let html = fs.readFileSync(path.join(src, "index.html"), "utf8");
  const assets = {};
  for (const f of walk(path.join(src, "img"))) assets["img/" + f] = `data:${MIME[path.extname(f).toLowerCase()] || "application/octet-stream"};base64,` + fs.readFileSync(path.join(src, "img", f)).toString("base64");
  const inline = (tag, code) => { if (!html.includes(tag)) throw new Error("No encuentro " + tag); html = html.replace(tag, () => `<script>\n${code.replace(/<\/script/gi, "<\\/script")}\n</script>`); };
  inline('<script src="config.js"></script>', `/* Dirección del servidor del juego (Render). Edita api si cambias de servidor. */\nwindow.KMS_CONFIG = { api: ${JSON.stringify(api)} };\nwindow.KMS_ASSETS = ${JSON.stringify(assets)};`);
  for (const f of ["team.js", "minigames.js", "app.js"]) inline(`<script src="${f}"></script>`, fs.readFileSync(path.join(src, f), "utf8"));
  fs.writeFileSync(out, html);
  console.log(`Listo: ${out} (${(fs.statSync(out).size / 1048576).toFixed(1)} MB). API: ${api || "(vacía: edita window.KMS_CONFIG.api dentro del archivo)"}`);
  process.exit(0);
}

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

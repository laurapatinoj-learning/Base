// Verifica el sitio estático generado en ./dist: enlaces internos, formularios de Netlify y ausencia de dependencias del servidor.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
const DIST = new URL('../dist/', import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk(DIST), htmls = files.filter((f) => f.endsWith('.html'));
let bad = 0; const fail = (m) => { bad++; console.log('  ✗', m); };
const resolves = (u) => { const p = u.split('#')[0].split('?')[0]; if (!p) return true; const f = join(DIST, p); return existsSync(f) && (statSync(f).isFile() || existsSync(join(f, 'index.html'))); };
const forms = new Set();
for (const f of htmls) {
  const h = readFileSync(f, 'utf8'); const rel = f.slice(DIST.length);
  for (const [, u] of h.matchAll(/(?:href|src)="(\/[^"]*)"/g)) if (!resolves(u)) fail(`${rel}: enlace roto ${u}`);
  if (/data-api=|data-add-cart|data-quiz|data-complete|data-enroll|\/api\//.test(h)) fail(`${rel}: quedan dependencias del servidor`);
  if (/href="\/(carrito|ingresar|registro|pedidos|admin|checkout|ayuda)/.test(h)) fail(`${rel}: enlaza páginas que requieren servidor`);
  for (const [, tag] of h.matchAll(/<form([^>]*)>/g)) { const n = /name="([^"]+)"/.exec(tag)?.[1]; if (!/data-netlify="true"/.test(tag) || !n) fail(`${rel}: formulario sin Netlify Forms`); else forms.add(n); if (!h.includes(`name="form-name" value="${n}"`)) fail(`${rel}: falta form-name para ${n}`); }
  if (!/<title>.+<\/title>/.test(h) || !/<h1/.test(h) || !/name="description"/.test(h)) fail(`${rel}: SEO básico incompleto`);
}
console.log(`${htmls.length} páginas HTML · formularios: ${[...forms].join(', ')} · ${files.length} archivos en total`);
console.log(bad ? `✗ ${bad} problemas` : '✓ sitio estático válido para Netlify');
process.exit(bad ? 1 : 0);

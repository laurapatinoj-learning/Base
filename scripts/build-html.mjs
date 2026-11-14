// Genera ./html: carpeta plana de archivos HTML autónomos (CSS, JS e imágenes incluidos, enlaces relativos).
// Tres idiomas: nombre.html (ES), nombre-en.html (EN) y nombre-pt.html (PT). Funciona abriendo los archivos
// directamente o subiéndolos a Netlify o a cualquier hosting estático.
process.env.STATIC_BUILD = '1'; process.env.DB_FILE = ':memory:'; process.env.PORT = '0'; process.env.SITE_URL = process.env.SITE_URL || process.env.URL || 'https://base-parkway.netlify.app';
const { server } = await import('../server.js');
const { all } = await import('../lib/db.js');
const { mkdirSync, writeFileSync, readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const ROOT = new URL('..', import.meta.url).pathname, OUT = join(ROOT, 'html');
const LANGS = ['es', 'en', 'pt'];

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const get = async (p) => { const r = await fetch(base + p); if (r.status !== 200) throw new Error(`${p} → ${r.status}`); return r.text(); };
const rd = (p) => readFileSync(join(ROOT, p));
const b64 = (buf, mime) => `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
const mime = { jpg: 'image/jpeg', svg: 'image/svg+xml', pdf: 'application/pdf' };
const cache = new Map(); const uri = (p) => { if (!cache.has(p)) cache.set(p, b64(rd('public' + p.replace(/^\/recursos/, '')), mime[p.split('.').pop()])); return cache.get(p); };

const css = rd('public/css/app.css').toString() + '\n' + rd('public/css/extra.css').toString();
const js = (rd('public/js/app.js').toString() + '\n' + rd('public/js/extra.js').toString()).replace(/<\/script>/g, '<\\/script>');
const pdf = b64(rd('storage/resources/hoja-de-trabajo-ishango.pdf'), 'application/pdf');
const poster = b64(rd('public/img/poster-ishango.svg'), 'image/svg+xml');

const events = all('SELECT slug FROM events WHERE published=1');
const lessons = all('SELECT l.id, c.slug FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id').map((l) => `/aula/${l.slug}/leccion/${l.id}`);
const pages = ['/', '/archivo', '/preguntas', '/biblioteca', '/autor', '/fichas', '/catalogo', '/agenda', '/aula', '/newsletter', '/contacto', '/privacidad',
  ...all('SELECT slug FROM fichas WHERE published=1').map((x) => `/fichas/${x.slug}`),
  ...all('SELECT slug FROM products WHERE published=1').map((x) => `/catalogo/${x.slug}`),
  ...events.map((x) => `/agenda/${x.slug}`),
  ...all('SELECT slug FROM courses WHERE published=1').map((x) => `/aula/${x.slug}`)];
const known = new Set([...pages, ...lessons]); const isLesson = (p) => lessons.includes(p);
// Las lecciones solo existen en español; en EN/PT se enlaza a la versión ES.
const fname = (p, lang) => { const l = isLesson(p) ? 'es' : lang; const stem = p === '/' ? 'index' : p.slice(1).replace(/\//g, '-'); return `${stem}${l === 'es' ? '' : '-' + l}.html`; };
const prefix = (l) => (l === 'es' ? '' : '/' + l);
const ics = {}; for (const e of events) ics[e.slug] = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(await get(`/agenda/${e.slug}.ics`));

const FORMS = { '/api/newsletter': 'boletin', '/api/contact': 'contacto' };
function transform(h, path) {
  h = h.replace(/<form([^>]*?) data-api="([^"]+)"([^>]*)>/g, (m, a, api, b) => {
    const ev = /^\/api\/events\/\d+\/register$/.test(api); const custom = /data-form="([^"]+)"/.exec(a + b)?.[1];
    const name = custom || (ev ? 'inscripcion-evento' : FORMS[api]); if (!name) return m;
    return `<form${a} name="${name}" method="POST" data-netlify="true" netlify-honeypot="website" data-netlify-form${b}><input type="hidden" name="form-name" value="${name}">${ev ? `<input type="hidden" name="evento" value="${path.split('/').pop()}">` : ''}`;
  });
  h = h.replace(/ data-add-cart="\d+"/g, '')
    .replace(/<link rel="canonical"[^>]*>/, '').replace(/<link rel="alternate" hreflang[^>]*>/g, '').replace(/<meta property="og:url"[^>]*>/, '')
    .replace('<link rel="stylesheet" href="/css/app.css"><link rel="stylesheet" href="/css/extra.css">', () => `<style>${css}</style>`)
    .replace('<script src="/js/app.js" defer></script><script src="/js/extra.js" defer></script>', () => `<script>${js}</script>`)
    .replace(/src="(\/img\/[^"]+\.jpg)"/g, (m, p) => `src="${uri(p)}"`);
  return h.replace(/href="(\/[^"]*)"/g, (m, u) => {
    const [pp, hash] = u.split('#'); const clean = pp.split('?')[0].replace(/\/$/, '') || '/';
    if (clean === '/img/logo.svg') return `href="${uri('/img/logo.svg')}"`;
    if (clean === '/img/poster-ishango.svg') return `href="${poster}" download="poster-ishango.svg"`;
    if (clean === '/recursos/hoja-de-trabajo-ishango.pdf') return `href="${pdf}" download="hoja-de-trabajo-ishango.pdf"`;
    const ic = /^\/agenda\/([\w-]+)\.ics$/.exec(clean); if (ic) return `href="${ics[ic[1]]}" download="${ic[1]}.ics"`;
    const lm = /^\/(en|pt)(\/.*)?$/.exec(clean); const lang = lm ? lm[1] : 'es'; const p = lm ? (lm[2] || '/') : clean;
    if (known.has(p)) return `href="${fname(p, lang)}${hash ? '#' + hash : ''}"`;
    return m;
  });
}

mkdirSync(OUT, { recursive: true });
const written = new Set(); const problems = [];
for (const lang of LANGS) for (const p of [...pages, ...(lang === 'es' ? lessons : [])]) {
  writeFileSync(join(OUT, fname(p, lang)), transform(await get(prefix(lang) + (p === '/' && lang !== 'es' ? '' : p) || '/'), p)); written.add(fname(p, lang));
}
// Verificación
for (const f of written) {
  const h = readFileSync(join(OUT, f), 'utf8'); const bare = h.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script>[\s\S]*?<\/script>/g, '');
  for (const [, u] of bare.matchAll(/(?:href|src|action)="([^"]+)"/g)) {
    if (/^(https?:|data:|#|mailto:)/.test(u)) continue;
    if (u.startsWith('/')) problems.push(`${f}: ruta absoluta ${u.slice(0, 60)}`); else if (!written.has(u.split('#')[0])) problems.push(`${f}: enlace roto ${u}`);
  }
  if (/data-api=|data-add-cart|\/api\//.test(bare)) problems.push(`${f}: quedan dependencias del servidor`);
  for (const [, tag] of bare.matchAll(/<form([^>]*)>/g)) if (!/data-netlify="true"/.test(tag) || !/ name="/.test(tag)) problems.push(`${f}: formulario sin Netlify Forms`);
  if (!/<title>.+<\/title>/.test(h) || !/<h1/.test(h)) problems.push(`${f}: SEO básico incompleto`);
}
console.log(`html listo: ${written.size} archivos en ./html`);
if (problems.length) { console.log(problems.slice(0, 25).join('\n')); process.exitCode = 1; } else console.log('✓ enlaces, formularios y SEO verificados');
server.close(); process.exit(process.exitCode || 0);

// Genera ./html: una carpeta plana de archivos HTML autónomos (CSS, JS e imágenes incluidos, enlaces relativos).
// Funciona abriendo los archivos directamente o subiéndolos a Netlify/cualquier hosting estático.
process.env.STATIC_BUILD = '1'; process.env.DB_FILE = ':memory:'; process.env.PORT = '0'; process.env.SITE_URL = 'http://localhost';
const { server } = await import('../server.js');
const { all } = await import('../lib/db.js');
const { mkdirSync, writeFileSync, readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const ROOT = new URL('..', import.meta.url).pathname, OUT = join(ROOT, 'html');

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const get = async (p) => { const r = await fetch(base + p); if (r.status !== 200) throw new Error(`${p} → ${r.status}`); return r.text(); };
const rd = (p) => readFileSync(join(ROOT, p));
const b64 = (buf, mime) => `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;

const css = rd('public/css/app.css').toString(), js = rd('public/js/app.js').toString().replace(/<\/script>/g, '<\\/script>');
const jpg = b64(rd('public/img/almonacid-autor.jpg'), 'image/jpeg'), logo = b64(rd('public/img/logo.svg'), 'image/svg+xml'), pdf = b64(rd('storage/resources/hoja-de-trabajo-ishango.pdf'), 'application/pdf');

const events = all('SELECT slug FROM events WHERE published=1');
const paths = ['/', '/archivo', '/fichas', '/catalogo', '/agenda', '/aula', '/newsletter', '/contacto', '/privacidad',
  ...all('SELECT slug FROM fichas WHERE published=1').map((x) => `/fichas/${x.slug}`),
  ...all('SELECT slug FROM products WHERE published=1').map((x) => `/catalogo/${x.slug}`),
  ...events.map((x) => `/agenda/${x.slug}`),
  ...all('SELECT slug FROM courses WHERE published=1').map((x) => `/aula/${x.slug}`),
  ...all('SELECT l.id, c.slug FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id').map((l) => `/aula/${l.slug}/leccion/${l.id}`)];
const fname = (p) => (p === '/' ? 'index.html' : p.slice(1).replace(/\//g, '-') + '.html');
const known = new Set(paths);
const ics = {}; for (const e of events) ics[e.slug] = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(await get(`/agenda/${e.slug}.ics`));

const FORMS = { '/api/newsletter': 'boletin', '/api/contact': 'contacto' };
const OK = [['Mensaje enviado. Te enviamos una copia de recibido por correo.', 'Mensaje enviado. Te responderemos pronto.'], ['Revisa tu correo para confirmar tu suscripción.', '¡Listo! Quedaste en la lista del boletín.'], ['Revisa tu correo para confirmar.', '¡Listo! Quedaste en la lista del boletín.'], ['¡Listo! Te enviamos la confirmación por correo.', '¡Listo! Recibimos tu inscripción y te escribiremos con los detalles.']];
function transform(h, path) {
  h = h.replace(/<form([^>]*?) data-api="([^"]+)"([^>]*)>/g, (m, a, api, b) => {
    const ev = /^\/api\/events\/\d+\/register$/.test(api); const name = ev ? 'inscripcion-evento' : FORMS[api]; if (!name) return m;
    return `<form${a} name="${name}" method="POST" data-netlify="true" netlify-honeypot="website" data-netlify-form${b}><input type="hidden" name="form-name" value="${name}">${ev ? `<input type="hidden" name="evento" value="${path.split('/').pop()}">` : ''}`;
  });
  for (const [a, b] of OK) h = h.split(a).join(b);
  h = h.replace(/ data-add-cart="\d+"/g, '')
    .replace(/<link rel="canonical"[^>]*>/, '').replace(/<meta property="og:url"[^>]*>/, '')
    .replace(/<div class="tabs"[\s\S]*?<\/div>/, '')
    .replace('<link rel="stylesheet" href="/css/app.css">', () => `<style>${css}</style>`)
    .replace('<script src="/js/app.js" defer></script>', () => `<script>${js}</script>`)
    .replace(/src="\/img\/almonacid-autor\.jpg"/g, () => `src="${jpg}"`);
  return h.replace(/href="(\/[^"]*)"/g, (m, u) => {
    const [pp, hash] = u.split('#'); const q = pp.split('?')[0]; const clean = q.replace(/\/$/, '') || '/';
    if (clean === '/img/logo.svg') return `href="${logo}"`;
    if (clean === '/recursos/hoja-de-trabajo-ishango.pdf') return `href="${pdf}" download="hoja-de-trabajo-ishango.pdf"`;
    const ic = /^\/agenda\/([\w-]+)\.ics$/.exec(clean); if (ic) return `href="${ics[ic[1]]}" download="${ic[1]}.ics"`;
    if (known.has(clean)) return `href="${fname(clean)}${hash ? '#' + hash : ''}"`;
    return m;
  });
}

mkdirSync(OUT, { recursive: true });
let n = 0; const problems = [];
for (const p of paths) { writeFileSync(join(OUT, fname(p)), transform(await get(p), p)); n++; }
// Verificación: enlaces relativos existentes y sin rutas absolutas del servidor
const names = new Set(paths.map(fname));
for (const p of paths) {
  const h = readFileSync(join(OUT, fname(p)), 'utf8');
  for (const [, u] of h.matchAll(/(?:href|src|action)="([^"]+)"/g)) {
    if (/^(https?:|data:|#|mailto:)/.test(u)) continue;
    if (u.startsWith('/')) problems.push(`${fname(p)}: ruta absoluta ${u.slice(0, 60)}`);
    else if (!names.has(u.split('#')[0])) problems.push(`${fname(p)}: enlace roto ${u}`);
  }
  if (/data-api=|data-add-cart|\/api\//.test(h.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script>[\s\S]*?<\/script>/, ''))) problems.push(`${fname(p)}: quedan dependencias del servidor`);
}
console.log(`html listo: ${n} archivos en ./html`); if (problems.length) { console.log(problems.join('\n')); process.exitCode = 1; } else console.log('✓ enlaces y formularios verificados');
server.close(); process.exit(process.exitCode || 0);

// Genera el sitio estático para Netlify en ./dist (HTML + assets), con las mismas vistas del servidor.
// Netlify construye desde cero en cada despliegue, por eso este script solo escribe archivos.
process.env.STATIC_BUILD = '1'; process.env.DB_FILE = ':memory:'; process.env.PORT = '0';
process.env.SITE_URL = (process.env.SITE_URL || process.env.URL || 'https://base-parkway.netlify.app').replace(/\/$/, '');
const { server } = await import('../server.js');
const { all } = await import('../lib/db.js');
const { mkdirSync, writeFileSync, copyFileSync } = await import('node:fs');
const { join, dirname } = await import('node:path');
const ROOT = new URL('..', import.meta.url).pathname, DIST = join(ROOT, 'dist');

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const get = async (p) => { const r = await fetch(base + p); if (r.status !== 200) throw new Error(`${p} → ${r.status}`); return r.text(); };

const FORMS = { '/api/newsletter': 'boletin', '/api/contact': 'contacto' };
function netlifyForms(html, path) {
  return html.replace(/<form([^>]*?) data-api="([^"]+)"([^>]*)>/g, (m, a, api, b) => {
    const ev = /^\/api\/events\/\d+\/register$/.test(api); const name = ev ? 'inscripcion-evento' : FORMS[api]; if (!name) return m;
    const hidden = `<input type="hidden" name="form-name" value="${name}">${ev ? `<input type="hidden" name="evento" value="${path.split('/').pop()}">` : ''}`;
    // El formulario de boletín de la página dedicada incluye "nombre": se registra aparte para no mezclar campos.
    return `<form${a} name="${name}" method="POST" data-netlify="true" netlify-honeypot="website" data-netlify-form${b}>${hidden}`;
  });
}
// En la versión estática no hay correos automáticos: ajustamos los mensajes de éxito para no prometerlos.
const OK = [['Mensaje enviado. Te enviamos una copia de recibido por correo.', 'Mensaje enviado. Te responderemos pronto.'], ['Revisa tu correo para confirmar tu suscripción.', '¡Listo! Quedaste en la lista del boletín.'], ['Revisa tu correo para confirmar.', '¡Listo! Quedaste en la lista del boletín.'], ['¡Listo! Te enviamos la confirmación por correo.', '¡Listo! Recibimos tu inscripción y te escribiremos con los detalles.']];
const clean = (h, p) => OK.reduce((acc, [a, b]) => acc.split(a).join(b), netlifyForms(h, p)).replace(/ data-add-cart="\d+"/g, '');
function write(file, body) { const f = join(DIST, file); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, body); }
const page = (path) => (path === '/' ? 'index.html' : `${path.slice(1)}/index.html`);

const lessons = all('SELECT l.id, c.slug FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id');
const events = all('SELECT slug FROM events WHERE published=1');
const paths = ['/', '/archivo', '/fichas', '/catalogo', '/agenda', '/aula', '/newsletter', '/contacto', '/privacidad',
  ...all('SELECT slug FROM fichas WHERE published=1').map((x) => `/fichas/${x.slug}`),
  ...all('SELECT slug FROM products WHERE published=1').map((x) => `/catalogo/${x.slug}`),
  ...events.map((x) => `/agenda/${x.slug}`),
  ...all('SELECT slug FROM courses WHERE published=1').map((x) => `/aula/${x.slug}`),
  ...lessons.map((l) => `/aula/${l.slug}/leccion/${l.id}`)];
for (const p of paths) write(page(p), clean(await get(p), p));
for (const e of events) write(`agenda/${e.slug}.ics`, await get(`/agenda/${e.slug}.ics`));
write('404.html', clean(await (await fetch(base + '/no-existe')).text(), '/404'));
const url = process.env.SITE_URL;
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.filter((p) => !p.includes('/leccion/')).map((p) => `<url><loc>${url}${p === '/' ? '' : p}</loc></url>`).join('')}</urlset>`);
// _headers: aplica las cabeceras de seguridad también cuando se sube la carpeta a mano (netlify.toml solo rige con Git).
write('_headers', `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'\n/css/*\n  Cache-Control: public, max-age=3600\n/js/*\n  Cache-Control: public, max-age=3600\n/img/*\n  Cache-Control: public, max-age=86400\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${url}/sitemap.xml\n`);
for (const f of ['css/app.css', 'js/app.js', 'img/logo.svg', 'img/og-base.svg', 'img/almonacid-autor.jpg']) { mkdirSync(dirname(join(DIST, f)), { recursive: true }); copyFileSync(join(ROOT, 'public', f), join(DIST, f)); }
mkdirSync(join(DIST, 'recursos'), { recursive: true }); copyFileSync(join(ROOT, 'storage/resources/hoja-de-trabajo-ishango.pdf'), join(DIST, 'recursos/hoja-de-trabajo-ishango.pdf'));
console.log(`dist listo: ${paths.length} páginas · ${url}`);
server.close(); process.exit(0);

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { extname, join, normalize, resolve, basename } from 'node:path';
import { all, get, run } from './lib/db.js';
import { userFromToken } from './lib/auth.js';
import { sendMail, mails, SITE } from './lib/mail.js';
import { html, nowIso, esc } from './lib/util.js';
import { seedIfEmpty } from './lib/seed.js';
import { routes, HttpError, trackEvent } from './app/api.js';
import './app/admin-api.js';
import * as P from './app/pages-public.js';
import * as S from './app/pages-shop.js';
import * as A from './app/pages-aula.js';
import { layout, siteUrl } from './app/layout.js';

const ROOT = new URL('.', import.meta.url).pathname;
const PUB = join(ROOT, 'public'), DL = join(ROOT, 'storage/downloads'), RES = join(ROOT, 'storage/resources');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.webp': 'image/webp' };

const pages = [];
const page = (path, fn, opts = {}) => pages.push([new RegExp('^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn, opts]);
page('/', P.home); page('/archivo', P.archivo); page('/fichas', P.fichasIndex); page('/fichas/:slug', P.fichaDetail);
page('/catalogo', P.catalogo); page('/catalogo/:slug', P.producto); page('/agenda', P.agenda); page('/agenda/:slug', P.evento);
page('/newsletter', (c) => P.newsletter(c)); page('/contacto', P.contacto); page('/ayuda', P.ayuda); page('/privacidad', P.privacidad);
page('/carrito', S.carrito); page('/checkout', S.checkout); page('/pedidos', S.pedidos); page('/pedidos/:code', S.pedido);
page('/ingresar', S.ingresar); page('/registro', S.registro);
page('/aula', A.aula); page('/aula/:slug', A.curso); page('/aula/:slug/leccion/:id', A.leccion);
page('/newsletter/confirmar', (ctx) => {
  const s = get('SELECT * FROM subscribers WHERE token=?', ctx.query.get('token') || ''); if (!s) return P.newsletterMsg(ctx, 'El enlace no es válido o ya expiró.', 'Enlace inválido');
  if (s.status !== 'active') { run("UPDATE subscribers SET status='active', confirmed_at=? WHERE id=?", nowIso(), s.id); const [sub, body] = mails.welcomeNews(s.token); sendMail(s.email, sub, body, 'newsletter-bienvenida'); trackEvent(ctx, 'newsletter_confirm'); }
  return P.newsletterMsg(ctx, '¡Suscripción confirmada! Gracias por unirte al boletín.', 'Suscripción confirmada');
});
page('/newsletter/baja', (ctx) => { const s = get('SELECT * FROM subscribers WHERE token=?', ctx.query.get('token') || ''); if (!s) return P.newsletterMsg(ctx, 'El enlace no es válido.', 'Enlace inválido'); run("UPDATE subscribers SET status='unsubscribed' WHERE id=?", s.id); return P.newsletterMsg(ctx, 'Te diste de baja del boletín. Lamentamos verte partir.', 'Baja confirmada'); });
page('/admin', (ctx) => {
  if (!ctx.user) return { redirect: '/ingresar?next=/admin' };
  if (ctx.user.role === 'user') return { status: 403, body: layout(ctx, { title: 'Sin acceso', noindex: true, main: html`<section class="wrap narrow center pad"><h1>Acceso restringido</h1><p class="lead">Tu cuenta no tiene permisos para el CMS.</p></section>` }) };
  return { body: html`<!doctype html><html lang="es-CO"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>CMS · Base Parkway</title><link rel="icon" href="/img/logo.svg"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;800&family=Source+Serif+4:wght@400;600&display=swap"><link rel="stylesheet" href="/css/app.css"><link rel="stylesheet" href="/css/admin.css"></head><body class="admin"><div id="app" data-role="${ctx.user.role}" data-name="${ctx.user.name}">Cargando CMS…</div><script src="/js/admin.js" defer></script></body></html>` };
});

const COOKIE_FLAGS = () => `Path=/; HttpOnly; SameSite=Lax${process.env.COOKIE_SECURE === '1' ? '; Secure' : ''}`;
const parseCookies = (h = '') => Object.fromEntries(h.split(';').map((c) => c.trim().split(/=(.*)/s).slice(0, 2)).filter(([k]) => k));
async function readBody(req, max = 200_000) {
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > max) throw new HttpError(413, 'Solicitud demasiado grande.'); chunks.push(c); }
  if (!n) return {}; try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new HttpError(400, 'JSON inválido.'); }
}
const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'" };

async function serveFile(res, file, { download, cache = 'public, max-age=300' } = {}) {
  const st = await stat(file).catch(() => null); if (!st?.isFile()) return false;
  res.writeHead(200, { ...SEC, 'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': cache, ...(download ? { 'Content-Disposition': `attachment; filename="${basename(download)}"` } : {}) });
  createReadStream(file).pipe(res); return true;
}
const BOT = /bot|crawl|spider|slurp|preview|monitor|curl|wget|headless/i;

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'); const method = req.method;
  const cookies = parseCookies(req.headers.cookie); const out = [];
  const ctx = { req, res, url, query: url.searchParams, params: {}, ip: req.socket.remoteAddress || '', sessionToken: cookies.bp_session, user: null, body: {} };
  ctx.sid = cookies.bp_sid || randomBytes(12).toString('hex'); if (!cookies.bp_sid) out.push(`bp_sid=${ctx.sid}; ${COOKIE_FLAGS()}; Max-Age=31536000`);
  ctx.cartKey = ctx.sid; ctx.user = userFromToken(ctx.sessionToken);
  ctx.setSession = (t) => out.push(t ? `bp_session=${t}; ${COOKIE_FLAGS()}; Max-Age=${14 * 86400}` : `bp_session=; ${COOKIE_FLAGS()}; Max-Age=0`);
  const headers = (extra = {}) => ({ ...SEC, ...extra, ...(out.length ? { 'Set-Cookie': out } : {}) });
  const send = (status, type, body, extra = {}) => { res.writeHead(status, headers({ 'Content-Type': type, ...extra })); res.end(body); };
  const json = (status, obj) => send(status, 'application/json; charset=utf-8', JSON.stringify(obj), { 'Cache-Control': 'no-store' });

  try {
    const path = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/';
    if (path === '/healthz') return json(200, { ok: true });
    if (path === '/robots.txt') return send(200, 'text/plain; charset=utf-8', `User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /carrito\nDisallow: /checkout\nDisallow: /pedidos\nDisallow: /aula/\nAllow: /\nSitemap: ${siteUrl()}/sitemap.xml\n`);
    if (path === '/sitemap.xml') {
      const u = ['/', '/archivo', '/fichas', '/catalogo', '/agenda', '/aula', '/newsletter', '/contacto', '/ayuda', ...all('SELECT slug FROM fichas WHERE published=1').map((x) => `/fichas/${x.slug}`), ...all('SELECT slug FROM products WHERE published=1').map((x) => `/catalogo/${x.slug}`), ...all('SELECT slug FROM events WHERE published=1').map((x) => `/agenda/${x.slug}`), ...all('SELECT slug FROM courses WHERE published=1').map((x) => `/aula/${x.slug}`)];
      return send(200, 'application/xml; charset=utf-8', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${u.map((p) => `<url><loc>${esc(siteUrl() + p)}</loc></url>`).join('')}</urlset>`);
    }

    // API
    if (path.startsWith('/api/')) {
      if (method !== 'GET') {
        if (req.headers['x-requested-with'] !== 'fetch') throw new HttpError(403, 'Solicitud no permitida.');
        const o = req.headers.origin; if (o && new URL(o).host !== req.headers.host) throw new HttpError(403, 'Origen no permitido.');
        ctx.body = await readBody(req);
      }
      for (const [m, re, fn] of routes) { if (m !== method) continue; const mt = re.exec(path); if (!mt) continue; ctx.params = mt.groups || {}; return json(200, await fn(ctx)); }
      return json(404, { error: 'No encontrado.' });
    }

    // Descargas autorizadas
    let m;
    if ((m = /^\/descargas\/([a-f0-9]{48})$/.exec(path))) {
      if (!ctx.user) return send(302, 'text/plain', '', { Location: `/ingresar?next=${encodeURIComponent(path)}` });
      const it = get("SELECT i.*, o.user_id, o.status, p.file FROM order_items i JOIN orders o ON o.id=i.order_id JOIN products p ON p.id=i.product_id WHERE i.download_token=?", m[1]);
      const deny = (s, t) => send(s, 'text/html; charset=utf-8', layout(ctx, { title: 'Descarga', noindex: true, main: html`<section class="wrap narrow center pad"><h1>${t}</h1><p><a class="btn" href="/pedidos">Mis pedidos</a></p></section>` }).toString());
      if (!it || it.user_id !== ctx.user.id) return deny(403, 'No tienes autorización para este archivo');
      if (!['paid', 'shipped', 'delivered'].includes(it.status)) return deny(403, 'El pedido no está pagado');
      if (it.downloads >= 5) return deny(403, 'Alcanzaste el límite de 5 descargas');
      const file = resolve(DL, basename(it.file || ''));
      if (!existsSync(file)) return deny(404, 'Archivo no disponible. Escríbenos desde Contacto.');
      run('UPDATE order_items SET downloads=downloads+1 WHERE id=?', it.id); run('INSERT INTO downloads_log(order_item_id,user_id,ip,created_at) VALUES(?,?,?,?)', it.id, ctx.user.id, '', nowIso()); trackEvent(ctx, 'download', it.title);
      return void (await serveFile(res, file, { download: it.file, cache: 'private, no-store' }));
    }
    // Recursos del aula (solo matriculados o staff)
    if ((m = /^\/recursos\/([\w.-]+\.pdf)$/.exec(path))) {
      const ok = ctx.user && (ctx.user.role !== 'user' || get('SELECT 1 FROM enrollments WHERE user_id=?', ctx.user.id));
      if (!ok) return send(302, 'text/plain', '', { Location: `/ingresar?next=${encodeURIComponent(path)}` });
      return void (await serveFile(res, join(RES, basename(m[1])), { cache: 'private, no-store' }) || send(404, 'text/plain', 'No encontrado'));
    }
    if ((m = /^\/agenda\/([\w-]+)\.ics$/.exec(path))) { ctx.params = { slug: m[1] }; const body = P.ics(ctx); return body ? send(200, 'text/calendar; charset=utf-8', body, { 'Content-Disposition': `attachment; filename="${m[1]}.ics"` }) : send(404, 'text/plain', 'No encontrado'); }

    // Estáticos
    if (method === 'GET' || method === 'HEAD') {
      const f = normalize(join(PUB, path)); if (f.startsWith(PUB + '/') && await serveFile(res, f)) return;
    }
    // Páginas
    if (method !== 'GET' && method !== 'HEAD') return send(405, 'text/plain', 'Método no permitido');
    for (const [re, fn] of pages) {
      const mt = re.exec(path); if (!mt) continue; ctx.params = mt.groups || {}; ctx.cartCount = S.cartCountOf(ctx.cartKey);
      let r = await fn(ctx); if (r == null) break;
      if (r.redirect) return send(302, 'text/plain', '', { Location: r.redirect });
      const status = r.status || 200; const body = String(r.body ?? r);
      if (status === 200 && !path.startsWith('/admin') && !BOT.test(req.headers['user-agent'] || '') && method === 'GET') { try { run('INSERT INTO hits(ts,sid,user_id,path,ref) VALUES(?,?,?,?,?)', nowIso(), ctx.sid, ctx.user?.id ?? null, path, (req.headers.referer || '').slice(0, 200) || null); } catch { /* */ } }
      return send(status, 'text/html; charset=utf-8', method === 'HEAD' ? '' : body, { 'Cache-Control': 'no-cache' });
    }
    ctx.cartCount = S.cartCountOf(ctx.cartKey); const nf = P.notFound(ctx); return send(404, 'text/html; charset=utf-8', String(nf.body), { 'Cache-Control': 'no-cache' });
  } catch (e) {
    if (e instanceof HttpError) return e.status === 200 ? json(200, { ok: true }) : json(e.status, { error: e.message });
    console.error(e); return json(500, { error: 'Error interno. Intenta de nuevo.' });
  }
});

if (process.env.SEED_DEMO !== '0' && seedIfEmpty()) console.log('Base de datos inicial creada con contenido y cuentas de prueba.');
export { server };
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = +process.env.PORT || 3000;
  server.listen(port, () => console.log(`Base Parkway en http://localhost:${port}`));
}

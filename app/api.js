import { randomBytes } from 'node:crypto';
import { all, get, run, tx } from '../lib/db.js';
import { hashPassword, verifyPassword, createSession, destroySession, passwordProblem, rateLimit } from '../lib/auth.js';
import { sendMail, mails, SITE } from '../lib/mail.js';
import { gateway } from '../lib/gateway.js';
import { isEmail, nowIso } from '../lib/util.js';
import { cartRows, cartTotal, cartCountOf } from './pages-shop.js';
import { courseOutline, enrolled } from './pages-aula.js';

export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const bad = (m, s = 400) => { throw new HttpError(s, m); };
const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const needUser = (ctx) => ctx.user || bad('Inicia sesión para continuar.', 401);
const honeypot = (b) => { if (b.website) throw new HttpError(200, 'ok'); };
export function trackEvent(ctx, type, label = '', meta = '') { try { run('INSERT INTO track(ts,sid,user_id,type,label,meta) VALUES(?,?,?,?,?,?)', nowIso(), ctx.sid, ctx.user?.id ?? null, type, String(label).slice(0, 120), meta ? String(meta).slice(0, 300) : null); } catch { /* analítica nunca rompe el flujo */ } }

function enroll(userId, courseId) {
  const r = run('INSERT OR IGNORE INTO enrollments(user_id,course_id,created_at) VALUES(?,?,?)', userId, courseId, nowIso());
  return r.changes > 0;
}

export const routes = [];
const on = (method, path, fn) => routes.push([method, new RegExp('^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn]);

on('POST', '/api/register', async (ctx) => {
  const b = ctx.body; honeypot(b);
  if (!rateLimit('reg:' + ctx.ip, 10)) bad('Demasiados intentos. Espera unos minutos.', 429);
  const name = str(b.name, 80), email = str(b.email, 254).toLowerCase();
  if (name.length < 2) bad('Escribe tu nombre.'); if (!isEmail(email)) bad('Correo inválido.');
  const pp = passwordProblem(b.password); if (pp) bad(pp);
  if (get('SELECT 1 FROM users WHERE email=?', email)) bad('Ya existe una cuenta con ese correo.', 409);
  const id = run("INSERT INTO users(email,name,pass_hash,role,created_at) VALUES(?,?,?,'user',?)", email, name, hashPassword(b.password), nowIso()).lastInsertRowid;
  ctx.setSession(createSession(id)); ctx.user = { id, email, name, role: 'user' };
  trackEvent(ctx, 'signup'); const [s, t] = mails.welcome(name); await sendMail(email, s, t, 'bienvenida');
  return { ok: true };
});
on('POST', '/api/login', (ctx) => {
  const email = str(ctx.body.email, 254).toLowerCase();
  if (!rateLimit(`login:${ctx.ip}:${email}`, 8)) bad('Demasiados intentos. Espera 10 minutos.', 429);
  const u = get('SELECT * FROM users WHERE email=?', email);
  if (!u || !verifyPassword(String(ctx.body.password || ''), u.pass_hash)) bad('Correo o contraseña incorrectos.', 401);
  ctx.setSession(createSession(u.id)); ctx.user = u; trackEvent(ctx, 'login');
  return { ok: true, role: u.role };
});
on('POST', '/api/logout', (ctx) => { destroySession(ctx.sessionToken); ctx.setSession(null); return { ok: true }; });

on('POST', '/api/newsletter', async (ctx) => {
  const b = ctx.body; honeypot(b); if (!rateLimit('nl:' + ctx.ip, 10)) bad('Demasiados intentos.', 429);
  const email = str(b.email, 254).toLowerCase(); if (!isEmail(email)) bad('Escribe un correo válido.');
  let s = get('SELECT * FROM subscribers WHERE email=?', email);
  if (s?.status === 'active') return { ok: true, message: 'Este correo ya está suscrito.' };
  if (!s) { const token = randomBytes(16).toString('hex'); run("INSERT INTO subscribers(email,name,status,token,created_at) VALUES(?,?, 'pending',?,?)", email, str(b.name, 80), token, nowIso()); s = { token }; }
  else run("UPDATE subscribers SET status='pending' WHERE id=?", s.id);
  const [sub, body] = mails.confirmNews(s.token); await sendMail(email, sub, body, 'newsletter-confirmar'); trackEvent(ctx, 'newsletter_subscribe');
  return { ok: true };
});
on('POST', '/api/contact', async (ctx) => {
  const b = ctx.body; honeypot(b); if (!rateLimit('ct:' + ctx.ip, 5)) bad('Demasiados mensajes. Intenta más tarde.', 429);
  const name = str(b.name, 80), email = str(b.email, 254), body = str(b.body, 3000);
  if (!name) bad('Escribe tu nombre.'); if (!isEmail(email)) bad('Correo inválido.'); if (body.length < 5) bad('Escribe tu mensaje.');
  run('INSERT INTO messages(name,email,subject,body,created_at) VALUES(?,?,?,?,?)', name, email, str(b.subject, 150), body, nowIso());
  const [s, t] = mails.contact(name); await sendMail(email, s, t, 'contacto'); trackEvent(ctx, 'contact');
  const admin = get("SELECT email FROM users WHERE role='admin' ORDER BY id LIMIT 1"); if (admin) await sendMail(admin.email, `Nuevo mensaje: ${str(b.subject, 60) || 'sin asunto'}`, `De: ${name} <${email}>\n\n${body}\n\n${SITE()}/admin#messages`, 'aviso-contacto');
  return { ok: true };
});
on('POST', '/api/events/:id/register', async (ctx) => {
  const b = ctx.body; honeypot(b); if (!rateLimit('ev:' + ctx.ip, 10)) bad('Demasiados intentos.', 429);
  const e = get('SELECT * FROM events WHERE id=? AND published=1', +ctx.params.id) || bad('Evento no encontrado.', 404);
  const name = str(b.name, 80), email = str(b.email, 254).toLowerCase(); if (!name) bad('Escribe tu nombre.'); if (!isEmail(email)) bad('Correo inválido.');
  if (new Date(e.starts_at) < new Date()) bad('Este evento ya ocurrió.');
  const n = get('SELECT COUNT(*) n FROM event_regs WHERE event_id=?', e.id).n; if (e.capacity && n >= e.capacity) bad('Cupos agotados.', 409);
  if (get('SELECT 1 FROM event_regs WHERE event_id=? AND email=?', e.id, email)) bad('Ya estás inscrita/o con ese correo.', 409);
  run('INSERT INTO event_regs(event_id,name,email,created_at) VALUES(?,?,?,?)', e.id, name, email, nowIso());
  const [s, t] = mails.event(name, e); await sendMail(email, s, t, 'evento'); trackEvent(ctx, 'event_register', e.slug);
  return { ok: true };
});

// --- Carrito
const cartReply = (ctx) => { const rows = cartRows(ctx.cartKey); return { ok: true, count: cartCountOf(ctx.cartKey), total: cartTotal(rows), items: rows.length }; };
on('POST', '/api/cart', (ctx) => {
  const p = get('SELECT * FROM products WHERE id=? AND published=1', +ctx.body.product_id) || bad('Producto no disponible.', 404);
  let qty = Math.max(1, Math.min(10, parseInt(ctx.body.qty) || 1));
  if (p.kind !== 'physical') qty = 1;
  if (p.kind === 'course' && p.course_id && enrolled(ctx.user?.id, p.course_id)) bad('Ya estás matriculada/o en este curso.', 409);
  const cur = get('SELECT qty FROM cart_items WHERE cart_key=? AND product_id=?', ctx.cartKey, p.id)?.qty || 0;
  if (p.kind === 'physical') { if (p.stock <= 0) bad('Producto agotado.', 409); qty = Math.min(cur + qty, p.stock); } 
  run('INSERT INTO cart_items(cart_key,product_id,qty) VALUES(?,?,?) ON CONFLICT(cart_key,product_id) DO UPDATE SET qty=excluded.qty', ctx.cartKey, p.id, qty);
  trackEvent(ctx, 'add_to_cart', p.slug); return cartReply(ctx);
});
on('PATCH', '/api/cart/:id', (ctx) => {
  const p = get('SELECT * FROM products WHERE id=?', +ctx.params.id) || bad('No encontrado.', 404);
  const qty = Math.max(1, Math.min(p.kind === 'physical' ? (p.stock ?? 1) : 1, parseInt(ctx.body.qty) || 1));
  run('UPDATE cart_items SET qty=? WHERE cart_key=? AND product_id=?', qty, ctx.cartKey, p.id); return cartReply(ctx);
});
on('DELETE', '/api/cart/:id', (ctx) => { run('DELETE FROM cart_items WHERE cart_key=? AND product_id=?', ctx.cartKey, +ctx.params.id); return cartReply(ctx); });

// --- Checkout: reserva de inventario → pasarela → confirmación (o liberación)
on('POST', '/api/checkout', async (ctx) => {
  needUser(ctx); const b = ctx.body;
  if (!rateLimit('co:' + ctx.user.id, 12)) bad('Demasiados intentos de pago. Espera unos minutos.', 429);
  const name = str(b.name, 80), email = str(b.email, 254).toLowerCase(), address = str(b.address, 400);
  if (!name) bad('Escribe tu nombre.'); if (!isEmail(email)) bad('Correo inválido.');
  const rows = cartRows(ctx.cartKey); if (!rows.length) bad('Tu carrito está vacío.');
  if (rows.some((r) => r.kind === 'physical') && address.length < 10) bad('Indica la dirección de envío completa.');
  const code = 'BP-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + randomBytes(2).toString('hex').toUpperCase();
  const order = tx(() => {
    let total = 0;
    for (const r of rows) {
      const p = get('SELECT * FROM products WHERE id=?', r.id);
      if (p.kind === 'physical' && p.stock < r.qty) bad(`No hay existencias suficientes de «${p.title}» (quedan ${p.stock}).`, 409);
      total += p.price * r.qty;
    }
    const o = run('INSERT INTO orders(code,user_id,email,name,address,total,status,created_at) VALUES(?,?,?,?,?,?,?,?)', code, ctx.user.id, email, name, address, total, 'pending', nowIso());
    for (const r of rows) {
      run('INSERT INTO order_items(order_id,product_id,title,kind,price,qty) VALUES(?,?,?,?,?,?)', o.lastInsertRowid, r.id, r.title, r.kind, r.price, r.qty);
      if (r.kind === 'physical') { run('UPDATE products SET stock=stock-? WHERE id=?', r.qty, r.id); run("INSERT INTO stock_moves(product_id,delta,reason,order_id,created_at) VALUES(?,?,?,?,?)", r.id, -r.qty, `Reserva pedido ${code}`, o.lastInsertRowid, nowIso()); }
    }
    return { id: Number(o.lastInsertRowid), total };
  });
  trackEvent(ctx, 'checkout_submit', code);
  let pay = { ok: true, ref: 'GRATIS', last4: null };
  if (order.total > 0) { try { pay = await gateway.charge({ amount: order.total, card: b.card, exp: b.exp, cvc: b.cvc }); } catch { pay = { ok: false, reason: 'Error de la pasarela. Intenta de nuevo.' }; } }
  if (!pay.ok) {
    tx(() => {
      for (const i of all("SELECT * FROM order_items WHERE order_id=? AND kind='physical'", order.id)) { run('UPDATE products SET stock=stock+? WHERE id=?', i.qty, i.product_id); run('INSERT INTO stock_moves(product_id,delta,reason,order_id,created_at) VALUES(?,?,?,?,?)', i.product_id, i.qty, `Liberación (pago fallido ${code})`, order.id, nowIso()); }
      run("UPDATE orders SET status='failed', failure=? WHERE id=?", pay.reason, order.id);
    });
    trackEvent(ctx, 'payment_failed', code); bad(pay.reason, 402);
  }
  const items = tx(() => {
    run("UPDATE orders SET status='paid', payment_ref=?, card_last4=?, paid_at=? WHERE id=?", pay.ref, pay.last4, nowIso(), order.id);
    for (const i of all('SELECT * FROM order_items WHERE order_id=?', order.id)) {
      if (i.kind === 'digital') run('UPDATE order_items SET download_token=? WHERE id=?', randomBytes(24).toString('hex'), i.id);
      if (i.kind === 'course') { const cid = get('SELECT course_id FROM products WHERE id=?', i.product_id)?.course_id; if (cid) enroll(ctx.user.id, cid); }
    }
    run('DELETE FROM cart_items WHERE cart_key=?', ctx.cartKey);
    return all('SELECT * FROM order_items WHERE order_id=?', order.id);
  });
  const o = get('SELECT * FROM orders WHERE id=?', order.id);
  { const [s, t] = mails.order(o, items); await sendMail(email, s, t, 'pedido'); }
  if (items.some((i) => i.kind === 'digital')) { const [s, t] = mails.delivery(o, items.filter((i) => i.kind === 'digital')); await sendMail(email, s, t, 'entrega-digital'); }
  for (const i of items.filter((x) => x.kind === 'course')) { const c = get('SELECT c.title FROM courses c JOIN products p ON p.course_id=c.id WHERE p.id=?', i.product_id); if (c) { const [s, t] = mails.enroll(name, c.title); await sendMail(email, s, t, 'matricula'); } }
  trackEvent(ctx, 'purchase', code, String(o.total));
  return { ok: true, code, redirect: `/pedidos/${code}` };
});

// --- Aula
on('POST', '/api/courses/:id/enroll', async (ctx) => {
  needUser(ctx); const c = get('SELECT * FROM courses WHERE id=? AND published=1', +ctx.params.id) || bad('Curso no encontrado.', 404);
  if (!c.free) bad('Este curso requiere compra de matrícula.', 402);
  if (enroll(ctx.user.id, c.id)) { const [s, t] = mails.enroll(ctx.user.name, c.title); await sendMail(ctx.user.email, s, t, 'matricula'); trackEvent(ctx, 'enroll', c.slug); }
  return { ok: true, redirect: `/aula/${c.slug}` };
});
const lessonFor = (ctx) => {
  needUser(ctx); const l = get('SELECT l.*,m.course_id FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.id=?', +ctx.params.id) || bad('Lección no encontrada.', 404);
  if (!enrolled(ctx.user.id, l.course_id)) bad('Debes estar matriculada/o en el curso.', 403); return l;
};
const progressReply = (ctx, l) => { const o = courseOutline(l.course_id, ctx.user.id); return { pct: o.pct, done: o.done, total: o.total }; };
on('POST', '/api/lessons/:id/complete', (ctx) => {
  const l = lessonFor(ctx); if (l.quiz) bad('Esta lección se completa aprobando la evaluación.', 400);
  run('INSERT OR IGNORE INTO progress(user_id,lesson_id,completed_at) VALUES(?,?,?)', ctx.user.id, l.id, nowIso()); trackEvent(ctx, 'lesson_complete', l.title);
  return { ok: true, ...progressReply(ctx, l) };
});
on('POST', '/api/lessons/:id/quiz', (ctx) => {
  const l = lessonFor(ctx); if (!l.quiz) bad('Esta lección no tiene evaluación.'); const qs = JSON.parse(l.quiz); const ans = Array.isArray(ctx.body.answers) ? ctx.body.answers : [];
  if (ans.length !== qs.length) bad('Responde todas las preguntas.');
  const wrong = qs.map((q, i) => (Number(ans[i]) === q.a ? -1 : i)).filter((i) => i >= 0); const score = Math.round(((qs.length - wrong.length) / qs.length) * 100); const passed = score >= 70;
  if (passed) { run('INSERT INTO progress(user_id,lesson_id,score,completed_at) VALUES(?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET score=MAX(COALESCE(score,0),excluded.score)', ctx.user.id, l.id, score, nowIso()); trackEvent(ctx, 'quiz_pass', l.title, String(score)); }
  else trackEvent(ctx, 'quiz_fail', l.title, String(score));
  return { ok: true, score, passed, wrong, ...progressReply(ctx, l) };
});

const TRACKABLE = new Set(['ics', 'download', 'cta', 'explorer', 'sieve', 'share']);
on('POST', '/api/track', (ctx) => { if (TRACKABLE.has(ctx.body.type)) trackEvent(ctx, ctx.body.type, str(ctx.body.label, 100)); return { ok: true }; });

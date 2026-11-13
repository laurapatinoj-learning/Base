import { all, get, run, tx } from '../lib/db.js';
import { sendMail, SITE } from '../lib/mail.js';
import { slugify, nowIso } from '../lib/util.js';
import { HttpError, routes } from './api.js';

const bad = (m, s = 400) => { throw new HttpError(s, m); };
const T = (name, type = 'text', extra = {}) => ({ name, type, ...extra });
// Esquema del CMS: el panel /admin se construye a partir de esto.
export const SCHEMA = {
  fichas: { label: 'Fichas editoriales', table: 'fichas', order: 'ord, id', cols: ['ord', 'title', 'kind', 'published'], fields: [T('title', 'text', { label: 'Título', required: 1 }), T('slug', 'slug', { label: 'Slug (URL)', hint: 'Se genera del título si lo dejas vacío' }), T('kind', 'text', { label: 'Tipo / número' }), T('subtitle', 'text', { label: 'Subtítulo' }), T('summary', 'textarea', { label: 'Resumen (SEO y tarjetas)', rows: 3 }), T('body', 'textarea', { label: 'Contenido', rows: 14, hint: 'Formato: ## Título, - lista, **negrita**, *cursiva*, > cita, [texto](url)' }), T('year', 'int', { label: 'Año' }), T('source', 'text', { label: 'Fuente' }), T('tags', 'text', { label: 'Etiquetas (coma)' }), T('ord', 'int', { label: 'Orden' }), T('published', 'bool', { label: 'Publicada' })] },
  products: { label: 'Catálogo e inventario', table: 'products', order: 'ord, id', cols: ['title', 'kind', 'price', 'stock', 'published'], fields: [T('title', 'text', { label: 'Título', required: 1 }), T('slug', 'slug', { label: 'Slug (URL)' }), T('kind', 'select', { label: 'Tipo', options: ['digital', 'physical', 'course'], required: 1 }), T('description', 'textarea', { label: 'Descripción', rows: 3 }), T('price', 'int', { label: 'Precio (COP)', required: 1 }), T('stock', 'int', { label: 'Inventario (solo físicos)', hint: 'Cada cambio queda en el historial de movimientos' }), T('file', 'text', { label: 'Archivo digital (en storage/downloads)', hint: 'Ej.: dossier-ishango.pdf' }), T('course_id', 'ref', { label: 'Curso vinculado (matrícula)', ref: 'courses', refLabel: 'title' }), T('ficha_id', 'ref', { label: 'Ficha relacionada', ref: 'fichas', refLabel: 'title' }), T('ord', 'int', { label: 'Orden' }), T('published', 'bool', { label: 'Publicado' })] },
  events: { label: 'Agenda', table: 'events', order: 'starts_at', cols: ['title', 'starts_at', 'mode', 'capacity', 'published'], fields: [T('title', 'text', { label: 'Título', required: 1 }), T('slug', 'slug', { label: 'Slug (URL)' }), T('description', 'textarea', { label: 'Descripción', rows: 3 }), T('starts_at', 'datetime', { label: 'Inicio (hora Colombia)', required: 1 }), T('ends_at', 'datetime', { label: 'Fin (hora Colombia)' }), T('mode', 'select', { label: 'Modalidad', options: ['Virtual', 'Presencial', 'Híbrido'] }), T('location', 'text', { label: 'Lugar / enlace' }), T('capacity', 'int', { label: 'Cupos (0 = sin límite)' }), T('published', 'bool', { label: 'Publicado' })] },
  courses: { label: 'Aula · Cursos', table: 'courses', order: 'id', cols: ['title', 'level', 'free', 'published'], fields: [T('title', 'text', { label: 'Título', required: 1 }), T('slug', 'slug', { label: 'Slug (URL)' }), T('summary', 'textarea', { label: 'Resumen', rows: 3 }), T('level', 'text', { label: 'Nivel / duración' }), T('free', 'bool', { label: 'Matrícula gratuita' }), T('published', 'bool', { label: 'Publicado' })] },
  modules: { label: 'Aula · Módulos', table: 'modules', order: 'course_id, ord', cols: ['course_id', 'ord', 'title'], fields: [T('course_id', 'ref', { label: 'Curso', ref: 'courses', refLabel: 'title', required: 1 }), T('title', 'text', { label: 'Título', required: 1 }), T('ord', 'int', { label: 'Orden' })] },
  lessons: { label: 'Aula · Lecciones', table: 'lessons', order: 'module_id, ord', cols: ['module_id', 'ord', 'title', 'kind'], fields: [T('module_id', 'ref', { label: 'Módulo', ref: 'modules', refLabel: 'title', required: 1 }), T('title', 'text', { label: 'Título', required: 1 }), T('kind', 'select', { label: 'Tipo', options: ['Lectura', 'Taller', 'Evaluación', 'Video'] }), T('minutes', 'int', { label: 'Minutos' }), T('ord', 'int', { label: 'Orden' }), T('body', 'textarea', { label: 'Contenido', rows: 12 }), T('quiz', 'textarea', { label: 'Quiz (JSON, opcional)', rows: 6, hint: '[{"q":"Pregunta","o":["A","B"],"a":0}] — "a" es el índice de la correcta', json: 1 })] },
  resources: { label: 'Aula · Recursos', table: 'resources', order: 'course_id, id', cols: ['course_id', 'title', 'kind', 'url'], fields: [T('course_id', 'ref', { label: 'Curso', ref: 'courses', refLabel: 'title', required: 1 }), T('lesson_id', 'ref', { label: 'Lección (vacío = todo el curso)', ref: 'lessons', refLabel: 'title' }), T('title', 'text', { label: 'Título', required: 1 }), T('url', 'text', { label: 'URL o ruta', required: 1 }), T('kind', 'select', { label: 'Tipo', options: ['Enlace', 'PDF', 'Interactivo', 'Video'] })] },
  campaigns: { label: 'Boletín · Campañas', table: 'campaigns', order: 'id DESC', cols: ['subject', 'status', 'sent_at', 'recipients'], fields: [T('subject', 'text', { label: 'Asunto', required: 1 }), T('body', 'textarea', { label: 'Mensaje (texto plano)', rows: 12, required: 1 })] },
};
const hasSlug = (r) => r.fields.some((f) => f.name === 'slug');

function clean(res, b, existing) {
  const r = SCHEMA[res]; const out = {};
  for (const f of r.fields) {
    if (!(f.name in b)) continue; let v = b[f.name];
    if (f.type === 'int' || f.type === 'ref') v = v === '' || v == null ? null : Number.isFinite(+v) ? Math.trunc(+v) : bad(`«${f.label}» debe ser un número.`);
    else if (f.type === 'bool') v = v ? 1 : 0;
    else if (f.type === 'datetime') { v = v ? (Number.isNaN(Date.parse(v)) ? bad(`«${f.label}» no es una fecha válida.`) : new Date(v).toISOString()) : null; }
    else if (f.type === 'select') { if (v && !f.options.includes(v)) bad(`Valor no válido en «${f.label}».`); }
    else { v = String(v ?? '').slice(0, f.type === 'textarea' ? 60000 : 500); }
    if (f.json && v) { try { const q = JSON.parse(v); if (!Array.isArray(q)) throw 0; } catch { bad('El quiz debe ser un arreglo JSON válido.'); } }
    if (f.required && (v === '' || v == null) && !(existing && f.type === 'slug')) bad(`Falta «${f.label}».`);
    out[f.name] = v;
  }
  if (hasSlug(r)) { const base = out.slug || (!existing ? slugify(out.title || out.name) : ''); if (base || !existing) out.slug = slugify(base) || bad('No se pudo generar el slug.'); }
  if (res === 'products') {
    const kind = out.kind ?? existing?.kind;
    if (kind !== 'physical') out.stock = null; else if ((out.stock ?? existing?.stock) == null) bad('Los productos físicos requieren inventario.');
    if ((out.price ?? existing?.price ?? 0) < 0) bad('El precio no puede ser negativo.');
  }
  return out;
}
const guard = (ctx, admin = false) => { if (!ctx.user || ctx.user.role === 'user' || (admin && ctx.user.role !== 'admin')) bad('No autorizado.', 403); };
const on = (m, p, fn, adminOnly = false) => routes.push([m, new RegExp('^' + p.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), (ctx) => { guard(ctx, adminOnly); return fn(ctx); }]);

on('GET', '/api/admin/schema', () => ({ schema: SCHEMA }));
on('GET', '/api/admin/r/:res', (ctx) => { const r = SCHEMA[ctx.params.res] || bad('No existe.', 404); return { rows: all(`SELECT * FROM ${r.table} ORDER BY ${r.order}`) }; });
on('POST', '/api/admin/r/:res', (ctx) => {
  const res = ctx.params.res; const r = SCHEMA[res] || bad('No existe.', 404); const d = clean(res, ctx.body, null); const keys = Object.keys(d);
  if (res === 'fichas') d.updated_at = nowIso();
  const ks = Object.keys(d);
  try {
    const id = tx(() => { const i = Number(run(`INSERT INTO ${r.table}(${ks.join(',')}) VALUES(${ks.map(() => '?').join(',')})`, ...ks.map((k) => d[k])).lastInsertRowid); if (res === 'products' && d.stock) run("INSERT INTO stock_moves(product_id,delta,reason,created_at) VALUES(?,?,'Inventario inicial',?)", i, d.stock, nowIso()); return i; });
    return { ok: true, id };
  } catch (e) { if (/UNIQUE/.test(e.message)) bad('Ya existe un registro con ese slug.', 409); if (/FOREIGN/.test(e.message)) bad('Referencia inválida (curso, módulo o lección).'); throw e; }
});
on('PUT', '/api/admin/r/:res/:id', (ctx) => {
  const res = ctx.params.res; const r = SCHEMA[res] || bad('No existe.', 404); const cur = get(`SELECT * FROM ${r.table} WHERE id=?`, +ctx.params.id) || bad('No encontrado.', 404);
  const d = clean(res, ctx.body, cur); if (res === 'fichas') d.updated_at = nowIso(); const ks = Object.keys(d); if (!ks.length) return { ok: true };
  try {
    tx(() => {
      run(`UPDATE ${r.table} SET ${ks.map((k) => k + '=?').join(',')} WHERE id=?`, ...ks.map((k) => d[k]), cur.id);
      if (res === 'products' && 'stock' in d && d.stock !== cur.stock && d.stock != null) run("INSERT INTO stock_moves(product_id,delta,reason,created_at) VALUES(?,?,'Ajuste manual (CMS)',?)", cur.id, d.stock - (cur.stock || 0), nowIso());
    });
    return { ok: true };
  } catch (e) { if (/UNIQUE/.test(e.message)) bad('Ya existe un registro con ese slug.', 409); if (/FOREIGN/.test(e.message)) bad('Referencia inválida.'); throw e; }
});
on('DELETE', '/api/admin/r/:res/:id', (ctx) => {
  const r = SCHEMA[ctx.params.res] || bad('No existe.', 404);
  try { run(`DELETE FROM ${r.table} WHERE id=?`, +ctx.params.id); } catch (e) { if (/FOREIGN/.test(e.message)) bad('No se puede eliminar: tiene elementos asociados.', 409); throw e; }
  return { ok: true };
}, true);

on('GET', '/api/admin/orders', () => ({ rows: all(`SELECT o.*, (SELECT group_concat(title || ' ×' || qty, '; ') FROM order_items WHERE order_id=o.id) items FROM orders o ORDER BY id DESC LIMIT 200`) }));
on('PATCH', '/api/admin/orders/:id', async (ctx) => {
  const o = get('SELECT * FROM orders WHERE id=?', +ctx.params.id) || bad('No encontrado.', 404); const to = ctx.body.status;
  const ok = { paid: ['shipped', 'delivered', 'cancelled'], shipped: ['delivered', 'cancelled'], delivered: ['cancelled'], pending: ['cancelled'] }[o.status] || [];
  if (!ok.includes(to)) bad(`No se puede pasar de «${o.status}» a «${to}».`);
  tx(() => {
    run('UPDATE orders SET status=? WHERE id=?', to, o.id);
    if (to === 'cancelled') for (const i of all("SELECT * FROM order_items WHERE order_id=? AND kind='physical'", o.id)) { run('UPDATE products SET stock=stock+? WHERE id=?', i.qty, i.product_id); run('INSERT INTO stock_moves(product_id,delta,reason,order_id,created_at) VALUES(?,?,?,?,?)', i.product_id, i.qty, `Cancelación ${o.code}`, o.id, nowIso()); }
  });
  if (to === 'shipped') await sendMail(o.email, `Tu pedido ${o.code} fue enviado`, `Hola ${o.name},\n\nTu pedido va en camino a la dirección indicada.\n\n${SITE()}/pedidos/${o.code}`, 'envio');
  return { ok: true };
});
on('GET', '/api/admin/stock', () => ({ products: all("SELECT id,title,stock FROM products WHERE kind='physical' ORDER BY stock"), moves: all('SELECT m.*, p.title FROM stock_moves m JOIN products p ON p.id=m.product_id ORDER BY m.id DESC LIMIT 60') }));
on('GET', '/api/admin/subscribers', () => ({ rows: all('SELECT * FROM subscribers ORDER BY id DESC') }));
on('DELETE', '/api/admin/subscribers/:id', (ctx) => { run('DELETE FROM subscribers WHERE id=?', +ctx.params.id); return { ok: true }; }, true);
on('POST', '/api/admin/campaigns/:id/send', async (ctx) => {
  const c = get('SELECT * FROM campaigns WHERE id=?', +ctx.params.id) || bad('No encontrada.', 404); if (c.status === 'sent') bad('Esta campaña ya fue enviada.', 409);
  const subs = all("SELECT * FROM subscribers WHERE status='active'"); if (!subs.length) bad('No hay suscriptores confirmados.');
  for (const s of subs) await sendMail(s.email, c.subject, `${c.body}\n\n—\nPara darte de baja: ${SITE()}/newsletter/baja?token=${s.token}`, 'newsletter');
  run("UPDATE campaigns SET status='sent', sent_at=?, recipients=? WHERE id=?", nowIso(), subs.length, c.id); return { ok: true, recipients: subs.length };
}, true);
on('GET', '/api/admin/messages', () => ({ rows: all('SELECT * FROM messages ORDER BY id DESC LIMIT 200') }));
on('PATCH', '/api/admin/messages/:id', (ctx) => { run('UPDATE messages SET status=? WHERE id=?', ['nuevo', 'atendido'].includes(ctx.body.status) ? ctx.body.status : 'nuevo', +ctx.params.id); return { ok: true }; });
on('GET', '/api/admin/outbox', () => ({ rows: all('SELECT id,to_email,subject,kind,status,created_at,substr(body,1,600) body FROM outbox ORDER BY id DESC LIMIT 100') }));
on('GET', '/api/admin/registrations', () => ({ rows: all('SELECT r.*, e.title FROM event_regs r JOIN events e ON e.id=r.event_id ORDER BY r.id DESC LIMIT 200') }));
on('GET', '/api/admin/students', () => ({ rows: all(`SELECT u.name,u.email,c.title course,e.created_at enrolled_at,
  (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.course_id=c.id) total,
  (SELECT COUNT(*) FROM progress p JOIN lessons l ON l.id=p.lesson_id JOIN modules m ON m.id=l.module_id WHERE p.user_id=u.id AND m.course_id=c.id) done,
  (SELECT MAX(p.completed_at) FROM progress p WHERE p.user_id=u.id) last_activity
  FROM enrollments e JOIN users u ON u.id=e.user_id JOIN courses c ON c.id=e.course_id ORDER BY e.id DESC`) }));
on('GET', '/api/admin/users', () => ({ rows: all('SELECT id,email,name,role,created_at FROM users ORDER BY id') }), true);
on('PATCH', '/api/admin/users/:id', (ctx) => { if (!['user', 'editor', 'admin'].includes(ctx.body.role)) bad('Rol inválido.'); if (+ctx.params.id === ctx.user.id) bad('No puedes cambiar tu propio rol.'); run('UPDATE users SET role=? WHERE id=?', ctx.body.role, +ctx.params.id); return { ok: true }; }, true);

on('GET', '/api/admin/analytics', () => {
  const since = (d) => new Date(Date.now() - d * 864e5).toISOString(); const c = (sql, ...p) => get(sql, ...p).n;
  const days = []; for (let i = 13; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5 - 5 * 36e5).toISOString().slice(0, 10); days.push(d); }
  const byDay = Object.fromEntries(all("SELECT substr(datetime(ts,'-5 hours'),1,10) d, COUNT(*) v, COUNT(DISTINCT sid) u FROM hits WHERE ts>=? GROUP BY d", since(15)).map((r) => [r.d, r]));
  const ev = Object.fromEntries(all('SELECT type, COUNT(*) n FROM track WHERE ts>=? GROUP BY type', since(30)).map((r) => [r.type, r.n]));
  const prodViews = c("SELECT COUNT(*) n FROM hits WHERE ts>=? AND path LIKE '/catalogo/%'", since(30));
  return {
    kpis: { views30: c('SELECT COUNT(*) n FROM hits WHERE ts>=?', since(30)), visitors30: c('SELECT COUNT(DISTINCT sid) n FROM hits WHERE ts>=?', since(30)), users: c('SELECT COUNT(*) n FROM users'), subscribers: c("SELECT COUNT(*) n FROM subscribers WHERE status='active'"), pending_subs: c("SELECT COUNT(*) n FROM subscribers WHERE status='pending'"), orders_paid: c("SELECT COUNT(*) n FROM orders WHERE status IN ('paid','shipped','delivered')"), revenue: c("SELECT COALESCE(SUM(total),0) n FROM orders WHERE status IN ('paid','shipped','delivered')"), enrollments: c('SELECT COUNT(*) n FROM enrollments'), lessons_done: c('SELECT COUNT(*) n FROM progress'), messages_new: c("SELECT COUNT(*) n FROM messages WHERE status='nuevo'") },
    days: days.map((d) => ({ d, views: byDay[d]?.v || 0, visitors: byDay[d]?.u || 0 })),
    top: all('SELECT path, COUNT(*) n FROM hits WHERE ts>=? GROUP BY path ORDER BY n DESC LIMIT 10', since(30)),
    events: ev,
    funnel: [['Vistas de producto', prodViews], ['Añadidos al carrito', ev.add_to_cart || 0], ['Pagos enviados', ev.checkout_submit || 0], ['Compras aprobadas', ev.purchase || 0]],
    lowStock: all("SELECT title,stock FROM products WHERE kind='physical' AND stock<=5 ORDER BY stock"),
  };
});

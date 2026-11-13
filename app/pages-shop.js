import { all, get } from '../lib/db.js';
import { html, raw, money, fdate } from '../lib/util.js';
import { gateway } from '../lib/gateway.js';
import { layout, field, crumbs, pageHead, cover } from './layout.js';
import { notFound } from './pages-public.js';

export const cartRows = (key) => all('SELECT c.qty, p.* FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.cart_key=? AND p.published=1 ORDER BY p.ord', key);
export const cartTotal = (rows) => rows.reduce((a, r) => a + r.price * r.qty, 0);
export const cartCountOf = (key) => get('SELECT COALESCE(SUM(qty),0) n FROM cart_items WHERE cart_key=?', key).n;

export function carrito(ctx) {
  const rows = cartRows(ctx.cartKey);
  const main = rows.length ? html`${pageHead('Carrito', 'Tu carrito')}<section class="wrap pad cart-layout"><div class="cart-lines" data-cart>${rows.map((r) => html`<article class="line" data-line="${r.id}"><div class="mini">${cover(r)}</div><div><h3><a href="/catalogo/${r.slug}">${r.title}</a></h3><p class="muted">${r.kind === 'physical' ? `Disponibles: ${r.stock}` : 'Entrega digital'}</p><button class="linkish" data-remove="${r.id}">Quitar</button></div>
<div class="qty">${r.kind === 'physical' ? html`<label class="sr" for="q${r.id}">Cantidad</label><input id="q${r.id}" type="number" min="1" max="${r.stock}" value="${r.qty}" data-qty="${r.id}">` : html`<span>1</span>`}</div><strong class="line-total">${money(r.price * r.qty)}</strong></article>`)}</div>
<aside class="summary card"><h2>Resumen</h2><dl><div><dt>Artículos</dt><dd data-count-total>${rows.reduce((a, r) => a + r.qty, 0)}</dd></div><div class="total"><dt>Total</dt><dd data-total>${money(cartTotal(rows))}</dd></div></dl><a class="btn block" href="/checkout">Continuar al pago</a><p class="muted small">Pago seguro simulado en modo prueba. Entrega digital tras la confirmación.</p></aside></section>`
    : html`${pageHead('Carrito', 'Tu carrito está vacío')}<section class="wrap pad center"><p class="lead">Explora el catálogo y añade ediciones o la matrícula al aula.</p><a class="btn" href="/catalogo">Ver catálogo</a></section>`;
  return layout(ctx, { title: 'Carrito', noindex: true, main });
}

export function checkout(ctx) {
  if (!ctx.user) return { redirect: '/ingresar?next=/checkout' };
  const rows = cartRows(ctx.cartKey); if (!rows.length) return { redirect: '/carrito' };
  const physical = rows.some((r) => r.kind === 'physical'); const total = cartTotal(rows);
  return layout(ctx, { title: 'Pago', noindex: true, main: html`${pageHead('Checkout', 'Finalizar compra')}<section class="wrap pad cart-layout"><form class="card form" data-api="/api/checkout" data-ok="Pago aprobado. Redirigiendo…" data-redirect-from="redirect">
<h2>Datos del comprador</h2>${field('Nombre completo', 'name', { required: true, value: ctx.user.name, auto: 'name' })}${field('Correo', 'email', { type: 'email', required: true, value: ctx.user.email, auto: 'email' })}
${physical ? field('Dirección de envío (ciudad, dirección, teléfono)', 'address', { textarea: true, rows: 3, required: true, auto: 'street-address' }) : ''}
${total > 0 ? html`<h2>Pago con tarjeta</h2>${field('Número de tarjeta', 'card', { required: true, inputmode: 'numeric', auto: 'cc-number', ph: '4242 4242 4242 4242' })}<div class="two">${field('Vence (MM/AA)', 'exp', { required: true, auto: 'cc-exp', ph: '12/30', pattern: '\\d{2}\\s*/\\s*\\d{2}' })}${field('CVC', 'cvc', { required: true, inputmode: 'numeric', auto: 'cc-csc', ph: '123' })}</div>
${gateway.name === 'sandbox' ? html`<details class="note"><summary>Modo de prueba: tarjetas de ejemplo</summary><ul>${gateway.testCards.map((c) => html`<li><code>${c.number}</code> → ${c.result} (cualquier fecha futura y CVC de 3 dígitos)</li>`)}</ul></details>` : ''}` : html`<p class="note ok">Este pedido no tiene costo: no se requiere tarjeta.</p>`}
<button class="btn block">${total > 0 ? `Pagar ${money(total)}` : 'Confirmar'}</button><p class="form-msg" role="status"></p></form>
<aside class="summary card"><h2>Tu pedido</h2><ul class="plain">${rows.map((r) => html`<li class="row between"><span>${r.qty} × ${r.title}</span><b>${money(r.price * r.qty)}</b></li>`)}</ul><p class="row between total"><span>Total</span><b>${money(total)}</b></p></aside></section>` });
}

const STATUS = { pending: 'Pendiente', paid: 'Pagado', failed: 'Fallido', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
export const statusLabel = (s) => STATUS[s] || s;

export function pedidos(ctx) {
  if (!ctx.user) return { redirect: '/ingresar?next=/pedidos' };
  const rows = all('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC', ctx.user.id);
  const enr = all('SELECT c.slug,c.title FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=?', ctx.user.id);
  return layout(ctx, { title: 'Mi cuenta', noindex: true, main: html`${pageHead('Mi cuenta', `Hola, ${ctx.user.name}`, ctx.user.email)}<section class="wrap pad"><h2>Mis pedidos</h2>${rows.length ? html`<div class="table-wrap"><table class="table"><thead><tr><th>Pedido</th><th>Fecha</th><th>Total</th><th>Estado</th><th></th></tr></thead><tbody>${rows.map((o) => html`<tr><td data-th="Pedido"><a href="/pedidos/${o.code}">${o.code}</a></td><td data-th="Fecha">${fdate(o.created_at)}</td><td data-th="Total">${money(o.total)}</td><td data-th="Estado"><span class="tag ${o.status === 'failed' ? 'warn' : ''}">${statusLabel(o.status)}</span></td><td><a href="/pedidos/${o.code}">Ver</a></td></tr>`)}</tbody></table></div>` : html`<p class="muted">Aún no tienes pedidos. <a href="/catalogo">Ir al catálogo</a>.</p>`}
<h2>Mis cursos</h2>${enr.length ? html`<ul class="plain">${enr.map((c) => html`<li><a href="/aula/${c.slug}">${c.title}</a></li>`)}</ul>` : html`<p class="muted">Sin matrículas. <a href="/aula">Ver el aula</a>.</p>`}</section>` });
}
export function pedido(ctx) {
  if (!ctx.user) return { redirect: `/ingresar?next=/pedidos/${ctx.params.code}` };
  const o = get('SELECT * FROM orders WHERE code=?', ctx.params.code); if (!o || (o.user_id !== ctx.user.id && ctx.user.role === 'user')) return notFound(ctx);
  const items = all('SELECT * FROM order_items WHERE order_id=?', o.id); const paid = ['paid', 'shipped', 'delivered'].includes(o.status);
  const steps = [['Recibido', true], ['Pagado', paid], [items.some((i) => i.kind === 'physical') ? 'Enviado' : 'Entregado', ['shipped', 'delivered'].includes(o.status) || (paid && !items.some((i) => i.kind === 'physical'))]];
  return layout(ctx, { title: `Pedido ${o.code}`, noindex: true, main: html`${pageHead('Pedido', o.code, `${fdate(o.created_at)} · ${statusLabel(o.status)}`)}<section class="wrap pad narrow-ish">${crumbs([['/pedidos', 'Mi cuenta'], [null, o.code]])}
<ol class="steps">${steps.map(([t, on]) => html`<li class="${on ? 'on' : ''}">${t}</li>`)}</ol>
${o.status === 'failed' ? html`<p class="note warn">El pago no se completó: ${o.failure || 'rechazado'}. No se hizo ningún cobro.</p>` : ''}
<div class="table-wrap"><table class="table"><thead><tr><th>Artículo</th><th>Cant.</th><th>Subtotal</th><th>Entrega</th></tr></thead><tbody>${items.map((i) => html`<tr><td data-th="Artículo">${i.title}</td><td data-th="Cant.">${i.qty}</td><td data-th="Subtotal">${money(i.price * i.qty)}</td><td data-th="Entrega">${!paid ? '—' : i.kind === 'digital' ? (i.downloads >= 5 ? 'Límite de descargas alcanzado' : html`<a class="btn sm" href="/descargas/${i.download_token}" data-track="download" data-label="${i.title}">Descargar</a> <small class="muted">(${i.downloads}/5)</small>`) : i.kind === 'course' ? html`<a href="/aula">Ir al aula</a>` : 'Envío a la dirección indicada'}</td></tr>`)}</tbody></table></div>
<p class="row between total"><span>Total</span><b>${money(o.total)}</b></p>${o.payment_ref ? html`<p class="muted small">Referencia de pago: ${o.payment_ref}${o.card_last4 ? ` · tarjeta •••• ${o.card_last4}` : ''}</p>` : ''}${o.address ? html`<p class="muted small">Envío: ${o.address}</p>` : ''}</section>` });
}

export function ingresar(ctx) {
  if (ctx.user) return { redirect: '/pedidos' };
  const next = ctx.query.get('next') || '';
  return layout(ctx, { title: 'Ingresar', noindex: true, main: html`${pageHead('Acceso', 'Ingresar')}<section class="wrap pad narrow"><form class="card form" data-api="/api/login" data-ok="Bienvenida/o. Redirigiendo…" data-redirect="${/^\/[^/]/.test(next) || next === '/' ? next : '/aula'}">${field('Correo', 'email', { type: 'email', required: true, auto: 'username' })}${field('Contraseña', 'password', { type: 'password', required: true, auto: 'current-password' })}<button class="btn block">Ingresar</button><p class="form-msg" role="status"></p><p class="muted">¿No tienes cuenta? <a href="/registro${next ? '?next=' + encodeURIComponent(next) : ''}">Regístrate</a></p></form>
<details class="note"><summary>Cuentas de prueba</summary><p><code>estudiante@baseparkway.test</code> / <code>Estudiante#2026</code> (matriculada en el curso piloto)<br><code>admin@baseparkway.test</code> / <code>Admin#2026</code> (acceso al CMS)</p></details></section>` });
}
export function registro(ctx) {
  if (ctx.user) return { redirect: '/pedidos' };
  const next = ctx.query.get('next') || '';
  return layout(ctx, { title: 'Crear cuenta', noindex: true, main: html`${pageHead('Acceso', 'Crear cuenta')}<section class="wrap pad narrow"><form class="card form" data-api="/api/register" data-ok="Cuenta creada. Redirigiendo…" data-redirect="${/^\/[^/]/.test(next) ? next : '/aula'}">${field('Nombre', 'name', { required: true, auto: 'name' })}${field('Correo', 'email', { type: 'email', required: true, auto: 'email' })}${field('Contraseña', 'password', { type: 'password', required: true, auto: 'new-password', minlength: 8, hint: 'Mínimo 8 caracteres, con letras y números.' })}<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn block">Crear cuenta</button><p class="form-msg" role="status"></p><p class="muted">¿Ya tienes cuenta? <a href="/ingresar">Ingresar</a></p></form></section>` });
}

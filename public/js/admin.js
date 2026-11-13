(() => {
  'use strict';
  const root = document.getElementById('app'); const ROLE = root.dataset.role;
  const h = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) e.append(c instanceof Node ? c : document.createTextNode(c ?? '')); return e; };
  const api = async (method, url, body) => { const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' }, body: body ? JSON.stringify(body) : undefined }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'Error ' + r.status); return d; };
  const money = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
  const fdt = (s) => s ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date(s)) : '';
  const toLocal = (iso) => iso ? new Date(new Date(iso).getTime() - 5 * 36e5).toISOString().slice(0, 16) : '';
  const fromLocal = (v) => v ? v + ':00-05:00' : '';
  const toast = (m, err) => { const t = document.querySelector('.toast') || document.body.appendChild(h('div', { class: 'toast', role: 'status' })); t.textContent = m; t.classList.toggle('err', !!err); t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); };
  let schema = {}, view = 'dashboard'; const refCache = {};
  const main = h('main', { class: 'ad-main', tabindex: '-1', id: 'ad-main' });

  const GROUPS = [['Resumen', [['dashboard', 'Analítica']]], ['Contenido', [['fichas'], ['products'], ['events']]], ['Aula', [['courses'], ['modules'], ['lessons'], ['resources'], ['students', 'Estudiantes y avance']]], ['Tienda', [['orders', 'Pedidos'], ['stock', 'Inventario']]], ['Comunidad', [['campaigns'], ['subscribers', 'Suscriptores'], ['messages', 'Mensajes de contacto'], ['registrations', 'Inscripciones a eventos']]], ['Sistema', [['outbox', 'Correos enviados'], ...(ROLE === 'admin' ? [['users', 'Usuarios y roles']] : [])]]];
  const nav = h('aside', { class: 'ad-side' });
  function drawNav() { nav.replaceChildren(h('div', { class: 'brand' }, h('b', { style: 'font:800 1.2rem var(--ui)' }, 'BASE '), h('span', { style: 'font:600 .8rem var(--ui)' }, 'Parkway · CMS')), h('small', {}, `${root.dataset.name} · ${ROLE}`),
    ...GROUPS.flatMap(([g, items]) => [h('h2', {}, g), ...items.map(([k, label]) => h('button', { class: 'tab', 'aria-current': view === k, onclick: () => go(k) }, label || schema[k]?.label || k))]), h('a', { href: '/' }, '← Ver el sitio')); }
  const go = (k) => { view = k; location.hash = k; drawNav(); render(); };

  const table = (cols, rows, { onClick, fmt = {} } = {}) => h('div', { style: 'overflow-x:auto' }, h('table', { class: 'tbl' }, h('thead', {}, h('tr', {}, cols.map((c) => h('th', {}, c[1])))), h('tbody', {}, rows.length ? rows.map((r) => h('tr', { class: onClick ? 'click' : '', onclick: onClick && (() => onClick(r)) }, cols.map(([k]) => h('td', {}, fmt[k] ? fmt[k](r[k], r) : String(r[k] ?? ''))))) : h('tr', {}, h('td', { colspan: cols.length }, 'Sin registros.')))));
  const pill = (v, on = 'Sí', off = 'No') => h('span', { class: 'pill ' + (v ? 'on' : 'off') }, v ? on : off);

  async function resourceView(key) {
    const sc = schema[key]; const { rows } = await api('GET', '/api/admin/r/' + key); const wrap = h('div'); const formBox = h('div');
    const cols = sc.cols.map((c) => [c, sc.fields.find((f) => f.name === c)?.label || c]);
    const fmt = { published: (v) => pill(v, 'Publicado', 'Oculto'), free: (v) => pill(v, 'Gratis', 'De pago'), price: (v) => money(v), starts_at: fdt, ends_at: fdt, sent_at: (v) => v ? fdt(v) : '—', stock: (v) => v ?? '—', status: (v) => h('span', { class: 'pill' }, v) };
    const open = async (row) => {
      const f = h('form', { class: 'panel' }); f.append(h('h2', {}, row ? `Editar: ${row.title || row.subject || '#' + row.id}` : 'Nuevo registro'));
      const grid = h('div', { class: 'fgrid' }); const inputs = {};
      for (const fd of sc.fields) {
        const id = 'fd-' + fd.name; let input; const val = row ? row[fd.name] : (fd.type === 'bool' ? 1 : '');
        if (fd.type === 'textarea') input = h('textarea', { id, rows: fd.rows || 4 }, val ?? '');
        else if (fd.type === 'bool') { input = h('input', { type: 'checkbox', id, style: 'width:auto;transform:scale(1.3);margin:6px 0' }); input.checked = !!val; }
        else if (fd.type === 'select') { input = h('select', { id }, fd.options.map((o) => h('option', { value: o, selected: o === val }, o))); }
        else if (fd.type === 'ref') { const list = refCache[fd.ref] ||= (await api('GET', '/api/admin/r/' + fd.ref)).rows; input = h('select', { id }, h('option', { value: '' }, '— ninguno —'), list.map((o) => h('option', { value: o.id, selected: o.id === val }, `#${o.id} ${o[fd.refLabel]}`))); }
        else if (fd.type === 'datetime') input = h('input', { type: 'datetime-local', id, value: toLocal(val) });
        else if (fd.type === 'int') input = h('input', { type: 'number', id, value: val ?? '' });
        else input = h('input', { type: 'text', id, value: val ?? '' });
        inputs[fd.name] = [fd, input];
        grid.append(h('div', { class: 'field' + (fd.type === 'textarea' ? ' full' : '') }, h('label', { for: id }, fd.label + (fd.required ? ' *' : '')), input, fd.hint ? h('small', {}, fd.hint) : ''));
      }
      const msg = h('p', { class: 'form-msg', role: 'status' });
      f.append(grid, h('div', { class: 'tools' }, h('button', { class: 'btn sm', type: 'submit' }, 'Guardar'), h('button', { class: 'btn sm ghost', type: 'button', onclick: () => formBox.replaceChildren() }, 'Cancelar'),
        row && ROLE === 'admin' ? h('button', { class: 'btn sm danger', type: 'button', onclick: async () => { if (!confirm('¿Eliminar este registro? No se puede deshacer.')) return; try { await api('DELETE', `/api/admin/r/${key}/${row.id}`); toast('Eliminado'); render(); } catch (e) { msg.className = 'form-msg err'; msg.textContent = e.message; } } }, 'Eliminar') : ''), msg);
      f.addEventListener('submit', async (e) => { e.preventDefault(); const body = {}; for (const [n, [fd, el]] of Object.entries(inputs)) body[n] = fd.type === 'bool' ? el.checked : fd.type === 'datetime' ? fromLocal(el.value) : el.value;
        try { await api(row ? 'PUT' : 'POST', `/api/admin/r/${key}${row ? '/' + row.id : ''}`, body); delete refCache[key]; toast('Guardado ✓'); render(); } catch (er) { msg.className = 'form-msg err'; msg.textContent = er.message; } });
      formBox.replaceChildren(f); f.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const extra = key === 'campaigns' ? { send: (r) => r.status === 'draft' ? h('button', { class: 'btn xs', onclick: async (e) => { e.stopPropagation(); if (!confirm('¿Enviar esta campaña a todos los suscriptores confirmados?')) return; try { const d = await api('POST', `/api/admin/campaigns/${r.id}/send`); toast(`Enviada a ${d.recipients} suscriptores`); render(); } catch (er) { toast(er.message, true); } } }, 'Enviar') : '' } : null;
    const c2 = extra ? [...cols, ['send', '']] : cols; const rows2 = rows.map((r) => ({ ...r, send: r }));
    wrap.append(h('div', { class: 'tools' }, h('button', { class: 'btn sm', onclick: () => open(null) }, '+ Nuevo')), formBox, h('div', { class: 'panel' }, table(c2, rows2, { onClick: open, fmt: { ...fmt, ...(extra ? { send: (r) => extra.send(r) } : {}) } })));
    return wrap;
  }

  const views = {
    async dashboard() {
      const d = await api('GET', '/api/admin/analytics'); const k = d.kpis; const max = Math.max(1, ...d.days.map((x) => x.views));
      const kp = [['Vistas (30 d)', k.views30], ['Visitantes (30 d)', k.visitors30], ['Usuarios', k.users], ['Suscriptores', k.subscribers], ['Pedidos pagados', k.orders_paid], ['Ingresos', money(k.revenue)], ['Matrículas', k.enrollments], ['Lecciones completadas', k.lessons_done], ['Mensajes nuevos', k.messages_new]];
      const fmax = Math.max(1, ...d.funnel.map((x) => x[1]));
      return h('div', {}, h('div', { class: 'kpis' }, kp.map(([l, v]) => h('div', { class: 'kpi' }, h('b', {}, String(v)), h('span', {}, l)))),
        h('div', { class: 'panel' }, h('h2', {}, 'Vistas por día (14 días)'), h('div', { class: 'bars', role: 'img', 'aria-label': 'Gráfico de barras de vistas por día' }, d.days.map((x) => h('div', { style: `height:${Math.max(2, (x.views / max) * 100)}%`, title: `${x.d}: ${x.views} vistas, ${x.visitors} visitantes` }))), h('div', { class: 'bars-x' }, d.days.map((x) => h('span', {}, x.d.slice(8)))), h('details', {}, h('summary', {}, 'Ver datos'), table([['d', 'Día'], ['views', 'Vistas'], ['visitors', 'Visitantes']], d.days))),
        h('div', { class: 'panel' }, h('h2', {}, 'Embudo de compra (30 días)'), d.funnel.map(([l, v]) => h('div', { class: 'hbar' }, h('span', {}, l), h('i', { style: `width:${(v / fmax) * 100}%` }), h('b', {}, String(v))))),
        h('div', { class: 'panel' }, h('h2', {}, 'Páginas más vistas'), table([['path', 'Ruta'], ['n', 'Vistas']], d.top)),
        h('div', { class: 'panel' }, h('h2', {}, 'Acciones registradas (30 días)'), table([['t', 'Acción'], ['n', 'Veces']], Object.entries(d.events).map(([t, n]) => ({ t, n })))),
        d.lowStock.length ? h('div', { class: 'panel' }, h('h2', {}, '⚠ Inventario bajo'), table([['title', 'Producto'], ['stock', 'Quedan']], d.lowStock)) : '');
    },
    async orders() {
      const { rows } = await api('GET', '/api/admin/orders'); const act = (o, to, label, cls = '') => h('button', { class: 'btn xs ' + cls, onclick: async () => { if (to === 'cancelled' && !confirm('¿Cancelar el pedido? Se repone el inventario.')) return; try { await api('PATCH', '/api/admin/orders/' + o.id, { status: to }); toast('Pedido actualizado'); render(); } catch (e) { toast(e.message, true); } } }, label);
      return h('div', { class: 'panel' }, table([['code', 'Pedido'], ['created_at', 'Fecha'], ['name', 'Cliente'], ['items', 'Artículos'], ['total', 'Total'], ['status', 'Estado'], ['id', 'Acciones']], rows, { fmt: { created_at: fdt, total: money, status: (v) => h('span', { class: 'pill ' + (v === 'failed' || v === 'cancelled' ? 'warn' : 'on') }, v), id: (_, o) => h('span', { class: 'tools' }, o.status === 'paid' ? act(o, 'shipped', 'Marcar enviado') : '', ['paid', 'shipped'].includes(o.status) ? act(o, 'delivered', 'Entregado', 'ghost') : '', ['paid', 'shipped', 'delivered', 'pending'].includes(o.status) ? act(o, 'cancelled', 'Cancelar', 'danger') : '') } }));
    },
    async stock() {
      const d = await api('GET', '/api/admin/stock'); return h('div', {}, h('div', { class: 'panel' }, h('h2', {}, 'Existencias (productos físicos)'), table([['title', 'Producto'], ['stock', 'Existencias']], d.products, { fmt: { stock: (v) => h('span', { class: 'pill ' + (v <= 5 ? 'warn' : 'on') }, String(v)) } }), h('p', { class: 'sub' }, 'Para ajustar existencias edita el producto en «Catálogo e inventario».')), h('div', { class: 'panel' }, h('h2', {}, 'Movimientos'), table([['created_at', 'Fecha'], ['title', 'Producto'], ['delta', 'Cambio'], ['reason', 'Motivo']], d.moves, { fmt: { created_at: fdt, delta: (v) => (v > 0 ? '+' : '') + v } })));
    },
    async subscribers() { const { rows } = await api('GET', '/api/admin/subscribers'); return h('div', { class: 'panel' }, table([['email', 'Correo'], ['name', 'Nombre'], ['status', 'Estado'], ['created_at', 'Alta'], ['confirmed_at', 'Confirmado']], rows, { fmt: { created_at: fdt, confirmed_at: fdt, status: (v) => h('span', { class: 'pill ' + (v === 'active' ? 'on' : 'off') }, v) } })); },
    async messages() { const { rows } = await api('GET', '/api/admin/messages'); return h('div', { class: 'panel' }, table([['created_at', 'Fecha'], ['name', 'De'], ['email', 'Correo'], ['subject', 'Asunto'], ['body', 'Mensaje'], ['status', 'Estado']], rows, { fmt: { created_at: fdt, status: (v, r) => h('button', { class: 'btn xs ' + (v === 'nuevo' ? '' : 'ghost'), onclick: async () => { await api('PATCH', '/api/admin/messages/' + r.id, { status: v === 'nuevo' ? 'atendido' : 'nuevo' }); render(); } }, v) } })); },
    async registrations() { const { rows } = await api('GET', '/api/admin/registrations'); return h('div', { class: 'panel' }, table([['created_at', 'Fecha'], ['title', 'Evento'], ['name', 'Nombre'], ['email', 'Correo']], rows, { fmt: { created_at: fdt } })); },
    async students() { const { rows } = await api('GET', '/api/admin/students'); return h('div', { class: 'panel' }, table([['name', 'Estudiante'], ['email', 'Correo'], ['course', 'Curso'], ['enrolled_at', 'Matrícula'], ['done', 'Avance'], ['last_activity', 'Última actividad']], rows, { fmt: { enrolled_at: fdt, last_activity: (v) => v ? fdt(v) : '—', done: (v, r) => `${v}/${r.total} (${r.total ? Math.round((v / r.total) * 100) : 0} %)` } })); },
    async outbox() { const { rows } = await api('GET', '/api/admin/outbox'); return h('div', { class: 'panel' }, h('p', { class: 'sub' }, 'Todo correo del sistema queda registrado aquí. Si configuras RESEND_API_KEY y MAIL_FROM, además se envía.'), table([['created_at', 'Fecha'], ['to_email', 'Para'], ['subject', 'Asunto'], ['kind', 'Tipo'], ['status', 'Estado']], rows, { onClick: (r) => alert(`${r.subject}\n\nPara: ${r.to_email}\n\n${r.body}`), fmt: { created_at: fdt } })); },
    async users() { const { rows } = await api('GET', '/api/admin/users'); return h('div', { class: 'panel' }, table([['name', 'Nombre'], ['email', 'Correo'], ['created_at', 'Alta'], ['role', 'Rol']], rows, { fmt: { created_at: fdt, role: (v, r) => h('select', { onchange: async (e) => { try { await api('PATCH', '/api/admin/users/' + r.id, { role: e.target.value }); toast('Rol actualizado'); } catch (er) { toast(er.message, true); render(); } } }, ['user', 'editor', 'admin'].map((o) => h('option', { value: o, selected: o === v }, o))) } })); },
  };

  async function render() {
    const title = GROUPS.flatMap((g) => g[1]).find(([k]) => k === view); const label = title?.[1] || schema[view]?.label || view;
    main.replaceChildren(h('h1', {}, label), h('p', { class: 'sub' }, 'Cargando…'));
    try { const v = await (views[view] ? views[view]() : resourceView(view)); main.replaceChildren(h('h1', {}, label), v); } catch (e) { main.replaceChildren(h('h1', {}, label), h('p', { class: 'form-msg err' }, e.message)); }
  }
  (async () => { try { schema = (await api('GET', '/api/admin/schema')).schema; } catch (e) { root.textContent = e.message; return; } const hsh = location.hash.slice(1); if (hsh && (views[hsh] || schema[hsh])) view = hsh; root.replaceChildren(h('div', { class: 'ad' }, nav, main)); drawNav(); render(); })();
})();

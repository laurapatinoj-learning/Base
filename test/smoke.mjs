// Prueba de extremo a extremo con base de datos en memoria: navegación, accesos, formularios,
// CMS, compra con pasarela, inventario, entrega digital autorizada, aula y seguimiento.
process.env.DB_FILE = ':memory:'; process.env.PORT = '0'; process.env.SITE_URL = 'http://test.local';
const { server } = await import('../server.js');
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
let pass = 0, fail = 0; const ok = (c, n, extra = '') => { c ? pass++ : fail++; console.log(`${c ? '  ✓' : '  ✗'} ${n}${c ? '' : '  ' + extra}`); };

class Client {
  jar = {};
  async req(method, path, body, headers = {}) {
    const r = await fetch(base + path, { method, redirect: 'manual', headers: { Cookie: Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join('; '), ...(body ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' ? { 'X-Requested-With': 'fetch' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
    for (const c of r.headers.getSetCookie()) { const [kv] = c.split(';'); const [k, v] = kv.split('='); if (v) this.jar[k] = v; else delete this.jar[k]; }
    const text = await r.text(); let json; try { json = JSON.parse(text); } catch { /* html */ }
    return { status: r.status, text, json, headers: r.headers };
  }
  get = (p, h) => this.req('GET', p, null, h); post = (p, b) => this.req('POST', p, b || {}); put = (p, b) => this.req('PUT', p, b); patch = (p, b) => this.req('PATCH', p, b); del = (p) => this.req('DELETE', p);
}
const section = (t) => console.log(`\n${t}`);
const anon = new Client();

section('1. Sitio navegable, responsive y SEO');
const pages = ['/', '/archivo', '/fichas', '/fichas/el-artefacto-de-ishango', '/fichas/tres-columnas-dieciseis-numeros', '/fichas/primos-gemelos-en-el-hueso', '/fichas/numeros-empedocles-e-ishango-60', '/fichas/168-pi-de-mil', '/catalogo', '/catalogo/dossier-ishango-pdf', '/agenda', '/agenda/lectura-guiada-hueso-de-ishango', '/newsletter', '/contacto', '/carrito', '/ingresar', '/registro', '/aula', '/aula/ishango-numeros-primos', '/ayuda', '/privacidad'];
for (const p of pages) { const r = await anon.get(p); ok(r.status === 200 && /<title>.+<\/title>/.test(r.text) && /<meta name="description"/.test(r.text) && /name="viewport"/.test(r.text) && /<h1/.test(r.text), `GET ${p} → 200 con title, description, viewport y h1`, r.status); }
const home = await anon.get('/');
ok(/rel="canonical"/.test(home.text) && /og:title/.test(home.text) && /application\/ld\+json/.test(home.text), 'Canonical, Open Graph y JSON-LD presentes');
ok(/lang="es-CO"/.test(home.text), 'Idioma declarado es-CO');
const arc = await anon.get('/archivo');
ok(/almonacid-autor\.jpg/.test(arc.text) && /periodico\.unal\.edu\.co/.test(arc.text) && /data-explorer/.test(arc.text), 'Archivo Ishango integra la imagen, la fuente y el explorador');
ok((await anon.get('/img/almonacid-autor.jpg')).status === 200, 'Imagen del archivo se sirve');
const sm = await anon.get('/sitemap.xml'); ok(/<loc>http:\/\/test\.local\/archivo<\/loc>/.test(sm.text) && sm.text.includes('/fichas/168-pi-de-mil'), 'sitemap.xml incluye archivo y fichas');
ok(/Sitemap:/.test((await anon.get('/robots.txt')).text), 'robots.txt apunta al sitemap');
ok((await anon.get('/nada-aqui')).status === 404, 'Página inexistente → 404');
ok(/default-src 'self'/.test(home.headers.get('content-security-policy')), 'Cabeceras de seguridad (CSP)');
ok((await anon.get('/ayuda')).text.includes('estudiante@baseparkway.test'), 'Manual de uso publicado en /ayuda');

section('2. Accesos (registro, login, roles)');
ok((await anon.post('/api/login', { email: 'estudiante@baseparkway.test', password: 'mala' })).status === 401, 'Login con clave incorrecta → 401');
ok((await anon.req('POST', '/api/login', { email: 'x@y.co', password: 'a' }, { 'X-Requested-With': '' })).status === 403, 'POST sin cabecera anti-CSRF → 403');
ok((await anon.get('/admin')).status === 302, '/admin sin sesión → redirige a ingresar');
ok((await anon.get('/api/admin/schema')).status === 403, 'API del CMS sin sesión → 403');
const nuevo = new Client();
ok((await nuevo.post('/api/register', { name: 'Ana Prueba', email: 'ana@prueba.co', password: 'corta' })).status === 400, 'Registro con clave débil → 400');
const reg = await nuevo.post('/api/register', { name: 'Ana Prueba', email: 'ana@prueba.co', password: 'Clave12345' });
ok(reg.status === 200 && nuevo.jar.bp_session, 'Registro crea cuenta y sesión');
ok((await nuevo.post('/api/register', { name: 'Ana', email: 'ana@prueba.co', password: 'Clave12345' })).status === 409, 'Correo duplicado → 409');
ok((await nuevo.get('/pedidos')).status === 200, 'Usuario ve su cuenta');
ok((await nuevo.get('/admin')).status === 403, 'Usuario sin rol no entra al CMS');
ok((await nuevo.get('/api/admin/orders')).status === 403, 'Usuario sin rol no usa la API del CMS');

section('3. Formularios y seguimiento (boletín, contacto, agenda)');
ok((await anon.post('/api/newsletter', { email: 'mal' })).status === 400, 'Boletín valida correo');
ok((await anon.post('/api/newsletter', { email: 'lector2@prueba.co' })).status === 200, 'Suscripción al boletín (pendiente)');
const admin = new Client();
ok((await admin.post('/api/login', { email: 'admin@baseparkway.test', password: 'Admin#2026' })).json?.role === 'admin', 'Login de administración');
let outbox = (await admin.get('/api/admin/outbox')).json.rows;
const conf = outbox.find((m) => m.kind === 'newsletter-confirmar');
const tok = /token=([a-f0-9]+)/.exec((await admin.get('/api/admin/outbox')).json.rows.find((m) => m.kind === 'newsletter-confirmar').body)?.[1];
ok(!!conf && !!tok, 'Correo de confirmación del boletín registrado');
ok((await anon.get(`/newsletter/confirmar?token=${tok}`)).text.includes('Suscripción confirmada'), 'Confirmación en dos pasos activa al suscriptor');
ok((await admin.get('/api/admin/subscribers')).json.rows.some((s) => s.email === 'lector2@prueba.co' && s.status === 'active'), 'Suscriptor visible como activo en el CMS');
ok((await anon.post('/api/newsletter', { email: 'bot@spam.co', website: 'http://spam' })).json?.ok === true && !(await admin.get('/api/admin/subscribers')).json.rows.some((s) => s.email === 'bot@spam.co'), 'Honeypot descarta bots sin error visible');
ok((await anon.post('/api/contact', { name: 'Luis', email: 'luis@x.co', subject: 'Hola', body: '¿Tienen taller en línea?' })).status === 200, 'Formulario de contacto');
ok((await admin.get('/api/admin/messages')).json.rows.some((m) => m.email === 'luis@x.co'), 'Mensaje de contacto llega al CMS');
const ev = (await admin.get('/api/admin/r/events')).json.rows[0];
ok((await anon.post(`/api/events/${ev.id}/register`, { name: 'Marta', email: 'marta@x.co' })).status === 200, 'Inscripción a evento');
ok((await anon.post(`/api/events/${ev.id}/register`, { name: 'Marta', email: 'marta@x.co' })).status === 409, 'Inscripción duplicada → 409');
const ics = await anon.get(`/agenda/${ev.slug}.ics`); ok(ics.status === 200 && ics.text.includes('BEGIN:VEVENT') && ics.headers.get('content-type').includes('calendar'), 'Archivo .ics del evento');

section('4. CMS: crear, editar, publicar y ocultar');
const nf = await admin.post('/api/admin/r/fichas', { title: 'Ficha de prueba CMS', summary: 'Resumen', body: '## Hola\n\nTexto con **negrita** y <script>alert(1)</script>', published: true, ord: 9 });
ok(nf.status === 200 && nf.json.id, 'Crear ficha (slug automático)');
let fp = await anon.get('/fichas/ficha-de-prueba-cms'); ok(fp.status === 200 && fp.text.includes('<strong>negrita</strong>'), 'Ficha publicada se ve en el sitio');
ok(!fp.text.includes('<script>alert(1)</script>') && fp.text.includes('&lt;script&gt;'), 'El contenido se escapa (sin XSS)');
ok((await admin.put(`/api/admin/r/fichas/${nf.json.id}`, { title: 'Ficha editada', published: false })).status === 200, 'Editar y ocultar ficha');
ok((await anon.get('/fichas/ficha-de-prueba-cms')).status === 404, 'Ficha oculta → 404 público');
ok((await admin.post('/api/admin/r/fichas', { title: '' })).status === 400, 'CMS valida campos obligatorios');
ok((await admin.post('/api/admin/r/products', { title: 'Libro', kind: 'physical', price: 10000 })).status === 400, 'Producto físico exige inventario');
const np = await admin.post('/api/admin/r/products', { title: 'Marcapáginas Ishango', kind: 'physical', price: 5000, stock: 3, description: 'Prueba', published: true }); ok(np.status === 200, 'Crear producto físico con inventario');
const idx = (await anon.get('/fichas')).text; ok((idx.match(/class="card ficha/g) || []).length === 5, 'El sitio muestra exactamente 5 fichas editoriales publicadas');
ok((await nuevo.put(`/api/admin/r/fichas/${nf.json.id}`, { title: 'x' })).status === 403, 'Un usuario sin rol no puede editar');

section('5. Carrito, pedidos, pasarela, inventario y entrega digital');
const prods = (await admin.get('/api/admin/r/products')).json.rows; const dossier = prods.find((p) => p.slug === 'dossier-ishango-pdf'); const poster = prods.find((p) => p.slug === 'poster-ishango-borgona'); const mark = prods.find((p) => p.id === np.json.id);
const buyer = new Client(); await buyer.post('/api/register', { name: 'Comprador Uno', email: 'comprador@prueba.co', password: 'Compra12345' });
let c = await buyer.post('/api/cart', { product_id: dossier.id }); ok(c.json.count === 1, 'Añadir PDF al carrito');
c = await buyer.post('/api/cart', { product_id: mark.id, qty: 2 }); ok(c.json.count === 3 && c.json.total === 24000 + 10000, 'Añadir producto físico ×2 y calcular total');
c = await buyer.post('/api/cart', { product_id: mark.id, qty: 5 }); ok(c.json.count === 4, 'El carrito no supera el inventario (3)');
c = await buyer.patch(`/api/cart/${mark.id}`, { qty: 2 }); ok(c.json.count === 3, 'Ajustar cantidad en el carrito (PATCH)');
ok((await buyer.get('/carrito')).text.includes('Marcapáginas'), 'Página de carrito muestra los artículos');
ok((await buyer.post('/api/checkout', { name: 'Comprador Uno', email: 'comprador@prueba.co', card: '4242424242424242', exp: '12/30', cvc: '123' })).status === 400, 'Checkout exige dirección para productos físicos');
let r = await buyer.post('/api/checkout', { name: 'Comprador Uno', email: 'comprador@prueba.co', address: 'Bogotá, Cra 7 # 10-20', card: '4000 0000 0000 0002', exp: '12/30', cvc: '123' });
ok(r.status === 402, 'Tarjeta rechazada → 402', r.text);
let st = (await admin.get('/api/admin/r/products')).json.rows.find((p) => p.id === mark.id).stock; ok(st === 3, 'Pago fallido libera el inventario reservado (stock sigue en 3)', st);
ok((await buyer.post('/api/checkout', { name: 'C', email: 'c@x.co', address: 'Bogotá, Cra 7 # 10-20', card: '1234 5678 9012 3456', exp: '12/30', cvc: '123' })).status === 402, 'Tarjeta inválida (Luhn) rechazada');
r = await buyer.post('/api/checkout', { name: 'Comprador Uno', email: 'comprador@prueba.co', address: 'Bogotá, Cra 7 # 10-20', card: '4242 4242 4242 4242', exp: '12/30', cvc: '123' });
ok(r.status === 200 && /^BP-/.test(r.json.code), 'Pago aprobado crea el pedido', r.text); const code = r.json.code;
st = (await admin.get('/api/admin/r/products')).json.rows.find((p) => p.id === mark.id).stock; ok(st === 1, 'Inventario descontado tras el pago (3 − 2 = 1)', st);
ok(/^0$/.test(String((await buyer.get('/carrito')).text.match(/data-cart-count>(\d+)/)?.[1])), 'El carrito queda vacío');
const ped = await buyer.get(`/pedidos/${code}`); ok(ped.status === 200 && ped.text.includes('Pagado') && /\/descargas\/[a-f0-9]{48}/.test(ped.text), 'Pedido muestra estado Pagado y enlace de descarga');
const dl = /\/descargas\/([a-f0-9]{48})/.exec(ped.text)[1];
ok((await anon.get(`/descargas/${dl}`)).status === 302, 'Descarga sin sesión → redirige a ingresar');
ok((await nuevo.get(`/descargas/${dl}`)).status === 403, 'Otro usuario NO puede descargar (autorización por dueño)');
const file = await buyer.get(`/descargas/${dl}`); ok(file.status === 200 && file.headers.get('content-type') === 'application/pdf' && file.text.startsWith('%PDF'), 'El comprador descarga el PDF autorizado');
for (let i = 0; i < 4; i++) await buyer.get(`/descargas/${dl}`); ok((await buyer.get(`/descargas/${dl}`)).status === 403, 'Límite de 5 descargas');
outbox = (await admin.get('/api/admin/outbox')).json.rows;
ok(outbox.some((m) => m.kind === 'pedido' && m.to_email === 'comprador@prueba.co'), 'Correo de confirmación de pedido');
ok(outbox.some((m) => m.kind === 'entrega-digital' && m.body.includes('/descargas/')), 'Correo de entrega digital con enlace');
ok(outbox.some((m) => m.kind === 'bienvenida'), 'Correo de bienvenida');
const ords = (await admin.get('/api/admin/orders')).json.rows; const o1 = ords.find((o) => o.code === code);
ok(ords.some((o) => o.status === 'failed') && o1.status === 'paid', 'CMS lista pedidos pagados y fallidos');
ok((await admin.patch(`/api/admin/orders/${o1.id}`, { status: 'shipped' })).status === 200 && (await admin.get('/api/admin/outbox')).json.rows.some((m) => m.kind === 'envio'), 'Marcar enviado notifica por correo');
ok((await admin.patch(`/api/admin/orders/${o1.id}`, { status: 'paid' })).status === 400, 'Transición de estado inválida → 400');
ok((await admin.patch(`/api/admin/orders/${o1.id}`, { status: 'cancelled' })).status === 200 && (await admin.get('/api/admin/r/products')).json.rows.find((p) => p.id === mark.id).stock === 3, 'Cancelar pedido repone el inventario');
const sm2 = (await admin.get('/api/admin/stock')).json; ok(sm2.moves.some((m) => /Reserva/.test(m.reason)) && sm2.moves.some((m) => /Liberación/.test(m.reason)) && sm2.moves.some((m) => /Cancelación/.test(m.reason)), 'Historial de inventario registra reserva, liberación y cancelación');
ok((await buyer.get(`/pedidos/${code}`)).text.length > 0 && (await nuevo.get(`/pedidos/${code}`)).status === 404, 'Un pedido ajeno no es visible');
// sin existencias
const b2 = new Client(); await b2.post('/api/register', { name: 'Dos', email: 'dos@prueba.co', password: 'Compra12345' });
await admin.put(`/api/admin/r/products/${poster.id}`, { stock: 0 }); ok((await b2.post('/api/cart', { product_id: poster.id })).status === 409, 'Producto agotado no se puede añadir');

section('6. Aula: usuario y matrícula de prueba, avance, manual');
const est = new Client(); ok((await est.post('/api/login', { email: 'estudiante@baseparkway.test', password: 'Estudiante#2026' })).status === 200, 'Login del usuario de prueba (estudiante)');
const aula = await est.get('/aula'); ok(aula.text.includes('38 %') && aula.text.includes('3/8'), 'Matrícula de prueba con avance sembrado visible (3/8, 38 %)', aula.text.match(/\d+\/\d+ completadas · \d+ %/)?.[0]);
const course = await est.get('/aula/ishango-numeros-primos'); const lessons = [...course.text.matchAll(/leccion\/(\d+)/g)].map((m) => +m[1]).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
ok(lessons.length === 8, 'El curso tiene 8 lecciones organizadas en módulos', lessons.length); ok((course.text.match(/class="module"/g) || []).length === 3, 'Tres módulos');
const l4 = lessons[3]; const lp = await est.get(`/aula/ishango-numeros-primos/leccion/${l4}`); ok(lp.status === 200 && lp.text.includes('data-complete'), 'Lección accesible con botón de completar');
r = await est.post(`/api/lessons/${l4}/complete`); ok(r.json.done === 4 && r.json.pct === 50, 'Completar lección registra avance (4/8 = 50 %)', JSON.stringify(r.json));
ok((await est.post(`/api/lessons/${l4}/complete`)).json.done === 4, 'Completar dos veces no duplica el avance');
const quizId = lessons[7]; ok((await est.post(`/api/lessons/${quizId}/complete`)).status === 400, 'Las evaluaciones no se completan sin aprobar');
r = await est.post(`/api/lessons/${quizId}/quiz`, { answers: [0, 0, 0, 0] }); ok(r.json.passed === false && r.json.wrong.length >= 3, 'Evaluación reprobada no suma avance', JSON.stringify(r.json));
r = await est.post(`/api/lessons/${quizId}/quiz`, { answers: [2, 1, 1, 1] }); ok(r.json.passed === true && r.json.score === 100 && r.json.done === 5, 'Evaluación aprobada (100 %) suma avance', JSON.stringify(r.json));
ok((await est.get('/aula')).text.includes('5/8'), 'El avance persiste y se refleja en el aula (5/8)');
ok((await anon.get(`/aula/ishango-numeros-primos/leccion/${l4}`)).status === 302, 'Lección sin sesión → redirige a ingresar');
ok((await nuevo.get(`/aula/ishango-numeros-primos/leccion/${l4}`)).status === 302, 'Lección sin matrícula → redirige al programa');
ok((await nuevo.post(`/api/lessons/${l4}/complete`)).status === 403, 'No se puede registrar avance sin matrícula');
ok((await nuevo.post('/api/courses/1/enroll')).json.redirect === '/aula/ishango-numeros-primos', 'Matrícula gratuita desde el aula');
ok((await nuevo.get(`/aula/ishango-numeros-primos/leccion/${l4}`)).status === 200, 'Tras matricularse accede a las lecciones');
ok((await anon.get('/recursos/hoja-de-trabajo-ishango.pdf')).status === 302, 'Recursos del aula requieren sesión');
const rec = await est.get('/recursos/hoja-de-trabajo-ishango.pdf'); ok(rec.status === 200 && rec.text.startsWith('%PDF'), 'Matriculados descargan los recursos del aula');
const stu = (await admin.get('/api/admin/students')).json.rows.find((s) => s.email === 'estudiante@baseparkway.test'); ok(stu.done === 5 && stu.total === 8, 'CMS muestra el avance del estudiante (5/8)', JSON.stringify(stu));
const cp = prods.find((p) => p.kind === 'course'); const b3 = new Client(); await b3.post('/api/register', { name: 'Tres', email: 'tres@prueba.co', password: 'Compra12345' }); await b3.post('/api/cart', { product_id: cp.id });
r = await b3.post('/api/checkout', { name: 'Tres', email: 'tres@prueba.co' }); ok(r.status === 200, 'Comprar la matrícula gratuita (total $0) sin tarjeta', r.text); ok((await b3.get('/aula')).text.includes('0/8'), 'La compra de matrícula matricula automáticamente');

section('7. Boletín (campañas) y analítica');
const camp = (await admin.get('/api/admin/r/campaigns')).json.rows[0]; r = await admin.post(`/api/admin/campaigns/${camp.id}/send`); ok(r.json.recipients >= 2, 'Campaña enviada a suscriptores confirmados', JSON.stringify(r.json));
ok((await admin.post(`/api/admin/campaigns/${camp.id}/send`)).status === 409, 'Una campaña no se envía dos veces');
const an = (await admin.get('/api/admin/analytics')).json;
ok(an.kpis.views30 > 20 && an.top.length > 0 && an.days.length === 14, 'Analítica: vistas, top de páginas y serie de 14 días', JSON.stringify(an.kpis));
ok(an.events.add_to_cart >= 3 && an.events.purchase >= 2 && an.events.signup >= 4 && an.events.lesson_complete >= 1 && an.events.quiz_pass >= 1 && an.events.newsletter_subscribe >= 1 && an.events.contact >= 1 && an.events.download >= 1, 'Seguimiento de eventos clave (carrito, compra, registro, aula, boletín, contacto, descarga)', JSON.stringify(an.events));
ok(an.funnel.length === 4 && an.kpis.orders_paid >= 1 && an.kpis.revenue === 0 && an.funnel[3][1] >= 2, 'Embudo calculado; ingresos excluyen pedidos cancelados');
ok((await admin.get('/api/admin/users')).json.rows.length >= 5 && (await nuevo.get('/api/admin/users')).status === 403, 'Gestión de usuarios solo para administración');

section('8. Multilingüe (ES/EN/PT), preguntas frecuentes, resumen del profesor e imágenes UNAL');
const newPages = ['/preguntas', '/biblioteca', '/autor'];
for (const l of ['', '/en', '/pt']) for (const p of ['/', '/archivo', ...newPages, '/fichas', '/fichas/primos-gemelos-en-el-hueso', '/catalogo', '/agenda', '/aula', '/aula/ishango-numeros-primos', '/contacto', '/newsletter']) {
  const r = await anon.get(l + (p === '/' && l ? '' : p) || '/'); ok(r.status === 200 && /<h1/.test(r.text), `GET ${l || '/es'}${p === '/' ? '' : p} → 200`, r.status);
}
const en = await anon.get('/en/archivo'), pt = await anon.get('/pt/preguntas'), es = await anon.get('/preguntas');
ok(/<html lang="en"/.test(en.text) && /The enigmatic Ishango bone/.test(en.text), 'Versión EN con <html lang="en"> y contenido en inglés');
ok(/<html lang="pt"/.test(pt.text) && /Perguntas frequentes/.test(pt.text), 'Versión PT con <html lang="pt"> y contenido en portugués');
ok(/hreflang="en"/.test(es.text) && /hreflang="pt"/.test(es.text) && /hreflang="es"/.test(es.text), 'hreflang para los tres idiomas');
ok(/href="\/en\/fichas"/.test(en.text) && !/href="\/fichas"/.test(en.text.replace(/hreflang[^>]*>/g, '')), 'Los enlaces internos de la versión EN conservan el idioma');
ok(/class="lang"/.test(es.text) && /\/pt\/preguntas/.test(es.text), 'Selector de idioma enlaza a la misma página en otro idioma');
ok((await anon.get('/en/fichas/primos-gemelos-en-el-hueso')).text.includes('Twin primes on the bone'), 'Fichas traducidas (EN)');
ok((await anon.get('/pt/catalogo')).text.includes('Dossiê Ishango'), 'Catálogo traducido (PT)');
const faq = es.text;
ok([1, 2, 3, 4, 5].every((n) => faq.includes(`id="q${n}"`)) && /¿Cuándo sucedió\?/.test(faq) && /¿Dónde sucedió\?/.test(faq) && /¿Qué es una muesca\?/.test(faq), 'Preguntas frecuentes: las 5 preguntas');
ok(/data-timeline/.test(faq) && /data-map/.test(faq) && /data-notch/.test(faq) && /data-numgrid/.test(faq), 'FAQ con línea de tiempo, mapa, tallado y cuadrícula interactivos');
ok(/poster-art/.test(faq) && faq.includes('Papio') && (await anon.get('/img/poster-ishango.svg')).status === 200, 'Lámina técnica del babuino al hueso');
ok(/peroné/.test(faq) && /Congo/.test(faq) && /Uganda/.test(faq) && /No fue en Grecia ni en Europa/.test(faq), 'Respuestas: peroné, Congo/Uganda y mirada no eurocéntrica');
const arc2 = (await anon.get('/archivo')).text;
for (const f of ['unal-1', 'unal-2', 'unal-3', 'unal-4', 'unal-5', 'unal-8']) ok(arc2.includes(`/img/unal/${f}.jpg`) && (await anon.get(`/img/unal/${f}.jpg`)).status === 200, `Imagen del Periódico UNAL preservada: ${f}.jpg`);
ok(/Royal Belgian Institute of Natural Sciences/.test(arc2) && /Christof Stache \/ AFP/.test(arc2), 'Se conservan los créditos de las fotografías');
ok(/data-emp/.test(arc2) && (arc2.match(/class="pt n-/g) || []).length === 12, 'Gráfico interactivo del 60 n(i): 12 puntos (6 por sección)');
ok(/class="grp n-p"/.test(arc2) && /class="grp n-o"/.test(arc2) && /class="grp n-e"/.test(arc2), 'Convención de color: primos (rojo), compuestos impares (verde) y pares (negro)');
ok(/legend/.test(arc2) && /Compuesto impar/.test(arc2), 'Leyenda de la convención visible');
ok(/data-block="profesor-resumen"/.test((await anon.get('/')).text) && /Doctor en Derecho/.test((await anon.get('/')).text), 'Resumen del profesor en la portada');
ok(/Doctor en Derecho/.test(arc2) && /Fin de la soledad de los números primos/.test(arc2), 'Resumen del profesor también en el archivo');
const aut = (await anon.get('/autor')).text; ok(/Logos del Segundo Bastón de Ishango/.test(aut) && /ISBN 978-628-95692-4-7/.test(aut) && /ISBN 978-628-7626-71-3/.test(aut), 'Página del autor con la obra en curso y las referencias con ISBN');
ok(/doctorate in law/.test((await anon.get('/en/autor')).text) && /Doutor em Direito/.test((await anon.get('/pt/autor')).text), 'Perfil del autor en EN y PT');
const lib = (await anon.get('/biblioteca')).text; ok(/Biblioteca Ishango/.test(lib) && /id="consulta"/.test(lib) && /Sistema Ishango/.test(lib), 'Biblioteca Ishango con vínculo de consultas');
ok((await anon.post('/api/contact', { name: 'Lectora', email: 'l@x.co', subject: 'Consulta sobre el artículo (Biblioteca Ishango)', body: '¿Dónde está el dato de 62 %?' })).status === 200 && (await admin.get('/api/admin/messages')).json.rows.some((m) => m.subject.includes('Consulta sobre el artículo')), 'Consultas sobre el artículo llegan al CMS');
// El resumen del profesor se edita desde el CMS y se refleja en la portada
const blocks = (await admin.get('/api/admin/r/blocks')).json.rows; const br = blocks.find((b) => b.key === 'profesor-resumen');
ok(!!br && blocks.length === 2, 'CMS: bloques editables del profesor (resumen y perfil completo)');
ok((await admin.put(`/api/admin/r/blocks/${br.id}`, { body: 'Resumen **actualizado** desde el CMS.' })).status === 200 && (await anon.get('/')).text.includes('<strong>actualizado</strong>'), 'Editar el resumen del profesor en el CMS actualiza la portada');
ok((await anon.get('/en/')).text.includes('Doctor en Derecho') === false && (await anon.get('/en')).text.includes('doctorate in law'), 'El resumen en EN es independiente del texto en ES');
ok((await nuevo.put(`/api/admin/r/blocks/${br.id}`, { body: 'x' })).status === 403, 'Solo el personal edita el resumen');
const sm3 = (await anon.get('/sitemap.xml')).text; ok(/\/en\/preguntas/.test(sm3) && /\/pt\/biblioteca/.test(sm3) && /hreflang="pt"/.test(sm3), 'Sitemap con las tres versiones de idioma');
ok((await anon.get('/en/no-existe')).status === 404 && /We could not find that page/.test((await anon.get('/en/no-existe')).text), '404 en el idioma de la ruta');

console.log(`\n${fail ? '✗' : '✓'} ${pass} pruebas correctas, ${fail} fallidas`); server.close(); process.exit(fail ? 1 : 0);

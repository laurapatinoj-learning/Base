import { readFileSync } from 'node:fs';
import { all, get } from '../lib/db.js';
import { html, raw, md, money, fdate, fday, esc } from '../lib/util.js';
import { ISHANGO, SRC, SRC_URL } from '../lib/content.js';
import { layout, field, crumbs, pageHead, cover, boneSvg, logoMark, siteUrl, SITE_NAME, STATIC } from './layout.js';

export const notFound = (ctx) => ({ status: 404, body: layout(ctx, { title: 'Página no encontrada', noindex: true, main: html`<section class="wrap narrow center pad"><p class="kicker">Error 404</p><h1>No encontramos esa página</h1><p class="lead">Quizá el enlace cambió. Vuelve al archivo o al catálogo.</p><p><a class="btn" href="/">Ir al inicio</a> <a class="btn ghost" href="/archivo">Archivo Ishango</a></p></section>` }) });

const productCard = (p) => html`<article class="card product reveal"><a href="/catalogo/${p.slug}" class="card-cover" tabindex="-1" aria-hidden="true">${cover(p)}</a><div class="card-body"><h3><a href="/catalogo/${p.slug}">${p.title}</a></h3><p class="muted">${p.description}</p><div class="row between"><strong class="price">${p.price ? money(p.price) : 'Gratis'}</strong>${stockBadge(p)}</div>${STATIC ? html`<a class="btn sm ghost" href="/catalogo/${p.slug}">Ver detalle</a>` : html`<button class="btn sm" data-add-cart="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>${p.kind === 'course' ? 'Matricularme' : 'Añadir al carrito'}</button>`}</div></article>`;
export const stockBadge = (p) => p.kind === 'physical' ? (p.stock <= 0 ? html`<span class="tag warn">Agotado</span>` : p.stock <= 5 ? html`<span class="tag warn">Quedan ${p.stock}</span>` : html`<span class="tag">En stock</span>`) : html`<span class="tag">${p.kind === 'digital' ? 'Digital' : 'Aula'}</span>`;
const fichaCard = (f) => html`<article class="card ficha reveal"><p class="kicker">${f.kind}</p><h3><a href="/fichas/${f.slug}">${f.title}</a></h3><p>${f.summary}</p><a class="more" href="/fichas/${f.slug}">Leer ficha <span aria-hidden="true">→</span></a></article>`;
export const eventCard = (e) => { const d = new Date(e.starts_at); return html`<article class="event reveal"><time datetime="${e.starts_at}"><b>${new Intl.DateTimeFormat('es-CO', { day: '2-digit', timeZone: 'America/Bogota' }).format(d)}</b><span>${new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: 'America/Bogota' }).format(d).replace('.', '')}</span></time><div><h3><a href="/agenda/${e.slug}">${e.title}</a></h3><p class="muted">${fdate(e.starts_at, { timeStyle: 'short' })} · ${e.mode}${e.location ? ' · ' + e.location : ''}</p></div><a class="btn sm ghost" href="/agenda/${e.slug}">Inscribirme</a></article>`; };

export function home(ctx) {
  const fichas = all('SELECT * FROM fichas WHERE published=1 ORDER BY ord');
  const hero = html`<section class="hero"><div class="hero-glow" aria-hidden="true"></div><div class="wrap hero-grid">
<div class="hero-copy"><p class="kicker light">Editorial · Archivo · Aula</p>
<h1>Un hueso de hace <span class="accent">20.000 años</span> y una pregunta abierta sobre los primos.</h1>
<p class="lead">El archivo del hueso de Ishango, leído con rigor académico.</p>
<p class="cta"><a class="btn" href="/archivo">Explorar el archivo</a> <a class="btn ghost light" href="/aula">Ir al aula</a></p></div>
<div class="hero-mark" aria-hidden="true">${logoMark('big')}</div></div>
<div class="wrap hero-bone">${boneSvg()}</div></section>`;
  const main = html`
<section class="wrap pad split reveal"><figure class="portrait"><img src="/img/almonacid-autor.jpg" width="400" height="400" alt="Retrato de Juan Jorge Almonacid Sierra" loading="lazy"><figcaption>Juan Jorge Almonacid Sierra · Imagen: Periódico UNAL</figcaption></figure>
<div><p class="kicker">Archivo principal</p><h2>¿Un secreto ancestral de números primos gemelos?</h2>
<p>168 marcas, 16 grupos, 3 columnas. El profesor Juan Jorge Almonacid Sierra (UNAL) revisa qué dicen los números del hueso.</p>
<p><a class="btn" href="/archivo">Leer el archivo</a></p></div></section>
<section class="band"><div class="wrap pad narrow-ish"><p class="kicker">Colección Ishango</p><h2>Cinco fichas</h2><ol class="ficha-list">${fichas.map((f) => html`<li class="reveal"><a href="/fichas/${f.slug}"><small>${f.kind}</small><span>${f.title}</span><i aria-hidden="true">→</i></a></li>`)}</ol></div></section>
<section class="wrap pad center" id="criba"><p class="kicker">Para jugar</p><h2>La criba de Eratóstenes</h2><p class="muted">Tacha múltiplos y quedan los primos. Al final, los gemelos.</p>
<div class="row center-row"><button class="btn sm" data-sieve="play">Reproducir</button><button class="btn sm ghost" data-sieve="reset">Reiniciar</button></div><div class="sieve" data-sieve-grid aria-label="Cuadrícula del 1 al 100 con los números primos resaltados"></div><p class="caption" data-sieve-msg role="status">Pulsa «Reproducir».</p></section>
<section class="band dark"><div class="wrap pad"><div class="tiles">
<a class="tile reveal" href="/catalogo"><small>Catálogo</small><b>Ediciones y guías</b><i aria-hidden="true">→</i></a>
<a class="tile reveal" href="/aula"><small>Aula</small><b>Curso piloto</b><i aria-hidden="true">→</i></a>
<a class="tile reveal" href="/agenda"><small>Agenda</small><b>Próximas citas</b><i aria-hidden="true">→</i></a></div></div></section>
<section class="band cta-band"><div class="wrap pad center"><h2>Novedades, sin ruido</h2><form class="inline-form big" data-api="/api/newsletter" data-ok="Revisa tu correo para confirmar tu suscripción."><label class="sr" for="home-email">Correo electrónico</label><input id="home-email" name="email" type="email" required placeholder="tu@correo.com" autocomplete="email"><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn">Suscribirme</button><p class="form-msg" role="status"></p></form></div></section>`;
  return layout(ctx, { path: '/', main, hero, bodyClass: 'home', jsonld: { '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, url: siteUrl(), logo: siteUrl() + '/img/logo.svg', description: 'Editorial y aula académica sobre el hueso de Ishango.' } });
}

const explorerRow = (col) => html`<div class="ex-row" data-col="${col}"><div class="ex-label"><b>${col}</b><span>${ISHANGO[col].name}</span></div><div class="ex-groups">${ISHANGO[col].groups.map((n) => html`<button type="button" class="grp" data-n="${n}" data-col="${col}" aria-label="Grupo de ${n} marcas, columna ${ISHANGO[col].name}"><b>${n}</b><span class="ticks" aria-hidden="true">${raw('<i></i>'.repeat(n))}</span></button>`)}</div><div class="ex-sum"><small>suma</small><b data-sum="${col}">${ISHANGO[col].groups.reduce((a, b) => a + b, 0)}</b></div></div>`;

export function archivo(ctx) {
  const fichas = all('SELECT slug,title,kind FROM fichas WHERE published=1 ORDER BY ord');
  const main = html`<article class="wrap article">
${crumbs([[null, 'Archivo Ishango']])}
<header class="article-head"><p class="kicker">Archivo principal</p><h1>El enigmático hueso de Ishango: ¿secreto ancestral de números primos gemelos?</h1>
<div class="byline"><img src="/img/almonacid-autor.jpg" width="88" height="88" alt="Retrato de Juan Jorge Almonacid Sierra"><p><strong>Juan Jorge Almonacid Sierra</strong><br><span class="muted">Profesor titular, Facultad de Derecho, Ciencias Políticas y Sociales, Universidad Nacional de Colombia</span><br><span class="muted">Artículo publicado en Periódico UNAL · 20 de agosto de 2025 · <a href="${SRC_URL}" rel="noopener">leer el original</a></span></p></div></header>
<p class="lead drop">En 1950, en la actual República Democrática del Congo, el geólogo belga Jean de Heinzelin descubrió un artefacto que sigue desconcertando a antropólogos y matemáticos: un peroné de babuino fosilizado con más de 20.000 años de antigüedad, con <strong>168 líneas</strong> talladas en <strong>16 grupos</strong> y <strong>3 columnas</strong>.</p>
<aside class="glance"><h2>En 30 segundos</h2><ul><li>Un peroné de babuino con <strong>más de 20.000 años</strong> y 168 muescas.</li><li><strong>10 de 16</strong> números de la tabla son primos, con 4 parejas de primos gemelos.</li><li>Es una <strong>hipótesis en debate</strong>: aún no hay pruebas suficientes.</li></ul><p class="small muted">Síntesis editorial; la fuente primaria es el <a href="${SRC_URL}" rel="noopener">artículo del Periódico UNAL</a>.</p></aside>

<h2>1. ¿Qué dijo De Heinzelin?</h2>
<p>Siete años después del hallazgo, De Heinzelin propuso que los grupos de muescas representan <strong>números</strong>, y que sus relaciones internas —duplicaciones, productos iguales a sumas, sumas iguales a primos, columnas que suman 60— hacen de la pieza una tabla sin parangón entre las conocidas.</p>
<p>Señaló además que la columna izquierda contiene los cuatro primos entre 10 y 20 (11, 13, 17 y 19), cuya suma es 60, y que la central incluye primos menores que 10 (3, 5, 7). Para él eso evidenciaba intención.</p>

<h2>2. El debate</h2>
<p>Décadas después, Alexander Marshack, Dirk Huylebrouck y Vladimir Pletser acompañaron la idea de un sistema de notación numérica, pero concluyeron que <strong>no había pruebas suficientes</strong> para afirmar una comprensión de los números primos.</p>

<h2 id="explorador">3. Explorador de la tabla</h2>
<p>Pulsa los controles para ver lo que describe el análisis. Cada botón es un grupo de muescas; pasa el cursor o enfócalo con el teclado para leer su descripción.</p>
<div class="explorer" data-explorer>
<div class="ex-controls" role="group" aria-label="Capas de lectura"><button class="chip" aria-pressed="false" data-toggle="primes">Mostrar primos</button><button class="chip" aria-pressed="false" data-toggle="twins">Primos gemelos</button><button class="chip" aria-pressed="false" data-toggle="sums">Sumas por columna</button></div>
${['G', 'M', 'D'].map(explorerRow)}
<p class="ex-readout" data-readout role="status" aria-live="polite">Selecciona un grupo para ver su descripción.</p>
<dl class="ex-stats"><div><dt>Marcas</dt><dd data-stat="total">168</dd></div><div><dt>Grupos</dt><dd>16</dd></div><div><dt>Primos</dt><dd data-stat="primes">—</dd></div><div><dt>Parejas gemelas</dt><dd data-stat="twins">—</dd></div></dl></div>

<h2>4. El nuevo examen: primos gemelos</h2>
<p>En su libro <em>Fin de la soledad de los números primos</em> (2025), Almonacid Sierra revisa la teoría de que las agrupaciones indican, al menos, un registro temprano de información sobre los primos. Su examen halla que <strong>10 de los 16 números (62 %)</strong> son primos y que aparecen <strong>primos gemelos</strong> —pares (p, p+2)—: <strong>3,5</strong> y <strong>5,7</strong> en la columna central, y <strong>11,13</strong> y <strong>17,19</strong> en la izquierda.</p>
<details class="fold"><summary>Números Empédocles e Ishango 60</summary>
<p>El análisis de las sumas simétricas (60) introduce los <em>números Empédocles</em> n(e) y <em>Ishango</em> n(i). El 60 es el primer n(e): suma de dos pares de primos gemelos horizontales (pppp). Los cuatro primos del 60 n(e) quedan entre los dos impares del 60 n(i), formando un <strong>sexteto mixto (ippppi)</strong>. Geométricamente, la estructura se replica y da cuenta de un triángulo rectángulo isósceles a distintas escalas.</p></details>
<details class="fold"><summary>168 = π(1000)</summary>
<p>El total de marcas coincide con la cantidad de primos menores que 1.000. El autor lo plantea como pregunta: <em>¿coincidencia u otra evidencia de un conocimiento adelantado a su tiempo?</em></p></details>
<blockquote>«¿Cuál es el verdadero orden detrás del caos aparente de los números primos?» — J. J. Almonacid Sierra</blockquote>

<h2>5. Dónde está hoy</h2>
<p>El hueso se conserva en el Museo Real de Ciencias Naturales de Bélgica, en Bruselas.</p>

<section class="band-inline"><h2>Sigue explorando</h2><ul class="plain cols">${fichas.map((f) => html`<li><a href="/fichas/${f.slug}"><small>${f.kind}</small><br>${f.title}</a></li>`)}</ul><p><a class="btn" href="/catalogo/dossier-ishango-pdf">Descargar el dossier (PDF)</a> <a class="btn ghost" href="/aula">Estudiarlo en el aula</a></p></section>
<section class="cite"><h2>Cómo citar</h2><p>${SRC}</p><p><a href="${SRC_URL}" rel="noopener">${SRC_URL}</a></p><p class="muted">Imagen del autor: Periódico UNAL.</p></section>
</article>`;
  return layout(ctx, { title: 'Archivo: el hueso de Ishango', path: '/archivo', desc: 'Dossier y explorador interactivo del hueso de Ishango: 168 marcas, 16 grupos, 3 columnas, números primos y primos gemelos. Basado en el artículo de J. J. Almonacid Sierra (UNAL).', image: '/img/almonacid-autor.jpg', main,
    jsonld: { '@context': 'https://schema.org', '@type': 'Article', headline: 'El enigmático hueso de Ishango: ¿secreto ancestral de números primos gemelos?', author: { '@type': 'Person', name: 'Juan Jorge Almonacid Sierra' }, datePublished: '2025-08-20', inLanguage: 'es', image: siteUrl() + '/img/almonacid-autor.jpg', isBasedOn: SRC_URL, publisher: { '@type': 'Organization', name: SITE_NAME } } });
}

export function fichasIndex(ctx) {
  const rows = all('SELECT * FROM fichas WHERE published=1 ORDER BY ord');
  return layout(ctx, { title: 'Fichas editoriales', path: '/fichas', desc: 'Las cinco fichas editoriales de la Colección Ishango: objeto, tabla, primos gemelos, números Empédocles y debate.', main: html`${pageHead('Colección Ishango', 'Fichas editoriales', 'Cinco entradas breves para leer el hueso de Ishango con precisión: del objeto al debate.')}<section class="wrap pad"><div class="grid3">${rows.map(fichaCard)}</div></section>` });
}
export function fichaDetail(ctx) {
  const f = get('SELECT * FROM fichas WHERE slug=? AND published=1', ctx.params.slug); if (!f) return notFound(ctx);
  const nav = all('SELECT slug,title,ord FROM fichas WHERE published=1 ORDER BY ord'); const i = nav.findIndex((x) => x.slug === f.slug);
  const prod = get('SELECT slug,title FROM products WHERE ficha_id=? AND published=1', f.id);
  return layout(ctx, { title: f.title, path: `/fichas/${f.slug}`, desc: f.summary, main: html`<article class="wrap article">${crumbs([['/fichas', 'Fichas'], [null, f.kind]])}<header class="article-head"><p class="kicker">${f.kind}</p><h1>${f.title}</h1>${f.subtitle ? html`<p class="lead">${f.subtitle}</p>` : ''}</header>
<dl class="meta"><div><dt>Año de referencia</dt><dd>${f.year || '—'}</dd></div><div><dt>Fuente</dt><dd>${f.source || '—'}</dd></div><div><dt>Etiquetas</dt><dd>${(f.tags || '').split(',').map((t) => t.trim()).filter(Boolean).map((t) => html`<span class="tag">${t}</span> `)}</dd></div></dl>
<div class="prose">${md(f.body)}</div>
${prod ? html`<aside class="note">Esta ficha está disponible en PDF: <a href="/catalogo/${prod.slug}">${prod.title}</a>.</aside>` : ''}
<nav class="pager" aria-label="Fichas">${i > 0 ? html`<a href="/fichas/${nav[i - 1].slug}">← ${nav[i - 1].title}</a>` : html`<span></span>`}${i < nav.length - 1 ? html`<a href="/fichas/${nav[i + 1].slug}">${nav[i + 1].title} →</a>` : ''}</nav></article>`,
    jsonld: { '@context': 'https://schema.org', '@type': 'Article', headline: f.title, description: f.summary, inLanguage: 'es', publisher: { '@type': 'Organization', name: SITE_NAME }, dateModified: f.updated_at } });
}

export function catalogo(ctx) {
  const kind = ctx.query.get('tipo'); const rows = all(`SELECT * FROM products WHERE published=1 ${['digital', 'physical', 'course'].includes(kind) ? 'AND kind=?' : 'AND ?=?'} ORDER BY ord`, ...(kind ? [kind] : [1, 1]));
  const tabs = [['', 'Todo'], ['digital', 'Digital'], ['physical', 'Físico'], ['course', 'Aula']];
  return layout(ctx, { title: 'Catálogo', path: '/catalogo', desc: 'Catálogo de Base Parkway: PDF con entrega digital autorizada, ediciones físicas con inventario y matrícula al aula.', main: html`${pageHead('Catálogo', 'Ediciones y matrícula', 'Compra con pasarela de pago, recibe tu entrega digital autorizada por correo y sigue tu pedido desde tu cuenta.')}<section class="wrap pad"><div class="tabs" role="navigation" aria-label="Filtrar">${tabs.map(([k, t]) => html`<a href="/catalogo${k ? '?tipo=' + k : ''}" ${(kind || '') === k ? raw('aria-current="true"') : ''}>${t}</a>`)}</div><div class="grid3">${rows.map(productCard)}</div></section>` });
}
export function producto(ctx) {
  const p = get('SELECT * FROM products WHERE slug=? AND published=1', ctx.params.slug); if (!p) return notFound(ctx);
  const f = p.ficha_id && get('SELECT slug,title FROM fichas WHERE id=?', p.ficha_id);
  return layout(ctx, { title: p.title, path: `/catalogo/${p.slug}`, desc: p.description, main: html`<section class="wrap pad pdp">${crumbs([['/catalogo', 'Catálogo'], [null, p.title]])}<div class="split"><div>${cover(p)}</div><div><p class="kicker">${{ digital: 'Entrega digital autorizada', physical: 'Edición física', course: 'Aula virtual' }[p.kind]}</p><h1>${p.title}</h1><p class="lead">${p.description}</p><p class="price big">${p.price ? money(p.price) : 'Gratis'}</p><p>${stockBadge(p)}</p>
${STATIC ? html`<p><a class="btn" href="/contacto">Consultar o reservar</a></p><p class="note">La compra en línea abrirá pronto. Escríbenos y te respondemos con el enlace de pago.</p>` : html`<p><button class="btn" data-add-cart="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>${p.kind === 'course' ? 'Matricularme' : 'Añadir al carrito'}</button> <a class="btn ghost" href="/carrito">Ver carrito</a></p>`}
<ul class="plain checks">${p.kind === 'digital' ? '<li>Descarga desde tu cuenta, hasta 5 veces</li><li>Enlace personal enviado por correo</li>' : p.kind === 'physical' ? '<li>Envío a toda Colombia</li><li>Inventario en tiempo real</li>' : '<li>Acceso inmediato al aula</li><li>Avance guardado automáticamente</li>'}</ul>
${f ? html`<p class="muted">Relacionado: <a href="/fichas/${f.slug}">${f.title}</a></p>` : ''}</div></div></section>`,
    jsonld: { '@context': 'https://schema.org', '@type': 'Product', name: p.title, description: p.description, brand: { '@type': 'Brand', name: SITE_NAME }, offers: { '@type': 'Offer', priceCurrency: 'COP', price: p.price, availability: p.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock', url: `${siteUrl()}/catalogo/${p.slug}` } } });
}

export function agenda(ctx) {
  const now = new Date().toISOString(); const up = all('SELECT * FROM events WHERE published=1 AND starts_at>=? ORDER BY starts_at', now); const past = all('SELECT * FROM events WHERE published=1 AND starts_at<? ORDER BY starts_at DESC LIMIT 5', now);
  return layout(ctx, { title: 'Agenda', path: '/agenda', desc: 'Seminarios, talleres y presentaciones de Base Parkway. Inscríbete y añade la fecha a tu calendario.', main: html`${pageHead('Agenda', 'Seminarios, talleres y presentaciones', 'Inscríbete y recibe confirmación por correo con archivo de calendario (.ics).')}<section class="wrap pad narrow-ish"><h2>Próximas</h2>${up.length ? up.map(eventCard) : html`<p class="muted">No hay fechas programadas por ahora.</p>`}${past.length ? html`<h2>Anteriores</h2>${past.map((e) => html`<p class="muted">${fday(e.starts_at)} — ${e.title}</p>`)}` : ''}</section>` });
}
export function evento(ctx) {
  const e = get('SELECT * FROM events WHERE slug=? AND published=1', ctx.params.slug); if (!e) return notFound(ctx);
  const n = get('SELECT COUNT(*) n FROM event_regs WHERE event_id=?', e.id).n; const left = e.capacity ? Math.max(0, e.capacity - n) : null;
  return layout(ctx, { title: e.title, path: `/agenda/${e.slug}`, desc: e.description, main: html`<section class="wrap pad narrow-ish">${crumbs([['/agenda', 'Agenda'], [null, e.title]])}<p class="kicker">${e.mode}</p><h1>${e.title}</h1><p class="lead">${e.description}</p>
<dl class="meta"><div><dt>Cuándo</dt><dd>${fdate(e.starts_at)} (hora de Colombia)</dd></div><div><dt>Dónde</dt><dd>${e.location || e.mode}</dd></div><div><dt>Cupos</dt><dd>${left === null ? 'Abiertos' : left > 0 ? `${left} disponibles` : 'Agotados'}</dd></div></dl>
<p><a class="btn ghost" href="/agenda/${e.slug}.ics" data-track="ics" data-label="${e.slug}">Añadir al calendario (.ics)</a></p>
${left === 0 ? html`<p class="tag warn">Cupos agotados</p>` : html`<form class="card form" data-api="/api/events/${e.id}/register" data-ok="¡Listo! Te enviamos la confirmación por correo."><h2>Inscripción</h2>${field('Nombre', 'name', { required: true, auto: 'name', value: ctx.user?.name })}${field('Correo', 'email', { type: 'email', required: true, auto: 'email', value: ctx.user?.email })}<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn">Inscribirme</button><p class="form-msg" role="status"></p></form>`}</section>`,
    jsonld: { '@context': 'https://schema.org', '@type': 'Event', name: e.title, description: e.description, startDate: e.starts_at, endDate: e.ends_at, eventAttendanceMode: e.mode === 'Virtual' ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode', location: { '@type': 'Place', name: e.location || e.mode }, organizer: { '@type': 'Organization', name: SITE_NAME } } });
}
export function ics(ctx) {
  const e = get('SELECT * FROM events WHERE slug=? AND published=1', ctx.params.slug); if (!e) return null;
  const f = (s) => new Date(s).toISOString().replace(/[-:]|\.\d{3}/g, ''); const t = (s) => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Base Parkway//ES', 'BEGIN:VEVENT', `UID:${e.slug}@baseparkway`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(e.starts_at)}`, `DTEND:${f(e.ends_at || new Date(new Date(e.starts_at).getTime() + 72e5))}`, `SUMMARY:${t(e.title)}`, `DESCRIPTION:${t(e.description)}`, `LOCATION:${t(e.location || e.mode)}`, `URL:${siteUrl()}/agenda/${e.slug}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

export function newsletter(ctx, msg) {
  return layout(ctx, { title: 'Boletín', path: '/newsletter', desc: 'Suscríbete al boletín de Base Parkway: novedades del archivo de Ishango, agenda y aula.', main: html`${pageHead('Boletín', 'Novedades del archivo, la agenda y el aula', 'Un correo cuando hay algo que vale la pena. Confirmación en dos pasos y baja con un clic.')}<section class="wrap pad narrow-ish">${msg ? html`<p class="note ok" role="status">${msg}</p>` : ''}<form class="card form" data-api="/api/newsletter" data-ok="Revisa tu correo para confirmar tu suscripción.">${field('Nombre (opcional)', 'name', { auto: 'name' })}${field('Correo electrónico', 'email', { type: 'email', required: true, auto: 'email' })}<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn">Suscribirme</button><p class="form-msg" role="status"></p></form></section>` });
}
export const newsletterMsg = (ctx, msg, t = 'Boletín') => layout(ctx, { title: t, noindex: true, main: html`<section class="wrap narrow center pad"><h1>${t}</h1><p class="lead">${msg}</p><p><a class="btn" href="/">Volver al inicio</a></p></section>` });

export function contacto(ctx) {
  return layout(ctx, { title: 'Contacto', path: '/contacto', desc: 'Escríbenos: consultas editoriales, académicas o sobre tus pedidos.', main: html`${pageHead('Contacto', 'Escríbenos', 'Respondemos en un máximo de 2 días hábiles.')}<section class="wrap pad narrow-ish"><form class="card form" data-api="/api/contact" data-ok="Mensaje enviado. Te enviamos una copia de recibido por correo.">${field('Nombre', 'name', { required: true, auto: 'name', value: ctx.user?.name })}${field('Correo', 'email', { type: 'email', required: true, auto: 'email', value: ctx.user?.email })}${field('Asunto', 'subject')}${field('Mensaje', 'body', { textarea: true, required: true, max: 3000 })}<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn">Enviar mensaje</button><p class="form-msg" role="status"></p></form></section>` });
}

const manual = () => { try { return readFileSync(new URL('../MANUAL.md', import.meta.url), 'utf8'); } catch { return '## Manual\n\nPróximamente.'; } };
export const ayuda = (ctx) => layout(ctx, { title: 'Manual de uso', path: '/ayuda', desc: 'Manual de uso de la plataforma Base Parkway: cuentas de prueba, tienda, aula, CMS, boletín y analítica.', main: html`${pageHead('Ayuda', 'Manual de uso')}<section class="wrap pad narrow-ish prose">${md(manual())}</section>` });
export const privacidad = (ctx) => layout(ctx, { title: 'Privacidad', path: '/privacidad', main: html`${pageHead('Legal', 'Privacidad y datos')}<section class="wrap pad narrow-ish prose">${STATIC ? md(`## Qué recibimos\n\nSolo lo que tú envías por los formularios (boletín, contacto e inscripciones a eventos), gestionado mediante Netlify Forms.\n\n## Tus derechos\n\nPuedes pedir la consulta, corrección o eliminación de tus datos desde [Contacto](/contacto). La baja del boletín se solicita por el mismo medio.`) : md(`## Qué guardamos\n\nCuenta (nombre, correo, contraseña cifrada con scrypt), pedidos, suscripción al boletín, mensajes de contacto e inscripciones a eventos.\n\n## Analítica\n\nUsamos analítica propia, sin servicios de terceros: registramos páginas vistas y acciones clave con un identificador aleatorio de sesión (cookie técnica). No guardamos IP ni huella del navegador.\n\n## Pagos\n\nNo almacenamos números completos de tarjeta; solo los últimos cuatro dígitos del pago.\n\n## Tus derechos\n\nPuedes pedir la consulta, corrección o eliminación de tus datos desde [Contacto](/contacto). La baja del boletín es de un clic.`)}</section>` });

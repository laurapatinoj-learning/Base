// Páginas públicas del sitio, con soporte ES / EN / PT.
import { readFileSync } from 'node:fs';
import { all, get } from '../lib/db.js';
import { html, raw, md, money, esc } from '../lib/util.js';
import { ISHANGO, SRC, SRC_URL } from '../lib/content.js';
import { tl, pick } from '../lib/i18n.js';
import '../lib/copy-pages.js';
import { LAB_A, LAB_B } from '../lib/copy-lab.js';
import { TR, UNAL_CAPTIONS, UNAL_ALT, LIBRARY } from '../lib/content-i18n.js';
import { layout, field, crumbs, pageHead, cover, boneSvg, logoMark, siteUrl, SITE_NAME, STATIC, legend, numType } from './layout.js';

const UNAL = Object.fromEntries(JSON.parse(readFileSync(new URL('../lib/unal-images.json', import.meta.url), 'utf8')).map((m) => [m.file, m]));
const POSTER = Object.fromEntries(['es', 'en', 'pt'].map((l) => { try { return [l, readFileSync(new URL(`../public/img/lamina-${l}.svg`, import.meta.url), 'utf8').replace(/<\?xml[^>]*>/, '')]; } catch { return [l, '']; } }));
const s = (lang, es, en, pt) => ({ es, en, pt }[lang] ?? es);
const H = (t) => (k) => raw(t(k));
const loc = (kind, row, lang) => (lang === 'es' || !row ? row : { ...row, ...(TR[kind]?.[row.slug]?.[lang] || {}) });
const getBlock = (key, lang) => { const r = get('SELECT * FROM blocks WHERE key=?', key); if (!r) return null; const sf = lang === 'es' ? '' : '_' + lang; const has = sf && r['body' + sf]; return { title: (sf && r['title' + sf]) || r.title, body: has || !sf ? r['body' + sf] || r.body : r.body, fallback: !!sf && !has }; };
const fdl = (iso, lang, opts) => new Intl.DateTimeFormat({ es: 'es-CO', en: 'en-GB', pt: 'pt-BR' }[lang], { timeZone: 'America/Bogota', ...opts }).format(new Date(iso));
const KIND = { Objeto: ['Object', 'Objeto'], Lectura: ['Reading', 'Leitura'], 'Análisis': ['Analysis', 'Análise'], Concepto: ['Concept', 'Conceito'], Debate: ['Debate', 'Debate'] };
const kindLabel = (k, lang) => (lang === 'es' ? k : String(k).replace(/^Ficha (\d+) · (.+)$/, (m, n, w) => `${lang === 'en' ? 'Sheet' : 'Ficha'} ${n} · ${KIND[w]?.[lang === 'en' ? 0 : 1] || w}`));

export const notFound = (ctx) => { const lang = ctx.lang || 'es', t = tl(lang); return { status: 404, body: layout(ctx, { title: t('notfound.h1'), noindex: true, main: html`<section class="wrap narrow center pad"><p class="kicker">${t('notfound.kicker')}</p><h1>${t('notfound.h1')}</h1><p class="lead">${t('notfound.p')}</p><p><a class="btn" href="/">${t('notfound.home')}</a> <a class="btn ghost" href="/preguntas">${t('nav.faq')}</a></p></section>` }) }; };

// Cuestionario por pasos (kind 'a' = dato/patrón/interpretación; 'b' = repaso de las preguntas frecuentes). La lógica vive en public/js/lab.js.
const quiz = (items, lang, kind) => {
  const t = tl(lang); const labels = JSON.stringify(Object.fromEntries([['progress', 'lab.progress'], ['right', 'lab.right'], ['wrong', 'lab.wrong'], ['next', 'lab.next'], ['finish', 'lab.finish'], ['score', 'lab.score'], ['hi', 'lab.msg.hi'], ['mid', 'lab.msg.mid'], ['lo', 'lab.msg.lo']].map(([k, v]) => [k, t(v)])));
  return html`<div class="qz" data-qz="${kind}" data-labels='${labels}'>${kind === 'a' ? html`<ul class="qz-defs">${['d', 'p', 'i'].map((c) => html`<li><b>${t('lab.cat.' + c)}</b> · ${t('lab.def.' + c)}</li>`)}</ul>` : ''}
<p class="qz-progress" data-qz-progress aria-live="polite"></p>
${items.map((it, i) => html`<div class="qz-item" data-i="${i}" ${i ? 'hidden' : ''}><p class="qz-q">${kind === 'a' ? pick(it.s, lang) : pick(it.q, lang)}</p><div class="qz-opts" role="group">${kind === 'a' ? ['d', 'p', 'i'].map((c) => html`<button type="button" class="qz-opt" data-ok="${it.c === c ? 1 : 0}">${t('lab.cat.' + c)}</button>`) : pick(it.o, lang).map((o, oi) => html`<button type="button" class="qz-opt" data-ok="${oi === it.a ? 1 : 0}">${o}</button>`)}</div><p class="qz-fb" hidden role="status"><b></b> <span>${pick(it.e, lang)}</span></p></div>`)}
<div class="qz-sum" hidden><p class="qz-score"></p><p class="qz-msg"></p><button type="button" class="btn sm" data-qz-retry>${t('lab.retry')}</button></div>
<button type="button" class="btn sm qz-next" data-qz-next hidden></button></div>`;
};
const fig = (file, lang, cls = '') => { const m = UNAL[file]; return html`<figure class="unal ${cls}"><img src="/img/unal/${file}" alt="${pick(UNAL_ALT[file], lang)}" width="${m.w}" height="${m.h}" loading="lazy"><figcaption>${UNAL_CAPTIONS[file][lang]}</figcaption></figure>`; };
const fichaCard = (f, lang) => html`<article class="card ficha reveal"><p class="kicker">${kindLabel(f.kind, lang)}</p><h3><a href="/fichas/${f.slug}">${f.title}</a></h3><p>${f.summary}</p><a class="more" href="/fichas/${f.slug}">${s(lang, 'Leer ficha', 'Read sheet', 'Ler ficha')} <span aria-hidden="true">→</span></a></article>`;
const stock = (p, lang) => p.kind === 'physical' ? (p.stock <= 0 ? html`<span class="tag warn">${s(lang, 'Agotado', 'Sold out', 'Esgotado')}</span>` : p.stock <= 5 ? html`<span class="tag warn">${s(lang, 'Quedan ' + p.stock, p.stock + ' left', 'Restam ' + p.stock)}</span>` : html`<span class="tag">${s(lang, 'En stock', 'In stock', 'Em estoque')}</span>`) : html`<span class="tag">${p.kind === 'digital' ? s(lang, 'Digital', 'Digital', 'Digital') : s(lang, 'Aula', 'Classroom', 'Sala de aula')}</span>`;
const productCard = (p, lang) => html`<article class="card product reveal"><a href="/catalogo/${p.slug}" class="card-cover" tabindex="-1" aria-hidden="true">${cover(p, lang)}</a><div class="card-body"><h3><a href="/catalogo/${p.slug}">${p.title}</a></h3><p class="muted">${p.description}</p><div class="row between"><strong class="price">${p.price ? money(p.price) : s(lang, 'Gratis', 'Free', 'Grátis')}</strong>${stock(p, lang)}</div>${STATIC ? html`<a class="btn sm ghost" href="/catalogo/${p.slug}">${s(lang, 'Ver detalle', 'See details', 'Ver detalhes')}</a>` : html`<button class="btn sm" data-add-cart="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>${p.kind === 'course' ? s(lang, 'Matricularme', 'Enrol', 'Matricular-me') : s(lang, 'Añadir al carrito', 'Add to cart', 'Adicionar ao carrinho')}</button>`}</div></article>`;
const eventCard = (e, lang) => { const d = new Date(e.starts_at); return html`<article class="event reveal"><time datetime="${e.starts_at}"><b>${fdl(d, lang, { day: '2-digit' })}</b><span>${fdl(d, lang, { month: 'short' }).replace('.', '')}</span></time><div><h3><a href="/agenda/${e.slug}">${e.title}</a></h3><p class="muted">${fdl(d, lang, { timeStyle: 'short' })} · ${modeLabel(e.mode, lang)}${e.location ? ' · ' + e.location : ''}</p></div><a class="btn sm ghost" href="/agenda/${e.slug}">${s(lang, 'Inscribirme', 'Register', 'Inscrever-me')}</a></article>`; };
const modeLabel = (m, lang) => ({ Virtual: s(lang, 'Virtual', 'Online', 'Virtual'), Presencial: s(lang, 'Presencial', 'In person', 'Presencial'), 'Híbrido': s(lang, 'Híbrido', 'Hybrid', 'Híbrido') }[m] || m);

// ---------------------------------------------------------------- Portada
export function home(ctx) {
  const lang = ctx.lang || 'es', t = tl(lang), h = H(t);
  const fichas = all('SELECT * FROM fichas WHERE published=1 ORDER BY ord').map((f) => loc('fichas', f, lang));
  const prof = getBlock('profesor-resumen', lang);
  const FN = [[2, 8, 22], [3, 20, 70], [5, 34, 30], [7, 46, 82], [11, 58, 18], [13, 70, 64], [17, 82, 34], [19, 92, 78], [6, 14, 50], [9, 52, 50], [15, 76, 12], [21, 28, 88], [4, 64, 92], [8, 88, 56]];
  const hero = html`<section class="hero"><div class="hero-glow" aria-hidden="true"></div><div class="float-nums" aria-hidden="true">${FN.map(([n, l, tp], i) => html`<i class="fnum t-${numType(n)}" style="left:${l}%;top:${tp}%;--dl:${((i * 0.7) % 5).toFixed(1)}s;--du:${9 + (i % 5) * 2}s">${n}</i>`)}</div><div class="wrap hero-grid">
<div class="hero-copy"><p class="kicker light">${t('home.kicker')}</p><h1>${h('home.h1')}</h1><p class="lead">${t('home.lead')}</p>
<p class="cta"><a class="btn" href="/archivo">${t('home.cta1')}</a> <a class="btn ghost light" href="/preguntas">${t('home.cta2')}</a></p></div>
<div class="hero-mark" aria-hidden="true">${logoMark('big')}</div></div>
<div class="wrap hero-bone">${boneSvg({ lang })}${legend(lang)}</div></section>`;
  const main = html`
<section class="route-sec" id="ruta"><div class="wrap pad"><p class="kicker">${t('route.kicker')}</p><h2>${t('route.h2')}</h2>
<ol class="route" data-route>${[['1', '/preguntas'], ['2', '/archivo'], ['3', '/fichas']].map(([n, href]) => html`<li class="step"><span class="num" aria-hidden="true">${n}</span><p class="kicker">${t(`route.s${n}.k`)}</p><h3>${t(`route.s${n}.t`)}</h3><p>${t(`route.s${n}.p`)}</p><a class="btn sm ${n === '1' ? '' : 'ghost'}" href="${href}">${t(`route.s${n}.c`)}</a></li>`)}</ol>
<p class="route-also">${t('route.also')}: <a href="/biblioteca">${t('nav.library')}</a> · <a href="/aula">${t('nav.classroom')}</a> · <a href="/catalogo">${t('nav.catalog')}</a> · <a href="/agenda">${t('foot.agenda')}</a></p></div></section>
<!-- RESUMEN DEL PROFESOR · Edítelo en el CMS (Contenido › Portada · Resumen del profesor) o en lib/content-i18n.js (BLOCKS › profesor-resumen). -->
<section class="band prof" id="profesor"><div class="wrap pad split reveal">
<a class="portrait-link" href="/autor" aria-label="${t('portrait.aria')}"><figure class="portrait"><img src="/img/almonacid-autor.jpg" width="400" height="400" alt="${t('home.portrait.alt')}" loading="lazy"><span class="portrait-cta">${t('portrait.cta')} →</span><figcaption>${t('home.portrait.cap')}</figcaption></figure></a>
<div><p class="kicker">${t('home.prof.kicker')}</p><h2>${t('home.prof.h')}</h2><div class="prose" data-block="profesor-resumen">${prof ? md(prof.body) : ''}</div><p><a class="more" href="/autor">${t('home.prof.more')} <span aria-hidden="true">→</span></a></p></div></div></section>
<section class="wrap pad narrow-ish"><p class="kicker">${t('home.sheets.kicker')}</p><h2>${t('home.sheets.h2')}</h2><ol class="ficha-list">${fichas.map((f) => html`<li class="reveal"><a href="/fichas/${f.slug}"><small>${kindLabel(f.kind, lang)}</small><span>${f.title}</span><i aria-hidden="true">→</i></a></li>`)}</ol></section>
<section class="band" id="criba"><div class="wrap pad center"><p class="kicker">${t('home.sieve.kicker')}</p><h2>${t('home.sieve.h2')}</h2><p class="muted">${t('home.sieve.p')}</p>
<div class="row center-row"><button class="btn sm" data-sieve="play">${t('home.sieve.play')}</button><button class="btn sm ghost" data-sieve="reset">${t('home.sieve.reset')}</button></div><div class="sieve" data-sieve-grid aria-label="${t('home.sieve.aria')}"></div>${legend(lang)}<p class="caption" data-sieve-msg role="status">${t('home.sieve.msg')}</p></div></section>
<section class="band cta-band"><div class="wrap pad center"><h2>${t('home.nl.h2')}</h2><form class="inline-form big" data-api="/api/newsletter" data-ok="${t('form.nl_ok')}"><label class="sr" for="home-email">${t('form.email')}</label><input id="home-email" name="email" type="email" required placeholder="${t('form.email_ph')}" autocomplete="email"><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn">${t('form.subscribe')}</button><p class="form-msg" role="status"></p></form></div></section>`;
  return layout(ctx, { path: '/', main, hero, bodyClass: 'home', desc: t('home.lead') + ' ' + t('foot.tag'), jsonld: { '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, url: siteUrl(), logo: siteUrl() + '/img/logo.svg', description: t('foot.tag') } });
}

// ---------------------------------------------------------------- Archivo
const EMP = [9, 11, 13, 17, 19, 21];
const px = (x) => 44 + x * 9.4, py = (y) => 332 - y * 10;
function empChart(lang) {
  const t = tl(lang); let o = '';
  for (let x = 0; x <= 60; x += 5) o += `<line class="gl" x1="${px(x)}" x2="${px(x)}" y1="${py(0)}" y2="${py(31)}"/><text class="ax" x="${px(x)}" y="${py(0) + 16}" text-anchor="middle">${x}</text>`;
  for (let y = 0; y <= 30; y += 5) o += `<line class="gl" x1="${px(0)}" x2="${px(60)}" y1="${py(y)}" y2="${py(y)}"/><text class="ax" x="${px(0) - 8}" y="${py(y) + 4}" text-anchor="end">${y}</text>`;
  o += `<polygon class="sextet" points="${px(9)},${py(9)} ${px(21)},${py(9)} ${px(9)},${py(21)}"/><polygon class="sextet" points="${px(39)},${py(9)} ${px(51)},${py(9)} ${px(51)},${py(21)}"/>`;
  for (const y of EMP) o += `<line class="hl n-${numType(y)}" x1="${px(0)}" x2="${px(60)}" y1="${py(y)}" y2="${py(y)}"/><text class="ylab t-${numType(y)}" x="${px(60) + 8}" y="${py(y) + 4}">${y}</text>`;
  o += `<line class="diag" x1="${px(30)}" y1="${py(0)}" x2="${px(9)}" y2="${py(21)}"/><line class="diag" x1="${px(30)}" y1="${py(0)}" x2="${px(51)}" y2="${py(21)}"/>`;
  o += `<line class="axis" x1="${px(30)}" x2="${px(30)}" y1="${py(0)}" y2="${py(30)}"/>`;
  for (const y of [0, 15, 30]) o += `<circle class="axpt" cx="${px(30)}" cy="${py(y)}" r="4"/>`;
  for (const y of EMP) o += `<line class="pair" x1="${px(30 - y)}" y1="${py(y)}" x2="${px(y)}" y2="${py(30 - y)}"/><line class="mirror" x1="${px(30 - y)}" y1="${py(y)}" x2="${px(30 + y)}" y2="${py(y)}"/>`;
  for (const y of EMP) for (const [sec, x] of [['A', 30 - y], ['B', 30 + y]]) o += `<circle class="pt n-${numType(y)}${[11, 13, 17, 19].includes(y) ? ' ne' : ''}" tabindex="0" role="img" data-y="${y}" data-sec="${sec}" cx="${px(x)}" cy="${py(y)}" r="7" aria-label="${t('emp.point')} ${y} · ${sec} (${x}, ${y})"/>`;
  o += `<text class="sec" x="${px(15)}" y="${py(-2) + 22}" text-anchor="middle">${t('emp.sectionA')}</text><text class="sec" x="${px(45)}" y="${py(-2) + 22}" text-anchor="middle">${t('emp.sectionB')}</text>`;
  return raw(`<svg class="emp-svg" viewBox="0 0 660 395" role="group" aria-label="${esc(t('emp.alt'))}">${o}</svg>`);
}
const explorerRow = (col, lang) => { const t = tl(lang); return html`<div class="ex-row" data-col="${col}"><div class="ex-label"><b>${col}</b><span>${t('ex.col.' + col)}</span></div><div class="ex-groups">${ISHANGO[col].groups.map((n) => html`<button type="button" class="grp n-${numType(n)}" data-n="${n}" data-col="${col}" aria-label="${t('ex.group.aria').replace('{n}', n).replace('{c}', t('ex.col.' + col))}"><b>${n}</b><span class="ticks" aria-hidden="true">${raw('<i></i>'.repeat(n))}</span></button>`)}</div><div class="ex-sum"><small>${t('ex.sum')}</small><b data-sum="${col}">${ISHANGO[col].groups.reduce((a, b) => a + b, 0)}</b></div></div>`; };

export function archivo(ctx) {
  const lang = ctx.lang || 'es', t = tl(lang), h = H(t);
  const fichas = all('SELECT slug,title,kind FROM fichas WHERE published=1 ORDER BY ord').map((f) => loc('fichas', f, lang));
  const prof = getBlock('profesor-resumen', lang); const nn = (k) => t(k).replace(/^\d+\.\s*/, '');
  const main = html`<article class="wrap article">
<nav class="toc" data-toc aria-label="${t('toc.title')}"><p>${t('toc.title')}</p><ol><li><a href="#resumen">${t('arc.glance.h')}</a></li><li><a href="#explorador">${nn('arc.h2c')}</a></li><li><a href="#profundizar">${t('arc.deep')}</a></li><li><a href="#ejercicio">${t('lab.a.title').split(':')[0]}</a></li><li><a href="#imagenes">${t('arc.photos.h')}</a></li><li><a href="#consulta">${t('arc.consult.h')}</a></li></ol></nav>
${crumbs([[null, t('nav.archive')]], lang)}
<header class="article-head"><p class="kicker">${t('arc.kicker')}</p><h1>${t('arc.h1')}</h1>
<div class="byline"><a class="byline-photo" href="/autor" aria-label="${t('portrait.aria')}" title="${t('portrait.cta')}"><img src="/img/almonacid-autor.jpg" width="88" height="88" alt="${t('home.portrait.alt')}"></a><p><strong>Juan Jorge Almonacid Sierra</strong><br><span class="muted">${t('arc.role')}</span><br><span class="muted">${t('arc.published')} · <a href="${SRC_URL}" rel="noopener">${t('arc.original')}</a></span></p></div></header>
<p class="lead drop">${h('arc.lead')}</p>
${fig('unal-1.jpg', lang, 'wide')}
<aside class="glance" id="resumen"><h2>${t('arc.glance.h')}</h2><ul><li>${h('arc.glance.1')}</li><li>${h('arc.glance.2')}</li><li>${h('arc.glance.3')}</li></ul><p class="small muted">${t('arc.glance.src')} <a href="${SRC_URL}" rel="noopener">Periódico UNAL</a>.</p></aside>
<!-- RESUMEN DEL PROFESOR (mismo bloque editable de la portada) -->
<aside class="prof-card"><p class="kicker">${t('home.prof.kicker')}</p><div class="prose" data-block="profesor-resumen">${prof ? md(prof.body) : ''}</div><p><a class="more" href="/autor">${t('home.prof.more')} →</a></p></aside>

<h2>${nn('arc.h2a')}</h2><p>${h('arc.p2a')}</p><p>${h('arc.p2b')}</p>
<h2 id="explorador">${nn('arc.h2c')}</h2><p>${t('arc.p4')}</p>
<div class="explorer" data-explorer>${legend(lang)}
<div class="ex-controls" role="group" aria-label="${t('ex.cols')}"><button class="chip" aria-pressed="false" data-toggle="twins">${t('ex.twins')}</button><button class="chip" aria-pressed="false" data-toggle="sums">${t('ex.sums')}</button><button class="chip tour-btn" type="button" data-tour-start>▶ ${t('tour.start')}</button></div>
<div class="tour" data-tour hidden role="region" aria-label="${t('tour.label')}"><p class="tour-step" data-tour-text aria-live="polite"></p><div class="row"><button type="button" class="btn sm ghost" data-tour-prev>${t('tour.prev')}</button><button type="button" class="btn sm" data-tour-next>${t('tour.next')}</button><button type="button" class="linkish" data-tour-close>${t('tour.close')}</button></div></div>
${['G', 'M', 'D'].map((c) => explorerRow(c, lang))}
<p class="ex-readout" data-readout role="status" aria-live="polite">${t('ex.readout')}</p>
<dl class="ex-stats"><div><dt>${t('ex.marks')}</dt><dd>168</dd></div><div><dt>${t('ex.groups')}</dt><dd>16</dd></div><div><dt>${t('ex.primes')}</dt><dd data-stat="primes">—</dd></div><div><dt>${t('ex.pairs')}</dt><dd data-stat="twins">—</dd></div></dl></div>
${fig('unal-5.jpg', lang, 'tall')}
<p class="kicker deep" id="profundizar">${t('arc.deep')}</p>
<details class="fold lab" id="ejercicio"><summary>${t('lab.a.title')} <span class="badge-int">${s(lang, 'Interactivo', 'Interactive', 'Interativo')}</span></summary><p>${t('lab.a.intro')}</p>${quiz(LAB_A, lang, 'a')}</details>
<details class="fold"><summary>${nn('arc.h2b')}</summary><p>${h('arc.p3')}</p></details>
<details class="fold"><summary>${nn('arc.h2d')}</summary><p>${h('arc.p5')}</p></details>
<details class="fold" id="empedocles"><summary>${nn('arc.h2e')}</summary><p>${h('arc.p6')}</p>
<div class="emp" data-emp><h3 class="emp-title">${t('emp.title')}</h3>
<div class="ex-controls" role="group" aria-label="${t('ex.cols')}"><button class="chip" aria-pressed="false" data-emp-toggle="sextet">${t('emp.t.sextet')}</button><button class="chip" aria-pressed="false" data-emp-toggle="ne">${t('emp.t.ne')}</button><button class="chip" aria-pressed="false" data-emp-toggle="sym">${t('emp.t.sym')}</button><button class="chip" aria-pressed="false" data-emp-toggle="pairs">${t('emp.t.pairs')}</button></div>
${empChart(lang)}${legend(lang, ['p', 'o'])}<p class="ex-readout light" data-emp-readout role="status" aria-live="polite">${t('emp.hint')}</p></div>
${fig('unal-4.jpg', lang, 'wide')}</details>
<details class="fold"><summary>${nn('arc.h2f')}</summary><p>${h('arc.p7')}</p><blockquote>${t('arc.quote')}</blockquote></details>
<details class="fold"><summary>${nn('arc.h2g')}</summary><p>${t('arc.p8')}</p></details>
<details class="fold" id="imagenes"><summary>${t('arc.photos.h')}</summary><p class="muted">${t('arc.photos.p')}</p><div class="gallery">${['unal-8.jpg', 'unal-2.jpg', 'unal-3.jpg'].map((f) => fig(f, lang))}</div></details>
<section class="band-inline consult" id="consulta"><h2>${t('arc.consult.h')}</h2><p>${t('arc.consult.p')}</p><p><a class="btn" href="/biblioteca#consulta">${t('arc.consult.btn')}</a></p></section>
<section class="band-inline"><h2>${t('arc.more.h')}</h2><ul class="plain cols">${fichas.map((f) => html`<li><a href="/fichas/${f.slug}"><small>${kindLabel(f.kind, lang)}</small><br>${f.title}</a></li>`)}</ul><p><a class="btn" href="/preguntas">${t('arc.faq')}</a> <a class="btn ghost" href="/aula">${t('arc.class')}</a>${STATIC ? '' : html` <a class="btn ghost" href="/catalogo/dossier-ishango-pdf">${t('arc.dl')}</a>`}</p></section>
<section class="cite"><h2>${t('arc.cite.h')}</h2><p>${SRC}</p><p><a href="${SRC_URL}" rel="noopener">${SRC_URL}</a></p><p class="muted">${t('arc.cite.img')}</p></section>
</article>`;
  return layout(ctx, { title: t('arc.title'), path: '/archivo', desc: t('arc.desc'), image: '/img/almonacid-autor.jpg', main,
    jsonld: { '@context': 'https://schema.org', '@type': 'Article', headline: t('arc.h1'), author: { '@type': 'Person', name: 'Juan Jorge Almonacid Sierra' }, datePublished: '2025-08-20', inLanguage: lang, image: siteUrl() + '/img/almonacid-autor.jpg', isBasedOn: SRC_URL, publisher: { '@type': 'Organization', name: SITE_NAME } } });
}

// ---------------------------------------------------------------- Preguntas frecuentes
const GEO = {
  africa: [[-5.9, 35.8], [-2.9, 35.3], [-1.0, 35.2], [1.0, 36.5], [3.0, 36.8], [6.0, 37.0], [8.6, 36.9], [10.2, 37.3], [11.0, 37.0], [10.1, 35.0], [10.4, 33.9], [11.5, 33.2], [13.2, 32.9], [15.2, 32.4], [15.8, 31.4], [18.0, 30.4], [19.6, 30.4], [20.1, 32.2], [21.8, 32.9], [23.0, 32.6], [25.0, 31.7], [29.0, 30.9], [29.9, 31.2], [32.3, 31.3], [32.6, 30.0], [34.0, 27.8], [35.6, 24.0], [37.2, 21.0], [38.6, 18.0], [39.6, 15.6], [41.5, 13.9], [43.2, 12.6], [44.0, 10.9], [47.0, 11.2], [51.3, 11.8], [51.1, 10.4], [50.8, 9.0], [49.8, 6.8], [48.0, 4.9], [46.0, 2.2], [44.0, 1.0], [42.6, -0.5], [41.0, -2.0], [39.7, -4.1], [39.1, -6.0], [38.9, -7.0], [40.0, -10.2], [40.6, -12.0], [40.6, -14.5], [38.0, -17.0], [36.0, -18.8], [34.9, -19.9], [35.4, -22.0], [35.5, -23.9], [33.0, -25.5], [32.9, -26.4], [32.8, -28.5], [31.0, -29.9], [29.0, -32.0], [27.9, -33.0], [25.6, -34.0], [22.0, -34.1], [20.0, -34.8], [18.4, -34.1], [18.3, -32.5], [17.6, -30.0], [16.5, -28.6], [15.2, -26.8], [14.5, -22.9], [13.0, -20.0], [11.8, -17.2], [12.2, -15.0], [13.4, -12.6], [13.2, -8.8], [12.2, -6.0], [11.8, -4.8], [9.6, -2.0], [9.3, 0.4], [9.8, 3.9], [8.5, 4.5], [6.0, 4.3], [4.5, 6.3], [3.4, 6.4], [1.2, 6.1], [-1.5, 4.8], [-3.0, 5.1], [-4.0, 5.2], [-7.5, 4.4], [-9.5, 5.9], [-10.8, 6.3], [-13.2, 8.4], [-14.5, 10.8], [-16.7, 12.5], [-17.5, 14.7], [-16.5, 16.5], [-16.2, 19.0], [-17.0, 21.0], [-16.0, 23.7], [-14.5, 26.1], [-13.0, 27.9], [-9.8, 29.8], [-9.8, 31.5], [-8.5, 33.2], [-6.8, 34.0]],
  drc: [[12.4, -6.0], [13.1, -4.9], [14.5, -4.7], [15.3, -4.3], [16.2, -2.6], [17.7, -0.8], [17.8, 1.0], [18.2, 2.3], [18.6, 3.5], [20.0, 4.4], [22.0, 4.3], [24.0, 5.2], [27.0, 5.0], [28.0, 4.4], [29.5, 4.5], [30.8, 3.5], [31.2, 2.3], [30.4, 1.4], [29.9, 0.8], [29.7, -0.4], [29.6, -1.0], [29.2, -1.7], [28.9, -2.4], [29.1, -2.9], [29.4, -4.4], [29.6, -6.0], [30.0, -8.2], [28.7, -8.5], [28.4, -9.4], [28.7, -10.6], [28.4, -11.8], [29.0, -12.3], [29.6, -13.3], [27.2, -11.6], [26.0, -11.9], [24.4, -11.2], [22.3, -11.0], [22.0, -10.0], [21.8, -7.3], [20.5, -7.3], [19.5, -8.0], [18.0, -8.0], [16.9, -7.2], [16.5, -5.9], [13.4, -5.9]],
  uganda: [[29.6, -1.4], [30.5, -1.1], [31.9, -1.0], [33.9, -1.0], [34.0, 0.4], [34.4, 1.1], [35.0, 1.9], [34.3, 3.5], [33.0, 3.8], [31.2, 3.8], [30.8, 3.5], [31.2, 2.3], [30.4, 1.4], [29.9, 0.8], [29.7, -0.4], [29.6, -1.0]],
  border: [[31.2, 2.3], [30.4, 1.4], [29.9, 0.8], [29.7, -0.4], [29.6, -1.0]],
};
const gx = (lon) => ((lon + 20) * 10).toFixed(1), gy = (lat) => ((38 - lat) * 10).toFixed(1);
const gp = (pts, close = true) => 'M' + pts.map(([a, b]) => `${gx(a)} ${gy(b)}`).join('L') + (close ? 'Z' : '');
function mapSvg(lang) {
  const t = tl(lang); const ix = gx(29.6), iy = gy(-0.14);
  return raw(`<svg class="map-svg" viewBox="0 0 700 740" data-full="0 0 700 740" data-zoom="${(+gx(29.6) - 62).toFixed(0)} ${(+gy(-0.14) - 62).toFixed(0)} 124 124" role="img" aria-label="${esc(t('map.alt'))}">
<rect class="sea" x="-200" y="-200" width="1100" height="1140"/><path class="africa" d="${gp(GEO.africa)}"/><path class="drc" d="${gp(GEO.drc)}"/><path class="uganda" d="${gp(GEO.uganda)}"/>
<ellipse class="lake" cx="${gx(29.6)}" cy="${gy(-0.4)}" rx="3.4" ry="3.8"/><path class="border" d="${gp(GEO.border, false)}"/>
<text class="lbl big" x="${gx(18)}" y="${gy(14)}" text-anchor="middle">${t('map.africa')}</text>
<g class="detail"><text class="lbl" x="${gx(26.6)}" y="${gy(-2.6)}" text-anchor="middle">${t('map.drc')}</text><text class="lbl" x="${gx(32.4)}" y="${gy(1.4)}" text-anchor="middle">${t('map.uganda')}</text><text class="lbl sm" x="${gx(28.2)}" y="${gy(-0.9)}" text-anchor="end">${t('map.lake')}</text><text class="lbl sm bord" x="${gx(30.5)}" y="${gy(2.7)}">${t('map.border')}</text></g>
<g class="pin"><circle class="pulse" cx="${ix}" cy="${iy}" r="5"/><circle class="dot" cx="${ix}" cy="${iy}" r="2.4"/><text class="lbl pinlab" x="${+ix + 7}" y="${+iy + 3}">Ishango</text></g></svg>`);
}
const tlMarks = [[20000, 1], [12000, 2], [5000, 3], [2600, 4], [0, 5]];

export function preguntas(ctx) {
  const lang = ctx.lang || 'es', t = tl(lang), h = H(t);
  const tr = (k) => JSON.stringify([1, 2, 3, 4, 5].map((i) => [t('tl.m' + i), t('tl.y' + i), t('tl.d' + i)]));
  const nums = Array.from({ length: 40 }, (_, i) => i + 1);
  const Q = (n, body) => html`<details class="faq-item" id="q${n}" name="faq" ${n === 1 ? 'open' : ''}><summary><span class="qn" aria-hidden="true">${n}</span><h2 id="q${n}-h">${t(`q${n}.q`).replace(/^\d\.\s*/, '')}</h2></summary><div class="faq-body">${body}${n < 6 ? html`<p class="faq-next"><button type="button" class="btn sm ghost" data-faq-next="${n + 1}">${t('faq.nextq')}</button></p>` : ''}</div></details>`;
  const main = html`<div class="wrap article faq">
${crumbs([[null, t('nav.faq')]], lang)}
<nav class="faq-index" aria-label="${t('faq.index')}">${[1, 2, 3, 4, 5, 6].map((n) => html`<a href="#q${n}"><b>${n}</b><span>${t(`q${n}.q`).replace(/^\d\.\s*/, '')}</span></a>`)}</nav>
${Q(1, html`${h('q1.a')}<div class="timeline" data-timeline data-tl='${tr()}'><div class="track"><i></i></div>${tlMarks.map(([yrs, i]) => html`<button type="button" class="tl-m" style="left:${100 - (yrs / 20000) * 100}%" data-i="${i}" aria-label="${t('tl.m' + i)} — ${t('tl.y' + i)}"><span class="dot"></span><span class="nm">${t('tl.m' + i)}</span></button>`)}</div><p class="tl-detail" data-tl-detail role="status" aria-live="polite">${t('tl.hint')}</p><p class="small muted">${t('tl.note')}</p>`)}
${Q(2, html`${h('q2.a')}<figure class="map" data-map><div class="map-box">${mapSvg(lang)}</div><div class="map-ctl"><button type="button" class="btn sm" data-map-zoom="in">${t('map.zoomin')}</button><button type="button" class="btn sm ghost" data-map-zoom="out">${t('map.zoomout')}</button><a class="btn sm ghost" href="https://www.openstreetmap.org/?mlat=-0.14&mlon=29.59#map=9/-0.14/29.59" rel="noopener" target="_blank">${t('map.real')}</a></div><figcaption>${t('map.hint')} ${t('map.note')}</figcaption></figure>${fig('unal-2.jpg', lang)}`)}
${Q(3, html`${h('q3.a')}<figure class="poster"><div class="poster-art" data-draw role="img" aria-label="${t('poster.alt')}">${raw(POSTER[lang] || POSTER.es)}</div><figcaption>${t('poster.cap')} <a href="/img/lamina-${lang}.svg" download>${t('poster.dl')}</a></figcaption></figure><div class="gallery two">${fig('unal-8.jpg', lang)}${fig('unal-3.jpg', lang)}</div>`)}
${Q(4, html`${h('q4.a')}<div class="notch" data-notch><h3>${t('notch.title')}</h3><div class="notch-bone" aria-hidden="true"><div class="marks" data-marks></div></div><div class="row"><button type="button" class="btn sm" data-notch-add>${t('notch.add')}</button><button type="button" class="btn sm ghost" data-notch-sub>${t('notch.sub')}</button><button type="button" class="btn sm ghost" data-notch-reset>${t('notch.reset')}</button></div><p class="ex-readout light" data-notch-readout role="status" aria-live="polite">${t('notch.zero')}</p>${legend(lang)}</div>${fig('unal-1.jpg', lang)}`)}
${Q(5, html`<div class="faq-cols"><div><h3>${t('q5.prime.h')}</h3>${h('q5.prime.p')}</div><div><h3>${t('q5.twin.h')}</h3>${h('q5.twin.p')}</div></div>
<div class="numgrid" data-numgrid><h3>${t('grid.title')}</h3><div class="ng">${nums.map((n) => html`<button type="button" class="n-${numType(n)}" data-n="${n}">${n}</button>`)}</div>${legend(lang)}<p class="ex-readout light" data-grid-readout role="status" aria-live="polite">${t('grid.hint')}</p></div>
<h3>${t('q5.use.h')}</h3><div class="grid2 uses">${[1, 2, 3, 4].map((i) => html`<div class="card use reveal"><h4>${t('q5.use' + i + '.h')}</h4><p>${t('q5.use' + i + '.p')}</p></div>`)}</div>`)}
${Q(6, html`<p>${t('q6.lead')}</p>${quiz(LAB_B, lang, 'b')}`)}
<section class="band-inline"><h2>${t('faq.next.h')}</h2><p><a class="btn" href="/archivo">${t('faq.next.archive')}</a> <a class="btn ghost" href="/aula">${t('faq.next.class')}</a> <a class="btn ghost" href="/biblioteca#consulta">${t('faq.next.ask')}</a></p></section></div>`;
  return layout(ctx, { title: t('faq.title'), path: '/preguntas', desc: t('faq.desc'), main: html`${pageHead(t('faq.kicker'), t('faq.title'), t('faq.lead'))}${main}`,
    jsonld: { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang, mainEntity: [1, 2, 3, 4, 5].map((n) => ({ '@type': 'Question', name: t(`q${n}.q`).replace(/^\d\.\s*/, ''), acceptedAnswer: { '@type': 'Answer', text: (t(`q${n}.a`) || '').replace(/<[^>]+>/g, '') || t(`q${n}.q`) } })) } });
}

// ---------------------------------------------------------------- Autor y biblioteca
export function autor(ctx) {
  const lang = ctx.lang || 'es', t = tl(lang); const b = getBlock('profesor-completo', lang);
  return layout(ctx, { title: b?.title || t('foot.author'), path: '/autor', desc: t('home.prof.kicker') + ' — Juan Jorge Almonacid Sierra', image: '/img/almonacid-autor.jpg',
    main: html`${pageHead(t('home.prof.kicker'), 'Juan Jorge Almonacid Sierra', t('arc.role'))}<section class="wrap pad narrow-ish author"><figure class="portrait small"><img src="/img/almonacid-autor.jpg" width="400" height="400" alt="${t('home.portrait.alt')}"><figcaption>${t('home.portrait.cap')}</figcaption></figure>
${b?.fallback ? html`<p class="note">${t('fallback.es')}</p>` : ''}<!-- PERFIL COMPLETO · editable en el CMS (Portada · Resumen del profesor › profesor-completo) -->
<div class="prose" data-block="profesor-completo">${b ? md(b.body) : ''}</div><p><a class="btn" href="/biblioteca">${t('nav.library')}</a> <a class="btn ghost" href="/archivo">${t('nav.archive')}</a></p></section>` });
}

export function biblioteca(ctx) {
  const lang = ctx.lang || 'es', t = tl(lang);
  const st = { pub: s(lang, 'Publicado', 'Published', 'Publicado'), wip: s(lang, 'En desarrollo', 'In progress', 'Em desenvolvimento'), soon: s(lang, 'Próximo', 'Forthcoming', 'Em breve') };
  return layout(ctx, { title: t('nav.library') + ' Ishango', path: '/biblioteca', desc: s(lang, 'Biblioteca Ishango: libros y artículos de Juan Jorge Almonacid Sierra sobre el hueso de Ishango, y un canal para enviar consultas sobre el artículo.', 'Ishango Library: books and articles by Juan Jorge Almonacid Sierra on the Ishango bone, and a channel to send questions about the article.', 'Biblioteca Ishango: livros e artigos de Juan Jorge Almonacid Sierra sobre o osso de Ishango, e um canal para enviar consultas sobre o artigo.'),
    main: html`${pageHead(s(lang, 'Biblioteca', 'Library', 'Biblioteca'), 'Biblioteca Ishango', s(lang, 'Las obras de la investigación sobre los huesos de Ishango, y un canal de consultas sobre el artículo.', 'The works of the research on the Ishango bones, and a channel for questions about the article.', 'As obras da pesquisa sobre os ossos de Ishango, e um canal de consultas sobre o artigo.'))}
<section class="wrap pad narrow-ish"><h2>${s(lang, 'Libros', 'Books', 'Livros')}</h2><ul class="lib">${LIBRARY.map((b) => html`<li class="reveal"><span class="tag ${b.status === 'pub' ? '' : 'warn'}">${st[b.status]}</span><h3>${b.title}</h3><p class="muted">${pick(b.meta, lang)}</p><p>${pick(b.note, lang)}</p></li>`)}</ul>
<h2>${s(lang, 'Artículo', 'Article', 'Artigo')}</h2><ul class="lib"><li class="reveal"><span class="tag">UN Periódico</span><h3>${t('arc.h1')}</h3><p class="muted">Almonacid Sierra, J. J. · ${t('arc.published')}</p><p><a href="/archivo">${t('arc.title')}</a> · <a href="${SRC_URL}" rel="noopener">${t('arc.original')}</a></p></li></ul>
<h2 id="consulta">${t('arc.consult.h')}</h2><p>${t('arc.consult.p')}</p>
<form class="card form" data-api="/api/contact" data-form="consulta" data-ok="${t('form.contact_ok')}"><input type="hidden" name="subject" value="Consulta sobre el artículo (Biblioteca Ishango)">${field(t('form.name'), 'name', { required: true, auto: 'name' })}${field(t('form.email'), 'email', { type: 'email', required: true, auto: 'email' })}${field(s(lang, 'Tu consulta', 'Your question', 'Sua consulta'), 'body', { textarea: true, required: true, max: 3000 })}<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn">${t('form.send')}</button><p class="form-msg" role="status"></p></form></section>` });
}

// ---------------------------------------------------------------- Fichas
export function fichasIndex(ctx) {
  const lang = ctx.lang || 'es'; const rows = all('SELECT * FROM fichas WHERE published=1 ORDER BY ord').map((f) => loc('fichas', f, lang));
  return layout(ctx, { title: s(lang, 'Fichas editoriales', 'Editorial sheets', 'Fichas editoriais'), path: '/fichas', desc: s(lang, 'Las cinco fichas editoriales de la Colección Ishango: objeto, tabla, primos gemelos, números Empédocles y debate.', 'The five editorial sheets of the Ishango Collection: object, table, twin primes, Empedocles numbers and debate.', 'As cinco fichas editoriais da Coleção Ishango: objeto, tabela, primos gêmeos, números Empédocles e debate.'),
    main: html`${pageHead(tl(lang)('home.sheets.kicker'), s(lang, 'Fichas editoriales', 'Editorial sheets', 'Fichas editoriais'), s(lang, 'Cinco entradas breves para leer el hueso de Ishango con precisión: del objeto al debate.', 'Five short entries to read the Ishango bone with precision: from the object to the debate.', 'Cinco entradas breves para ler o osso de Ishango com precisão: do objeto ao debate.'))}<section class="wrap pad"><div class="grid3">${rows.map((f) => fichaCard(f, lang))}</div></section>` });
}
export function fichaDetail(ctx) {
  const lang = ctx.lang || 'es', t = tl(lang); const f0 = get('SELECT * FROM fichas WHERE slug=? AND published=1', ctx.params.slug); if (!f0) return notFound(ctx); const f = loc('fichas', f0, lang);
  const nav = all('SELECT slug,title,ord FROM fichas WHERE published=1 ORDER BY ord').map((x) => loc('fichas', x, lang)); const i = nav.findIndex((x) => x.slug === f.slug);
  const prod = get('SELECT slug,title FROM products WHERE ficha_id=? AND published=1', f.id);
  return layout(ctx, { title: f.title, path: `/fichas/${f.slug}`, desc: f.summary, main: html`<article class="wrap article">${crumbs([['/fichas', s(lang, 'Fichas', 'Sheets', 'Fichas')], [null, kindLabel(f.kind, lang)]], lang)}<header class="article-head"><p class="kicker">${kindLabel(f.kind, lang)}</p><h1>${f.title}</h1>${f.subtitle ? html`<p class="lead">${f.subtitle}</p>` : ''}</header>
<dl class="meta"><div><dt>${s(lang, 'Año de referencia', 'Reference year', 'Ano de referência')}</dt><dd>${f.year || '—'}</dd></div><div><dt>${s(lang, 'Fuente', 'Source', 'Fonte')}</dt><dd>${f.source || '—'}</dd></div><div><dt>${s(lang, 'Etiquetas', 'Tags', 'Etiquetas')}</dt><dd>${(f.tags || '').split(',').map((x) => x.trim()).filter(Boolean).map((x) => html`<span class="tag">${x}</span> `)}</dd></div></dl>
<div class="prose">${md(f.body)}</div>${prod && !STATIC ? html`<aside class="note"><a href="/catalogo/${prod.slug}">${prod.title}</a></aside>` : ''}
<nav class="pager" aria-label="${s(lang, 'Fichas', 'Sheets', 'Fichas')}">${i > 0 ? html`<a href="/fichas/${nav[i - 1].slug}">← ${nav[i - 1].title}</a>` : html`<span></span>`}${i < nav.length - 1 ? html`<a href="/fichas/${nav[i + 1].slug}">${nav[i + 1].title} →</a>` : ''}</nav></article>`,
    jsonld: { '@context': 'https://schema.org', '@type': 'Article', headline: f.title, description: f.summary, inLanguage: lang, publisher: { '@type': 'Organization', name: SITE_NAME }, dateModified: f0.updated_at } });
}

// ---------------------------------------------------------------- Catálogo
export function catalogo(ctx) {
  const lang = ctx.lang || 'es'; const kind = ctx.query.get('tipo'); const rows = all(`SELECT * FROM products WHERE published=1 ${['digital', 'physical', 'course'].includes(kind) ? 'AND kind=?' : 'AND ?=?'} ORDER BY ord`, ...(kind ? [kind] : [1, 1])).map((p) => loc('products', p, lang));
  const tabs = [['', s(lang, 'Todo', 'All', 'Tudo')], ['digital', 'Digital'], ['physical', s(lang, 'Físico', 'Print', 'Impresso')], ['course', s(lang, 'Aula', 'Classroom', 'Sala de aula')]];
  return layout(ctx, { title: tl(lang)('nav.catalog'), path: '/catalogo', desc: s(lang, 'Catálogo de Base Parkway: PDF con entrega digital, ediciones físicas y matrícula al aula.', 'Base Parkway catalog: PDFs with digital delivery, print editions and classroom enrolment.', 'Catálogo da Base Parkway: PDFs com entrega digital, edições impressas e matrícula na sala de aula.'),
    main: html`${pageHead(tl(lang)('nav.catalog'), s(lang, 'Ediciones y matrícula', 'Editions and enrolment', 'Edições e matrícula'), STATIC ? s(lang, 'Vitrina de ediciones y guías. La compra en línea abrirá pronto: escríbenos para pedirlas.', 'Showcase of editions and guides. Online purchase opens soon: write to us to order.', 'Vitrine de edições e guias. A compra on-line abrirá em breve: escreva-nos para pedir.') : s(lang, 'Compra con pasarela de pago, recibe tu entrega digital autorizada por correo y sigue tu pedido desde tu cuenta.', 'Pay online, receive your authorised digital delivery by email and follow your order from your account.', 'Compre com pagamento on-line, receba sua entrega digital autorizada por e-mail e acompanhe seu pedido na conta.'))}<section class="wrap pad">${STATIC ? '' : html`<div class="tabs" role="navigation">${tabs.map(([k, x]) => html`<a href="/catalogo${k ? '?tipo=' + k : ''}" ${(kind || '') === k ? raw('aria-current="true"') : ''}>${x}</a>`)}</div>`}<div class="grid3">${rows.map((p) => productCard(p, lang))}</div></section>` });
}
export function producto(ctx) {
  const lang = ctx.lang || 'es', t = tl(lang); const p0 = get('SELECT * FROM products WHERE slug=? AND published=1', ctx.params.slug); if (!p0) return notFound(ctx); const p = loc('products', p0, lang);
  const f = p.ficha_id && loc('fichas', get('SELECT slug,title FROM fichas WHERE id=?', p.ficha_id), lang);
  return layout(ctx, { title: p.title, path: `/catalogo/${p.slug}`, desc: p.description, main: html`<section class="wrap pad pdp">${crumbs([['/catalogo', t('nav.catalog')], [null, p.title]], lang)}<div class="split"><div>${cover(p, lang)}</div><div><h1>${p.title}</h1><p class="lead">${p.description}</p><p class="price big">${p.price ? money(p.price) : s(lang, 'Gratis', 'Free', 'Grátis')}</p><p>${stock(p, lang)}</p>
${STATIC ? html`<p><a class="btn" href="/contacto">${s(lang, 'Consultar o reservar', 'Enquire or reserve', 'Consultar ou reservar')}</a></p><p class="note">${s(lang, 'La compra en línea abrirá pronto. Escríbenos y te respondemos con el enlace de pago.', 'Online purchase opens soon. Write to us and we will reply with the payment link.', 'A compra on-line abrirá em breve. Escreva-nos e responderemos com o link de pagamento.')}</p>` : html`<p><button class="btn" data-add-cart="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>${p.kind === 'course' ? s(lang, 'Matricularme', 'Enrol', 'Matricular-me') : s(lang, 'Añadir al carrito', 'Add to cart', 'Adicionar ao carrinho')}</button> <a class="btn ghost" href="/carrito">${t('nav.cart')}</a></p>`}
${f ? html`<p class="muted">${s(lang, 'Relacionado', 'Related', 'Relacionado')}: <a href="/fichas/${f.slug}">${f.title}</a></p>` : ''}</div></div></section>`,
    jsonld: { '@context': 'https://schema.org', '@type': 'Product', name: p.title, description: p.description, brand: { '@type': 'Brand', name: SITE_NAME }, offers: { '@type': 'Offer', priceCurrency: 'COP', price: p.price, availability: p.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock', url: `${siteUrl()}/catalogo/${p.slug}` } } });
}

// ---------------------------------------------------------------- Agenda
export function agenda(ctx) {
  const lang = ctx.lang || 'es'; const now = new Date().toISOString();
  const up = all('SELECT * FROM events WHERE published=1 AND starts_at>=? ORDER BY starts_at', now).map((e) => loc('events', e, lang)); const past = all('SELECT * FROM events WHERE published=1 AND starts_at<? ORDER BY starts_at DESC LIMIT 5', now).map((e) => loc('events', e, lang));
  return layout(ctx, { title: tl(lang)('foot.agenda'), path: '/agenda', desc: s(lang, 'Seminarios, talleres y presentaciones de Base Parkway.', 'Seminars, workshops and launches by Base Parkway.', 'Seminários, oficinas e lançamentos da Base Parkway.'),
    main: html`${pageHead(tl(lang)('foot.agenda'), s(lang, 'Seminarios, talleres y presentaciones', 'Seminars, workshops and launches', 'Seminários, oficinas e lançamentos'), s(lang, 'Inscríbete y añade la fecha a tu calendario (.ics).', 'Register and add the date to your calendar (.ics).', 'Inscreva-se e adicione a data ao seu calendário (.ics).'))}<section class="wrap pad narrow-ish"><h2>${s(lang, 'Próximas', 'Upcoming', 'Próximos')}</h2>${up.length ? up.map((e) => eventCard(e, lang)) : html`<p class="muted">${s(lang, 'No hay fechas programadas por ahora.', 'No dates scheduled for now.', 'Não há datas programadas por ora.')}</p>`}${past.length ? html`<h2>${s(lang, 'Anteriores', 'Past', 'Anteriores')}</h2>${past.map((e) => html`<p class="muted">${fdl(e.starts_at, lang, { dateStyle: 'long' })} — ${e.title}</p>`)}` : ''}</section>` });
}
export function evento(ctx) {
  const lang = ctx.lang || 'es', t = tl(lang); const e0 = get('SELECT * FROM events WHERE slug=? AND published=1', ctx.params.slug); if (!e0) return notFound(ctx); const e = loc('events', e0, lang);
  const n = get('SELECT COUNT(*) n FROM event_regs WHERE event_id=?', e.id).n; const left = e.capacity ? Math.max(0, e.capacity - n) : null;
  return layout(ctx, { title: e.title, path: `/agenda/${e.slug}`, desc: e.description, main: html`<section class="wrap pad narrow-ish">${crumbs([['/agenda', t('foot.agenda')], [null, e.title]], lang)}<p class="kicker">${modeLabel(e.mode, lang)}</p><h1>${e.title}</h1><p class="lead">${e.description}</p>
<dl class="meta"><div><dt>${s(lang, 'Cuándo', 'When', 'Quando')}</dt><dd>${fdl(e.starts_at, lang, { dateStyle: 'long', timeStyle: 'short' })} (${s(lang, 'hora de Colombia', 'Colombia time', 'horário da Colômbia')})</dd></div><div><dt>${s(lang, 'Dónde', 'Where', 'Onde')}</dt><dd>${e.location || modeLabel(e.mode, lang)}</dd></div><div><dt>${s(lang, 'Cupos', 'Seats', 'Vagas')}</dt><dd>${left === null ? s(lang, 'Abiertos', 'Open', 'Abertas') : left > 0 ? s(lang, left + ' disponibles', left + ' available', left + ' disponíveis') : s(lang, 'Agotados', 'Full', 'Esgotadas')}</dd></div></dl>
<p><a class="btn ghost" href="/agenda/${e.slug}.ics" data-track="ics" data-label="${e.slug}">${s(lang, 'Añadir al calendario (.ics)', 'Add to calendar (.ics)', 'Adicionar ao calendário (.ics)')}</a></p>
${left === 0 ? html`<p class="tag warn">${s(lang, 'Cupos agotados', 'Fully booked', 'Vagas esgotadas')}</p>` : html`<form class="card form" data-api="/api/events/${e.id}/register" data-ok="${t('form.enroll_ok')}"><h2>${s(lang, 'Inscripción', 'Registration', 'Inscrição')}</h2>${field(t('form.name'), 'name', { required: true, auto: 'name', value: ctx.user?.name })}${field(t('form.email'), 'email', { type: 'email', required: true, auto: 'email', value: ctx.user?.email })}<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn">${s(lang, 'Inscribirme', 'Register', 'Inscrever-me')}</button><p class="form-msg" role="status"></p></form>`}</section>`,
    jsonld: { '@context': 'https://schema.org', '@type': 'Event', name: e.title, description: e.description, startDate: e.starts_at, endDate: e.ends_at, eventAttendanceMode: e.mode === 'Virtual' ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode', location: { '@type': 'Place', name: e.location || e.mode }, organizer: { '@type': 'Organization', name: SITE_NAME } } });
}

// ---------------------------------------------------------------- Boletín, contacto, privacidad
export function newsletter(ctx) {
  const lang = ctx.lang || 'es', t = tl(lang);
  return layout(ctx, { title: t('foot.newsletter'), path: '/newsletter', desc: s(lang, 'Suscríbete al boletín de Base Parkway.', 'Subscribe to the Base Parkway newsletter.', 'Assine o boletim da Base Parkway.'),
    main: html`${pageHead(t('foot.newsletter'), s(lang, 'Novedades del archivo, la agenda y el aula', 'News from the archive, events and classroom', 'Novidades do arquivo, da agenda e da sala de aula'), s(lang, 'Un correo cuando hay algo que vale la pena.', 'An email only when there is something worth sharing.', 'Um e-mail apenas quando há algo que vale a pena.'))}<section class="wrap pad narrow-ish"><form class="card form" data-api="/api/newsletter" data-ok="${t('form.nl_ok')}">${field(s(lang, 'Nombre (opcional)', 'Name (optional)', 'Nome (opcional)'), 'name', { auto: 'name' })}${field(t('form.email'), 'email', { type: 'email', required: true, auto: 'email' })}<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn">${t('form.subscribe')}</button><p class="form-msg" role="status"></p></form></section>` });
}
export function contacto(ctx) {
  const lang = ctx.lang || 'es', t = tl(lang);
  return layout(ctx, { title: t('nav.contact'), path: '/contacto', desc: s(lang, 'Escríbenos: consultas editoriales, académicas o sobre tus pedidos.', 'Write to us: editorial, academic or order enquiries.', 'Escreva-nos: consultas editoriais, acadêmicas ou sobre pedidos.'),
    main: html`${pageHead(t('nav.contact'), s(lang, 'Escríbenos', 'Write to us', 'Escreva-nos'), s(lang, 'Respondemos en un máximo de 2 días hábiles.', 'We reply within 2 working days.', 'Respondemos em até 2 dias úteis.'))}<section class="wrap pad narrow-ish"><form class="card form" data-api="/api/contact" data-ok="${t('form.contact_ok')}">${field(t('form.name'), 'name', { required: true, auto: 'name', value: ctx.user?.name })}${field(t('form.email'), 'email', { type: 'email', required: true, auto: 'email', value: ctx.user?.email })}${field(t('form.subject'), 'subject')}${field(t('form.message'), 'body', { textarea: true, required: true, max: 3000 })}<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn">${t('form.send')}</button><p class="form-msg" role="status"></p></form></section>` });
}
export function privacidad(ctx) {
  const lang = ctx.lang || 'es', t = tl(lang);
  const txt = STATIC
    ? s(lang, `## Qué recibimos\n\nSolo lo que tú envías por los formularios (boletín, contacto, consultas e inscripciones a eventos), gestionado mediante Netlify Forms.\n\n## Tus derechos\n\nPuedes pedir la consulta, corrección o eliminación de tus datos desde [Contacto](/contacto).`, `## What we receive\n\nOnly what you send through the forms (newsletter, contact, questions and event registrations), handled through Netlify Forms.\n\n## Your rights\n\nYou can ask to see, correct or delete your data through [Contact](/contacto).`, `## O que recebemos\n\nApenas o que você envia pelos formulários (boletim, contato, consultas e inscrições em eventos), gerenciado pelo Netlify Forms.\n\n## Seus direitos\n\nVocê pode pedir a consulta, correção ou exclusão de seus dados em [Contato](/contacto).`)
    : s(lang, `## Qué guardamos\n\nCuenta (nombre, correo, contraseña cifrada), pedidos, suscripción al boletín, mensajes y inscripciones.\n\n## Analítica\n\nAnalítica propia, sin terceros: páginas vistas y acciones clave con un identificador aleatorio de sesión. No guardamos IP.\n\n## Pagos\n\nNo almacenamos números completos de tarjeta.\n\n## Tus derechos\n\nPuedes pedir la consulta, corrección o eliminación de tus datos desde [Contacto](/contacto).`, `## What we store\n\nAccount (name, email, encrypted password), orders, newsletter subscription, messages and registrations.\n\n## Analytics\n\nFirst-party analytics, no third parties: page views and key actions with a random session identifier. We do not store IP addresses.\n\n## Payments\n\nWe do not store full card numbers.\n\n## Your rights\n\nYou can ask to see, correct or delete your data through [Contact](/contacto).`, `## O que guardamos\n\nConta (nome, e-mail, senha criptografada), pedidos, assinatura do boletim, mensagens e inscrições.\n\n## Análises\n\nAnálise própria, sem terceiros: páginas vistas e ações-chave com um identificador aleatório de sessão. Não guardamos IP.\n\n## Pagamentos\n\nNão armazenamos números completos de cartão.\n\n## Seus direitos\n\nVocê pode pedir a consulta, correção ou exclusão de seus dados em [Contato](/contacto).`);
  return layout(ctx, { title: t('foot.privacy'), path: '/privacidad', main: html`${pageHead(s(lang, 'Legal', 'Legal', 'Legal'), t('foot.privacy'))}<section class="wrap pad narrow-ish prose">${md(txt)}</section>` });
}

// ---------------------------------------------------------------- Aula (portada y programa; las lecciones están en español)
import { courseOutline, enrolled } from './pages-aula.js';
const bar = (pct, lang) => html`<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${s(lang, 'Avance del curso', 'Course progress', 'Progresso do curso')}"><span style="width:${pct}%"></span></div>`;
const esOnly = (lang) => (lang === 'es' ? '' : html`<p class="note">${s(lang, '', 'The lessons are written in Spanish; the interface is available in English.', 'As lições estão escritas em espanhol; a interface está disponível em português.')}</p>`);
export function aula(ctx) {
  const lang = ctx.lang || 'es'; const courses = all('SELECT * FROM courses WHERE published=1 ORDER BY id').map((c) => loc('courses', c, lang));
  const cards = courses.map((c) => { const o = courseOutline(c.id, ctx.user?.id); const en = !STATIC && enrolled(ctx.user?.id, c.id);
    return html`<article class="card course reveal"><p class="kicker">${c.level}</p><h3><a href="/aula/${c.slug}">${c.title}</a></h3><p>${c.summary}</p><p class="muted">${o.total} ${s(lang, 'lecciones', 'lessons', 'lições')} · ${o.minutes} min</p>${en ? html`${bar(o.pct, lang)}<p class="row between"><small>${o.done}/${o.total} · ${o.pct} %</small><a class="btn sm" href="/aula/${c.slug}">${o.done ? s(lang, 'Continuar', 'Continue', 'Continuar') : s(lang, 'Empezar', 'Start', 'Começar')}</a></p>` : html`<p><a class="btn sm" href="/aula/${c.slug}">${STATIC ? s(lang, 'Leer el curso', 'Read the course', 'Ler o curso') : s(lang, 'Ver programa', 'See the programme', 'Ver programa')}</a></p>`}</article>`; });
  const lead = STATIC ? s(lang, 'Curso piloto en lectura abierta. Las cuentas, evaluaciones y seguimiento de avance llegan con la versión completa.', 'Pilot course in open reading. Accounts, quizzes and progress tracking arrive with the full version.', 'Curso piloto em leitura aberta. Contas, avaliações e acompanhamento do progresso chegam com a versão completa.')
    : ctx.user ? s(lang, `Hola, ${ctx.user.name}. Tu avance se guarda automáticamente.`, `Hello, ${ctx.user.name}. Your progress is saved automatically.`, `Olá, ${ctx.user.name}. Seu progresso é salvo automaticamente.`) : s(lang, 'Regístrate, matricúlate y estudia a tu ritmo. Tu avance queda registrado.', 'Sign up, enrol and study at your own pace. Your progress is recorded.', 'Cadastre-se, matricule-se e estude no seu ritmo. Seu progresso fica registrado.');
  return layout(ctx, { title: s(lang, 'Aula virtual', 'Virtual classroom', 'Sala de aula virtual'), path: '/aula', desc: lead, main: html`${pageHead(tl(lang)('nav.classroom'), s(lang, 'Aula virtual', 'Virtual classroom', 'Sala de aula virtual'), lead)}<section class="wrap pad">${esOnly(lang)}${!STATIC && !ctx.user ? html`<p class="note"><a href="/registro?next=/aula">${s(lang, 'Crear cuenta', 'Create account', 'Criar conta')}</a> · <a href="/ingresar?next=/aula">${tl(lang)('nav.login')}</a></p>` : ''}<div class="grid2">${cards}</div></section>` });
}
export function curso(ctx) {
  const lang = ctx.lang || 'es', t = tl(lang); const c0 = get('SELECT * FROM courses WHERE slug=? AND published=1', ctx.params.slug); if (!c0) return notFound(ctx); const c = loc('courses', c0, lang);
  const o = courseOutline(c.id, ctx.user?.id); const en = STATIC || enrolled(ctx.user?.id, c.id); const res = all('SELECT * FROM resources WHERE course_id=? AND lesson_id IS NULL', c.id); const next = o.flat.find((l) => !l.done) || o.flat[0];
  const cta = STATIC ? html`<a class="btn" href="/aula/${c.slug}/leccion/${o.flat[0].id}">${s(lang, 'Empezar a leer', 'Start reading', 'Começar a ler')}</a>`
    : !ctx.user ? html`<a class="btn" href="/registro?next=/aula/${c.slug}">${s(lang, 'Crear cuenta para matricularme', 'Create an account to enrol', 'Criar conta para me matricular')}</a> <a class="btn ghost" href="/ingresar?next=/aula/${c.slug}">${t('nav.login')}</a>`
    : en ? html`<a class="btn" href="/aula/${c.slug}/leccion/${next.id}">${o.done ? s(lang, 'Continuar curso', 'Continue course', 'Continuar curso') : s(lang, 'Empezar curso', 'Start course', 'Começar curso')}</a>`
    : c0.free ? html`<button class="btn" data-enroll="${c.id}">${s(lang, 'Matricularme gratis', 'Enrol for free', 'Matricular-me grátis')}</button>` : html`<a class="btn" href="/catalogo?tipo=course">${s(lang, 'Comprar matrícula', 'Buy enrolment', 'Comprar matrícula')}</a>`;
  return layout(ctx, { title: c.title, path: `/aula/${c.slug}`, desc: c.summary, main: html`<section class="wrap pad">${crumbs([['/aula', t('nav.classroom')], [null, c.title]], lang)}<div class="course-head"><div><p class="kicker">${c.level}</p><h1>${c.title}</h1><p class="lead">${c.summary}</p><p>${cta}</p>${STATIC ? '' : html`<p class="form-msg" role="status" data-enroll-msg></p>`}</div>${en && !STATIC ? html`<aside class="card progress-card"><h2>${s(lang, 'Tu avance', 'Your progress', 'Seu progresso')}</h2>${bar(o.pct, lang)}<p><b>${o.pct} %</b> · ${o.done}/${o.total}</p></aside>` : ''}</div>${esOnly(lang)}
<div class="outline">${o.modules.map((m) => html`<section class="module"><h2>${m.title}</h2><ol>${m.lessons.map((l) => html`<li class="${l.done ? 'done' : ''}"><span class="check" aria-hidden="true">${l.done ? '✓' : ''}</span>${en ? html`<a href="/aula/${c.slug}/leccion/${l.id}">${l.title}</a>` : html`<span>${l.title}</span>`}<small>${l.kind} · ${l.minutes} min</small></li>`)}</ol></section>`)}</div>
${res.length ? html`<h2>${s(lang, 'Recursos del curso', 'Course resources', 'Recursos do curso')}</h2><ul class="plain resources">${res.map((r) => html`<li><a href="${r.url}" ${/^https?:/.test(r.url) ? raw('rel="noopener" target="_blank"') : ''}><span class="tag">${r.kind}</span> ${r.title}</a></li>`)}</ul>` : ''}</section>`,
    jsonld: { '@context': 'https://schema.org', '@type': 'Course', name: c.title, description: c.summary, inLanguage: 'es', provider: { '@type': 'Organization', name: SITE_NAME, sameAs: siteUrl() } } });
}

import { html, raw, esc } from '../lib/util.js';
import { ISHANGO } from '../lib/content.js';
import { isPrime } from '../lib/util.js';

export const SITE_NAME = 'Base Parkway';
export const STATIC = process.env.STATIC_BUILD === '1';
export const siteUrl = () => (process.env.SITE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');

// Marca: tres capas apiladas (rombo + dos chevrones), tal como el logotipo de Base Parkway.
export const logoMark = (cls = '') => raw(`<svg class="logo-mark ${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
<path class="l l1" d="M50 7 L93 29 L50 51 L7 29 Z" stroke-width="7" stroke-linejoin="round"/>
<path class="l l2" d="M8 53 L50 75 L92 53" fill="none" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
<path class="l l3" d="M8 72 L50 94 L92 72" fill="none" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
export const wordmark = () => html`<span class="wordmark"><b>BASE</b><span>Parkway</span></span>`;
export const brand = (cls = '') => html`<span class="brand ${cls}">${logoMark()}${wordmark()}</span>`;

export function boneSvg({ animate = true } = {}) {
  const rows = [['G', 90], ['M', 140], ['D', 190]]; let i = 0; let out = '';
  const x0 = 150, step = 5.4, gap = 28;
  for (const [col, y] of rows) {
    out += `<text class="bone-lab" x="${x0 - 22}" y="${y + 5}" text-anchor="end">${col}</text>`;
    let x = x0;
    for (const n of ISHANGO[col].groups) {
      const p = isPrime(n);
      for (let k = 0; k < n; k++) { out += `<line class="tick${p ? ' p' : ''}" style="--i:${i++}" x1="${(x + k * step).toFixed(1)}" x2="${(x + k * step).toFixed(1)}" y1="${y - 17}" y2="${y + 17}"/>`; }
      x += n * step + gap;
    }
  }
  return raw(`<svg class="bone${animate ? ' anim' : ''}" viewBox="0 0 960 280" role="img" aria-label="Esquema del hueso de Ishango: tres columnas con 16 grupos y 168 marcas. Los grupos con número primo se resaltan en borgoña.">
<defs><linearGradient id="bg" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/></linearGradient></defs>
<g class="bone-body"><path d="M120 60 H840 Q880 60 880 100 V180 Q880 220 840 220 H120 Q80 220 80 180 V100 Q80 60 120 60Z" fill="url(#bg)" stroke="#fff" stroke-opacity=".35"/>
<circle cx="84" cy="64" r="26" fill="none" stroke="#fff" stroke-opacity=".25"/><circle cx="84" cy="216" r="26" fill="none" stroke="#fff" stroke-opacity=".25"/>
<circle cx="876" cy="64" r="26" fill="none" stroke="#fff" stroke-opacity=".25"/><circle cx="876" cy="216" r="26" fill="none" stroke="#fff" stroke-opacity=".25"/></g>
${out}</svg>`);
}

const NAV = [['/archivo', 'Archivo'], ['/fichas', 'Fichas'], ['/catalogo', 'Catálogo'], ['/agenda', 'Agenda'], ['/aula', 'Aula']];

export function layout(ctx, { title, desc, path, image, jsonld, noindex = false, bodyClass = '', main, hero }) {
  const u = ctx.user; const base = siteUrl();
  const full = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — Editorial y aula académica`;
  const d = desc || 'Base Parkway: plataforma editorial y académica con archivo sobre el Hueso de Ishango, fichas, catálogo, agenda, boletín y aula virtual.';
  const canon = base + (path || ctx.url.pathname);
  const img = image || '/img/og-base.svg';
  return html`<!doctype html>
<html lang="es-CO" ${STATIC ? raw('data-static="1"') : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${full}</title><meta name="description" content="${d}">
${noindex ? raw('<meta name="robots" content="noindex,nofollow">') : raw(`<link rel="canonical" href="${esc(canon)}">`)}
<meta property="og:type" content="website"><meta property="og:site_name" content="${SITE_NAME}"><meta property="og:locale" content="es_CO"><meta property="og:title" content="${full}"><meta property="og:description" content="${d}"><meta property="og:url" content="${canon}"><meta property="og:image" content="${base}${img}">
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#5b0f25">
<link rel="icon" href="/img/logo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Poppins:wght@500;600;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap">
<link rel="stylesheet" href="/css/app.css">
${jsonld ? raw(`<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>`) : ''}
</head><body class="${bodyClass}">
<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="site-header" id="top"><div class="wrap bar">
<a class="brand-link" href="/" aria-label="Base Parkway — inicio">${brand()}</a>
<button class="nav-toggle" aria-expanded="false" aria-controls="nav"><span class="sr">Menú</span><i></i><i></i><i></i></button>
<nav id="nav" class="nav" aria-label="Principal">${NAV.map(([h, t]) => html`<a href="${h}" ${ctx.url.pathname === h || (h !== '/' && ctx.url.pathname.startsWith(h + '/')) ? raw('aria-current="page"') : ''}>${t}</a>`)}
${STATIC ? html`<a class="btn sm" href="/contacto">Contacto</a>` : html`<span class="nav-sep"></span>
<a class="cart-link" href="/carrito" aria-label="Carrito, ${ctx.cartCount} artículos">Carrito <span class="badge" data-cart-count>${ctx.cartCount}</span></a>
${u ? html`<a href="/pedidos">Mi cuenta</a>${u.role !== 'user' ? html`<a href="/admin">CMS</a>` : ''}<button class="linkish" data-logout>Salir</button>` : html`<a class="btn sm" href="/ingresar">Ingresar</a>`}`}
</nav></div></header>
${hero || ''}
<main id="contenido" tabindex="-1">${main}</main>
<footer class="site-footer"><div class="wrap grid4">
<div>${brand('inv')}<p class="muted">Editorial y aula académica. Archivo principal sobre el hueso de Ishango.</p></div>
<div><h2>Explorar</h2><ul class="plain"><li><a href="/archivo">Archivo Ishango</a></li><li><a href="/fichas">Fichas editoriales</a></li><li><a href="/catalogo">Catálogo</a></li><li><a href="/agenda">Agenda</a></li></ul></div>
<div><h2>Comunidad</h2><ul class="plain"><li><a href="/aula">Aula virtual</a></li><li><a href="/newsletter">Boletín</a></li><li><a href="/contacto">Contacto</a></li>${STATIC ? '' : html`<li><a href="/ayuda">Manual de uso</a></li>`}<li><a href="/privacidad">Privacidad</a></li></ul></div>
<div><h2>Boletín</h2><form class="inline-form" data-api="/api/newsletter" data-ok="Revisa tu correo para confirmar."><label class="sr" for="fn-email">Correo</label><input id="fn-email" name="email" type="email" required placeholder="tu@correo.com" autocomplete="email"><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn sm light">Suscribirme</button><p class="form-msg" role="status"></p></form></div>
</div><div class="wrap legal"><span>© ${new Date().getFullYear()} Base Parkway. Fuente del archivo: <a href="https://periodico.unal.edu.co/articulos/el-enigmatico-hueso-de-ishango-secreto-ancestral-de-numeros-primos-gemelos" rel="noopener">Periódico UNAL</a>.</span><a href="#top">Volver arriba ↑</a></div></footer>
<div class="toast" role="status" aria-live="polite"></div>
<script src="/js/app.js" defer></script></body></html>`;
}

export const field = (label, name, o = {}) => html`<div class="field"><label for="f-${name}">${label}${o.required ? raw(' <abbr title="obligatorio">*</abbr>') : ''}</label>${o.textarea ? html`<textarea id="f-${name}" name="${name}" rows="${o.rows || 5}" ${o.required ? 'required' : ''} ${o.max ? raw(`maxlength="${o.max}"`) : ''}>${o.value || ''}</textarea>` : html`<input id="f-${name}" name="${name}" type="${o.type || 'text'}" value="${o.value || ''}" ${o.required ? 'required' : ''} ${o.auto ? raw(`autocomplete="${o.auto}"`) : ''} ${o.ph ? raw(`placeholder="${esc(o.ph)}"`) : ''} ${o.pattern ? raw(`pattern="${esc(o.pattern)}"`) : ''} ${o.minlength ? raw(`minlength="${o.minlength}"`) : ''} ${o.inputmode ? raw(`inputmode="${o.inputmode}"`) : ''}>`}${o.hint ? html`<small>${o.hint}</small>` : ''}</div>`;

export const crumbs = (items) => html`<nav class="crumbs" aria-label="Migas de pan"><a href="/">Inicio</a>${items.map(([h, t]) => h ? html` <span aria-hidden="true">/</span> <a href="${h}">${t}</a>` : html` <span aria-hidden="true">/</span> <span aria-current="page">${t}</span>`)}</nav>`;
export const pageHead = (kicker, title, lead) => html`<section class="page-head"><div class="wrap"><p class="kicker">${kicker}</p><h1>${title}</h1>${lead ? html`<p class="lead">${lead}</p>` : ''}</div></section>`;
export const cover = (p) => html`<div class="cover" data-kind="${p.kind}">${logoMark()}<span class="cover-kind">${{ digital: 'PDF · entrega digital', physical: 'Edición física', course: 'Aula virtual' }[p.kind]}</span><span class="cover-title">${p.title.replace(/\s*\(.*\)$/, '')}</span></div>`;

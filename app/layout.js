import { html, raw, esc, isPrime } from '../lib/util.js';
import { ISHANGO } from '../lib/content.js';
import { LANGS, LANG_NAMES, HTML_LANG, OG_LOCALE, tl } from '../lib/i18n.js';

export const SITE_NAME = 'Base Parkway';
export const STATIC = process.env.STATIC_BUILD === '1';
export const siteUrl = () => (process.env.SITE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
export const langPrefix = (lang) => (lang && lang !== 'es' ? '/' + lang : '');
export const numType = (n) => (n < 2 ? '1' : isPrime(n) ? 'p' : n % 2 ? 'o' : 'e');

// Marca: tres capas apiladas (rombo + dos chevrones), tal como el logotipo de Base Parkway.
export const logoMark = (cls = '') => raw(`<svg class="logo-mark ${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
<path class="l l1" d="M50 7 L93 29 L50 51 L7 29 Z" stroke-width="7" stroke-linejoin="round"/>
<path class="l l2" d="M8 53 L50 75 L92 53" fill="none" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
<path class="l l3" d="M8 72 L50 94 L92 72" fill="none" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
export const wordmark = () => html`<span class="wordmark"><b>BASE</b><span>Parkway</span></span>`;
export const brand = (cls = '') => html`<span class="brand ${cls}">${logoMark()}${wordmark()}</span>`;

// Esquema del hueso con la convención: rojo = primo, verde = compuesto impar, negro = compuesto par.
export function boneSvg({ animate = true, lang = 'es' } = {}) {
  const t = tl(lang); const rows = [['G', 90], ['M', 140], ['D', 190]]; let i = 0; let out = '';
  const x0 = 150, step = 5.4, gap = 28;
  for (const [col, y] of rows) {
    out += `<text class="bone-lab" x="${x0 - 22}" y="${y + 5}" text-anchor="end">${col}</text>`;
    let x = x0;
    for (const n of ISHANGO[col].groups) {
      const ty = numType(n);
      for (let k = 0; k < n; k++) out += `<line class="tick t-${ty}" style="--i:${i++}" x1="${(x + k * step).toFixed(1)}" x2="${(x + k * step).toFixed(1)}" y1="${y - 17}" y2="${y + 17}"/>`;
      x += n * step + gap;
    }
  }
  return raw(`<svg class="bone${animate ? ' anim' : ''}" viewBox="0 0 960 280" role="img" aria-label="${esc(t('bone.alt'))}">
<g class="bone-body"><path d="M120 60 H840 Q880 60 880 100 V180 Q880 220 840 220 H120 Q80 220 80 180 V100 Q80 60 120 60Z"/>
<circle cx="84" cy="64" r="26"/><circle cx="84" cy="216" r="26"/><circle cx="876" cy="64" r="26"/><circle cx="876" cy="216" r="26"/></g>
${out}</svg>`);
}

// Leyenda de la convención de color (común a todo el sitio).
export const legend = (lang, only) => { const t = tl(lang); return html`<ul class="legend" aria-label="${t('legend.title')}">${['p', 'o', 'e'].filter((k) => !only || only.includes(k)).map((k) => html`<li><i class="sw n-${k}"></i>${t('legend.' + k)}</li>`)}</ul>`; };

const NAV = [['/archivo', 'nav.archive'], ['/preguntas', 'nav.faq'], ['/fichas', 'nav.sheets'], ['/biblioteca', 'nav.library'], ['/catalogo', 'nav.catalog'], ['/aula', 'nav.classroom']];

export function layout(ctx, { title, desc, path, image, jsonld, noindex = false, bodyClass = '', main, hero }) {
  const lang = ctx.lang || 'es'; const t = tl(lang); const u = ctx.user; const base = siteUrl(); const P = langPrefix(lang);
  const bp = ctx.basePath || ctx.url.pathname; const cur = bp.replace(/\/$/, '') || '/';
  const full = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — ${t('foot.tag').split('.')[0]}`;
  const d = desc || t('foot.tag');
  const canon = base + P + (path || bp).replace(/^\/$/, '');
  const img = image || '/img/og-base.svg';
  const L = (p) => P + p;
  return html`<!doctype html>
<html lang="${HTML_LANG[lang]}" ${STATIC ? raw('data-static="1"') : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${full}</title><meta name="description" content="${d}">
${noindex ? raw('<meta name="robots" content="noindex,nofollow">') : raw(`<link rel="canonical" href="${esc(canon || base + '/')}">${LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(base + langPrefix(l) + (path || bp).replace(/^\/$/, ''))}">`).join('')}`)}
<meta property="og:type" content="website"><meta property="og:site_name" content="${SITE_NAME}"><meta property="og:locale" content="${OG_LOCALE[lang]}"><meta property="og:title" content="${full}"><meta property="og:description" content="${d}"><meta property="og:url" content="${canon}"><meta property="og:image" content="${base}${img}">
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#5b0f25">
<link rel="icon" href="/img/logo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Poppins:wght@500;600;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap">
<link rel="stylesheet" href="/css/app.css"><link rel="stylesheet" href="/css/extra.css">
${jsonld ? raw(`<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>`) : ''}
</head><body class="${bodyClass}">
<a class="skip" href="#contenido">${t('skip')}</a>
<header class="site-header" id="top"><div class="wrap bar">
<a class="brand-link" href="${L('/')}" aria-label="Base Parkway — ${t('crumb.home')}">${brand()}</a>
<button class="nav-toggle" aria-expanded="false" aria-controls="nav"><span class="sr">${t('nav.menu')}</span><i></i><i></i><i></i></button>
<nav id="nav" class="nav" aria-label="${t('nav.main')}">${NAV.map(([h, k]) => html`<a href="${L(h)}" ${cur === h || cur.startsWith(h + '/') ? raw('aria-current="page"') : ''}>${t(k)}</a>`)}
${STATIC ? html`<a class="btn sm" href="${L('/contacto')}">${t('nav.contact')}</a>` : html`<span class="nav-sep"></span>
<a class="cart-link" href="${L('/carrito')}" aria-label="${t('nav.cart')}, ${ctx.cartCount}">${t('nav.cart')} <span class="badge" data-cart-count>${ctx.cartCount}</span></a>
${u ? html`<a href="${L('/pedidos')}">${t('nav.account')}</a>${u.role !== 'user' ? html`<a href="/admin">CMS</a>` : ''}<button class="linkish" data-logout>${t('nav.logout')}</button>` : html`<a class="btn sm" href="${L('/ingresar')}">${t('nav.login')}</a>`}`}
<span class="nav-sep"></span>
<div class="lang" role="group" aria-label="${t('lang.label')}">${LANGS.map((l) => html`<a href="${langPrefix(l) + (cur === '/' ? (l === 'es' ? '/' : '') : cur)}" hreflang="${l}" lang="${l}" title="${LANG_NAMES[l]}" ${l === lang ? raw('aria-current="true"') : ''}>${l.toUpperCase()}</a>`)}</div>
</nav></div></header>
${hero || ''}
<main id="contenido" tabindex="-1">${main}</main>
<footer class="site-footer"><div class="wrap grid4">
<div>${brand('inv')}<p class="muted">${t('foot.tag')}</p></div>
<div><h2>${t('foot.explore')}</h2><ul class="plain"><li><a href="${L('/archivo')}">${t('nav.archive')}</a></li><li><a href="${L('/preguntas')}">${t('nav.faq')}</a></li><li><a href="${L('/fichas')}">${t('nav.sheets')}</a></li><li><a href="${L('/catalogo')}">${t('nav.catalog')}</a></li><li><a href="${L('/agenda')}">${t('foot.agenda')}</a></li></ul></div>
<div><h2>${t('foot.community')}</h2><ul class="plain"><li><a href="${L('/autor')}">${t('foot.author')}</a></li><li><a href="${L('/biblioteca')}">${t('nav.library')}</a></li><li><a href="${L('/aula')}">${t('nav.classroom')}</a></li><li><a href="${L('/newsletter')}">${t('foot.newsletter')}</a></li><li><a href="${L('/contacto')}">${t('nav.contact')}</a></li>${STATIC ? '' : html`<li><a href="/ayuda">${t('foot.manual')}</a></li>`}<li><a href="${L('/privacidad')}">${t('foot.privacy')}</a></li></ul></div>
<div><h2>${t('foot.newsletter')}</h2><form class="inline-form" data-api="/api/newsletter" data-ok="${t('form.nl_ok')}"><label class="sr" for="fn-email">${t('form.email')}</label><input id="fn-email" name="email" type="email" required placeholder="${t('form.email_ph')}" autocomplete="email"><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn sm light">${t('form.subscribe')}</button><p class="form-msg" role="status"></p></form></div>
</div><div class="wrap legal"><span>© ${new Date().getFullYear()} Base Parkway. ${t('foot.source')}: <a href="https://periodico.unal.edu.co/articulos/el-enigmatico-hueso-de-ishango-secreto-ancestral-de-numeros-primos-gemelos" rel="noopener">Periódico UNAL</a>.</span><a href="#top">${t('foot.top')}</a></div></footer>
<div class="toast" role="status" aria-live="polite"></div>
<script src="/js/app.js" defer></script><script src="/js/extra.js" defer></script></body></html>`;
}

export const field = (label, name, o = {}) => html`<div class="field"><label for="f-${name}">${label}${o.required ? raw(' <abbr title="*">*</abbr>') : ''}</label>${o.textarea ? html`<textarea id="f-${name}" name="${name}" rows="${o.rows || 5}" ${o.required ? 'required' : ''} ${o.max ? raw(`maxlength="${o.max}"`) : ''}>${o.value || ''}</textarea>` : html`<input id="f-${name}" name="${name}" type="${o.type || 'text'}" value="${o.value || ''}" ${o.required ? 'required' : ''} ${o.auto ? raw(`autocomplete="${o.auto}"`) : ''} ${o.ph ? raw(`placeholder="${esc(o.ph)}"`) : ''} ${o.pattern ? raw(`pattern="${esc(o.pattern)}"`) : ''} ${o.minlength ? raw(`minlength="${o.minlength}"`) : ''} ${o.inputmode ? raw(`inputmode="${o.inputmode}"`) : ''}>`}${o.hint ? html`<small>${o.hint}</small>` : ''}</div>`;

export const crumbs = (items, lang = 'es') => { const t = tl(lang); const P = langPrefix(lang); return html`<nav class="crumbs" aria-label="${t('crumb.label')}"><a href="${P}/">${t('crumb.home')}</a>${items.map(([h, x]) => h ? html` <span aria-hidden="true">/</span> <a href="${P}${h}">${x}</a>` : html` <span aria-hidden="true">/</span> <span aria-current="page">${x}</span>`)}</nav>`; };
export const pageHead = (kicker, title, lead) => html`<section class="page-head"><div class="wrap"><p class="kicker">${kicker}</p><h1>${title}</h1>${lead ? html`<p class="lead">${lead}</p>` : ''}</div></section>`;
export const cover = (p, lang = 'es') => html`<div class="cover" data-kind="${p.kind}">${logoMark()}<span class="cover-kind">${{ digital: { es: 'PDF · entrega digital', en: 'PDF · digital delivery', pt: 'PDF · entrega digital' }, physical: { es: 'Edición física', en: 'Print edition', pt: 'Edição impressa' }, course: { es: 'Aula virtual', en: 'Classroom', pt: 'Sala de aula' } }[p.kind][lang]}</span><span class="cover-title">${p.title.replace(/\s*\(.*\)$/, '')}</span></div>`;

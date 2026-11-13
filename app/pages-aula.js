import { all, get } from '../lib/db.js';
import { html, raw, md, esc } from '../lib/util.js';
import { layout, crumbs, pageHead, siteUrl, SITE_NAME, STATIC } from './layout.js';
import { notFound } from './pages-public.js';

export function courseOutline(courseId, userId) {
  const mods = all('SELECT * FROM modules WHERE course_id=? ORDER BY ord', courseId);
  const done = new Set(userId ? all('SELECT lesson_id FROM progress WHERE user_id=?', userId).map((r) => r.lesson_id) : []);
  const out = mods.map((m) => ({ ...m, lessons: all('SELECT * FROM lessons WHERE module_id=? ORDER BY ord', m.id).map((l) => ({ ...l, done: done.has(l.id) })) }));
  const flat = out.flatMap((m) => m.lessons); const n = flat.length; const d = flat.filter((l) => l.done).length;
  return { modules: out, flat, total: n, done: d, pct: n ? Math.round((d / n) * 100) : 0, minutes: flat.reduce((a, l) => a + l.minutes, 0) };
}
export const enrolled = (uid, cid) => !!(uid && get('SELECT 1 FROM enrollments WHERE user_id=? AND course_id=?', uid, cid));
const bar = (pct) => html`<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Avance del curso"><span style="width:${pct}%"></span></div>`;

export function aula(ctx) {
  const courses = all('SELECT * FROM courses WHERE published=1 ORDER BY id');
  const cards = courses.map((c) => { const o = courseOutline(c.id, ctx.user?.id); const en = !STATIC && enrolled(ctx.user?.id, c.id); return html`<article class="card course reveal"><p class="kicker">${c.level}</p><h3><a href="/aula/${c.slug}">${c.title}</a></h3><p>${c.summary}</p><p class="muted">${o.total} lecciones · ${o.minutes} min</p>${en ? html`${bar(o.pct)}<p class="row between"><small>${o.done}/${o.total} completadas · ${o.pct} %</small><a class="btn sm" href="/aula/${c.slug}">${o.done ? 'Continuar' : 'Empezar'}</a></p>` : html`<p><a class="btn sm" href="/aula/${c.slug}">${STATIC ? 'Leer el curso' : 'Ver programa'}</a></p>`}</article>`; });
  return layout(ctx, { title: 'Aula virtual', path: '/aula', desc: 'Aula virtual de Base Parkway: curso piloto «Ishango y los números primos» con lecciones, recursos, evaluaciones y seguimiento de avance.', main: html`${pageHead('Aula', 'Aula virtual', STATIC ? 'Curso piloto en lectura abierta. Las cuentas, evaluaciones y seguimiento de avance llegan con la versión completa.' : ctx.user ? `Hola, ${ctx.user.name}. Tu avance se guarda automáticamente.` : 'Regístrate, matricúlate y estudia a tu ritmo. Tu avance queda registrado.')}<section class="wrap pad">${!STATIC && !ctx.user ? html`<p class="note">Para matricularte necesitas una cuenta. <a href="/registro?next=/aula">Crear cuenta</a> · <a href="/ingresar?next=/aula">Ingresar</a></p>` : ''}<div class="grid2">${cards}</div></section>` });
}

export function curso(ctx) {
  const c = get('SELECT * FROM courses WHERE slug=? AND published=1', ctx.params.slug); if (!c) return notFound(ctx);
  const o = courseOutline(c.id, ctx.user?.id); const en = STATIC || enrolled(ctx.user?.id, c.id);
  const res = all('SELECT * FROM resources WHERE course_id=? AND lesson_id IS NULL', c.id);
  const next = o.flat.find((l) => !l.done) || o.flat[0];
  const cta = STATIC ? html`<a class="btn" href="/aula/${c.slug}/leccion/${o.flat[0].id}">Empezar a leer</a>` : !ctx.user ? html`<a class="btn" href="/registro?next=/aula/${c.slug}">Crear cuenta para matricularme</a> <a class="btn ghost" href="/ingresar?next=/aula/${c.slug}">Ingresar</a>`
    : en ? html`<a class="btn" href="/aula/${c.slug}/leccion/${next.id}">${o.done ? 'Continuar curso' : 'Empezar curso'}</a>`
    : c.free ? html`<button class="btn" data-enroll="${c.id}">Matricularme gratis</button>` : html`<a class="btn" href="/catalogo?tipo=course">Comprar matrícula</a>`;
  return layout(ctx, { title: c.title, path: `/aula/${c.slug}`, desc: c.summary, main: html`<section class="wrap pad">${crumbs([['/aula', 'Aula'], [null, c.title]])}<div class="course-head"><div><p class="kicker">${c.level}</p><h1>${c.title}</h1><p class="lead">${c.summary}</p><p>${cta}</p>${STATIC ? '' : html`<p class="form-msg" role="status" data-enroll-msg></p>`}</div>${en && !STATIC ? html`<aside class="card progress-card"><h2>Tu avance</h2>${bar(o.pct)}<p><b>${o.pct} %</b> · ${o.done} de ${o.total} lecciones</p></aside>` : ''}</div>
<div class="outline">${o.modules.map((m) => html`<section class="module"><h2>${m.title}</h2><ol>${m.lessons.map((l) => html`<li class="${l.done ? 'done' : ''}"><span class="check" aria-hidden="true">${l.done ? '✓' : ''}</span>${en ? html`<a href="/aula/${c.slug}/leccion/${l.id}">${l.title}</a>` : html`<span>${l.title}</span>`}<small>${l.kind} · ${l.minutes} min${l.done ? ' · completada' : ''}</small></li>`)}</ol></section>`)}</div>
${res.length ? html`<h2>Recursos del curso</h2><ul class="plain resources">${res.map((r) => html`<li><a href="${r.url}" ${/^https?:/.test(r.url) ? raw('rel="noopener" target="_blank"') : ''}><span class="tag">${r.kind}</span> ${r.title}</a></li>`)}</ul>` : ''}</section>`,
    jsonld: { '@context': 'https://schema.org', '@type': 'Course', name: c.title, description: c.summary, provider: { '@type': 'Organization', name: SITE_NAME, sameAs: siteUrl() } } });
}

export function leccion(ctx) {
  if (!STATIC && !ctx.user) return { redirect: `/ingresar?next=${encodeURIComponent(ctx.url.pathname)}` };
  const uid = ctx.user?.id ?? 0;
  const c = get('SELECT * FROM courses WHERE slug=?', ctx.params.slug); const l = c && get('SELECT l.*,m.course_id,m.title mtitle FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.id=? AND m.course_id=?', +ctx.params.id, c.id);
  if (!l) return notFound(ctx);
  if (!STATIC && !enrolled(ctx.user.id, c.id) && ctx.user.role === 'user') return { redirect: `/aula/${c.slug}` };
  const o = courseOutline(c.id, STATIC ? null : uid); const i = o.flat.findIndex((x) => x.id === l.id); const prev = o.flat[i - 1], nxt = o.flat[i + 1];
  const done = o.flat[i].done; const quiz = l.quiz ? JSON.parse(l.quiz) : null; const best = get('SELECT score FROM progress WHERE user_id=? AND lesson_id=?', uid, l.id);
  const res = all('SELECT * FROM resources WHERE course_id=? AND (lesson_id=? OR lesson_id IS NULL) ORDER BY lesson_id DESC', c.id, l.id);
  return layout(ctx, { title: `${l.title} · ${c.title}`, noindex: true, bodyClass: 'lesson', main: html`<div class="wrap lesson-layout">
<aside class="side" aria-label="Contenido del curso"><a href="/aula/${c.slug}" class="side-title">${c.title}</a>${STATIC ? '' : html`${bar(o.pct)}<small>${o.pct} % completado</small>`}${o.modules.map((m) => html`<h2>${m.title}</h2><ol>${m.lessons.map((x) => html`<li class="${x.done ? 'done' : ''}"><a href="/aula/${c.slug}/leccion/${x.id}" ${x.id === l.id ? raw('aria-current="page"') : ''}><span class="check" aria-hidden="true">${x.done ? '✓' : ''}</span>${x.title}</a></li>`)}</ol>`)}</aside>
<article class="lesson-main"><p class="kicker">${l.mtitle} · ${l.kind} · ${l.minutes} min</p><h1>${l.title}</h1><div class="prose">${md(l.body)}</div>
${STATIC ? (quiz ? html`<p class="note">Esta evaluación se responde en la versión con cuentas.</p>` : '') : quiz ? html`<form class="card form quiz" data-quiz="${l.id}"><h2>Evaluación</h2>${best?.score != null ? html`<p class="note ok">Mejor resultado: ${best.score} %</p>` : ''}${quiz.map((q, qi) => html`<fieldset><legend>${qi + 1}. ${q.q}</legend>${q.o.map((o, oi) => html`<label class="opt"><input type="radio" name="q${qi}" value="${oi}" required> ${o}</label>`)}</fieldset>`)}<button class="btn">Enviar respuestas</button><p class="form-msg" role="status"></p></form>` : html`<p><button class="btn" data-complete="${l.id}" ${done ? 'disabled' : ''}>${done ? '✓ Lección completada' : 'Marcar como completada'}</button></p><p class="form-msg" role="status" data-complete-msg></p>`}
${res.length ? html`<h2>Recursos</h2><ul class="plain resources">${res.map((r) => html`<li><a href="${r.url}" ${/^https?:/.test(r.url) ? raw('rel="noopener" target="_blank"') : ''}><span class="tag">${r.kind}</span> ${r.title}</a></li>`)}</ul>` : ''}
<nav class="pager">${prev ? html`<a href="/aula/${c.slug}/leccion/${prev.id}">← ${prev.title}</a>` : html`<span></span>`}${nxt ? html`<a href="/aula/${c.slug}/leccion/${nxt.id}">${nxt.title} →</a>` : html`<a href="/aula/${c.slug}">Volver al programa →</a>`}</nav></article></div>` });
}

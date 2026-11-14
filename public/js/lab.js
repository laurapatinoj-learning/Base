(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const L = (document.documentElement.lang || 'es').slice(0, 2); const lang = ['es', 'en', 'pt'].includes(L) ? L : 'es';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get: (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* opcional */ } } };

  // ---- Cuestionarios por pasos (ejercicio dato/patrón/interpretación y repaso final)
  $$('[data-qz]').forEach((q) => {
    const T = JSON.parse(q.dataset.labels); const items = $$('.qz-item', q), total = items.length; let i = 0, score = 0;
    const prog = $('[data-qz-progress]', q), next = $('[data-qz-next]', q), sum = $('.qz-sum', q);
    const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (m, k) => o[k]);
    const show = (n) => { i = n; items.forEach((it, k) => (it.hidden = k !== n)); prog.hidden = false; prog.textContent = fmt(T.progress, { i: n + 1, t: total }); next.hidden = true; sum.hidden = true; };
    const finish = () => { items.forEach((it) => (it.hidden = true)); prog.hidden = true; next.hidden = true; sum.hidden = false; $('.qz-score', sum).textContent = fmt(T.score, { n: score, t: total }); const r = score / total; $('.qz-msg', sum).textContent = r >= 0.8 ? T.hi : r >= 0.5 ? T.mid : T.lo; sum.classList.toggle('great', r >= 0.8); };
    items.forEach((it, k) => $$('.qz-opt', it).forEach((b) => b.addEventListener('click', () => {
      if (it.dataset.done) return; it.dataset.done = '1'; const ok = b.dataset.ok === '1'; if (ok) score++;
      $$('.qz-opt', it).forEach((o) => { o.disabled = true; if (o.dataset.ok === '1') o.classList.add('right'); }); if (!ok) b.classList.add('wrong');
      const fb = $('.qz-fb', it); $('b', fb).textContent = ok ? T.right : T.wrong; fb.classList.toggle('ok', ok); fb.hidden = false;
      next.textContent = k === total - 1 ? T.finish : T.next; next.hidden = false;
    })));
    next.addEventListener('click', () => (i < total - 1 ? show(i + 1) : finish()));
    $('[data-qz-retry]', q).addEventListener('click', () => { score = 0; items.forEach((it) => { delete it.dataset.done; $('.qz-fb', it).hidden = true; $$('.qz-opt', it).forEach((o) => { o.disabled = false; o.classList.remove('right', 'wrong'); }); }); show(0); });
    show(0);
  });

  // ---- Recorrido guiado de la tabla de Ishango
  const ex = $('[data-explorer]'), tour = $('[data-tour]');
  if (ex && tour) {
    const TXT = { es: ['Columna izquierda (G): 11, 13, 17, 19. Los cuatro números son primos y suman 60.', 'Columna derecha (D): 11, 21, 19, 9. Hay dos primos (11 y 19) y dos compuestos impares (21 y 9). También suma 60.', 'Columna central (M): 3, 6, 4, 8, 10, 5, 5, 7. Los primos son 3, 5, 5 y 7; los compuestos pares, 6, 4, 8 y 10. Suma 48.', 'Primos gemelos: en M aparecen (3, 5) y (5, 7); en G, (11, 13) y (17, 19). Son cuatro parejas.', 'En total: 48 + 60 + 60 = 168 marcas, en 16 grupos. 10 de los 16 números son primos.'],
      en: ['Left column (G): 11, 13, 17, 19. All four numbers are prime and add up to 60.', 'Right column (D): 11, 21, 19, 9. Two primes (11 and 19) and two odd composites (21 and 9). It also adds up to 60.', 'Central column (M): 3, 6, 4, 8, 10, 5, 5, 7. The primes are 3, 5, 5 and 7; the even composites, 6, 4, 8 and 10. It adds up to 48.', 'Twin primes: in M we find (3, 5) and (5, 7); in G, (11, 13) and (17, 19). That makes four pairs.', 'In total: 48 + 60 + 60 = 168 marks, in 16 groups. 10 of the 16 numbers are prime.'],
      pt: ['Coluna esquerda (G): 11, 13, 17, 19. Os quatro números são primos e somam 60.', 'Coluna direita (D): 11, 21, 19, 9. Há dois primos (11 e 19) e dois compostos ímpares (21 e 9). Também soma 60.', 'Coluna central (M): 3, 6, 4, 8, 10, 5, 5, 7. Os primos são 3, 5, 5 e 7; os compostos pares, 6, 4, 8 e 10. Soma 48.', 'Primos gêmeos: em M aparecem (3, 5) e (5, 7); em G, (11, 13) e (17, 19). São quatro pares.', 'No total: 48 + 60 + 60 = 168 marcas, em 16 grupos. 10 dos 16 números são primos.'] }[lang];
    const ROWS = [['G'], ['D'], ['M'], ['G', 'M'], ['G', 'M', 'D']]; const text = $('[data-tour-text]', tour), prev = $('[data-tour-prev]', tour), nxt = $('[data-tour-next]', tour); let s = 0;
    const END = { es: 'Terminar', en: 'Finish', pt: 'Concluir' }[lang], NEXT = nxt.textContent;
    const setToggle = (name, on) => { ex.classList.toggle('show-' + name, on); const b = $(`[data-toggle=${name}]`, ex); if (b) b.setAttribute('aria-pressed', on); };
    const render = () => { text.textContent = TXT[s]; $$('.ex-row', ex).forEach((r) => r.classList.toggle('tour-dim', !ROWS[s].includes(r.dataset.col))); setToggle('twins', s === 3); setToggle('sums', s === 4 || s === 0 || s === 1 || s === 2); prev.disabled = s === 0; nxt.textContent = s === TXT.length - 1 ? END : NEXT; };
    const close = () => { tour.hidden = true; $$('.ex-row', ex).forEach((r) => r.classList.remove('tour-dim')); setToggle('twins', false); setToggle('sums', false); };
    $('[data-tour-start]', ex).addEventListener('click', () => { s = 0; tour.hidden = false; render(); });
    prev.addEventListener('click', () => { if (s > 0) { s--; render(); } }); nxt.addEventListener('click', () => { if (s < TXT.length - 1) { s++; render(); } else close(); });
    $('[data-tour-close]', tour).addEventListener('click', close);
  }

  // ---- Índice lateral con resaltado de la sección visible
  const toc = $('[data-toc]');
  if (toc) {
    const links = $$('a', toc); const targets = links.map((a) => [document.getElementById(a.getAttribute('href').slice(1)), a]).filter(([el]) => el); let busy = false;
    const spy = () => { busy = false; let cur = targets[0]; for (const t of targets) { if (t[0].getBoundingClientRect().top <= innerHeight * 0.3) cur = t; } links.forEach((a) => a.removeAttribute('aria-current')); cur[1].setAttribute('aria-current', 'true'); };
    addEventListener('scroll', () => { if (!busy) { busy = true; requestAnimationFrame(spy); } }, { passive: true }); spy();
  }

  // ---- Preguntas: siguiente pregunta y marca de «vista»
  const items = $$('details.faq-item');
  if (items.length) {
    const seen = new Set(store.get('bp-faq-seen') || []); const mark = (d) => { d.classList.add('seen'); const a = $(`.faq-index a[href="#${d.id}"]`); a && a.classList.add('done'); };
    items.forEach((d) => { if (seen.has(d.id) && !d.open) mark(d); if (d.open) { seen.add(d.id); mark(d); } d.addEventListener('toggle', () => { if (d.open) { seen.add(d.id); mark(d); store.set('bp-faq-seen', [...seen]); } }); });
    store.set('bp-faq-seen', [...seen]);
    $$('[data-faq-next]').forEach((b) => b.addEventListener('click', () => { const d = document.getElementById('q' + b.dataset.faqNext); if (!d) return; d.open = true; setTimeout(() => d.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 80); }));
  }

  // ---- Ruta de aprendizaje: aparece el trazo y los pasos
  const route = $('[data-route]');
  if (route) { const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { route.classList.add('in'); io.disconnect(); } }), { threshold: 0.25 }) : null; io ? io.observe(route) : route.classList.add('in'); }
})();

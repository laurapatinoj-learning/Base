(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Barra de progreso de lectura
  const bar = document.createElement('div'); bar.className = 'read-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.prepend(bar);
  const hero = $('.hero-mark'), bone = $('.hero-bone'); let tick = false;
  const onScroll = () => { tick = false; const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
    if (!reduce && scrollY < 900) { if (hero) hero.style.transform = `translateY(${scrollY * 0.12}px)`; if (bone) bone.style.transform = `translateY(${scrollY * 0.06}px)`; } };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true }); onScroll();

  // El plano se dibuja cuando llega a la pantalla
  const draws = $$('[data-draw]');
  if (draws.length) { const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.3 }) : null; draws.forEach((d) => (io ? io.observe(d) : d.classList.add('in'))); }

  // Abrir el acordeón o el apartado plegable al que apunta el enlace (#q3, #empedocles, #explorador…)
  const openHash = () => { const id = decodeURIComponent(location.hash.slice(1)); if (!id) return; const el = document.getElementById(id); if (!el) return; const d = el.tagName === 'DETAILS' ? el : el.closest('details'); if (d) { d.open = true; setTimeout(() => el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 60); } };
  addEventListener('hashchange', openHash); openHash();
  $$('.faq-index a').forEach((a) => a.addEventListener('click', () => setTimeout(openHash, 0)));
})();

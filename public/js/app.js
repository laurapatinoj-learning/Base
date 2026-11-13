(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

  async function api(method, url, body) {
    try {
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' }, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
      const data = await r.json().catch(() => ({})); return { ok: r.ok, status: r.status, data };
    } catch { return { ok: false, status: 0, data: { error: 'Sin conexión. Intenta de nuevo.' } }; }
  }
  let toastT; function toast(msg, err) { const t = $('.toast'); if (!t) return; t.textContent = msg; t.classList.toggle('err', !!err); t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200); }
  const STATIC = document.documentElement.dataset.static === '1';
  const track = (type, label) => STATIC ? null : fetch('/api/track', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' }, body: JSON.stringify({ type, label }) }).catch(() => {});

  // Menú móvil
  const tg = $('.nav-toggle'); tg?.addEventListener('click', () => { const o = $('#nav').classList.toggle('open'); tg.setAttribute('aria-expanded', o); });
  $('[data-logout]')?.addEventListener('click', async () => { await api('POST', '/api/logout'); location.href = '/'; });

  // Formularios estáticos (Netlify Forms)
  $$('form[data-netlify-form]').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault(); const msg = $('.form-msg', f), btn = $('button:not([type=button])', f); msg.className = 'form-msg'; msg.textContent = 'Enviando…'; btn && (btn.disabled = true);
    try {
      const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(f)).toString() });
      if (!r.ok) throw new Error(); msg.classList.add('ok'); msg.textContent = f.dataset.ok || 'Listo, ¡gracias!'; f.reset();
    } catch { msg.classList.add('err'); msg.textContent = 'No se pudo enviar. Inténtalo de nuevo.'; }
    btn && (btn.disabled = false);
  }));

  // Formularios genéricos
  $$('form[data-api]').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault(); const msg = $('.form-msg', f), btn = $('button:not([type=button])', f); const body = Object.fromEntries(new FormData(f));
    msg.className = 'form-msg'; msg.textContent = 'Enviando…'; btn && (btn.disabled = true);
    const r = await api('POST', f.dataset.api, body); btn && (btn.disabled = false);
    if (!r.ok) { msg.classList.add('err'); msg.textContent = r.data.error || 'No se pudo completar la acción.'; return; }
    msg.classList.add('ok'); msg.textContent = r.data.message || f.dataset.ok || 'Listo.';
    const to = f.dataset.redirectFrom ? r.data[f.dataset.redirectFrom] : f.dataset.redirect; if (to) setTimeout(() => (location.href = to), 700); else f.reset();
  }));

  // Carrito
  const bump = (n) => $$('[data-cart-count]').forEach((b) => { b.textContent = n; b.classList.add('bump'); setTimeout(() => b.classList.remove('bump'), 300); });
  $$('[data-add-cart]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true; const r = await api('POST', '/api/cart', { product_id: +b.dataset.addCart, qty: 1 }); b.disabled = false;
    if (r.ok) { bump(r.data.count); toast('Añadido al carrito ✓'); if (b.textContent.includes('Matric')) setTimeout(() => (location.href = '/carrito'), 500); } else toast(r.data.error || 'No se pudo añadir.', true);
  }));
  $$('[data-remove]').forEach((b) => b.addEventListener('click', async () => { await api('DELETE', '/api/cart/' + b.dataset.remove); location.reload(); }));
  $$('[data-qty]').forEach((i) => i.addEventListener('change', async () => { await api('PATCH', '/api/cart/' + i.dataset.qty, { qty: +i.value }); location.reload(); }));

  // Aula
  $('[data-enroll]')?.addEventListener('click', async (e) => { const r = await api('POST', `/api/courses/${e.target.dataset.enroll}/enroll`); if (r.ok) location.href = r.data.redirect; else { const m = $('[data-enroll-msg]'); m.className = 'form-msg err'; m.textContent = r.data.error; } });
  $('[data-complete]')?.addEventListener('click', async (e) => { const r = await api('POST', `/api/lessons/${e.target.dataset.complete}/complete`); if (r.ok) { toast(`¡Lección completada! Avance: ${r.data.pct} %`); setTimeout(() => location.reload(), 900); } else toast(r.data.error, true); });
  $('form[data-quiz]')?.addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const n = $$('fieldset', f).length; const answers = [...Array(n).keys()].map((i) => { const c = f.querySelector(`input[name=q${i}]:checked`); return c ? +c.value : -1; });
    const r = await api('POST', `/api/lessons/${f.dataset.quiz}/quiz`, { answers }); const msg = $('.form-msg', f); $$('.opt', f).forEach((o) => o.classList.remove('wrong'));
    if (!r.ok) { msg.className = 'form-msg err'; msg.textContent = r.data.error; return; }
    (r.data.wrong || []).forEach((i) => $$('fieldset', f)[i].querySelectorAll('.opt').forEach((o) => o.classList.add('wrong')));
    msg.className = 'form-msg ' + (r.data.passed ? 'ok' : 'err'); msg.textContent = r.data.passed ? `¡Aprobado con ${r.data.score} %! Avance del curso: ${r.data.pct} %.` : `Obtuviste ${r.data.score} %. Necesitas 70 %. Revisa las respuestas marcadas e inténtalo de nuevo.`;
    if (r.data.passed) setTimeout(() => location.reload(), 1600);
  });
  document.addEventListener('click', (e) => { const t = e.target.closest('[data-track]'); if (t) track(t.dataset.track, t.dataset.label || ''); });

  // Revelado al hacer scroll + contadores
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12 }) : null;
  $$('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
  const co = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((en) => { if (!en.isIntersecting) return; co.unobserve(en.target); const el = en.target, end = +el.dataset.count, suf = el.dataset.suffix || ''; if (reduce) return; const t0 = performance.now(); (function step(t) { const p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(t0); })) : null;
  $$('[data-count]').forEach((el) => co?.observe(el));

  // Explorador de la tabla de Ishango
  const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
  const factor = (n) => { const f = []; for (let p = 2; n > 1; p++) while (n % p === 0) { f.push(p); n /= p; } return f.join(' × '); };
  const ex = $('[data-explorer]');
  if (ex) {
    const cols = {}; $$('.grp', ex).forEach((g) => (cols[g.dataset.col] ||= []).push(+g.dataset.n));
    const partners = (col, n) => [n - 2, n + 2].filter((v) => cols[col].includes(v) && isPrime(v) && isPrime(n));
    let pairs = 0, primes = 0;
    for (const [c, arr] of Object.entries(cols)) { const s = [...new Set(arr)].filter(isPrime); s.forEach((v) => { if (s.includes(v + 2)) pairs++; }); }
    $$('.grp', ex).forEach((g) => { const n = +g.dataset.n, c = g.dataset.col; if (isPrime(n)) { g.classList.add('is-prime'); primes++; } if (isPrime(n) && partners(c, n).length) g.classList.add('is-twin'); });
    $('[data-stat=primes]', ex).textContent = `${primes} de 16`; $('[data-stat=twins]', ex).textContent = pairs;
    const out = $('[data-readout]', ex);
    const say = (g) => { const n = +g.dataset.n, c = g.dataset.col, p = partners(c, n); $$('.grp.sel', ex).forEach((x) => x.classList.remove('sel')); g.classList.add('sel');
      out.textContent = `${n} marcas (columna ${c}). ` + (isPrime(n) ? `${n} es primo.` : `${n} no es primo (${n === 1 ? '1' : factor(n)}).`) + (p.length ? ` Forma pareja de primos gemelos con ${p.join(' y ')}: (${p.map((v) => Math.min(v, n) + ', ' + Math.max(v, n)).join(') y (')}).` : '') + ` La columna ${c} suma ${cols[c].reduce((a, b) => a + b, 0)}.`; };
    $$('.grp', ex).forEach((g) => { g.addEventListener('click', () => { say(g); track('explorer', 'grupo ' + g.dataset.n); }); g.addEventListener('mouseenter', () => say(g)); g.addEventListener('focus', () => say(g)); });
    $$('[data-toggle]', ex).forEach((b) => b.addEventListener('click', () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); ex.classList.toggle('show-' + b.dataset.toggle, on); track('explorer', b.dataset.toggle); }));
  }

  // Criba de Eratóstenes animada
  const grid = $('[data-sieve-grid]');
  if (grid) {
    const msg = $('[data-sieve-msg]'); let run = 0; const cells = [];
    const build = () => { grid.innerHTML = ''; cells.length = 0; for (let i = 1; i <= 100; i++) { const s = document.createElement('span'); s.textContent = i; grid.appendChild(s); cells[i] = s; } };
    const play = async () => {
      const id = ++run; build(); const ok = () => id === run; msg.textContent = 'El 1 no es primo: se descarta.'; cells[1].classList.add('out'); await sleep(500);
      for (const p of [2, 3, 5, 7]) {
        if (!ok()) return; cells[p].classList.add('cur'); msg.textContent = `Múltiplos de ${p}: se tachan.`; await sleep(450);
        for (let m = p * 2; m <= 100; m += p) { cells[m].classList.add('mult'); }
        await sleep(450); if (!ok()) return;
        for (let m = p * 2; m <= 100; m += p) { cells[m].classList.remove('mult'); cells[m].classList.add('out'); }
        cells[p].classList.remove('cur'); await sleep(300);
      }
      if (!ok()) return; const pr = []; for (let i = 2; i <= 100; i++) if (!cells[i].classList.contains('out')) { cells[i].classList.add('prime'); pr.push(i); }
      msg.textContent = `Quedan ${pr.length} primos menores que 100. Ahora, los primos gemelos (p, p+2)…`; await sleep(900); if (!ok()) return;
      const tw = pr.filter((p) => pr.includes(p + 2)); tw.forEach((p) => { cells[p].classList.add('twin'); cells[p + 2].classList.add('twin'); });
      msg.textContent = `${tw.length} parejas de primos gemelos: ${tw.map((p) => `(${p}, ${p + 2})`).join(' ')}.`; track('sieve', 'completa');
    };
    build(); $('[data-sieve=play]').addEventListener('click', play); $('[data-sieve=reset]').addEventListener('click', () => { run++; build(); msg.textContent = 'Pulsa «Reproducir» para ver la criba.'; });
  }
})();

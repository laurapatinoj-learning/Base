(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const L = (document.documentElement.lang || 'es').slice(0, 2); const lang = ['es', 'en', 'pt'].includes(L) ? L : 'es';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; const sleep = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
  const typeOf = (n) => (n < 2 ? '1' : isPrime(n) ? 'p' : n % 2 ? 'o' : 'e');
  const factor = (n) => { const f = []; for (let p = 2; n > 1; p++) while (n % p === 0) { f.push(p); n /= p; } return f.join(' × '); };
  const T = {
    es: { p: (n) => `${n} es primo`, o: (n) => `${n} es compuesto impar (${factor(n)})`, e: (n) => `${n} es compuesto par (${factor(n)})`, one: () => '1 no es primo ni compuesto',
      exr: (n, c, ty, tw, s) => `${n} marcas (columna ${c}). ${ty}.${tw ? ` Forma pareja de primos gemelos con ${tw}.` : ''} La columna ${c} suma ${s}.`,
      s1: 'El 1 no es primo: se descarta.', sm: (p) => `Múltiplos de ${p}: se tachan.`, sp: (n) => `Quedan ${n} primos menores que 100. Ahora, los primos gemelos (p, p+2)…`, st: (n, l) => `${n} parejas de primos gemelos: ${l}. Cada número toma su color.`,
      tl: (a, b, c) => `${a} — ${b}. ${c}`, nz: 'Añade la primera marca.', nr: (n, ty) => `Marcas en el grupo: ${n} — ${ty}.`,
      er: (y, ty, a, b, pair) => `Número ${y}: ${ty}. Sección A: ${a} · Sección B: ${b}.${pair ? ` Su pareja simétrica: ${y} + ${30 - y} = 30.` : ''}`, ehint: 'Pasa el cursor o enfoca un punto para ver sus coordenadas.' },
    en: { p: (n) => `${n} is prime`, o: (n) => `${n} is an odd composite (${factor(n)})`, e: (n) => `${n} is an even composite (${factor(n)})`, one: () => '1 is neither prime nor composite',
      exr: (n, c, ty, tw, s) => `${n} marks (column ${c}). ${ty}.${tw ? ` Forms a twin-prime pair with ${tw}.` : ''} Column ${c} adds up to ${s}.`,
      s1: '1 is not prime: it is discarded.', sm: (p) => `Multiples of ${p}: crossed out.`, sp: (n) => `${n} primes below 100 remain. Now, the twin primes (p, p+2)…`, st: (n, l) => `${n} twin-prime pairs: ${l}. Every number takes its colour.`,
      tl: (a, b, c) => `${a} — ${b}. ${c}`, nz: 'Add the first mark.', nr: (n, ty) => `Marks in the group: ${n} — ${ty}.`,
      er: (y, ty, a, b, pair) => `Number ${y}: ${ty}. Section A: ${a} · Section B: ${b}.${pair ? ` Its symmetric partner: ${y} + ${30 - y} = 30.` : ''}`, ehint: 'Hover or focus a point to see its coordinates.' },
    pt: { p: (n) => `${n} é primo`, o: (n) => `${n} é composto ímpar (${factor(n)})`, e: (n) => `${n} é composto par (${factor(n)})`, one: () => '1 não é primo nem composto',
      exr: (n, c, ty, tw, s) => `${n} marcas (coluna ${c}). ${ty}.${tw ? ` Forma par de primos gêmeos com ${tw}.` : ''} A coluna ${c} soma ${s}.`,
      s1: 'O 1 não é primo: é descartado.', sm: (p) => `Múltiplos de ${p}: são riscados.`, sp: (n) => `Restam ${n} primos menores que 100. Agora, os primos gêmeos (p, p+2)…`, st: (n, l) => `${n} pares de primos gêmeos: ${l}. Cada número assume sua cor.`,
      tl: (a, b, c) => `${a} — ${b}. ${c}`, nz: 'Adicione a primeira marca.', nr: (n, ty) => `Marcas no grupo: ${n} — ${ty}.`,
      er: (y, ty, a, b, pair) => `Número ${y}: ${ty}. Seção A: ${a} · Seção B: ${b}.${pair ? ` Seu par simétrico: ${y} + ${30 - y} = 30.` : ''}`, ehint: 'Passe o cursor ou foque um ponto para ver suas coordenadas.' },
  }[lang];
  const typeText = (n) => (T[typeOf(n)] || T.one)(n);

  // ---- Explorador de la tabla de Ishango
  const ex = $('[data-explorer]');
  if (ex) {
    const cols = {}; $$('.grp', ex).forEach((g) => (cols[g.dataset.col] ||= []).push(+g.dataset.n));
    const partners = (c, n) => [n - 2, n + 2].filter((v) => cols[c].includes(v) && isPrime(v) && isPrime(n));
    let pairs = 0, primes = 0;
    for (const arr of Object.values(cols)) { const sp = [...new Set(arr)].filter(isPrime); sp.forEach((v) => { if (sp.includes(v + 2)) pairs++; }); }
    $$('.grp', ex).forEach((g) => { const n = +g.dataset.n; if (isPrime(n)) primes++; if (isPrime(n) && partners(g.dataset.col, n).length) g.classList.add('is-twin'); });
    $('[data-stat=primes]', ex).textContent = `${primes} / 16`; $('[data-stat=twins]', ex).textContent = pairs;
    const out = $('[data-readout]', ex);
    const say = (g) => { const n = +g.dataset.n, c = g.dataset.col, p = partners(c, n); $$('.grp.sel', ex).forEach((x) => x.classList.remove('sel')); g.classList.add('sel');
      out.textContent = T.exr(n, c, typeText(n), p.length ? p.map((v) => `(${Math.min(v, n)}, ${Math.max(v, n)})`).join(' / ') : '', cols[c].reduce((a, b) => a + b, 0)); };
    $$('.grp', ex).forEach((g) => { g.addEventListener('click', () => say(g)); g.addEventListener('mouseenter', () => say(g)); g.addEventListener('focus', () => say(g)); });
    $$('[data-toggle]', ex).forEach((b) => b.addEventListener('click', () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); ex.classList.toggle('show-' + b.dataset.toggle, on); }));
  }

  // ---- Criba de Eratóstenes (colores al terminar)
  const grid = $('[data-sieve-grid]');
  if (grid) {
    const msg = $('[data-sieve-msg]'); const idle = msg.textContent; let run = 0; const cells = [];
    const build = () => { grid.innerHTML = ''; cells.length = 0; for (let i = 1; i <= 100; i++) { const s = document.createElement('span'); s.textContent = i; grid.appendChild(s); cells[i] = s; } };
    const play = async () => {
      const id = ++run; build(); const ok = () => id === run; msg.textContent = T.s1; cells[1].classList.add('out'); await sleep(500);
      for (const p of [2, 3, 5, 7]) {
        if (!ok()) return; cells[p].classList.add('cur'); msg.textContent = T.sm(p); await sleep(450);
        for (let m = p * 2; m <= 100; m += p) cells[m].classList.add('mult');
        await sleep(450); if (!ok()) return;
        for (let m = p * 2; m <= 100; m += p) { cells[m].classList.remove('mult'); cells[m].classList.add('out'); }
        cells[p].classList.remove('cur'); await sleep(300);
      }
      if (!ok()) return; const pr = []; for (let i = 2; i <= 100; i++) if (!cells[i].classList.contains('out')) { cells[i].classList.add('n-p', 'final'); pr.push(i); }
      msg.textContent = T.sp(pr.length); await sleep(900); if (!ok()) return;
      for (let i = 1; i <= 100; i++) { const c = cells[i]; if (c.classList.contains('out')) { c.classList.remove('out'); c.classList.add('final', 'n-' + typeOf(i)); } }
      const tw = pr.filter((p) => pr.includes(p + 2)); tw.forEach((p) => { cells[p].classList.add('twin'); cells[p + 2].classList.add('twin'); });
      msg.textContent = T.st(tw.length, tw.map((p) => `(${p}, ${p + 2})`).join(' '));
    };
    build(); $('[data-sieve=play]').addEventListener('click', play); $('[data-sieve=reset]').addEventListener('click', () => { run++; build(); msg.textContent = idle; });
  }

  // ---- Línea de tiempo (pregunta 1)
  const tl = $('[data-timeline]');
  if (tl) {
    const data = JSON.parse(tl.dataset.tl); const det = $('[data-tl-detail]');
    const sel = (i) => { $$('.tl-m', tl).forEach((m) => m.classList.toggle('on', +m.dataset.i === i)); const [a, b, c] = data[i - 1]; det.textContent = T.tl(a, b, c); };
    $$('.tl-m', tl).forEach((m) => { const i = +m.dataset.i; m.addEventListener('click', () => sel(i)); m.addEventListener('mouseenter', () => sel(i)); m.addEventListener('focus', () => sel(i)); });
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { tl.classList.add('in'); io.disconnect(); } }), { threshold: .4 }) : null; io ? io.observe(tl) : tl.classList.add('in');
  }

  // ---- Mapa de África con zoom a la región del Congo (pregunta 2)
  const map = $('[data-map]');
  if (map) {
    const svg = $('.map-svg', map); const full = svg.dataset.full.split(' ').map(Number), zoom = svg.dataset.zoom.split(' ').map(Number); let cur = full.slice(), raf = 0, zoomed = false;
    const go = (to) => { cancelAnimationFrame(raf); const from = cur.slice(), t0 = performance.now(), dur = reduce ? 1 : 1100; const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); cur = from.map((v, i) => v + (to[i] - v) * e); svg.setAttribute('viewBox', cur.join(' ')); if (p < 1) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); };
    const set = (z) => { zoomed = z; map.classList.toggle('zoomed', z); go(z ? zoom : full); };
    $('.map-box', map).addEventListener('click', () => set(!zoomed));
    $('[data-map-zoom=in]', map).addEventListener('click', () => set(true)); $('[data-map-zoom=out]', map).addEventListener('click', () => set(false));
  }

  // ---- Tallar marcas (pregunta 4)
  const nb = $('[data-notch]');
  if (nb) {
    const marks = $('[data-marks]', nb), out = $('[data-notch-readout]', nb); let n = 0;
    const draw = () => { const c = marks.children.length; if (c < n) for (let i = c; i < n; i++) marks.appendChild(document.createElement('i')); else while (marks.children.length > n) marks.lastChild.remove(); out.textContent = n ? T.nr(n, typeText(n)) : T.nz; };
    $('[data-notch-add]', nb).addEventListener('click', () => { if (n < 30) { n++; draw(); } }); $('[data-notch-sub]', nb).addEventListener('click', () => { if (n > 0) { n--; draw(); } }); $('[data-notch-reset]', nb).addEventListener('click', () => { n = 0; draw(); });
  }

  // ---- Cuadrícula de números 1-40 (pregunta 5)
  const ng = $('[data-numgrid]');
  if (ng) { const out = $('[data-grid-readout]', ng); $$('button', ng).forEach((b) => b.addEventListener('click', () => { $$('button.sel', ng).forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); out.textContent = typeText(+b.dataset.n) + '.'; })); }

  // ---- Distribución de primos en 60 n(i) / 60 n(e)
  const emp = $('[data-emp]');
  if (emp) {
    const out = $('[data-emp-readout]', emp); const SET = [9, 11, 13, 17, 19, 21];
    const sec = (s, y) => (s === 'A' ? `(${30 - y}, ${y})` : `(${30 + y}, ${y})`);
    const say = (p) => { $$('.pt.sel', emp).forEach((x) => x.classList.remove('sel')); p.classList.add('sel'); const y = +p.dataset.y; out.textContent = T.er(y, typeText(y), sec('A', y), sec('B', y), SET.includes(30 - y)); };
    $$('.pt', emp).forEach((p) => { p.addEventListener('mouseenter', () => say(p)); p.addEventListener('focus', () => say(p)); p.addEventListener('click', () => say(p)); });
    $$('[data-emp-toggle]', emp).forEach((b) => b.addEventListener('click', () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); emp.classList.toggle('show-' + b.dataset.empToggle, on); }));
  }
})();

"use strict";
/**
 * Microjuegos de KMS Movies (estilo "Get it together").
 * Cada uno dura unos segundos, usa un verbo en mayúsculas y se acelera con el nivel.
 * Todos los jugadores reciben la misma semilla, así que ven el mismo reto.
 *
 * KMG.defs[id] = { verb, boss?, survive?, mount(ctx) }
 * ctx: box, level, rnd(), rem(), beep(freq), raf(fn(dt, elapsed)), timeout(fn, ms), win(), fail(), prog(n)
 */
(function () {
  const css = `
  .mgbox{position:relative;width:100%;max-width:440px;margin-inline:auto;aspect-ratio:1/1;max-height:54vh;border-radius:28px;overflow:hidden;background:var(--mgbg,#1b1346);border:5px solid #14102b;box-shadow:0 10px 0 rgba(0,0,0,.4);touch-action:none;user-select:none;-webkit-user-select:none}
  .mgbox.wide{aspect-ratio:auto;height:46vh;max-width:100%}
  .mg-count{position:absolute;top:10px;left:0;right:0;text-align:center;font-family:var(--font-display);font-size:1.8rem;z-index:3;pointer-events:none;text-shadow:0 3px 0 rgba(0,0,0,.4)}
  .mgb{position:absolute;left:50%;top:52%;width:min(62%,230px);aspect-ratio:1;transform:translate(-50%,-50%);border:0;border-radius:50%;font-family:var(--font-display);font-size:2.2rem;color:#fff;box-shadow:0 10px 0 rgba(0,0,0,.4),inset 0 -10px 0 rgba(0,0,0,.18);touch-action:none}
  .mgb.hit{animation:mghit .18s ease-out}@keyframes mghit{0%{transform:translate(-50%,-50%) scale(.86)}60%{transform:translate(-50%,-50%) scale(1.06)}}
  .mgb:active{transform:translate(-50%,-50%) scale(.92)}
  .kernel{position:absolute;width:58px;height:58px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fffbe0,#ffd23f 60%,#f59e0b);box-shadow:0 4px 0 rgba(0,0,0,.35),0 0 0 4px #fff3;touch-action:none}
  .kernel::after{content:"";position:absolute;inset:-8px}
  .mgflash{position:absolute;inset:0;z-index:9;display:grid;place-items:center;font-family:var(--font-display);font-size:min(30vw,8rem);pointer-events:none;animation:mgflash .9s ease-out both}
  .mgflash.ok{background:rgba(46,211,106,.55);color:#fff}.mgflash.no{background:rgba(255,51,85,.55);color:#fff}
  @keyframes mgflash{0%{opacity:0;transform:scale(.4)}25%{opacity:1;transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}
  .mgarrow{position:absolute;inset:0;display:grid;place-items:center;font-size:min(48vw,13rem);font-family:var(--font-display);animation:mgbob .6s ease-in-out infinite alternate}
  @keyframes mgbob{to{transform:scale(1.12)}}
  .mgbar{position:absolute;left:8%;right:8%;top:42%;height:58px;border-radius:99px;background:#0d0a24;border:4px solid #fff}
  .mgzone{position:absolute;top:0;bottom:0;border-radius:99px;background:var(--a3)}
  .mgmark{position:absolute;top:-14px;bottom:-14px;width:12px;margin-left:-6px;border-radius:6px;background:#fff;box-shadow:0 0 12px #fff}
  .mgyes{position:absolute;left:50%;bottom:7%;transform:translateX(-50%);padding:12px 34px;border:0;border-radius:18px;background:var(--pink);color:#fff;font-family:var(--font-display);font-size:1.6rem;box-shadow:0 6px 0 #a0155a}
  .mglane{position:absolute;top:0;bottom:0;width:33.333%;border-left:3px dashed #fff3}
  .mgme{position:absolute;bottom:4%;width:52px;height:52px;margin-left:-26px;border-radius:14px;background:#ffc21a;border:4px solid #14102b;transition:left .1s}
  .mgobs{position:absolute;width:52px;height:52px;margin-left:-26px;border-radius:50%;background:#ff3355;border:4px solid #14102b}
  .mggrid{position:absolute;inset:6%;display:grid;gap:8px}
  .mgcell{border:0;border-radius:16px;box-shadow:0 5px 0 rgba(0,0,0,.35)}
  .mghalf{position:absolute;top:0;bottom:0;width:50%;border:0;font-family:var(--font-display);font-size:3rem;color:#fff;touch-action:none}
  .mghalf.exp{filter:brightness(1.25);box-shadow:inset 0 0 0 8px #fff}
  .mgpads{position:absolute;inset:8%;display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .mgpad{border:0;border-radius:22px;opacity:.45;box-shadow:0 6px 0 rgba(0,0,0,.35);transition:opacity .1s,transform .1s}.mgpad.on{opacity:1;transform:scale(1.06);filter:brightness(1.3)}
  .mgsay{position:absolute;top:12px;left:0;right:0;text-align:center;font-family:var(--font-display);font-size:1.6rem;z-index:2;text-shadow:0 3px 0 rgba(0,0,0,.4)}
  .mgchoices{position:absolute;left:6%;right:6%;bottom:6%;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .mgchoices button{padding:16px 0;border:0;border-radius:16px;font-family:var(--font-display);font-size:2rem;background:#fff;color:#14102b;box-shadow:0 6px 0 rgba(0,0,0,.35)}
  .mgbig{position:absolute;inset:0 0 28% 0;display:grid;place-items:center;font-family:var(--font-display);font-size:min(16vw,4.4rem);text-align:center;padding:0 8px}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const el = (c, s, h) => { const d = document.createElement("div"); if (c) d.className = c; if (s) d.style.cssText = s; if (h != null) d.innerHTML = h; return d; };
  const btn = (c, s, h) => { const d = document.createElement("button"); if (c) d.className = c; if (s) d.style.cssText = s; if (h != null) d.innerHTML = h; return d; };
  const COL = ["#ff3355", "#2f7bff", "#ffc21a", "#2ed36a"];
  const rngOf = seed => { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
  const shuffle = (a, r) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  const D = {};

  D.tap = { verb: "¡TOCA!", mount(c) {
    const need = Math.min(16, 6 + c.level * 2); let n = 0;
    const cnt = el("mg-count", "", `<b>0</b>/${need}`), b = btn("mgb", "background:#ff3b8d", "TOCA");
    c.box.append(cnt, b);
    b.onpointerdown = e => { e.preventDefault(); n++; cnt.firstChild.textContent = n; b.classList.remove("hit"); void b.offsetWidth; b.classList.add("hit"); c.beep(300 + n * 40); navigator.vibrate?.(8); if (n >= need) c.win(); };
  } };

  D.catch = { verb: "¡ATRAPA!", mount(c) {
    const need = 3; let hit = 0, acc = 1e9; const items = [];
    const cnt = el("mg-count", "", `<b>0</b>/${need}`); c.box.append(cnt);
    c.raf(dt => {
      const W = c.box.clientWidth, H = c.box.clientHeight, speed = (H + 80) / Math.max(750, 1500 - c.level * 90);
      acc += dt; if (acc > Math.max(420, 760 - c.level * 40)) { acc = 0; const k = el("kernel", `left:${c.rnd() * (W - 70) + 6}px;top:-64px`); k.onpointerdown = e => { e.preventDefault(); k.remove(); items.splice(items.indexOf(k), 1); hit++; cnt.firstChild.textContent = hit; c.beep(500 + hit * 150); navigator.vibrate?.(10); if (hit >= need) c.win(); }; c.box.append(k); items.push(k); }
      items.forEach(k => { const y = parseFloat(k.style.top) + speed * dt; k.style.top = y + "px"; if (y > H) { k.remove(); items.splice(items.indexOf(k), 1); } });
    });
  } };

  D.swipe = { verb: "¡DESLIZA!", mount(c) {
    const d = Math.floor(c.rnd() * 4), arrows = ["↑", "→", "↓", "←"];
    c.box.append(el("mgarrow", "", arrows[d])); let x0 = 0, y0 = 0, down = false, fin = false;
    c.box.onpointerdown = e => { down = true; x0 = e.clientX; y0 = e.clientY; c.box.setPointerCapture?.(e.pointerId); };
    c.box.onpointermove = e => { if (!down || fin) return; const dx = e.clientX - x0, dy = e.clientY - y0; if (Math.hypot(dx, dy) < 60) return; fin = true; const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0); dir === d ? c.win() : c.fail(); };
  } };

  D.timing = { verb: "¡PARA!", mount(c) {
    const w = Math.max(0.12, 0.26 - c.level * 0.012), z = 0.2 + c.rnd() * 0.6, sp = 0.0042 + c.level * 0.0004; let p = 0, fin = false;
    const bar = el("mgbar", "", ""), zone = el("mgzone", `left:${(z - w / 2) * 100}%;width:${w * 100}%`), mark = el("mgmark", "left:50%");
    bar.append(zone, mark); const go = btn("mgyes", "", "¡YA!"); c.box.append(bar, go);
    c.raf((dt, t) => { p = 0.5 + 0.5 * Math.sin(t * sp * 2.2); mark.style.left = p * 100 + "%"; });
    const hit = e => { e.preventDefault(); if (fin) return; fin = true; Math.abs(p - z) < w / 2 ? c.win() : c.fail(); };
    go.onpointerdown = hit; c.box.onpointerdown = hit;
  } };

  D.dodge = { verb: "¡ESQUIVA!", survive: true, mount(c) {
    let lane = 1, acc = 0; const obs = [];
    for (let i = 1; i < 3; i++) c.box.append(el("mglane", `left:${i * 33.333}%`));
    const me = el("mgme"); c.box.append(me);
    const X = l => (l + 0.5) * c.box.clientWidth / 3;
    const move = e => { e.preventDefault(); const r = c.box.getBoundingClientRect(); lane = Math.max(0, Math.min(2, lane + (e.clientX - r.left < r.width / 2 ? -1 : 1))); c.beep(420); };
    c.box.onpointerdown = move;
    c.raf(dt => {
      const H = c.box.clientHeight, speed = (H + 60) / Math.max(800, 1500 - c.level * 80);
      me.style.left = X(lane) + "px";
      acc += dt; if (acc > Math.max(430, 800 - c.level * 40)) { acc = 0; const l = Math.floor(c.rnd() * 3), o = el("mgobs", `left:${X(l)}px;top:-56px`); o.dataset.l = l; c.box.append(o); obs.push(o); }
      obs.forEach(o => { const y = parseFloat(o.style.top) + speed * dt; o.style.top = y + "px"; if (+o.dataset.l === lane && y > H - 0.04 * H - 100 && y < H - 0.04 * H - 4) c.fail(); if (y > H) { o.remove(); obs.splice(obs.indexOf(o), 1); } });
    });
  } };

  D.odd = { verb: "¡ENCUENTRA!", mount(c) {
    const n = c.level >= 3 ? 4 : 3, h = Math.floor(c.rnd() * 360), diff = Math.max(9, 34 - c.level * 3), odd = Math.floor(c.rnd() * n * n);
    const g = el("mggrid", `grid-template-columns:repeat(${n},1fr)`); c.box.append(g);
    for (let i = 0; i < n * n; i++) { const b = btn("mgcell", `background:hsl(${i === odd ? h + diff : h} 80% 55%)`); b.onpointerdown = e => { e.preventDefault(); i === odd ? c.win() : c.fail(); }; g.append(b); }
  } };

  D.alt = { verb: "¡ALTERNA!", mount(c) {
    const need = Math.min(20, 8 + c.level * 2); let n = 0, exp = 0;
    const cnt = el("mg-count", "", `<b>0</b>/${need}`), L = btn("mghalf exp", "left:0;background:#2f7bff", "◀"), R = btn("mghalf", "right:0;background:#ff3355", "▶");
    c.box.append(L, R, cnt);
    const tap = side => e => { e.preventDefault(); if (side !== exp) return; n++; exp = 1 - exp; cnt.firstChild.textContent = n; L.classList.toggle("exp", exp === 0); R.classList.toggle("exp", exp === 1); c.beep(330 + (n % 2) * 220); navigator.vibrate?.(6); if (n >= need) c.win(); };
    L.onpointerdown = tap(0); R.onpointerdown = tap(1);
  } };

  D.memory = { verb: "¡MEMORIZA!", mount(c) {
    const len = c.level >= 4 ? 4 : 3, seq = Array.from({ length: len }, () => Math.floor(c.rnd() * 4));
    const say = el("mgsay", "", "Mira…"), pads = el("mgpads"); c.box.append(say, pads);
    const P = COL.map((col, i) => { const b = btn("mgpad", `background:${col}`); pads.append(b); return b; });
    let input = false, pos = 0;
    const flash = (i, ms) => { P[i].classList.add("on"); c.beep(330 + i * 110); setTimeout(() => P[i].classList.remove("on"), ms); };
    seq.forEach((v, k) => c.timeout(() => flash(v, 380), 500 + k * 620));
    c.timeout(() => { input = true; say.textContent = "¡Repite!"; }, 500 + len * 620);
    P.forEach((b, i) => b.onpointerdown = e => { e.preventDefault(); if (!input) return; flash(i, 160); if (i !== seq[pos]) return c.fail(); pos++; if (pos >= len) c.win(); });
  } };

  D.count = { verb: "¡CUENTA!", mount(c) {
    const k = 2 + Math.floor(c.rnd() * 4) + (c.level >= 4 ? 1 : 0), say = el("mgsay", "", "¿Cuántos hay?"); c.box.append(say);
    const dots = []; for (let i = 0; i < k; i++) { let x, y, tries = 0; do { x = 10 + c.rnd() * 74; y = 18 + c.rnd() * 44; tries++; } while (tries < 30 && dots.some(d => Math.hypot(d.x - x, d.y - y) < 17)); dots.push({ x, y }); }
    const wrap = el("", "position:absolute;inset:0"); dots.forEach(d => wrap.append(el("kernel", `left:${d.x}%;top:${d.y}%;width:48px;height:48px`))); c.box.append(wrap);
    c.timeout(() => { wrap.remove(); say.textContent = "¿Cuántos eran?"; c.box.append(el("mgbig", "", "?")); }, Math.max(800, 1500 - c.level * 60));
    const opts = [...new Set([k, k + 1, k - 1, k + 2].filter(v => v > 0))].slice(0, 3); if (!opts.includes(k)) opts[0] = k;
    const ch = el("mgchoices"); shuffle(opts, c.rnd).forEach(v => { const b = btn("", "", String(v)); b.onpointerdown = e => { e.preventDefault(); v === k ? c.win() : c.fail(); }; ch.append(b); }); c.box.append(ch);
  } };

  D.sum = { verb: "¡SUMA!", mount(c) {
    const top = 6 + Math.min(c.level, 6), a = 2 + Math.floor(c.rnd() * top), b = 2 + Math.floor(c.rnd() * top), ans = a + b;
    c.box.append(el("mgbig", "", `${a} + ${b}`));
    const opts = shuffle([ans, ans + 1 + Math.floor(c.rnd() * 2), ans - 1 - Math.floor(c.rnd() * 2)], c.rnd), ch = el("mgchoices");
    opts.forEach(v => { const x = btn("", "", String(v)); x.onpointerdown = e => { e.preventDefault(); v === ans ? c.win() : c.fail(); }; ch.append(x); }); c.box.append(ch);
  } };

  /* ---- jefes: todo el equipo suma sobre una misma barra ---- */
  D.teamtap = { verb: "¡TODOS A TOCAR!", boss: true, mount(c) {
    let n = 0; const cnt = el("mg-count", "", `<b>0</b> toques tuyos`), b = btn("mgb", "background:#ffc21a;color:#14102b", "¡TOCA!");
    c.box.append(cnt, b);
    b.onpointerdown = e => { e.preventDefault(); n++; cnt.firstChild.textContent = n; b.classList.remove("hit"); void b.offsetWidth; b.classList.add("hit"); c.beep(260 + (n % 8) * 40); navigator.vibrate?.(6); c.prog(n); };
  } };
  D.teamalt = { verb: "¡TODOS A ALTERNAR!", boss: true, mount(c) {
    let n = 0, exp = 0; const cnt = el("mg-count", "", `<b>0</b> pasos tuyos`), L = btn("mghalf exp", "left:0;background:#2f7bff", "◀"), R = btn("mghalf", "right:0;background:#ff3355", "▶");
    c.box.append(L, R, cnt);
    const tap = side => e => { e.preventDefault(); if (side !== exp) return; n++; exp = 1 - exp; cnt.firstChild.textContent = n; L.classList.toggle("exp", exp === 0); R.classList.toggle("exp", exp === 1); c.beep(330 + (n % 2) * 220); navigator.vibrate?.(6); c.prog(n); };
    L.onpointerdown = tap(0); R.onpointerdown = tap(1);
  } };

  /* ---- ejecución ---- */
  function run(host, mg, hooks) {
    const def = D[mg.id]; if (!def) return null;
    host.innerHTML = ""; const box = el("mgbox"); box.style.setProperty("--mgbg", ["#3b1a7a", "#0f4c81", "#7a1a4a", "#14573a", "#6b3d0a"][mg.seed % 5]); host.append(box);
    const rnd = rngOf(mg.seed); let done = false, raf = 0, last = performance.now(); const t0 = last, rafs = [], tos = []; let lastProg = 0, sentProg = -1, pv = 0;
    const flushProg = () => { if (pv !== sentProg) { sentProg = pv; hooks.onProg?.(pv); } };
    const pIv = def.boss ? setInterval(flushProg, 280) : 0;
    const ctx = {
      box, level: mg.level, dur: mg.dur, rnd, rem: hooks.rem, beep: hooks.beep || (() => {}),
      raf: fn => rafs.push(fn), timeout: (fn, ms) => tos.push(setTimeout(() => { if (!done) fn(); }, ms)),
      win: () => finish(true), fail: () => finish(false), prog: n => { pv = n; }
    };
    function finish(ok) {
      if (done) return; done = true; cancelAnimationFrame(raf); tos.forEach(clearTimeout); clearInterval(pIv); flushProg();
      if (def.boss) { box.append(el("mgflash " + (ok ? "ok" : "no"), "", "¡TIEMPO!")); return; }
      box.append(el("mgflash " + (ok ? "ok" : "no"), "", ok ? "✔" : "✘")); hooks.beep?.(ok ? 880 : 180); navigator.vibrate?.(ok ? [30, 30, 30] : 120);
      hooks.onResult?.(ok);
    }
    def.mount(ctx);
    (function loop(now) { if (done) return; const dt = Math.min(64, now - last); last = now; rafs.forEach(f => f(dt, now - t0)); if (hooks.rem() <= 0) return finish(def.survive || (def.boss ? true : false)); raf = requestAnimationFrame(loop); })(performance.now());
    return { stop() { done = true; cancelAnimationFrame(raf); tos.forEach(clearTimeout); clearInterval(pIv); } };
  }
  window.KMG = { defs: D, run, verbs: Object.fromEntries(Object.entries(D).map(([k, v]) => [k, v.verb])) };
})();

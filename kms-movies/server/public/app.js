"use strict";
/* ================= utilidades ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const app = $("#app");
/* API: vacío = mismo origen (Render). Con GitHub Pages, config.js apunta al servicio de Render. */
const API = String((window.KMS_CONFIG && window.KMS_CONFIG.api) || "").replace(/\/+$/, "");
/* Rutas de archivos relativas, para que funcionen en subcarpetas como usuario.github.io/repo/ */
const A = p => window.kmsAsset(p);
const COLORS = ["#ff3355", "#2f7bff", "#ffc21a", "#2ed36a", "#a855f7"];
const MODES = { mc: "Opción múltiple", img: "Adivina la imagen", imgopt: "Elige la imagen", tf: "Desliza: verdadero o falso", multi: "Selección múltiple", type: "Respuesta escrita", slider: "Deslizador", order: "Arrastra para ordenar", match: "Emparejar" };
const ROLES = {
  director:   { name: "El Director",   icon: "🎬", color: "#ffc21a", ab: "¡Acción!",  desc: "+8 s de tiempo para todo el equipo" },
  guionista:  { name: "La Guionista",  icon: "✍️", color: "#22d3ee", ab: "Pista",     desc: "Quita opciones incorrectas en preguntas de opciones" },
  productor:  { name: "El Productor",  icon: "🛡️", color: "#7cf24a", ab: "Seguro",    desc: "El equipo absorbe el próximo fallo" },
  doble:      { name: "La Doble",      icon: "❤️", color: "#ff3b8d", ab: "Corazón",   desc: "+1 vida para el equipo" },
  compositor: { name: "El Compositor", icon: "🎵", color: "#c4a1ff", ab: "Fanfarria", desc: "Puntos dobles en lo siguiente" }
};
const FILMCOL = { poeta: "#ff3b8d", contador: "#22d3ee", tropic: "#7cf24a", mix: "#ffc21a" };
const FILMS = { poeta: { name: "El Poeta", color: "#ff3b8d" }, contador: { name: "El Contador", color: "#22d3ee" }, tropic: { name: "Tropic Thunder", color: "#7cf24a" }, mix: { name: "Ronda mixta", color: "#ffc21a" } };
const filmColor = k => FILMCOL[k] || "#ffc21a";
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const S = { role: null, code: null, token: null, id: null, name: null, mute: false, info: null, lastHearts: null };
var HP = null, PP = null, EP = null;
let ST = null, skew = 0, es = null, renderedKey = "", rafT = 0, PQ = {}, stingerEl = null, MGCTL = null, nxIv = 0;
const sess = { get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }, set(k, v) { try { v ? localStorage.setItem(k, JSON.stringify(v)) : localStorage.removeItem(k); } catch (e) {} } };
const post = (p, b) => fetch(API + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b || {}) }).then(async r => ({ ok: r.ok, status: r.status, d: await r.json().catch(() => ({})) })).catch(() => ({ ok: false, status: 0, d: {} }));
const creds = () => ({ code: S.code, id: S.id, token: S.token });
const shapeSVG = i => `<svg class="sh" viewBox="0 0 100 100" aria-hidden="true">${['<path d="M50 8 L94 88 H6 Z"/>', '<path d="M50 4 L96 50 L50 96 L4 50 Z"/>', '<circle cx="50" cy="50" r="44"/>', '<rect x="10" y="10" width="80" height="80" rx="6"/>', '<path d="M50 6 L62 38 L96 38 L68 58 L79 92 L50 71 L21 92 L32 58 L4 38 L38 38 Z"/>'][i % 5]}</svg>`;
const avatar = (p, cls = "", attrs = "") => p.avatar
  ? `<span class="av img ${cls}" ${attrs} style="border-color:${esc(p.color)}"><img src="${A("img/caras/cara-" + String(p.avatar).padStart(2, "0") + ".png")}" alt="${esc(p.name)}" loading="lazy" decoding="async"></span>`
  : `<span class="av ${cls}" ${attrs} style="background:${esc(p.color)};color:#14102b">${esc((p.name || "?").charAt(0).toUpperCase())}</span>`;
const filmChip = f => `<span class="chip" style="background:${esc(f?.color || "#ffc21a")}">${esc(f?.name || "")}</span>`;
const nowS = () => Date.now() + skew;
const HEART = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/></svg>`;

/* ---- sonido ---- */
let ac = null;
function beep(f = 660, d = .12, t = "sine", v = .05, delay = 0) {
  if (S.mute) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + delay;
    o.type = t; o.frequency.setValueAtTime(f, t0); g.gain.setValueAtTime(v, t0); o.connect(g); g.connect(ac.destination);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + d); o.start(t0); o.stop(t0 + d);
  } catch (e) {}
}
const jingle = ok => ok ? [523, 659, 784, 1047].forEach((f, i) => beep(f, .16, "triangle", .06, i * .09)) : [330, 262].forEach((f, i) => beep(f, .24, "sawtooth", .04, i * .14));
const whoosh = () => { beep(220, .25, "sawtooth", .02); beep(440, .2, "sine", .03, .05); };
const mgBeep = f => beep(f || 600, .07, "triangle", .04);
function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; t.setAttribute("role", "status"); document.body.appendChild(t); setTimeout(() => t.remove(), 3800); }

/* ---- onda y tilt ---- */
document.addEventListener("pointerdown", e => {
  const b = e.target.closest(".btn, button.opt"); if (!b || reduced) return;
  const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) / 2, d = document.createElement("span");
  d.className = "ripple"; d.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  b.appendChild(d); setTimeout(() => d.remove(), 650);
});
document.addEventListener("pointermove", e => {
  const t = e.target.closest(".role, button.opt, .rolecard"); if (!t || reduced || e.pointerType === "touch") return;
  const r = t.getBoundingClientRect(); t.style.setProperty("--ry", ((e.clientX - r.left) / r.width - .5) * 8 + "deg"); t.style.setProperty("--rx", (-(e.clientY - r.top) / r.height + .5) * 8 + "deg");
});
document.addEventListener("pointerout", e => { const t = e.target.closest?.(".role, button.opt, .rolecard"); if (t) { t.style.removeProperty("--rx"); t.style.removeProperty("--ry"); } });
function countUp(el, from, to, ms = 900) {
  if (!el) return; if (reduced || from === to) { el.textContent = to; return; }
  const t0 = performance.now();
  (function f(t) { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); if (!el.isConnected) return; el.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(f); })(t0);
}

/* ================= fondo animado ================= */
const bg = $("#bg"), bx = bg.getContext("2d");
const BGP = []; let bgW = 0, bgH = 0, ptr = { x: .5, y: .5 }, accent = "#ffc21a", accentT = "#ffc21a", speed = 1;
function bgResize() { const d = Math.min(2, devicePixelRatio || 1); bgW = bg.width = innerWidth * d; bgH = bg.height = innerHeight * d; }
addEventListener("resize", bgResize); bgResize();
addEventListener("pointermove", e => { ptr.x = e.clientX / innerWidth; ptr.y = e.clientY / innerHeight; });
for (let i = 0; i < 46; i++) BGP.push({ x: Math.random(), y: Math.random(), z: .3 + Math.random() * .9, k: i % 4, r: Math.random() * 6, vr: (Math.random() - .5) * .01, s: 12 + Math.random() * 26 });
const mixc = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
function bgFrame() {
  accent = mixc(accent, accentT, .04);
  const g = bx.createLinearGradient(0, 0, bgW, bgH); g.addColorStop(0, "#1a0f4a"); g.addColorStop(.55, "#0d0a24"); g.addColorStop(1, mixc("#0d0a24", accent, .35));
  bx.fillStyle = g; bx.fillRect(0, 0, bgW, bgH);
  const d = bgW / innerWidth, px = (ptr.x - .5) * 60 * d, py = (ptr.y - .5) * 60 * d;
  BGP.forEach(p => {
    p.y -= .0006 * p.z * speed; p.r += p.vr * speed; if (p.y < -.1) { p.y = 1.1; p.x = Math.random(); }
    const x = p.x * bgW + px * p.z, y = p.y * bgH + py * p.z, s = p.s * p.z * d;
    bx.save(); bx.translate(x, y); bx.rotate(p.r); bx.globalAlpha = .1 + p.z * .16; bx.fillStyle = bx.strokeStyle = p.k === 1 ? "#fff" : accent; bx.lineWidth = 2 * d;
    if (p.k === 0) { bx.beginPath(); bx.arc(0, 0, s, 0, 7); bx.stroke(); for (let i = 0; i < 5; i++) { bx.beginPath(); bx.arc(Math.cos(i * 1.256) * s * .55, Math.sin(i * 1.256) * s * .55, s * .16, 0, 7); bx.fill(); } }
    else if (p.k === 1) { bx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? s * .4 : s, a = i * .628 - 1.57; bx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } bx.closePath(); bx.fill(); }
    else if (p.k === 2) { bx.strokeRect(-s, -s * .7, s * 2, s * 1.4); for (let i = 0; i < 4; i++) bx.fillRect(-s + i * s * .55 + s * .1, -s * .7 - s * .12, s * .3, s * .12); }
    else { bx.beginPath(); bx.arc(0, 0, s * .45, 0, 7); bx.fill(); }
    bx.restore();
  });
  requestAnimationFrame(bgFrame);
}
if (!reduced) bgFrame(); else { bx.fillStyle = "#0d0a24"; bx.fillRect(0, 0, bgW, bgH); }
function setFilm(f) { const c = f?.color || "#ffc21a"; accentT = c; document.documentElement.style.setProperty("--film", c); }

/* ================= confeti ================= */
function confetti(n = 160, origin) {
  if (reduced) return;
  const c = document.createElement("canvas"); c.className = "confetti"; document.body.appendChild(c);
  const x = c.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1), W = c.width = innerWidth * dpr, H = c.height = innerHeight * dpr;
  const cols = [...COLORS, "#ff3b8d", "#22d3ee", "#7cf24a"];
  const ps = Array.from({ length: n }, () => origin
    ? { x: origin.x * dpr, y: origin.y * dpr, vx: (Math.random() - .5) * 16 * dpr, vy: (-6 - Math.random() * 12) * dpr, s: (6 + Math.random() * 8) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[(Math.random() * cols.length) | 0], g: .35 * dpr }
    : { x: Math.random() * W, y: -Math.random() * H * .6, vx: (Math.random() - .5) * 6 * dpr, vy: (2 + Math.random() * 5) * dpr, s: (6 + Math.random() * 8) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[(Math.random() * cols.length) | 0], g: 0 });
  let t = 0;
  (function f() { if (!c.isConnected) return; x.clearRect(0, 0, W, H); t++; ps.forEach(p => { p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); }); if (t < 240) requestAnimationFrame(f); else c.remove(); })();
}

/* ================= red ================= */
function connect() {
  es?.close();
  const u = S.role === "host" ? `${API}/events?role=host&code=${S.code}&token=${encodeURIComponent(S.token)}` : `${API}/events?role=play&code=${S.code}&id=${S.id}&token=${encodeURIComponent(S.token)}`;
  es = new EventSource(u);
  es.addEventListener("state", e => { const s = JSON.parse(e.data); skew = s.now - Date.now(); onState(s); });
  es.addEventListener("react", e => showReaction(JSON.parse(e.data)));
  es.addEventListener("ability", e => showAbility(JSON.parse(e.data)));
  es.addEventListener("kicked", () => leave("El organizador te quitó de la sala."));
  es.addEventListener("closed", () => { if (S.role !== "host") leave("La sala se cerró."); });
  es.onerror = () => { if (es.readyState === EventSource.CLOSED) leave("No se pudo conectar con la sala. Puede que ya haya terminado."); };
}
function leave(msg) {
  es?.close(); es = null; sess.set(S.role === "host" ? "kms-host" : "kms-play", null); ST = null; renderedKey = ""; S.code = S.token = S.id = null; S.lastHearts = null; stopTimer(); removeStinger(); $("#dock").hidden = true; $("#teamBar")?.remove(); document.body.classList.remove("hasbar");
  S.role = null; landing(); if (msg) toast(msg);
}
function onState(s) {
  const prev = ST; ST = s;
  setFilm(s.filmInfo || (s.film ? { color: filmColor(s.film) } : null));
  const key = [s.code, s.phase, s.idx].join(":");
  if (key !== renderedKey) { renderedKey = key; render(prev); } else live(prev);
}
function stopTimer() { cancelAnimationFrame(rafT); rafT = 0; clearInterval(nxIv); nxIv = 0; MGCTL?.stop(); MGCTL = null; }

/* ---- HUD de equipo ---- */
function hudHTML() {
  const s = ST, last = S.lastHearts ?? s.hearts;
  const hs = [...Array(s.maxHearts).keys()].map(i => `<span class="heart ${i < s.hearts ? "on" : ""} ${i >= s.hearts && i < last ? "gone" : ""} ${i < s.hearts && i >= last ? "new" : ""}">${HEART}</span>`).join("");
  return `<div class="hud" id="hud"><div class="hearts" role="img" aria-label="Vidas del equipo: ${s.hearts}">${hs}${s.shield ? `<span class="shield" title="Seguro">🛡️×${s.shield}</span>` : ""}</div>
    <div class="hscore"><b id="hsc">${s.score}</b> pts${s.mult > 1 ? ` <span class="chip">×${s.mult.toFixed(1)}</span>` : ""}${s.fan ? ` <span class="chip" style="background:var(--pink);color:#fff">FANFARRIA</span>` : ""}</div>
    <div class="hscene">Escena ${s.idx + 1}/${s.total}</div></div><div class="pbar" id="pb"><i style="width:${Math.round(100 * s.idx / s.total)}%"></i></div>`;
}
function updateHud() {
  const h = $("#hud"); if (!h || !ST) return;
  const wrap = document.createElement("div"); wrap.innerHTML = hudHTML(); const prevScore = +($("#hsc")?.textContent || 0);
  h.replaceWith(wrap.children[0]); $("#pb")?.replaceWith(wrap.children[0]);
  countUp($("#hsc"), prevScore, ST.score, 900); S.lastHearts = ST.hearts;
}
function abilityHTML() {
  const me = ST.me, r = ROLES[me?.role]; if (!r) return "";
  return `<button class="abtn" id="ab" ${me.used ? "disabled" : ""} style="--c:${r.color}"><span class="ai">${r.icon}</span><span><b>${r.ab}</b><small>${me.used ? "Ya la usaste" : esc(r.desc)}</small></span></button>`;
}
function bindAbility() {
  const b = $("#ab"); if (!b) return;
  b.onclick = async () => {
    const r = await post("/api/ability", creds());
    if (!r.ok) toast({ used: "Ya usaste tu habilidad.", phase: "No se puede usar en este momento.", na: "No sirve ahora mismo: la pista solo funciona en preguntas de opciones y las vidas o escudos al máximo no se acumulan." }[r.d.error] || "No se pudo usar.");
  };
}
function showAbility(a) {
  const r = ROLES[a.role]; if (!r) return;
  const d = document.createElement("div"); d.className = "abanner"; d.style.setProperty("--c", r.color);
  d.innerHTML = `<span class="ai">${r.icon}</span><div><b>${esc(a.name)}</b> usó <b>${esc(r.ab)}</b><small>${esc(a.label)}</small></div>`;
  document.body.appendChild(d); jingle(true); setTimeout(() => d.remove(), 3200);
}

function view(html, cls = "") {
  stopTimer(); document.body.classList.remove("hot"); speed = 1; app.className = "wrap screen " + cls;
  const hud = ST && S.role && ["q", "reveal", "mg", "mgres"].includes(ST.phase);
  app.innerHTML = (hud ? hudHTML() : "") + (hud && S.role === "play" ? abilityHTML() : "") + (hud ? spotHTML() : "") + html;
  if (hud) S.lastHearts = ST.hearts;
  if (hud && S.role === "play") bindAbility();
  window.scrollTo({ top: 0 });
}

/* ================= reacciones y escenas ================= */
const REACTS = ["😂", "🔥", "👏", "😮", "🍿", "🎬", "😎", "❤️"];
function mountDock() { const d = $("#dock"); d.hidden = false; if (d.dataset.ok) return; d.dataset.ok = 1; d.innerHTML = REACTS.map(e => `<button aria-label="Reaccionar ${e}">${e}</button>`).join(""); $$("button", d).forEach((b, i) => b.onclick = () => { beep(600 + i * 60, .06, "triangle", .03); post("/api/react", S.role === "host" ? { code: S.code, token: S.token, emoji: REACTS[i] } : { ...creds(), emoji: REACTS[i] }); }); }
function showReaction(r) {
  const d = document.createElement("div"); d.className = "react"; d.style.setProperty("--dx", (Math.random() - .5) * 120 + "px");
  const face = r.id && S.role === "host" ? $(`#teamBar [data-pid="${CSS.escape(r.id)}"]`) : null;
  if (face) { const b = face.getBoundingClientRect(); d.style.left = b.left + b.width / 2 - 20 + "px"; d.style.bottom = innerHeight - b.top - 10 + "px"; face.animate?.([{ transform: "translateY(0)" }, { transform: "translateY(-12px) scale(1.15)" }, { transform: "translateY(0)" }], { duration: 350 }); }
  else d.style.left = (6 + r.x * 84) + "%";
  d.innerHTML = `${esc(r.emoji)}<small style="color:${esc(r.color)}">${esc(r.name)}</small>`; document.body.appendChild(d); setTimeout(() => d.remove(), 3700);
}
function removeStinger() { stingerEl?.remove(); stingerEl = null; }
function showStinger(film, host) {
  removeStinger(); const fi = ST.filmInfo || FILMS[film]; whoosh();
  const el = document.createElement("div"); el.className = "stinger"; stingerEl = el;
  const letters = (fi.name || "").toUpperCase().split("").map((c, i) => `<span style="animation-delay:${.15 + i * .04}s">${esc(c)}</span>`).join("");
  const css = `<div class="kb" style="background-image:url(${esc(A(fi.img || "/img/" + film + ".jpg"))})"></div><div class="shade"></div><div class="txt"><div class="tag">AHORA: ESCENAS DE</div><h2>${letters}</h2><div class="sub">${esc(fi.sub || "")}</div></div>`;
  el.innerHTML = host ? `<video src="media/film-${esc(film)}.mp4" autoplay muted playsinline></video>` : css;
  document.body.appendChild(el);
  if (host) { const v = $("video", el); v.onerror = () => { el.innerHTML = css; }; v.play?.().catch(() => { el.innerHTML = css; }); }
  setTimeout(() => { if (stingerEl === el) removeStinger(); }, 4300);
}

/* ================= portada ================= */
function landing() {
  S.role = null; renderedKey = ""; setFilm(null);
  const pin = new URLSearchParams(location.search).get("pin") || "";
  view(`
    <div class="logo"><div class="kms" aria-label="KMS"><span>K</span><span>M</span><span>S</span></div><span class="marquee">GET IT TOGETHER · TRIVIA EN EQUIPO</span></div>
    <div id="lphoto"></div>
    <div class="role-grid">
      <button class="role host" id="goHost"><h2>Organizar</h2><p>Crea la sala, comparte el PIN y dirige la función desde la pantalla grande.</p></button>
      <button class="role play" id="goPlay"><h2>Jugar</h2><p>Entra con el PIN, elige tu personaje y ayuda al equipo con preguntas y microjuegos.</p></button>
    </div>
    <div class="posters">${[["poeta", "El Poeta", "Colombia · 2025"], ["contador", "El Contador", "Ben Affleck · 2016"], ["tropic", "Tropic Thunder", "Dir. Ben Stiller · 2008"]].map(([k, n, s]) => `<div class="poster" style="--c:${FILMCOL[k]};background-image:url(${A("img/" + k + ".jpg")})"><div><b>${n}</b><span>${s}</span></div></div>`).join("")}</div>`);
  if (!API && location.protocol === "file:") app.insertAdjacentHTML("afterbegin", `<div class="err">Falta la dirección del servidor. Abre este archivo con un editor, busca <b>window.KMS_CONFIG</b> y escribe en <b>api</b> la URL de tu servicio de Render (por ejemplo https://kms-movies.onrender.com).</div>`);
  $("#goHost").onclick = () => { beep(523, .1); location.hash = "host"; hostEntry(); };
  $("#goPlay").onclick = () => { beep(784, .1); location.hash = ""; joinScreen(pin); };
  TEAM.create($("#lphoto"), { mode: "landing", scroll: innerWidth < 760, onPick: n => { S.prefAvatar = n; beep(784, .1, "triangle"); jingle(true); joinScreen(pin); } });
  if (pin) joinScreen(pin);
}

/* ================= ORGANIZADOR ================= */
const H = { picks: { poeta: true, contador: true, tropic: true }, mode: "quick" };
async function hostEntry() {
  S.role = "host"; const saved = sess.get("kms-host");
  if (saved) { S.code = saved.code; S.token = saved.token; connect(); view(`<div class="done"><div class="spin"></div><p>Recuperando tu sala…</p></div>`); return; }
  if (!S.info) S.info = await fetch(API + "/api/info").then(r => r.json()).catch(() => null);
  hostSetup();
}
function hostSetup(err) {
  const info = S.info || { plan: {}, needsPassword: false };
  view(`
    <div class="top"><h1 style="font-size:2.4rem">Nueva función</h1><button class="btn ghost sm" id="home">Inicio</button></div>
    <div class="card" style="display:grid;gap:18px">
      <div><div class="mut" style="margin-bottom:8px">PELÍCULAS</div><div class="row">${["poeta", "contador", "tropic"].map(k => `<label class="toggle"><input type="checkbox" data-film="${k}" ${H.picks[k] ? "checked" : ""}><span class="dot" style="background:${FILMCOL[k]}"></span>${FILMS[k].name}</label>`).join("")}</div></div>
      <div><div class="mut" style="margin-bottom:8px">DURACIÓN</div><div class="seg"><button data-mode="quick" aria-pressed="${H.mode === "quick"}">Corta · ~${info.plan?.quick || 22} escenas (10 min)</button><button data-mode="full" aria-pressed="${H.mode === "full"}">Larga · ~${info.plan?.full || 60} escenas (30 min)</button></div></div>
      <div class="mut" style="font-size:.95rem">Todo el equipo comparte vidas y puntos. Entre pregunta y pregunta hay microjuegos, y cada película termina con un jefe que se vence entre todos.</div>
      ${info.needsPassword ? `<label class="lbl"><span>Contraseña de organizador</span><input class="field" id="pw" type="password" autocomplete="current-password"></label>` : ""}
      ${err ? `<div class="err">${esc(err)}</div>` : ""}
      <div class="row"><button class="btn big pink" id="create">Crear sala</button></div>
    </div>`);
  $$("[data-film]").forEach(i => i.onchange = () => { H.picks[i.dataset.film] = i.checked; });
  $$("[data-mode]").forEach(b => b.onclick = () => { H.mode = b.dataset.mode; $$("[data-mode]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); });
  $("#home").onclick = () => { S.role = null; location.hash = ""; landing(); };
  $("#create").onclick = async () => {
    $("#create").disabled = true;
    const r = await post("/api/host/create", { films: H.picks, mode: H.mode, password: $("#pw")?.value });
    if (!r.ok) return hostSetup(r.d.error === "password" ? "Contraseña incorrecta." : r.d.error === "no_questions" ? "Elige al menos una película." : "No se pudo crear la sala.");
    S.code = r.d.code; S.token = r.d.token; sess.set("kms-host", { code: S.code, token: S.token }); connect();
  };
}
const hostAct = (action, extra) => post("/api/host/action", { code: S.code, token: S.token, action, ...extra });

function render(prev) {
  const s = ST; if (!s) return;
  mountDock(); $("#dock").hidden = ["q", "film", "mg"].includes(s.phase);
  if (S.role === "host") hostRender(prev); else playRender(prev);
  syncTeamBar(); if (["q", "mg"].includes(s.phase) && s.spot) spotToast();
}
function live(prev) {
  updateHud(); syncTeamBar();
  if (ST.phase === "q") { applyHidden(); updateLights(); }
  if (ST.phase === "mg") updateMgLive();
  if (S.role === "host") hostLive(prev); else playLive(prev);
  if (S.role === "play" && ["q", "reveal", "mg", "mgres"].includes(ST.phase)) { const b = $("#ab"); if (b) { b.disabled = !!ST.me?.used; const sm = $("small", b); if (sm && ST.me?.used) sm.textContent = "Ya la usaste"; } }
}
/* ---- barra del equipo (organizador): caras con estado en vivo ---- */
function syncTeamBar() {
  let bar = $("#teamBar"); const show = S.role === "host" && ST && ["q", "reveal", "mg", "mgres"].includes(ST.phase);
  document.body.classList.toggle("hasbar", !!show);
  if (!show) { bar?.remove(); return; }
  if (!bar) { bar = document.createElement("div"); bar.id = "teamBar"; bar.className = "teambar2"; bar.setAttribute("aria-label", "Estado del equipo"); document.body.appendChild(bar); }
  const key = ST.players.map(p => [p.id, p.avatar, p.role].join(":")).join("|");
  if (bar.dataset.key !== key) { bar.dataset.key = key; bar.innerHTML = ST.players.map(p => `<div class="tb" data-pid="${esc(p.id)}">${avatar(p)}<span class="tbrole">${ROLES[p.role]?.icon || ""}</span><span class="tbmark"></span><span class="tbname">${esc(p.name)}</span></div>`).join(""); }
  const mg = ST.phase === "mg" || ST.phase === "mgres", boss = !!ST.mg?.boss;
  $$(".tb", bar).forEach(el => {
    const p = ST.players.find(x => x.id === el.dataset.pid); if (!p) return;
    const ans = ST.phase === "q" || ST.phase === "reveal" ? p.answered : false;
    const ok = mg && (boss ? ST.phase === "mgres" : p.done && p.ok), no = mg && !boss && p.done && !p.ok || (ST.phase === "mgres" && !boss && !p.ok);
    const was = el.classList.contains("ok");
    el.classList.toggle("spot", ST.spot === p.id && ["q", "mg"].includes(ST.phase)); el.classList.toggle("ans", ans); el.classList.toggle("ok", !!ok); el.classList.toggle("no", !!no);
    if (ok && !was) { el.classList.remove("ok"); void el.offsetWidth; el.classList.add("ok"); }
    el.querySelector(".tbmark").textContent = ans || ok ? "✓" : no ? "✗" : "";
  });
}
function spotHTML() {
  const s = ST; if (!s.spot || !["q", "mg"].includes(s.phase)) return "";
  const p = s.players.find(x => x.id === s.spot); if (!p) return "";
  const mine = S.role === "play" && p.id === S.id;
  return `<div class="spotbar ${mine ? "me" : ""}">${avatar(p)}<div><b>${mine ? "¡Estás en el foco!" : "En el foco: " + esc(p.name)}</b><small>${s.phase === "q" ? "Su respuesta vale doble" : "Su resultado vale doble"}</small></div></div>`;
}
function spotToast() {
  const s = ST, p = s.players.find(x => x.id === s.spot); if (!p) return;
  const d = document.createElement("div"); d.className = "abanner spot"; d.style.setProperty("--c", "var(--amber)");
  d.innerHTML = `${avatar(p)}<div><b>${S.role === "play" && p.id === S.id ? "¡Estás en el foco!" : "El foco está en " + esc(p.name)}</b><small>Su ${s.phase === "q" ? "respuesta" : "resultado"} vale doble</small></div>`;
  document.body.appendChild(d); beep(880, .1, "triangle", .05); setTimeout(() => d.remove(), 2400);
}
function fastestHTML(rv) {
  const f = rv.fastest && ST.players.find(p => p.id === rv.fastest.id); if (!f) return "";
  return `<div class="fastest">${avatar(f)}<div><small>⚡ Más rápido en acertar</small><b>${esc(f.name)}</b> <span class="mut">${(rv.fastest.rt / 1000).toFixed(1)} s</span></div></div>`;
}
/* premios finales: la cámara hace zoom a cada ganador en la foto */
function awardsCycle(s) {
  const ph = $("#ephoto"); if (!ph) return;
  EP = TEAM.create(ph, { mode: "show" }); EP.update(s.players, null);
  const aw = (s.awards || []).filter(a => a.avatar), cap = $("#ecap"); let k = 0;
  const tick = () => {
    if (!ph.isConnected) return;
    if (k < aw.length) { const a = aw[k++]; EP.spot(a.avatar); cap.innerHTML = `<small>${esc(a.title)}</small><b>${esc(a.name)}</b> <span class="mut">${esc(a.note)}</span>`; beep(660 + k * 120, .12, "triangle", .05); setTimeout(tick, 3400); }
    else { EP.spot(null); cap.innerHTML = `<small>Todo el equipo</small><b>¡Gracias por jugar!</b>`; setTimeout(() => { k = 0; tick(); }, 3000); }
  };
  setTimeout(tick, 1400);
}
const stateTxt = s => `Escena ${s.idx + 1} de ${s.total}`;

function hostRender(prev) {
  const s = ST; removeStinger();
  if (s.phase === "lobby") return hostLobby();
  if (s.phase === "film") { view(`<div class="done"><div class="spin"></div></div>`); return showStinger(s.film, true); }
  if (s.phase === "q") return hostQuestion();
  if (s.phase === "reveal") return hostReveal();
  if (s.phase === "mg") return hostMg();
  if (s.phase === "mgres") return hostMgres();
  if (s.phase === "end") return hostEnd();
}
function hostLobby() {
  const s = ST, joinUrl = `${location.origin}${location.pathname.replace(/index\.html$/, "")}?pin=${s.code}`;
  view(`
    <div class="top"><span class="marquee" style="font-size:1.2rem">KMS MOVIES</span><div class="row"><button class="btn ghost sm" id="mute">${S.mute ? "Sonido: no" : "Sonido: sí"}</button><button class="btn ghost sm" id="fs">Pantalla completa</button><button class="btn ghost sm" id="close">Cerrar sala</button></div></div>
    <div class="lobby-grid">
      <div class="card" style="display:grid;gap:10px;justify-items:center;text-align:center">
        <div class="mut">Entra a <b style="color:#fff">${esc(location.host + location.pathname.replace(/index\.html$/, "").replace(/\/$/, ""))}</b> e ingresa el PIN</div>
        <div class="pin" aria-label="PIN de la sala">${esc(s.code)}</div>
        <div class="row center"><div class="qr" id="qr" hidden></div><button class="btn sm cyan" id="copy">Copiar enlace</button></div>
      </div>
      <video class="vid" id="intro" src="media/intro.mp4" muted playsinline loop autoplay controls onerror="this.hidden=true"></video>
    </div>
    <div class="card"><h2 style="font-size:1.6rem;margin-bottom:10px">La foto del equipo</h2><div id="hphoto"></div></div>
    <div class="card"><div class="top"><h2 style="font-size:1.6rem">El equipo <span id="pc" class="mut"></span></h2><span class="mut">${s.total} escenas · ${s.maxHearts - 1} vidas al inicio</span></div><div id="plist" class="players" style="margin-top:12px"></div></div>
    <div class="row center"><button class="btn big pink" id="start" disabled>Levantar el telón</button></div><div class="gap-dock"></div>`);
  $("#mute").onclick = e => { S.mute = !S.mute; e.target.textContent = S.mute ? "Sonido: no" : "Sonido: sí"; };
  $("#fs").onclick = () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {}); };
  $("#close").onclick = async () => { await hostAct("close"); leave(); };
  $("#copy").onclick = async () => { try { await navigator.clipboard.writeText(joinUrl); toast("Enlace copiado"); } catch (e) { toast(joinUrl); } };
  $("#start").onclick = () => { beep(660, .15, "triangle"); hostAct("start"); };
  let qrTries = 0;
  const tryQR = () => {
    if (window.qrcode) {
      try {
        const q = qrcode(0, "M"); q.addData(joinUrl); q.make(); const el = $("#qr"); if (!el) return;
        const n = q.getModuleCount(), cell = 6, c = document.createElement("canvas"); c.width = c.height = (n + 2) * cell; const x = c.getContext("2d");
        x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.fillStyle = "#14102b";
        for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect((k + 1) * cell, (r + 1) * cell, cell, cell);
        c.style.cssText = "width:100%;height:100%;image-rendering:pixelated"; c.setAttribute("role", "img"); c.setAttribute("aria-label", "Código QR para unirse"); el.replaceChildren(c); el.hidden = false;
      } catch (e) { /* sin QR */ }
    } else if (!window.__noqr && qrTries++ < 20) setTimeout(tryQR, 400);
  };
  tryQR(); $("#intro").play?.().catch(() => {}); HP = TEAM.create($("#hphoto"), { mode: "show" }); hostLive(null);
}
function hostLive(prev) {
  const s = ST;
  if (s.phase === "lobby") {
    const el = $("#plist"); if (!el) return;
    const known = new Set($$("[data-pid]", el).map(x => x.dataset.pid));
    el.innerHTML = s.players.length ? s.players.map(p => `<span class="pl ${p.on ? "" : "off"}" data-pid="${esc(p.id)}" style="${known.has(p.id) ? "animation:none" : ""}">${avatar(p)}${esc(p.name)} <span title="${esc(ROLES[p.role]?.name)}">${ROLES[p.role]?.icon || ""}</span><button data-k="${esc(p.id)}" aria-label="Quitar a ${esc(p.name)}">×</button></span>`).join("") : `<span class="mut">Esperando a los primeros jugadores…</span>`;
    if (prev && s.players.length > (prev.players?.length || 0)) beep(784, .1, "triangle", .05);
    HP?.update(s.players, null);
    $("#pc").textContent = `${s.players.length}/${s.max}`; $("#start").disabled = !s.players.length;
    $$("[data-k]", el).forEach(b => b.onclick = () => hostAct("kick", { id: b.dataset.k }));
  } else if (s.phase === "q") {
    const n = s.players.filter(p => p.answered).length, el = $("#ans"); if (el) el.textContent = `${n}/${s.players.length} respondieron`;
  }
}
function updateLights() {
  const s = ST, el = $("#lights"); if (!el) return; if (s.phase !== "q") return;
  if (el.children.length !== s.players.length) el.innerHTML = s.players.map(p => avatar(p)).join("");
  $$(".av", el).forEach((a, i) => a.classList.toggle("on", !!s.players[i]?.answered));
}
function applyHidden() {
  const h = ST.q?.hidden || []; if (!h.length && !$(".hid")) return;
  $$("[data-i]").forEach(b => { const off = h.includes(+b.dataset.i); b.classList.toggle("hid", off); if (b.tagName === "BUTTON") b.disabled = off; if (off) b.setAttribute("aria-pressed", "false"); });
}

/* ---- preguntas (anfitrión) ---- */
const ringHTML = () => `<div class="ring" id="ring" role="timer" aria-label="Tiempo restante"><svg viewBox="0 0 100 100"><circle class="trk" cx="50" cy="50" r="44"/><circle class="bar" cx="50" cy="50" r="44" pathLength="100"/></svg><b>0</b></div>`;
function qHeader(q, withTimer) {
  return `<div class="top"><div class="row">${filmChip(FILMS[q.film])}<span class="chip dark">Pregunta</span><span class="chip dark">${MODES[q.type]}</span></div>
    ${withTimer ? `<div class="row"><span class="chip dark" id="ans">0/${ST.players.length} respondieron</span>${ringHTML()}</div>` : ""}</div>`;
}
function qBody(q) { const img = q.img ? `<img class="qimg" src="${esc(A(q.img))}" alt="Imagen de la pregunta">` : ""; return `<div class="card qcard"><div class="qtext">${esc(q.text)}</div>${img}</div>`; }
function optsHTML(q, rv) {
  const idx = rv?.correct?.idx || [], hid = q.hidden || [];
  const tile = (i, inner, cls) => `<div class="opt ${cls} ${rv ? (idx.includes(i) ? "right" : "dim") : ""} ${hid.includes(i) ? "hid" : ""}" data-i="${i}" style="--i:${i}">${rv ? `<div class="fill" style="width:${Math.round(100 * (rv.dist?.[i] || 0) / Math.max(1, rv.total))}%"></div>` : ""}${inner}${rv ? `<span class="n">${rv.dist?.[i] || 0}</span>` : ""}<span class="tick">✓</span></div>`;
  if (q.type === "imgopt") return `<div class="opts three imgs">${q.imgs.map((u, i) => tile(i, `<img src="${esc(A(u))}" alt="${esc(q.alts[i])}"><span class="letter" style="background:${COLORS[i]}">${"ABC"[i]}</span>`, "imgtile")).join("")}</div>`;
  if (q.type === "tf") return `<div class="opts">${q.opts.map((o, i) => { const ci = i === 0 ? 1 : 0; return tile(i, `${shapeSVG(ci)}<span class="t">${esc(o)}</span>`, "c" + ci); }).join("")}</div>`;
  if (q.type === "mc" || q.type === "img") return `<div class="opts ${q.opts.length === 3 ? "three" : ""}">${q.opts.map((o, i) => tile(i, `${shapeSVG(i)}<span class="t">${esc(o)}</span>`, "c" + i)).join("")}</div>`;
  if (q.type === "multi") return `<div class="opts">${q.opts.map((o, i) => tile(i, `${shapeSVG(i)}<span class="t">${esc(o)}</span>`, "c" + i)).join("")}</div>`;
  if (q.type === "type") return `<div class="card center"><div class="hint" style="font-size:1.4rem">${rv ? `Respuesta: <b style="color:var(--lime)">${esc(rv.ctext)}</b>` : "Los jugadores escriben la respuesta en su pantalla"}</div></div>`;
  if (q.type === "slider") return `<div class="card center" style="display:grid;gap:8px"><div class="hint">Rango ${q.min} – ${q.max}</div>${rv ? `<div class="slider-val" style="color:var(--lime)">${rv.correct.value}</div><div class="hint">Promedio del equipo: ${rv.avg ?? "—"}</div>` : `<div class="hint" style="font-size:1.4rem">Cada jugador desliza hasta su respuesta</div>`}</div>`;
  if (q.type === "order") { const ord = rv ? rv.correct.order : q.opts.map((_, i) => i); return `<div class="olist" style="height:${q.opts.length * 74}px">${ord.map((i, k) => `<div class="oi ${rv ? "good" : ""}" style="transform:translateY(${k * 74}px);animation:rise .5s ${k * .08}s both"><span class="pos">${rv ? k + 1 : "?"}</span><span class="ot">${esc(q.opts[i])}</span></div>`).join("")}</div>`; }
  if (q.type === "match") { const m = rv?.correct?.match; return `<div class="match"><div style="display:grid;gap:12px">${q.left.map((l, i) => `<div class="mi" style="${rv ? "background:" + COLORS[i] + ";color:#14102b" : ""}">${esc(l)}</div>`).join("")}</div><div style="display:grid;gap:12px">${q.right.map((r, j) => { const li = m ? m.indexOf(j) : -1; return `<div class="mi" style="${rv && li >= 0 ? "background:" + COLORS[li] + ";color:#14102b" : ""}">${esc(r)}</div>`; }).join("")}</div></div>`; }
  return "";
}
function startQTimer() {
  stopTimer(); const total = Math.max(ST.q.dur * 1000, ST.endsAt - nowS()); let lastSec = -1;
  const loop = () => {
    const s = ST; if (!s || s.phase !== "q") return;
    const rem = Math.max(0, s.endsAt - nowS()), sec = Math.ceil(rem / 1000), r = $("#ring");
    if (r) { r.querySelector(".bar").style.strokeDashoffset = String(100 * (1 - Math.min(1, rem / total))); r.querySelector("b").textContent = sec; r.classList.toggle("warn", sec <= 10 && sec > 5); r.classList.toggle("hot", sec <= 5); }
    document.body.classList.toggle("hot", sec <= 5 && rem > 0); speed = sec <= 5 ? 3 : 1;
    if (sec !== lastSec) { lastSec = sec; if (rem > 0 && sec <= 5) beep(880, .07, "square", .03); }
    PQ.onTick?.(rem, total);
    rafT = requestAnimationFrame(loop);
  };
  loop();
}
function hostQuestion() {
  const q = ST.q;
  view(`${qHeader(q, true)}${qBody(q)}${optsHTML(q)}
    <div class="row center"><button class="btn ghost sm" id="plus">+10 s</button><button class="btn ghost sm" id="skip">Saltar tiempo</button></div>`);
  $("#plus").onclick = () => hostAct("extend"); $("#skip").onclick = () => hostAct("skip");
  startQTimer(); updateLights(); hostLive(null);
}
function teamBanner(t, spot) {
  const note = t.shieldUsed ? `<div class="flame">🛡️ El seguro absorbió el golpe</div>` : t.heartLost ? `<div class="flame">💔 −1 vida</div>` : "";
  const sp = spot && ST.players.find(p => p.id === spot.id), spotTxt = sp ? `<div class="flame">${avatar(sp)} En el foco: ${esc(sp.name)} · ${spot.f}% · vale doble</div>` : "";
  return `<div class="res-hero ${t.pass ? "ok" : "bad"}"><h2>${t.pass ? "¡EL EQUIPO LO LOGRA!" : "¡EL EQUIPO FALLA!"}</h2><div>${t.pct}% de acierto del equipo${t.pass ? "" : " · hacía falta 50%"}</div>${t.pass ? `<div class="pts">+<span id="pp">0</span></div>${t.mult > 1 ? `<span class="chip">combo ×${t.mult}</span>` : ""}` : ""}${spotTxt}${note}</div>`;
}
function nextControls() {
  const s = ST;
  return `<div class="row center"><button class="btn big" id="next">Continuar</button><button class="btn ghost sm" id="hold">${s.hold ? "Reanudar" : "Pausar"}</button><span class="chip dark" id="nx"></span></div><div class="gap-dock"></div>`;
}
function bindNext() {
  $("#next").onclick = () => hostAct("skip"); $("#hold").onclick = () => hostAct("hold");
  const tick = () => { const el = $("#nx"); if (!el) return; const s = ST; el.textContent = s.hold ? "En pausa" : s.nextAt ? `Sigue en ${Math.max(0, Math.ceil((s.nextAt - nowS()) / 1000))} s` : ""; if (s.hold) { const h = $("#hold"); if (h) h.textContent = "Reanudar"; } };
  tick(); nxIv = setInterval(tick, 300);
}
function hostReveal() {
  const s = ST, q = s.q, rv = s.reveal;
  view(`<div class="top"><div class="row">${filmChip(FILMS[q.film])}<span class="chip dark">${stateTxt(s)}</span></div><span class="chip" id="stat">${rv.right} de ${rv.total} acertaron</span></div>
    ${teamBanner(rv.team, rv.spot)}${fastestHTML(rv)}${qBody(q)}${optsHTML(q, rv)}
    <div class="card"><div class="mut">Respuesta correcta</div><div style="font-family:var(--font-display);font-size:1.7rem;overflow-wrap:anywhere">${esc(rv.ctext)}</div><p class="mut" style="margin:6px 0 0">${esc(rv.expl)}</p></div>
    ${nextControls()}`);
  bindNext(); countUp($("#pp"), 0, rv.team.gain, 1000);
  jingle(rv.team.pass); if (rv.team.pass) confetti(70, { x: innerWidth / 2, y: innerHeight * .25 }); else document.body.animate?.([{ transform: "translateX(0)" }, { transform: "translateX(-10px)" }, { transform: "translateX(10px)" }, { transform: "translateX(0)" }], { duration: 350 });
}

/* ---- microjuegos ---- */
function startMgLoop(cb) {
  stopTimer(); let lastCd = -1;
  const loop = () => {
    const s = ST; if (!s || s.phase !== "mg") return;
    const t = nowS(), pre = s.startsAt - t, rem = Math.max(0, s.endsAt - t), f = $("#fuse i");
    if (f) f.style.width = (pre > 0 ? 100 : Math.min(100, 100 * rem / s.mg.dur)) + "%";
    const sec = Math.ceil(rem / 1000); document.body.classList.toggle("hot", pre <= 0 && rem > 0 && rem < 2200); speed = pre <= 0 ? 2.4 : 1;
    const cd = pre > 0 ? Math.ceil(pre / 1000) : 0; if (cd !== lastCd) { lastCd = cd; if (cd > 0 && cd <= 2) beep(520 + (3 - cd) * 140, .1, "square", .03); const c = $("#cd"); if (c) c.textContent = cd > 0 ? (cd > 2 ? "" : cd) : ""; }
    const sl = $("#fusel"); if (sl && pre <= 0) sl.textContent = sec;
    cb?.(pre, rem); rafT = requestAnimationFrame(loop);
  };
  loop();
}
function mgHead() {
  const s = ST, m = s.mg, v = KMG.verbs[m.id] || "¡YA!";
  return `<div class="top"><div class="row">${filmChip(FILMS[s.film])}<span class="chip ${m.boss ? "" : "dark"}" style="${m.boss ? "background:var(--pink);color:#fff" : ""}">${m.boss ? (m.final ? "JEFE FINAL" : "JEFE") : "MICROJUEGO"}</span>${m.level >= 3 && !m.boss ? `<span class="chip dark">Velocidad ×${(1 + m.level * .1).toFixed(1)}</span>` : ""}</div></div>
    <div class="verbwrap"><div class="verb ${m.boss ? "boss" : ""}" id="verb">${esc(v)}</div><div class="cd" id="cd"></div></div>`;
}
function matesHTML() { return ST.players.map(p => avatar(p, "mate", `data-pid="${esc(p.id)}" title="${esc(p.name)}"`)).join(""); }
function updateMgLive() {
  const s = ST, m = s.mg; if (!m) return;
  $$("#mates .av").forEach(a => { const p = s.players.find(x => x.id === a.dataset.pid); if (!p) return; a.classList.toggle("on", !m.boss && p.done && p.ok); a.classList.toggle("no", !m.boss && p.done && !p.ok); });
  if (m.boss) { const tb = $("#tb"); if (tb) tb.style.width = Math.min(100, 100 * m.prog / m.goal) + "%"; const tn = $("#tbn"); if (tn) tn.textContent = `${m.prog} / ${m.goal}`; }
}
function bossBar() { return `<div class="teambar"><i id="tb"></i><span id="tbn"></span></div>`; }
function hostMg() {
  const m = ST.mg;
  view(`${mgHead()}${m.boss ? bossBar() : ""}<div class="fuse" id="fuse"><i></i><u></u><b id="fusel"></b></div>
    <div class="row center"><button class="btn ghost sm" id="plus">+8 s</button><button class="btn ghost sm" id="skip">Saltar</button></div>`);
  $("#plus").onclick = () => hostAct("extend"); $("#skip").onclick = () => hostAct("skip");
  whoosh(); startMgLoop(); updateMgLive();
}
function mgresBanner() {
  const r = ST.mgres;
  const note = r.bonusHeart ? `<div class="flame">❤️ +1 vida por vencer al jefe</div>` : r.shieldUsed ? `<div class="flame">🛡️ El seguro absorbió el golpe</div>` : r.heartLost ? `<div class="flame">💔 −1 vida</div>` : "";
  const sp = r.spot && ST.players.find(p => p.id === r.spot.id), spotTxt = sp ? `<div class="flame">${avatar(sp)} En el foco: ${esc(sp.name)} ${r.spot.ok ? "lo logró" : "no lo logró"} · vale doble</div>` : "";
  return `<div class="res-hero ${r.pass ? "ok" : "bad"}"><h2>${r.pass ? (r.boss ? "¡JEFE DERROTADO!" : "¡EL EQUIPO LO LOGRA!") : (r.boss ? "¡EL JEFE GANA!" : "¡EL EQUIPO FALLA!")}</h2>
    <div>${r.boss ? `${r.total} de ${r.goal} toques en equipo` : `${r.succ} de ${r.n} jugadores lo superaron`}</div>${r.pass ? `<div class="pts">+<span id="pp">0</span></div>${r.mult > 1 ? `<span class="chip">combo ×${r.mult}</span>` : ""}` : ""}${spotTxt}${note}</div>`;
}
function hostMgres() {
  const s = ST, m = s.mg;
  view(`<div class="top"><div class="row">${filmChip(FILMS[s.film])}<span class="chip dark">${stateTxt(s)}</span></div></div>${mgresBanner()}${nextControls()}`);
  updateMgLive(); $$("#mates .av").forEach(a => { const p = s.players.find(x => x.id === a.dataset.pid); a.classList.toggle("on", m.boss || (p?.done && p.ok)); a.classList.toggle("no", !m.boss && !(p?.done && p.ok)); });
  bindNext(); countUp($("#pp"), 0, s.mgres.gain, 1000); jingle(s.mgres.pass); if (s.mgres.pass) confetti(s.mgres.boss ? 180 : 70, { x: innerWidth / 2, y: innerHeight * .3 });
}

/* ---- final de equipo ---- */
function starsHTML(n) { return `<div class="stars" aria-label="${n} de 3 estrellas">${[1, 2, 3].map(i => `<svg viewBox="0 0 100 100" class="${i <= n ? "on" : ""}" style="animation-delay:${.4 + i * .25}s"><path d="M50 6 L62 38 L96 38 L68 58 L79 92 L50 71 L21 92 L32 58 L4 38 L38 38 Z"/></svg>`).join("")}</div>`; }
function awardsHTML() { const a = ST.awards || []; return a.length ? `<div class="awards">${a.map((x, i) => `<div class="award" style="animation-delay:${.6 + i * .15}s">${avatar(x)}<div><small>${esc(x.title)}</small><b>${esc(x.name)}</b><span class="mut">${esc(x.note)}</span></div></div>`).join("")}</div>` : ""; }
function hostEnd() {
  const s = ST;
  view(`${s.win ? `<video class="vid" src="media/finale.mp4" autoplay muted playsinline style="max-height:34vh;object-fit:cover" onerror="this.hidden=true"></video>` : ""}
    <div class="res-hero ${s.win ? "ok" : "bad"}"><h1 style="font-size:clamp(2.2rem,8vw,4.5rem)">${s.win ? "¡FUNCIÓN COMPLETADA!" : "¡SE CORTÓ LA FUNCIÓN!"}</h1>${starsHTML(s.stars)}
      <div class="pts"><span id="pp">0</span> pts de equipo</div><div class="flame">${HEART.replace("<svg", '<svg style="fill:#ff3355"')} ${s.hearts} vidas restantes</div></div>
    <div class="card"><div id="ephoto"></div><div class="ecap" id="ecap"></div></div>
    ${awardsHTML()}
    <div class="row center"><button class="btn big pink" id="again">Jugar otra vez</button><button class="btn ghost" id="closeroom">Cerrar sala</button></div><div class="gap-dock"></div>`);
  awardsCycle(s);
  countUp($("#pp"), 0, s.score, 2000);
  if (s.win) { setTimeout(() => confetti(220), 600); setTimeout(() => confetti(120, { x: innerWidth * .2, y: innerHeight * .7 }), 1300); setTimeout(() => confetti(120, { x: innerWidth * .8, y: innerHeight * .7 }), 1600); }
  jingle(s.win);
  $("#again").onclick = () => hostAct("restart");
  $("#closeroom").onclick = async () => { await hostAct("close"); leave(); };
}

/* ================= PARTICIPANTE ================= */
function joinScreen(pin, err) {
  S.role = "play"; renderedKey = ""; const saved = sess.get("kms-play");
  if (saved && !err) { S.code = saved.code; S.id = saved.id; S.token = saved.token; S.name = saved.name; connect(); view(`<div class="done"><div class="spin"></div><p>Volviendo a la sala…</p></div>`); return; }
  let nick = ""; try { nick = localStorage.getItem("kms-nick") || ""; } catch (e) {}
  view(`<div class="logo"><div class="kms" style="font-size:clamp(3.4rem,18vw,6rem)"><span>K</span><span>M</span><span>S</span></div></div>
    <div class="card narrow" style="display:grid;gap:16px">
      <h1 style="font-size:2rem;text-align:center">Únete al equipo</h1>
      ${S.prefAvatar ? `<div class="pref"><span class="face">${TEAM.faceSVG(S.prefAvatar)}</span><span>Entrarás con esta cara <button id="clrAv" type="button">Cambiar</button></span></div>` : ""}
      <label class="lbl"><span>PIN de la sala</span><input class="field" id="pin" inputmode="numeric" maxlength="6" placeholder="000000" autocomplete="off" value="${esc(pin || "")}"></label>
      <label class="lbl"><span>Tu apodo</span><input class="field" id="nick" maxlength="14" placeholder="Ej. Cinéfilo" autocomplete="off" value="${esc(nick)}"></label>
      ${err ? `<div class="err">${esc(err)}</div>` : ""}
      <button class="btn big pink" id="join">Entrar</button><button class="btn ghost sm" id="home">Inicio</button></div>`);
  $("#home").onclick = () => { S.role = null; landing(); };
  $("#clrAv")?.addEventListener("click", () => { S.prefAvatar = null; landing(); });
  const go = async () => {
    const code = $("#pin").value.trim(), name = $("#nick").value.trim();
    if (!/^\d{6}$/.test(code)) return joinScreen(code, "El PIN tiene 6 dígitos.");
    if (name.length < 2) return joinScreen(code, "Escribe un apodo de al menos 2 letras.");
    $("#join").disabled = true;
    const r = await post("/api/join", { code, name, avatar: S.prefAvatar || undefined });
    if (!r.ok) return joinScreen(code, { no_room: "No existe una sala con ese PIN.", started: "La función ya empezó.", full: "La sala está llena (15 jugadores).", name: "Apodo no válido." }[r.d.error] || "No se pudo entrar. Inténtalo otra vez.");
    try { localStorage.setItem("kms-nick", name); } catch (e) {}
    S.prefAvatar = null; S.code = code; S.id = r.d.id; S.token = r.d.token; S.name = r.d.name; sess.set("kms-play", { code, id: S.id, token: S.token, name: S.name }); beep(784, .1, "triangle"); connect();
  };
  $("#join").onclick = go; $$(".field").forEach(f => f.onkeydown = e => { if (e.key === "Enter") go(); });
}
function playRender(prev) {
  const s = ST; removeStinger();
  if (s.phase === "lobby") return playLobby();
  if (s.phase === "film") { view(`<div class="done"><div class="spin"></div></div>`); return showStinger(s.film, false); }
  if (s.phase === "q") return playQuestion();
  if (s.phase === "reveal") return playResult();
  if (s.phase === "mg") return playMg();
  if (s.phase === "mgres") return playMgres();
  if (s.phase === "end") return playEnd();
}
async function playLobbyInfo() { if (!S.info) S.info = await fetch(API + "/api/info").then(r => r.json()).catch(() => null); if (ST?.phase === "lobby") playLive(null); }
function playLobby() {
  playLobbyInfo();
  view(`<div class="logo"><div class="kms" style="font-size:clamp(3.4rem,18vw,6rem)"><span>K</span><span>M</span><span>S</span></div></div>
    <div class="card"><h2 style="font-size:1.6rem;text-align:center">Elige tu cara</h2><p class="mut" style="margin:6px 0 12px;text-align:center">Toca tu cara en la foto. Cada cara la usa una sola persona.</p><div id="pphoto"></div><div class="row center" style="margin-top:10px"><button class="btn sm" id="avToggle">Ver lista de caras</button></div><div class="avgrid" id="avs" hidden style="margin-top:10px"></div></div>
    <div class="card"><h2 style="font-size:1.6rem;text-align:center">Elige tu personaje</h2><p class="mut center" style="margin:6px 0 12px;text-align:center">Cada uno tiene una habilidad que puedes usar una vez para ayudar al equipo.</p><div class="roles" id="roles"></div></div>
    <div class="card"><div class="top"><h2 style="font-size:1.3rem">El equipo</h2><span class="mut" id="wc"></span></div><div class="players" id="plist" style="margin-top:10px"></div></div><div class="gap-dock"></div>`);
  PP = TEAM.create($("#pphoto"), { mode: "pick", scroll: innerWidth < 760, onPick: async n => { beep(700, .06, "triangle"); const r = await post("/api/avatar", { ...creds(), avatar: n }); if (!r.ok) toast(r.d.error === "taken" ? "Ese avatar ya lo eligió alguien más." : "No se pudo cambiar el avatar."); } });
  $("#avToggle").onclick = e => { const g = $("#avs"), photo = $("#pphoto"); g.hidden = !g.hidden; photo.hidden = !g.hidden; e.target.textContent = g.hidden ? "Ver lista de caras" : "Ver foto"; };
  playLive(null);
}
function playLive(prev) {
  const s = ST;
  if (s.phase === "lobby") {
    PP?.update(s.players, S.id);
    const wc = $("#wc"); if (wc) wc.textContent = `${s.players.length} jugador${s.players.length === 1 ? "" : "es"}`;
    const el = $("#plist"); if (el) { const known = new Set($$("[data-pid]", el).map(x => x.dataset.pid)); el.innerHTML = s.players.map(p => `<span class="pl" data-pid="${esc(p.id)}" style="${known.has(p.id) ? "animation:none" : ""}">${avatar(p)}${esc(p.name)} <span>${ROLES[p.role]?.icon || ""}</span></span>`).join(""); }
    const ag = $("#avs"); if (ag) {
      const me = s.players.find(p => p.id === S.id), n = S.info?.avatars || 13;
      if (!ag.children.length) { ag.innerHTML = Array.from({ length: n }, (_, i) => `<button class="avopt" data-a="${i + 1}" aria-label="Avatar ${i + 1}"><img src="${A("img/caras/cara-" + String(i + 1).padStart(2, "0") + ".png")}" alt="" loading="lazy"></button>`).join(""); $$(".avopt", ag).forEach(b => b.onclick = async () => { beep(700, .06, "triangle"); const r = await post("/api/avatar", { ...creds(), avatar: +b.dataset.a }); if (!r.ok) toast(r.d.error === "taken" ? "Ese avatar ya lo eligió alguien más." : "No se pudo cambiar el avatar."); }); }
      $$(".avopt", ag).forEach(b => { const a = +b.dataset.a, owner = s.players.find(p => p.avatar === a); b.classList.toggle("sel", me?.avatar === a); b.disabled = !!owner && owner.id !== S.id; b.title = owner && owner.id !== S.id ? "Elegido por " + owner.name : ""; });
    }
    const rl = $("#roles"); if (rl) {
      const mine = s.me?.role;
      if (!rl.children.length) { rl.innerHTML = Object.entries(ROLES).map(([k, r]) => `<button class="rolecard" data-r="${k}" style="--c:${r.color}"><span class="ri">${r.icon}</span><b>${r.name}</b><small>${esc(r.ab)} · ${esc(r.desc)}</small></button>`).join(""); $$(".rolecard", rl).forEach(b => b.onclick = () => { beep(700, .06, "triangle"); post("/api/role", { ...creds(), role: b.dataset.r }); }); }
      $$(".rolecard", rl).forEach(b => b.classList.toggle("sel", b.dataset.r === mine));
    }
  } else if (s.phase === "reveal" || s.phase === "mgres") { /* nada */ }
}
function pAnsweredView() { return `<div class="done"><svg class="bigcheck" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48"/><path d="M28 52 L44 68 L74 34"/></svg><h2>¡Respuesta enviada!</h2><p class="mut">Esperando al resto del equipo…</p></div>`; }
async function submitAnswer(a, auto) {
  if (PQ.locked && !auto) return; PQ.locked = true;
  const r = await post("/api/answer", { ...creds(), a });
  const box = $("#inp"); if (!box) return;
  if (r.ok) { navigator.vibrate?.(30); beep(520, .08, "triangle"); box.innerHTML = pAnsweredView(); }
  else if (r.d.error === "closed") box.innerHTML = `<div class="done"><h2>¡Se acabó el tiempo!</h2></div>`;
  else if (r.d.error === "already") box.innerHTML = pAnsweredView();
  else { PQ.locked = false; toast("No se pudo enviar. Inténtalo otra vez."); }
}
function playQuestion() {
  const s = ST, q = s.q; PQ = { locked: !!s.me?.answered, sel: null };
  view(`<div class="top"><div class="row">${filmChip(FILMS[q.film])}<span class="chip dark">${s.idx + 1}/${s.total}</span></div>${ringHTML()}</div>
    ${q.type === "tf" ? "" : qBody(q)}<div id="inp" style="display:grid;gap:12px"></div><div class="lights" id="lights"></div><div class="gap-dock"></div>`);
  const box = $("#inp");
  if (PQ.locked) box.innerHTML = pAnsweredView(); else ({ mc: mountChoice, img: mountChoice, imgopt: mountChoice, tf: mountSwipe, multi: mountMulti, type: mountType, slider: mountSlider, order: mountOrder, match: mountMatch })[q.type](box, q);
  startQTimer(); updateLights(); applyHidden();
  PQ.onTick = rem => { if (rem <= 0 && !PQ.locked) { PQ.locked = true; const auto = PQ.auto?.(); if (auto !== undefined) submitAnswer(auto, true); else box.innerHTML = `<div class="done"><h2>¡Se acabó el tiempo!</h2></div>`; PQ.onTick = null; } };
}
function mountChoice(box, q) {
  if (q.type === "imgopt") box.innerHTML = `<div class="opts one">${q.imgs.map((u, i) => `<button class="opt imgtile" style="--i:${i}" data-i="${i}" aria-label="${esc(q.alts[i])}"><img src="${esc(A(u))}" alt=""><span class="letter" style="background:${COLORS[i]}">${"ABC"[i]}</span></button>`).join("")}</div>`;
  else box.innerHTML = `<div class="opts one">${q.opts.map((o, i) => `<button class="opt c${i}" style="--i:${i}" data-i="${i}">${shapeSVG(i)}<span class="t">${esc(o)}</span></button>`).join("")}</div>`;
  $$("button.opt", box).forEach(b => b.onclick = () => { $$("button.opt", box).forEach(x => x.setAttribute("aria-pressed", String(x === b))); submitAnswer(+b.dataset.i); });
}
function mountSwipe(box, q) {
  box.innerHTML = `<div class="swipe-wrap"><div class="stamp l">FALSO</div><div class="stamp r">VERDADERO</div><div class="scard" id="sc"><small>Verdadero o falso</small>${esc(q.text)}<small>← Falso · Verdadero →</small></div></div>
    <div class="opts"><button class="opt c0" id="bf">${shapeSVG(0)}<span class="t">Falso</span></button><button class="opt c1" id="bt">${shapeSVG(1)}<span class="t">Verdadero</span></button></div>`;
  const card = $("#sc"), sl = $(".stamp.l", box), sr = $(".stamp.r", box); let x0 = 0, dx = 0, drag = false;
  const fly = dir => { if (PQ.locked) return; card.style.transition = "transform .35s ease-in"; card.style.transform = `translateX(${dir * 140}%) rotate(${dir * 30}deg)`; submitAnswer(dir > 0 ? 0 : 1); };
  card.onpointerdown = e => { if (PQ.locked) return; drag = true; x0 = e.clientX; card.setPointerCapture(e.pointerId); card.classList.add("drag"); };
  card.onpointermove = e => { if (!drag) return; dx = e.clientX - x0; card.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`; const k = Math.min(1, Math.abs(dx) / 110); sr.style.opacity = dx > 0 ? k : 0; sl.style.opacity = dx < 0 ? k : 0; };
  const end = () => { if (!drag) return; drag = false; card.classList.remove("drag"); if (Math.abs(dx) > 110) fly(dx > 0 ? 1 : -1); else { card.style.transform = ""; sr.style.opacity = sl.style.opacity = 0; } dx = 0; };
  card.onpointerup = end; card.onpointercancel = end; $("#bt").onclick = () => fly(1); $("#bf").onclick = () => fly(-1);
}
function mountMulti(box, q) {
  PQ.sel = [];
  box.innerHTML = `<div class="hint">Marca todas las que correspondan</div><div class="opts one">${q.opts.map((o, i) => `<button class="opt c${i}" style="--i:${i}" data-i="${i}" aria-pressed="false">${shapeSVG(i)}<span class="t">${esc(o)}</span></button>`).join("")}</div><div class="sticky-act"><button class="btn big pink" id="send" disabled>Enviar</button></div>`;
  $$("button.opt", box).forEach(b => b.onclick = () => { if (PQ.locked) return; const i = +b.dataset.i, on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(on)); PQ.sel = on ? [...PQ.sel, i] : PQ.sel.filter(x => x !== i); $("#send").disabled = !PQ.sel.length; beep(on ? 700 : 500, .05, "triangle", .03); });
  $("#send").onclick = () => submitAnswer([...PQ.sel].sort((a, b) => a - b)); PQ.auto = () => PQ.sel.length ? [...PQ.sel].sort((a, b) => a - b) : undefined;
}
function mountType(box) {
  box.innerHTML = `<input class="field" id="txt" placeholder="Escribe tu respuesta" autocomplete="off" autocapitalize="words" maxlength="40"><button class="btn big pink" id="send">Enviar</button>`;
  const go = () => { const v = $("#txt").value.trim(); if (v) submitAnswer(v); };
  $("#send").onclick = go; $("#txt").onkeydown = e => { if (e.key === "Enter") go(); }; $("#txt").oninput = () => beep(900 + Math.random() * 200, .02, "square", .01); PQ.auto = () => $("#txt")?.value.trim() || undefined;
}
function mountSlider(box, q) {
  const mid = Math.round((q.min + q.max) / 2); PQ.sel = mid;
  box.innerHTML = `<div class="slider-box"><div class="slider-val" id="sv">${mid}</div><input type="range" id="rg" min="${q.min}" max="${q.max}" step="${q.step}" value="${mid}" aria-label="Tu respuesta"><div class="row between mut"><span>${q.min}</span><span>${q.max}</span></div><button class="btn big pink" id="send">Enviar</button></div>`;
  $("#rg").oninput = e => { PQ.sel = +e.target.value; const v = $("#sv"); v.textContent = PQ.sel; v.style.transform = "scale(1.08)"; setTimeout(() => v.style.transform = "", 90); beep(300 + (PQ.sel - q.min) / (q.max - q.min) * 600, .03, "triangle", .02); navigator.vibrate?.(5); };
  $("#send").onclick = () => submitAnswer(PQ.sel); PQ.auto = () => PQ.sel;
}
function mountOrder(box, q) {
  const n = q.opts.length, Hh = 64, gap = 10, order = q.opts.map((_, i) => i);
  box.innerHTML = `<div class="hint">Arrastra las tarjetas para ordenarlas</div><div class="olist" style="height:${n * (Hh + gap)}px">${q.opts.map((t, i) => `<div class="oi" data-i="${i}"><span class="grip">⠿</span><span class="pos"></span><span class="ot">${esc(t)}</span></div>`).join("")}</div><div class="sticky-act"><button class="btn big pink" id="send">Enviar orden</button></div>`;
  const els = $$(".oi", box);
  const layout = skip => order.forEach((idx, pos) => { const el = els[idx]; el.querySelector(".pos").textContent = pos + 1; if (el !== skip) el.style.transform = `translateY(${pos * (Hh + gap)}px)`; });
  layout();
  els.forEach(el => el.onpointerdown = e => {
    if (PQ.locked) return; el.setPointerCapture(e.pointerId); const idx = +el.dataset.i, y0 = e.clientY, p0 = order.indexOf(idx); el.classList.add("drag"); beep(500, .05, "triangle", .03);
    const move = ev => { let y = p0 * (Hh + gap) + (ev.clientY - y0); y = Math.max(0, Math.min(y, (n - 1) * (Hh + gap))); el.style.transform = `translateY(${y}px) scale(1.03)`; const np = Math.round(y / (Hh + gap)), cur = order.indexOf(idx); if (np !== cur) { order.splice(cur, 1); order.splice(np, 0, idx); layout(el); beep(420 + np * 60, .04, "sine", .03); navigator.vibrate?.(8); } };
    const up = () => { el.classList.remove("drag"); layout(); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); };
    el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  });
  $("#send").onclick = () => submitAnswer([...order]); PQ.auto = () => [...order];
}
function mountMatch(box, q) {
  const n = q.left.length, pairs = Array(n).fill(-1); let sel = null;
  box.innerHTML = `<div class="hint">Toca un elemento de la izquierda y luego su pareja</div><div class="match" id="mt"><svg class="lines" id="ln"></svg><div style="display:grid;gap:12px">${q.left.map((l, i) => `<button class="mi" data-l="${i}">${esc(l)}</button>`).join("")}</div><div style="display:grid;gap:12px">${q.right.map((r, j) => `<button class="mi" data-r="${j}">${esc(r)}</button>`).join("")}</div></div><div class="sticky-act"><button class="btn big pink" id="send" disabled>Enviar</button></div>`;
  const mt = $("#mt"), L = $$("[data-l]", box), R = $$("[data-r]", box), ln = $("#ln");
  const paint = () => {
    L.forEach((b, i) => { b.classList.toggle("sel", sel === i); const j = pairs[i]; b.classList.toggle("linked", j >= 0); b.style.background = j >= 0 ? COLORS[i] : ""; });
    R.forEach((b, j) => { const li = pairs.indexOf(j); b.classList.toggle("linked", li >= 0); b.style.background = li >= 0 ? COLORS[li] : ""; });
    const mr = mt.getBoundingClientRect(); ln.setAttribute("viewBox", `0 0 ${mr.width} ${mr.height}`);
    ln.innerHTML = pairs.map((j, i) => { if (j < 0) return ""; const a = L[i].getBoundingClientRect(), b = R[j].getBoundingClientRect(), x1 = a.right - mr.left, y1 = a.top + a.height / 2 - mr.top, x2 = b.left - mr.left, y2 = b.top + b.height / 2 - mr.top, mx = (x1 + x2) / 2; return `<path d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}" stroke="${COLORS[i]}"/>`; }).join("");
    $("#send").disabled = pairs.includes(-1);
  };
  L.forEach((b, i) => b.onclick = () => { if (PQ.locked) return; if (pairs[i] >= 0) { pairs[i] = -1; sel = i; } else sel = sel === i ? null : i; beep(600, .04, "triangle", .03); paint(); });
  R.forEach((b, j) => b.onclick = () => { if (PQ.locked || sel === null) return; const prev = pairs.indexOf(j); if (prev >= 0) pairs[prev] = -1; pairs[sel] = j; sel = null; beep(800, .06, "triangle", .04); navigator.vibrate?.(10); paint(); });
  paint(); PQ.auto = () => pairs.includes(-1) ? undefined : [...pairs]; $("#send").onclick = () => submitAnswer([...pairs]);
  addEventListener("resize", paint);
}
function playResult() {
  const s = ST, rv = s.reveal, r = s.me?.result, t = rv.team;
  let cls = "none", h = "Sin respuesta", sub = "No alcanzaste a responder.";
  if (r) { if (r.ok === 1) { cls = "ok"; h = "¡Acertaste!"; sub = "Aportaste al equipo"; } else if (r.ok === 0.5) { cls = "part"; h = "¡Casi!"; sub = `Acertaste el ${r.f}%.`; } else if (r.ok === 0) { cls = "bad"; h = "Esta vez no"; sub = "El equipo cuenta contigo en la siguiente."; } }
  view(`${teamBanner(t, rv.spot)}<div class="res-hero ${cls}" style="padding:16px"><h2 style="font-size:1.8rem">${h}</h2><div>${sub}</div>${r ? `<div class="pts" style="font-size:2rem">+${r.pts}</div>` : ""}</div>
    <div class="card"><div class="mut">Respuesta correcta</div><div style="font-family:var(--font-display);font-size:1.5rem;overflow-wrap:anywhere">${esc(rv.ctext)}</div><p class="mut" style="margin:6px 0 0">${esc(rv.expl)}</p></div><div class="gap-dock"></div>`);
  countUp($("#pp"), 0, t.gain, 900);
  jingle(t.pass); navigator.vibrate?.(t.pass ? [40, 40, 40] : 140); if (t.pass) confetti(80, { x: innerWidth / 2, y: innerHeight * .2 });
}
function playMg() {
  const s = ST, m = s.mg; let started = false;
  view(`${mgHead()}<div id="mgarea"></div><div class="fuse" id="fuse"><i></i><u></u><b id="fusel"></b></div>${m.boss ? bossBar() : ""}<div class="lights" id="mates">${matesHTML()}</div>`);
  whoosh(); updateMgLive();
  startMgLoop(pre => {
    if (started || pre > 0) return; started = true; $("#verb")?.classList.add("small"); $("#cd").textContent = "";
    MGCTL = KMG.run($("#mgarea"), m, { faces: ST.players.filter(p => p.avatar).map(p => ({ avatar: p.avatar, name: p.name })), rem: () => Math.max(0, ST.endsAt - nowS()), beep: mgBeep, onResult: ok => post("/api/mg", { ...creds(), ok }), onProg: n => post("/api/prog", { ...creds(), v: n }) });
  });
}
function playMgres() {
  const s = ST;
  view(`${mgresBanner()}<div class="lights" id="mates">${matesHTML()}</div><div class="gap-dock"></div>`);
  $$("#mates .av").forEach(a => { const p = s.players.find(x => x.id === a.dataset.pid); a.classList.toggle("on", s.mgres.boss || (p?.done && p.ok)); a.classList.toggle("no", !s.mgres.boss && !(p?.done && p.ok)); });
  countUp($("#pp"), 0, s.mgres.gain, 900); jingle(s.mgres.pass); if (s.mgres.pass) confetti(s.mgres.boss ? 160 : 60, { x: innerWidth / 2, y: innerHeight * .2 });
}
function playEnd() {
  const s = ST, me = s.players.find(p => p.id === S.id);
  view(`<div class="res-hero ${s.win ? "ok" : "bad"}"><h1 style="font-size:clamp(2rem,9vw,3.4rem)">${s.win ? "¡FUNCIÓN COMPLETADA!" : "¡SE CORTÓ LA FUNCIÓN!"}</h1>${starsHTML(s.stars)}<div class="pts"><span id="pp">0</span> pts</div><div>${me ? `Tú aportaste ${me.score} pts` : ""}</div></div>
    ${awardsHTML()}<p class="hint">Si el organizador reinicia, volverás a la sala con tu equipo.</p>
    <div class="row center"><button class="btn ghost" id="home">Salir</button></div><div class="gap-dock"></div>`);
  countUp($("#pp"), 0, s.score, 1800); if (s.win) { confetti(220); } jingle(s.win);
  $("#home").onclick = () => { sess.set("kms-play", null); leave(); };
}

/* ================= arranque ================= */
document.addEventListener("keydown", e => {
  if (S.role !== "host" || !ST || /INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return;
  if (e.key === " " || e.key === "Enter") { const b = $("#next") || (ST.phase === "lobby" ? $("#start") : null); if (b && !b.disabled) { e.preventDefault(); b.click(); } }
});
addEventListener("hashchange", () => { if (!S.role && location.hash === "#host") hostEntry(); });
if (location.hash === "#host") hostEntry(); else { const pin = new URLSearchParams(location.search).get("pin"); const sv = sess.get("kms-play"); if (sv && !pin) { S.role = "play"; S.code = sv.code; S.id = sv.id; S.token = sv.token; S.name = sv.name; connect(); view(`<div class="done"><div class="spin"></div><p>Volviendo a la sala…</p></div>`); } else landing(); }

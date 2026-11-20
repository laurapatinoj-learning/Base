"use strict";
/**
 * KMS Movies · "Get it together": trivia cooperativa con microjuegos.
 * Sin dependencias: Node 18+ (http + Server-Sent Events).
 *
 *   PORT=3000 HOST_PASSWORD=secreto node server.js
 *
 * El servidor es la fuente de verdad: guarda las respuestas correctas, califica,
 * lleva las vidas del equipo, mide el tiempo y limita cada sala a 15 jugadores.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { FILMS, BANK, ORDER } = require("./questions");

const PORT = +process.env.PORT || 3000;
const HOST_PASSWORD = process.env.HOST_PASSWORD || "";
const MAX_PLAYERS = 15;
const MAX_ROOMS = 50;
const START_HEARTS = 4, MAX_HEARTS = 5, MAX_SHIELD = 2;
const PUBLIC = path.join(__dirname, "public");
const BY_ID = Object.fromEntries(BANK.map(q => [q.id, q]));
const COLORS = ["#ff7aa8", "#ffc21a", "#22d3ee", "#7cf24a", "#c4a1ff", "#ff9a5c", "#5eead4", "#f9a8d4", "#93c5fd", "#fde047", "#fb7185", "#a3e635", "#67e8f9", "#fdba74", "#d8b4fe"];
const rooms = new Map();

/* Personajes con una habilidad de apoyo que cada jugador usa una vez por función. */
const AVATARS = 13; // caras en public/img/caras/cara-01.png a cara-13.png
const ROLES = ["director", "guionista", "productor", "doble", "compositor"];
/* Microjuegos: duración base en ms. Los jefes los juega todo el equipo sobre una misma barra. */
const MGS = [
  { id: "tap", base: 5500 }, { id: "catch", base: 6500 }, { id: "swipe", base: 4000 }, { id: "timing", base: 4500 },
  { id: "dodge", base: 6000 }, { id: "odd", base: 5500 }, { id: "alt", base: 5500 }, { id: "memory", base: 7500 },
  { id: "count", base: 6000 }, { id: "sum", base: 5500 }
];
const BOSSES = [{ id: "teamtap", base: 10000 }, { id: "teamalt", base: 10000 }];

/* ---------- utilidades ---------- */
const rid = (n = 12) => crypto.randomBytes(n).toString("base64url");
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const clean = s => String(s || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim();
const pick = a => a[Math.floor(Math.random() * a.length)];
function newCode() { let c; do { c = String(Math.floor(100000 + Math.random() * 900000)); } while (rooms.has(c)); return c; }

/* ---------- plan de la función ---------- */
const SHORT = { poeta: ["p1", "p2", "p5"], contador: ["c1", "c3", "m2"], tropic: ["t1", "t3", "t4"], mix: ["i1", "m1"] };
const filmIds = k => ORDER.filter(id => BY_ID[id].film === k);
/** Alterna pregunta y microjuego; cada película cierra con un jefe de equipo. */
function buildPlan(films, mode) {
  const sel = ["poeta", "contador", "tropic"].filter(k => films[k]);
  if (!sel.length) return [];
  const blocks = sel.map(k => [k, mode === "quick" ? SHORT[k] : filmIds(k)]);
  if (sel.length >= 2) blocks.push(["mix", mode === "quick" ? SHORT.mix : filmIds("mix")]);
  const plan = []; let last = null, bossN = 0;
  const mg = () => { const m = pick(MGS.filter(x => x.id !== last)); last = m.id; return m.id; };
  blocks.forEach(([film, ids]) => {
    ids.forEach((id, i) => { plan.push({ kind: "q", id, film }); if (i < ids.length - 1) plan.push({ kind: "mg", mg: mg(), film }); });
    plan.push({ kind: "mg", boss: true, mg: BOSSES[bossN++ % BOSSES.length].id, film });
  });
  plan[plan.length - 1].final = true;
  return plan;
}

/* ---------- preguntas ---------- */
function publicQ(q, n) {
  const p = { n, id: q.id, film: q.film, type: q.type, text: q.text, dur: q.dur };
  if (q.img) p.img = q.img;
  if (q.type === "mc" || q.type === "multi" || q.type === "img") p.opts = q.opts;
  if (q.type === "tf") p.opts = ["Verdadero", "Falso"];
  if (q.type === "imgopt") { p.imgs = q.imgs; p.alts = q.alts; }
  if (q.type === "order") { let o; do { o = shuffle(q.items); } while (JSON.stringify(o) === JSON.stringify(q.items)); p.opts = o; }
  if (q.type === "match") { p.left = q.pairs.map(x => x[0]); p.right = shuffle(q.pairs.map(x => x[1])); }
  if (q.type === "slider") { p.min = q.min; p.max = q.max; p.step = q.step; }
  return p;
}
function answerText(q) {
  switch (q.type) {
    case "mc": case "img": return q.opts[q.c];
    case "imgopt": return q.alts[q.c];
    case "tf": return q.c ? "Verdadero" : "Falso";
    case "multi": return q.c.map(i => q.opts[i]).join(" · ");
    case "type": return q.ctext;
    case "slider": return String(q.ans);
    case "order": return q.items.join(" → ");
    case "match": return q.pairs.map(p => p[0] + " = " + p[1]).join(" · ");
    default: return "";
  }
}
function grade(q, pub, a) {
  if (a === undefined || a === null) return 0;
  switch (q.type) {
    case "mc": case "img": case "imgopt": return a === q.c ? 1 : 0;
    case "tf": return a === (q.c ? 0 : 1) ? 1 : 0;
    case "multi": { const cs = new Set(q.c); let h = 0, b = 0; (Array.isArray(a) ? a : []).forEach(i => cs.has(i) ? h++ : b++); return Math.max(0, (h - b) / cs.size); }
    case "type": return q.ans.includes(norm(a)) ? 1 : 0;
    case "slider": return Math.max(0, 1 - Math.abs(Number(a) - q.ans) / q.tol);
    case "order": return JSON.stringify(a) === JSON.stringify(q.items.map(t => pub.opts.indexOf(t))) ? 1 : 0;
    case "match": { let ok = 0; q.pairs.forEach((p, i) => { if (pub.right[a[i]] === p[1]) ok++; }); return ok / q.pairs.length; }
    default: return 0;
  }
}
function validAnswer(q, pub, a) {
  const int = (v, max) => Number.isInteger(v) && v >= 0 && v < max;
  switch (q.type) {
    case "mc": case "img": case "tf": return int(a, pub.opts.length);
    case "imgopt": return int(a, pub.imgs.length);
    case "multi": return Array.isArray(a) && a.length <= pub.opts.length && a.every(i => int(i, pub.opts.length));
    case "type": return typeof a === "string" && a.length > 0 && a.length <= 60;
    case "slider": return typeof a === "number" && isFinite(a);
    case "order": return Array.isArray(a) && a.length === pub.opts.length && new Set(a).size === a.length && a.every(i => int(i, pub.opts.length));
    case "match": return Array.isArray(a) && a.length === pub.left.length && a.every(i => i === -1 || int(i, pub.right.length));
    default: return false;
  }
}
function correctView(q, pub) {
  switch (q.type) {
    case "mc": case "img": case "imgopt": return { idx: [q.c] };
    case "tf": return { idx: [q.c ? 0 : 1] };
    case "multi": return { idx: q.c };
    case "order": return { order: q.items.map(t => pub.opts.indexOf(t)) };
    case "match": return { match: q.pairs.map(p => pub.right.indexOf(p[1])) };
    case "slider": return { value: q.ans };
    default: return {};
  }
}

/* ---------- salas ---------- */
function createRoom(films, mode) {
  const plan = buildPlan(films, mode);
  if (!plan.length) return null;
  const room = {
    code: newCode(), hostToken: rid(), cfg: { films, mode }, plan, players: new Map(), hostRes: new Set(),
    timer: null, early: null, pushT: null, touched: Date.now(), created: Date.now()
  };
  resetRoom(room);
  rooms.set(room.code, room);
  return room;
}
function resetRoom(room) {
  clearT(room);
  Object.assign(room, {
    phase: "lobby", idx: -1, film: null, pub: null, reveal: null, mg: null, mgres: null, qStart: 0, startsAt: 0, endsAt: 0, nextAt: 0,
    hearts: START_HEARTS, shield: 0, score: 0, combo: 0, mgCount: 0, fan: false, hold: false, dead: false, win: false, hidden: [], awards: null, stars: 0
  });
  room.plan = buildPlan(room.cfg.films, room.cfg.mode);
  room.players.forEach(p => Object.assign(p, { score: 0, ans: undefined, rt: 0, result: null, used: false, done: false, ok: false, prog: 0, wins: 0, rtSum: 0, rtN: 0, lastPts: 0 }));
}
const connected = p => p.res.size > 0;
function stateFor(room, viewer /* "host" | player */) {
  const st = {
    now: Date.now(), code: room.code, phase: room.phase, idx: room.idx, total: room.plan.length, film: room.film, endsAt: room.endsAt, startsAt: room.startsAt,
    max: MAX_PLAYERS, hearts: room.hearts, maxHearts: MAX_HEARTS, shield: room.shield, score: room.score, combo: room.combo, mult: mult(room), fan: room.fan,
    hold: room.hold, nextAt: room.nextAt, item: room.plan[room.idx] ? { kind: room.plan[room.idx].kind, boss: !!room.plan[room.idx].boss, final: !!room.plan[room.idx].final } : null,
    q: room.phase === "q" || room.phase === "reveal" ? { ...room.pub, hidden: room.hidden } : null,
    reveal: room.phase === "reveal" ? room.reveal : null,
    mg: room.phase === "mg" || room.phase === "mgres" ? { ...room.mg, prog: totalProg(room) } : null,
    mgres: room.phase === "mgres" ? room.mgres : null,
    players: [...room.players.values()].map(p => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar, role: p.role, used: p.used, score: p.score, answered: p.ans !== undefined, done: p.done, ok: p.ok, on: connected(p), wins: p.wins }))
  };
  if (room.phase === "film") st.filmInfo = FILMS[room.film];
  if (room.phase === "end") { st.win = room.win; st.awards = room.awards; st.stars = room.stars; }
  if (viewer !== "host") st.me = { id: viewer.id, role: viewer.role, used: viewer.used, answered: viewer.ans !== undefined, done: viewer.done, ok: viewer.ok, result: room.phase === "reveal" ? viewer.result : null };
  return st;
}
const mult = room => (room.fan ? 2 : 1) * (1 + Math.min(room.combo, 5) * 0.1);
const totalProg = room => [...room.players.values()].reduce((a, p) => a + (p.prog || 0), 0);
function send(res, event, data) { try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch (e) { /* conexión cerrada */ } }
function push(room) {
  room.touched = Date.now();
  room.hostRes.forEach(r => send(r, "state", stateFor(room, "host")));
  room.players.forEach(p => { const s = stateFor(room, p); p.res.forEach(r => send(r, "state", s)); });
}
function queuePush(room) { if (room.pushT) return; room.pushT = setTimeout(() => { room.pushT = null; push(room); }, 220); }
function broadcast(room, event, data) { room.hostRes.forEach(r => send(r, event, data)); room.players.forEach(p => p.res.forEach(r => send(r, event, data))); }
const clearT = room => { clearTimeout(room.timer); clearTimeout(room.early); room.timer = room.early = null; };
const later = (room, ms, fn) => { clearTimeout(room.timer); room.timer = setTimeout(fn, ms); };

/** Resta una vida al equipo; el escudo del Productor la absorbe. */
function loseHeart(room) {
  if (room.shield > 0) { room.shield--; return { shieldUsed: true, heartLost: false }; }
  room.hearts--; if (room.hearts <= 0) room.dead = true;
  return { shieldUsed: false, heartLost: true };
}
/** Después de un resultado: avanza solo, salvo que el organizador pause. */
function scheduleNext(room, ms) {
  if (room.dead) { room.nextAt = Date.now() + 4200; later(room, 4200, () => finish(room, false)); return; }
  if (room.hold) { room.nextAt = 0; return; }
  room.nextAt = Date.now() + ms; later(room, ms, () => advance(room));
}

function startGame(room) {
  if (room.phase !== "lobby" || !room.players.size) return;
  room.plan = buildPlan(room.cfg.films, room.cfg.mode);
  advance(room);
}
function advance(room) {
  clearT(room); room.nextAt = 0;
  if (room.dead) return finish(room, false);
  room.idx++;
  if (room.idx >= room.plan.length) return finish(room, true);
  const it = room.plan[room.idx], prev = room.film;
  room.film = it.film;
  if (prev !== it.film) { room.phase = "film"; room.endsAt = Date.now() + 4200; push(room); later(room, 4200, () => openItem(room)); }
  else openItem(room);
}
function openItem(room) { const it = room.plan[room.idx]; if (it.kind === "q") openQuestion(room, it); else openMg(room, it); }

/* ---- preguntas ---- */
function openQuestion(room, it) {
  clearT(room); const q = BY_ID[it.id];
  room.pub = publicQ(q, room.idx); room.hidden = [];
  room.players.forEach(p => { p.ans = undefined; p.result = null; p.lastPts = 0; });
  room.phase = "q"; room.qStart = Date.now(); room.endsAt = room.qStart + q.dur * 1000;
  push(room); later(room, q.dur * 1000 + 400, () => reveal(room));
}
function checkAllAnswered(room) {
  if (room.phase !== "q" || room.early) return;
  const active = [...room.players.values()].filter(connected);
  if (active.length && active.every(p => p.ans !== undefined)) room.early = setTimeout(() => reveal(room), 900);
}
function reveal(room) {
  if (room.phase !== "q") return;
  clearT(room);
  const q = BY_ID[room.pub.id], pub = room.pub, n = room.players.size;
  const dist = pub.opts && q.type !== "order" ? pub.opts.map(() => 0) : pub.imgs ? pub.imgs.map(() => 0) : null;
  let right = 0, answered = 0, sum = 0, nn = 0, raw = 0, fsum = 0;
  room.players.forEach(p => {
    p.lastPts = 0;
    if (p.ans === undefined) { p.result = { ok: -1, pts: 0, f: 0 }; return; }
    answered++;
    if (dist) { if (Array.isArray(p.ans)) { if (q.type === "multi") p.ans.forEach(i => dist[i]++); } else if (dist[p.ans] !== undefined) dist[p.ans]++; }
    if (q.type === "slider") { sum += p.ans; nn++; }
    const f = grade(q, pub, p.ans), full = f >= 0.99;
    const rt = Math.min(Math.max(p.rt, 0), pub.dur * 1000);
    const pts = Math.round(Math.round(1000 * (1 - (rt / (pub.dur * 1000)) / 2)) * f);
    fsum += f; if (full) right++;
    raw += pts; p.lastPts = pts; p.rtSum += rt; p.rtN++;
    p.result = { ok: full ? 1 : f > 0 ? 0.5 : 0, pts, f: Math.round(f * 100) };
  });
  const teamF = n ? fsum / n : 0, pass = teamF >= 0.5, m = mult(room);
  let gain = 0, loss = { shieldUsed: false, heartLost: false };
  if (pass) { gain = Math.round(raw * m); room.score += gain; room.players.forEach(p => { p.score += p.lastPts; }); room.combo++; room.fan = false; }
  else { room.combo = 0; loss = loseHeart(room); }
  room.reveal = { total: n, answered, right, dist, avg: nn ? Math.round(sum / nn) : null, ctext: answerText(q), expl: q.expl || "", correct: correctView(q, pub), team: { pass, pct: Math.round(teamF * 100), gain, mult: Math.round(m * 10) / 10, ...loss } };
  room.phase = "reveal"; room.endsAt = 0;
  push(room); scheduleNext(room, 7500);
}

/* ---- microjuegos ---- */
function openMg(room, it) {
  clearT(room);
  const def = [...MGS, ...BOSSES].find(m => m.id === it.mg), level = room.mgCount, n = Math.max(1, room.players.size);
  const dur = Math.round(def.base * (it.boss ? 1 : Math.max(0.62, 1 - 0.045 * level)));
  const per = it.final ? 22 : 12 + Math.min(level, 8);
  room.mg = { id: it.mg, level, dur, boss: !!it.boss, final: !!it.final, goal: it.boss ? Math.ceil(n * per * 0.9) : 0, seed: Math.floor(Math.random() * 1e9) };
  room.players.forEach(p => { p.done = false; p.ok = false; p.prog = 0; });
  room.phase = "mg"; room.startsAt = Date.now() + 2300; room.endsAt = room.startsAt + dur;
  push(room); later(room, dur + 2300 + 700, () => finishMg(room));
}
function checkMgDone(room) {
  if (room.phase !== "mg" || room.mg.boss || room.early) return;
  const active = [...room.players.values()].filter(connected);
  if (active.length && active.every(p => p.done)) room.early = setTimeout(() => finishMg(room), 900);
}
function finishMg(room) {
  if (room.phase !== "mg") return;
  clearT(room);
  const mg = room.mg, n = room.players.size, m = mult(room);
  let pass, succ = 0, total = 0, raw = 0, bonusHeart = false;
  if (mg.boss) {
    total = totalProg(room); pass = total >= mg.goal; raw = pass ? 1500 + total * 8 : total * 4;
  } else {
    room.players.forEach(p => { if (p.ok) { succ++; const pts = Math.round(300 * (1 + 0.1 * mg.level)); p.score += pts; p.wins++; p.lastPts = pts; raw += pts; } });
    pass = n > 0 && succ / n >= 0.5;
  }
  let gain = 0, loss = { shieldUsed: false, heartLost: false };
  if (pass) { gain = Math.round(raw * m); room.score += gain; room.combo++; room.mgCount++; room.fan = false; if (mg.boss && room.hearts < MAX_HEARTS) { room.hearts++; bonusHeart = true; } if (mg.boss) room.players.forEach(p => { p.score += 400; p.wins++; }); }
  else { room.combo = 0; loss = loseHeart(room); }
  room.mgres = { pass, succ, n, total, goal: mg.goal, boss: mg.boss, gain, mult: Math.round(m * 10) / 10, bonusHeart, ...loss };
  room.phase = "mgres"; room.endsAt = 0;
  push(room); scheduleNext(room, 4800);
}

/* ---- final ---- */
function finish(room, win) {
  clearT(room); room.phase = "end"; room.win = win; room.nextAt = 0; room.endsAt = 0;
  const ps = [...room.players.values()];
  const best = (key, f) => ps.filter(p => f(p) > 0).sort((a, b) => f(b) - f(a))[0];
  const fast = ps.filter(p => p.rtN).sort((a, b) => a.rtSum / a.rtN - b.rtSum / b.rtN)[0];
  const top = best("s", p => p.score), star = best("w", p => p.wins);
  room.awards = [
    top && { title: "Máximo anotador", name: top.name, color: top.color, avatar: top.avatar, note: top.score + " pts" },
    fast && { title: "Gatillo más rápido", name: fast.name, color: fast.color, avatar: fast.avatar, note: (fast.rtSum / fast.rtN / 1000).toFixed(1) + " s en promedio" },
    star && { title: "Estrella de los microjuegos", name: star.name, color: star.color, avatar: star.avatar, note: star.wins + " superados" }
  ].filter(Boolean);
  room.stars = win ? (room.hearts >= 4 ? 3 : room.hearts >= 2 ? 2 : 1) : 0;
  push(room);
}

/* ---------- habilidades ---------- */
const ABILITIES = {
  director: { label: "¡Acción! +8 s para todos", phases: ["q", "mg"], run(room) {
    room.endsAt += 8000;
    if (room.phase === "q") later(room, room.endsAt - Date.now() + 400, () => reveal(room)); else later(room, room.endsAt - Date.now() + 700, () => finishMg(room));
    return true;
  } },
  guionista: { label: "Pista: quita opciones incorrectas", phases: ["q"], run(room) {
    const q = BY_ID[room.pub.id]; if (!["mc", "img", "imgopt", "multi"].includes(q.type)) return false;
    const total = (room.pub.opts || room.pub.imgs).length, good = new Set(q.type === "multi" ? q.c : [q.c]);
    const wrong = shuffle([...Array(total).keys()].filter(i => !good.has(i) && !room.hidden.includes(i)));
    const k = Math.min(2, wrong.length - (q.type === "multi" ? 0 : 1)); if (k <= 0) return false;
    room.hidden = [...room.hidden, ...wrong.slice(0, k)]; return true;
  } },
  productor: { label: "Seguro: el equipo absorbe el próximo fallo", phases: ["q", "reveal", "mg", "mgres", "film"], run(room) { if (room.shield >= MAX_SHIELD) return false; room.shield++; return true; } },
  doble: { label: "Corazón: +1 vida", phases: ["q", "reveal", "mg", "mgres", "film"], run(room) { if (room.hearts >= MAX_HEARTS) return false; room.hearts++; return true; } },
  compositor: { label: "Fanfarria: puntos dobles en lo siguiente", phases: ["q", "reveal", "mg", "mgres", "film"], run(room) { if (room.fan) return false; room.fan = true; return true; } }
};

/* ---------- API ---------- */
function json(res, code, obj) { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(obj)); }
function body(req) {
  return new Promise((ok, no) => {
    let b = ""; req.on("data", d => { b += d; if (b.length > 20000) { no(new Error("too big")); req.destroy(); } });
    req.on("end", () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { no(e); } });
  });
}
const hostOf = (code, token) => { const r = rooms.get(String(code)); return r && token && r.hostToken === token ? r : null; };
const playerOf = (code, id, token) => { const r = rooms.get(String(code)); const p = r?.players.get(id); return p && p.token === token ? { room: r, p } : null; };
const lastReact = new Map();
const freeAvatars = room => { const used = new Set([...room.players.values()].map(p => p.avatar)); return [...Array(AVATARS).keys()].map(i => i + 1).filter(i => !used.has(i)); };
const roleCount = room => { const c = Object.fromEntries(ROLES.map(r => [r, 0])); room.players.forEach(p => c[p.role]++); return c; };

async function api(req, res, url) {
  const route = url.pathname;
  if (req.method === "GET" && route === "/api/info") return json(res, 200, { films: FILMS, max: MAX_PLAYERS, avatars: AVATARS, needsPassword: !!HOST_PASSWORD, roles: ROLES, plan: { full: buildPlan({ poeta: 1, contador: 1, tropic: 1 }, "full").length, quick: buildPlan({ poeta: 1, contador: 1, tropic: 1 }, "quick").length } });
  if (req.method === "GET" && route === "/events") return sse(req, res, url);
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  let b; try { b = await body(req); } catch (e) { return json(res, 400, { error: "bad_request" }); }

  if (route === "/api/host/create") {
    if (HOST_PASSWORD && b.password !== HOST_PASSWORD) return json(res, 403, { error: "password" });
    if (rooms.size >= MAX_ROOMS) return json(res, 503, { error: "busy" });
    const room = createRoom(b.films || {}, b.mode === "quick" ? "quick" : "full");
    if (!room) return json(res, 400, { error: "no_questions" });
    return json(res, 200, { code: room.code, token: room.hostToken });
  }
  if (route === "/api/join") {
    const room = rooms.get(String(b.code || ""));
    if (!room) return json(res, 404, { error: "no_room" });
    if (room.phase !== "lobby") return json(res, 409, { error: "started" });
    if (room.players.size >= MAX_PLAYERS) return json(res, 409, { error: "full" });
    let name = clean(b.name).slice(0, 14); if (name.length < 2) return json(res, 400, { error: "name" });
    const names = new Set([...room.players.values()].map(p => p.name.toLowerCase()));
    const base = name; let k = 2; while (names.has(name.toLowerCase())) name = base.slice(0, 12) + " " + k++;
    const used = new Set([...room.players.values()].map(p => p.color)), rc = roleCount(room);
    const role = ROLES.slice().sort((a, c) => rc[a] - rc[c])[0];
    const fa = freeAvatars(room), avatar = fa.length ? pick(fa) : null;
    const p = { id: rid(6), token: rid(), name, avatar, color: COLORS.find(c => !used.has(c)) || COLORS[room.players.size % COLORS.length], role, used: false, score: 0, res: new Set(), ans: undefined, rt: 0, result: null, done: false, ok: false, prog: 0, wins: 0, rtSum: 0, rtN: 0, lastPts: 0 };
    room.players.set(p.id, p); push(room);
    return json(res, 200, { id: p.id, token: p.token, name, color: p.color, role, avatar });
  }
  if (route === "/api/role") {
    const o = playerOf(b.code, b.id, b.token); if (!o) return json(res, 403, { error: "auth" });
    if (o.room.phase !== "lobby" || !ROLES.includes(b.role)) return json(res, 409, { error: "role" });
    o.p.role = b.role; push(o.room); return json(res, 200, { ok: true });
  }
  if (route === "/api/avatar") {
    const o = playerOf(b.code, b.id, b.token); if (!o) return json(res, 403, { error: "auth" });
    const a = b.avatar;
    if (o.room.phase !== "lobby" || !Number.isInteger(a) || a < 1 || a > AVATARS) return json(res, 400, { error: "avatar" });
    if ([...o.room.players.values()].some(p => p.avatar === a && p.id !== o.p.id)) return json(res, 409, { error: "taken" });
    o.p.avatar = a; push(o.room); return json(res, 200, { ok: true });
  }
  if (route === "/api/answer") {
    const o = playerOf(b.code, b.id, b.token); if (!o) return json(res, 403, { error: "auth" });
    const { room, p } = o;
    if (room.phase !== "q" || Date.now() > room.endsAt + 600) return json(res, 409, { error: "closed" });
    if (p.ans !== undefined) return json(res, 409, { error: "already" });
    const q = BY_ID[room.pub.id];
    if (!validAnswer(q, room.pub, b.a)) return json(res, 400, { error: "invalid" });
    p.ans = b.a; p.rt = Date.now() - room.qStart;
    push(room); checkAllAnswered(room);
    return json(res, 200, { ok: true });
  }
  if (route === "/api/mg") {
    const o = playerOf(b.code, b.id, b.token); if (!o) return json(res, 403, { error: "auth" });
    const { room, p } = o;
    if (room.phase !== "mg" || room.mg.boss || Date.now() < room.startsAt - 300 || Date.now() > room.endsAt + 900) return json(res, 409, { error: "closed" });
    if (p.done) return json(res, 409, { error: "already" });
    p.done = true; p.ok = !!b.ok; push(room); checkMgDone(room);
    return json(res, 200, { ok: true });
  }
  if (route === "/api/prog") {
    const o = playerOf(b.code, b.id, b.token); if (!o) return json(res, 403, { error: "auth" });
    const { room, p } = o;
    if (room.phase !== "mg" || !room.mg.boss || Date.now() < room.startsAt - 300 || Date.now() > room.endsAt + 900) return json(res, 409, { error: "closed" });
    const v = Math.max(0, Math.min(500, Math.floor(+b.v || 0))); if (v > p.prog) p.prog = v;
    queuePush(room);
    if (totalProg(room) >= room.mg.goal && !room.early) room.early = setTimeout(() => finishMg(room), 500);
    return json(res, 200, { ok: true });
  }
  if (route === "/api/ability") {
    const o = playerOf(b.code, b.id, b.token); if (!o) return json(res, 403, { error: "auth" });
    const { room, p } = o, ab = ABILITIES[p.role];
    if (p.used) return json(res, 409, { error: "used" });
    if (!ab.phases.includes(room.phase)) return json(res, 409, { error: "phase" });
    if (!ab.run(room)) return json(res, 409, { error: "na" });
    p.used = true; broadcast(room, "ability", { name: p.name, color: p.color, role: p.role, label: ab.label }); push(room);
    return json(res, 200, { ok: true });
  }
  if (route === "/api/react") {
    const o = playerOf(b.code, b.id, b.token) || null;
    const room = o?.room || hostOf(b.code, b.token); if (!room) return json(res, 403, { error: "auth" });
    const who = o?.p.id || "host", now = Date.now();
    if (now - (lastReact.get(who) || 0) < 350) return json(res, 429, { error: "slow" });
    lastReact.set(who, now);
    const emoji = ["😂", "🔥", "👏", "😮", "🍿", "🎬", "😎", "❤️"].includes(b.emoji) ? b.emoji : null; if (!emoji) return json(res, 400, { error: "emoji" });
    broadcast(room, "react", { emoji, name: o?.p.name || "Organizador", color: o?.p.color || "#ffc21a", x: Math.random() });
    return json(res, 200, { ok: true });
  }
  if (route === "/api/host/action") {
    const room = hostOf(b.code, b.token); if (!room) return json(res, 403, { error: "auth" });
    switch (b.action) {
      case "start": startGame(room); break;
      case "skip":
        if (room.phase === "q") reveal(room); else if (room.phase === "mg") finishMg(room);
        else if (room.phase === "reveal" || room.phase === "mgres") { room.dead ? finish(room, false) : advance(room); }
        break;
      case "extend": if (room.phase === "q" || room.phase === "mg") ABILITIES.director.run(room), push(room); break;
      case "hold": room.hold = !room.hold; if (!room.hold && (room.phase === "reveal" || room.phase === "mgres")) scheduleNext(room, 1500); else if (room.hold) { clearTimeout(room.timer); room.nextAt = 0; } push(room); break;
      case "kick": { const p = room.players.get(String(b.id)); if (p && room.phase === "lobby") { p.res.forEach(r => { send(r, "kicked", {}); try { r.end(); } catch (e) {} }); room.players.delete(p.id); push(room); } break; }
      case "restart": if (room.phase === "end") { resetRoom(room); push(room); } break;
      case "end": finish(room, false); break;
      case "close": clearT(room); broadcast(room, "closed", {}); rooms.delete(room.code); break;
      default: return json(res, 400, { error: "action" });
    }
    return json(res, 200, { ok: true });
  }
  return json(res, 404, { error: "not_found" });
}

function sse(req, res, url) {
  const code = url.searchParams.get("code"), role = url.searchParams.get("role");
  const room = rooms.get(String(code));
  if (!room) { res.writeHead(404); return res.end(); }
  let who = null;
  if (role === "host") { if (!hostOf(code, url.searchParams.get("token"))) { res.writeHead(403); return res.end(); } }
  else { const o = playerOf(code, url.searchParams.get("id"), url.searchParams.get("token")); if (!o) { res.writeHead(403); return res.end(); } who = o.p; }
  res.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", Connection: "keep-alive", "X-Accel-Buffering": "no" });
  res.write("retry: 1500\n\n");
  (who ? who.res : room.hostRes).add(res);
  send(res, "state", stateFor(room, who || "host"));
  if (who) push(room);
  const ka = setInterval(() => { try { res.write(": ka\n\n"); } catch (e) {} }, 15000);
  req.on("close", () => { clearInterval(ka); (who ? who.res : room.hostRes).delete(res); if (who && rooms.has(room.code)) { push(room); if (room.phase === "q") checkAllAnswered(room); if (room.phase === "mg") checkMgDone(room); } });
}

/* ---------- archivos estáticos ---------- */
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm", ".ico": "image/x-icon", ".woff2": "font/woff2" };
function serve(req, res, url) {
  let p = decodeURIComponent(url.pathname); if (p === "/") p = "/index.html";
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("No encontrado"); }
    const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
    const cache = /\.(mp4|jpg|png|webp)$/.test(file) ? "public, max-age=86400" : "no-cache";
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range); const s = m[1] ? +m[1] : 0, e = m[2] ? +m[2] : st.size - 1;
      if (s >= st.size || e >= st.size) { res.writeHead(416, { "Content-Range": `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${s}-${e}/${st.size}`, "Accept-Ranges": "bytes", "Content-Length": e - s + 1, "Cache-Control": cache });
      return fs.createReadStream(file, { start: s, end: e }).pipe(res);
    }
    res.writeHead(200, { "Content-Type": type, "Content-Length": st.size, "Accept-Ranges": "bytes", "Cache-Control": cache });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (url.pathname.startsWith("/api/") || url.pathname === "/events") api(req, res, url).catch(e => { console.error(e); try { json(res, 500, { error: "server" }); } catch (x) {} });
  else if (url.pathname === "/healthz") { res.writeHead(200); res.end("ok"); }
  else serve(req, res, url);
});
setInterval(() => { const now = Date.now(); rooms.forEach((r, c) => { if (now - r.touched > 6 * 3600e3) { clearT(r); rooms.delete(c); } }); }, 600e3).unref();
if (require.main === module) server.listen(PORT, () => console.log(`KMS Movies en http://localhost:${PORT}${HOST_PASSWORD ? " (organizador protegido con contraseña)" : ""}`));
module.exports = { server, rooms, buildPlan };

"use strict";
/**
 * KMS Movies · servidor de trivia en vivo.
 * Sin dependencias: Node 18+ (http + Server-Sent Events).
 *
 *   PORT=3000 HOST_PASSWORD=secreto node server.js
 *
 * El servidor es la fuente de verdad: guarda las respuestas correctas,
 * califica, mide el tiempo y limita cada sala a 15 jugadores.
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
const PUBLIC = path.join(__dirname, "public");
const BY_ID = Object.fromEntries(BANK.map(q => [q.id, q]));
const COLORS = ["#ff7aa8", "#ffc21a", "#22d3ee", "#7cf24a", "#c4a1ff", "#ff9a5c", "#5eead4", "#f9a8d4", "#93c5fd", "#fde047", "#fb7185", "#a3e635", "#67e8f9", "#fdba74", "#d8b4fe"];
const rooms = new Map();

/* ---------- utilidades ---------- */
const rid = (n = 12) => crypto.randomBytes(n).toString("base64url");
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const clean = s => String(s || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim();
function newCode() { let c; do { c = String(Math.floor(100000 + Math.random() * 900000)); } while (rooms.has(c)); return c; }

/* ---------- construcción de preguntas ---------- */
function buildList(films, mode) {
  const sel = Object.keys(FILMS).filter(k => k !== "mix" && films[k]);
  let l = ORDER.filter(id => { const q = BY_ID[id]; return q.film === "mix" ? sel.length >= 2 : sel.includes(q.film); });
  if (mode === "quick") l = l.filter(id => BY_ID[id].quick);
  return l;
}
/** Versión pública de la pregunta: nunca incluye la respuesta. */
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
/** Devuelve la fracción de acierto [0..1] y una vista de la respuesta. */
function grade(q, pub, a) {
  if (a === undefined || a === null) return 0;
  switch (q.type) {
    case "mc": case "img": case "imgopt": return a === q.c ? 1 : 0;
    case "tf": return a === (q.c ? 0 : 1) ? 1 : 0;
    case "multi": { const cs = new Set(q.c); let h = 0, b = 0; (Array.isArray(a) ? a : []).forEach(i => cs.has(i) ? h++ : b++); return Math.max(0, (h - b) / cs.size); }
    case "type": return q.ans.includes(norm(a)) ? 1 : 0;
    case "slider": return Math.max(0, 1 - Math.abs(Number(a) - q.ans) / q.tol);
    case "order": return JSON.stringify(a) === JSON.stringify(q.items.map(t => pub.opts.indexOf(t))) ? 1 : 0;
    case "match": {
      // a[i] = índice de la columna derecha elegida para la izquierda i
      let ok = 0; q.pairs.forEach((p, i) => { if (pub.right[a[i]] === p[1]) ok++; });
      return ok / q.pairs.length;
    }
    default: return 0;
  }
}
/** Valida la forma de la respuesta recibida del cliente. */
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

/* ---------- salas ---------- */
function createRoom(films, mode) {
  const qs = buildList(films, mode);
  if (!qs.length) return null;
  const room = {
    code: newCode(), hostToken: rid(), phase: "lobby", qs, qn: -1, pub: null, qStart: 0, endsAt: 0, film: null,
    players: new Map(), hostRes: new Set(), reveal: null, timer: null, early: null, created: Date.now(), touched: Date.now(), paused: false
  };
  rooms.set(room.code, room);
  return room;
}
const connected = p => p.res.size > 0;
function rank(room) {
  const arr = [...room.players.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  arr.forEach((p, i) => p.rank = i > 0 && arr[i - 1].score === p.score ? arr[i - 1].rank : i + 1);
  return arr;
}
function stateFor(room, viewer /* "host" | player */) {
  const list = rank(room);
  const st = {
    now: Date.now(), code: room.code, phase: room.phase, qn: room.qn, total: room.qs.length, film: room.film, endsAt: room.endsAt, max: MAX_PLAYERS,
    paused: room.paused,
    q: room.phase === "q" || room.phase === "reveal" ? room.pub : null,
    reveal: room.phase === "reveal" ? room.reveal : null,
    players: list.map(p => ({ id: p.id, name: p.name, color: p.color, score: p.score, streak: p.streak, rank: p.rank, answered: p.ans !== undefined, on: connected(p), last: room.phase === "reveal" || room.phase === "board" ? p.lastPts : 0 }))
  };
  if (room.phase === "film") { st.filmInfo = FILMS[room.film]; }
  if (viewer !== "host") {
    st.me = { id: viewer.id, answered: viewer.ans !== undefined, rank: viewer.rank, score: viewer.score, streak: viewer.streak, result: room.phase === "reveal" ? viewer.result : null };
  }
  return st;
}
function send(res, event, data) { try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch (e) { /* conexión cerrada */ } }
function push(room) {
  room.touched = Date.now();
  room.hostRes.forEach(r => send(r, "state", stateFor(room, "host")));
  room.players.forEach(p => { const s = stateFor(room, p); p.res.forEach(r => send(r, "state", s)); });
}
function broadcast(room, event, data) {
  room.hostRes.forEach(r => send(r, event, data));
  room.players.forEach(p => p.res.forEach(r => send(r, event, data)));
}
const clearT = room => { clearTimeout(room.timer); clearTimeout(room.early); room.timer = room.early = null; };

function startGame(room) {
  if (room.phase !== "lobby" || !room.players.size) return;
  [...room.players.values()].forEach(p => { p.score = 0; p.streak = 0; p.lastPts = 0; });
  nextQuestion(room);
}
function nextQuestion(room) {
  clearT(room);
  const n = room.qn + 1;
  if (n >= room.qs.length) { room.phase = "end"; room.endsAt = 0; push(room); return; }
  const q = BY_ID[room.qs[n]];
  const prev = room.qn >= 0 ? BY_ID[room.qs[room.qn]] : null;
  room.qn = n; room.pub = publicQ(q, n); room.film = q.film;
  room.players.forEach(p => { p.ans = undefined; p.result = null; p.lastPts = 0; });
  if (!prev || prev.film !== q.film) {
    room.phase = "film"; room.endsAt = Date.now() + 4200; push(room);
    room.timer = setTimeout(() => openQuestion(room), 4200);
  } else openQuestion(room);
}
function openQuestion(room) {
  clearT(room);
  room.phase = "q"; room.qStart = Date.now(); room.endsAt = room.qStart + room.pub.dur * 1000; room.paused = false;
  push(room);
  room.timer = setTimeout(() => reveal(room), room.pub.dur * 1000 + 400);
}
function checkAllAnswered(room) {
  if (room.phase !== "q" || room.early) return;
  const active = [...room.players.values()].filter(connected);
  if (active.length && active.every(p => p.ans !== undefined)) {
    room.early = setTimeout(() => reveal(room), 900);
  }
}
function reveal(room) {
  if (room.phase !== "q") return;
  clearT(room);
  const q = BY_ID[room.pub.id], pub = room.pub;
  const dist = pub.opts && q.type !== "order" ? pub.opts.map(() => 0) : pub.imgs ? pub.imgs.map(() => 0) : null;
  let right = 0, answered = 0, sum = 0, nn = 0, fastest = null;
  room.players.forEach(p => {
    p.lastPts = 0;
    if (p.ans === undefined) { p.streak = 0; p.result = { ok: -1, pts: 0, total: p.score }; return; }
    answered++;
    if (dist) { if (Array.isArray(p.ans)) { if (q.type === "multi") p.ans.forEach(i => dist[i]++); } else if (dist[p.ans] !== undefined) dist[p.ans]++; }
    if (q.type === "slider") { sum += p.ans; nn++; }
    const f = grade(q, pub, p.ans), full = f >= 0.99;
    const rt = Math.min(Math.max(p.rt, 0), pub.dur * 1000);
    const base = Math.round(1000 * (1 - (rt / (pub.dur * 1000)) / 2));
    let pts = Math.round(base * f), bonus = 0;
    if (full) { p.streak++; right++; if (p.streak >= 2) bonus = Math.min(p.streak - 1, 5) * 100; if (!fastest || rt < fastest.rt) fastest = { id: p.id, rt }; }
    else p.streak = 0;
    pts += bonus; p.score += pts; p.lastPts = pts;
    p.result = { ok: full ? 1 : f > 0 ? 0.5 : 0, pts, bonus, total: p.score, streak: p.streak, f: Math.round(f * 100) };
  });
  rank(room);
  room.reveal = { total: room.players.size, answered, right, dist, avg: nn ? Math.round(sum / nn) : null, ctext: answerText(q), expl: q.expl || "", fastest: fastest && room.players.get(fastest.id)?.name, correct: correctView(q, pub) };
  room.phase = "reveal"; room.endsAt = 0;
  push(room);
}
/** Datos para pintar la respuesta correcta en pantalla. */
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

async function api(req, res, url) {
  const route = url.pathname;
  if (req.method === "GET" && route === "/api/info") return json(res, 200, { films: FILMS, max: MAX_PLAYERS, needsPassword: !!HOST_PASSWORD, questions: { full: buildList({ poeta: 1, contador: 1, tropic: 1 }, "full").length, quick: buildList({ poeta: 1, contador: 1, tropic: 1 }, "quick").length } });
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
    let base = name, k = 2; while (names.has(name.toLowerCase())) name = base.slice(0, 12) + " " + k++;
    const used = new Set([...room.players.values()].map(p => p.color));
    const p = { id: rid(6), token: rid(), name, color: COLORS.find(c => !used.has(c)) || COLORS[room.players.size % COLORS.length], score: 0, streak: 0, lastPts: 0, res: new Set(), ans: undefined, rt: 0, result: null, rank: 1 };
    room.players.set(p.id, p); push(room);
    return json(res, 200, { id: p.id, token: p.token, name, color: p.color });
  }
  if (route === "/api/answer") {
    const o = playerOf(b.code, b.id, b.token); if (!o) return json(res, 403, { error: "auth" });
    const { room, p } = o;
    if (room.phase !== "q" || Date.now() > room.endsAt + 600 || room.paused) return json(res, 409, { error: "closed" });
    if (p.ans !== undefined) return json(res, 409, { error: "already" });
    const q = BY_ID[room.pub.id];
    if (!validAnswer(q, room.pub, b.a)) return json(res, 400, { error: "invalid" });
    p.ans = b.a; p.rt = Date.now() - room.qStart;
    push(room); checkAllAnswered(room);
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
      case "skip": reveal(room); break;
      case "extend": if (room.phase === "q") { room.endsAt += 10000; clearTimeout(room.timer); room.timer = setTimeout(() => reveal(room), room.endsAt - Date.now() + 400); push(room); } break;
      case "board": if (room.phase === "reveal") { room.phase = "board"; push(room); } break;
      case "next": if (room.phase === "board" || room.phase === "reveal") nextQuestion(room); break;
      case "kick": { const p = room.players.get(String(b.id)); if (p && room.phase === "lobby") { p.res.forEach(r => { send(r, "kicked", {}); try { r.end(); } catch (e) {} }); room.players.delete(p.id); push(room); } break; }
      case "end": room.phase = "end"; clearT(room); push(room); break;
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
  if (who) push(room); // avisa al organizador de la conexión
  const ka = setInterval(() => { try { res.write(": ka\n\n"); } catch (e) {} }, 15000);
  req.on("close", () => { clearInterval(ka); (who ? who.res : room.hostRes).delete(res); if (who && rooms.has(room.code)) push(room); });
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
      const m = /bytes=(\d*)-(\d*)/.exec(range); let s = m[1] ? +m[1] : 0, e = m[2] ? +m[2] : st.size - 1;
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
module.exports = { server, rooms };

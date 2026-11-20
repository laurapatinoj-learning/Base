"use strict";
/**
 * Foto del equipo interactiva (Equipo KMS dentro del juego).
 *
 * TEAM.create(container, { mode, onPick, labels })
 *   mode "pick"    el jugador toca su cara para elegirla (las ocupadas se apagan)
 *   mode "show"    pantalla grande: las caras se iluminan conforme el equipo entra
 *   mode "landing" portada: toca una cara para unirte con ella
 * Devuelve { update(players, meId), spot(n | null), el }
 */
(function () {
  const W = 1099, H = 688, PHOTO = "/img/equipo.jpg";
  /* círculos de cada cara: [cx, cy, radio] sobre la foto de 1099×688; la clave es el número de avatar */
  const FACES = {
    1: [138, 192, 46], 2: [207, 225, 40], 3: [300, 188, 40], 4: [390, 325, 38], 5: [415, 225, 40], 6: [490, 135, 40], 7: [530, 235, 42],
    8: [600, 198, 36], 9: [700, 215, 40], 10: [770, 195, 38], 11: [865, 215, 40], 12: [926, 120, 40], 13: [1000, 218, 40]
  };
  const NS = "http://www.w3.org/2000/svg";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const css = `
  .tphoto{position:relative;border-radius:24px;overflow:hidden;border:3px solid var(--line);background:#fff;box-shadow:0 18px 50px rgba(0,0,0,.5);touch-action:manipulation}
  .tscroll{overflow-x:auto;border-radius:24px;scroll-behavior:smooth;-webkit-overflow-scrolling:touch}
  .tscroll .tphoto{min-width:760px}
  .tphoto svg{display:block;width:100%;height:auto}
  .tface{fill:transparent;stroke:rgba(255,255,255,.95);stroke-width:2.5;pointer-events:all;cursor:pointer;transition:fill .15s,stroke .15s,stroke-width .15s,opacity .2s;filter:drop-shadow(0 1px 2px rgba(0,0,0,.55))}
  .tface.free{animation:tfree 1.8s ease-in-out infinite}@keyframes tfree{50%{stroke-width:4.5;stroke:#ffe066}}
  .tface:hover:not(.taken),.tface:focus-visible:not(.taken){fill:rgba(255,194,26,.3);stroke:#ffc21a;stroke-width:5;outline:none}
  .tface.taken{cursor:default;stroke-width:5}
  .tface.mine{stroke:#ffc21a;stroke-width:6;cursor:pointer}
  .tface.show{pointer-events:none;animation:none}
  .tface.pop{animation:tpop .7s cubic-bezier(.2,1.8,.4,1)}
  @keyframes tpop{0%{transform:scale(.6)}60%{transform:scale(1.18)}100%{transform:scale(1)}}
  .tface{transform-box:fill-box;transform-origin:center}
  .ttag rect{fill:#14102b;stroke-width:3}.ttag text{font-family:var(--font-body);font-weight:900;font-size:19px;fill:#fff;text-anchor:middle;dominant-baseline:central}
  .ttag{pointer-events:none;transition:opacity .25s}
  .tdim{pointer-events:none;transition:opacity .3s}
  .ttip{position:absolute;z-index:3;pointer-events:none;transform:translate(-50%,-150%);background:#14102b;color:#fff;border:2px solid #ffc21a;border-radius:10px;padding:3px 10px;font-size:.85rem;white-space:nowrap;opacity:0;transition:opacity .1s}
  .ttip.show{opacity:1}
  .thint{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);background:rgba(13,10,36,.88);color:#fff;border:2px solid #ffc21a;border-radius:99px;padding:6px 16px;font-weight:900;font-size:.9rem;pointer-events:none;white-space:nowrap;animation:thint 2s ease-in-out infinite}
  @keyframes thint{50%{transform:translateX(-50%) translateY(-4px)}}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  let uid = 0;
  function create(container, opts = {}) {
    const mode = opts.mode || "show", id = "tm" + (++uid), ids = Object.keys(FACES).map(Number);
    container.innerHTML = `<div class="${opts.scroll ? "tscroll" : ""}"><div class="tphoto"><div class="ttip"></div>
      <svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Foto del equipo con 13 caras">
        <defs><image id="${id}img" href="${PHOTO}" width="${W}" height="${H}"/><mask id="${id}m"><rect width="${W}" height="${H}" fill="#fff"/><circle id="${id}h" r="0" fill="#000"/></mask></defs>
        <use href="#${id}img"/><rect class="tdim" id="${id}d" width="${W}" height="${H}" fill="#0d0a24" opacity="0" mask="url(#${id}m)"/>
        <g id="${id}f"></g><g id="${id}t"></g></svg>
      ${mode === "landing" ? `<div class="thint">Toca tu cara para unirte</div>` : ""}</div></div>`;
    const svg = container.querySelector("svg"), gf = svg.querySelector("#" + id + "f"), gt = svg.querySelector("#" + id + "t"), tip = container.querySelector(".ttip"), wrap = container.querySelector(".tphoto");
    const faces = {}, tags = {}; let players = [], me = null;
    ids.forEach(n => {
      const [cx, cy, r] = FACES[n];
      const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", r * 1.04); c.setAttribute("class", "tface" + (mode === "show" ? " show" : ""));
      if (mode !== "show") { c.setAttribute("tabindex", "0"); c.setAttribute("role", "button"); c.setAttribute("aria-label", "Cara " + n); }
      const pick = () => { const o = players.find(p => p.avatar === n); if (mode === "landing") return opts.onPick?.(n, null); if (o && o.id !== me) return; opts.onPick?.(n, o || null); };
      c.addEventListener("click", pick);
      c.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
      c.addEventListener("pointermove", e => { const o = players.find(p => p.avatar === n); const rr = wrap.getBoundingClientRect(); tip.textContent = o ? o.name + (o.id === me ? " (tú)" : "") : (mode === "landing" ? "Entrar con esta cara" : "Libre"); tip.style.left = e.clientX - rr.left + "px"; tip.style.top = e.clientY - rr.top + "px"; tip.classList.add("show"); });
      c.addEventListener("pointerleave", () => tip.classList.remove("show"));
      gf.appendChild(c); faces[n] = c;
      const g = document.createElementNS(NS, "g"); g.setAttribute("class", "ttag"); g.style.opacity = 0;
      g.innerHTML = `<rect rx="12" height="28" y="${cy + r + 6}"/><text y="${cy + r + 20}" x="${cx}"></text>`; gt.appendChild(g); tags[n] = g;
    });
    function update(list, meId) {
      players = list || []; me = meId ?? me;
      ids.forEach(n => {
        const o = players.find(p => p.avatar === n), c = faces[n], g = tags[n], was = c.classList.contains("taken");
        c.classList.toggle("taken", !!o && o.id !== me); c.classList.toggle("mine", !!o && o.id === me); c.classList.toggle("free", !o && mode === "pick");
        if (o) { c.style.stroke = o.id === me ? "" : o.color; if (!was && !c.classList.contains("mine") || (o.id === me && !c.dataset.m)) { c.classList.remove("pop"); void c.getBoundingClientRect(); c.classList.add("pop"); } c.dataset.m = o.id === me ? 1 : ""; }
        else { c.style.stroke = ""; c.dataset.m = ""; c.classList.remove("pop"); }
        if (mode === "landing") { g.style.opacity = 0; return; }
        if (o) { const t = g.querySelector("text"), rc = g.querySelector("rect"); t.textContent = o.name; const w = Math.max(54, o.name.length * 11.5 + 22), cx = FACES[n][0]; rc.setAttribute("width", w); rc.setAttribute("x", cx - w / 2); rc.style.stroke = o.color; g.style.opacity = 1; }
        else g.style.opacity = 0;
      });
      if (mode === "show" || mode === "pick") { const mine = players.find(p => p.id === me)?.avatar; if (mine && opts.scroll) centerOn(mine); }
    }
    function centerOn(n) { const sc = container.querySelector(".tscroll"); if (!sc) return; const [cx] = FACES[n]; sc.scrollTo({ left: cx / W * sc.scrollWidth - sc.clientWidth / 2, behavior: "smooth" }); }
    /* zoom de cámara hacia una cara (n) o regreso al plano general (null) */
    let raf = 0, cur = [0, 0, W, H];
    function spot(n, k = 5.4) {
      cancelAnimationFrame(raf);
      let to = [0, 0, W, H];
      if (n && FACES[n]) { const [cx, cy, r] = FACES[n], w = Math.min(W, r * 2 * k), h = w * H / W; to = [Math.max(0, Math.min(W - w, cx - w / 2)), Math.max(0, Math.min(H - h, cy - h / 2)), w, h]; }
      const from = cur.slice(), t0 = performance.now(), dur = 700, hole = svg.querySelector("#" + id + "h"), dim = svg.querySelector("#" + id + "d");
      if (n && FACES[n]) { hole.setAttribute("cx", FACES[n][0]); hole.setAttribute("cy", FACES[n][1]); hole.setAttribute("r", FACES[n][2] * 1.12); dim.setAttribute("opacity", ".72"); } else { dim.setAttribute("opacity", "0"); }
      (function f(t) { const k2 = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k2, 3); cur = from.map((v, i) => v + (to[i] - v) * e); svg.setAttribute("viewBox", cur.map(v => v.toFixed(1)).join(" ")); if (k2 < 1) raf = requestAnimationFrame(f); })(t0);
    }
    update([], null);
    return { update, spot, centerOn, el: container };
  }
  /* avatar redondo suelto a partir de la foto (para tarjetas grandes) */
  function faceSVG(n, k = 1.1) { const f = FACES[n]; if (!f) return ""; const [cx, cy, r] = f, R = r * k; return `<svg viewBox="${cx - R} ${cy - R} ${2 * R} ${2 * R}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="${PHOTO}" width="${W}" height="${H}"/></svg>`; }
  window.TEAM = { create, faceSVG, FACES, PHOTO };
})();

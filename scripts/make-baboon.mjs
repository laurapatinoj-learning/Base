// Genera las láminas "blueprint" (ES/EN/PT): babuino → peroné → hueso de Ishango.
// El babuino es la ilustración generada (public/img/babuino-lineas.webp); el resto es vectorial y se anima.
// Uso: python3 scripts/make-baboon-art.py … && node scripts/make-baboon.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const ISH = { G: [11, 13, 17, 19], M: [3, 6, 4, 8, 10, 5, 5, 7], D: [11, 21, 19, 9] };
const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const type = (n) => (isPrime(n) ? 'p' : n % 2 ? 'o' : 'e');
const COL = { p: '#ff6b81', o: '#46e0a0', e: '#ffffff' };
const IMG = 'data:image/webp;base64,' + readFileSync(new URL('../public/img/babuino-lineas.webp', import.meta.url)).toString('base64');
const f = (n) => +n.toFixed(1);
// Punta de flecha propia (los marcadores SVG se verían antes de que el trazo termine de dibujarse)
const head = (x, y, dx, dy, delay) => { const r = (a) => [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)]; const [ax, ay] = r(Math.PI * 0.86), [bx, by] = r(-Math.PI * 0.86); return `<path class="fd" style="--d:${delay}s" d="M${f(x + ax * 11)} ${f(y + ay * 11)}L${x} ${y}L${f(x + bx * 11)} ${f(y + by * 11)}" stroke-width="1.4"/>`; };
const dr = (d, delay, o = {}) => `<path class="dr" pathLength="1" style="--d:${delay}s;--t:${o.t || 2}s" d="${d}"${o.sw ? ` stroke-width="${o.sw}"` : ''}/>`;

// Huesos de la pierna con el peroné resaltado (coordenadas absolutas)
const leg = `<g transform="translate(655 322)">
<path class="fd" style="--d:3s" d="M40 -14V262" stroke-dasharray="14 3 2 3" stroke-width="0.8"/>
<g class="fd" style="--d:3s"><circle cx="40" cy="20" r="12"/><path d="M31 32L30 100M49 32L50 100"/><circle cx="27" cy="112" r="10"/><circle cx="53" cy="112" r="10"/><path d="M0 136H80M14 136L18 238H34M66 136L62 238H46"/></g>
<path class="hl dr" pathLength="1" style="--d:3.6s;--t:1.2s" d="M86 142C86 134 100 134 100 142L98 238C98 248 88 248 88 238Z" stroke-width="3.4"/></g>`;

// Hueso de Ishango vertical con las tres columnas, coloreadas según el número de cada grupo
const BX = 1040;
const boneOut = `M${BX - 36} 164C${BX - 44} 160 ${BX - 46} 140 ${BX - 30} 140H${BX + 30}C${BX + 46} 140 ${BX + 44} 160 ${BX + 36} 164C${BX + 40} 300 ${BX + 36} 500 ${BX + 40} 636C${BX + 52} 640 ${BX + 52} 664 ${BX + 34} 664H${BX - 34}C${BX - 52} 664 ${BX - 52} 640 ${BX - 40} 636C${BX - 36} 500 ${BX - 40} 300 ${BX - 36} 164Z`;
let ticks = ''; let ti = 0;
[['G', BX - 20], ['M', BX], ['D', BX + 20]].forEach(([c, x]) => { let y = 196; for (const n of ISH[c]) { for (let k = 0; k < n; k++) { ticks += `<path class="fu" style="--d:${f(4.3 + ti * 0.012)}s;--o:1" stroke="${COL[type(n)]}" stroke-width="2.2" d="M${x - 7} ${f(y + k * 4.4)}H${x + 7}"/>`; ti++; } y += n * 4.4 + 16; } });

const grid = (() => { let g = ''; for (let x = 0; x <= 1200; x += 20) g += `<path d="M${x} 0V800" stroke-opacity="${x % 100 ? 0.09 : 0.22}"/>`; for (let y = 0; y <= 800; y += 20) g += `<path d="M0 ${y}H1200" stroke-opacity="${y % 100 ? 0.09 : 0.22}"/>`; return g; })();

const T = {
  es: { title: 'BABUINO', sub: 'Papio sp.', bone: 'HUESO DE ISHANGO', age: '(≈ 20 000 años)', h: '(altura)', view: 'VISTA LATERAL', len: '(longitud)', fib: 'PERONÉ', leg: ['Primo', 'Compuesto impar', 'Compuesto par'] },
  en: { title: 'BABOON', sub: 'Papio sp.', bone: 'ISHANGO BONE', age: '(≈ 20,000 years)', h: '(height)', view: 'SIDE VIEW', len: '(length)', fib: 'FIBULA', leg: ['Prime', 'Odd composite', 'Even composite'] },
  pt: { title: 'BABUÍNO', sub: 'Papio sp.', bone: 'OSSO DE ISHANGO', age: '(≈ 20.000 anos)', h: '(altura)', view: 'VISTA LATERAL', len: '(comprimento)', fib: 'FÍBULA', leg: ['Primo', 'Composto ímpar', 'Composto par'] },
};

function plate(l) {
  const t = T[l]; const IX = 60, IY = 130, IW = 496, IH = 620, GROUND = 690;
  let lx = 810; const legend = [0, 1, 2].map((i) => { const s = `<rect x="${lx}" y="744" width="12" height="12" fill="${[COL.p, COL.o, COL.e][i]}" stroke="none"/><text class="t sm" x="${lx + 18}" y="754">${t.leg[i]}</text>`; lx += 18 + t.leg[i].length * 6.6 + 18; return s; }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" font-family="Poppins, 'Helvetica Neue', Arial, sans-serif" aria-hidden="true">
<defs><radialGradient id="bg" cx="45%" cy="40%" r="75%"><stop offset="0" stop-color="#2150d6"/><stop offset="1" stop-color="#0b2688"/></radialGradient>
<marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" stroke="#fff" stroke-width="1.4" fill="none"/></marker>
<mask id="reveal" maskUnits="userSpaceOnUse" x="${IX}" y="${IY}" width="${IW}" height="${IH}"><rect class="wipe" x="${IX}" y="${IY}" width="${IW}" height="${IH}" fill="#fff"/></mask></defs>
<style>.t{fill:#fff;stroke:none;font-size:15px}.t.big{font-size:32px;font-weight:700}.t.head{font-size:25px;font-weight:600}.t.it{font-style:italic;font-size:20px}.t.sm{font-size:12px}.t.up{letter-spacing:.06em}.scan{opacity:0}</style>
<rect width="1200" height="800" fill="url(#bg)" stroke="none"/><g stroke-width="1">${grid}</g>
<rect x="14" y="14" width="1172" height="772" stroke-width="3"/>
<rect x="30" y="26" width="248" height="82" stroke-width="2.2"/><text class="t big" x="48" y="66">${t.title}</text><text class="t it" x="48" y="94">${t.sub}</text>
<rect x="790" y="26" width="380" height="748" stroke-width="2.2"/><path d="M790 108H1170" stroke-width="1.4"/><text class="t head" x="980" y="62" text-anchor="middle">${t.bone}</text><text class="t" x="980" y="92" text-anchor="middle">${t.age}</text>
<image class="baboon" href="${IMG}" x="${IX}" y="${IY}" width="${IW}" height="${IH}" mask="url(#reveal)" preserveAspectRatio="xMidYMid meet" stroke="none"/>
<rect class="scan" x="${IX}" y="${IY}" width="3" height="${IH}" fill="#bfe0ff" stroke="none"/>
<g class="fd" style="--d:1.4s"><path d="M62 162V${GROUND}" stroke-width="1.2" marker-start="url(#a)" marker-end="url(#a)"/><path d="M50 162H92M50 ${GROUND}H92" stroke-width="1"/>
<text class="t" transform="translate(42 430) rotate(-90)" text-anchor="middle">≈ 70 cm <tspan class="sm">${t.h}</tspan></text>
<path d="M60 ${GROUND}H560" stroke-width="1.4"/><path d="${[80, 130, 180, 230, 280, 330, 380, 430, 480, 530, 580].map((x) => `M${x} ${GROUND}l-12 14`).join('')}" stroke-width="0.8" stroke-opacity=".5"/>
<rect x="228" y="730" width="170" height="26"/><text class="t sm up" x="313" y="748" text-anchor="middle">${t.view}</text></g>
${leg}
${dr(boneOut, 3.4, { t: 2.4, sw: 2.2 })}
<g class="fd" style="--d:4.2s"><path d="M${BX - 12} 118H${BX + 12}V140H${BX - 12}Z"/><path d="M${BX - 7} 119L${BX - 3} 139M${BX + 1} 119L${BX + 5} 139" stroke-width="0.9"/><text x="${BX + 20}" y="132" class="t sm">SiO₂</text></g>
${ticks}
<g class="fd" style="--d:4.4s"><text x="${BX - 20}" y="184" class="t sm" text-anchor="middle">G</text><text x="${BX}" y="184" class="t sm" text-anchor="middle">M</text><text x="${BX + 20}" y="184" class="t sm" text-anchor="middle">D</text></g>
<g class="fd" style="--d:3.6s"><path d="M${BX - 98} 140V664" stroke-width="1.2" marker-start="url(#a)" marker-end="url(#a)"/><path d="M${BX - 108} 140H${BX - 88}M${BX - 108} 664H${BX - 88}" stroke-width="1"/>
<text class="t" transform="translate(${BX - 112} 402) rotate(-90)" text-anchor="middle">≈ 10 cm <tspan class="sm">${t.len}</tspan></text><text class="t" x="${BX + 62}" y="402">168</text><text class="t sm" x="${BX + 62}" y="420">16 · 3</text></g>
${dr('M530 590C580 590 620 560 656 526', 3.4, { t: 1.2, sw: 1.3 })}${head(656, 526, 0.727, -0.687, 4.5)}
${dr('M752 578C800 650 860 668 912 624', 4, { t: 1.6, sw: 1.3 })}${head(912, 624, 0.763, -0.646, 5.5)}
<g class="fd" style="--d:4s"><text class="t sm" x="772" y="352">${t.fib}</text><path d="M770 356L748 392" stroke-width="0.9"/></g>
<g class="fd" style="--d:4.6s">${legend}</g></svg>`;
}
for (const l of ['es', 'en', 'pt']) writeFileSync(new URL(`../public/img/lamina-${l}.svg`, import.meta.url), plate(l));
console.log('láminas generadas (3 idiomas):', ti, 'marcas del hueso');

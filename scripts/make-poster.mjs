// Genera public/img/poster-ishango.svg: lámina técnica lineal (negro, 2D, sin sombreado) del babuino al hueso de Ishango.
import { writeFileSync } from 'node:fs';
const cols = [['G', 417, [11, 13, 17, 19]], ['M', 430, [3, 6, 4, 8, 10, 5, 5, 7]], ['D', 443, [11, 21, 19, 9]]];
let marks = '';
for (const [, y, gr] of cols) { let x = 250; for (const n of gr) { for (let k = 0; k < n; k++) marks += `<path d="M${(x + k * 4.2).toFixed(1)} ${y - 4.5} V${y + 4.5}"/>`; x += n * 4.2 + 18; } }

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 640" fill="none" stroke="#000" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" font-family="Poppins, 'Helvetica Neue', Arial, sans-serif" aria-hidden="true">
<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" stroke="#000" stroke-width="1.4" fill="none"/></marker></defs>
<rect width="900" height="640" fill="#fff" stroke="none"/>
<rect x="18" y="18" width="864" height="604" stroke-width="3"/><rect x="30" y="30" width="840" height="580" stroke-width="1"/>

<!-- A. Babuino (Papio): perfil, dibujo lineal -->
<g id="baboon">
  <!-- lomo con hombros elevados -->
  <path d="M122 152 C150 128 218 108 286 120"/>
  <!-- mechones del cuello y los hombros -->
  <path d="M236 112 l-3 -11 M250 112 l0 -12 M264 114 l3 -11 M276 118 l5 -9 M226 116 l-6 -9" stroke-width="1.2"/>
  <!-- cabeza: frente, arco superciliar, hocico largo, mandíbula -->
  <path d="M286 120 C294 102 316 94 336 100 L350 106 L394 140 C400 146 396 155 387 155 L354 151 C346 165 326 174 308 171 C294 163 286 142 286 120 Z"/>
  <path d="M322 110 L348 114" stroke-width="2.2"/>
  <circle cx="336" cy="120" r="3"/>
  <circle cx="387" cy="145" r="1.5"/>
  <path d="M356 151 L384 150"/>
  <path d="M300 108 C292 104 286 110 288 120" stroke-width="1.2"/>
  <!-- pecho y vientre -->
  <path d="M300 168 C308 182 304 194 296 202"/>
  <path d="M296 202 C258 212 206 208 168 194"/>
  <!-- patas anteriores (cercana y lejana) -->
  <path d="M274 150 L286 206 L284 240"/><path d="M284 240 L268 246 M284 240 L302 246"/>
  <path d="M256 156 L262 206 L260 238" stroke-width="1.2"/>
  <!-- pata posterior y callosidad -->
  <path d="M122 152 C100 176 106 204 126 216 L122 240"/><path d="M122 240 L106 246 M122 240 L140 246"/>
  <path d="M168 194 C156 204 156 210 158 216 L156 238" stroke-width="1.2"/>
  <path d="M116 168 C112 176 114 184 120 188" stroke-width="1.2"/>
  <!-- cola: sube y se arquea hacia abajo -->
  <path d="M122 152 C92 146 74 120 84 96 C92 78 116 78 124 94"/>
  <!-- suelo y cota de alzada -->
  <path d="M70 248 H410" stroke-dasharray="14 4 2 4" stroke-width="1"/>
  <path d="M422 248 V96 M416 248 H428 M416 96 H428" stroke-width="1"/>
  <text x="436" y="178" font-size="12" fill="#000" stroke="none">Papio</text>
</g>

<!-- B. Huesos de la pierna: fémur, tibia y peroné (resaltado) -->
<g id="leg">
  <path d="M564 70 V254" stroke-width="0.8" stroke-dasharray="14 3 2 3"/>
  <!-- fémur -->
  <circle cx="566" cy="98" r="10"/>
  <path d="M558 106 L557 152 M574 106 L575 152"/>
  <circle cx="556" cy="160" r="8"/><circle cx="576" cy="160" r="8"/>
  <!-- tibia -->
  <path d="M540 180 H592 M552 180 L554 238 H576 L578 180"/>
  <!-- peroné: trazo grueso -->
  <path d="M606 184 C606 180 614 180 614 184 L613 238 C613 243 607 243 607 238 Z" stroke-width="3"/>
</g>

<path d="M170 226 C260 214 380 218 520 218" marker-end="url(#ar)" stroke-width="1.2"/>
<path d="M610 250 C610 300 640 324 640 372" marker-end="url(#ar)" stroke-width="1.2"/>

<!-- C. Hueso de Ishango ampliado -->
<g id="ishango">
  <path d="M70 430 H840" stroke-dasharray="14 3 2 3" stroke-width="0.9"/>
  <path d="M150 408 C300 404 520 410 758 412"/><path d="M150 452 C300 456 520 450 758 448"/>
  <path d="M150 408 C120 394 94 410 96 430 C94 450 120 466 150 452"/>
  <path d="M758 412 C780 404 802 414 802 430 C802 446 780 456 758 448"/>
  <path d="M802 424 L826 426 L826 434 L802 436 Z"/><path d="M808 425 L812 435 M815 425 L819 435" stroke-width="0.8"/>
  <text x="832" y="433" font-size="11" fill="#000" stroke="none">SiO₂</text>
  <circle cx="122" cy="430" r="26" stroke-dasharray="4 3" stroke-width="0.8"/>
  <path d="M96 372 V494 M802 372 V494" stroke-width="0.8"/>
  <path d="M96 484 H802" marker-start="url(#ar)" marker-end="url(#ar)" stroke-width="1.1"/>
  <text x="449" y="504" font-size="13" fill="#000" stroke="none" text-anchor="middle">≈ 10 cm</text>
  <g id="marks" stroke-width="1.1">${marks}</g>
  <text x="168" y="420" font-size="9" fill="#000" stroke="none" text-anchor="end">G</text><text x="168" y="434" font-size="9" fill="#000" stroke="none" text-anchor="end">M</text><text x="168" y="448" font-size="9" fill="#000" stroke="none" text-anchor="end">D</text>
  <path d="M470 372 V402" marker-end="url(#ar)" stroke-width="1.1"/><text x="470" y="364" font-size="13" fill="#000" stroke="none" text-anchor="middle">168 · 16 · 3</text>
  <path d="M250 402 L250 380 H330 V402" stroke-width="0.8" stroke-dasharray="3 3"/>
</g>

<!-- Cajetín -->
<g id="title-block"><rect x="640" y="540" width="214" height="56"/><path d="M640 568 H854 M742 540 V596" stroke-width="1"/>
  <text x="651" y="559" font-size="13" font-weight="600" fill="#000" stroke="none">ISHANGO</text><text x="651" y="586" font-size="11" fill="#000" stroke="none">Papio sp.</text>
  <text x="753" y="559" font-size="13" fill="#000" stroke="none">01</text><text x="753" y="586" font-size="11" fill="#000" stroke="none">1 : 1</text>
  <text x="48" y="590" font-size="11" fill="#000" stroke="none">BASE PARKWAY</text></g>
</svg>
`;
writeFileSync(new URL('../public/img/poster-ishango.svg', import.meta.url), svg);
console.log('lámina generada:', (svg.match(/<path d="M[\d.]+ [\d.]+ V/g) || []).length, 'marcas');

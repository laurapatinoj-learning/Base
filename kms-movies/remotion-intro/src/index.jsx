import React from "react";
import {
  AbsoluteFill, Composition, Img, Sequence, interpolate, registerRoot, spring,
  staticFile, useCurrentFrame, useVideoConfig, Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/LilitaOne";

const { fontFamily } = loadFont();
const FONT = `${fontFamily}, 'Arial Black', Impact, sans-serif`;
const INK = "#14102b";

const FILMS = {
  poeta:    { t: "EL POETA",       s: "Colombia · 2025",           c: "#ff3b8d", img: "poeta.jpg" },
  contador: { t: "EL CONTADOR",    s: "Ben Affleck · 2016",        c: "#22d3ee", img: "contador.jpg" },
  tropic:   { t: "TROPIC THUNDER", s: "Dir. Ben Stiller · 2008",   c: "#7cf24a", img: "tropic.jpg" },
  mix:      { t: "RONDA MIXTA",    s: "Las tres películas",        c: "#ffc21a", img: "poeta.jpg" },
};

/* ---------- piezas comunes ---------- */
const Grain = ({ color = "#fff", n = 28 }) => {
  const f = useCurrentFrame();
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const x = (i * 197) % 1280;
        const y = 760 - (((i * 89 + f * (1.4 + (i % 5) * 0.6)) % 820) - 50);
        const size = 8 + (i % 4) * 7;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: size, height: size,
            borderRadius: i % 3 === 0 ? 99 : 3, background: color, opacity: 0.35,
            transform: `rotate(${f * (2 + (i % 3))}deg)`,
          }} />
        );
      })}
    </>
  );
};

const KenBurns = ({ src, from = 1.05, to = 1.25, tint }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const s = interpolate(f, [0, durationInFrames], [from, to]);
  const x = interpolate(f, [0, durationInFrames], [0, -40]);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s}) translateX(${x}px)` }} />
      {tint && <AbsoluteFill style={{ background: tint, mixBlendMode: "multiply" }} />}
    </AbsoluteFill>
  );
};

const FilmStrip = ({ side }) => {
  const f = useCurrentFrame();
  const off = (f * 6) % 60;
  return (
    <div style={{
      position: "absolute", top: 0, bottom: 0, [side]: 0, width: 70, background: "#0b0818",
      borderLeft: side === "right" ? "4px solid #000" : 0, borderRight: side === "left" ? "4px solid #000" : 0,
      overflow: "hidden",
    }}>
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: 22, top: i * 60 - 60 + off, width: 26, height: 36, borderRadius: 6, background: "#f4f1ff" }} />
      ))}
    </div>
  );
};

/* ---------- Intro ---------- */
const Clapper = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: f, fps, config: { damping: 9, stiffness: 120 } });
  const snap = interpolate(f, [14, 20, 26], [-22, 0, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const y = interpolate(drop, [0, 1], [-420, 0]);
  return (
    <div style={{ position: "absolute", left: 440, top: 60 + y, width: 400 }}>
      <div style={{ height: 70, transformOrigin: "left bottom", transform: `rotate(${snap}deg)`, background: `repeating-linear-gradient(115deg,#fff 0 40px,${INK} 40px 80px)`, borderRadius: "14px 14px 0 0", border: `6px solid ${INK}` }} />
      <div style={{ height: 70, background: `repeating-linear-gradient(115deg,${INK} 0 40px,#fff 40px 80px)`, border: `6px solid ${INK}`, borderTop: 0 }} />
    </div>
  );
};

const Title = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = ["#ff3b8d", "#ffc21a", "#22d3ee"];
  const m = spring({ frame: f - 40, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT, top: 60 }}>
      <div style={{ display: "flex", gap: 14 }}>
        {["K", "M", "S"].map((l, i) => {
          const s = spring({ frame: f - 22 - i * 5, fps, config: { damping: 8, stiffness: 140 } });
          return (
            <div key={l} style={{
              fontSize: 240, lineHeight: 1, color: "#fff", WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill",
              textShadow: `0 12px 0 ${colors[i]}, 0 0 40px ${colors[i]}`,
              transform: `scale(${s}) rotate(${(1 - s) * -30}deg)`,
            }}>{l}</div>
          );
        })}
      </div>
      <div style={{
        marginTop: 6, padding: "6px 60px", borderRadius: 18, background: "linear-gradient(#ffe066,#ffb300)",
        border: "8px solid #ff3b3b", boxShadow: "0 0 50px #ffd23f", fontSize: 88, color: INK, letterSpacing: 8,
        transform: `scale(${m})`, position: "relative",
      }}>
        MOVIES
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} style={{ position: "absolute", top: -2, left: 30 + i * 36, width: 10, height: 10, borderRadius: 99, background: (f + i * 3) % 12 < 6 ? "#fff" : "#fff3b0", boxShadow: "0 0 10px #fff" }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Collage = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const keys = ["poeta", "contador", "tropic"];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 26, transform: "rotate(-3deg)" }}>
        {keys.map((k, i) => {
          const s = spring({ frame: f - i * 10, fps, config: { damping: 12 } });
          const fl = FILMS[k];
          return (
            <div key={k} style={{
              width: 360, borderRadius: 26, overflow: "hidden", border: `8px solid ${INK}`, boxShadow: `0 16px 0 ${INK}, 0 0 60px ${fl.c}`,
              transform: `translateY(${(1 - s) * 700}px) rotate(${(i - 1) * 4}deg) scale(${0.9 + 0.1 * s})`, background: fl.c,
            }}>
              <Img src={staticFile(fl.img)} style={{ width: "100%", height: 300, objectFit: "cover", display: "block" }} />
              <div style={{ padding: "14px 18px", fontFamily: FONT, fontSize: 40, color: INK, lineHeight: 1 }}>{fl.t}<div style={{ fontSize: 20, marginTop: 4 }}>{fl.s}</div></div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Countdown = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = 3 - Math.floor(f / 20);
  const s = spring({ frame: f % 20, fps, config: { damping: 7, stiffness: 160 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ fontSize: n > 0 ? 420 : 300, color: "#fff", WebkitTextStroke: `14px ${INK}`, paintOrder: "stroke fill", textShadow: "0 16px 0 #ffc21a, 0 0 80px #ff3b8d", transform: `scale(${0.4 + s * 0.8})` }}>
        {n > 0 ? n : "¡YA!"}
      </div>
    </AbsoluteFill>
  );
};

const Intro = () => {
  const f = useCurrentFrame();
  const hue = interpolate(f, [0, 260], [250, 310]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at ${30 + Math.sin(f / 25) * 20}% 40%, hsl(${hue + 40} 90% 45%), hsl(${hue} 80% 22%) 45%, hsl(${hue - 20} 70% 8%))` }}>
      <Grain color="#ffc21a" />
      <Sequence durationInFrames={95}><Clapper /><Title /></Sequence>
      <Sequence from={95} durationInFrames={85}><Collage /></Sequence>
      <Sequence from={180} durationInFrames={80}><Countdown /></Sequence>
    </AbsoluteFill>
  );
};

/* ---------- Presentación de película (4 s) ---------- */
const Film = ({ film }) => {
  const fl = FILMS[film] || FILMS.mix;
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const wipe = interpolate(f, [0, 16], [0, 100], { easing: Easing.out(Easing.cubic), extrapolateRight: "clamp" });
  const wipeOut = interpolate(f, [durationInFrames - 14, durationInFrames], [0, 100], { easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp" });
  const letters = fl.t.split("");
  const sub = spring({ frame: f - 40, fps, config: { damping: 14 } });
  const tag = spring({ frame: f - 8, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ background: INK, fontFamily: FONT }}>
      <KenBurns src={fl.img} />
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${fl.c}cc, transparent 60%), linear-gradient(0deg, #0d0a24f2, transparent 55%)` }} />
      <FilmStrip side="left" /><FilmStrip side="right" />
      <Grain color={fl.c} n={18} />
      <div style={{ position: "absolute", left: 130, top: 90, transform: `scale(${tag}) rotate(-4deg)`, transformOrigin: "left center", background: fl.c, color: INK, border: `6px solid ${INK}`, padding: "6px 28px", borderRadius: 16, fontSize: 38, boxShadow: `0 8px 0 ${INK}` }}>
        AHORA: PREGUNTAS DE
      </div>
      <div style={{ position: "absolute", left: 130, right: 130, bottom: 150, display: "flex", flexWrap: "wrap", columnGap: 36 }}>
        {(() => { let k = 0; return fl.t.split(" ").map((word, wi) => (
          <span key={wi} style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
            {word.split("").map((ch) => { const i = k++; const s = spring({ frame: f - 14 - i * 2, fps, config: { damping: 9, stiffness: 150 } }); return (
              <span key={i} style={{
                display: "inline-block", fontSize: fl.t.length > 12 ? 118 : 150, lineHeight: 1.05, color: "#fff",
                WebkitTextStroke: `9px ${INK}`, paintOrder: "stroke fill", textShadow: `0 10px 0 ${fl.c}`,
                transform: `translateY(${(1 - s) * 260}px) rotate(${(1 - s) * (i % 2 ? 14 : -14)}deg) scale(${0.6 + 0.4 * s})`, opacity: s,
              }}>{ch}</span>); })}
          </span>)); })()}
      </div>
      <div style={{ position: "absolute", left: 134, bottom: 82, fontSize: 44, color: "#fff", opacity: sub, transform: `translateX(${(1 - sub) * -60}px)`, textShadow: `0 4px 0 ${INK}` }}>
        {fl.s}
      </div>
      {/* cortinillas de color */}
      <AbsoluteFill style={{ background: fl.c, clipPath: `inset(0 ${100 - wipe}% 0 0)`, opacity: f < 16 ? 1 : 0 }} />
      <AbsoluteFill style={{ background: INK, clipPath: `inset(0 0 0 ${100 - wipeOut}%)` }} />
    </AbsoluteFill>
  );
};

/* ---------- Final (6 s) ---------- */
const Finale = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const open = interpolate(f, [0, 40], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateRight: "clamp" });
  const t = spring({ frame: f - 30, fps, config: { damping: 8, stiffness: 120 } });
  const beam = Math.sin(f / 18) * 120;
  const keys = ["poeta", "contador", "tropic"];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #5b21b6, #0d0a24 70%)", fontFamily: FONT }}>
      <KenBurns src="tropic.jpg" from={1.1} to={1.2} tint="#3b1a7acc" />
      <AbsoluteFill style={{ background: `conic-gradient(from ${180 + beam / 6}deg at 50% -10%, transparent 0 40deg, rgba(255,230,120,.35) 55deg, transparent 70deg)` }} />
      <Grain color="#ffc21a" n={40} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", transform: `scale(${t})` }}>
          <div style={{ fontSize: 120, color: "#fff", WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill", textShadow: "0 12px 0 #ff3b8d, 0 0 60px #ff3b8d" }}>¡FIN DE LA FUNCIÓN!</div>
          <div style={{ marginTop: 14, display: "inline-block", background: "linear-gradient(#ffe066,#ffb300)", border: "8px solid #ff3b3b", borderRadius: 18, padding: "6px 40px", fontSize: 56, color: INK, letterSpacing: 6 }}>GRACIAS POR JUGAR</div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18 }}>
        {keys.map((k, i) => (
          <div key={k} style={{ background: FILMS[k].c, color: INK, border: `5px solid ${INK}`, borderRadius: 14, padding: "4px 20px", fontSize: 30, transform: `translateY(${(1 - spring({ frame: f - 60 - i * 6, fps })) * 120}px)` }}>{FILMS[k].t}</div>
        ))}
      </div>
      {/* telón */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "50%", background: "linear-gradient(90deg,#7f1d1d,#b91c1c 70%,#7f1d1d)", transform: `translateX(${-open * 100}%)`, boxShadow: "20px 0 40px rgba(0,0,0,.5)" }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "50%", background: "linear-gradient(90deg,#7f1d1d,#b91c1c 30%,#7f1d1d)", transform: `translateX(${open * 100}%)`, boxShadow: "-20px 0 40px rgba(0,0,0,.5)" }} />
    </AbsoluteFill>
  );
};

const Root = () => (
  <>
    <Composition id="Intro" component={Intro} durationInFrames={260} fps={30} width={1280} height={720} />
    <Composition id="Film" component={Film} durationInFrames={120} fps={30} width={1280} height={720} defaultProps={{ film: "poeta" }} />
    <Composition id="Finale" component={Finale} durationInFrames={180} fps={30} width={1280} height={720} />
  </>
);
registerRoot(Root);

import React from "react";
import {
  AbsoluteFill,
  Composition,
  Sequence,
  interpolate,
  registerRoot,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const FONT = "'Arial Black', 'Helvetica Neue', Arial, sans-serif";

const Background = () => {
  const f = useCurrentFrame();
  const hue = interpolate(f, [0, 180], [250, 310]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${30 + Math.sin(f / 25) * 20}% ${
          40 + Math.cos(f / 30) * 20
        }%, hsl(${hue + 40} 90% 45%) 0%, hsl(${hue} 80% 22%) 45%, hsl(${hue - 20} 70% 8%) 100%)`,
      }}
    >
      {Array.from({ length: 26 }).map((_, i) => {
        const x = (i * 197) % 1280;
        const y = ((i * 89 + f * (1.2 + (i % 5) * 0.5)) % 820) - 50;
        const size = 10 + (i % 4) * 8;
        const colors = ["#ffd23f", "#ff3b8d", "#22d3ee", "#7CFC00"];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: 770 - y,
              width: size,
              height: size,
              borderRadius: i % 3 === 0 ? 99 : 4,
              background: colors[i % 4],
              opacity: 0.55,
              transform: `rotate(${f * (2 + (i % 3))}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Clapper = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: f, fps, config: { damping: 9, stiffness: 120 } });
  const snap = interpolate(f, [14, 20, 26], [-22, 0, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const y = interpolate(drop, [0, 1], [-420, 0]);
  return (
    <div style={{ position: "absolute", left: 440, top: 70 + y, width: 400 }}>
      <div
        style={{
          height: 70,
          transformOrigin: "left bottom",
          transform: `rotate(${snap}deg)`,
          background: "repeating-linear-gradient(115deg,#fff 0 40px,#14102b 40px 80px)",
          borderRadius: "14px 14px 0 0",
          border: "6px solid #14102b",
        }}
      />
      <div
        style={{
          height: 70,
          background: "repeating-linear-gradient(115deg,#14102b 0 40px,#fff 40px 80px)",
          borderRadius: "0 0 0 0",
          border: "6px solid #14102b",
          borderTop: 0,
        }}
      />
    </div>
  );
};

const Title = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const letters = ["K", "M", "S"];
  const colors = ["#ff3b8d", "#ffd23f", "#22d3ee"];
  const lights = interpolate(f, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const m = spring({ frame: f - 40, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT, top: 70 }}>
      <div style={{ display: "flex", gap: 14 }}>
        {letters.map((l, i) => {
          const s = spring({ frame: f - 22 - i * 5, fps, config: { damping: 8, stiffness: 140 } });
          return (
            <div
              key={l}
              style={{
                fontSize: 230,
                lineHeight: 1,
                color: "#fff",
                WebkitTextStroke: "10px #14102b",
                paintOrder: "stroke fill",
                textShadow: `0 12px 0 ${colors[i]}, 0 0 40px ${colors[i]}`,
                transform: `scale(${s}) rotate(${(1 - s) * -30}deg)`,
              }}
            >
              {l}
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 6,
          padding: "10px 60px",
          borderRadius: 18,
          background: "linear-gradient(#ffe066,#ffb300)",
          border: "8px solid #ff3b3b",
          boxShadow: `0 0 ${50 * lights}px #ffd23f`,
          fontSize: 84,
          color: "#14102b",
          letterSpacing: 8,
          transform: `scale(${m})`,
          position: "relative",
        }}
      >
        MOVIES
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: -2,
              left: 30 + i * 36,
              width: 10,
              height: 10,
              borderRadius: 99,
              background: (f + i * 3) % 12 < 6 ? "#fff" : "#fff3b0",
              opacity: 0.4 + 0.6 * ((f + i * 3) % 12 < 6 ? 1 : 0.3),
              boxShadow: "0 0 10px #fff",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const films = [
  { t: "EL POETA", s: "Colombia · Medellín", c: "#ff3b8d" },
  { t: "EL CONTADOR", s: "Ben Affleck · Acción", c: "#22d3ee" },
  { t: "TROPIC THUNDER", s: "Dir. Ben Stiller · Comedia", c: "#7CFC00" },
];

const FilmCard = ({ film, index }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - index * 12, fps, config: { damping: 13 } });
  const x = interpolate(s, [0, 1], [index % 2 ? 900 : -900, 0]);
  return (
    <div
      style={{
        transform: `translateX(${x}px) rotate(${(index - 1) * 2}deg)`,
        width: 900,
        padding: "18px 40px",
        borderRadius: 24,
        background: film.c,
        border: "8px solid #14102b",
        boxShadow: "0 12px 0 #14102b",
        fontFamily: FONT,
        color: "#14102b",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
      }}
    >
      <span style={{ fontSize: 76 }}>{film.t}</span>
      <span style={{ fontSize: 28 }}>{film.s}</span>
    </div>
  );
};

const Films = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: f, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 26 }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 54,
          color: "#fff",
          letterSpacing: 4,
          marginBottom: 6,
          transform: `scale(${head})`,
          textShadow: "0 6px 0 #14102b",
        }}
      >
        3 PELÍCULAS · 1 TRIVIA
      </div>
      {films.map((fm, i) => (
        <FilmCard key={fm.t} film={fm} index={i} />
      ))}
    </AbsoluteFill>
  );
};

const Countdown = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = 3 - Math.floor(f / 20);
  const local = f % 20;
  const s = spring({ frame: local, fps, config: { damping: 7, stiffness: 160 } });
  const label = n > 0 ? String(n) : "¡YA!";
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div
        style={{
          fontSize: n > 0 ? 420 : 300,
          color: "#fff",
          WebkitTextStroke: "14px #14102b",
          paintOrder: "stroke fill",
          textShadow: "0 16px 0 #ffd23f, 0 0 80px #ff3b8d",
          transform: `scale(${0.4 + s * 0.8})`,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};

const Intro = () => (
  <AbsoluteFill>
    <Background />
    <Sequence from={0} durationInFrames={95}>
      <Clapper />
      <Title />
    </Sequence>
    <Sequence from={95} durationInFrames={85}>
      <Films />
    </Sequence>
    <Sequence from={180} durationInFrames={80}>
      <Countdown />
    </Sequence>
  </AbsoluteFill>
);

const Root = () => (
  <Composition id="Intro" component={Intro} durationInFrames={260} fps={30} width={1280} height={720} />
);

registerRoot(Root);

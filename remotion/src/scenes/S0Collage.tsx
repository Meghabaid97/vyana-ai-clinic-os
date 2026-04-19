import React from "react";
import { AbsoluteFill, Img, staticFile, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS } from "../theme";

// 5x4 collage (20 cells) using extracted still frames (4 per clip) for low compositor load.
// Each cell cross-fades between its 4 stills with Ken Burns + staggered entrance, then collapses to logo.

const CLIP_NAMES = [
  "c01-mother-drawer", "c02-whatsapp-scroll", "c03-father-calling", "c04-pharmacy-wait",
  "c05-ambulance", "c06-explain-doctor", "c07-pills-elderly", "c08-insurance-claim",
  "c09-army-jawan", "c10-old-prescription", "c11-rural-clinic", "c12-er-entry",
];

const ORDER = [3, 12, 8, 17, 1, 14, 6, 11, 19, 4, 10, 16, 0, 13, 9, 18, 2, 7, 15, 5];
const CELLS = Array.from({ length: 20 }, (_, i) => ({
  name: CLIP_NAMES[i % CLIP_NAMES.length],
  startStill: i % 4,
  order: ORDER[i],
}));

const COLS = 5;
const ROWS = 4;

const Cell: React.FC<{
  name: string; startStill: number; appearAt: number; col: number; row: number;
  cellW: number; cellH: number; width: number; height: number; collapse: number;
}> = ({ name, startStill, appearAt, col, row, cellW, cellH, width, height, collapse }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - appearAt, fps, config: { damping: 26, stiffness: 110 } });

  // Cycle through 4 stills with cross-fade
  const localFrame = Math.max(0, frame - appearAt);
  const stillDuration = 90; // 3s per still
  const fadeDuration = 30;
  const stillIndex = Math.floor(localFrame / stillDuration);
  const intoStill = localFrame - stillIndex * stillDuration;
  const fadeIn = interpolate(intoStill, [0, fadeDuration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const currentStill = ((startStill + stillIndex) % 4) + 1;
  const nextStill = ((startStill + stillIndex + 1) % 4) + 1;

  const kb = interpolate(localFrame, [0, 420], [1.05, 1.20], { extrapolateRight: "clamp" });

  const cx = col * cellW + cellW / 2;
  const cy = row * cellH + cellH / 2;
  const dx = (width / 2 - cx) * collapse;
  const dy = (height / 2 - cy) * collapse;
  const collapseScale = interpolate(collapse, [0, 1], [1, 0.05]);
  const collapseOp = interpolate(collapse, [0, 0.6, 1], [1, 0.4, 0]);

  return (
    <div style={{
      position: "absolute", left: col * cellW, top: row * cellH,
      width: cellW, height: cellH, overflow: "hidden",
      transform: `translate(${dx}px, ${dy}px) scale(${collapseScale})`,
      opacity: enter * collapseOp, background: "#0A0908",
    }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${kb})`, filter: "saturate(0.85) contrast(1.05)" }}>
        <Img src={staticFile(`stills/${name}-${currentStill}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
        <Img src={staticFile(`stills/${name}-${nextStill}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, opacity: fadeIn }} />
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 50%, rgba(10,9,8,0.4) 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)", pointerEvents: "none" }} />
    </div>
  );
};

export const S0Collage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const STAGGER = 6;
  const HOLD_END = durationInFrames - 50;

  const collapse = interpolate(frame, [HOLD_END, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoEnter = spring({ frame: frame - (HOLD_END + 8), fps, config: { damping: 22 } });

  const cellW = width / COLS;
  const cellH = height / ROWS;

  return (
    <AbsoluteFill style={{ background: "#0A0908" }}>
      {CELLS.map((c, i) => {
        const row = Math.floor(i / COLS);
        const col = i % COLS;
        return (
          <Cell key={i} name={c.name} startStill={c.startStill} appearAt={c.order * STAGGER}
            col={col} row={row} cellW={cellW} cellH={cellH} width={width} height={height} collapse={collapse} />
        );
      })}

      <AbsoluteFill style={{
        background: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.65) 100%)",
        pointerEvents: "none",
        opacity: interpolate(frame, [60, durationInFrames - 60], [0.3, 0.85]),
      }} />

      <AbsoluteFill style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: interpolate(frame, [120, 180, HOLD_END - 20, HOLD_END], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 78, color: "#F4ECE0",
          textAlign: "center", letterSpacing: -1.5, fontWeight: 400, lineHeight: 1.15,
          textShadow: "0 4px 30px rgba(0,0,0,0.6)",
        }}>
          A billion stories.<br/>
          <em style={{ color: COLORS.coral, fontStyle: "italic" }}>One missing thread.</em>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{
        display: "flex", alignItems: "center", justifyContent: "center", opacity: logoEnter,
      }}>
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 140, color: "#F4ECE0",
          letterSpacing: -3, fontWeight: 500,
          transform: `scale(${interpolate(logoEnter, [0, 1], [0.9, 1])})`,
        }}>
          Vyana
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Img, staticFile, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS } from "../theme";

// 4x3 hero collage — 12 large legible images of the everyday Indian healthcare struggle.
// Builds chaos in waves → headline reveals → collapses into Vyana logo.

type CellData = { name: string; still: number; caption: string; sub: string };

const CELLS: CellData[] = [
  { name: "c10-old-prescription", still: 2, caption: "75 pages",        sub: "of scattered reports" },
  { name: "c06-explain-doctor",   still: 1, caption: "5 minutes",        sub: "to explain everything" },
  { name: "c04-pharmacy-wait",    still: 3, caption: "Same tests",       sub: "ordered again" },
  { name: "c12-er-entry",         still: 1, caption: "2 AM",             sub: "no records, no history" },
  { name: "c01-mother-drawer",    still: 2, caption: "In a drawer",      sub: "somewhere at home" },
  { name: "c03-father-calling",   still: 1, caption: "Calling family",   sub: "to remember the dose" },
  { name: "c07-pills-elderly",    still: 2, caption: "Which pill",       sub: "was for what?" },
  { name: "c02-whatsapp-scroll",  still: 1, caption: "Scrolling chats",  sub: "to find a report" },
  { name: "c11-rural-clinic",     still: 1, caption: "Village clinic",   sub: "no past history" },
  { name: "c08-insurance-claim",  still: 2, caption: "Insurance",        sub: "rejected — missing docs" },
  { name: "c05-ambulance",        still: 1, caption: "Ambulance ride",   sub: "starting from zero" },
  { name: "c09-army-jawan",       still: 1, caption: "Posted far away",  sub: "parents on their own" },
];

const COLS = 4;
const ROWS = 3;

const Cell: React.FC<{
  data: CellData; appearAt: number; col: number; row: number;
  cellW: number; cellH: number; width: number; height: number; collapse: number;
}> = ({ data, appearAt, col, row, cellW, cellH, width, height, collapse }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - appearAt, fps, config: { damping: 24, stiffness: 130 } });
  const localFrame = Math.max(0, frame - appearAt);
  const captionEnter = spring({ frame: frame - appearAt - 14, fps, config: { damping: 22, stiffness: 140 } });

  // Slow Ken Burns
  const kb = interpolate(localFrame, [0, 360], [1.04, 1.13], { extrapolateRight: "clamp" });
  const kbX = interpolate(localFrame, [0, 360], [0, (col - 1.5) * -8], { extrapolateRight: "clamp" });

  const cx = col * cellW + cellW / 2;
  const cy = row * cellH + cellH / 2;
  const dx = (width / 2 - cx) * collapse;
  const dy = (height / 2 - cy) * collapse;
  const collapseScale = interpolate(collapse, [0, 1], [1, 0.04]);
  const collapseOp = interpolate(collapse, [0, 0.6, 1], [1, 0.3, 0]);

  const PAD = 7;
  return (
    <div style={{
      position: "absolute", left: col * cellW + PAD, top: row * cellH + PAD,
      width: cellW - PAD * 2, height: cellH - PAD * 2, overflow: "hidden",
      transform: `translate(${dx}px, ${dy}px) scale(${interpolate(enter, [0, 1], [0.92, 1]) * collapseScale})`,
      opacity: enter * collapseOp, background: "#0A0908",
      borderRadius: 5,
      boxShadow: "0 16px 50px -18px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.05)",
    }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${kb}) translateX(${kbX}px)`, filter: "saturate(0.78) contrast(1.08) brightness(0.82)" }}>
        <Img src={staticFile(`stills/${data.name}-${data.still}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      {/* Bottom gradient for caption legibility */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 45%, rgba(10,9,8,0.88) 100%)", pointerEvents: "none" }} />
      {/* Caption */}
      <div style={{
        position: "absolute", left: 18, right: 18, bottom: 18,
        opacity: captionEnter,
        transform: `translateY(${(1 - captionEnter) * 12}px)`,
      }}>
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 34, color: "#F4ECE0",
          letterSpacing: -0.8, fontWeight: 500, lineHeight: 1.0,
        }}>{data.caption}</div>
        <div style={{
          fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.coral,
          letterSpacing: 0.4, fontWeight: 600, marginTop: 5, textTransform: "uppercase",
        }}>{data.sub}</div>
      </div>
    </div>
  );
};

export const S0Collage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // 14s scene: cells stagger in (waves) → headline reveals → hold → collapse.
  const STAGGER = 9; // 12 cells × 9 = 108 frames in
  const HOLD_END = durationInFrames - 40;

  const collapse = interpolate(frame, [HOLD_END, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoEnter = spring({ frame: frame - (HOLD_END + 6), fps, config: { damping: 20, stiffness: 110 } });

  const cellW = width / COLS;
  const cellH = height / ROWS;

  // Headline phase
  const headlineEnter = spring({ frame: frame - 170, fps, config: { damping: 22, stiffness: 100 } });
  const headlineOut = interpolate(frame, [HOLD_END - 30, HOLD_END], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headlineOp = headlineEnter * headlineOut;

  return (
    <AbsoluteFill style={{ background: "#0A0908" }}>
      {/* Cell grid */}
      {CELLS.map((c, i) => {
        const row = Math.floor(i / COLS);
        const col = i % COLS;
        return (
          <Cell key={i} data={c} appearAt={i * STAGGER}
            col={col} row={row} cellW={cellW} cellH={cellH} width={width} height={height} collapse={collapse} />
        );
      })}

      {/* Vignette darkening for headline phase */}
      <AbsoluteFill style={{
        background: "radial-gradient(ellipse at 50% 50%, rgba(10,9,8,0.4) 0%, rgba(10,9,8,0.94) 75%)",
        pointerEvents: "none",
        opacity: interpolate(frame, [140, 210, HOLD_END - 30, HOLD_END], [0, 0.96, 0.96, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }} />

      {/* Hero headline overlay */}
      <AbsoluteFill style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: headlineOp, padding: "0 120px",
      }}>
        <div style={{ textAlign: "center", maxWidth: 1500 }}>
          <div style={{
            fontFamily: "Inter, sans-serif", fontSize: 22, color: COLORS.coral,
            letterSpacing: 4, fontWeight: 600, textTransform: "uppercase",
            marginBottom: 36,
            transform: `translateY(${(1 - headlineEnter) * 20}px)`,
          }}>The everyday reality</div>
          <div style={{
            fontFamily: "Fraunces, serif", fontSize: 96, color: "#F4ECE0",
            letterSpacing: -2.5, fontWeight: 500, lineHeight: 1.05,
            textShadow: "0 6px 40px rgba(0,0,0,0.85)",
          }}>
            A billion patients.<br/>
            <em style={{ color: COLORS.coral, fontStyle: "italic", fontWeight: 400 }}>No medical memory.</em>
          </div>
          <div style={{
            fontFamily: "Inter, sans-serif", fontSize: 26, color: "#C9BDB0",
            fontWeight: 400, marginTop: 36, lineHeight: 1.4, maxWidth: 900,
            margin: "36px auto 0",
            opacity: interpolate(frame, [210, 250], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}>
            Every doctor visit starts from zero. Every test gets repeated.<br/>Every family carries the records in their head.
          </div>
        </div>
      </AbsoluteFill>

      {/* Vyana logo at the very end */}
      <AbsoluteFill style={{
        display: "flex", alignItems: "center", justifyContent: "center", opacity: logoEnter,
      }}>
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 160, color: "#F4ECE0",
          letterSpacing: -4, fontWeight: 500,
          transform: `scale(${interpolate(logoEnter, [0, 1], [0.85, 1])})`,
        }}>
          Vyana
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

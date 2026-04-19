import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS } from "../theme";

// 5x4 collage (20 cells) of 12 generated vignettes (some repeated in different cells).
// Cells fade in staggered, hold, then collapse into the Vyana logo reveal.

const CLIPS = [
  "clips/c01-mother-drawer.mp4",
  "clips/c02-whatsapp-scroll.mp4",
  "clips/c03-father-calling.mp4",
  "clips/c04-pharmacy-wait.mp4",
  "clips/c05-ambulance.mp4",
  "clips/c06-explain-doctor.mp4",
  "clips/c07-pills-elderly.mp4",
  "clips/c08-insurance-claim.mp4",
  "clips/c09-army-jawan.mp4",
  "clips/c10-old-prescription.mp4",
  "clips/c11-rural-clinic.mp4",
  "clips/c12-er-entry.mp4",
];

// Build 20 cells from the 12 clips; vary playback offset for visual variety.
const CELLS = Array.from({ length: 20 }, (_, i) => ({
  src: CLIPS[i % CLIPS.length],
  // start time offset within the 5s clip
  startFrom: ((i * 17) % 90) / 30, // seconds
  // unique entrance order
  order: [3, 12, 8, 17, 1, 14, 6, 11, 19, 4, 10, 16, 0, 13, 9, 18, 2, 7, 15, 5][i],
}));

const COLS = 5;
const ROWS = 4;

export const S0Collage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Each cell appears in sequence
  const STAGGER = 6; // frames between cell entrances
  const HOLD_END = durationInFrames - 50; // start collapse 50f before end

  // Final collapse to logo
  const collapse = interpolate(frame, [HOLD_END, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoEnter = spring({ frame: frame - (HOLD_END + 8), fps, config: { damping: 22 } });

  const cellW = width / COLS;
  const cellH = height / ROWS;

  return (
    <AbsoluteFill style={{ background: "#0A0908" }}>
      {/* Grid */}
      {CELLS.map((c, i) => {
        const row = Math.floor(i / COLS);
        const col = i % COLS;
        const appearAt = c.order * STAGGER;
        const enter = spring({ frame: frame - appearAt, fps, config: { damping: 26, stiffness: 110 } });

        // Subtle ken burns
        const kb = interpolate(frame - appearAt, [0, 240], [1.05, 1.18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

        // Collapse: cells slide toward center as logo appears
        const cx = col * cellW + cellW / 2;
        const cy = row * cellH + cellH / 2;
        const dx = (width / 2 - cx) * collapse;
        const dy = (height / 2 - cy) * collapse;
        const collapseScale = interpolate(collapse, [0, 1], [1, 0.05]);
        const collapseOp = interpolate(collapse, [0, 0.6, 1], [1, 0.4, 0]);

        return (
          <div key={i} style={{
            position: "absolute",
            left: col * cellW,
            top: row * cellH,
            width: cellW,
            height: cellH,
            overflow: "hidden",
            transform: `translate(${dx}px, ${dy}px) scale(${collapseScale})`,
            opacity: enter * collapseOp,
            background: "#0A0908",
          }}>
            <div style={{
              width: "100%", height: "100%",
              transform: `scale(${kb})`,
              filter: "saturate(0.85) contrast(1.05)",
            }}>
              <OffthreadVideo
                src={staticFile(c.src)}
                startFrom={Math.floor(c.startFrom * fps)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                muted
              />
            </div>
            {/* Subtle vignette per cell */}
            <AbsoluteFill style={{
              background: "radial-gradient(circle at 50% 50%, transparent 50%, rgba(10,9,8,0.4) 100%)",
              pointerEvents: "none",
            }} />
            {/* Grid line */}
            <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)", pointerEvents: "none" }} />
          </div>
        );
      })}

      {/* Slow vignette darkening over time */}
      <AbsoluteFill style={{
        background: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.65) 100%)",
        pointerEvents: "none",
        opacity: interpolate(frame, [60, durationInFrames - 60], [0.3, 0.85]),
      }} />

      {/* Quiet caption that fades in mid-collage */}
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

      {/* Logo reveal at the end */}
      <AbsoluteFill style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: logoEnter,
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

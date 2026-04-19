import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// S1: The drawer. Slow zoom into a wooden-looking drawer revealing scattered papers.
export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;
  const slowZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.08]);

  const drawerOpen = spring({ frame: frame - 30, fps, config: { damping: 30, stiffness: 50 } });
  const titleEnter = spring({ frame: frame - 130, fps, config: { damping: 24 } });

  // Paper cards
  const papers = [
    { x: -180, y: 30, r: -8, label: "Rx · 2019", w: 200, h: 130, color: COLORS.cream, delay: 60 },
    { x: 60, y: 10, r: 6, label: "ECG Report", w: 240, h: 150, color: COLORS.paper, delay: 70 },
    { x: -50, y: 180, r: -3, label: "Lab Test · TSH", w: 220, h: 140, color: COLORS.coralSoft, delay: 80 },
    { x: 200, y: 200, r: 10, label: "Discharge", w: 200, h: 140, color: COLORS.paper, delay: 90 },
    { x: -250, y: 220, r: 14, label: "Dr. Sharma", w: 180, h: 120, color: COLORS.cream, delay: 100 },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #F4ECE0 0%, #E8DDC9 100%)`, opacity: op }}>
      {/* Vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, transparent 0%, rgba(20,15,10,0.45) 100%)" }} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${slowZoom})` }}>
        {/* Drawer body */}
        <div style={{
          width: 1100, height: 620, background: "linear-gradient(180deg, #6B4A2A 0%, #4A3018 100%)",
          borderRadius: 12, position: "relative",
          boxShadow: "inset 0 60px 120px rgba(0,0,0,0.5), 0 30px 80px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}>
          {/* Inner felt */}
          <div style={{
            position: "absolute", inset: 24, background: "linear-gradient(180deg, #2B1E12 0%, #1A1208 100%)",
            borderRadius: 8, transform: `translateY(${interpolate(drawerOpen, [0, 1], [-60, 0])}px)`,
            opacity: drawerOpen,
          }}>
            {papers.map((p, i) => {
              const enter = spring({ frame: frame - p.delay, fps, config: { damping: 20 } });
              return (
                <div key={i} style={{
                  position: "absolute", left: "50%", top: "50%",
                  width: p.w, height: p.h, background: p.color,
                  transform: `translate(-50%, -50%) translate(${p.x}px, ${p.y}px) rotate(${p.r}deg) scale(${enter})`,
                  borderRadius: 4, padding: 16,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  fontFamily: "Fraunces, serif", fontSize: 14, color: "#3a2e22",
                  display: "flex", flexDirection: "column", gap: 8, opacity: enter,
                }}>
                  <div style={{ width: "60%", height: 2, background: "#8a7560", opacity: 0.6 }} />
                  <div style={{ width: "80%", height: 2, background: "#8a7560", opacity: 0.4 }} />
                  <div style={{ width: "50%", height: 2, background: "#8a7560", opacity: 0.4 }} />
                  <div style={{ marginTop: "auto", fontSize: 11, fontWeight: 600, color: COLORS.coralDeep, letterSpacing: 1, textTransform: "uppercase" }}>
                    {p.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div style={{
          marginTop: 60,
          fontFamily: "Fraunces, serif",
          fontSize: 56, color: "#F4ECE0", letterSpacing: -1,
          opacity: titleEnter,
          transform: `translateY(${interpolate(titleEnter, [0, 1], [20, 0])}px)`,
          textShadow: "0 2px 20px rgba(0,0,0,0.6)",
          textAlign: "center", maxWidth: 900, fontWeight: 400,
        }}>
          In every Indian home, <em style={{ color: COLORS.coral, fontStyle: "italic" }}>there is a drawer.</em>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

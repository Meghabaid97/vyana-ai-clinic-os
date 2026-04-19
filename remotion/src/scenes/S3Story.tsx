import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { FloatingAccents } from "../components/AppPhone";

export const S3Story: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  // Per-word kinetic typography
  const words1 = ["Health", "isn't", "a", "document."];
  const words2 = ["It's", "a", "story."];

  // Continuous slow zoom for energy
  const camZoom = interpolate(frame, [0, durationInFrames], [1, 1.05]);
  const camX = Math.sin(frame / 80) * 8;

  const sub = spring({ frame: frame - 200, fps, config: { damping: 26 } });
  const lineGrow = interpolate(frame, [120, 240], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.cream, opacity: op }}>
      <FloatingAccents seed={1} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 70% 30%, rgba(232,169,87,0.15) 0%, transparent 50%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 20% 80%, rgba(232,112,77,0.06) 0%, transparent 50%)" }} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 100, flexDirection: "column", transform: `scale(${camZoom}) translateX(${camX}px)` }}>
        {/* Per-word reveal line 1 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center" }}>
          {words1.map((w, i) => {
            const wEnter = spring({ frame: frame - (15 + i * 8), fps, config: { damping: 22, stiffness: 110 } });
            return (
              <span key={i} style={{
                fontFamily: "Fraunces, serif", fontSize: 48, color: COLORS.inkSoft, fontWeight: 500,
                letterSpacing: -0.5, opacity: wEnter,
                transform: `translateY(${interpolate(wEnter, [0, 1], [20, 0])}px)`,
              }}>{w}</span>
            );
          })}
        </div>

        {/* Per-word reveal line 2 (the punchline) */}
        <div style={{ marginTop: 36, display: "flex", flexWrap: "wrap", gap: 30, justifyContent: "center", alignItems: "baseline" }}>
          {words2.map((w, i) => {
            const wEnter = spring({ frame: frame - (80 + i * 12), fps, config: { damping: 18, stiffness: 100 } });
            const isAccent = w === "story.";
            return (
              <span key={i} style={{
                fontFamily: "Fraunces, serif", fontSize: 160, lineHeight: 1, fontWeight: 400, letterSpacing: -5,
                color: isAccent ? COLORS.coral : COLORS.ink,
                fontStyle: isAccent ? "italic" : "normal",
                opacity: wEnter,
                position: "relative",
                transform: `translateY(${interpolate(wEnter, [0, 1], [40, 0])}px) scale(${interpolate(wEnter, [0, 1], [0.85, 1])})`,
              }}>
                {w}
                {isAccent && (
                  <span style={{
                    position: "absolute", left: 0, right: 0, bottom: -10, height: 5,
                    background: COLORS.coral, transformOrigin: "left", transform: `scaleX(${lineGrow})`,
                    borderRadius: 3,
                  }} />
                )}
              </span>
            );
          })}
        </div>

        <div style={{
          marginTop: 70, fontFamily: "Inter, sans-serif", fontSize: 22, lineHeight: 1.7,
          color: COLORS.inkSoft, textAlign: "center", maxWidth: 800, opacity: sub,
          transform: `translateY(${interpolate(sub, [0, 1], [16, 0])}px)`,
        }}>
          Slow. Layered. Written across years —<br/>
          across doctors, across small moments only <em style={{ color: COLORS.ink }}>you</em> should own.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

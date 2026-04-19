import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone, FloatingAccents } from "../components/AppPhone";
import { MockHome } from "../components/MockScreens";

export const S5YourStory: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const titleEnter = spring({ frame: frame - 70, fps, config: { damping: 22 } });
  const subEnter = spring({ frame: frame - 140, fps, config: { damping: 22 } });
  const camX = Math.sin(frame / 90) * 10;

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <FloatingAccents seed={3} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 25% 50%, rgba(232,112,77,0.06) 0%, transparent 55%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 100, paddingLeft: 40, transform: `translateX(${camX}px)` }}>
        <div style={{ flexShrink: 0 }}>
          <AppPhone delay={15} scale={0.9}><MockHome /></AppPhone>
        </div>

        <div style={{ maxWidth: 720 }}>
          <div style={{ fontFamily: "Inter", fontSize: 16, letterSpacing: 5, color: COLORS.coral, textTransform: "uppercase", fontWeight: 700, opacity: titleEnter }}>
            Your story
          </div>
          <div style={{
            marginTop: 18, fontFamily: "Fraunces, serif", fontSize: 92, lineHeight: 1.0, color: COLORS.ink,
            letterSpacing: -2.5, fontWeight: 400, opacity: titleEnter,
            transform: `translateY(${interpolate(titleEnter, [0, 1], [22, 0])}px)`,
          }}>
            Always with you.<br />
            <em style={{ color: COLORS.coral, fontStyle: "italic" }}>Quietly.</em>
          </div>
          <div style={{
            marginTop: 40, fontFamily: "Inter, sans-serif", fontSize: 24, lineHeight: 1.55,
            color: COLORS.inkSoft, maxWidth: 560, opacity: subEnter,
            transform: `translateY(${interpolate(subEnter, [0, 1], [14, 0])}px)`,
          }}>
            Every visit, every report, every medicine — gathered into one warm, continuous record.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

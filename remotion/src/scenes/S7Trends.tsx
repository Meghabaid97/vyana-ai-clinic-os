import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone, FloatingAccents } from "../components/AppPhone";
import { MockTrends } from "../components/MockScreens";

export const S7Trends: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const titleEnter = spring({ frame: frame - 40, fps, config: { damping: 22 } });
  const subEnter = spring({ frame: frame - 120, fps, config: { damping: 22 } });
  const camX = Math.sin(frame / 85) * 10;

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <FloatingAccents seed={5} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 30% 30%, rgba(122,155,126,0.1) 0%, transparent 55%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 80, paddingLeft: 40, transform: `translateX(${camX}px)` }}>
        <div style={{ flexShrink: 0 }}>
          <AppPhone delay={15} rotate={-2} scale={0.9}><MockTrends /></AppPhone>
        </div>

        <div style={{ maxWidth: 720 }}>
          <div style={{ fontFamily: "Inter", fontSize: 16, letterSpacing: 5, color: COLORS.coral, textTransform: "uppercase", fontWeight: 700, opacity: titleEnter }}>
            Vitals over years
          </div>
          <div style={{
            marginTop: 16, fontFamily: "Fraunces, serif", fontSize: 78, lineHeight: 1.05, color: COLORS.ink,
            letterSpacing: -2, fontWeight: 400,
            opacity: titleEnter, transform: `translateY(${interpolate(titleEnter, [0, 1], [16, 0])}px)`,
          }}>
            Trends, visible<br/><em style={{ color: COLORS.coral, fontStyle: "italic" }}>before</em> problems.
          </div>
          <div style={{
            marginTop: 36, fontFamily: "Inter", fontSize: 22, color: COLORS.inkSoft, lineHeight: 1.55, maxWidth: 540,
            opacity: subEnter, transform: `translateY(${interpolate(subEnter, [0, 1], [14, 0])}px)`,
          }}>
            Sugar, pressure, thyroid, cholesterol —<br/>
            quietly tracked across years.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

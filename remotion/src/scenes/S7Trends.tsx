import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone } from "../components/AppPhone";
import { MockTrends } from "../components/MockScreens";

export const S7Trends: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const titleEnter = spring({ frame: frame - 50, fps, config: { damping: 24 } });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 30% 30%, rgba(122,155,126,0.08) 0%, transparent 55%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 100, paddingLeft: 60 }}>
        <div style={{ flexShrink: 0 }}>
          <AppPhone delay={15} rotate={-2}><MockTrends /></AppPhone>
        </div>

        <div style={{ maxWidth: 700 }}>
          <div style={{ fontFamily: "Inter", fontSize: 14, letterSpacing: 4, color: COLORS.coral, textTransform: "uppercase", fontWeight: 600, opacity: titleEnter }}>
            Vitals over years
          </div>
          <div style={{
            marginTop: 14, fontFamily: "Fraunces, serif", fontSize: 60, lineHeight: 1.1, color: COLORS.ink,
            letterSpacing: -1.5, fontWeight: 400,
            opacity: titleEnter, transform: `translateY(${interpolate(titleEnter, [0, 1], [12, 0])}px)`,
          }}>
            Trends become visible<br />
            <em style={{ color: COLORS.coral, fontStyle: "italic" }}>before</em> they become problems.
          </div>
          <div style={{
            marginTop: 32, fontFamily: "Inter", fontSize: 20, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 540,
            opacity: spring({ frame: frame - 130, fps, config: { damping: 24 } }),
          }}>
            Sugar, pressure, thyroid, cholesterol —<br />
            quietly tracked across years.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

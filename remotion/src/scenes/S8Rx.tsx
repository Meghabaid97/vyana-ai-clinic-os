import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone } from "../components/AppPhone";
import { MockRx } from "../components/MockScreens";

export const S8Rx: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const titleEnter = spring({ frame: frame - 50, fps, config: { damping: 24 } });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 70% 30%, rgba(232,112,77,0.07) 0%, transparent 55%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 100, paddingRight: 60 }}>
        <div style={{ flexShrink: 0 }}>
          <AppPhone delay={15} rotate={2}><MockRx /></AppPhone>
        </div>

        <div style={{ maxWidth: 700 }}>
          <div style={{ fontFamily: "Inter", fontSize: 14, letterSpacing: 4, color: COLORS.coral, textTransform: "uppercase", fontWeight: 600, opacity: titleEnter }}>
            Even handwritten · 5 languages
          </div>
          <div style={{
            marginTop: 14, fontFamily: "Fraunces, serif", fontSize: 60, lineHeight: 1.1, color: COLORS.ink,
            letterSpacing: -1.5, fontWeight: 400,
            opacity: titleEnter, transform: `translateY(${interpolate(titleEnter, [0, 1], [12, 0])}px)`,
          }}>
            Medicine, never <em style={{ color: COLORS.coral, fontStyle: "italic" }}>lost in translation.</em>
          </div>
          <div style={{
            marginTop: 28, fontFamily: "Inter", fontSize: 19, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 520,
            opacity: spring({ frame: frame - 130, fps, config: { damping: 24 } }),
          }}>
            Tamil, Hindi, Telugu, Bengali, English.<br />
            Vyana reads, translates, and sets your reminders.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

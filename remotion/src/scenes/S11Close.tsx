import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

export const S11Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;
  const word = spring({ frame: frame - 10, fps, config: { damping: 18, stiffness: 100 } });
  const accent = interpolate(frame, [40, 80], [0, 1], { extrapolateRight: "clamp" });
  const tag = spring({ frame: frame - 80, fps, config: { damping: 24 } });
  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(232,112,77,0.07) 0%, transparent 60%)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 200, fontWeight: 500, letterSpacing: -8,
          color: COLORS.ink, opacity: word,
          transform: `scale(${interpolate(word, [0, 1], [0.95, 1])})`,
          display: "flex", alignItems: "baseline",
        }}>
          V<span style={{ color: COLORS.coral, opacity: accent }}>yana</span>
        </div>
        <div style={{
          marginTop: 36, fontFamily: "Fraunces, serif", fontSize: 32, color: COLORS.inkSoft,
          fontStyle: "italic", fontWeight: 400, letterSpacing: -0.5, opacity: tag,
          transform: `translateY(${interpolate(tag, [0, 1], [10, 0])}px)`,
        }}>
          The system that remembers.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

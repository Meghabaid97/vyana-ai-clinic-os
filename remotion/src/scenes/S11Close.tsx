import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { FloatingAccents } from "../components/AppPhone";

export const S11Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;
  const word = spring({ frame: frame - 5, fps, config: { damping: 16, stiffness: 100 } });
  const accent = interpolate(frame, [30, 70], [0, 1], { extrapolateRight: "clamp" });
  const tag = spring({ frame: frame - 70, fps, config: { damping: 22 } });
  const breath = 1 + Math.sin(frame / 30) * 0.015;

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <FloatingAccents seed={8} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(232,112,77,0.08) 0%, transparent 60%)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 240, fontWeight: 500, letterSpacing: -10,
          color: COLORS.ink, opacity: word,
          transform: `scale(${interpolate(word, [0, 1], [0.92, 1]) * breath})`,
          display: "flex", alignItems: "baseline",
        }}>
          V<span style={{ color: COLORS.coral, opacity: accent }}>yana</span>
        </div>
        <div style={{
          marginTop: 40, fontFamily: "Fraunces, serif", fontSize: 38, color: COLORS.inkSoft,
          fontStyle: "italic", fontWeight: 400, letterSpacing: -0.8, opacity: tag,
          transform: `translateY(${interpolate(tag, [0, 1], [12, 0])}px)`,
        }}>
          The system that remembers.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

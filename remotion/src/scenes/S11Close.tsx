import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// S11: Logo close
export const S11Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const v = spring({ frame: frame - 5, fps, config: { damping: 18 } });
  const yana = spring({ frame: frame - 25, fps, config: { damping: 22 } });
  const tag = spring({ frame: frame - 70, fps, config: { damping: 24 } });

  return (
    <AbsoluteFill style={{ background: COLORS.bgDark, opacity: op, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "baseline", fontFamily: "Fraunces, serif", fontWeight: 500 }}>
        <span style={{
          fontSize: 180, color: COLORS.coral, letterSpacing: -6,
          opacity: v, transform: `scale(${interpolate(v, [0, 1], [0.85, 1])})`,
        }}>V</span>
        <span style={{
          fontSize: 180, color: "#F4ECE0", letterSpacing: -6,
          opacity: yana, transform: `scale(${interpolate(yana, [0, 1], [0.85, 1])})`,
        }}>yana</span>
      </div>
      <div style={{
        marginTop: 16, fontSize: 24, fontFamily: "Fraunces, serif", color: "#A89F94", fontStyle: "italic",
        opacity: tag,
      }}>
        the system that remembers
      </div>
    </AbsoluteFill>
  );
};

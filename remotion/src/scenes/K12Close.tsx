import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS } from "../theme";

// Closing scene — dark, declarative, YC-pitch energy.
// "1.4 billion people. Zero persistent health memory. We're fixing that."
export const K12Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const op = interpolate(frame, [0, 20, durationInFrames - 18, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const l1 = spring({ frame: frame - 15,  fps, config: { damping: 22, stiffness: 110 } });
  const l2 = spring({ frame: frame - 55,  fps, config: { damping: 22, stiffness: 110 } });
  const l3 = spring({ frame: frame - 105, fps, config: { damping: 22, stiffness: 110 } });

  const logo = spring({ frame: frame - 180, fps, config: { damping: 14, stiffness: 90 } });
  const tag  = spring({ frame: frame - 230, fps, config: { damping: 22 } });
  const url  = spring({ frame: frame - 280, fps, config: { damping: 18 } });

  // Statement fades out as logo enters
  const stmtOut = interpolate(frame, [165, 195], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#0A0908", opacity: op }}>
      <AbsoluteFill style={{
        background: "radial-gradient(ellipse at 50% 45%, rgba(232,112,77,0.12) 0%, rgba(10,9,8,0) 60%)",
      }} />

      {/* Statement */}
      <AbsoluteFill style={{
        display: "flex", alignItems: "center", justifyContent: "center", padding: "0 160px",
        opacity: stmtOut,
      }}>
        <div style={{ textAlign: "center", maxWidth: 1600 }}>
          <div style={{
            fontFamily: "Fraunces, serif", fontSize: 110, color: "#F4ECE0",
            letterSpacing: -2.8, fontWeight: 500, lineHeight: 1.08,
            opacity: l1, transform: `translateY(${(1 - l1) * 24}px)`,
          }}>
            1.4 billion people.
          </div>
          <div style={{
            fontFamily: "Fraunces, serif", fontSize: 96, color: "#F4ECE0",
            letterSpacing: -2.4, fontWeight: 500, lineHeight: 1.08, marginTop: 18,
            opacity: l2, transform: `translateY(${(1 - l2) * 24}px)`,
          }}>
            <em style={{ color: COLORS.coral, fontStyle: "italic", fontWeight: 400 }}>Zero</em> persistent health memory.
          </div>
          <div style={{
            fontFamily: "Inter, sans-serif", fontSize: 30, color: "#C9BDB0",
            letterSpacing: 0.5, fontWeight: 500, marginTop: 50,
            opacity: l3, transform: `translateY(${(1 - l3) * 16}px)`,
          }}>
            We're fixing that.
          </div>
        </div>
      </AbsoluteFill>

      {/* Vyana logo + tagline */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 240, fontWeight: 500,
          letterSpacing: -10, lineHeight: 1, color: "#F4ECE0",
          opacity: logo, transform: `scale(${interpolate(logo, [0, 1], [0.7, 1])})`,
          display: "flex", alignItems: "baseline",
        }}>
          V<span style={{ color: COLORS.coral }}>yana</span>
        </div>
        <div style={{
          marginTop: 28, fontFamily: "Fraunces, serif", fontSize: 44,
          fontStyle: "italic", color: "#C9BDB0", letterSpacing: -1,
          opacity: tag, transform: `translateY(${(1 - tag) * 18}px)`,
          textAlign: "center",
        }}>
          Your health story, <span style={{ color: COLORS.coral }}>always with you.</span>
        </div>
        <div style={{
          marginTop: 56, padding: "20px 50px",
          background: COLORS.coral, color: "#FFF",
          borderRadius: 999, fontFamily: "Inter, sans-serif",
          fontSize: 28, fontWeight: 600, letterSpacing: -0.4,
          opacity: url, transform: `scale(${interpolate(url, [0, 1], [0.85, 1])})`,
          boxShadow: "0 20px 50px rgba(232,112,77,0.4)",
        }}>
          vyana.care
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

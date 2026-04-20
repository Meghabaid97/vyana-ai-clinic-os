import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS } from "../theme";
import { BackdropKinetic, Stickers } from "../components/Kinetic";
import { Eyebrow } from "../components/KineticText";

export const K12Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const op = interpolate(frame, [0, 18, durationInFrames - 30, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logo = spring({ frame: frame - 20, fps, config: { damping: 12, stiffness: 90 } });
  const tag = spring({ frame: frame - 90, fps, config: { damping: 22 } });
  const cta = spring({ frame: frame - 180, fps, config: { damping: 18 } });
  const breath = 1 + Math.sin(frame / 30) * 0.012;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <BackdropKinetic seed={12} palette={{ bg: COLORS.cream, blob1: COLORS.coral + "55", blob2: COLORS.amber + "44", blob3: COLORS.sage + "33", ink: COLORS.ink }} />
      <Stickers seed={12} count={12} ink={COLORS.coral} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <Eyebrow text="Welcome to" delay={5} />
        <div style={{ height: 40 }} />
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 320, fontWeight: 500,
          letterSpacing: -14, lineHeight: 1, color: COLORS.ink,
          opacity: logo, transform: `scale(${interpolate(logo, [0, 1], [0.7, 1]) * breath})`,
          display: "flex", alignItems: "baseline",
        }}>
          V<span style={{ color: COLORS.coral }}>yana</span>
        </div>
        <div style={{
          marginTop: 30, fontFamily: "Fraunces, serif", fontSize: 52,
          fontStyle: "italic", color: COLORS.inkSoft, letterSpacing: -1.2,
          opacity: tag, transform: `translateY(${(1 - tag) * 20}px)`,
          textAlign: "center",
        }}>
          Your health story, <span style={{ color: COLORS.coral }}>always with you.</span>
        </div>
        <div style={{
          marginTop: 80, padding: "22px 56px",
          background: COLORS.coral, color: "#FFF",
          borderRadius: 999, fontFamily: "Inter, sans-serif",
          fontSize: 32, fontWeight: 600, letterSpacing: -0.5,
          opacity: cta, transform: `scale(${interpolate(cta, [0, 1], [0.85, 1])})`,
          boxShadow: "0 20px 50px rgba(232,112,77,0.4)",
        }}>
          vyana.care
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

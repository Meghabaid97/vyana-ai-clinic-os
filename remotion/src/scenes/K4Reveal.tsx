import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS } from "../theme";
import { BackdropKinetic, Stickers } from "../components/Kinetic";
import { Eyebrow } from "../components/KineticText";

// Scene 4: Brand reveal — Vyana wordmark + new tagline
export const K4Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const op = interpolate(frame, [0, 15, durationInFrames - 20, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const v = spring({ frame: frame - 20, fps, config: { damping: 9, stiffness: 90 } });
  const y = spring({ frame: frame - 35, fps, config: { damping: 9, stiffness: 90 } });
  const a = spring({ frame: frame - 50, fps, config: { damping: 9, stiffness: 90 } });
  const n = spring({ frame: frame - 65, fps, config: { damping: 9, stiffness: 90 } });
  const a2 = spring({ frame: frame - 80, fps, config: { damping: 9, stiffness: 90 } });
  const tag = spring({ frame: frame - 130, fps, config: { damping: 22 } });

  const breath = 1 + Math.sin(frame / 30) * 0.012;
  const letterStyle = (e: number, color: string): React.CSSProperties => ({
    display: "inline-block", color,
    transform: `translateY(${(1 - e) * 80}px) scale(${interpolate(e, [0, 1], [0.4, 1]) * breath})`,
    opacity: e,
  });

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <BackdropKinetic seed={4} palette={{ bg: COLORS.cream, blob1: COLORS.coral + "55", blob2: COLORS.amber + "44", blob3: COLORS.sage + "33", ink: COLORS.ink }} />
      <Stickers seed={4} count={10} ink={COLORS.coral} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <Eyebrow text="Introducing" delay={5} />
        <div style={{ height: 50 }} />
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 360, fontWeight: 500,
          letterSpacing: -16, lineHeight: 1, display: "flex", alignItems: "baseline",
        }}>
          <span style={letterStyle(v, COLORS.ink)}>V</span>
          <span style={letterStyle(y, COLORS.coral)}>y</span>
          <span style={letterStyle(a, COLORS.coral)}>a</span>
          <span style={letterStyle(n, COLORS.coral)}>n</span>
          <span style={letterStyle(a2, COLORS.coral)}>a</span>
        </div>
        <div style={{
          marginTop: 30, fontFamily: "Fraunces, serif", fontSize: 52,
          fontStyle: "italic", color: COLORS.inkSoft, letterSpacing: -1.2,
          opacity: tag, transform: `translateY(${(1 - tag) * 20}px)`,
          textAlign: "center",
        }}>
          Your health story, <span style={{ color: COLORS.coral }}>always with you.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

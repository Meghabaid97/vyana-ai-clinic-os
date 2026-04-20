import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { BackdropKinetic, Stickers } from "../components/Kinetic";
import { KineticHeadline, Eyebrow } from "../components/KineticText";

const StatBlock: React.FC<{ num: string; label: string; delay: number; color: string }> = ({ num, label, delay, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 110 } });
  const float = Math.sin(frame / 35) * 6;
  return (
    <div style={{
      transform: `scale(${e}) translateY(${(1 - e) * 40 + float}px)`,
      opacity: e, textAlign: "center",
    }}>
      <div style={{
        fontFamily: "Fraunces, serif", fontSize: 280, fontWeight: 600,
        color, letterSpacing: -10, lineHeight: 0.9,
      }}>{num}</div>
      <div style={{
        fontFamily: "Inter, sans-serif", fontSize: 28, fontWeight: 600,
        color: COLORS.ink, letterSpacing: 3, textTransform: "uppercase", marginTop: 8,
      }}>{label}</div>
    </div>
  );
};

export const K2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const op = interpolate(frame, [0, 15, durationInFrames - 20, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <BackdropKinetic seed={2} palette={{ bg: COLORS.peach, blob1: COLORS.coral + "44", blob2: COLORS.amber + "55", blob3: COLORS.yellow + "44", ink: COLORS.ink }} />
      <Stickers seed={2} count={6} ink={COLORS.coralDeep} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 80, flexDirection: "column" }}>
        <Eyebrow text="The reality" delay={5} color={COLORS.coralDeep} />
        <div style={{ height: 60 }} />
        <div style={{ display: "flex", gap: 140, alignItems: "center" }}>
          <StatBlock num="75" label="pages" delay={25} color={COLORS.coral} />
          <StatBlock num="12" label="doctors" delay={50} color={COLORS.navy} />
          <StatBlock num="0" label="memory" delay={75} color={COLORS.coralDeep} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

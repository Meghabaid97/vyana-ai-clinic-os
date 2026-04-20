import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS } from "../theme";
import { BackdropKinetic, Stickers } from "../components/Kinetic";
import { KineticHeadline, Eyebrow } from "../components/KineticText";

export const K3Founder: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const op = interpolate(frame, [0, 15, durationInFrames - 20, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineDrop = spring({ frame: frame - 80, fps, config: { damping: 22 } });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <BackdropKinetic seed={3} palette={{ bg: COLORS.sand, blob1: COLORS.amber + "55", blob2: COLORS.sage + "44", blob3: COLORS.coral + "33", ink: COLORS.ink }} />
      <Stickers seed={3} count={5} ink={COLORS.amber} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 100, flexDirection: "column" }}>
        <Eyebrow text="Why we built Vyana" delay={5} color={COLORS.coralDeep} />
        <div style={{ height: 50 }} />
        <KineticHeadline text="Tirupur. 2005." delay={20} size={170} weight={600} serif color={COLORS.ink} align="center" />
        <div style={{ height: 30 }} />
        <KineticHeadline text="We learned why this matters." delay={70} size={64} weight={400} italic serif color={COLORS.coral} align="center" maxWidth={1400} />
        <div style={{
          marginTop: 60, width: 200, height: 4, background: COLORS.coral,
          transform: `scaleX(${lineDrop})`, transformOrigin: "center",
        }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

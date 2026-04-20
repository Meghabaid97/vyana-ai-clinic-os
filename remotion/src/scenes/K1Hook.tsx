import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";
import { BackdropKinetic, Stickers } from "../components/Kinetic";
import { KineticHeadline, Eyebrow } from "../components/KineticText";

export const K1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const op = interpolate(frame, [0, 15, durationInFrames - 20, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Word-by-word stack effect with massive scale
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <BackdropKinetic seed={1} palette={{ bg: COLORS.cream, blob1: COLORS.peach, blob2: COLORS.amber + "55", blob3: COLORS.coral + "33", ink: COLORS.ink }} />
      <Stickers seed={1} count={8} ink={COLORS.coral} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 80 }}>
        <div style={{ textAlign: "center" }}>
          <Eyebrow text="A story you know" delay={5} />
          <div style={{ height: 36 }} />
          <KineticHeadline text="Your medical records" delay={20} size={120} weight={800} serif color={COLORS.ink} align="center" />
          <div style={{ height: 18 }} />
          <KineticHeadline text="are scattered." delay={50} size={150} weight={400} italic serif color={COLORS.coral} align="center" accentWord="scattered." />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

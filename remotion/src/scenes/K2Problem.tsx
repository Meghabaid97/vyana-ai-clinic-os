import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS } from "../theme";
import { BackdropKinetic, Stickers } from "../components/Kinetic";
import { KineticHeadline, Eyebrow } from "../components/KineticText";

// Scene 2: The universal problem — "Health isn't a single document. It's a story."
export const K2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const op = interpolate(frame, [0, 15, durationInFrames - 20, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <BackdropKinetic seed={2} palette={{ bg: COLORS.peach, blob1: COLORS.coral + "44", blob2: COLORS.amber + "55", blob3: COLORS.yellow + "44", ink: COLORS.ink }} />
      <Stickers seed={2} count={8} ink={COLORS.coralDeep} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 80, flexDirection: "column" }}>
        <Eyebrow text="The truth we kept seeing" delay={5} color={COLORS.coralDeep} />
        <div style={{ height: 40 }} />
        <KineticHeadline
          text="Health isn't a single document."
          delay={20} size={92} weight={500} serif
          color={COLORS.ink} align="center" maxWidth={1700}
        />
        <div style={{ height: 24 }} />
        <KineticHeadline
          text="It's a story."
          delay={90} size={170} weight={400} italic serif
          color={COLORS.coral} align="center" accentWord="story."
        />
        <div style={{ height: 40 }} />
        <KineticHeadline
          text="And right now, no one is keeping it."
          delay={170} size={42} weight={400} italic serif
          color={COLORS.inkSoft} align="center" maxWidth={1400}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

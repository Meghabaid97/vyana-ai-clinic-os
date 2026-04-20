import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS } from "../theme";
import { BackdropKinetic, Stickers } from "../components/Kinetic";
import { KineticHeadline, Eyebrow } from "../components/KineticText";

// Scene 1: The Founder Hook — "Tirupur. 2005."
// Anchors WHY Vyana exists before showing what it does.
export const K1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const op = interpolate(frame, [0, 15, durationInFrames - 20, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line = spring({ frame: frame - 180, fps, config: { damping: 22 } });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <BackdropKinetic seed={1} palette={{ bg: COLORS.sand, blob1: COLORS.amber + "55", blob2: COLORS.coral + "33", blob3: COLORS.sage + "33", ink: COLORS.ink }} />
      <Stickers seed={1} count={6} ink={COLORS.amber} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 80, flexDirection: "column" }}>
        <Eyebrow text="Why we built Vyana" delay={5} color={COLORS.coralDeep} />
        <div style={{ height: 40 }} />
        <KineticHeadline text="Tirupur. 2005." delay={20} size={180} weight={500} serif color={COLORS.ink} align="center" />
        <div style={{ height: 50 }} />
        <KineticHeadline
          text="A family lost someone they loved"
          delay={80} size={56} weight={400} serif italic
          color={COLORS.inkSoft} align="center" maxWidth={1500}
        />
        <KineticHeadline
          text="because no one remembered the full story."
          delay={130} size={56} weight={400} serif italic
          color={COLORS.coral} align="center" maxWidth={1600}
        />
        <div style={{
          marginTop: 60, width: 220, height: 4, background: COLORS.coral,
          transform: `scaleX(${line})`, transformOrigin: "center", opacity: line,
        }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

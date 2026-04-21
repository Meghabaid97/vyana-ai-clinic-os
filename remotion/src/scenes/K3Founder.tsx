import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS } from "../theme";
import { BackdropKinetic, Stickers } from "../components/Kinetic";
import { KineticHeadline, Eyebrow } from "../components/KineticText";

// Scene 3: The mission — what we decided to build
export const K3Founder: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const op = interpolate(frame, [0, 15, durationInFrames - 20, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badge = spring({ frame: frame - 200, fps, config: { damping: 20 } });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <BackdropKinetic seed={3} palette={{ bg: COLORS.mint, blob1: COLORS.sage + "55", blob2: COLORS.amber + "44", blob3: COLORS.coral + "33", ink: COLORS.ink }} />
      <Stickers seed={3} count={6} ink={COLORS.sage} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 100, flexDirection: "column" }}>
        <Eyebrow text="We built one thing" delay={5} color={COLORS.sage} />
        <div style={{ height: 40 }} />
        <KineticHeadline
          text="A quiet, lifelong place"
          delay={20} size={92} weight={500} serif
          color={COLORS.ink} align="center" maxWidth={1700}
        />
        <KineticHeadline
          text="for your family's health story."
          delay={80} size={92} weight={400} italic serif
          color={COLORS.coral} align="center" maxWidth={1700} accentWord="story."
        />
        <div style={{
          marginTop: 70, padding: "18px 32px", borderRadius: 999,
          background: COLORS.paper, border: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", gap: 16,
          opacity: badge, transform: `translateY(${(1 - badge) * 16}px)`,
          boxShadow: "0 6px 18px rgba(23,21,20,0.05)",
        }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: COLORS.sage }} />
          <div style={{ fontFamily: "Inter", fontSize: 20, color: COLORS.ink, fontWeight: 600 }}>
            Linked to your ABHA Health ID
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

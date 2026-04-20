import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS } from "../theme";
import { BackdropKinetic, Stickers, Palette } from "../components/Kinetic";
import { KineticHeadline, Eyebrow } from "../components/KineticText";
import { AppPhone } from "../components/AppPhone";
import {
  MockHome, MockRecords, MockTrends, MockRx, MockShare,
  MockEmergency, MockClaim, MockBriefing, MockTimeline,
} from "../components/MockScreens";

const SHOTS: Record<string, React.FC<any>> = {
  home: MockHome,
  records: MockRecords,
  trends: MockTrends,
  rx: MockRx,
  share: MockShare,
  emergency: MockEmergency,
  claim: MockClaim,
  briefing: MockBriefing,
  timeline: MockTimeline,
};

// Shared layout for product-feature scenes: live mock phone on one side, kinetic copy on the other.
// NO continuous floating motion — phone enters, settles, holds. Only entrance animation.
export const FeatureScene: React.FC<{
  shot: string;
  eyebrow: string;
  title: string;
  accent?: string;
  body: string;
  palette: Palette;
  seed: number;
  side?: "left" | "right";
  scrollSpeed?: number;
  rotate?: number;
  italicTitle?: boolean;
}> = ({ shot, eyebrow, title, accent, body, palette, seed, side = "left", rotate = 0, italicTitle }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const op = interpolate(frame, [0, 18, durationInFrames - 22, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bodyEnter = spring({ frame: frame - 110, fps, config: { damping: 22 } });

  const Mock = SHOTS[shot] ?? MockHome;
  // Phone native 720×1465; scale 0.85 → 612×1245 — fills vertical space, mock UI text reads clearly.
  const phoneNode = (
    <div style={{ flexShrink: 0 }}>
      <AppPhone delay={20} rotate={rotate} scale={0.85}>
        <Mock />
      </AppPhone>
    </div>
  );
  const textNode = (
    <div style={{ maxWidth: 620 }}>
      <Eyebrow text={eyebrow} delay={5} color={COLORS.coral} />
      <div style={{ height: 22 }} />
      <KineticHeadline
        text={title} delay={45} size={82} weight={700} serif italic={italicTitle}
        color={COLORS.ink} accentWord={accent} accentColor={COLORS.coral}
        align="left" maxWidth={600} lineHeight={1.0}
      />
      <div style={{ height: 26 }} />
      <div style={{
        fontFamily: "Inter, sans-serif", fontSize: 26, lineHeight: 1.45,
        color: COLORS.inkSoft, fontWeight: 400, maxWidth: 560,
        opacity: bodyEnter, transform: `translateY(${(1 - bodyEnter) * 16}px)`,
      }}>{body}</div>
    </div>
  );

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <BackdropKinetic seed={seed} palette={palette} />
      <Stickers seed={seed + 100} count={4} ink={palette.ink} />
      <AbsoluteFill style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 60, padding: "0 60px",
        flexDirection: side === "left" ? "row" : "row-reverse",
      }}>
        {phoneNode}
        {textNode}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

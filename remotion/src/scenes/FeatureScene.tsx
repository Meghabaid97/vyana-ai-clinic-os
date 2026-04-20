import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS } from "../theme";
import { BackdropKinetic, Stickers, Palette } from "../components/Kinetic";
import { KineticHeadline, Eyebrow } from "../components/KineticText";
import { AppPhone } from "../components/AppPhone";
import { RealScreen } from "../components/RealScreen";
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

// Shared layout for product-feature scenes.
// Pass `realSrc` to play a real Vyana app screen recording instead of the React mock.
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
  realSrc?: string;
  realStart?: number;
}> = ({ shot, eyebrow, title, accent, body, palette, seed, side = "left", rotate = 0, italicTitle, realSrc, realStart = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  // Hold the final mock state longer — only fade the last 8 frames so the wizard
  // results (checks, briefing rows, claim docs) stay legible right up to the cut.
  const op = interpolate(frame, [0, 18, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bodyEnter = spring({ frame: frame - 110, fps, config: { damping: 22 } });

  const Mock = SHOTS[shot] ?? MockHome;
  const phoneNode = (
    <div style={{ flexShrink: 0 }}>
      <AppPhone delay={20} rotate={rotate} scale={0.72}>
        {realSrc ? <RealScreen src={realSrc} startFrom={realStart} /> : <Mock />}
      </AppPhone>
    </div>
  );
  const textNode = (
    <div style={{ maxWidth: 580, flexShrink: 0 }}>
      <Eyebrow text={eyebrow} delay={5} color={COLORS.coral} />
      <div style={{ height: 22 }} />
      <KineticHeadline
        text={title} delay={45} size={84} weight={700} serif italic={italicTitle}
        color={COLORS.ink} accentWord={accent} accentColor={COLORS.coral}
        align="left" maxWidth={560} lineHeight={1.0}
      />
      <div style={{ height: 26 }} />
      <div style={{
        fontFamily: "Inter, sans-serif", fontSize: 26, lineHeight: 1.45,
        color: COLORS.inkSoft, fontWeight: 400, maxWidth: 540,
        opacity: bodyEnter, transform: `translateY(${(1 - bodyEnter) * 16}px)`,
      }}>{body}</div>
    </div>
  );

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <BackdropKinetic seed={seed} palette={palette} />
      <Stickers seed={seed + 100} count={3} ink={palette.ink} />
      <AbsoluteFill style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 56, padding: "0 50px",
        flexDirection: side === "left" ? "row" : "row-reverse",
      }}>
        {phoneNode}
        {textNode}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone, TouchDot, Highlight, FloatingAccents } from "../components/AppPhone";
import { MockRecords } from "../components/MockScreens";

export const S6Upload: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const titleEnter = spring({ frame: frame - 50, fps, config: { damping: 24 } });
  const subEnter = spring({ frame: frame - 130, fps, config: { damping: 24 } });
  const tapAt = 170;
  const camX = -Math.sin(frame / 90) * 10;

  // Phone shot is 532 wide × 1112 tall. Upload button is around y=180-240, x=22-510.
  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <FloatingAccents seed={4} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 75% 40%, rgba(232,169,87,0.08) 0%, transparent 60%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 80, paddingRight: 40, transform: `translateX(${camX}px)` }}>
        <div style={{ flexShrink: 0, position: "relative" }}>
          <AppPhone delay={15} rotate={2} scale={0.9}
            overlay={<>
              <Highlight x={36} y={310} w={460} h={88} appear={tapAt - 30} r={22} />
              <TouchDot x={266} y={354} appear={tapAt} />
            </>}
          >
            <MockRecords pulseUploadAt={tapAt} />
          </AppPhone>
        </div>

        <div style={{ maxWidth: 660 }}>
          <div style={{ fontFamily: "Inter", fontSize: 16, letterSpacing: 5, color: COLORS.coral, textTransform: "uppercase", fontWeight: 700, opacity: titleEnter }}>
            Upload anything
          </div>
          <div style={{
            marginTop: 16, fontFamily: "Fraunces, serif", fontSize: 84, lineHeight: 1.0, color: COLORS.ink,
            letterSpacing: -2, fontWeight: 400,
            opacity: titleEnter, transform: `translateY(${interpolate(titleEnter, [0, 1], [20, 0])}px)`,
          }}>
            Vyana <em style={{ color: COLORS.coral, fontStyle: "italic" }}>reads it.</em>
          </div>
          <div style={{
            marginTop: 36, fontFamily: "Inter", fontSize: 22, color: COLORS.inkSoft, lineHeight: 1.55, maxWidth: 520,
            opacity: subEnter, transform: `translateY(${interpolate(subEnter, [0, 1], [14, 0])}px)`,
          }}>
            A prescription. A discharge summary. A lab PDF —<br/>
            written back to you in plain words.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

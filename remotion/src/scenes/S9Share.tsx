import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone, TouchDot, Highlight, FloatingAccents } from "../components/AppPhone";
import { MockShare } from "../components/MockScreens";

export const S9Share: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const titleEnter = spring({ frame: frame - 40, fps, config: { damping: 22 } });
  const subEnter = spring({ frame: frame - 120, fps, config: { damping: 22 } });
  const tapAt = 130;
  const generateAt = tapAt + 25;
  const camX = Math.sin(frame / 90) * 10;

  // Generate button on share screen sits roughly y=520-600
  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <FloatingAccents seed={7} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 25% 50%, rgba(122,155,126,0.1) 0%, transparent 55%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 80, paddingLeft: 40, transform: `translateX(${camX}px)` }}>
        <div style={{ flexShrink: 0, position: "relative" }}>
          <AppPhone delay={15} rotate={-2} scale={0.9}
            overlay={<>
              <Highlight x={36} y={500} w={460} h={88} appear={tapAt - 30} r={22} />
              <TouchDot x={266} y={544} appear={tapAt} />
            </>}
          >
            <MockShare generateAt={generateAt} />
          </AppPhone>
        </div>

        <div style={{ maxWidth: 660 }}>
          <div style={{ fontFamily: "Inter", fontSize: 16, letterSpacing: 5, color: COLORS.coral, textTransform: "uppercase", fontWeight: 700, opacity: titleEnter }}>
            Share securely · One tap
          </div>
          <div style={{
            marginTop: 16, fontFamily: "Fraunces, serif", fontSize: 80, lineHeight: 1.05, color: COLORS.ink,
            letterSpacing: -2, fontWeight: 400,
            opacity: titleEnter, transform: `translateY(${interpolate(titleEnter, [0, 1], [16, 0])}px)`,
          }}>
            Consent first.<br/>
            <em style={{ color: COLORS.coral, fontStyle: "italic" }}>Yours, always.</em>
          </div>
          <div style={{
            marginTop: 36, fontFamily: "Inter", fontSize: 22, color: COLORS.inkSoft, lineHeight: 1.55, maxWidth: 520,
            opacity: subEnter, transform: `translateY(${interpolate(subEnter, [0, 1], [14, 0])}px)`,
          }}>
            A 24-hour link. No app needed for the doctor.<br/>
            Linked to your ABHA Health ID.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

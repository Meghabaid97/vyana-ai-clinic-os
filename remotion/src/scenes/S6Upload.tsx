import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone, TouchDot, Highlight } from "../components/AppPhone";
import { MockRecords } from "../components/MockScreens";

export const S6Upload: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const titleEnter = spring({ frame: frame - 60, fps, config: { damping: 24 } });
  const tapAt = 170;

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 75% 40%, rgba(232,169,87,0.07) 0%, transparent 60%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 100, paddingRight: 60 }}>
        <div style={{ flexShrink: 0, position: "relative" }}>
          <AppPhone delay={20} rotate={2}
            overlay={<>
              <Highlight x={26} y={130} w={250} h={56} appear={tapAt - 30} r={14} />
              <TouchDot x={150} y={158} appear={tapAt} />
            </>}
          >
            <MockRecords pulseUploadAt={tapAt} />
          </AppPhone>
        </div>

        <div style={{ maxWidth: 620 }}>
          <div style={{ fontFamily: "Inter", fontSize: 14, letterSpacing: 4, color: COLORS.coral, textTransform: "uppercase", fontWeight: 600, opacity: titleEnter }}>
            Upload anything
          </div>
          <div style={{
            marginTop: 14, fontFamily: "Fraunces, serif", fontSize: 64, lineHeight: 1.1, color: COLORS.ink,
            letterSpacing: -1.5, fontWeight: 400,
            opacity: titleEnter, transform: `translateY(${interpolate(titleEnter, [0, 1], [16, 0])}px)`,
          }}>
            Vyana <em style={{ color: COLORS.coral, fontStyle: "italic" }}>reads it</em>.
          </div>
          <div style={{
            marginTop: 28, fontFamily: "Inter", fontSize: 20, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 500,
            opacity: spring({ frame: frame - 140, fps, config: { damping: 24 } }),
          }}>
            A prescription. A discharge summary. A lab PDF.<br />
            Written back to you in plain words.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

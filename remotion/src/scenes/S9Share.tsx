import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone, TouchDot, Highlight } from "../components/AppPhone";
import { MockShare } from "../components/MockScreens";

export const S9Share: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const titleEnter = spring({ frame: frame - 50, fps, config: { damping: 24 } });
  const tapAt = 130;
  const generateAt = tapAt + 20;

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 25% 50%, rgba(122,155,126,0.08) 0%, transparent 55%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 100, paddingLeft: 60 }}>
        <div style={{ flexShrink: 0, position: "relative" }}>
          <AppPhone delay={15} rotate={-2}
            overlay={<>
              <Highlight x={26} y={500} w={364} h={56} appear={tapAt - 30} r={14} />
              <TouchDot x={208} y={528} appear={tapAt} />
            </>}
          >
            <MockShare generateAt={generateAt} />
          </AppPhone>
        </div>

        <div style={{ maxWidth: 660 }}>
          <div style={{ fontFamily: "Inter", fontSize: 14, letterSpacing: 4, color: COLORS.coral, textTransform: "uppercase", fontWeight: 600, opacity: titleEnter }}>
            Share securely · One tap
          </div>
          <div style={{
            marginTop: 14, fontFamily: "Fraunces, serif", fontSize: 64, lineHeight: 1.1, color: COLORS.ink,
            letterSpacing: -1.5, fontWeight: 400,
            opacity: titleEnter, transform: `translateY(${interpolate(titleEnter, [0, 1], [12, 0])}px)`,
          }}>
            Consent first.<br />
            <em style={{ color: COLORS.coral, fontStyle: "italic" }}>Yours, always.</em>
          </div>
          <div style={{
            marginTop: 28, fontFamily: "Inter", fontSize: 19, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 520,
            opacity: spring({ frame: frame - 130, fps, config: { damping: 24 } }),
          }}>
            A 24-hour link. No app needed for the doctor.<br />
            Linked to your ABHA Health ID.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone } from "../components/AppPhone";
import { MockEmergency } from "../components/MockScreens";

export const S10Emergency: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const t1 = spring({ frame: frame - 30, fps, config: { damping: 26 } });
  const t2 = spring({ frame: frame - 110, fps, config: { damping: 26 } });

  return (
    <AbsoluteFill style={{ background: "#0A0908", opacity: op }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 30% 30%, rgba(120,150,180,0.15) 0%, transparent 55%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 70% 70%, rgba(232,112,77,0.08) 0%, transparent 55%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 100, paddingLeft: 60 }}>
        <div style={{ flexShrink: 0 }}>
          <AppPhone delay={20}><MockEmergency /></AppPhone>
        </div>

        <div style={{ maxWidth: 720 }}>
          <div style={{ fontFamily: "Inter", fontSize: 14, letterSpacing: 4, color: COLORS.coral, textTransform: "uppercase", fontWeight: 600, opacity: t1 }}>
            2:00 AM · Emergency
          </div>
          <div style={{
            marginTop: 14, fontFamily: "Fraunces, serif", fontSize: 60, lineHeight: 1.1, color: "#F4ECE0",
            letterSpacing: -1.5, fontWeight: 400,
            opacity: t1, transform: `translateY(${interpolate(t1, [0, 1], [12, 0])}px)`,
          }}>
            "What's their blood group?<br />
            Any medications?"
          </div>
          <div style={{
            marginTop: 30, fontFamily: "Fraunces, serif", fontSize: 38, color: COLORS.coral,
            fontStyle: "italic", fontWeight: 400, letterSpacing: -0.5,
            opacity: t2, transform: `translateY(${interpolate(t2, [0, 1], [12, 0])}px)`,
          }}>
            The answer is already there.
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

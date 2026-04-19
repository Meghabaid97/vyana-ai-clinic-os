import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone } from "../components/AppPhone";
import { MockEmergency } from "../components/MockScreens";

export const S10Emergency: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const t1 = spring({ frame: frame - 25, fps, config: { damping: 24 } });
  const t2 = spring({ frame: frame - 100, fps, config: { damping: 24 } });
  const t3 = spring({ frame: frame - 200, fps, config: { damping: 24 } });

  // Slow tension breath
  const camZoom = interpolate(frame, [0, durationInFrames], [1, 1.06]);

  return (
    <AbsoluteFill style={{ background: "#0A0908", opacity: op }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 30% 30%, rgba(120,150,180,0.18) 0%, transparent 55%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 70% 70%, rgba(232,112,77,0.1) 0%, transparent 55%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 80, paddingLeft: 40, transform: `scale(${camZoom})` }}>
        <div style={{ flexShrink: 0 }}>
          <AppPhone delay={20} scale={0.9}><MockEmergency /></AppPhone>
        </div>

        <div style={{ maxWidth: 720 }}>
          <div style={{ fontFamily: "Inter", fontSize: 16, letterSpacing: 5, color: COLORS.coral, textTransform: "uppercase", fontWeight: 700, opacity: t1 }}>
            2:00 AM · Emergency
          </div>
          <div style={{
            marginTop: 16, fontFamily: "Fraunces, serif", fontSize: 72, lineHeight: 1.1, color: "#F4ECE0",
            letterSpacing: -1.8, fontWeight: 400,
            opacity: t2, transform: `translateY(${interpolate(t2, [0, 1], [16, 0])}px)`,
          }}>
            "Blood group?<br/>
            Any medications?"
          </div>
          <div style={{
            marginTop: 36, fontFamily: "Fraunces, serif", fontSize: 44, color: COLORS.coral,
            fontStyle: "italic", fontWeight: 400, letterSpacing: -0.8,
            opacity: t3, transform: `translateY(${interpolate(t3, [0, 1], [14, 0])}px)`,
          }}>
            Already there.
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

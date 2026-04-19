import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// S1: Meera at midnight. Soft ambient room, phone glow, her POV.
// Calm, intimate — not chaotic.
export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const phoneGlow = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });
  const slowDrift = Math.sin(frame * 0.012) * 6;

  // Title fade in late, after the moment lands
  const t1 = spring({ frame: frame - 50, fps, config: { damping: 26 } });
  const t2 = spring({ frame: frame - 130, fps, config: { damping: 26 } });
  const time = spring({ frame: frame - 20, fps, config: { damping: 22 } });

  return (
    <AbsoluteFill style={{ background: "#0A0908", opacity: op }}>
      {/* Warm ambient gradient — bedside lamp glow */}
      <AbsoluteFill style={{
        background: "radial-gradient(circle at 78% 30%, rgba(232,169,87,0.18) 0%, rgba(232,169,87,0.04) 30%, transparent 60%)",
      }} />
      {/* Cool phone screen glow */}
      <AbsoluteFill style={{
        background: "radial-gradient(circle at 30% 65%, rgba(180,200,220,0.12) 0%, transparent 45%)",
        opacity: phoneGlow,
      }} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 80 }}>
        {/* Time stamp - top */}
        <div style={{
          position: "absolute", top: 60, left: 0, right: 0, textAlign: "center",
          fontFamily: "Inter, sans-serif", fontSize: 14, letterSpacing: 4, color: "rgba(244,236,224,0.4)",
          fontWeight: 500, opacity: time, textTransform: "uppercase",
        }}>
          11:47 PM · Bengaluru
        </div>

        {/* Two stacked lines */}
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 78, lineHeight: 1.05, color: "#F4ECE0",
          textAlign: "center", maxWidth: 1500, fontWeight: 400, letterSpacing: -1.5,
          opacity: t1, transform: `translateY(${interpolate(t1, [0, 1], [20, 0])}px) translateY(${slowDrift}px)`,
        }}>
          It's almost midnight.
        </div>
        <div style={{
          marginTop: 28,
          fontFamily: "Fraunces, serif", fontSize: 52, lineHeight: 1.15, color: COLORS.coral,
          textAlign: "center", maxWidth: 1300, fontWeight: 400, fontStyle: "italic", letterSpacing: -0.5,
          opacity: t2, transform: `translateY(${interpolate(t2, [0, 1], [16, 0])}px)`,
        }}>
          Meera is searching her phone.
        </div>

        <div style={{
          marginTop: 50, maxWidth: 700, fontFamily: "Inter, sans-serif", fontSize: 19,
          lineHeight: 1.6, color: "rgba(244,236,224,0.55)", textAlign: "center",
          opacity: spring({ frame: frame - 220, fps, config: { damping: 22 } }),
        }}>
          Her father has a check up tomorrow.<br />
          Somewhere in this gallery is the lab report he needs.
        </div>
      </AbsoluteFill>

      {/* Vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

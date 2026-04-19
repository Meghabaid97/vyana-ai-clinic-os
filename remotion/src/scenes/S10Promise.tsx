import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// S10: Family promise
export const S10Promise: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const lineEnter = spring({ frame: frame - 20, fps, config: { damping: 24 } });
  const sub = spring({ frame: frame - 110, fps, config: { damping: 24 } });

  // Soft floating heart pulses
  const family = ["Amma", "Appa", "Patti", "You", "Riya", "Arjun"];

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(circle at 50% 50%, ${COLORS.cream} 0%, ${COLORS.bg} 100%)`,
      opacity: op, alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center", maxWidth: 1200 }}>
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 84, lineHeight: 1.1, color: COLORS.ink, fontWeight: 500,
          opacity: lineEnter, transform: `translateY(${interpolate(lineEnter, [0, 1], [24, 0])}px)`,
        }}>
          Vyana <em style={{ color: COLORS.coral }}>remembers,</em><br />
          so your family doesn't have to.
        </div>

        <div style={{
          marginTop: 50, display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap",
          opacity: sub,
        }}>
          {family.map((name, i) => {
            const delay = 130 + i * 14;
            const e = spring({ frame: frame - delay, fps, config: { damping: 18 } });
            const float = Math.sin((frame + i * 30) * 0.04) * 6;
            return (
              <div key={i} style={{
                padding: "14px 22px", background: COLORS.paper, border: `1px solid ${COLORS.border}`,
                borderRadius: 999, fontSize: 18, color: COLORS.ink, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 10,
                opacity: e, transform: `translateY(${interpolate(e, [0, 1], [16, float])}px) scale(${e})`,
                boxShadow: "0 6px 20px rgba(20,15,10,0.05)",
              }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: COLORS.coral }} />
                {name}
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 40, fontSize: 18, color: COLORS.inkSoft, fontStyle: "italic", fontFamily: "Fraunces, serif",
          opacity: sub,
        }}>
          one ABHA · one timeline · for everyone you love
        </div>
      </div>
    </AbsoluteFill>
  );
};

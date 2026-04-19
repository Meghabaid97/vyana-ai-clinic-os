import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// S5: Vyana intro — wordmark reveal + tagline
export const S5Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const v = spring({ frame: frame - 20, fps, config: { damping: 18 } });
  const yana = spring({ frame: frame - 50, fps, config: { damping: 22 } });
  const tag = spring({ frame: frame - 110, fps, config: { damping: 24 } });
  const sub = spring({ frame: frame - 180, fps, config: { damping: 24 } });

  // Pulse circle behind
  const pulse = interpolate(frame % 90, [0, 90], [1, 1.4]);
  const pulseOp = interpolate(frame % 90, [0, 90], [0.3, 0]);

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op, alignItems: "center", justifyContent: "center" }}>
      {/* Concentric pulse */}
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: 200,
        border: `2px solid ${COLORS.coral}`, opacity: pulseOp, transform: `scale(${pulse})`,
      }} />
      <div style={{
        position: "absolute", width: 240, height: 240, borderRadius: 120,
        background: COLORS.coralSoft, opacity: 0.4,
      }} />

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", fontFamily: "Fraunces, serif", fontWeight: 500 }}>
        <span style={{
          fontSize: 200, color: COLORS.coral, letterSpacing: -6,
          opacity: v, transform: `translateY(${interpolate(v, [0, 1], [40, 0])}px)`,
        }}>V</span>
        <span style={{
          fontSize: 200, color: COLORS.ink, letterSpacing: -6,
          opacity: yana, transform: `translateY(${interpolate(yana, [0, 1], [40, 0])}px)`,
        }}>yana</span>
      </div>

      <div style={{
        marginTop: 24, fontSize: 28, fontFamily: "Fraunces, serif", color: COLORS.inkSoft, fontStyle: "italic",
        opacity: tag, transform: `translateY(${interpolate(tag, [0, 1], [16, 0])}px)`,
      }}>
        a longitudinal health memory layer · for India
      </div>

      <div style={{
        marginTop: 80, display: "flex", gap: 32,
        opacity: sub, transform: `translateY(${interpolate(sub, [0, 1], [16, 0])}px)`,
      }}>
        {[
          { k: "1", l: "ABHA Health ID" },
          { k: "5", l: "Indian languages" },
          { k: "∞", l: "memory, for life" },
        ].map((it, i) => (
          <div key={i} style={{ textAlign: "center", padding: "20px 28px" }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 64, color: COLORS.coral, lineHeight: 1, fontWeight: 600 }}>{it.k}</div>
            <div style={{ marginTop: 8, fontSize: 14, color: COLORS.inkSoft, letterSpacing: 1, textTransform: "uppercase" }}>{it.l}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

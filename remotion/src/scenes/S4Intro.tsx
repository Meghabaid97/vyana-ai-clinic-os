import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { FloatingAccents } from "../components/AppPhone";

export const S4Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const wordmark = spring({ frame: frame - 15, fps, config: { damping: 16, stiffness: 90 } });
  const accent = interpolate(frame, [40, 80], [0, 1], { extrapolateRight: "clamp" });
  const sub1 = spring({ frame: frame - 110, fps, config: { damping: 22 } });
  const sub2 = spring({ frame: frame - 150, fps, config: { damping: 22 } });
  const meta = spring({ frame: frame - 230, fps, config: { damping: 22 } });

  // Continuous breathing on logo
  const breath = 1 + Math.sin(frame / 35) * 0.012;

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <FloatingAccents seed={2} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(232,112,77,0.08) 0%, transparent 60%)" }} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 260, fontWeight: 500, letterSpacing: -10,
          color: COLORS.ink, opacity: wordmark,
          transform: `scale(${interpolate(wordmark, [0, 1], [0.88, 1]) * breath})`,
          display: "flex", alignItems: "baseline",
        }}>
          V<span style={{ color: COLORS.coral, opacity: accent }}>yana</span>
        </div>

        <div style={{
          marginTop: 32, fontFamily: "Inter, sans-serif", fontSize: 22, color: COLORS.inkSoft,
          letterSpacing: 5, textTransform: "uppercase", fontWeight: 500, opacity: sub1,
        }}>
          A quiet, organised place
        </div>
        <div style={{
          marginTop: 12, fontFamily: "Fraunces, serif", fontSize: 52, color: COLORS.ink,
          fontStyle: "italic", fontWeight: 400, letterSpacing: -1.2,
          opacity: sub2, transform: `translateY(${interpolate(sub2, [0, 1], [16, 0])}px)`,
        }}>
          for your family's health.
        </div>

        <div style={{
          marginTop: 60,
          padding: "18px 32px", borderRadius: 999, background: COLORS.paper, border: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", gap: 16, opacity: meta,
          boxShadow: "0 6px 18px rgba(23,21,20,0.05)",
          transform: `translateY(${interpolate(meta, [0, 1], [12, 0])}px)`,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: COLORS.sage }} />
          <div style={{ fontFamily: "Inter", fontSize: 18, color: COLORS.ink, fontWeight: 600 }}>
            Linked to your ABHA Health ID
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

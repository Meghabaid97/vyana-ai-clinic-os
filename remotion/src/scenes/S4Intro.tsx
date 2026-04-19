import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// S4: Vyana logo enters. Brand intro + ABHA tagline. Cinematic, calm.
export const S4Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const wordmark = spring({ frame: frame - 20, fps, config: { damping: 18, stiffness: 90 } });
  const accent = interpolate(frame, [50, 90], [0, 1], { extrapolateRight: "clamp" });
  const sub = spring({ frame: frame - 120, fps, config: { damping: 22 } });
  const meta = spring({ frame: frame - 220, fps, config: { damping: 22 } });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      {/* warm gradient */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(232,112,77,0.06) 0%, transparent 60%)" }} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        {/* Wordmark - matches landing page V[yana] */}
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 220, fontWeight: 500, letterSpacing: -8,
          color: COLORS.ink, opacity: wordmark,
          transform: `scale(${interpolate(wordmark, [0, 1], [0.92, 1])})`,
          display: "flex", alignItems: "baseline",
        }}>
          V<span style={{ color: COLORS.coral, opacity: accent }}>yana</span>
        </div>

        <div style={{
          marginTop: 30, fontFamily: "Inter, sans-serif", fontSize: 26, color: COLORS.inkSoft,
          letterSpacing: 4, textTransform: "uppercase", fontWeight: 500, opacity: sub,
        }}>
          A quiet, organised place
        </div>
        <div style={{
          marginTop: 8, fontFamily: "Fraunces, serif", fontSize: 44, color: COLORS.ink,
          fontStyle: "italic", fontWeight: 400, letterSpacing: -1,
          opacity: sub, transform: `translateY(${interpolate(sub, [0, 1], [12, 0])}px)`,
        }}>
          for your family's health.
        </div>

        {/* ABHA badge */}
        <div style={{
          marginTop: 56,
          padding: "14px 28px", borderRadius: 999, background: COLORS.paper, border: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", gap: 14, opacity: meta,
          boxShadow: "0 4px 14px rgba(23,21,20,0.04)",
          transform: `translateY(${interpolate(meta, [0, 1], [10, 0])}px)`,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: COLORS.sage }} />
          <div style={{ fontFamily: "Inter", fontSize: 15, color: COLORS.ink, fontWeight: 600 }}>
            Linked to your ABHA Health ID
          </div>
          <div style={{ fontFamily: "Inter", fontSize: 13, color: COLORS.inkSoft }}>· Built for India</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

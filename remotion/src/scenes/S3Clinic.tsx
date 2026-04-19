import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// S3: Doctor's questions appearing as a stack of speech bubbles
export const S3Clinic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const questions = [
    { t: "Any allergies?", delay: 30 },
    { t: "Last sugar reading?", delay: 75 },
    { t: "Still on the thyroid tablet?", delay: 120 },
    { t: "Family history of heart disease?", delay: 165 },
    { t: "When was your last ECG?", delay: 210 },
    { t: "Are you on any blood thinners?", delay: 255 },
    { t: "Vaccination history?", delay: 300 },
    { t: "Previous hospitalisations?", delay: 345 },
  ];

  const titleEnter = spring({ frame: frame - 380, fps, config: { damping: 22 } });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      {/* Doctor silhouette card on right */}
      <div style={{
        position: "absolute", right: 80, top: 120, bottom: 120, width: 440,
        background: COLORS.paper, borderRadius: 24, border: `1px solid ${COLORS.border}`,
        padding: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        boxShadow: "0 20px 60px rgba(20,15,10,0.08)",
      }}>
        <div style={{
          width: 140, height: 140, borderRadius: 70,
          background: `linear-gradient(135deg, ${COLORS.coralSoft}, ${COLORS.cream})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64,
        }}>👨‍⚕️</div>
        <div style={{ marginTop: 24, fontSize: 22, fontWeight: 600, color: COLORS.ink }}>Dr. Patel</div>
        <div style={{ fontSize: 14, color: COLORS.inkSoft, marginTop: 4 }}>Internal Medicine · 18 yrs</div>
        <div style={{
          marginTop: 32, padding: "12px 18px", background: COLORS.coralSoft, color: COLORS.coralDeep,
          borderRadius: 999, fontSize: 13, fontWeight: 600, letterSpacing: 0.5,
        }}>
          Hearing your story for the first time
        </div>
      </div>

      {/* Stacked questions on left */}
      <div style={{ position: "absolute", left: 100, top: 80, width: 900, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 28, fontStyle: "italic", color: COLORS.inkSoft, marginBottom: 16,
        }}>Every visit. The same questions.</div>

        {questions.map((q, i) => {
          const enter = spring({ frame: frame - q.delay, fps, config: { damping: 18, stiffness: 110 } });
          if (enter < 0.01) return null;
          return (
            <div key={i} style={{
              padding: "18px 26px",
              background: i % 2 === 0 ? COLORS.paper : COLORS.cream,
              borderRadius: 22,
              borderTopLeftRadius: 6,
              border: `1px solid ${COLORS.border}`,
              fontSize: 22, color: COLORS.ink, fontWeight: 500,
              opacity: enter,
              transform: `translateX(${interpolate(enter, [0, 1], [-40, 0])}px)`,
              maxWidth: 700, boxShadow: "0 4px 16px rgba(20,15,10,0.04)",
            }}>
              {q.t}
            </div>
          );
        })}

        <div style={{
          marginTop: 24, fontFamily: "Fraunces, serif", fontSize: 36, lineHeight: 1.2,
          color: COLORS.coralDeep, opacity: titleEnter,
          transform: `translateY(${interpolate(titleEnter, [0, 1], [12, 0])}px)`,
          maxWidth: 820,
        }}>
          And we are expected to <em>remember it all.</em>
        </div>
      </div>
    </AbsoluteFill>
  );
};

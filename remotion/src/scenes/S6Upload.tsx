import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone, TouchDot, Highlight } from "../components/AppPhone";

// S6: Records / upload demo. Phone shows records page, cursor taps Upload, AI summary card animates in.
export const S6Upload: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const titleEnter = spring({ frame: frame - 60, fps, config: { damping: 24 } });
  // AI extracted card pops up
  const cardEnter = spring({ frame: frame - 250, fps, config: { damping: 22, stiffness: 120 } });
  const tapAt = 200;

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 75% 40%, rgba(232,169,87,0.07) 0%, transparent 60%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 100, paddingRight: 60 }}>
        {/* Phone with records screenshot */}
        <div style={{ flexShrink: 0, position: "relative" }}>
          <AppPhone src="shots/records.png" delay={20} rotate={2}>
            {/* Highlight Upload button area (approx position in screenshot scaled to 396) */}
            <Highlight x={252} y={210} w={120} h={52} appear={tapAt - 30} r={26} />
            <TouchDot x={310} y={236} appear={tapAt} />
          </AppPhone>

          {/* AI Summary card popping out */}
          <div style={{
            position: "absolute", top: 380, left: -120, width: 320,
            background: COLORS.paper, borderRadius: 20, padding: 20,
            border: `1px solid ${COLORS.border}`,
            boxShadow: "0 30px 80px rgba(20,15,10,0.18)",
            opacity: cardEnter,
            transform: `translateY(${interpolate(cardEnter, [0, 1], [30, 0])}px) scale(${interpolate(cardEnter, [0, 1], [0.92, 1])})`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: COLORS.coral, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: COLORS.coral }} />
              AI Summary
            </div>
            <div style={{ marginTop: 10, fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 600, color: COLORS.ink, lineHeight: 1.3 }}>
              Lipid panel · 12 Mar
            </div>
            <div style={{ marginTop: 10, fontFamily: "Inter", fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5 }}>
              LDL slightly elevated at <b style={{ color: COLORS.ink }}>142 mg/dL</b>. HDL within range. Triglycerides normal. Worth discussing diet at next visit.
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["LDL 142", "HDL 48", "TG 134", "Total 215"].map(t => (
                <div key={t} style={{ padding: "4px 10px", background: COLORS.coralSoft, color: COLORS.coralDeep, borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{t}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Left text */}
        <div style={{ maxWidth: 620 }}>
          <div style={{
            fontFamily: "Inter", fontSize: 14, letterSpacing: 4, color: COLORS.coral,
            textTransform: "uppercase", fontWeight: 600, opacity: titleEnter,
          }}>
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

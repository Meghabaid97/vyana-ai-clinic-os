import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone } from "../components/AppPhone";

// S8: Multilingual Rx Reader. Real rx page + cycling language card.
export const S8Rx: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const titleEnter = spring({ frame: frame - 50, fps, config: { damping: 24 } });
  const cardEnter = spring({ frame: frame - 130, fps, config: { damping: 22 } });

  const langs = [
    { code: "தமிழ்", name: "Tamil",   rx: "மெட்ஃபார்மின் 500mg",     en: "Metformin 500mg · twice daily, after meals" },
    { code: "हिंदी", name: "Hindi",   rx: "थायरोक्सिन 50mcg",          en: "Thyroxine 50mcg · once daily, empty stomach" },
    { code: "తెలుగు", name: "Telugu", rx: "అటోర్వాస్టాటిన్ 10mg",    en: "Atorvastatin 10mg · at bedtime" },
    { code: "বাংলা", name: "Bengali", rx: "অ্যামলোডিপাইন 5mg",         en: "Amlodipine 5mg · once daily morning" },
  ];
  const cycleLen = 90; // frames per language
  const idx = Math.floor((frame - 130) / cycleLen) % langs.length;
  const cur = langs[Math.max(0, idx)];

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 70% 30%, rgba(232,112,77,0.07) 0%, transparent 55%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 100, paddingRight: 60 }}>
        {/* Phone with rx reader */}
        <div style={{ flexShrink: 0 }}>
          <AppPhone src="shots/rx.png" delay={15} rotate={2} />
        </div>

        <div style={{ maxWidth: 700 }}>
          <div style={{
            fontFamily: "Inter", fontSize: 14, letterSpacing: 4, color: COLORS.coral,
            textTransform: "uppercase", fontWeight: 600, opacity: titleEnter,
          }}>
            Even handwritten · 5 languages
          </div>
          <div style={{
            marginTop: 14, fontFamily: "Fraunces, serif", fontSize: 60, lineHeight: 1.1, color: COLORS.ink,
            letterSpacing: -1.5, fontWeight: 400,
            opacity: titleEnter, transform: `translateY(${interpolate(titleEnter, [0, 1], [12, 0])}px)`,
          }}>
            Medicine, never <em style={{ color: COLORS.coral, fontStyle: "italic" }}>lost in translation.</em>
          </div>

          {/* Translation card */}
          <div style={{
            marginTop: 36, padding: 24, background: COLORS.paper, borderRadius: 20,
            border: `1px solid ${COLORS.border}`, width: 540,
            boxShadow: "0 20px 50px rgba(20,15,10,0.06)",
            opacity: cardEnter, transform: `translateY(${interpolate(cardEnter, [0, 1], [16, 0])}px)`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ padding: "4px 12px", borderRadius: 999, background: COLORS.coralSoft, color: COLORS.coralDeep, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
                {cur.name.toUpperCase()}
              </div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 28, color: COLORS.ink, fontWeight: 600 }}>
                {cur.code}
              </div>
            </div>
            <div style={{
              marginTop: 18, padding: 14, background: COLORS.cream, borderRadius: 10,
              fontFamily: "Fraunces, serif", fontSize: 22, color: COLORS.ink, fontStyle: "italic",
            }}>
              {cur.rx}
            </div>
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, fontFamily: "Inter", fontSize: 12, color: COLORS.inkSoft, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
              <span>↓</span> Vyana reads
            </div>
            <div style={{ marginTop: 8, fontFamily: "Inter", fontSize: 18, color: COLORS.ink, fontWeight: 500, lineHeight: 1.5 }}>
              {cur.en}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

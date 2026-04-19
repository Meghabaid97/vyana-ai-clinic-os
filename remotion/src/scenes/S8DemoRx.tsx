import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { PhoneFrame } from "../components/PhoneFrame";

// S8: Multilingual Rx reader
export const S8DemoRx: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  // Cycling language chips
  const languages = ["தமிழ்", "हिन्दी", "తెలుగు", "বাংলা", "English"];
  const langIndex = Math.floor((frame / 80) % languages.length);

  const translations = [
    { lang: "Tamil", input: "மருந்து: பாராசிட்டமால் 500mg", out: "Paracetamol 500mg · 1 tablet · twice daily · after food" },
    { lang: "Hindi", input: "दवाई: मेटफॉर्मिन 500", out: "Metformin 500mg · 1 tablet · morning + night · before meals" },
    { lang: "Telugu", input: "మాత్ర: టెల్మిసార్టన్", out: "Telmisartan 40mg · 1 tablet · morning · daily" },
    { lang: "Bengali", input: "ওষুধ: অ্যাটোরভাস্ট্যাটিন", out: "Atorvastatin 10mg · 1 tablet · at bedtime · daily" },
    { lang: "English", input: "Cetirizine 10mg HS PRN", out: "Cetirizine 10mg · 1 tablet · at bedtime · as needed" },
  ];
  const cur = translations[langIndex];

  // Scribbled handwriting lines
  const scribbles = [10, 22, 34, 46, 58];

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <div style={{ position: "absolute", left: 100, top: 80 }}>
        <div style={{ fontSize: 13, color: COLORS.coral, fontWeight: 700, letterSpacing: 2 }}>FEATURE 03</div>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 64, color: COLORS.ink, marginTop: 12, lineHeight: 1.05, maxWidth: 720 }}>
          Even <em style={{ color: COLORS.coral }}>handwritten</em><br />
          prescriptions.
        </div>
        <div style={{ marginTop: 24, fontSize: 20, color: COLORS.inkSoft, maxWidth: 580, lineHeight: 1.5 }}>
          In your language. Read aloud. Translated. Reminded.<br />
          Medicine should never get lost in translation.
        </div>

        {/* Language chips */}
        <div style={{ marginTop: 40, display: "flex", gap: 14, flexWrap: "wrap", maxWidth: 540 }}>
          {languages.map((l, i) => {
            const active = i === langIndex;
            return (
              <div key={l} style={{
                padding: "12px 22px", borderRadius: 999,
                background: active ? COLORS.coral : COLORS.paper,
                color: active ? "#fff" : COLORS.ink,
                border: `1px solid ${active ? COLORS.coral : COLORS.border}`,
                fontSize: 22, fontWeight: 600,
                transition: "none",
                boxShadow: active ? `0 6px 18px rgba(232,112,77,0.35)` : "none",
              }}>{l}</div>
            );
          })}
        </div>
      </div>

      <div style={{ position: "absolute", right: 140, top: 60, bottom: 60, display: "flex", alignItems: "center" }}>
        <PhoneFrame delay={20}>
          <div style={{ padding: "12px 22px 0", color: COLORS.ink }}>
            <div style={{ fontSize: 13, color: COLORS.coral, fontWeight: 700 }}>RX READER</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, marginTop: 4, fontWeight: 600 }}>{cur.lang} prescription</div>

            {/* Scribbled handwriting card */}
            <div style={{
              marginTop: 16, padding: 16, background: COLORS.cream, borderRadius: 14,
              border: `1px solid ${COLORS.border}`, height: 180, position: "relative", overflow: "hidden",
            }}>
              <div style={{ fontSize: 11, color: COLORS.coralDeep, fontWeight: 700, letterSpacing: 1 }}>HANDWRITTEN</div>
              <div style={{ marginTop: 10, fontSize: 22, fontFamily: "Fraunces, serif", color: COLORS.ink, opacity: 0.85, lineHeight: 1.3 }}>
                {cur.input}
              </div>
              {scribbles.map(o => (
                <svg key={o} style={{ position: "absolute", left: 16, right: 16, top: 70 + o * 1.2, height: 6 }} viewBox="0 0 280 6">
                  <path d="M 0 3 Q 30 0, 60 3 T 120 3 T 180 3 T 240 3 T 280 3" stroke={COLORS.ink} strokeWidth="1" fill="none" opacity="0.3" />
                </svg>
              ))}
              {/* Scanning line */}
              <div style={{
                position: "absolute", left: 0, right: 0,
                top: `${(frame * 2) % 180}px`, height: 2,
                background: `linear-gradient(90deg, transparent, ${COLORS.coral}, transparent)`,
                boxShadow: `0 0 12px ${COLORS.coral}`,
              }} />
            </div>

            {/* Translated output */}
            <div style={{
              marginTop: 14, padding: 16, background: COLORS.paper,
              border: `1px solid ${COLORS.border}`, borderRadius: 14,
            }}>
              <div style={{ fontSize: 11, color: COLORS.coral, fontWeight: 700, letterSpacing: 1 }}>✦ UNDERSTOOD</div>
              <div style={{ marginTop: 8, fontSize: 14, color: COLORS.ink, lineHeight: 1.55, fontWeight: 500 }}>
                {cur.out}
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <div style={{ padding: "6px 10px", background: COLORS.coralSoft, color: COLORS.coralDeep, borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
                  ⏰ Reminder set
                </div>
                <div style={{ padding: "6px 10px", background: COLORS.cream, color: COLORS.ink, borderRadius: 8, fontSize: 10, fontWeight: 600 }}>
                  🔊 Read aloud
                </div>
              </div>
            </div>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};

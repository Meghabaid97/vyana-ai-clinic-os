import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { PhoneFrame } from "../components/PhoneFrame";

// S6: Upload + AI summary demo
export const S6DemoUpload: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const stage1Drop = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  const stage2Process = interpolate(frame, [120, 200], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stage3Summary = spring({ frame: frame - 230, fps, config: { damping: 20 } });

  const summaryLines = [
    "Patient on Metformin 500mg twice daily",
    "HbA1c 7.2% — slightly above target",
    "BP well controlled on Telmisartan 40mg",
    "Vitamin D deficient — supplement advised",
    "Follow-up in 3 months",
  ];

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      {/* Headline */}
      <div style={{ position: "absolute", left: 100, top: 80 }}>
        <div style={{ fontSize: 13, color: COLORS.coral, fontWeight: 700, letterSpacing: 2 }}>FEATURE 01</div>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 64, color: COLORS.ink, marginTop: 12, lineHeight: 1.05, maxWidth: 720 }}>
          Upload anything.<br />
          <em style={{ color: COLORS.coral }}>We read it for you.</em>
        </div>
        <div style={{ marginTop: 24, fontSize: 20, color: COLORS.inkSoft, maxWidth: 580, lineHeight: 1.5 }}>
          A photo. A scan. A PDF. Vyana extracts the meaning and writes it back to you in plain language.
        </div>

        {/* Stage chips */}
        <div style={{ marginTop: 40, display: "flex", gap: 12 }}>
          {["Snap", "Read", "Summarise", "Remember"].map((s, i) => {
            const e = spring({ frame: frame - (60 + i * 24), fps, config: { damping: 18 } });
            return (
              <div key={i} style={{
                padding: "10px 18px", borderRadius: 999,
                background: i === 0 ? COLORS.coral : COLORS.paper,
                color: i === 0 ? "#fff" : COLORS.ink,
                border: `1px solid ${i === 0 ? COLORS.coral : COLORS.border}`,
                fontSize: 14, fontWeight: 600,
                opacity: e, transform: `translateY(${interpolate(e, [0, 1], [10, 0])}px)`,
              }}>{s}</div>
            );
          })}
        </div>
      </div>

      {/* Phone right */}
      <div style={{ position: "absolute", right: 140, top: 80, bottom: 80, display: "flex", alignItems: "center" }}>
        <PhoneFrame delay={20}>
          <div style={{ padding: "12px 22px 0", color: COLORS.ink }}>
            <div style={{ fontSize: 13, color: COLORS.coral, fontWeight: 700 }}>HEALTH RECORDS</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginTop: 4, fontWeight: 600 }}>Add a record</div>

            {/* Drop zone with prescription falling in */}
            <div style={{
              marginTop: 18, height: 200, borderRadius: 18,
              border: `2px dashed ${COLORS.border}`, background: COLORS.cream,
              position: "relative", overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: 130, height: 170, background: COLORS.paper, borderRadius: 6, padding: 10,
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                transform: `translateY(${interpolate(stage1Drop, [0, 1], [-120, 0])}px) rotate(${interpolate(stage1Drop, [0, 1], [-12, -3])}deg)`,
              }}>
                <div style={{ fontSize: 8, color: COLORS.coralDeep, fontWeight: 700, letterSpacing: 1 }}>RX</div>
                <div style={{ fontSize: 7, color: COLORS.inkSoft, marginTop: 4 }}>Dr Mehta · 12/03/24</div>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ marginTop: 6, height: 2, width: `${50 + (i*7)%40}%`, background: "#888", opacity: 0.4 }} />
                ))}
              </div>
              {stage2Process > 0 && stage2Process < 1 && (
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent ${(1-stage2Process)*100}%, ${COLORS.coral} 100%)`, opacity: 0.2 }} />
              )}
            </div>

            {/* Processing indicator */}
            {stage2Process > 0 && stage2Process < 1 && (
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, color: COLORS.coral, fontSize: 13, fontWeight: 600 }}>
                <div style={{ width: 14, height: 14, borderRadius: 7, border: `2px solid ${COLORS.coralSoft}`, borderTopColor: COLORS.coral, animation: "spin 1s linear infinite" }} />
                Reading prescription…
              </div>
            )}

            {/* Summary card */}
            {stage3Summary > 0.05 && (
              <div style={{
                marginTop: 16, padding: 16, background: COLORS.paper,
                border: `1px solid ${COLORS.border}`, borderRadius: 16,
                opacity: stage3Summary, transform: `translateY(${interpolate(stage3Summary, [0, 1], [12, 0])}px)`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: COLORS.coralDeep, fontWeight: 700, letterSpacing: 1 }}>
                  ✦ AI SUMMARY
                </div>
                <div style={{ marginTop: 10 }}>
                  {summaryLines.map((l, i) => {
                    const e = spring({ frame: frame - (240 + i * 14), fps, config: { damping: 22 } });
                    return (
                      <div key={i} style={{
                        display: "flex", gap: 8, marginTop: 6, alignItems: "flex-start",
                        opacity: e, transform: `translateX(${interpolate(e, [0, 1], [-8, 0])}px)`,
                      }}>
                        <span style={{ color: COLORS.coral, fontWeight: 700 }}>·</span>
                        <span style={{ fontSize: 11, color: COLORS.ink, lineHeight: 1.5 }}>{l}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { PhoneFrame } from "../components/PhoneFrame";

// S9: ABHA share — phone to phone secure sharing
export const S9DemoShare: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  // Animation: tap → secure beam travels → second phone receives
  const tap = spring({ frame: frame - 60, fps, config: { damping: 12, stiffness: 200 } });
  const beamProgress = interpolate(frame, [120, 240], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const receive = spring({ frame: frame - 230, fps, config: { damping: 22 } });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <div style={{ position: "absolute", left: 100, top: 80, maxWidth: 560 }}>
        <div style={{ fontSize: 13, color: COLORS.coral, fontWeight: 700, letterSpacing: 2 }}>FEATURE 04</div>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 56, color: COLORS.ink, marginTop: 12, lineHeight: 1.05 }}>
          Share with a doctor.<br />
          <em style={{ color: COLORS.coral }}>One tap. Time-bound.</em>
        </div>
        <div style={{ marginTop: 20, fontSize: 18, color: COLORS.inkSoft, lineHeight: 1.5 }}>
          Linked to your ABHA Health ID. Consent-first. Auto-expires. Yours, always.
        </div>

        {/* Trust badges */}
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 10 }}>
          {["🔒 End-to-end encrypted", "⏱ Auto-expires in 24 hours", "🪪 ABHA-verified recipient", "📜 Every access is logged"].map((b, i) => {
            const e = spring({ frame: frame - (80 + i * 18), fps, config: { damping: 22 } });
            return (
              <div key={i} style={{
                padding: "10px 16px", background: COLORS.paper, border: `1px solid ${COLORS.border}`,
                borderRadius: 999, fontSize: 14, color: COLORS.ink, fontWeight: 500,
                opacity: e, transform: `translateX(${interpolate(e, [0, 1], [-12, 0])}px)`,
                width: "fit-content",
              }}>{b}</div>
            );
          })}
        </div>
      </div>

      {/* Two phones */}
      <div style={{ position: "absolute", right: 80, top: 0, bottom: 0, width: 1100, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Patient phone */}
        <div style={{ transform: "scale(0.78)", transformOrigin: "left center" }}>
          <PhoneFrame delay={10}>
            <div style={{ padding: "12px 22px 0", color: COLORS.ink }}>
              <div style={{ fontSize: 13, color: COLORS.coral, fontWeight: 700 }}>SHARE RECORDS</div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, marginTop: 4, fontWeight: 600 }}>To: Dr Aisha Khan</div>
              <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>ABHA · ••••••3247 → ••••••8821</div>

              <div style={{ marginTop: 18, padding: 14, background: COLORS.cream, borderRadius: 14, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 11, color: COLORS.coralDeep, fontWeight: 700, letterSpacing: 1 }}>SHARING</div>
                {["Full health timeline", "12 lab reports", "5 active medications", "All vitals · 5 years"].map((s, i) => (
                  <div key={i} style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span style={{ width: 14, height: 14, borderRadius: 4, background: COLORS.coral, color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✓</span>
                    {s}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, fontSize: 11, color: COLORS.inkSoft }}>Expires in</div>
              <div style={{ fontSize: 14, color: COLORS.ink, fontWeight: 700, marginTop: 2 }}>24 hours · 1 use</div>

              {/* Tap button */}
              <div style={{
                marginTop: 18, padding: "14px 0", background: COLORS.coral, color: "#fff",
                borderRadius: 14, textAlign: "center", fontSize: 14, fontWeight: 700,
                transform: `scale(${interpolate(tap, [0, 0.5, 1], [1, 0.94, 1])})`,
                boxShadow: tap > 0.1 ? `0 0 0 ${tap * 12}px rgba(232,112,77,${0.3 - tap * 0.3})` : "none",
              }}>
                Share securely
              </div>
            </div>
          </PhoneFrame>
        </div>

        {/* Beam */}
        <div style={{ flex: 1, height: 4, position: "relative", margin: "0 -40px" }}>
          <div style={{
            position: "absolute", left: 0, top: 0, height: 4, borderRadius: 2,
            width: `${beamProgress * 100}%`,
            background: `linear-gradient(90deg, ${COLORS.coral}, ${COLORS.amber})`,
            boxShadow: `0 0 20px ${COLORS.coral}`,
          }} />
          {beamProgress > 0 && beamProgress < 1 && (
            <div style={{
              position: "absolute", left: `${beamProgress * 100}%`, top: -10,
              fontSize: 18, color: COLORS.coralDeep, transform: "translateX(-50%)",
            }}>🔒</div>
          )}
        </div>

        {/* Doctor phone */}
        <div style={{ transform: "scale(0.78)", transformOrigin: "right center", opacity: receive }}>
          <PhoneFrame delay={0}>
            <div style={{ padding: "12px 22px 0", color: COLORS.ink }}>
              <div style={{ fontSize: 13, color: COLORS.coral, fontWeight: 700 }}>RECEIVED</div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, marginTop: 4, fontWeight: 600 }}>From: Rajesh Kumar</div>
              <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>via ABHA · just now</div>

              <div style={{ marginTop: 18 }}>
                {[
                  { y: "2024", t: "HbA1c 6.6% · improving" },
                  { y: "2023", t: "Started Telmisartan 40mg" },
                  { y: "2022", t: "Vitamin D deficiency" },
                  { y: "2018", t: "T2 Diabetes diagnosed" },
                ].map((e, i) => {
                  const en = spring({ frame: frame - (260 + i * 14), fps, config: { damping: 22 } });
                  return (
                    <div key={i} style={{
                      padding: "10px 0", borderBottom: `1px solid ${COLORS.border}`,
                      opacity: en, transform: `translateY(${interpolate(en, [0, 1], [8, 0])}px)`,
                      display: "flex", gap: 12, alignItems: "center",
                    }}>
                      <div style={{ fontSize: 10, color: COLORS.coral, fontWeight: 700, width: 36 }}>{e.y}</div>
                      <div style={{ fontSize: 12, color: COLORS.ink }}>{e.t}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </PhoneFrame>
        </div>
      </div>
    </AbsoluteFill>
  );
};

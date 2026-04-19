import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { PhoneFrame } from "../components/PhoneFrame";

// S4: 2 AM split screen — chaos vs calm
export const S4Emergency: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const splitOpen = spring({ frame: frame - 20, fps, config: { damping: 30, stiffness: 50 } });
  const calmIn = spring({ frame: frame - 220, fps, config: { damping: 22 } });

  // Strobe panic flicker on left
  const flicker = 0.85 + Math.sin(frame * 0.4) * 0.08 + (Math.random() < 0.05 ? 0.1 : 0);

  // Heart rate pulse (left side urgency)
  const pulsePoints = Array.from({ length: 60 }, (_, i) => {
    const x = i * 12;
    const beat = i % 12;
    let y = 50;
    if (beat === 4) y = 30;
    else if (beat === 5) y = 80;
    else if (beat === 6) y = 20;
    else if (beat === 7) y = 50;
    return `${x},${y}`;
  }).join(" ");

  return (
    <AbsoluteFill style={{ opacity: op, background: COLORS.bgDark }}>
      {/* LEFT: hospital */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: `${interpolate(splitOpen, [0, 1], [0, 50])}%`,
        background: `linear-gradient(180deg, #1a0a0a 0%, #2a0f0c 100%)`,
        overflow: "hidden", borderRight: "2px solid #2a0f0c",
      }}>
        <AbsoluteFill style={{ background: `radial-gradient(circle at 30% 20%, rgba(232,112,77,0.25) 0%, transparent 60%)`, opacity: flicker }} />
        {/* Hospital UI ECG monitor */}
        <div style={{ position: "absolute", left: 60, top: 80, color: "#ff5544", opacity: 0.9 }}>
          <div style={{ fontSize: 14, letterSpacing: 3, fontWeight: 700 }}>02:14 AM · ER</div>
          <div style={{ fontSize: 56, fontFamily: "Fraunces, serif", color: "#FBE4DA", marginTop: 8 }}>Code Blue.</div>
        </div>
        <div style={{ position: "absolute", left: 60, top: 280, right: 60, height: 130, background: "#000", borderRadius: 8, padding: 12, border: "1px solid #ff5544" }}>
          <svg width="100%" height="100%" viewBox="0 0 720 100" preserveAspectRatio="none">
            <polyline points={pulsePoints} stroke="#ff3322" strokeWidth="2.5" fill="none" />
          </svg>
        </div>

        {/* Panic question */}
        <div style={{
          position: "absolute", left: 60, top: 470, right: 60,
          padding: 24, background: "#1a0a0a", border: "1px solid #5a1a18", borderRadius: 12,
          color: "#fff",
        }}>
          <div style={{ fontSize: 14, color: "#ff7766", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>NURSE</div>
          <div style={{ fontSize: 24, fontFamily: "Fraunces, serif" }}>"Blood group? Existing medication? Allergies?"</div>
        </div>

        {/* Family fumbling */}
        <div style={{ position: "absolute", left: 60, bottom: 80, right: 60, color: "#A89F94" }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>📱 scrolling…</div>
          <div style={{ fontSize: 18, marginBottom: 8 }}>📂 plastic bag of papers…</div>
          <div style={{ fontSize: 18 }}>💭 "It was Dr Mehta… or Dr Sharma?"</div>
        </div>
      </div>

      {/* RIGHT: calm Vyana side */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0,
        width: `${interpolate(splitOpen, [0, 1], [100, 50])}%`,
        background: `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.cream} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 60,
      }}>
        {/* Phone with calm timeline */}
        <PhoneFrame delay={50}>
          <div style={{ padding: "8px 22px 0", color: COLORS.ink }}>
            <div style={{ fontSize: 13, color: COLORS.coral, fontWeight: 700, letterSpacing: 1 }}>EMERGENCY ACCESS</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 26, marginTop: 4, fontWeight: 600 }}>Rajesh Kumar, 58</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>ABHA · ••••••••3247</div>
            {[
              { l: "Blood group", v: "B+" },
              { l: "Allergies", v: "Penicillin, Sulfa" },
              { l: "On medication", v: "Metformin 500mg, Telmisartan 40mg" },
              { l: "Conditions", v: "T2 Diabetes (2018), HTN (2020)" },
              { l: "Last ECG", v: "12 Mar 2024 · Normal sinus" },
              { l: "Emergency contact", v: "Priya (daughter) · ••••••42" },
            ].map((row, i) => {
              const e = spring({ frame: frame - (80 + i * 12), fps, config: { damping: 20 } });
              return (
                <div key={i} style={{
                  marginTop: 14, padding: "10px 0", borderBottom: `1px solid ${COLORS.border}`,
                  opacity: e, transform: `translateY(${interpolate(e, [0, 1], [8, 0])}px)`,
                }}>
                  <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 1.2 }}>{row.l}</div>
                  <div style={{ fontSize: 14, color: COLORS.ink, fontWeight: 600, marginTop: 3 }}>{row.v}</div>
                </div>
              );
            })}
          </div>
        </PhoneFrame>

        <div style={{ maxWidth: 360, opacity: calmIn, transform: `translateX(${interpolate(calmIn, [0, 1], [20, 0])}px)` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.coral, letterSpacing: 2 }}>VYANA</div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 44, lineHeight: 1.1, marginTop: 12, color: COLORS.ink }}>
            Memory should not be a <em>person's job.</em>
          </div>
          <div style={{ marginTop: 20, fontSize: 18, color: COLORS.inkSoft, lineHeight: 1.5 }}>
            One ABHA tap. Full history. In the moments that matter.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

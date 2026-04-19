import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { PhoneFrame } from "../components/PhoneFrame";

// S7: Timeline + trends demo
export const S7DemoTimeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  // Chart data
  const points = [7.8, 7.5, 7.4, 7.2, 7.3, 7.1, 6.9, 6.8, 6.7, 6.6];
  const chartProgress = interpolate(frame, [60, 280], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Timeline events
  const events = [
    { y: "2019", t: "First diabetes diagnosis" },
    { y: "2020", t: "HTN added to record" },
    { y: "2022", t: "Vitamin D deficiency" },
    { y: "2024", t: "HbA1c trending down" },
  ];

  return (
    <AbsoluteFill style={{ background: COLORS.bgDark, opacity: op, color: "#F4ECE0" }}>
      {/* Title */}
      <div style={{ position: "absolute", left: 100, top: 80 }}>
        <div style={{ fontSize: 13, color: COLORS.coral, fontWeight: 700, letterSpacing: 2 }}>FEATURE 02</div>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 64, marginTop: 12, lineHeight: 1.05, maxWidth: 720 }}>
          One <em style={{ color: COLORS.coral }}>continuous</em><br />
          health story.
        </div>
        <div style={{ marginTop: 24, fontSize: 20, color: "#A89F94", maxWidth: 540, lineHeight: 1.5 }}>
          Vitals across years. Diagnoses across doctors. Patterns you could never see before.
        </div>

        {/* Timeline events */}
        <div style={{ marginTop: 50, position: "relative", paddingLeft: 28 }}>
          <div style={{ position: "absolute", left: 8, top: 12, bottom: 12, width: 2, background: "rgba(232,112,77,0.3)" }} />
          {events.map((e, i) => {
            const en = spring({ frame: frame - (80 + i * 22), fps, config: { damping: 20 } });
            return (
              <div key={i} style={{
                position: "relative", marginBottom: 22, opacity: en,
                transform: `translateX(${interpolate(en, [0, 1], [-12, 0])}px)`,
              }}>
                <div style={{ position: "absolute", left: -24, top: 6, width: 12, height: 12, borderRadius: 6, background: COLORS.coral, boxShadow: `0 0 0 4px rgba(232,112,77,0.2)` }} />
                <div style={{ fontSize: 12, color: COLORS.coral, fontWeight: 700, letterSpacing: 1 }}>{e.y}</div>
                <div style={{ fontSize: 18, color: "#F4ECE0", marginTop: 2 }}>{e.t}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: phone with trend chart */}
      <div style={{ position: "absolute", right: 140, top: 60, bottom: 60, display: "flex", alignItems: "center" }}>
        <PhoneFrame delay={30}>
          <div style={{ padding: "12px 22px 0", color: COLORS.ink }}>
            <div style={{ fontSize: 13, color: COLORS.coral, fontWeight: 700 }}>HEALTH TRENDS</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginTop: 4, fontWeight: 600 }}>HbA1c · 5 years</div>

            {/* Chart */}
            <div style={{ marginTop: 18, height: 220, position: "relative", background: COLORS.cream, borderRadius: 14, padding: 16 }}>
              <svg width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="none">
                {/* Grid */}
                {[0, 1, 2, 3].map(i => (
                  <line key={i} x1="0" x2="320" y1={i * 45 + 10} y2={i * 45 + 10} stroke={COLORS.border} strokeWidth="1" />
                ))}
                {/* Reference band (target zone) */}
                <rect x="0" y="115" width="320" height="35" fill={COLORS.coralSoft} opacity="0.5" />
                {/* Line */}
                {(() => {
                  const visibleCount = Math.max(1, Math.floor(points.length * chartProgress));
                  const path = points.slice(0, visibleCount).map((p, i) => {
                    const x = (i / (points.length - 1)) * 300 + 10;
                    const y = 170 - (p - 6) * 80;
                    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  }).join(" ");
                  return <path d={path} stroke={COLORS.coral} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
                })()}
                {/* Dots */}
                {points.slice(0, Math.floor(points.length * chartProgress)).map((p, i) => {
                  const x = (i / (points.length - 1)) * 300 + 10;
                  const y = 170 - (p - 6) * 80;
                  return <circle key={i} cx={x} cy={y} r="3.5" fill={COLORS.coral} />;
                })}
              </svg>
              <div style={{ position: "absolute", bottom: 6, right: 12, fontSize: 10, color: COLORS.inkSoft }}>2020 → 2024</div>
            </div>

            {/* Insight cards */}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { l: "Trend", v: "↓ improving (−1.2%)" },
                { l: "Latest", v: "6.6% · 12 Mar 2024" },
                { l: "Records analysed", v: "14 lab reports across 3 doctors" },
              ].map((row, i) => {
                const e = spring({ frame: frame - (160 + i * 18), fps, config: { damping: 22 } });
                return (
                  <div key={i} style={{
                    padding: "10px 14px", background: COLORS.paper, border: `1px solid ${COLORS.border}`,
                    borderRadius: 12, opacity: e, transform: `translateY(${interpolate(e, [0, 1], [8, 0])}px)`,
                    display: "flex", justifyContent: "space-between", fontSize: 12,
                  }}>
                    <span style={{ color: COLORS.inkSoft, fontWeight: 500 }}>{row.l}</span>
                    <span style={{ color: COLORS.ink, fontWeight: 700 }}>{row.v}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};

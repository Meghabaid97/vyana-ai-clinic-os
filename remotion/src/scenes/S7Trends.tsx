import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone } from "../components/AppPhone";

// S7: Trends. Real trends screenshot + animated line chart card on the side.
export const S7Trends: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const titleEnter = spring({ frame: frame - 50, fps, config: { damping: 24 } });
  const chartEnter = spring({ frame: frame - 130, fps, config: { damping: 22 } });

  // Animated line: HbA1c over years
  const points = [
    { x: 0, y: 0.5 },
    { x: 0.18, y: 0.45 },
    { x: 0.36, y: 0.55 },
    { x: 0.54, y: 0.7 },
    { x: 0.72, y: 0.62 },
    { x: 0.88, y: 0.5 },
    { x: 1.0, y: 0.42 },
  ];
  const W = 460, H = 200;
  const lineLen = interpolate(frame, [120, 280], [0, 1], { extrapolateRight: "clamp" });

  const path = points.map((p, i) => {
    const cmd = i === 0 ? "M" : "L";
    return `${cmd} ${p.x * W} ${H - p.y * H}`;
  }).join(" ");

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 30% 30%, rgba(122,155,126,0.08) 0%, transparent 55%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 100, paddingLeft: 60 }}>
        {/* Phone with trends */}
        <div style={{ flexShrink: 0 }}>
          <AppPhone src="shots/trends.png" delay={15} rotate={-2} />
        </div>

        <div style={{ maxWidth: 700 }}>
          <div style={{
            fontFamily: "Inter", fontSize: 14, letterSpacing: 4, color: COLORS.coral,
            textTransform: "uppercase", fontWeight: 600, opacity: titleEnter,
          }}>
            Vitals over years
          </div>
          <div style={{
            marginTop: 14, fontFamily: "Fraunces, serif", fontSize: 60, lineHeight: 1.1, color: COLORS.ink,
            letterSpacing: -1.5, fontWeight: 400,
            opacity: titleEnter, transform: `translateY(${interpolate(titleEnter, [0, 1], [12, 0])}px)`,
          }}>
            Trends become visible<br />
            <em style={{ color: COLORS.coral, fontStyle: "italic" }}>before</em> they become problems.
          </div>

          {/* Animated chart card */}
          <div style={{
            marginTop: 36, padding: 22, background: COLORS.paper, borderRadius: 20,
            border: `1px solid ${COLORS.border}`, width: 540,
            boxShadow: "0 20px 50px rgba(20,15,10,0.06)",
            opacity: chartEnter, transform: `translateY(${interpolate(chartEnter, [0, 1], [16, 0])}px)`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <div style={{ fontFamily: "Inter", fontSize: 14, fontWeight: 600, color: COLORS.ink }}>HbA1c</div>
              <div style={{ fontFamily: "Inter", fontSize: 12, color: COLORS.inkSoft }}>2019 — 2025</div>
            </div>
            <svg width={W} height={H} style={{ display: "block" }}>
              <defs>
                <linearGradient id="g7" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.coral} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={COLORS.coral} stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* grid */}
              {[0.25, 0.5, 0.75].map(y => (
                <line key={y} x1={0} x2={W} y1={H * y} y2={H * y} stroke={COLORS.border} strokeWidth={1} />
              ))}
              {/* fill */}
              <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill="url(#g7)" opacity={lineLen} />
              {/* line */}
              <path d={path} fill="none" stroke={COLORS.coral} strokeWidth={3} strokeLinecap="round"
                strokeDasharray={2000} strokeDashoffset={(1 - lineLen) * 2000} />
              {/* dots */}
              {points.map((p, i) => (
                <circle key={i} cx={p.x * W} cy={H - p.y * H} r={4} fill={COLORS.paper}
                  stroke={COLORS.coral} strokeWidth={2}
                  opacity={interpolate(lineLen, [i / points.length - 0.05, i / points.length + 0.05], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
              ))}
            </svg>
            <div style={{ marginTop: 8, display: "flex", gap: 16, fontFamily: "Inter", fontSize: 12, color: COLORS.inkSoft }}>
              <span>● Sugar</span><span style={{ color: COLORS.sage }}>● Pressure</span><span style={{ color: COLORS.amber }}>● Thyroid</span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS } from "../theme";

// Founder beat — quiet, personal moment between collage and product.
// Three text cards reveal in sequence, then resolve to the mission line.
export const S0bFounder: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const op = interpolate(frame, [0, 18, durationInFrames - 24, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Three sequential lines
  const l1 = spring({ frame: frame - 20,  fps, config: { damping: 22, stiffness: 110 } });
  const l1Out = interpolate(frame, [110, 130], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const l2 = spring({ frame: frame - 130, fps, config: { damping: 22, stiffness: 110 } });
  const l2Out = interpolate(frame, [220, 240], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Mission resolve
  const m1 = spring({ frame: frame - 250, fps, config: { damping: 24, stiffness: 120 } });
  const m2 = spring({ frame: frame - 290, fps, config: { damping: 24, stiffness: 120 } });
  const m3 = spring({ frame: frame - 335, fps, config: { damping: 22, stiffness: 110 } });

  return (
    <AbsoluteFill style={{ background: "#0A0908", opacity: op }}>
      {/* Subtle warm vignette */}
      <AbsoluteFill style={{
        background: "radial-gradient(ellipse at 50% 45%, rgba(232,112,77,0.10) 0%, rgba(10,9,8,0) 55%)",
        pointerEvents: "none",
      }} />

      {/* Phase 1: lost grandparents */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 200px", opacity: l1 * l1Out }}>
        <div style={{ textAlign: "center", transform: `translateY(${(1 - l1) * 16}px)` }}>
          <div style={{
            fontFamily: "Inter, sans-serif", fontSize: 22, color: COLORS.coral,
            letterSpacing: 4, fontWeight: 600, textTransform: "uppercase", marginBottom: 32,
          }}>A few years ago</div>
          <div style={{
            fontFamily: "Fraunces, serif", fontSize: 88, color: "#F4ECE0",
            letterSpacing: -2.2, fontWeight: 500, lineHeight: 1.1,
          }}>
            I lost my grandparents.<br/>
            <em style={{ color: COLORS.coral, fontStyle: "italic", fontWeight: 400 }}>No records to save them.</em>
          </div>
        </div>
      </AbsoluteFill>

      {/* Phase 2: every report */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 200px", opacity: l2 * l2Out }}>
        <div style={{ textAlign: "center", transform: `translateY(${(1 - l2) * 16}px)` }}>
          <div style={{
            fontFamily: "Fraunces, serif", fontSize: 76, color: "#F4ECE0",
            letterSpacing: -1.8, fontWeight: 500, lineHeight: 1.15,
          }}>
            Every report. Every prescription.<br/>
            Every diagnosis they ever had —<br/>
            <em style={{ color: COLORS.coral, fontStyle: "italic", fontWeight: 400 }}>gone.</em>
          </div>
        </div>
      </AbsoluteFill>

      {/* Phase 3: mission */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 160px" }}>
        <div style={{ textAlign: "center", maxWidth: 1500 }}>
          <div style={{
            fontFamily: "Inter, sans-serif", fontSize: 22, color: COLORS.coral,
            letterSpacing: 4, fontWeight: 600, textTransform: "uppercase",
            opacity: m1, transform: `translateY(${(1 - m1) * 18}px)`, marginBottom: 36,
          }}>So we're building</div>
          <div style={{
            fontFamily: "Fraunces, serif", fontSize: 110, color: "#F4ECE0",
            letterSpacing: -3, fontWeight: 500, lineHeight: 1.05,
            opacity: m2, transform: `translateY(${(1 - m2) * 30}px)`,
          }}>
            The medical memory<br/>
            <em style={{ color: COLORS.coral, fontStyle: "italic", fontWeight: 400 }}>layer for India.</em>
          </div>
          <div style={{
            fontFamily: "Inter, sans-serif", fontSize: 26, color: "#C9BDB0",
            fontWeight: 400, marginTop: 40, lineHeight: 1.4, maxWidth: 900,
            margin: "40px auto 0",
            opacity: m3, transform: `translateY(${(1 - m3) * 12}px)`,
          }}>
            So no family ever loses a story again.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

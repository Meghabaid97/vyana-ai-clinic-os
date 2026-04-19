import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone } from "../components/AppPhone";

// S5: "Your Story" — reveal the actual home dashboard screenshot.
export const S5YourStory: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  // Subtle scroll on the screenshot
  const scrollY = interpolate(frame, [60, durationInFrames - 30], [0, 300], { extrapolateRight: "clamp" });

  const titleEnter = spring({ frame: frame - 80, fps, config: { damping: 24 } });
  const subEnter = spring({ frame: frame - 150, fps, config: { damping: 24 } });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 25% 50%, rgba(232,112,77,0.05) 0%, transparent 55%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 120, paddingLeft: 60 }}>
        {/* Phone with real home screenshot */}
        <div style={{ flexShrink: 0 }}>
          <AppPhone src="shots/home.png" delay={20} scrollY={scrollY} />
        </div>

        {/* Right side */}
        <div style={{ maxWidth: 700 }}>
          <div style={{
            fontFamily: "Inter", fontSize: 14, letterSpacing: 4, color: COLORS.coral,
            textTransform: "uppercase", fontWeight: 600, opacity: titleEnter,
          }}>
            Your story
          </div>
          <div style={{
            marginTop: 16, fontFamily: "Fraunces, serif", fontSize: 78, lineHeight: 1.05, color: COLORS.ink,
            letterSpacing: -2, fontWeight: 400, opacity: titleEnter,
            transform: `translateY(${interpolate(titleEnter, [0, 1], [16, 0])}px)`,
          }}>
            Always with you.<br />
            <em style={{ color: COLORS.coral, fontStyle: "italic" }}>Quietly.</em>
          </div>
          <div style={{
            marginTop: 36, fontFamily: "Inter, sans-serif", fontSize: 21, lineHeight: 1.6,
            color: COLORS.inkSoft, maxWidth: 560, opacity: subEnter,
            transform: `translateY(${interpolate(subEnter, [0, 1], [12, 0])}px)`,
          }}>
            Every visit, every report, every medicine — gathered into one warm, continuous record.
          </div>

          {/* Tiny brand row */}
          <div style={{
            marginTop: 48, display: "flex", gap: 24, opacity: subEnter,
            fontFamily: "Inter", fontSize: 13, color: COLORS.inkSoft, letterSpacing: 1,
            textTransform: "uppercase", fontWeight: 600,
          }}>
            <span>Records</span><span>·</span><span>Trends</span><span>·</span><span>Briefing</span><span>·</span><span>Share</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

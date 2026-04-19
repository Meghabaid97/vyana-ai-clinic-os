import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// S3: "Health isn't a document. It's a story." Slow editorial typography.
export const S3Story: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const l1 = spring({ frame: frame - 20, fps, config: { damping: 26 } });
  const l2 = spring({ frame: frame - 80, fps, config: { damping: 26 } });
  const l3 = spring({ frame: frame - 160, fps, config: { damping: 26 } });
  const l4 = spring({ frame: frame - 240, fps, config: { damping: 26 } });

  // Subtle drifting underline
  const lineGrow = interpolate(frame, [40, 180], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.cream, opacity: op }}>
      {/* warm grain bg */}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 70% 30%, rgba(232,169,87,0.15) 0%, transparent 50%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 20% 80%, rgba(232,112,77,0.06) 0%, transparent 50%)" }} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 100, flexDirection: "column" }}>
        <div style={{
          fontFamily: "Fraunces, serif", fontSize: 30, color: COLORS.inkSoft, letterSpacing: 6,
          textTransform: "uppercase", fontWeight: 500, opacity: l1,
          transform: `translateY(${interpolate(l1, [0, 1], [10, 0])}px)`,
        }}>
          Health isn't a document.
        </div>

        <div style={{
          marginTop: 24,
          fontFamily: "Fraunces, serif", fontSize: 110, lineHeight: 1.05, color: COLORS.ink,
          textAlign: "center", fontWeight: 400, letterSpacing: -3,
          opacity: l2, transform: `translateY(${interpolate(l2, [0, 1], [20, 0])}px)`,
        }}>
          It's a <em style={{ color: COLORS.coral, fontStyle: "italic", position: "relative" }}>
            story.
            <span style={{
              position: "absolute", left: 0, right: 0, bottom: -8, height: 4,
              background: COLORS.coral, transformOrigin: "left", transform: `scaleX(${lineGrow})`,
              borderRadius: 2,
            }} />
          </em>
        </div>

        <div style={{
          marginTop: 60, fontFamily: "Inter, sans-serif", fontSize: 22, lineHeight: 1.7,
          color: COLORS.inkSoft, textAlign: "center", maxWidth: 800, opacity: l3,
          transform: `translateY(${interpolate(l3, [0, 1], [16, 0])}px)`,
        }}>
          Slow. Layered. Written across years.<br />
          Across doctors. Across small moments<br />
          that add up to something only <em style={{ color: COLORS.ink }}>you</em> should own.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

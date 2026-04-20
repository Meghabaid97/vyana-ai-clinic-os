import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../theme";

// Word-by-word kinetic typography. Each word springs in staggered.
export const KineticHeadline: React.FC<{
  text: string;
  delay?: number;
  size?: number;
  color?: string;
  accentWord?: string; // word to color in coral
  accentColor?: string;
  align?: "left" | "center" | "right";
  maxWidth?: number;
  lineHeight?: number;
  weight?: number;
  italic?: boolean;
  serif?: boolean;
}> = ({
  text, delay = 0, size = 96, color = COLORS.ink,
  accentWord, accentColor = COLORS.coral, align = "left",
  maxWidth = 1300, lineHeight = 1.05, weight = 700, italic = false,
  serif = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div style={{
      maxWidth, textAlign: align, lineHeight,
      fontFamily: serif ? "Fraunces, serif" : "Inter, sans-serif",
      fontWeight: weight, fontSize: size,
      letterSpacing: -size * 0.025,
      fontStyle: italic ? "italic" : "normal",
    }}>
      {words.map((w, i) => {
        const wDelay = delay + i * 4;
        const e = spring({ frame: frame - wDelay, fps, config: { damping: 13, stiffness: 130, mass: 0.8 } });
        const isAccent = accentWord && w.toLowerCase().replace(/[.,!?]/g, "") === accentWord.toLowerCase();
        return (
          <span key={i} style={{
            display: "inline-block",
            marginRight: size * 0.18,
            color: isAccent ? accentColor : color,
            opacity: e,
            transform: `translateY(${(1 - e) * size * 0.6}px) scale(${interpolate(e, [0, 1], [0.7, 1])})`,
          }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

// Small caption pill (sub-headline)
export const Eyebrow: React.FC<{ text: string; delay?: number; color?: string; bg?: string }> = ({
  text, delay = 0, color = COLORS.coral, bg = "transparent",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <div style={{
      display: "inline-block",
      fontFamily: "Inter, sans-serif",
      fontSize: 22, letterSpacing: 4, fontWeight: 700,
      textTransform: "uppercase", color, background: bg,
      padding: bg !== "transparent" ? "10px 22px" : 0,
      borderRadius: 999,
      opacity: e,
      transform: `translateY(${(1 - e) * 10}px)`,
    }}>
      {text}
    </div>
  );
};

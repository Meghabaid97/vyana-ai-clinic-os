import React from "react";
import { OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Plays a real Vyana app screen recording inside the phone frame.
// Crops top of the AppPhone status bar (54px paddingTop) by negative margin so the screen
// fills the phone screen area cleanly. Loops if scene outlasts clip.
export const RealScreen: React.FC<{ src: string; startFrom?: number }> = ({ src, startFrom = 0 }) => {
  const { fps } = useVideoConfig();
  return (
    <div style={{
      position: "absolute", inset: 0,
      // The AppPhone reserves top 54px for its own status bar. Hide that by pulling video up & extend below.
      top: -54,
      width: "100%", height: "calc(100% + 54px)",
      overflow: "hidden",
      background: "#FAFAF7",
    }}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={Math.round(startFrom * fps)}
        muted
        playbackRate={1}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
};

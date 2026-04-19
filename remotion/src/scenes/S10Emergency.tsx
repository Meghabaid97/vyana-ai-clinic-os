import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone } from "../components/AppPhone";

// S10: The 2AM emergency moment. Briefing screen + the answer that's already there.
export const S10Emergency: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const t1 = spring({ frame: frame - 30, fps, config: { damping: 26 } });
  const t2 = spring({ frame: frame - 110, fps, config: { damping: 26 } });
  const cardEnter = spring({ frame: frame - 200, fps, config: { damping: 22 } });

  return (
    <AbsoluteFill style={{ background: "#0A0908", opacity: op }}>
      {/* hospital cool ambient */}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 30% 30%, rgba(120,150,180,0.15) 0%, transparent 55%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 70% 70%, rgba(232,112,77,0.08) 0%, transparent 55%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 100, paddingLeft: 60 }}>
        {/* Briefing phone */}
        <div style={{ flexShrink: 0, position: "relative" }}>
          <AppPhone src="shots/briefing.png" delay={20} />

          {/* Emergency summary card overlay */}
          <div style={{
            position: "absolute", top: 380, left: -130, width: 340,
            background: "#fff", borderRadius: 18, padding: 18,
            border: `2px solid ${COLORS.coral}`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
            opacity: cardEnter, transform: `translateY(${interpolate(cardEnter, [0, 1], [30, 0])}px)`,
          }}>
            <div style={{ fontSize: 11, color: COLORS.coral, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
              Emergency Summary · Father
            </div>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                ["Blood group", "B+"],
                ["Allergies", "Penicillin"],
                ["On meds", "Metformin, Telmisartan"],
                ["Conditions", "T2 Diabetes, HTN"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: COLORS.inkSoft, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>{k}</div>
                  <div style={{ marginTop: 2, fontFamily: "Inter", fontSize: 14, color: COLORS.ink, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right text */}
        <div style={{ maxWidth: 720 }}>
          <div style={{
            fontFamily: "Inter", fontSize: 14, letterSpacing: 4, color: COLORS.coral,
            textTransform: "uppercase", fontWeight: 600, opacity: t1,
          }}>
            2:00 AM · Emergency
          </div>
          <div style={{
            marginTop: 14, fontFamily: "Fraunces, serif", fontSize: 60, lineHeight: 1.1, color: "#F4ECE0",
            letterSpacing: -1.5, fontWeight: 400,
            opacity: t1, transform: `translateY(${interpolate(t1, [0, 1], [12, 0])}px)`,
          }}>
            "What's their blood group?<br />
            Any medications?"
          </div>
          <div style={{
            marginTop: 30, fontFamily: "Fraunces, serif", fontSize: 38, color: COLORS.coral,
            fontStyle: "italic", fontWeight: 400, letterSpacing: -0.5,
            opacity: t2, transform: `translateY(${interpolate(t2, [0, 1], [12, 0])}px)`,
          }}>
            The answer is already there.
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

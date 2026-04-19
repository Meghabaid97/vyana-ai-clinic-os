import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { AppPhone, TouchDot, Highlight } from "../components/AppPhone";

// S9: Share securely with one tap. Real share screen + ABHA badge animation.
export const S9Share: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  const titleEnter = spring({ frame: frame - 50, fps, config: { damping: 24 } });
  const tapAt = 170;
  const cardEnter = spring({ frame: frame - 220, fps, config: { damping: 22, stiffness: 120 } });

  // Countdown
  const startSec = 24 * 60 * 60;
  const elapsed = Math.max(0, frame - 250) / fps * 360;
  const left = Math.max(0, startSec - elapsed);
  const hh = Math.floor(left / 3600);
  const mm = Math.floor((left % 3600) / 60);

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: op }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 25% 50%, rgba(122,155,126,0.08) 0%, transparent 55%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 100, paddingLeft: 60 }}>
        {/* Phone */}
        <div style={{ flexShrink: 0, position: "relative" }}>
          <AppPhone src="shots/share.png" delay={15} rotate={-2}>
            <Highlight x={203} y={120} w={170} h={50} appear={tapAt - 30} r={26} />
            <TouchDot x={285} y={144} appear={tapAt} />
          </AppPhone>

          {/* Generated link card */}
          <div style={{
            position: "absolute", top: 360, right: -100, width: 320,
            background: COLORS.paper, borderRadius: 20, padding: 20,
            border: `1px solid ${COLORS.border}`,
            boxShadow: "0 30px 80px rgba(20,15,10,0.2)",
            opacity: cardEnter,
            transform: `translateY(${interpolate(cardEnter, [0, 1], [30, 0])}px) scale(${interpolate(cardEnter, [0, 1], [0.92, 1])})`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: COLORS.sage, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: COLORS.sage }} />
              Secure link · ABHA verified
            </div>
            <div style={{ marginTop: 10, padding: "10px 12px", background: COLORS.cream, borderRadius: 8, fontFamily: "monospace", fontSize: 12, color: COLORS.ink, wordBreak: "break-all" }}>
              vyana.in/s/8f3a··e21c
            </div>
            <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Expires in</div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 28, color: COLORS.coral, fontWeight: 600 }}>
                  {String(hh).padStart(2, "0")}h {String(mm).padStart(2, "0")}m
                </div>
              </div>
              <div style={{
                padding: "8px 14px", borderRadius: 999, background: COLORS.coral, color: "#fff",
                fontFamily: "Inter", fontSize: 12, fontWeight: 700,
              }}>
                Send via WhatsApp
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 660 }}>
          <div style={{
            fontFamily: "Inter", fontSize: 14, letterSpacing: 4, color: COLORS.coral,
            textTransform: "uppercase", fontWeight: 600, opacity: titleEnter,
          }}>
            Share securely · One tap
          </div>
          <div style={{
            marginTop: 14, fontFamily: "Fraunces, serif", fontSize: 64, lineHeight: 1.1, color: COLORS.ink,
            letterSpacing: -1.5, fontWeight: 400,
            opacity: titleEnter, transform: `translateY(${interpolate(titleEnter, [0, 1], [12, 0])}px)`,
          }}>
            Consent first.<br />
            <em style={{ color: COLORS.coral, fontStyle: "italic" }}>Yours, always.</em>
          </div>
          <div style={{
            marginTop: 28, fontFamily: "Inter", fontSize: 19, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 520,
            opacity: spring({ frame: frame - 130, fps, config: { damping: 24 } }),
          }}>
            A 24-hour link. No app needed for the doctor.<br />
            Linked to your ABHA Health ID.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

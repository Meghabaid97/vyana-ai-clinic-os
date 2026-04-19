import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// All mock screens render native React inside the phone frame at full resolution.
// They are crisp at any video render scale.

const Tabs: React.FC<{ active: string }> = ({ active }) => {
  const items = [
    { key: "home", label: "Home", icon: "○" },
    { key: "records", label: "Records", icon: "▢" },
    { key: "trends", label: "Trends", icon: "△" },
    { key: "rx", label: "Rx", icon: "℞" },
    { key: "share", label: "Share", icon: "↗" },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, height: 78,
      background: "rgba(255,255,255,0.94)", borderTop: `1px solid ${COLORS.border}`,
      display: "flex", alignItems: "flex-start", justifyContent: "space-around",
      padding: "10px 8px 0",
    }}>
      {items.map(it => (
        <div key={it.key} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          color: it.key === active ? COLORS.coral : COLORS.inkSoft,
        }}>
          <div style={{ fontSize: 20, lineHeight: 1, fontWeight: 700 }}>{it.icon}</div>
          <div style={{ fontSize: 10, fontWeight: 600, fontFamily: "Inter" }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
};

// ====================================================================
// HOME — narrative dashboard
// ====================================================================
export const MockHome: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cards = [0, 1, 2, 3].map(i => spring({ frame: frame - 25 - i * 12, fps, config: { damping: 22 } }));

  return (
    <div style={{ width: "100%", height: "100%", background: "#FAFAF7", position: "relative", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 22px 0" }}>
        <div style={{ fontFamily: "Inter", fontSize: 12, color: COLORS.inkSoft, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>Sunday morning</div>
        <div style={{ marginTop: 6, fontFamily: "Fraunces, serif", fontSize: 32, color: COLORS.ink, fontWeight: 500, letterSpacing: -0.5 }}>
          Hello, <em style={{ color: COLORS.coral, fontStyle: "italic" }}>Meera</em>
        </div>
      </div>

      {/* Story card */}
      <div style={{
        margin: "18px 18px 0", padding: 20, background: "#fff",
        borderRadius: 22, border: `1px solid ${COLORS.border}`,
        boxShadow: "0 6px 24px rgba(20,15,10,0.04)",
        opacity: cards[0], transform: `translateY(${interpolate(cards[0], [0, 1], [16, 0])}px)`,
      }}>
        <div style={{ fontSize: 11, color: COLORS.coral, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>Your Health Story</div>
        <div style={{ marginTop: 10, fontFamily: "Fraunces, serif", fontSize: 19, color: COLORS.ink, lineHeight: 1.4, fontWeight: 500 }}>
          Your sugar and pressure have <em style={{ color: COLORS.sage }}>quietly improved</em> over the last six months.
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
          <div style={{ flex: 1, padding: 12, background: COLORS.cream, borderRadius: 12 }}>
            <div style={{ fontSize: 10, color: COLORS.inkSoft, fontWeight: 600, letterSpacing: 0.5 }}>HbA1c</div>
            <div style={{ marginTop: 2, fontFamily: "Fraunces, serif", fontSize: 22, color: COLORS.ink, fontWeight: 600 }}>6.2</div>
            <div style={{ fontSize: 10, color: COLORS.sage, fontWeight: 600 }}>↓ 0.8 in 6mo</div>
          </div>
          <div style={{ flex: 1, padding: 12, background: COLORS.cream, borderRadius: 12 }}>
            <div style={{ fontSize: 10, color: COLORS.inkSoft, fontWeight: 600, letterSpacing: 0.5 }}>BP avg</div>
            <div style={{ marginTop: 2, fontFamily: "Fraunces, serif", fontSize: 22, color: COLORS.ink, fontWeight: 600 }}>122/78</div>
            <div style={{ fontSize: 10, color: COLORS.sage, fontWeight: 600 }}>Within range</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ margin: "16px 18px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { icon: "◔", label: "Records", sub: "47 documents", op: cards[1] },
          { icon: "△", label: "Trends", sub: "33 vitals tracked", op: cards[1] },
          { icon: "℞", label: "Rx Reader", sub: "5 languages", op: cards[2] },
          { icon: "↗", label: "Share", sub: "ABHA secure", op: cards[2] },
        ].map((a) => (
          <div key={a.label} style={{
            padding: 16, background: "#fff", borderRadius: 18, border: `1px solid ${COLORS.border}`,
            opacity: a.op, transform: `translateY(${interpolate(a.op, [0, 1], [10, 0])}px)`,
          }}>
            <div style={{ fontSize: 22, color: COLORS.coral, fontWeight: 700 }}>{a.icon}</div>
            <div style={{ marginTop: 6, fontFamily: "Inter", fontSize: 13, color: COLORS.ink, fontWeight: 600 }}>{a.label}</div>
            <div style={{ marginTop: 2, fontFamily: "Inter", fontSize: 11, color: COLORS.inkSoft }}>{a.sub}</div>
          </div>
        ))}
      </div>

      {/* Promise row */}
      <div style={{
        margin: "16px 18px 0", padding: "14px 16px", background: COLORS.coralSoft,
        borderRadius: 16, opacity: cards[3], transform: `translateY(${interpolate(cards[3], [0, 1], [10, 0])}px)`,
      }}>
        <div style={{ fontSize: 11, color: COLORS.coralDeep, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Linked to ABHA</div>
        <div style={{ marginTop: 4, fontFamily: "Inter", fontSize: 12, color: COLORS.ink }}>
          12-3456-7890-1234 · End-to-end encrypted
        </div>
      </div>

      <Tabs active="home" />
    </div>
  );
};

// ====================================================================
// RECORDS
// ====================================================================
export const MockRecords: React.FC<{ pulseUploadAt?: number }> = ({ pulseUploadAt = -1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const list = [0, 1, 2, 3, 4].map(i => spring({ frame: frame - 30 - i * 8, fps, config: { damping: 22 } }));
  const newCardEnter = spring({ frame: frame - (pulseUploadAt + 25), fps, config: { damping: 22 } });
  const showNew = pulseUploadAt > 0 && frame > pulseUploadAt + 10;

  const items = [
    { name: "Lipid Panel", date: "12 Mar 2025", tag: "Blood test", color: COLORS.coral },
    { name: "Discharge Summary", date: "28 Jan 2025", tag: "Apollo Hospital", color: COLORS.sage },
    { name: "Thyroid Profile", date: "04 Dec 2024", tag: "Blood test", color: COLORS.amber },
    { name: "ECG Report", date: "11 Nov 2024", tag: "Cardiology", color: COLORS.coralDeep },
    { name: "X-Ray Chest", date: "02 Sep 2024", tag: "Radiology", color: COLORS.inkSoft },
  ];

  return (
    <div style={{ width: "100%", height: "100%", background: "#FAFAF7", position: "relative", overflow: "hidden" }}>
      <div style={{ padding: "14px 22px 0" }}>
        <div style={{ fontFamily: "Inter", fontSize: 12, color: COLORS.inkSoft, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>Records</div>
        <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 30, color: COLORS.ink, fontWeight: 500, letterSpacing: -0.5 }}>
            Everything, in one place
          </div>
        </div>
      </div>

      {/* Upload button */}
      <div style={{ margin: "16px 18px 0", display: "flex", gap: 10 }}>
        <div style={{
          flex: 1, padding: "14px 16px", background: COLORS.coral, color: "#fff",
          borderRadius: 14, fontFamily: "Inter", fontSize: 14, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 8px 20px rgba(232,112,77,0.3)",
        }}>
          <span style={{ fontSize: 18 }}>↑</span> Upload report
        </div>
        <div style={{
          padding: "14px 14px", background: "#fff", color: COLORS.ink,
          borderRadius: 14, border: `1px solid ${COLORS.border}`, fontSize: 18, fontWeight: 700,
        }}>⌕</div>
      </div>

      {/* New extracted card */}
      {showNew && (
        <div style={{
          margin: "14px 18px 0", padding: 14, borderRadius: 16,
          background: "linear-gradient(135deg, #FBE4DA 0%, #fff 100%)",
          border: `1.5px solid ${COLORS.coral}`,
          opacity: newCardEnter, transform: `translateY(${interpolate(newCardEnter, [0, 1], [12, 0])}px)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: COLORS.coralDeep, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: COLORS.coral }} /> AI extracted now
          </div>
          <div style={{ marginTop: 6, fontFamily: "Fraunces, serif", fontSize: 16, color: COLORS.ink, fontWeight: 600 }}>
            Lipid Panel · 12 Mar 2025
          </div>
          <div style={{ marginTop: 4, fontFamily: "Inter", fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.5 }}>
            LDL slightly elevated at 142 mg/dL. HDL within range.
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ marginTop: 14, padding: "0 18px" }}>
        {items.map((it, i) => (
          <div key={it.name} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 14px",
            background: "#fff", borderRadius: 14, border: `1px solid ${COLORS.border}`,
            marginBottom: 8,
            opacity: list[i], transform: `translateY(${interpolate(list[i], [0, 1], [10, 0])}px)`,
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${it.color}22`, display: "flex", alignItems: "center", justifyContent: "center", color: it.color, fontWeight: 700, fontSize: 16 }}>
              ▢
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Inter", fontSize: 13, color: COLORS.ink, fontWeight: 600 }}>{it.name}</div>
              <div style={{ marginTop: 2, fontFamily: "Inter", fontSize: 11, color: COLORS.inkSoft }}>{it.tag} · {it.date}</div>
            </div>
            <div style={{ color: COLORS.inkSoft, fontSize: 16 }}>›</div>
          </div>
        ))}
      </div>

      <Tabs active="records" />
    </div>
  );
};

// ====================================================================
// TRENDS — animated chart
// ====================================================================
export const MockTrends: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 20, fps, config: { damping: 22 } });
  const lineLen = interpolate(frame, [40, 130], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const points = [
    { x: 0,    y: 0.45 },
    { x: 0.16, y: 0.5  },
    { x: 0.32, y: 0.62 },
    { x: 0.48, y: 0.7  },
    { x: 0.64, y: 0.6  },
    { x: 0.80, y: 0.48 },
    { x: 1.0,  y: 0.4  },
  ];
  const W = 360, H = 160;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * W} ${H - p.y * H}`).join(" ");

  return (
    <div style={{ width: "100%", height: "100%", background: "#FAFAF7", position: "relative", overflow: "hidden" }}>
      <div style={{ padding: "14px 22px 0", opacity: head }}>
        <div style={{ fontFamily: "Inter", fontSize: 12, color: COLORS.inkSoft, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>Trends · 33 vitals</div>
        <div style={{ marginTop: 6, fontFamily: "Fraunces, serif", fontSize: 28, color: COLORS.ink, fontWeight: 500, letterSpacing: -0.5 }}>
          Your <em style={{ color: COLORS.coral, fontStyle: "italic" }}>HbA1c</em>
        </div>
      </div>

      {/* Big number */}
      <div style={{ padding: "14px 22px 0", display: "flex", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 56, color: COLORS.ink, fontWeight: 600, letterSpacing: -1 }}>6.2</div>
        <div style={{ fontFamily: "Inter", fontSize: 12, color: COLORS.inkSoft }}>%</div>
        <div style={{ marginLeft: "auto", padding: "4px 10px", background: `${COLORS.sage}22`, color: COLORS.sage, borderRadius: 999, fontSize: 11, fontWeight: 700 }}>↓ 0.8</div>
      </div>

      {/* Chart */}
      <div style={{ margin: "14px 18px 0", padding: 18, background: "#fff", borderRadius: 18, border: `1px solid ${COLORS.border}` }}>
        <svg width={W} height={H} style={{ display: "block" }}>
          <defs>
            <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.coral} stopOpacity="0.25" />
              <stop offset="100%" stopColor={COLORS.coral} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(y => (
            <line key={y} x1={0} x2={W} y1={H * y} y2={H * y} stroke={COLORS.border} strokeWidth={1} />
          ))}
          <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill="url(#ga)" opacity={lineLen} />
          <path d={path} fill="none" stroke={COLORS.coral} strokeWidth={3.5} strokeLinecap="round"
            strokeDasharray={2000} strokeDashoffset={(1 - lineLen) * 2000} />
          {points.map((p, i) => (
            <circle key={i} cx={p.x * W} cy={H - p.y * H} r={4.5} fill="#fff"
              stroke={COLORS.coral} strokeWidth={2.5}
              opacity={interpolate(lineLen, [i / points.length - 0.05, i / points.length + 0.05], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          ))}
        </svg>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontFamily: "Inter", fontSize: 10, color: COLORS.inkSoft, fontWeight: 600 }}>
          <span>2019</span><span>2021</span><span>2023</span><span>2025</span>
        </div>
      </div>

      {/* Other vitals */}
      <div style={{ margin: "14px 18px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { k: "BP", v: "122/78", delta: "↓ stable", c: COLORS.sage },
          { k: "TSH", v: "2.4", delta: "Normal", c: COLORS.sage },
          { k: "LDL", v: "142", delta: "↑ watch", c: COLORS.coral },
          { k: "HDL", v: "48", delta: "Within", c: COLORS.sage },
        ].map(it => (
          <div key={it.k} style={{ padding: 12, background: "#fff", borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 10, color: COLORS.inkSoft, fontWeight: 600, letterSpacing: 0.5 }}>{it.k}</div>
            <div style={{ marginTop: 2, fontFamily: "Fraunces, serif", fontSize: 18, color: COLORS.ink, fontWeight: 600 }}>{it.v}</div>
            <div style={{ fontSize: 10, color: it.c, fontWeight: 600 }}>{it.delta}</div>
          </div>
        ))}
      </div>

      <Tabs active="trends" />
    </div>
  );
};

// ====================================================================
// RX READER — multilingual
// ====================================================================
export const MockRx: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 20, fps, config: { damping: 22 } });

  const langs = [
    { name: "Tamil",   rx: "மெட்ஃபார்மின் 500mg",    en: "Metformin 500mg", dose: "Twice daily, after meals" },
    { name: "Hindi",   rx: "थायरॉक्सिन 50mcg",        en: "Thyroxine 50mcg", dose: "Once daily, empty stomach" },
    { name: "Telugu",  rx: "అటోర్వాస్టాటిన్ 10mg",  en: "Atorvastatin 10mg", dose: "At bedtime" },
    { name: "Bengali", rx: "অ্যামলোডিপাইন 5mg",       en: "Amlodipine 5mg", dose: "Once daily, morning" },
  ];
  const cycleLen = 90;
  const idx = Math.floor(Math.max(0, frame - 40) / cycleLen) % langs.length;
  const cur = langs[idx];
  const cardKey = `${idx}-${Math.floor((frame - 40) / cycleLen)}`;
  const cardLocal = (frame - 40) % cycleLen;
  const cardEnter = spring({ frame: cardLocal, fps, config: { damping: 22 } });

  return (
    <div style={{ width: "100%", height: "100%", background: "#FAFAF7", position: "relative", overflow: "hidden" }}>
      <div style={{ padding: "14px 22px 0", opacity: head }}>
        <div style={{ fontFamily: "Inter", fontSize: 12, color: COLORS.inkSoft, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>Rx Reader</div>
        <div style={{ marginTop: 6, fontFamily: "Fraunces, serif", fontSize: 26, color: COLORS.ink, fontWeight: 500, letterSpacing: -0.5 }}>
          Even <em style={{ color: COLORS.coral, fontStyle: "italic" }}>handwritten</em>
        </div>
      </div>

      {/* Prescription card mock */}
      <div style={{
        margin: "14px 18px 0", padding: 14, background: "#fff",
        borderRadius: 16, border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ fontSize: 10, color: COLORS.inkSoft, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Uploaded Prescription</div>
        <div style={{
          marginTop: 8, padding: 14, borderRadius: 10,
          background: "repeating-linear-gradient(0deg, #FFFBF3 0, #FFFBF3 22px, #F4ECE0 23px)",
          fontFamily: "'Caveat', 'Comic Sans MS', cursive", fontSize: 22, color: "#3a342c",
          minHeight: 90, lineHeight: 1.4,
        }}>
          Dr. Iyer · 14 Mar<br />
          <span key={cardKey} style={{ opacity: cardEnter }}>{cur.rx}</span>
        </div>
      </div>

      {/* AI translation */}
      <div key={cardKey + "-out"} style={{
        margin: "14px 18px 0", padding: 16, background: "#fff",
        borderRadius: 16, border: `1.5px solid ${COLORS.coral}`,
        opacity: cardEnter, transform: `translateY(${interpolate(cardEnter, [0, 1], [12, 0])}px)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: "3px 9px", borderRadius: 999, background: COLORS.coralSoft, color: COLORS.coralDeep, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
            {cur.name.toUpperCase()}
          </div>
          <div style={{ fontSize: 10, color: COLORS.inkSoft, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>↓ Vyana reads</div>
        </div>
        <div style={{ marginTop: 10, fontFamily: "Fraunces, serif", fontSize: 22, color: COLORS.ink, fontWeight: 600 }}>{cur.en}</div>
        <div style={{ marginTop: 4, fontFamily: "Inter", fontSize: 13, color: COLORS.inkSoft }}>{cur.dose}</div>
        <div style={{ marginTop: 12, padding: "8px 12px", background: COLORS.cream, borderRadius: 10, fontFamily: "Inter", fontSize: 11, color: COLORS.ink }}>
          ⏰ Reminder set · 8:00 AM, 8:00 PM
        </div>
      </div>

      {/* Language pills */}
      <div style={{ margin: "14px 18px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {["English", "हिंदी", "தமிழ்", "తెలుగు", "বাংলা"].map((l, i) => (
          <div key={l} style={{
            padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, fontFamily: "Inter",
            background: i === idx ? COLORS.coral : "#fff", color: i === idx ? "#fff" : COLORS.inkSoft,
            border: `1px solid ${i === idx ? COLORS.coral : COLORS.border}`,
          }}>{l}</div>
        ))}
      </div>

      <Tabs active="rx" />
    </div>
  );
};

// ====================================================================
// SHARE — secure ABHA link
// ====================================================================
export const MockShare: React.FC<{ generateAt?: number }> = ({ generateAt = 50 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 20, fps, config: { damping: 22 } });
  const linkEnter = spring({ frame: frame - generateAt, fps, config: { damping: 22 } });
  const showLink = frame > generateAt - 5;

  return (
    <div style={{ width: "100%", height: "100%", background: "#FAFAF7", position: "relative", overflow: "hidden" }}>
      <div style={{ padding: "14px 22px 0", opacity: head }}>
        <div style={{ fontFamily: "Inter", fontSize: 12, color: COLORS.inkSoft, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>Share securely</div>
        <div style={{ marginTop: 6, fontFamily: "Fraunces, serif", fontSize: 26, color: COLORS.ink, fontWeight: 500, letterSpacing: -0.5 }}>
          With your <em style={{ color: COLORS.coral, fontStyle: "italic" }}>doctor</em>
        </div>
      </div>

      {/* Recipient */}
      <div style={{ margin: "14px 18px 0", padding: 14, background: "#fff", borderRadius: 14, border: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 10, color: COLORS.inkSoft, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Recipient</div>
        <div style={{ marginTop: 4, fontFamily: "Inter", fontSize: 14, color: COLORS.ink, fontWeight: 600 }}>Dr. Anand Iyer</div>
        <div style={{ fontFamily: "Inter", fontSize: 11, color: COLORS.inkSoft }}>+91 98•••••43 · Cardiology</div>
      </div>

      {/* Toggles */}
      <div style={{ margin: "12px 18px 0", padding: 12, background: "#fff", borderRadius: 14, border: `1px solid ${COLORS.border}` }}>
        {[
          ["All records", true],
          ["Trends & vitals", true],
          ["Active medications", true],
          ["Family history", false],
        ].map(([l, on]) => (
          <div key={l as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ fontFamily: "Inter", fontSize: 13, color: COLORS.ink }}>{l as string}</div>
            <div style={{ width: 36, height: 22, borderRadius: 11, background: on ? COLORS.coral : "#ddd", position: "relative" }}>
              <div style={{ position: "absolute", top: 2, left: on ? 16 : 2, width: 18, height: 18, borderRadius: 9, background: "#fff" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Generate button */}
      <div style={{
        margin: "14px 18px 0", padding: "14px 16px", background: COLORS.coral, color: "#fff",
        borderRadius: 14, fontFamily: "Inter", fontSize: 14, fontWeight: 700, textAlign: "center",
        boxShadow: "0 8px 20px rgba(232,112,77,0.3)",
      }}>
        Generate secure link
      </div>

      {/* Generated link card */}
      {showLink && (
        <div style={{
          margin: "14px 18px 0", padding: 14, background: "linear-gradient(135deg, #E8F0E9 0%, #fff 100%)",
          borderRadius: 14, border: `1.5px solid ${COLORS.sage}`,
          opacity: linkEnter, transform: `translateY(${interpolate(linkEnter, [0, 1], [12, 0])}px)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: COLORS.sage, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: COLORS.sage }} /> Link ready · ABHA verified
          </div>
          <div style={{ marginTop: 8, padding: "8px 10px", background: "#fff", borderRadius: 8, fontFamily: "monospace", fontSize: 11, color: COLORS.ink }}>
            vyana.in/s/8f3a··e21c
          </div>
          <div style={{ marginTop: 8, fontFamily: "Inter", fontSize: 11, color: COLORS.inkSoft }}>
            Expires in 23h 58m · One-time view
          </div>
        </div>
      )}

      <Tabs active="share" />
    </div>
  );
};

// ====================================================================
// EMERGENCY BRIEFING
// ====================================================================
export const MockEmergency: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 15, fps, config: { damping: 22 } });
  const items = [0, 1, 2, 3, 4].map(i => spring({ frame: frame - 30 - i * 10, fps, config: { damping: 22 } }));

  return (
    <div style={{ width: "100%", height: "100%", background: "#FFFBF3", position: "relative", overflow: "hidden" }}>
      {/* Red top bar */}
      <div style={{ background: COLORS.coral, padding: "12px 18px 14px", color: "#fff", opacity: head }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.9 }}>Emergency Briefing</div>
        <div style={{ marginTop: 4, fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600 }}>Rajan Krishnan, 64</div>
        <div style={{ fontFamily: "Inter", fontSize: 11, opacity: 0.85 }}>Father · ABHA 12-3456-•••-1234</div>
      </div>

      {/* Critical badges */}
      <div style={{ padding: "14px 18px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { k: "Blood Group", v: "B+", c: COLORS.coral },
          { k: "Allergies", v: "Penicillin", c: COLORS.coralDeep },
          { k: "Conditions", v: "T2 Diabetes, HTN", c: COLORS.amber },
          { k: "Weight", v: "78 kg", c: COLORS.sage },
        ].map((it, i) => (
          <div key={it.k} style={{
            padding: 12, background: "#fff", borderRadius: 12, border: `1.5px solid ${it.c}`,
            opacity: items[i], transform: `translateY(${interpolate(items[i], [0, 1], [10, 0])}px)`,
          }}>
            <div style={{ fontSize: 10, color: COLORS.inkSoft, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{it.k}</div>
            <div style={{ marginTop: 4, fontFamily: "Fraunces, serif", fontSize: 18, color: COLORS.ink, fontWeight: 600, lineHeight: 1.1 }}>{it.v}</div>
          </div>
        ))}
      </div>

      {/* Active medications */}
      <div style={{
        margin: "14px 18px 0", padding: 14, background: "#fff", borderRadius: 14,
        border: `1px solid ${COLORS.border}`,
        opacity: items[4], transform: `translateY(${interpolate(items[4], [0, 1], [10, 0])}px)`,
      }}>
        <div style={{ fontSize: 10, color: COLORS.coral, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Active medications</div>
        {[
          ["Metformin", "500mg · 2x daily"],
          ["Telmisartan", "40mg · morning"],
          ["Atorvastatin", "10mg · bedtime"],
        ].map(([n, d]) => (
          <div key={n} style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "Inter", fontSize: 13, color: COLORS.ink, fontWeight: 600 }}>{n}</div>
            <div style={{ fontFamily: "Inter", fontSize: 12, color: COLORS.inkSoft }}>{d}</div>
          </div>
        ))}
      </div>

      <div style={{ margin: "14px 18px 0", padding: "10px 12px", background: COLORS.coralSoft, borderRadius: 10, fontFamily: "Inter", fontSize: 11, color: COLORS.coralDeep, fontWeight: 600 }}>
        Emergency contact: Meera (daughter) · +91 98•••••12
      </div>
    </div>
  );
};

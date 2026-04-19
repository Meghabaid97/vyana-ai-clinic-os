// Vyana brand tokens - matches the app
export const COLORS = {
  bg: "#FAFAF7",          // warm off-white (Notion-ish)
  bgDark: "#0F0E0C",      // deep warm charcoal
  ink: "#171514",         // primary text
  inkSoft: "#5A524C",     // muted text
  paper: "#FFFFFF",
  border: "#E8E3DD",
  // Coral - Vyana's pop color (12 76% 61% in HSL)
  coral: "#E8704D",
  coralSoft: "#FBE4DA",
  coralDeep: "#C4502E",
  amber: "#E8A957",
  sage: "#7A9B7E",
  // Accents for depth
  cream: "#F4ECE0",
  shadow: "rgba(23, 21, 20, 0.08)",
};

export const FPS = 30;

// Scene timing in seconds (sums to ~180s)
export const SCENES = {
  hook: 12,         // The drawer
  chaos: 18,        // WhatsApp scroll, scattered records
  clinic: 18,       // Doctor asking again
  emergency: 22,    // 2AM split
  intro: 14,        // Vyana enters
  demoUpload: 22,   // Upload + AI summary
  demoTimeline: 20, // Timeline + trends
  demoRx: 20,       // Multilingual Rx reader
  demoShare: 18,    // ABHA share
  promise: 10,      // Family promise
  close: 6,         // Logo close
};

export const sec = (s: number) => Math.round(s * FPS);

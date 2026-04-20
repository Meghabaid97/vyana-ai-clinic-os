// Vyana brand tokens — Canva-kinetic palette
export const COLORS = {
  // Backgrounds (each scene picks one for variety)
  cream: "#FFF8EE",
  peach: "#FFE6D6",
  mint: "#E6F4EC",
  sky: "#E1ECF7",
  sand: "#F5EDE0",
  ink: "#171514",
  inkSoft: "#5A524C",
  paper: "#FFFFFF",
  border: "#E8E3DD",
  // Accents
  coral: "#E8704D",
  coralDeep: "#C4502E",
  amber: "#E8A957",
  sage: "#7A9B7E",
  navy: "#1F3A5F",
  yellow: "#F5C84B",
};

export const FPS = 30;

// 13 scenes × ~14s = 182s (matches 180s music with tail fade)
export const SCENE_SEC = 14;
export const SCENE_COUNT = 13;
export const TOTAL_FRAMES = SCENE_COUNT * SCENE_SEC * FPS; // 5460

export const sec = (s: number) => Math.round(s * FPS);

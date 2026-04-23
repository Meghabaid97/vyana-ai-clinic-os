/**
 * Centralized vital/lab status helper.
 *
 * Status semantics (match existing dashboard logic):
 *   - "normal" (was "ok"):    value sits inside the healthy band
 *   - "watch":                value is just past a boundary (≤ 15% over high, ≤ 15% under low)
 *   - "high":                 value is meaningfully above the healthy ceiling
 *   - "low":                  value is meaningfully below the healthy floor
 *
 * Pair with the `--status-*` HSL tokens defined in index.css and exposed
 * in tailwind.config.ts as `bg-status-normal`, `text-status-watch`, etc.
 */

export type VitalStatus = "normal" | "watch" | "high" | "low";

export interface VitalRange {
  low?: number;
  high?: number;
}

/**
 * Per-vital normalizers: coerce common unit-entry mistakes into the canonical
 * unit used by the healthy ranges. Keep these conservative — only collapse
 * obvious order-of-magnitude errors, never silently rescale plausible values.
 *
 * Canonical units match VITAL_DEFS in LatestVitalsStrip / HealthTrends:
 *   hba1c → %, weight → kg, platelet_count → /μL, creatinine/hemoglobin → mg/dL or g/dL
 */
const NORMALIZERS: Record<string, (v: number) => number> = {
  // HbA1c is a percent; if entered as a fraction (e.g. 0.075), scale up.
  hba1c: (v) => (v > 0 && v < 1 ? v * 100 : v),
  // Weight in kg; if entered in grams (>= 1000), convert.
  weight: (v) => (v >= 1000 ? v / 1000 : v),
  // Platelets canonical /μL; if entered in lakhs (e.g. 2.5), scale to absolute.
  platelet_count: (v) => (v > 0 && v < 1000 ? v * 100000 : v),
  // WBC canonical /μL; if entered in thousands (e.g. 7.2), scale up.
  wbc: (v) => (v > 0 && v < 100 ? v * 1000 : v),
  // Body temp canonical °C; if entered in °F (>= 90), convert.
  temperature: (v) => (v >= 90 ? ((v - 32) * 5) / 9 : v),
};

/**
 * Normalize a raw reading for a known vital key into its canonical unit.
 * Returns the original value when no normalizer is registered.
 */
export function normalizeVital(key: string, value: number): number {
  const fn = NORMALIZERS[key];
  return fn ? fn(value) : value;
}

/** Sensible decimal places per canonical unit, used for display formatting. */
const DECIMALS: Record<string, number> = {
  hba1c: 1,
  weight: 1,
  hemoglobin: 1,
  creatinine: 2,
  tsh: 2,
  bilirubin: 1,
  albumin: 1,
  uric_acid: 1,
  rbc: 1,
  bmi: 1,
  temperature: 1,
};

/** Format a normalized vital with the right precision for its unit. */
export function formatVital(key: string, value: number, fallback = 1): string {
  const d = DECIMALS[key] ?? fallback;
  return d > 0 && !Number.isInteger(value) ? value.toFixed(d) : String(Math.round(value));
}

/**
 * Classify a vital reading against its healthy band.
 * Pass `key` so the value is normalized to canonical units before comparison.
 */
export function vitalStatus(value: number, range?: VitalRange, key?: string): VitalStatus {
  const v = key ? normalizeVital(key, value) : value;
  if (!range) return "normal";
  if (range.high != null && v > range.high) {
    return v > range.high * 1.15 ? "high" : "watch";
  }
  if (range.low != null && v < range.low) {
    return v < range.low * 0.85 ? "low" : "watch";
  }
  return "normal";
}

/** Tailwind class bundles for each status — chip background+text, solid bar, tinted track. */
export const STATUS_TONE: Record<
  VitalStatus,
  { chip: string; bar: string; track: string; stroke: string }
> = {
  normal: {
    chip: "bg-status-normal/12 text-status-normal",
    bar: "bg-status-normal",
    track: "bg-status-normal/15",
    stroke: "hsl(var(--status-normal))",
  },
  watch: {
    chip: "bg-status-watch/15 text-status-watch",
    bar: "bg-status-watch",
    track: "bg-status-watch/15",
    stroke: "hsl(var(--status-watch))",
  },
  high: {
    chip: "bg-status-high/12 text-status-high",
    bar: "bg-status-high",
    track: "bg-status-high/15",
    stroke: "hsl(var(--status-high))",
  },
  low: {
    chip: "bg-status-low/15 text-status-low",
    bar: "bg-status-low",
    track: "bg-status-low/15",
    stroke: "hsl(var(--status-low))",
  },
};

/** Friendly, warm-tone microcopy per status — for chips on patient-facing surfaces. */
export const STATUS_COPY: Record<VitalStatus, string> = {
  normal: "on point",
  watch: "keep an eye",
  high: "a bit high",
  low: "a bit low",
};

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

/** Classify a vital reading against its healthy band. */
export function vitalStatus(value: number, range?: VitalRange): VitalStatus {
  if (!range) return "normal";
  if (range.high != null && value > range.high) {
    return value > range.high * 1.15 ? "high" : "watch";
  }
  if (range.low != null && value < range.low) {
    return value < range.low * 0.85 ? "low" : "watch";
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

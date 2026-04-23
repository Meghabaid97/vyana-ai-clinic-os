import { useEffect, useRef, useState } from "react";

interface Props {
  /**
   * Display string like "75 pages" or "5 minutes". The leading numeric portion
   * (including a leading "0") is animated; the trailing unit text stays put.
   * If no leading number is found, the original string is rendered as-is.
   */
  value: string;
  /** Trigger the count when this becomes true (e.g. parent reveal visibility). */
  start: boolean;
  /** Animation duration in ms. Editorial pacing — keep it slow. */
  durationMs?: number;
  className?: string;
}

/**
 * Quietly counts the leading number in `value` from 0 to its final value
 * once `start` flips to true. Designed for hero stat cards on the landing
 * page — uses requestAnimationFrame, eases-out, runs at most once, and
 * collapses to the final value when the user prefers reduced motion.
 */
const CountUp = ({ value, start, durationMs = 1200, className }: Props) => {
  // Split "75 pages" → ["75", " pages"]. Supports decimals ("4.5 stars") too.
  const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const target = match ? parseFloat(match[1]) : null;
  const suffix = match ? match[2] : "";
  const decimals = match && match[1].includes(".") ? match[1].split(".")[1].length : 0;

  const [n, setN] = useState(target ?? 0);
  const playedRef = useRef(false);

  useEffect(() => {
    if (target == null) return;
    if (!start || playedRef.current) return;
    playedRef.current = true;

    // Honor reduced-motion: snap to the final value, no animation.
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }

    setN(0);
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      // easeOutQuint — matches our reveal-lg curve for a coherent system.
      const eased = 1 - Math.pow(1 - t, 5);
      setN(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setN(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, durationMs]);

  // Non-numeric value (or no leading digits) → render original string verbatim.
  if (target == null) return <span className={className}>{value}</span>;

  const display = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
  return (
    <span className={className}>
      <span aria-hidden>{display}</span>
      {suffix}
      {/* Screen readers should hear the final value, not the ticking one. */}
      <span className="sr-only">{value}</span>
    </span>
  );
};

export default CountUp;

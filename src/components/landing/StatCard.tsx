import { useSpotlight } from "@/hooks/use-spotlight";
import CountUp from "@/components/landing/CountUp";

interface Props {
  k: string;
  v: string;
  /** Index 0/1/2 — drives the stagger class and the count-up duration. */
  index: number;
  /** Parent reveal visibility — gates the count-up start. */
  visible: boolean;
}

/**
 * One of the three "75 / 5 / 0" stat cards on the landing problem section.
 * Composes our reveal-lg entrance, whisper-tilt, cursor spotlight, and
 * count-up number animation into a single, self-contained card so each
 * instance can own its own pointer-tracking state.
 */
export const StatCard = ({ k, v, index, visible }: Props) => {
  const spot = useSpotlight<HTMLDivElement>();
  // Slower count for the larger numbers, snappier for the small ones —
  // they all land at roughly the same perceived moment.
  const dur = index === 0 ? 1400 : index === 1 ? 1100 : 800;

  return (
    <div
      ref={spot.ref}
      onPointerMove={spot.onPointerMove}
      onPointerLeave={spot.onPointerLeave}
      className={`tilt-card spotlight-card reveal reveal-lg reveal-stagger-${index + 1} ${
        visible ? "is-visible" : ""
      } rounded-2xl glass-card-dark p-8`}
    >
      <div className="font-serif text-[42px] leading-none text-primary tracking-[-0.02em] tabular-nums">
        <CountUp value={k} start={visible} durationMs={dur} />
      </div>
      <p className="mt-5 text-body text-surface-dark-muted">{v}</p>
    </div>
  );
};

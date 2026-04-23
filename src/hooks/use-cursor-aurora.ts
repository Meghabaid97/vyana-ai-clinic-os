import { useEffect, useRef } from "react";

/**
 * useCursorAurora — tracks pointer position over the element and writes
 * it as `--ax` / `--ay` (percentages) on the element. Pair with the
 * `aurora-cursor` CSS utility, whose ::before background is anchored to
 * those vars so the wash drifts toward the cursor. Desktop only.
 */
export function useCursorAurora<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== "undefined") {
      const isFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!isFine || reduced) return;
    }

    let raf = 0;
    let tx = 50;
    let ty = 50;
    let cx = 50;
    let cy = 50;

    const tick = () => {
      // Ease toward target — softer drift than 1:1 tracking.
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      el.style.setProperty("--ax", `${cx}%`);
      el.style.setProperty("--ay", `${cy}%`);
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      tx = ((e.clientX - rect.left) / rect.width) * 100;
      ty = ((e.clientY - rect.top) / rect.height) * 100;
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      el.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return ref;
}

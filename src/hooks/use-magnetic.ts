import { useCallback, useEffect, useRef } from "react";

/**
 * useMagnetic — pulls the target element toward the cursor when within
 * `radius` pixels. Desktop pointer-fine only. Disabled on touch and
 * reduced-motion. Zero React state, sets transform directly via rAF.
 */
export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(
  radius = 80,
  strength = 0.35
) {
  const ref = useRef<T | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== "undefined") {
      const isFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!isFine || reduced) return;
    }

    el.style.transition = "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)";
    el.style.willChange = "transform";

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const reach = radius + Math.max(rect.width, rect.height) / 2;

      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        if (dist < reach) {
          el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
        } else {
          el.style.transform = "translate(0, 0)";
        }
      });
    };

    const onLeave = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      el.style.transform = "translate(0, 0)";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [radius, strength]);

  return ref;
}

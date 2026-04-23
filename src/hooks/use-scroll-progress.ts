import { useEffect, useRef, useState } from "react";

/**
 * useScrollProgress — returns 0→1 progress of an element through the viewport.
 *
 * 0   = element's top has just reached the bottom of the viewport
 * 1   = element's bottom has just left the top of the viewport
 *
 * Used to drive scroll-bound animations (sticky scenes, parallax, etc.)
 * without any external library. Reads only on rAF-throttled scroll events.
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;

    const compute = () => {
      ticking = false;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Distance scrolled past the element's top, normalized to (height + viewport).
      const total = rect.height + vh;
      const scrolled = vh - rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      setProgress(p);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return { ref, progress };
}

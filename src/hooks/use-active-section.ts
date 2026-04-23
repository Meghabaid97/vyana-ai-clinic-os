import { useEffect, useRef, useState } from "react";

/**
 * Tracks which of N stacked sections is currently "active" in the viewport
 * for sticky-scroll narrative patterns. Returns the active index and a
 * registerRef function to attach to each section.
 *
 * Active = the section whose center is closest to the viewport center.
 */
export function useActiveSection(count: number) {
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLElement | null>>([]);

  // Ensure refs array length matches count
  if (refs.current.length !== count) {
    refs.current = Array(count).fill(null);
  }

  useEffect(() => {
    const compute = () => {
      const viewportCenter = window.innerHeight / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - viewportCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });
      setActive((prev) => (prev === bestIdx ? prev : bestIdx));
    };

    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [count]);

  const registerRef = (i: number) => (el: HTMLElement | null) => {
    refs.current[i] = el;
  };

  return { active, registerRef };
}

import { RefObject, useEffect, useRef, useState } from "react";

/**
 * Tracks which of N stacked sections is currently active.
 * If a scroll root is provided, activity is computed from that container's
 * internal scroll position. Otherwise it falls back to window scroll.
 */
export function useActiveSection(
  count: number,
  rootRef?: RefObject<HTMLElement | null>,
) {
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLElement | null>>([]);

  if (refs.current.length !== count) {
    refs.current = Array(count).fill(null);
  }

  useEffect(() => {
    const compute = () => {
      const root = rootRef?.current;
      const rootRect = root?.getBoundingClientRect();
      const viewportCenter = root ? root.clientHeight / 2 : window.innerHeight / 2;

      let bestIdx = 0;
      let bestDist = Infinity;

      refs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = root && rootRect
          ? rect.top - rootRect.top + rect.height / 2
          : rect.top + rect.height / 2;
        const dist = Math.abs(center - viewportCenter);

        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });

      setActive((prev) => (prev === bestIdx ? prev : bestIdx));
    };

    const root = rootRef?.current;
    compute();

    const target: Window | HTMLElement = root ?? window;
    target.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);

    return () => {
      target.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [count, rootRef]);

  const registerRef = (i: number) => (el: HTMLElement | null) => {
    refs.current[i] = el;
  };

  return { active, registerRef };
}


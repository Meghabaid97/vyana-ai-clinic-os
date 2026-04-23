import { useCallback, useRef } from "react";

/**
 * useSpotlight — tracks the pointer position inside an element and writes it
 * to two CSS custom properties (`--mx`, `--my`) as percentages, plus `--ma`
 * (alpha) which jumps to 1 on enter and fades to 0 on leave.
 *
 * Designed for the `.spotlight-card` utility in index.css: that class paints
 * a radial gradient at (--mx, --my) so the spotlight follows the cursor
 * without ever touching React state. Zero re-renders, pointer-fine only.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  const onPointerMove = useCallback((e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    // Ignore touch — spotlight is a pointer-fine affordance only.
    if (e.pointerType !== "mouse") return;
    const rect = el.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${mx}%`);
    el.style.setProperty("--my", `${my}%`);
    el.style.setProperty("--ma", "1");
  }, []);

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--ma", "0");
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}

import { useCallback } from "react";
import { useNavigate, NavigateOptions, To } from "react-router-dom";
import { flushSync } from "react-dom";

/**
 * Wraps React Router's navigate() with the View Transitions API for a
 * native, GPU-accelerated cross-fade between routes.
 *
 * - Browsers without `document.startViewTransition` (Firefox, older Safari)
 *   fall back to instant navigation. No layout shift, no JS animation cost.
 * - `prefers-reduced-motion` is honoured at the CSS layer
 *   (see `::view-transition-*` rules in index.css).
 * - `flushSync` ensures React commits the new route inside the transition
 *   callback, so the browser snapshots both old and new DOM correctly.
 */
export const useViewTransitionNavigate = () => {
  const navigate = useNavigate();

  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      const run = () => {
        if (typeof to === "number") {
          navigate(to);
        } else {
          navigate(to, options);
        }
      };

      // Feature-detect; bail out cleanly on unsupported browsers.
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => unknown;
      };
      if (typeof doc.startViewTransition !== "function") {
        run();
        return;
      }

      doc.startViewTransition(() => {
        flushSync(run);
      });
    },
    [navigate],
  );
};

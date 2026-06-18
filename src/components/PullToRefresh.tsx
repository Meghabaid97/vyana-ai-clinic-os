import { useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  /** Async refresh handler. Defaults to a soft reload of the current route. */
  onRefresh?: () => Promise<void> | void;
  /** Disable on desktop or specific routes. */
  disabled?: boolean;
}

const TRIGGER = 70; // px to trigger refresh
const MAX = 110;   // px max visual pull

/**
 * iOS-style pull-to-refresh for the mobile app shell.
 * Only activates when the scroll container is at the top.
 *
 * Perf-critical: listeners are attached ONCE per mount and read state via refs.
 * (Previously `pull` was in the effect deps, so every touchmove re-attached
 * the listeners, which destroyed scroll FPS on iOS.)
 */
const PullToRefresh = ({ children, onRefresh, disabled }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const disabledRef = useRef(!!disabled);
  const onRefreshRef = useRef(onRefresh);
  const [pull, setPullState] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Keep refs in sync without re-running the listener effect.
  useEffect(() => { disabledRef.current = !!disabled; }, [disabled]);
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);
  useEffect(() => { refreshingRef.current = refreshing; }, [refreshing]);

  const setPull = useCallback((v: number) => {
    pullRef.current = v;
    setPullState(v);
  }, []);

  const doRefresh = useCallback(async () => {
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      if (onRefreshRef.current) {
        await onRefreshRef.current();
      } else {
        window.location.reload();
        return;
      }
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
      setPull(0);
    }
  }, [setPull]);

  useEffect(() => {
    const el = containerRef.current?.parentElement; // scroll container is <main>
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (disabledRef.current || refreshingRef.current) return;
      if (el.scrollTop > 0) { startY.current = null; return; }
      startY.current = e.touches[0].clientY;
      pulling.current = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (disabledRef.current || refreshingRef.current) return;
      if (startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        if (pullRef.current !== 0) setPull(0);
        return;
      }
      if (el.scrollTop > 0) {
        if (pullRef.current !== 0) setPull(0);
        return;
      }
      pulling.current = true;
      const eased = Math.min(MAX, Math.pow(delta, 0.85));
      setPull(eased);
      if (e.cancelable) e.preventDefault();
    };
    const onTouchEnd = () => {
      if (refreshingRef.current) return;
      if (pulling.current && pullRef.current >= TRIGGER) {
        void doRefresh();
      } else if (pullRef.current !== 0) {
        setPull(0);
      }
      startY.current = null;
      pulling.current = false;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [doRefresh, setPull]);

  const ready = pull >= TRIGGER;
  const visible = pull > 4 || refreshing;

  return (
    <div ref={containerRef} className="relative">
      <div
        aria-hidden={!visible}
        className={cn(
          "lg:hidden pointer-events-none absolute left-0 right-0 -top-1 flex items-start justify-center transition-opacity",
          visible ? "opacity-100" : "opacity-0"
        )}
        style={{
          transform: `translateY(${refreshing ? 24 : Math.min(pull, MAX) - 8}px)`,
          transition: refreshing || pull === 0 ? "transform 200ms ease" : "none",
        }}
      >
        <div className="h-8 w-8 rounded-full bg-background/90 border border-border shadow-sm flex items-center justify-center text-primary">
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                ready ? "rotate-180" : "rotate-0"
              )}
            />
          )}
        </div>
      </div>

      <div
        style={{
          transform: `translateY(${refreshing ? 28 : pull * 0.5}px)`,
          transition: refreshing || pull === 0 ? "transform 200ms ease" : "none",
          willChange: pull > 0 || refreshing ? "transform" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;

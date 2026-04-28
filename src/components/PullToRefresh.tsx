import { useEffect, useRef, useState, ReactNode } from "react";
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
 */
const PullToRefresh = ({ children, onRefresh, disabled }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const doRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        // Default: re-trigger the current route by soft reload
        window.location.reload();
        return;
      }
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  };

  useEffect(() => {
    if (disabled) return;
    const el = containerRef.current?.parentElement; // scroll container is <main>
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      if (el.scrollTop > 0) { startY.current = null; return; }
      startY.current = e.touches[0].clientY;
      pulling.current = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (refreshing || startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) { setPull(0); return; }
      if (el.scrollTop > 0) { setPull(0); return; }
      pulling.current = true;
      // resistance curve
      const eased = Math.min(MAX, Math.pow(delta, 0.85));
      setPull(eased);
      if (e.cancelable) e.preventDefault();
    };
    const onTouchEnd = () => {
      if (refreshing) return;
      if (pulling.current && pull >= TRIGGER) {
        void doRefresh();
      } else {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, refreshing, pull]);

  const ready = pull >= TRIGGER;
  const visible = pull > 4 || refreshing;

  return (
    <div ref={containerRef} className="relative">
      {/* Indicator */}
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

      {/* Content shifts down with pull */}
      <div
        style={{
          transform: `translateY(${refreshing ? 28 : pull * 0.5}px)`,
          transition: refreshing || pull === 0 ? "transform 200ms ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;

import { useEffect, useState, useLayoutEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, X, Sparkles } from "lucide-react";

export interface TourStep {
  /** CSS selector or `data-tour` id of the element to highlight. Use `null` for centered intro. */
  target: string | null;
  /** Path to navigate to before showing this step. */
  path?: string;
  eyebrow: string;
  title: string;
  body: string;
}

// Steps reference targets that exist on /app + the current bottom-tab IDs
// (home, briefing, trends, records, claims, profile) plus the Emergency quick action on Home.
const STEPS: TourStep[] = [
  {
    target: null,
    path: "/app",
    eyebrow: "Welcome to Vyana",
    title: "A 60-second tour of your health home.",
    body: "We will show you the few things that matter. Skip anytime — you can replay this from the top bar.",
  },
  {
    target: '[data-tour="briefing-hero"]',
    path: "/app",
    eyebrow: "Step 1 of 6",
    title: "Doctor-ready in 30 seconds.",
    body: "Tap here before any visit. Vyana turns your records into a one-page brief your doctor can read in seconds.",
  },
  {
    target: '[data-tour="nav-records"]',
    path: "/app",
    eyebrow: "Step 2 of 6",
    title: "Your records, in one place.",
    body: "Upload prescriptions, labs, discharge summaries. We extract vitals and meds automatically.",
  },
  {
    target: '[data-tour="nav-trends"]',
    path: "/app",
    eyebrow: "Step 3 of 6",
    title: "See what is changing.",
    body: "Track 33+ vitals over time. Spot trends before they become problems.",
  },
  {
    target: '[data-tour="nav-claims"]',
    path: "/app",
    eyebrow: "Step 4 of 6",
    title: "Insurance claims, automated.",
    body: "Drop a discharge summary in. We assemble the paperwork your insurer needs.",
  },
  {
    target: '[data-tour="emergency-quick-action"]',
    path: "/app",
    eyebrow: "Step 5 of 6",
    title: "Emergency access, one tap away.",
    body: "Set up trusted contacts so loved ones can reach your critical health info in a crisis. Find it on your home screen.",
  },
  {
    target: '[data-tour="nav-profile"]',
    path: "/app",
    eyebrow: "Step 6 of 6",
    title: "Your profile lives here.",
    body: "Edit your details, manage language and location, and review your account anytime.",
  },
];

const STORAGE_KEY = "vyana-tour-completed-v1";

export const hasSeenTour = () =>
  typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";

export const markTourSeen = () => {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "1");
};

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const PADDING = 8;
// How long to wait for a step's target to appear before treating it as "missing"
// and falling back to a centered card so the user is never stuck.
const TARGET_WAIT_MS = 1200;

const SpotlightTour = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const navigatedForStepRef = useRef<number>(-1);

  const step = STEPS[stepIdx];

  // Reset internal state whenever the tour opens
  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setRect(null);
      setTargetMissing(false);
      navigatedForStepRef.current = -1;
    }
  }, [open]);

  // Navigate to the step's path if needed (only once per step to avoid loops)
  useEffect(() => {
    if (!open) return;
    if (!step.path) return;
    if (navigatedForStepRef.current === stepIdx) return;
    navigatedForStepRef.current = stepIdx;
    if (location.pathname !== step.path) {
      navigate(step.path);
    }
  }, [open, stepIdx, step.path, location.pathname, navigate]);

  // Measure target element with retries — if it never shows up, fall back to centered.
  useLayoutEffect(() => {
    if (!open) return;
    setTargetMissing(false);

    if (!step.target) {
      setRect(null);
      return;
    }

    let raf = 0;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = Math.ceil(TARGET_WAIT_MS / 100);

    const measure = () => {
      if (cancelled) return;
      const el = document.querySelector(step.target as string) as HTMLElement | null;
      if (!el) {
        attempts += 1;
        if (attempts >= maxAttempts) {
          // Give up — show centered card so user can still proceed
          setRect(null);
          setTargetMissing(true);
          return;
        }
        setTimeout(measure, 100);
        return;
      }

      const r = el.getBoundingClientRect();
      const offscreen = r.top < 80 || r.bottom > window.innerHeight - 120;
      if (offscreen) {
        try {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch {
          /* older browsers */
        }
      }

      raf = requestAnimationFrame(() => {
        if (cancelled) return;
        const r2 = el.getBoundingClientRect();
        // If the element was just clipped to 0×0 (e.g. inside a hidden header), bail
        if (r2.width === 0 || r2.height === 0) {
          setRect(null);
          setTargetMissing(true);
          return;
        }
        setRect({
          top: r2.top - PADDING,
          left: r2.left - PADDING,
          width: r2.width + PADDING * 2,
          height: r2.height + PADDING * 2,
        });
      });
    };

    // Wait a tick for navigation/layout to settle
    const t = setTimeout(measure, 200);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    return () => {
      cancelled = true;
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, stepIdx, step.target, location.pathname]);

  const isLast = stepIdx === STEPS.length - 1;
  const isFirst = stepIdx === 0;

  const handleNext = useCallback(() => {
    if (isLast) {
      markTourSeen();
      onClose();
      setStepIdx(0);
    } else {
      setStepIdx((i) => i + 1);
    }
  }, [isLast, onClose]);

  const handleSkip = useCallback(() => {
    markTourSeen();
    onClose();
    setStepIdx(0);
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleSkip();
      else if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
      else if (e.key === "ArrowLeft") setStepIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleNext, handleSkip]);

  if (!open) return null;

  // Card position: clamp to viewport, account for safe areas + bottom tab bar (~52px)
  const getCardStyle = (): React.CSSProperties => {
    const isMobile = window.innerWidth < 1024;
    const cardWidth = Math.min(360, window.innerWidth - 24);
    const safeBottom = isMobile ? 76 : 24; // bottom tab bar + breathing room
    const safeTop = isMobile ? 56 : 24; // mobile header

    if (!rect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: cardWidth,
        maxHeight: `calc(100vh - ${safeTop + safeBottom}px)`,
      };
    }

    const spaceBelow = window.innerHeight - (rect.top + rect.height) - safeBottom;
    const spaceAbove = rect.top - safeTop;
    const placeBelow = spaceBelow >= 200 || spaceBelow >= spaceAbove;

    let left = rect.left + rect.width / 2 - cardWidth / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - cardWidth - 12));

    if (placeBelow) {
      const top = rect.top + rect.height + 12;
      return {
        top,
        left,
        width: cardWidth,
        maxHeight: `calc(100vh - ${top + safeBottom}px)`,
      };
    }
    // Place above
    const bottomEdge = rect.top - 12;
    return {
      top: Math.max(safeTop, bottomEdge - 280),
      left,
      width: cardWidth,
      maxHeight: bottomEdge - safeTop,
    };
  };

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in">
      {/* SVG mask — dim everything except the highlighted rect */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={handleSkip}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="hsl(var(--foreground) / 0.72)"
          mask="url(#spotlight-mask)"
        />
        {rect && (
          <rect
            x={rect.left}
            y={rect.top}
            width={rect.width}
            height={rect.height}
            rx={12}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            className="pointer-events-none"
          />
        )}
      </svg>

      {/* Card */}
      <div
        className="absolute rounded-2xl bg-background border border-border shadow-2xl p-4 sm:p-5 animate-scale-in overflow-y-auto"
        style={getCardStyle()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
      >
        <button
          onClick={handleSkip}
          aria-label="Skip tour"
          className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full hover:bg-muted active:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 mb-2 pr-8">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-primary truncate">
            {step.eyebrow}
          </p>
        </div>

        <h3 className="font-bold text-[16px] sm:text-[17px] text-foreground leading-tight pr-2">
          {step.title}
        </h3>
        <p className="mt-2 text-[13px] sm:text-[13.5px] text-muted-foreground leading-relaxed">
          {step.body}
        </p>

        {targetMissing && step.target && (
          <p className="mt-2 text-[11px] text-muted-foreground/80 italic">
            (This control is on another screen — continue to next step.)
          </p>
        )}

        {/* Progress dots */}
        <div className="mt-4 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStepIdx(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIdx ? "w-5 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={handleSkip}
            className="text-[12.5px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                className="text-[12.5px] font-medium text-foreground hover:bg-muted active:bg-muted rounded-full px-3 py-1.5 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-4 py-2 text-[12.5px] font-semibold hover:opacity-90 active:opacity-80 transition-opacity"
            >
              {isLast ? "Got it" : isFirst ? "Start tour" : "Next"}
              {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotlightTour;

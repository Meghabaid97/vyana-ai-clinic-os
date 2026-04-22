import { useEffect, useState, useLayoutEffect } from "react";
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
    eyebrow: "Step 1 of 5",
    title: "Doctor-ready in 30 seconds.",
    body: "Tap here before any visit. Vyana turns your records into a one-page brief your doctor can read in seconds.",
  },
  {
    target: '[data-tour="trust-strip"]',
    path: "/app",
    eyebrow: "Step 2 of 5",
    title: "Encrypted. Never sold.",
    body: "Your records are end-to-end encrypted, DPDPA 2023 compliant, and never shared with insurers or advertisers.",
  },
  {
    target: '[data-tour="nav-records"]',
    path: "/app",
    eyebrow: "Step 3 of 5",
    title: "Your records, in one place.",
    body: "Upload prescriptions, labs, discharge summaries. We extract vitals and meds automatically.",
  },
  {
    target: '[data-tour="nav-trends"]',
    path: "/app",
    eyebrow: "Step 4 of 5",
    title: "See what is changing.",
    body: "Track 33+ vitals over time. Spot trends before they become problems.",
  },
  {
    target: '[data-tour="nav-emergency"]',
    path: "/app",
    eyebrow: "Step 5 of 5",
    title: "Family access in emergencies.",
    body: "Designate trusted contacts. They get a one-page summary if you cannot speak for yourself.",
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

const SpotlightTour = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = STEPS[stepIdx];

  // Navigate to the step's path if needed
  useEffect(() => {
    if (!open) return;
    if (step.path && location.pathname !== step.path) {
      navigate(step.path);
    }
  }, [open, stepIdx, step.path, location.pathname, navigate]);

  // Measure target element
  useLayoutEffect(() => {
    if (!open) return;
    if (!step.target) {
      setRect(null);
      return;
    }

    let raf = 0;
    const measure = () => {
      const el = document.querySelector(step.target as string) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      // Scroll into view (centered)
      const r = el.getBoundingClientRect();
      const offscreen = r.top < 80 || r.bottom > window.innerHeight - 80;
      if (offscreen) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // Re-measure after scroll
      raf = requestAnimationFrame(() => {
        const r2 = el.getBoundingClientRect();
        setRect({
          top: r2.top - PADDING,
          left: r2.left - PADDING,
          width: r2.width + PADDING * 2,
          height: r2.height + PADDING * 2,
        });
      });
    };

    // Wait a tick for navigation to settle
    const t = setTimeout(measure, 150);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, stepIdx, step.target, location.pathname]);

  if (!open) return null;

  const isLast = stepIdx === STEPS.length - 1;
  const isFirst = stepIdx === 0;

  const handleNext = () => {
    if (isLast) {
      markTourSeen();
      onClose();
      setStepIdx(0);
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  const handleSkip = () => {
    markTourSeen();
    onClose();
    setStepIdx(0);
  };

  // Card position: prefer below the highlighted rect, fall back above, else centered
  const getCardStyle = (): React.CSSProperties => {
    if (!rect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }
    const cardWidth = Math.min(360, window.innerWidth - 32);
    const spaceBelow = window.innerHeight - (rect.top + rect.height);
    const spaceAbove = rect.top;
    const placeBelow = spaceBelow > 240 || spaceBelow > spaceAbove;

    let left = rect.left + rect.width / 2 - cardWidth / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16));

    if (placeBelow) {
      return { top: rect.top + rect.height + 12, left, width: cardWidth };
    }
    return { top: Math.max(16, rect.top - 12), left, width: cardWidth, transform: "translateY(-100%)" };
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
        className="absolute rounded-2xl bg-background border border-border shadow-2xl p-5 animate-scale-in"
        style={getCardStyle()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleSkip}
          aria-label="Skip tour"
          className="absolute top-3 right-3 h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-primary">
            {step.eyebrow}
          </p>
        </div>

        <h3 className="font-bold text-[17px] text-foreground leading-tight pr-6">
          {step.title}
        </h3>
        <p className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed">
          {step.body}
        </p>

        {/* Progress dots */}
        <div className="mt-4 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIdx ? "w-5 bg-primary" : "w-1.5 bg-border"
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
                className="text-[12.5px] font-medium text-foreground hover:bg-muted rounded-full px-3 py-1.5 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-4 py-2 text-[12.5px] font-semibold hover:opacity-90 transition-opacity"
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

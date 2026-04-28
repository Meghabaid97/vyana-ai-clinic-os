import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, X, Sparkles } from "lucide-react";

export interface TourStep {
  target: string | null;
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
    title: "Welcome, this is your health home.",
    body: "Vyana keeps your records, vitals and medications in one place so you never have to explain your medical history again. We'll show you around the key tabs in 30 seconds.",
  },
  {
    target: '[data-tour="nav-home"]',
    path: "/app",
    eyebrow: "Home",
    title: "Your daily health snapshot.",
    body: "Start here every day. See your story, reminders and quick actions at a glance.",
  },
  {
    target: '[data-tour="nav-briefing"]',
    path: "/app",
    eyebrow: "Briefing",
    title: "Open this before any doctor visit.",
    body: "Vyana generates a one-page clinical briefing of your history, vitals and meds, ready to share on WhatsApp.",
  },
  {
    target: '[data-tour="nav-trends"]',
    path: "/app",
    eyebrow: "Trends",
    title: "Track vitals and lab results over time.",
    body: "BP, sugar, cholesterol, thyroid and 30+ markers, plotted automatically from your uploaded reports.",
  },
  {
    target: '[data-tour="nav-records"]',
    path: "/app",
    eyebrow: "Records",
    title: "All your reports in one place.",
    body: "Upload prescriptions, lab reports or X-rays. Vyana extracts and summarises them so you never explain your history again.",
  },
  {
    target: '[data-tour="nav-claims"]',
    path: "/app",
    eyebrow: "Recovery & Claims",
    title: "Recover faster, file claims easier.",
    body: "Get post-discharge guidance and a step-by-step assistant to file insurance claims from your discharge papers.",
  },
  {
    target: '[data-tour="nav-profile"]',
    path: "/app",
    eyebrow: "Profile",
    title: "Your identity and settings.",
    body: "Manage your ABHA Health ID, emergency contacts, language and family access. You can replay this tour any time from the help icon.",
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
const TARGET_WAIT_MS = 1500;

const SpotlightTour = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const navigatedForStepRef = useRef<number>(-1);

  const step = STEPS[stepIdx];

  useEffect(() => {
    if (!open) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;
    const previousOverscroll = document.body.style.overscrollBehavior;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setRect(null);
      setTargetMissing(false);
      navigatedForStepRef.current = -1;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!step.path) return;
    if (navigatedForStepRef.current === stepIdx) return;
    navigatedForStepRef.current = stepIdx;
    if (location.pathname !== step.path) {
      navigate(step.path);
    }
  }, [open, stepIdx, step.path, location.pathname, navigate]);

  useEffect(() => {
    if (!open) return;
    setTargetMissing(false);
    setRect(null);

    if (!step.target) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = Math.ceil(TARGET_WAIT_MS / 100);
    let pollTimer: number | undefined;
    let settleTimer: number | undefined;
    let raf = 0;

    const commit = (el: HTMLElement) => {
      if (cancelled) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        setTargetMissing(true);
        return;
      }
      setRect({
        top: Math.max(8, r.top - PADDING),
        left: Math.max(8, r.left - PADDING),
        width: r.width + PADDING * 2,
        height: r.height + PADDING * 2,
      });
    };

    const tryFind = () => {
      if (cancelled) return;
      const el = document.querySelector(step.target as string) as HTMLElement | null;

      if (!el) {
        attempts += 1;
        if (attempts >= maxAttempts) {
          setTargetMissing(true);
          return;
        }
        pollTimer = window.setTimeout(tryFind, 100);
        return;
      }

      try {
        el.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
      } catch {
      }

      settleTimer = window.setTimeout(() => {
        if (cancelled) return;
        raf = requestAnimationFrame(() => commit(el));
      }, 220);
    };

    pollTimer = window.setTimeout(tryFind, 120);

    const onResize = () => {
      const el = document.querySelector(step.target as string) as HTMLElement | null;
      if (el) commit(el);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      if (pollTimer) window.clearTimeout(pollTimer);
      if (settleTimer) window.clearTimeout(settleTimer);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
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

  const getCardStyle = (): React.CSSProperties => {
    const isMobile = window.innerWidth < 1024;
    const cardWidth = Math.min(360, window.innerWidth - 24);
    const safeBottom = isMobile ? 76 : 24;
    const safeTop = isMobile ? 56 : 24;

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

    const bottomEdge = rect.top - 12;
    return {
      top: Math.max(safeTop, bottomEdge - 280),
      left,
      width: cardWidth,
      maxHeight: bottomEdge - safeTop,
    };
  };

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in overscroll-none">
      <div className="absolute inset-0 bg-foreground/72" onClick={handleSkip} aria-hidden="true" />

      <svg className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true">
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
        <rect width="100%" height="100%" fill="hsl(var(--foreground) / 0.72)" mask="url(#spotlight-mask)" />
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
          />
        )}
      </svg>

      <div
        className="absolute rounded-2xl bg-background border border-border shadow-2xl p-4 sm:p-5 overflow-y-auto"
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
          <p className="mt-2 text-[11px] italic text-muted-foreground/80">
            This control is off-screen for this layout. Continue to the next step.
          </p>
        )}

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

import { Button } from "@/components/ui/button";
import { StatefulButton, ButtonState } from "@/components/ui/stateful-button";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import WatchItWorkModal from "@/components/WatchItWorkModal";
import { useLandingT } from "@/lib/i18n-landing";
import heroConstellation from "@/assets/hero-constellation.png";

/**
 * Editorial Kinetic Hero
 * - Drifting warm aurora background (no photo) — cohesive with Problem/Wedge/CTA.
 * - Word-by-word reveal: eyebrow → headline → subtext → CTAs, staggered ~1.2s.
 * - Respects prefers-reduced-motion via CSS (.kw rules in index.css).
 */
const EditorialHero = () => {
  const navigate = useNavigate();
  const [demoOpen, setDemoOpen] = useState(false);
  const [ctaState, setCtaState] = useState<ButtonState>("idle");
  const [staged, setStaged] = useState(false);
  const t = useLandingT();

  // Trigger reveal one frame after mount so the CSS animation runs cleanly
  useEffect(() => {
    const id = requestAnimationFrame(() => setStaged(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleEarlyAccess = () => {
    if (ctaState !== "idle") return;
    setCtaState("loading");
    setTimeout(() => {
      setCtaState("success");
      setTimeout(() => navigate("/request-access"), 450);
    }, 350);
  };

  // Word-stagger helpers
  const eyebrow = t("hero.eyebrow");
  const lineA = t("hero.h1.l1"); // e.g. "Never explain"
  const lineB = t("hero.h1.l2"); // e.g. "your medical history"
  const again = t("hero.h1.again"); // e.g. "again."
  const sub = t("hero.sub");

  // Stagger schedule (ms)
  const EYEBROW_START = 120;
  const HEADLINE_START = 360;
  const HEADLINE_STEP = 90;
  const SUB_DELAY_AFTER_HEADLINE = 180;
  const CTA_DELAY_AFTER_SUB = 220;

  const splitWords = (s: string) => s.split(/\s+/).filter(Boolean);
  const wordsA = splitWords(lineA);
  const wordsB = splitWords(lineB);
  const wordsAgain = splitWords(again);
  const totalHeadlineWords = wordsA.length + wordsB.length + wordsAgain.length;

  const subStart =
    HEADLINE_START + totalHeadlineWords * HEADLINE_STEP + SUB_DELAY_AFTER_HEADLINE;
  const ctaStart = subStart + 320 + CTA_DELAY_AFTER_SUB;

  // Renders a series of kinetic word spans with a shared base delay.
  const renderWords = (
    words: string[],
    baseDelay: number,
    step: number,
    options?: { italic?: boolean; accent?: boolean }
  ) =>
    words.map((w, i) => (
      <span
        key={`${baseDelay}-${i}-${w}`}
        className={`kw ${options?.italic ? "italic font-normal" : ""} ${options?.accent ? "text-primary" : ""}`}
        style={{ ["--d" as string]: `${baseDelay + i * step}ms` }}
      >
        {w}
        {i < words.length - 1 ? "\u00A0" : ""}
      </span>
    ));

  return (
    <section
      id="hero"
      className="aurora-warm aurora-warm-drift relative min-h-[100svh] w-full overflow-hidden bg-background"
    >
      {/* Subtle vignette to anchor type, keeps aurora airy */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />

      {/* Constellation visual — bleeds off the right edge, sits behind/beside type.
          Fades in last (after CTA) and breathes with a slow float. No dark overlay. */}
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 z-[5] flex items-center justify-end ${staged ? "hero-constellation-in" : "opacity-0"}`}
        aria-hidden
      >
        <img
          src={heroConstellation}
          alt=""
          width={1280}
          height={1280}
          className="hero-constellation-img w-[62vw] max-w-[560px] sm:w-[55vw] sm:max-w-[680px] lg:w-[58vw] lg:max-w-[980px] mr-0 lg:-mr-[4vw] opacity-55 sm:opacity-65 lg:opacity-80 select-none"
          draggable={false}
        />
      </div>

      <div className="relative z-10 min-h-[100svh] flex items-center">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-12 w-full pt-28 pb-20">
          <div className={`max-w-[860px] space-y-8 ${staged ? "kw-stage" : ""}`}>
            {/* Eyebrow */}
            <p className="font-serif italic text-[15px] text-foreground/65">
              <span className="kw" style={{ ["--d" as string]: `${EYEBROW_START}ms` }}>
                {eyebrow}
              </span>
            </p>

            {/* Kinetic headline */}
            <h1 className="font-serif text-[44px] sm:text-[64px] lg:text-[88px] leading-[0.98] tracking-[-0.02em] text-foreground">
              <span className="block">
                {renderWords(wordsA, HEADLINE_START, HEADLINE_STEP)}
              </span>
              <span className="block">
                {renderWords(
                  wordsB,
                  HEADLINE_START + wordsA.length * HEADLINE_STEP,
                  HEADLINE_STEP
                )}{" "}
                {renderWords(
                  wordsAgain,
                  HEADLINE_START + (wordsA.length + wordsB.length) * HEADLINE_STEP,
                  HEADLINE_STEP,
                  { italic: true, accent: true }
                )}
              </span>
            </h1>

            {/* Subtext — single fade as one block (faster than per-word for long copy) */}
            <p
              className="text-body text-foreground/85 max-w-[580px] kw"
              style={{ ["--d" as string]: `${subStart}ms` }}
            >
              {sub}
            </p>

            {/* CTAs */}
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 kw"
              style={{ ["--d" as string]: `${ctaStart}ms` }}
            >
              <StatefulButton
                state={ctaState}
                onClick={handleEarlyAccess}
                variant="premium"
                loadingLabel="Just a moment…"
                successLabel="Let's begin"
                className="h-11 px-6 text-[15px] rounded-full min-w-[180px]"
                idleIcon={<ArrowRight className="h-4 w-4" />}
              >
                Get early access
              </StatefulButton>
              <Button
                variant="ghost"
                onClick={() => setDemoOpen(true)}
                className="group text-[15px] text-foreground/70 hover:text-foreground h-11"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                {t("hero.cta.secondary")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Soft scroll hint at bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex justify-center kw"
        style={{ ["--d" as string]: `${ctaStart + 240}ms` }}
        aria-hidden
      >
        <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-foreground/30 to-transparent" />
      </div>

      <WatchItWorkModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
};

export default EditorialHero;

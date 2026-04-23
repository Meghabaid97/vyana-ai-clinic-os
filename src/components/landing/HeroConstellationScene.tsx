import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatefulButton, ButtonState } from "@/components/ui/stateful-button";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReveal } from "@/hooks/use-reveal";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { useLandingT } from "@/lib/i18n-landing";
import WatchItWorkModal from "@/components/WatchItWorkModal";
import heroConstellation from "@/assets/hero-constellation.png";

/**
 * HeroConstellationScene
 *
 * Desktop-only unified scene that owns BOTH the hero copy and the Constellation
 * section. The constellation graphic lives in a sticky right column and stays
 * pinned in the viewport while the left column scrolls from hero copy → section
 * intro → 5 floating cards. Effect: the constellation feels like a single
 * character that the camera moves around, not two separate images on two pages.
 *
 * Mobile keeps the existing EditorialHero + (optional) Constellation stacked layout.
 */

const SPARKLES: Array<{
  top: string;
  left: string;
  size: string;
  delay: string;
  dur: string;
  tone?: "sage" | "amber";
}> = [
  { top: "32%", left: "58%", size: "5px", delay: "0s",   dur: "2.8s" },
  { top: "28%", left: "72%", size: "4px", delay: "0.6s", dur: "3.4s", tone: "amber" },
  { top: "44%", left: "63%", size: "6px", delay: "1.1s", dur: "3.0s", tone: "sage" },
  { top: "52%", left: "80%", size: "4px", delay: "0.3s", dur: "2.6s" },
  { top: "38%", left: "88%", size: "5px", delay: "1.6s", dur: "3.6s", tone: "amber" },
  { top: "60%", left: "70%", size: "3px", delay: "0.9s", dur: "2.4s", tone: "sage" },
  { top: "48%", left: "92%", size: "4px", delay: "2.0s", dur: "3.2s" },
  { top: "66%", left: "84%", size: "5px", delay: "0.4s", dur: "2.9s", tone: "amber" },
  { top: "36%", left: "78%", size: "3px", delay: "1.4s", dur: "2.5s", tone: "sage" },
  { top: "56%", left: "60%", size: "4px", delay: "1.8s", dur: "3.1s" },
  { top: "70%", left: "75%", size: "3px", delay: "0.2s", dur: "2.7s", tone: "amber" },
  { top: "42%", left: "55%", size: "3px", delay: "2.2s", dur: "3.3s", tone: "sage" },
];

type CardKind = "powered" | "experience" | "outcome";

interface ConstellationCard {
  eyebrow: string;
  title: string;
  body: string;
  kind: CardKind;
}

const CARDS: ConstellationCard[] = [
  {
    kind: "powered",
    eyebrow: "Powered by",
    title: "Vision AI extraction",
    body: "Snap any prescription, lab report or discharge summary. We pull vitals, meds and diagnoses, handwritten or printed, in five Indian languages.",
  },
  {
    kind: "experience",
    eyebrow: "Experience",
    title: "A quiet health story",
    body: "Years of scattered paper become one calm, longitudinal record your family can actually read.",
  },
  {
    kind: "outcome",
    eyebrow: "Outcome",
    title: "Doctors trust the briefing",
    body: "A one-page clinical summary any physician can read in thirty seconds. Shareable on WhatsApp before the appointment.",
  },
  {
    kind: "powered",
    eyebrow: "Powered by",
    title: "33 vitals tracked",
    body: "HbA1c. BP. eGFR. The slow-moving signals doctors rarely get to see in a fifteen-minute consult, surfaced before they become irreversible.",
  },
  {
    kind: "experience",
    eyebrow: "Experience",
    title: "Risk flags that listen",
    body: "ASCVD, ADA diabetes staging, KDIGO kidney scores. Computed from your real numbers, never speculation.",
  },
];

const KIND_STYLES: Record<CardKind, { dot: string; label: string }> = {
  powered:    { dot: "hsl(var(--status-normal))", label: "text-[hsl(var(--status-normal))]" },
  experience: { dot: "hsl(var(--primary))",       label: "text-primary" },
  outcome:    { dot: "hsl(var(--accent))",        label: "text-[hsl(var(--accent))]" },
};

const HeroConstellationScene = () => {
  const navigate = useNavigate();
  const t = useLandingT();
  const [demoOpen, setDemoOpen] = useState(false);
  const [ctaState, setCtaState] = useState<ButtonState>("idle");
  const [staged, setStaged] = useState(false);
  const sectionHeader = useReveal<HTMLDivElement>();
  const { ref: sceneRef, progress } = useScrollProgress<HTMLDivElement>();

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

  // Map scroll progress (0→1 across the whole scene) to constellation behavior:
  //   0   – 0.18  : hero pose, modest scale
  //   0.18 – 0.55 : grow + drift toward section center as hero copy leaves
  //   0.55 – 0.90 : settled "section" pose, full presence
  //   0.90 – 1.0  : gentle exit
  const scale =
    progress < 0.18
      ? 1
      : progress < 0.55
        ? 1 + ((progress - 0.18) / (0.55 - 0.18)) * 0.18 // up to 1.18
        : progress < 0.9
          ? 1.18
          : 1.18 - ((progress - 0.9) / 0.1) * 0.06;

  const opacity =
    progress < 0.05
      ? 0.0 + (progress / 0.05) * 0.9
      : progress < 0.92
        ? 0.92
        : Math.max(0.55, 0.92 - (progress - 0.92) * 4);

  // Soft glow-up cadence for the hero copy (matches EditorialHero).
  const D_EYEBROW = 200;
  const D_HEADLINE = 380;
  const D_SUB = 720;
  const D_CTA = 920;

  return (
    <section
      ref={sceneRef}
      id="hero"
      aria-label="Vyana hero and constellation"
      className={`aurora-warm aurora-warm-drift ${staged ? "hero-glow-stage" : ""} relative w-full overflow-hidden bg-background`}
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-background/35" />

      {/* Desktop: unified sticky scene */}
      <div className="relative z-10 hidden lg:grid lg:grid-cols-[minmax(0,640px)_minmax(360px,1fr)] lg:gap-8 max-w-[1240px] mx-auto px-6 lg:px-12">
        {/* Left: scrolling copy track (hero → section header → cards) */}
        <div className="relative">
          {/* Hero copy — centered in first viewport */}
          <div className="min-h-[100svh] flex items-center pt-28 pb-20">
            <div className="space-y-8 max-w-[640px]">
              <p
                className="hero-soft font-serif italic text-[15px] text-foreground/65"
                style={{ ["--d" as string]: `${D_EYEBROW}ms` }}
              >
                {t("hero.eyebrow")}
              </p>
              <h1
                className="hero-soft font-serif text-[64px] xl:text-[80px] leading-[0.98] tracking-[-0.02em] text-foreground"
                style={{ ["--d" as string]: `${D_HEADLINE}ms` }}
              >
                <span className="block">{t("hero.h1.l1")}</span>
                <span className="block">
                  {t("hero.h1.l2")}{" "}
                  <em className="italic font-normal text-primary">{t("hero.h1.again")}</em>
                </span>
              </h1>
              <p
                className="hero-soft text-body text-foreground/85 max-w-[560px]"
                style={{ ["--d" as string]: `${D_SUB}ms` }}
              >
                {t("hero.sub")}
              </p>
              <div
                className="hero-soft flex flex-wrap items-center gap-x-3 gap-y-2 pt-2"
                style={{ ["--d" as string]: `${D_CTA}ms` }}
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

          {/* Constellation section — header */}
          <div
            ref={sectionHeader.ref}
            className={`reveal ${sectionHeader.visible ? "is-visible" : ""} pt-24 pb-10 max-w-[560px]`}
          >
            <p className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium mb-5">
              V &nbsp;·&nbsp; What's inside
            </p>
            <h2 className="font-serif text-5xl xl:text-[64px] leading-[1.0] tracking-[-0.02em] text-foreground">
              Five quiet systems,
              <br />
              <em className="italic text-primary font-normal">one connected story.</em>
            </h2>
            <p className="mt-6 font-serif italic text-[18px] text-foreground/70 leading-relaxed max-w-[460px]">
              Each piece of Vyana feeds the next. Watch how scattered paper
              becomes a doctor-ready record.
            </p>
          </div>

          {/* The 5 cards — stack vertically, scroll past the pinned constellation */}
          <div className="space-y-10 pb-32">
            {CARDS.map((c, i) => {
              const k = KIND_STYLES[c.kind];
              return (
                <CardReveal key={i} index={i}>
                  <article
                    className="rounded-2xl px-6 py-6 border border-border/40 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow max-w-[460px]"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: k.dot, boxShadow: `0 0 10px ${k.dot}` }}
                      />
                      <p className={`text-[10px] tracking-[0.25em] uppercase font-semibold ${k.label}`}>
                        {c.eyebrow}
                      </p>
                    </div>
                    <h3 className="font-serif text-[22px] text-foreground leading-tight mb-2">
                      {c.title}
                    </h3>
                    <p className="text-[14px] text-foreground/70 leading-[1.6]">
                      {c.body}
                    </p>
                  </article>
                </CardReveal>
              );
            })}
          </div>
        </div>

        {/* Right: sticky constellation — vertically pinned across the whole scene */}
        <div
          className="relative pointer-events-none"
          aria-hidden
        >
          <div className="sticky top-1/2 -translate-y-1/2 flex items-center justify-center">
            <div
              className={`relative ${staged ? "hero-constellation-in" : "opacity-0"}`}
              style={{
                transform: `scale(${scale.toFixed(3)})`,
                opacity,
                transition: "transform 280ms cubic-bezier(0.2, 0.7, 0.2, 1)",
              }}
            >
              <img
                src={heroConstellation}
                alt=""
                width={1280}
                height={1280}
                draggable={false}
                className="hero-constellation-img w-[46vw] max-w-[680px] mix-blend-multiply select-none opacity-90"
              />
              {SPARKLES.map((s, i) => (
                <span
                  key={i}
                  className={`hero-sparkle ${s.tone ?? ""}`}
                  style={{
                    top: s.top,
                    left: s.left,
                    width: s.size,
                    height: s.size,
                    ["--delay" as string]: s.delay,
                    ["--dur" as string]: s.dur,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: classic stacked hero, then stacked cards (no sticky) */}
      <div className="lg:hidden relative z-10 max-w-[1240px] mx-auto px-6">
        <div className="min-h-[100svh] flex items-center pt-28 pb-12">
          <div className="space-y-7">
            <p
              className="hero-soft font-serif italic text-[15px] text-foreground/65"
              style={{ ["--d" as string]: `${D_EYEBROW}ms` }}
            >
              {t("hero.eyebrow")}
            </p>
            <h1
              className="hero-soft font-serif text-[44px] sm:text-[60px] leading-[0.98] tracking-[-0.02em] text-foreground"
              style={{ ["--d" as string]: `${D_HEADLINE}ms` }}
            >
              <span className="block">{t("hero.h1.l1")}</span>
              <span className="block">
                {t("hero.h1.l2")}{" "}
                <em className="italic font-normal text-primary">{t("hero.h1.again")}</em>
              </span>
            </h1>
            <p
              className="hero-soft text-body text-foreground/85"
              style={{ ["--d" as string]: `${D_SUB}ms` }}
            >
              {t("hero.sub")}
            </p>

            {/* Mobile constellation — small inline */}
            <div className={`relative ${staged ? "hero-constellation-in" : "opacity-0"} flex justify-center pt-4`}>
              <div className="relative">
                <img
                  src={heroConstellation}
                  alt=""
                  width={1280}
                  height={1280}
                  draggable={false}
                  className="hero-constellation-img w-[88vw] max-w-[420px] mix-blend-multiply select-none opacity-80"
                />
                {SPARKLES.slice(0, 8).map((s, i) => (
                  <span
                    key={i}
                    className={`hero-sparkle ${s.tone ?? ""}`}
                    style={{
                      top: s.top,
                      left: s.left,
                      width: s.size,
                      height: s.size,
                      ["--delay" as string]: s.delay,
                      ["--dur" as string]: s.dur,
                    }}
                  />
                ))}
              </div>
            </div>

            <div
              className="hero-soft flex flex-wrap items-center gap-x-3 gap-y-2 pt-2"
              style={{ ["--d" as string]: `${D_CTA}ms` }}
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

        {/* Mobile: section header + stacked cards */}
        <div className="pt-12 pb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium mb-4">
            V &nbsp;·&nbsp; What's inside
          </p>
          <h2 className="font-serif text-4xl leading-[1.0] tracking-[-0.02em] text-foreground mb-4">
            Five quiet systems,
            <br />
            <em className="italic text-primary font-normal">one connected story.</em>
          </h2>
          <p className="font-serif italic text-[16px] text-foreground/70 leading-relaxed mb-8">
            Each piece of Vyana feeds the next.
          </p>

          <div className="space-y-4">
            {CARDS.map((c, i) => {
              const k = KIND_STYLES[c.kind];
              return (
                <article
                  key={i}
                  className="rounded-xl px-5 py-5 border border-border/40 bg-card/80"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: k.dot }}
                    />
                    <p className={`text-[10px] tracking-[0.25em] uppercase font-semibold ${k.label}`}>
                      {c.eyebrow}
                    </p>
                  </div>
                  <h3 className="font-serif text-[19px] text-foreground leading-tight mb-2">
                    {c.title}
                  </h3>
                  <p className="text-[13.5px] text-foreground/70 leading-[1.6]">
                    {c.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <WatchItWorkModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
};

/** Per-card reveal — fades + rises into view as it scrolls past the pinned constellation. */
const CardReveal = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const { ref, visible } = useReveal<HTMLDivElement>({
    threshold: 0.2,
    rootMargin: "0px 0px -15% 0px",
  });
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""}`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      {children}
    </div>
  );
};

export default HeroConstellationScene;

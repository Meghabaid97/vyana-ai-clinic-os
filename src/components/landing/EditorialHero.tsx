import { Button } from "@/components/ui/button";
import { StatefulButton, ButtonState } from "@/components/ui/stateful-button";
import { ArrowRight, Play } from "lucide-react";
import { useViewTransitionNavigate } from "@/hooks/use-view-transition-navigate";
import { useEffect, useState } from "react";
import WatchItWorkModal from "@/components/WatchItWorkModal";
import { useLandingT } from "@/lib/i18n-landing";
import heroConstellation from "@/assets/hero-constellation.png";

// Sparkle positions — clustered over the right ~55-95% of the constellation image,
// where the dot cluster visually sits. Mix of coral/sage/amber, varied sizes & timings.
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

const EditorialHero = () => {
  const navigate = useViewTransitionNavigate();
  const [demoOpen, setDemoOpen] = useState(false);
  const [ctaState, setCtaState] = useState<ButtonState>("idle");
  const [staged, setStaged] = useState(false);
  const t = useLandingT();

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

  const eyebrow = t("hero.eyebrow");
  const lineA = t("hero.h1.l1");
  const lineB = t("hero.h1.l2");
  const again = t("hero.h1.again");
  const sub = t("hero.sub");

  // Soft glow-up cadence — each element rises a beat after the previous,
  // all riding the same blur-to-focus easing. No word-by-word stagger.
  const D_EYEBROW = 200;
  const D_HEADLINE = 380;
  const D_SUB = 720;
  const D_CTA = 920;
  const D_SCROLL_HINT = 1200;

  return (
    <section
      id="hero"
      className={`aurora-warm aurora-warm-drift ${staged ? "hero-glow-stage" : ""} relative lg:min-h-[100svh] w-full overflow-hidden bg-background`}
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-background/35" />

      <div className="relative z-10 lg:min-h-[100svh] flex items-center">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-12 w-full pt-20 pb-10 lg:pt-28 lg:pb-20">
          <div className="lg:grid lg:grid-cols-[minmax(0,700px)_minmax(320px,1fr)] lg:items-center lg:gap-2">
            <div className="relative z-10 max-w-[860px] space-y-5 lg:space-y-8">
              <p
                className="hero-soft font-serif italic text-[14px] lg:text-[15px] text-foreground/65"
                style={{ ["--d" as string]: `${D_EYEBROW}ms` }}
              >
                {eyebrow}
              </p>

              <h1
                className="hero-soft font-serif text-[40px] sm:text-[64px] lg:text-[88px] leading-[1.02] lg:leading-[0.98] tracking-[-0.02em] text-foreground"
                style={{ ["--d" as string]: `${D_HEADLINE}ms` }}
              >
                <span className="block">{lineA}</span>
                <span className="block">
                  {lineB}{" "}
                  <em className="italic font-normal text-primary">{again}</em>
                </span>
              </h1>

              <p
                className="hero-soft text-[15px] lg:text-body leading-[1.55] text-foreground/85 max-w-[580px]"
                style={{ ["--d" as string]: `${D_SUB}ms` }}
              >
                {sub}
              </p>

              <div
                className="hero-soft flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 lg:pt-2"
                style={{ ["--d" as string]: `${D_CTA}ms` }}
              >
                <StatefulButton
                  state={ctaState}
                  onClick={handleEarlyAccess}
                  variant="premium"
                  loadingLabel="Just a moment…"
                  successLabel="Let's begin"
                  className="vt-cta-pill h-11 px-6 text-[15px] rounded-full min-w-[180px]"
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

            {/* Desktop only: constellation as right column */}
            <div
              className={`pointer-events-none relative hidden lg:flex justify-start lg:-ml-24 ${staged ? "hero-constellation-in" : "opacity-0"}`}
              aria-hidden
            >
              <div className="relative">
                <img
                  src={heroConstellation}
                  alt=""
                  width={1280}
                  height={1280}
                  loading="eager"
                  decoding="async"
                  // @ts-expect-error fetchpriority is a valid HTML attribute
                  fetchpriority="high"
                  draggable={false}
                  className="hero-constellation-img w-[46vw] max-w-[760px] opacity-90 mix-blend-multiply select-none"
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
      </div>

      <div
        className="hero-soft pointer-events-none absolute inset-x-0 bottom-8 z-10 hidden lg:flex justify-center"
        style={{ ["--d" as string]: `${D_SCROLL_HINT}ms` }}
        aria-hidden
      >
        <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-foreground/30 to-transparent" />
      </div>

      <WatchItWorkModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
};

export default EditorialHero;

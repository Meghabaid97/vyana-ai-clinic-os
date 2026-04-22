import { useReveal } from "@/hooks/use-reveal";
import { PhoneMock, MockStoryScreen, MockTrendsScreen, MockBriefingScreen } from "./PhoneMock";
import { useLandingT } from "@/lib/i18n-landing";

type Step = {
  n: string;
  title: string;
  body: string;
  mock: JSX.Element;
  rotate: number;
};

const StepChapter = ({ s, index, stepLabel }: { s: Step; index: number; stepLabel: string }) => {
  const text = useReveal<HTMLDivElement>();
  const phone = useReveal<HTMLDivElement>();
  const reverse = index % 2 === 1;

  return (
    <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center py-20 lg:py-24">
      <div
        ref={text.ref}
        className={`reveal ${text.visible ? "is-visible" : ""} lg:col-span-7 ${
          reverse ? "lg:col-start-6 lg:row-start-1" : ""
        }`}
      >
        <div className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium mb-5">
          {stepLabel} {s.n}
        </div>
        <h3 className="font-serif text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.02] tracking-[-0.02em] text-surface-dark-foreground">
          {s.title}
        </h3>
        <p className="mt-6 text-[17px] leading-[1.65] text-surface-dark-muted max-w-[520px]">
          {s.body}
        </p>
      </div>

      <div
        ref={phone.ref}
        className={`reveal reveal-delay-2 ${phone.visible ? "is-visible" : ""} lg:col-span-5 ${
          reverse ? "lg:col-start-1 lg:row-start-1" : ""
        } flex justify-center`}
      >
        <PhoneMock rotate={s.rotate}>{s.mock}</PhoneMock>
      </div>
    </div>
  );
};

const HowItWorks = () => {
  const t = useLandingT();
  const header = useReveal<HTMLDivElement>();

  const steps: Step[] = [
    { n: "01", title: t("how.s1.title"), body: t("how.s1.body"), mock: <MockStoryScreen />, rotate: -3 },
    { n: "02", title: t("how.s2.title"), body: t("how.s2.body"), mock: <MockTrendsScreen />, rotate: 2 },
    { n: "03", title: t("how.s3.title"), body: t("how.s3.body"), mock: <MockBriefingScreen />, rotate: -2 },
  ];

  return (
    <section id="how" className="relative bg-surface-dark py-28 lg:py-36">
      <div className="relative z-10 max-w-[1240px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-8`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            {t("how.eyebrow")}
          </p>
          <h2 className="font-serif text-4xl sm:text-6xl lg:text-[72px] leading-[1.02] tracking-[-0.02em] text-surface-dark-foreground">
            {t("how.title.l1")}
            <br />
            <em className="italic text-primary font-normal">{t("how.title.l2")}</em>
          </h2>
        </div>

        <div className="divide-y divide-white/10">
          {steps.map((s, i) => (
            <StepChapter key={s.n} s={s} index={i} stepLabel={t("how.step")} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

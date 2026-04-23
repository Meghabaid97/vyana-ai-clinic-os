import { useReveal } from "@/hooks/use-reveal";
import {
  AnimatedUploadDemo,
  AnimatedExtractDemo,
  AnimatedShareDemo,
} from "./AnimatedPhoneDemos";
import { useLandingT } from "@/lib/i18n-landing";

type Step = {
  n: string;
  title: string;
  body: string;
  mock: JSX.Element;
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
        <div className="text-label text-primary mb-5">
          {stepLabel} {s.n}
        </div>
        <h3 className="text-section text-surface-dark-foreground">
          {s.title}
        </h3>
        <p className="mt-6 text-body text-surface-dark-muted max-w-[520px]">
          {s.body}
        </p>
      </div>

      <div
        ref={phone.ref}
        className={`reveal reveal-delay-2 ${phone.visible ? "is-visible" : ""} lg:col-span-5 ${
          reverse ? "lg:col-start-1 lg:row-start-1" : ""
        } flex justify-center`}
      >
        {s.mock}
      </div>
    </div>
  );
};

const HowItWorks = () => {
  const t = useLandingT();
  const header = useReveal<HTMLDivElement>();

  const steps: Step[] = [
    { n: "01", title: t("how.s1.title"), body: t("how.s1.body"), mock: <AnimatedUploadDemo /> },
    { n: "02", title: t("how.s2.title"), body: t("how.s2.body"), mock: <AnimatedExtractDemo /> },
    { n: "03", title: t("how.s3.title"), body: t("how.s3.body"), mock: <AnimatedShareDemo /> },
  ];

  return (
    <section id="how" className="section-blend-bottom relative py-28 lg:py-36">
      <div className="relative z-10 max-w-[1240px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-8`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            {t("how.eyebrow")}
          </p>
          <h2 className="text-section text-surface-dark-foreground">
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

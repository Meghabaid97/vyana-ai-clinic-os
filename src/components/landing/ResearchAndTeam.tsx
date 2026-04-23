import { Mail, Linkedin } from "lucide-react";
import whartonLogo from "@/assets/wharton-logo.png";
import { useReveal } from "@/hooks/use-reveal";
import { useLandingT } from "@/lib/i18n-landing";

const ResearchAndTeam = () => {
  const t = useLandingT();
  const header = useReveal<HTMLDivElement>();
  const left = useReveal<HTMLDivElement>();
  const right = useReveal<HTMLDivElement>();

  const citations = [
    { title: t("research.c1.title"), cite: t("research.c1.cite"), line: t("research.c1.line") },
    { title: t("research.c2.title"), cite: t("research.c2.cite"), line: t("research.c2.line") },
    { title: t("research.c3.title"), cite: t("research.c3.cite"), line: t("research.c3.line") },
    { title: t("research.c4.title"), cite: t("research.c4.cite"), line: t("research.c4.line") },
  ];

  return (
    <section id="research" className="aurora-warm relative bg-surface-dark py-28 lg:py-36">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-16`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            {t("research.eyebrow")}
          </p>
          <h2 className="text-section text-surface-dark-foreground">
            {t("research.title.l1")}
            <br />
            <em className="italic text-primary font-normal">{t("research.title.l2")}</em>
          </h2>
          <p className="mt-6 text-body text-surface-dark-muted max-w-[560px]">
            {t("research.sub")}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
          <div
            ref={left.ref}
            className={`reveal ${left.visible ? "is-visible" : ""} space-y-5`}
          >
            {citations.map((c, i) => (
              <article
                key={i}
                className={`reveal reveal-delay-${i + 1} ${left.visible ? "is-visible" : ""} rounded-2xl glass-card-dark p-7`}
              >
                <h3 className="font-serif text-card-title text-surface-dark-foreground mb-2">
                  {c.title}
                </h3>
                <p className="font-serif italic text-caption text-surface-dark-muted/80 mb-4">
                  {c.cite}
                </p>
                <p className="text-caption text-surface-dark-foreground/85 leading-[1.65]">
                  {c.line}
                </p>
              </article>
            ))}
          </div>

          <div
            ref={right.ref}
            className={`reveal ${right.visible ? "is-visible" : ""} space-y-5`}
          >
            <div className="rounded-2xl glass-card-dark p-7">
              <p className="text-label text-surface-dark-muted/80 mb-5">
                {t("research.builtBy")}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 rounded-lg bg-white flex items-center justify-center px-2 py-1">
                  <img
                    src={whartonLogo}
                    alt="Wharton School, University of Pennsylvania"
                    className="max-h-[88px] w-auto object-contain scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="h-24 rounded-lg bg-white flex items-center justify-center text-center px-4">
                  <div>
                    <div className="font-serif text-[15px] text-foreground leading-tight">
                      {t("research.advisors")}
                    </div>
                    <div className="text-[9px] tracking-[0.25em] uppercase text-foreground/55 mt-1.5">
                      {t("research.advisors.sub")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <article className="rounded-2xl glass-card-dark p-7">
              <h4 className="font-serif text-card-title text-surface-dark-foreground mb-1">
                Megha Baid
              </h4>
              <p className="text-caption text-primary font-medium mb-4">
                {t("research.megha.role")}
              </p>
              <div className="space-y-3 text-caption text-surface-dark-muted leading-[1.7]">
                {t("research.megha.bio").split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3">
                <a
                  href="mailto:vyana.care@gmail.com"
                  aria-label="Email Megha Baid"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-surface-dark-foreground/20 text-surface-dark-foreground/80 transition-colors hover:border-primary hover:text-primary"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="https://www.linkedin.com/in/megha-baid-wharton/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Megha Baid on LinkedIn"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-surface-dark-foreground/20 text-surface-dark-foreground/80 transition-colors hover:border-primary hover:text-primary"
                >
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </article>

            <article className="rounded-2xl glass-card-dark p-7">
              <h4 className="font-serif text-card-title text-surface-dark-foreground mb-1">
                {t("research.cab.title")}
              </h4>
              <p className="text-caption text-primary font-medium mb-4">
                {t("research.cab.tag")}
              </p>
              <div className="space-y-3 text-caption text-surface-dark-muted leading-[1.7]">
                {t("research.cab.body").split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResearchAndTeam;

import { useLandingT } from "@/lib/i18n-landing";

const TeamSection = () => {
  const t = useLandingT();

  return (
    <section id="team" className="py-24 lg:py-32 bg-muted/40 border-y border-border">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
        <div className="max-w-[640px] mb-14">
          <p className="text-[11px] tracking-[0.25em] uppercase text-primary font-medium mb-4">
            V &nbsp;·&nbsp; {t("team.eyebrow")}
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl leading-[1.05] tracking-[-0.02em] text-foreground">
            {t("team.title.l1")}
            <br />
            <em className="italic text-primary font-normal">{t("team.title.l2")}</em>
          </h2>
        </div>

        <div className="grid md:grid-cols-12 gap-10 mb-16">
          <div className="md:col-span-4">
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
              {t("team.founderTag")}
            </p>
            <h3 className="font-serif text-2xl text-foreground mb-2">{t("team.founderName")}</h3>
            <p className="text-[13px] text-muted-foreground italic">
              {t("team.founderSub")}
            </p>
          </div>
          <div className="md:col-span-8 max-w-[640px] space-y-4 text-[15px] leading-[1.8] text-muted-foreground">
            <p>{t("team.bio.p1")}</p>
            <p>{t("team.bio.p2")}</p>
          </div>
        </div>

        <div className="border-t border-border pt-10">
          <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-6">
            {t("team.affiliated")}
          </p>
          <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
            <span className="font-serif text-xl text-foreground/70">{t("team.aff1")}</span>
            <span className="text-border">·</span>
            <span className="font-serif text-xl text-foreground/70 italic">{t("team.aff2")}</span>
            <span className="text-border">·</span>
            <span className="font-serif text-xl text-foreground/70">{t("team.aff3")}</span>
          </div>
          <p className="mt-6 text-[13px] text-muted-foreground italic max-w-[600px]">
            {t("team.advisorNote")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLandingT } from "@/lib/i18n-landing";
import { useViewTransitionNavigate } from "@/hooks/use-view-transition-navigate";

const PortraitCTA = () => {
  const t = useLandingT();
  const navigate = useViewTransitionNavigate();
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [relation, setRelation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Welcome to Vyana. Let's get started.");
    setEmail("");
    setCity("");
    setRelation("");
    setSubmitting(false);
  };

  return (
    <section
      id="contact"
      className="aurora-warm-soft relative bg-background py-28 lg:py-36"
    >
      <div className="relative z-10 max-w-[640px] mx-auto px-6 text-center">
        <h2 className="text-section text-foreground">
          {t("cta.title.l1")}
          <br />
          <em className="italic text-primary font-normal">{t("cta.title.l2")}</em>
        </h2>
        <p className="mt-6 text-body text-foreground/70 max-w-[480px] mx-auto">
          {t("cta.sub")}
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-3 text-left max-w-[480px] mx-auto">
          <Input
            type="email"
            required
            placeholder={t("cta.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-card border-border focus-visible:ring-primary"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="text"
              placeholder={t("cta.relation")}
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="h-12 bg-card border-border focus-visible:ring-primary"
            />
            <Input
              type="text"
              placeholder={t("cta.city")}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-12 bg-card border-border focus-visible:ring-primary"
            />
          </div>
          <Button
            type="button"
            variant="premium"
            disabled={submitting}
            onClick={() => navigate("/auth?signup=1")}
            className="vt-cta-pill group w-full h-12 mt-2 rounded-lg text-[15px]"
          >
            Create your account
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </form>

        <div className="mt-10 pt-6 border-t border-border flex flex-col items-center gap-1.5">
          <p className="text-label text-foreground/55">
            {t("cta.signoff")}
          </p>
          <span
            aria-label="Megha, founder"
            className="text-[28px] sm:text-[32px] text-primary leading-none"
            style={{
              fontFamily: '"Homemade Apple", "Caveat", cursive',
              transform: "rotate(-3deg)",
              letterSpacing: "0.02em",
            }}
          >
            Megha
          </span>
          <p className="text-label text-foreground/45 mt-1">
            {t("cta.role")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default PortraitCTA;

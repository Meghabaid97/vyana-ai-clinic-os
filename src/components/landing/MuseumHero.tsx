import { useNavigate } from "react-router-dom";
import heroPainting from "@/assets/hero-painting.jpg";

// Full-bleed museum hero. One painting, one headline, one CTA.
const MuseumHero = () => {
  const navigate = useNavigate();

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ minHeight: "100svh" }}
    >
      {/* Painting */}
      <img
        src={heroPainting}
        alt="A grandmother, mother, and child sharing a medical record, painted in the style of Raja Ravi Varma"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 30%" }}
      />

      {/* Vignette + warmth wash so type stays legible */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, hsl(22 25% 10% / 0.15) 0%, hsl(22 25% 10% / 0.05) 35%, hsl(22 25% 10% / 0.55) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 40%, transparent 40%, hsl(22 25% 8% / 0.45) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-[100svh] items-end">
        <div className="mx-auto w-full max-w-[1240px] px-6 pb-16 sm:pb-20 lg:px-12 lg:pb-28">
          <p className="text-[11px] tracking-[0.32em] uppercase text-[hsl(36_30%_92%)]/80 mb-6">
            Vyana &middot; A longitudinal health memory
          </p>

          <h1
            className="font-display text-[hsl(36_35%_96%)] leading-[0.95]"
            style={{ fontSize: "clamp(48px, 9vw, 132px)", letterSpacing: "-0.015em" }}
          >
            Never explain your medical
            <br />
            <em className="italic">history again.</em>
          </h1>

          <div className="mt-8 max-w-[640px]">
            <p
              className="font-display text-[hsl(36_30%_92%)]/90 leading-[1.4]"
              style={{ fontSize: "clamp(18px, 1.6vw, 24px)" }}
            >
              <span
                className="float-left font-display text-primary mr-3 mt-1"
                style={{ fontSize: "clamp(64px, 6.5vw, 96px)", lineHeight: "0.78" }}
              >
                A
              </span>
              decade of prescriptions, lab reports, and discharge summaries,
              quietly remembered. Ready, in a single page, the moment a doctor asks.
            </p>
          </div>

          <div className="mt-10 flex items-center gap-6">
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[15px] font-medium text-primary-foreground shadow-[0_10px_30px_-10px_hsl(14_62%_30%/0.6)] transition-transform hover:-translate-y-0.5"
            >
              Get early access
              <span aria-hidden>&rarr;</span>
            </button>
            <a
              href="#problem"
              className="text-[13px] tracking-[0.2em] uppercase text-[hsl(36_30%_92%)]/70 hover:text-[hsl(36_30%_96%)] transition-colors"
            >
              Read the story
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MuseumHero;

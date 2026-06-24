import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useViewTransitionNavigate } from "@/hooks/use-view-transition-navigate";
import { usePageMeta } from "@/hooks/use-page-meta";

const sections = [
  { id: "what", title: "What is an ABHA ID?" },
  { id: "benefits", title: "Why create one?" },
  { id: "create", title: "How to create your ABHA ID" },
  { id: "use", title: "How Vyana uses ABHA" },
  { id: "faq", title: "Common questions" },
];

const AbhaGuide = () => {
  const navigate = useViewTransitionNavigate();

  usePageMeta({
    title: "ABHA ID: a simple guide to India's digital health account",
    description:
      "Learn how to create and use your 14-digit ABHA ID. Vyana turns India's digital health account into a portable health story.",
    path: "/abha-guide",
    ogType: "article",
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "ABHA ID: a simple guide to India's digital health account",
      author: { "@type": "Organization", name: "Vyana" },
      publisher: {
        "@type": "Organization",
        name: "Vyana",
        logo: { "@type": "ImageObject", url: "https://vyanacare.lovable.app/app-icon.png" },
      },
      datePublished: "2026-06-24",
      dateModified: "2026-06-24",
      mainEntityOfPage: "https://vyanacare.lovable.app/abha-guide",
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="landing-warm min-h-screen bg-background text-foreground">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navigation />

      <main id="main-content" className="pt-24 pb-20">
        <article className="max-w-[760px] mx-auto px-6">
          {/* Top nav */}
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            aria-label="Go back to home"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </button>

          {/* Eyebrow */}
          <p className="text-label text-muted-foreground mb-4">Health ID guide</p>

          {/* Title */}
          <h1 className="font-display text-hero text-foreground mb-6">
            ABHA ID: a simple guide to India's digital health account
          </h1>

          {/* Lede */}
          <p className="text-body text-foreground/85 mb-10 max-w-[640px]">
            The Ayushman Bharat Digital Mission (ABDM) gives every Indian a free, 14-digit
            ABHA Health ID. This guide explains what it is, why it matters, and how Vyana
            uses it to keep your medical history complete, private, and portable.
          </p>

          {/* Table of contents */}
          <nav
            aria-label="Guide contents"
            className="surface-warm rounded-lg p-5 mb-14"
          >
            <p className="text-label text-muted-foreground mb-3">Contents</p>
            <ol className="space-y-2">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    className="group flex items-baseline gap-3 text-left w-full text-foreground/80 hover:text-foreground transition-colors"
                  >
                    <span className="font-mono text-xs text-muted-foreground w-5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[15px] leading-snug underline-offset-4 group-hover:underline">
                      {s.title}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          {/* What */}
          <section id="what" className="scroll-mt-28 mb-16">
            <h2 className="font-display text-section text-foreground mb-5">
              What is an ABHA ID?
            </h2>
            <div className="space-y-4 text-body text-foreground/85">
              <p>
                ABHA stands for Ayushman Bharat Health Account. It is a 14-digit number
                linked to your verified identity that acts as a single front door to your
                medical records across India.
              </p>
              <p>
                Instead of carrying paper files, prescriptions, and lab reports from one
                hospital to another, your ABHA ID lets consent-based access to your
                longitudinal health information wherever ABDM is accepted.
              </p>
              <p>
                Your number looks something like this: <strong>91-1234-5678-9012</strong>.
                Only you control which provider or family member can view it, and for how
                long.
              </p>
            </div>
          </section>

          {/* Benefits */}
          <section id="benefits" className="scroll-mt-28 mb-16">
            <h2 className="font-display text-section text-foreground mb-5">
              Why create one?
            </h2>
            <ul className="space-y-3 text-body text-foreground/85 list-disc pl-5">
              <li>
                <strong>Record portability.</strong> Move between cities, hospitals, and
                specialists without rebuilding your file each time.
              </li>
              <li>
                <strong>Faster consultations.</strong> Doctors see selected history in
                seconds, not minutes spent on guesswork.
              </li>
              <li>
                <strong>Safer care.</strong> Fewer duplicate tests and safer medication
                decisions when your entire timeline is visible.
              </li>
              <li>
                <strong>You stay in control.</strong> Every link to your data requires your
                consent and can be revoked.
              </li>
            </ul>
          </section>

          {/* How to create */}
          <section id="create" className="scroll-mt-28 mb-16">
            <h2 className="font-display text-section text-foreground mb-5">
              How to create your ABHA ID
            </h2>
            <div className="space-y-4 text-body text-foreground/85">
              <p>
                The official ABHA creation flow is free and takes only a few minutes. You
                typically need your mobile number and an accepted government identity for
                verification.
              </p>
              <ol className="space-y-4 list-decimal pl-5">
                <li>
                  Visit the government's official ABHA portal or download the official
                  health app.
                </li>
                <li>
                  Enter your mobile number and confirm it with the one-time password you
                  receive.
                </li>
                <li>
                  Complete the identity verification step using the accepted ID option shown
                  in the flow.
                </li>
                <li>
                  Your 14-digit ABHA Health ID is generated instantly. Save it as a
                  screenshot and as a contact note.
                </li>
              </ol>
              <p>
                Once you have your number, come back to Vyana and add it to your profile.
                We will never ask for the documents used to create it.
              </p>
            </div>
          </section>

          {/* Vyana integration */}
          <section id="use" className="scroll-mt-28 mb-16">
            <h2 className="font-display text-section text-foreground mb-5">
              How Vyana uses your ABHA ID
            </h2>
            <div className="space-y-4 text-body text-foreground/85">
              <p>
                Vyana is built to align with the Ayushman Bharat Digital Mission. We do not
                replace the national health record; we make it useful for everyday
                patients and families.
              </p>
              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <strong>One health story.</strong> Upload prescriptions, lab reports, and
                  discharge summaries, and Vyana builds a chronological timeline around
                  your ABHA-linked identity.
                </li>
                <li>
                  <strong>Clinical briefing.</strong> Before a doctor visit, Vyana generates
                  a one-page summary in standard SOAP format that you can share in seconds.
                </li>
                <li>
                  <strong>Family care.</strong> Parents, adult children, and caregivers can
                  keep a shared, consent-based view without losing context between
                  appointments.
                </li>
                <li>
                  <strong>Private by default.</strong> Your ABHA number and records stay
                  encrypted. Shares expire automatically and are never sold to insurers or
                  advertisers.
                </li>
              </ul>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-28 mb-16">
            <h2 className="font-display text-section text-foreground mb-5">
              Common questions
            </h2>
            <dl className="space-y-6 text-body text-foreground/85">
              <div>
                <dt className="font-medium text-foreground mb-1">
                  Is the ABHA ID mandatory?
                </dt>
                <dd>
                  No. It is voluntary, but it makes record portability much simpler when
                  you visit ABDM-connected hospitals and clinics.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground mb-1">
                  Can I delete or deactivate my ABHA ID?
                </dt>
                <dd>
                  Yes. The official portal lets you deactivate or delete your account.
                  In Vyana, removing your ABHA number from your profile does not touch your
                  government account.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground mb-1">
                  Does Vyana store my ABHA password?
                </dt>
                <dd>
                  No. We only store the 14-digit number if you choose to add it. We never
                  handle the credentials you use on the government portal.
                </dd>
              </div>
            </dl>
          </section>

          {/* CTA */}
          <section className="surface-warm rounded-xl p-6 sm:p-8 text-center">
            <h2 className="font-display text-section text-foreground mb-3">
              Keep your health history in one place
            </h2>
            <p className="text-body text-foreground/80 mb-6 max-w-[520px] mx-auto">
              Add your ABHA ID to Vyana and start building the longitudinal health story
              every doctor visit deserves.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="premium"
                size="lg"
                onClick={() => navigate("/auth?signup=1")}
                className="vt-cta-pill h-11 px-6 rounded-full text-[15px]"
              >
                Create your Vyana account
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => navigate("/why-vyana")}
                className="h-11 text-[15px] text-foreground/70 hover:text-foreground"
              >
                Read why we built Vyana
              </Button>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
};

export default AbhaGuide;

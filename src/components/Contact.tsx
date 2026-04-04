import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Linkedin, ArrowRight } from "lucide-react";
import { tLanding } from "@/lib/i18n-landing";

const Contact = () => {
  const [, setLangTick] = useState(0);

  useEffect(() => {
    const handler = () => setLangTick((t) => t + 1);
    window.addEventListener("vyana-lang-change", handler);
    return () => window.removeEventListener("vyana-lang-change", handler);
  }, []);

  return (
    <section id="contact" className="py-20 bg-muted/40">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="max-w-[600px] mx-auto text-center space-y-5">
          <h2 className="text-3xl font-bold text-foreground">
            {tLanding("landing.contactTitle")}{" "}
            <span className="text-primary">{tLanding("landing.contactHighlight")}</span>
          </h2>

          <p className="text-muted-foreground text-[15px] leading-relaxed">
            {tLanding("landing.contactText")}
          </p>

          <div className="flex flex-col items-center gap-5 pt-4">
            <Button
              size="lg"
              className="group h-10 px-6 text-sm rounded-md"
              onClick={() => (window.location.href = "mailto:mbaid@wharton.upenn.edu")}
            >
              {tLanding("landing.getAccess")}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
              <a href="mailto:mbaid@wharton.upenn.edu" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
                mbaid@wharton.upenn.edu
              </a>
              <span className="hidden sm:inline text-border">·</span>
              <a
                href="https://www.linkedin.com/in/megha-baid-461912174/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Linkedin className="h-4 w-4" />
                {tLanding("landing.connectLinkedin")}
              </a>
            </div>
          </div>
        </div>
      </div>

      <footer className="max-w-[980px] mx-auto px-6 mt-16 pt-6 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Vyana</span>
          <p>© 2025 Vyana. {tLanding("landing.footer")}</p>
        </div>
      </footer>
    </section>
  );
};

export default Contact;

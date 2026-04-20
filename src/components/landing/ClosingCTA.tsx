import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Linkedin } from "lucide-react";

const ClosingCTA = () => {
  return (
    <section id="contact" className="py-28 lg:py-36">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
        <div className="max-w-[720px]">
          <p className="text-[11px] tracking-[0.25em] uppercase text-primary font-medium mb-6">
            VI &nbsp;·&nbsp; Early access
          </p>
          <h2 className="font-serif text-4xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
            Be one of the first
            <br />
            <em className="italic text-primary font-normal">families we remember.</em>
          </h2>

          <p className="mt-8 text-[16px] leading-[1.75] text-muted-foreground max-w-[560px]">
            We are opening a small private beta to families managing chronic
            conditions, elderly parents, or recovering from a recent
            hospitalisation. Tell us your story.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-5">
            <Button
              className="group h-12 px-7 text-[15px] rounded-full"
              onClick={() => (window.location.href = "mailto:mbaid@wharton.upenn.edu?subject=Vyana%20early%20access")}
            >
              Request early access
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>

            <div className="flex items-center gap-5 text-[14px] text-muted-foreground">
              <a
                href="mailto:mbaid@wharton.upenn.edu"
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                mbaid@wharton.upenn.edu
              </a>
              <a
                href="https://www.linkedin.com/in/megha-baid-461912174/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <footer className="mt-24 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[12px] text-muted-foreground">
          <span className="font-serif text-base text-foreground">Vyana</span>
          <p className="italic">
            © 2025 Vyana. Every patient deserves a doctor who knows their story.
          </p>
        </footer>
      </div>
    </section>
  );
};

export default ClosingCTA;

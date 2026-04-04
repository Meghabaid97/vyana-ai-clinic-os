import { Button } from "@/components/ui/button";
import { Mail, Linkedin, ArrowRight } from "lucide-react";

const Contact = () => {
  return (
    <section id="contact" className="py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Help us build{" "}
            <span className="text-gradient">
              what should have always existed
            </span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're looking for early patients, forward-thinking doctors, and anyone 
            who's ever sat in a hospital corridor wishing they had better records.
          </p>

          <div className="flex flex-col items-center gap-6 pt-8">
            <Button
              variant="gradient"
              size="lg"
              className="group text-base px-8 py-6"
              onClick={() => window.location.href = "mailto:mbaid@wharton.upenn.edu"}
            >
              Get Early Access
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-6 text-muted-foreground">
              <a
                href="mailto:mbaid@wharton.upenn.edu"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span>mbaid@wharton.upenn.edu</span>
              </a>

              <span className="hidden sm:inline text-border">•</span>

              <a
                href="https://www.linkedin.com/in/megha-baid-461912174/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
                <span>Connect on LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-24 pt-8 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="text-2xl font-bold text-gradient">
              Vyana
            </div>
            <p>© 2025 Vyana. Every patient deserves a doctor who knows their story.</p>
          </div>
        </div>
      </footer>
    </section>
  );
};

export default Contact;

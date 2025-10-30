import { Button } from "@/components/ui/button";
import { Mail, Linkedin, ArrowRight } from "lucide-react";

const Contact = () => {
  return (
    <section id="contact" className="py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Join the Future of{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Intelligent Healthcare
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground">
            We're partnering with forward-thinking clinics to shape tomorrow's AI-powered workflows.
          </p>

          <div className="flex flex-col items-center gap-6 pt-8">
            <Button
              variant="gradient"
              size="lg"
              className="group"
              onClick={() => window.location.href = "mailto:mbaid@wharton.upenn.edu"}
            >
              Partner with Us
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
              
              <span className="hidden sm:inline">•</span>
              
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
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Vyana AI
            </div>
            <p>© 2025 Vyana AI. Building the future of healthcare technology.</p>
          </div>
        </div>
      </footer>
    </section>
  );
};

export default Contact;

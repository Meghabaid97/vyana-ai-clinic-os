import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Mission = () => {
  const navigate = useNavigate();

  return (
    <section id="mission" className="py-24 bg-muted/40">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
            Building the{" "}
            <span className="text-gradient-warm">
              health memory
            </span>{" "}
            India never had
          </h2>

          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Every patient in India deserves a doctor who knows their full story. 
            Not because they explained it in five panicked minutes — but because 
            the system remembered it for them.
          </p>

          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <div className="p-8 rounded-2xl bg-card border border-primary/15 hover:border-primary/30 transition-all shadow-card hover:shadow-warm">
              <div className="text-4xl font-bold text-gradient-warm mb-3">
                30s
              </div>
              <p className="text-muted-foreground font-medium">
                For any doctor to see your full history
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-card border border-secondary/15 hover:border-secondary/30 transition-all shadow-card hover:shadow-warm">
              <div className="text-4xl font-bold text-gradient-warm mb-3">
                ₹0
              </div>
              <p className="text-muted-foreground font-medium">
                Wasted on repeated tests
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-card border border-accent/15 hover:border-accent/30 transition-all shadow-card hover:shadow-warm">
              <div className="text-4xl font-bold text-gradient mb-3">
                1
              </div>
              <p className="text-muted-foreground font-medium">
                Screen for a doctor to see everything
              </p>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => navigate("/why-vyana")}
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-lg transition-colors group"
            >
              Read the full story behind Vyana
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Mission;

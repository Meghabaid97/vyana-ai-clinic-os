import { useNavigate } from "react-router-dom";

const Mission = () => {
  const navigate = useNavigate();

  return (
    <section id="mission" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
            Building the{" "}
            <span className="text-gradient">
              health memory
            </span>{" "}
            India never had
          </h2>

          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Every patient in India deserves a doctor who knows their full story. 
            Not because they explained it in five panicked minutes — but because 
            the system remembered it for them.
          </p>

          <div className="grid md:grid-cols-3 gap-8 pt-8">
            <div className="p-8 rounded-2xl border border-primary/20 hover:border-primary/40 transition-all shadow-card">
              <div className="text-4xl font-bold text-gradient mb-3">
                30s
              </div>
              <p className="text-muted-foreground font-medium">
                For any doctor to see your full history
              </p>
            </div>
            <div className="p-8 rounded-2xl border border-secondary/20 hover:border-secondary/40 transition-all shadow-card">
              <div className="text-4xl font-bold text-gradient-warm mb-3">
                ₹0
              </div>
              <p className="text-muted-foreground font-medium">
                Wasted on repeated tests
              </p>
            </div>
            <div className="p-8 rounded-2xl border border-accent/20 hover:border-accent/40 transition-all shadow-card">
              <div className="text-4xl font-bold text-gradient mb-3">
                100%
              </div>
              <p className="text-muted-foreground font-medium">
                Your data, your control
              </p>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => navigate("/why-vyana")}
              className="text-primary hover:text-primary/80 font-medium text-lg transition-colors underline underline-offset-4 decoration-primary/30 hover:decoration-primary/60"
            >
              Read the full story behind Vyana →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Mission;

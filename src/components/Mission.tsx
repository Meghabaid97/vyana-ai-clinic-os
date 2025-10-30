const Mission = () => {
  return (
    <section id="mission" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
            Building the{" "}
            <span className="text-gradient">
              AI Backbone
            </span>{" "}
            for India's Healthcare System
          </h2>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
            We're giving doctors their time back and patients more connected, accurate care. 
            Our mission is to create an intelligent healthcare infrastructure that serves 
            millions while maintaining the human touch that makes healthcare meaningful.
          </p>

          <div className="grid md:grid-cols-3 gap-8 pt-8">
            <div className="p-8 rounded-2xl border-2 border-primary/20 hover:border-primary/50 transition-all hover:shadow-soft">
              <div className="text-5xl font-bold text-gradient mb-2">
                10x
              </div>
              <p className="text-muted-foreground font-medium">Faster Documentation</p>
            </div>
            <div className="p-8 rounded-2xl border-2 border-secondary/20 hover:border-secondary/50 transition-all hover:shadow-soft">
              <div className="text-5xl font-bold text-gradient mb-2">
                99%
              </div>
              <p className="text-muted-foreground font-medium">Accuracy Rate</p>
            </div>
            <div className="p-8 rounded-2xl border-2 border-accent/20 hover:border-accent/50 transition-all hover:shadow-soft">
              <div className="text-5xl font-bold text-gradient mb-2">
                100%
              </div>
              <p className="text-muted-foreground font-medium">ABDM Compliant</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Mission;

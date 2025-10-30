const Mission = () => {
  return (
    <section id="mission" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
            Building the{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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
            <div className="p-6">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                10x
              </div>
              <p className="text-muted-foreground">Faster Documentation</p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                99%
              </div>
              <p className="text-muted-foreground">Accuracy Rate</p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                100%
              </div>
              <p className="text-muted-foreground">ABDM Compliant</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Mission;

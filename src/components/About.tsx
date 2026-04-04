const About = () => {
  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold">
              The problem is{" "}
              <span className="text-gradient-warm">personal</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Story beat 1 */}
            <div className="p-8 rounded-2xl bg-card border border-border shadow-card space-y-4">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="text-secondary text-lg">1</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Five minutes to explain a lifetime</h3>
              <p className="text-muted-foreground leading-relaxed text-[15px]">
                When a family rushes to the ER, they get five minutes to explain 
                decades of medical history to a doctor who's never met them. 
                No records. No context. Just panic.
              </p>
            </div>

            {/* Story beat 2 */}
            <div className="p-8 rounded-2xl bg-card border border-border shadow-card space-y-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-lg">2</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">75 pages no one reads</h3>
              <p className="text-muted-foreground leading-relaxed text-[15px]">
                Patients carry thick folders of scattered reports. Every new doctor 
                orders the same blood tests again because they don't trust 
                the previous lab. The clock resets every visit.
              </p>
            </div>

            {/* Story beat 3 */}
            <div className="p-8 rounded-2xl bg-card border border-border shadow-card space-y-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="text-accent text-lg">3</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Chronic disease caught too late</h3>
              <p className="text-muted-foreground leading-relaxed text-[15px]">
                No one tracks the longitudinal picture. Conditions worsen 
                incrementally. By the time they're diagnosed, prevention 
                is no longer possible.
              </p>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-xl text-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Vyana holds your complete medical history — quietly, securely — 
              so when you need it most, it's there.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

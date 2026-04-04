import { FileText, TrendingUp, Share2, Shield, Clock, Heart } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Upload anything",
    description: "Prescriptions, lab reports, discharge summaries — photo or PDF. We extract the data automatically.",
  },
  {
    icon: TrendingUp,
    title: "Track what matters",
    description: "HbA1c, blood pressure, cholesterol — tracked over time. We flag when something changes.",
  },
  {
    icon: Clock,
    title: "30-second summary",
    description: "One screen shows a doctor your complete history. Active conditions, medications, allergies, recent visits.",
  },
  {
    icon: Share2,
    title: "Share with any doctor",
    description: "Generate a secure link valid for 24 hours. No app needed on their end. Just a clean summary.",
  },
  {
    icon: Shield,
    title: "Your data, your control",
    description: "ABHA-linked, ABDM compliant. You decide which doctor sees what. Consent is granular and revocable.",
  },
  {
    icon: Heart,
    title: "Built for Indian families",
    description: "Multilingual. Works on any phone. Designed for the daughter tracking her father's medications, the son rushing to the ER.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold">
            What Vyana{" "}
            <span className="text-gradient">does for you</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Not features. Promises.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-soft transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-[15px]">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;

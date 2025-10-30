import { Stethoscope, Languages, Zap, Calendar, Lock, FileText } from "lucide-react";

const features = [
  {
    icon: Stethoscope,
    title: "AI Medical Scribe",
    description: "Converts speech into accurate, structured visit notes and prescriptions.",
  },
  {
    icon: Languages,
    title: "Multilingual Support",
    description: "Works in English, Hindi, and regional Indian languages.",
  },
  {
    icon: FileText,
    title: "FHIR-Ready Data",
    description: "Notes are generated in global standard format for easy sharing across hospital systems.",
  },
  {
    icon: Calendar,
    title: "Smart Follow-ups",
    description: "Automates scheduling and WhatsApp reminders for better continuity of care.",
  },
  {
    icon: Lock,
    title: "Privacy Built-In",
    description: "Identifiable data stays with clinics; de-identified records power better analytics and research.",
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    description: "Instant documentation generation during patient consultations.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Powerful Features for{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Modern Healthcare
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to streamline clinic operations and improve patient care
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-card border border-border hover:shadow-soft transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
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

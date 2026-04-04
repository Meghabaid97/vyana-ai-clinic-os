import { useNavigate } from "react-router-dom";
import {
  FileText,
  Calendar,
  FolderOpen,
  Activity,
  Shield,
  Stethoscope,
} from "lucide-react";

interface Props {
  stats: { consultations: number; appointments: number; healthRecords: number; doctors: number };
}

const DashboardActions = ({ stats }: Props) => {
  const navigate = useNavigate();

  const sections = [
    {
      emoji: "📄",
      title: "Upload anything",
      description: "Prescriptions, lab reports, discharge summaries. We extract the data so you never explain it twice.",
      path: "/patient-health-records",
      badge: stats.healthRecords > 0 ? stats.healthRecords : undefined,
    },
    {
      emoji: "📈",
      title: "Track what matters",
      description: "HbA1c, blood pressure, cholesterol, tracked over time. We flag changes early so you can act.",
      path: "/patient-profile-page",
    },
    {
      emoji: "⚡",
      title: "30-second summary",
      description: "One screen. Complete history. Conditions, medications, allergies, visits. A doctor sees everything in half a minute.",
      path: "/patient-medical-history",
      badge: stats.consultations > 0 ? stats.consultations : undefined,
    },
    {
      emoji: "🔗",
      title: "Share with any doctor",
      description: "Secure link. 24 hours. No app needed on their end. Just a clean summary that could save a life.",
      path: "/find-doctors",
      badge: stats.doctors > 0 ? stats.doctors : undefined,
    },
    {
      emoji: "📅",
      title: "Book appointments",
      description: "Find doctors near you. Book visits. Get reminders. Your health, on your schedule.",
      path: "/patient-appointments",
      badge: stats.appointments > 0 ? stats.appointments : undefined,
    },
    {
      emoji: "🛡️",
      title: "Emergency access",
      description: "Family safety net. In an emergency, your loved ones can share your records with any doctor, instantly.",
      path: "/emergency-contacts",
    },
  ];

  return (
    <section className="py-12 px-5 sm:px-6 bg-muted/40">
      <div className="max-w-[640px] mx-auto">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1.5">
            Not features.{" "}
            <span className="text-primary">Promises.</span>
          </h2>
          <p className="text-muted-foreground text-[15px]">
            Six things we will never compromise on.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sections.map((section, i) => (
            <button
              key={i}
              onClick={() => navigate(section.path)}
              className="group relative rounded-lg border border-border bg-background p-4 sm:p-5 text-left hover:border-primary/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {section.badge && (
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                  {section.badge}
                </span>
              )}
              <span className="text-lg mb-2 block">{section.emoji}</span>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {section.title}
              </h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed">
                {section.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardActions;

import { Stethoscope, Activity, Calendar, Heart } from "lucide-react";

interface Props {
  stats: { consultations: number; appointments: number; healthRecords: number; doctors: number };
}

const DashboardStats = ({ stats }: Props) => {
  const statItems = [
    { value: "30s", label: "For any doctor to see your full history", icon: Stethoscope },
    { value: String(stats.doctors), label: "Doctors who know your story", icon: Activity },
    { value: String(stats.healthRecords + stats.consultations), label: "Records held securely", icon: Heart },
  ];

  return (
    <section className="py-12 px-5 sm:px-6">
      <div className="max-w-[640px] mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1.5">
          Building the{" "}
          <span className="text-primary">health memory</span>{" "}
          you deserve.
        </h2>
        <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
          Every patient deserves a doctor who knows the full story. Not because they explained it in five panicked minutes, but because the system remembered it for them.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {statItems.map((stat, i) => (
            <div key={i} className="rounded-lg border border-border p-4 sm:p-5">
              <div className="text-2xl font-bold text-primary mb-0.5">
                {stat.value}
              </div>
              <p className="text-muted-foreground text-[13px]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardStats;

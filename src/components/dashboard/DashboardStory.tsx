import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import type { DashboardData } from "@/pages/PatientDashboard";

interface Props {
  data: DashboardData;
}

const DashboardStory = ({ data }: Props) => {
  const navigate = useNavigate();
  const totalRecords = data.stats.healthRecords + data.stats.consultations;

  return (
    <section className="py-12 px-5 sm:px-6">
      <div className="max-w-[640px] mx-auto">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1.5">
            Your story so far.{" "}
            <span className="text-primary">Every detail matters.</span>
          </h2>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            What happens when the system forgets and families pay the price. Your records make sure that never happens.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              emoji: "🏥",
              title: "Five minutes. A lifetime of history.",
              text: "A family rushes to the ER. They get five minutes to explain decades of medical history. No records. No context. Just fear.",
            },
            {
              emoji: "📋",
              title: "75 pages. Zero continuity.",
              text: "Scattered reports in thick folders. Every new doctor orders fresh tests. The clock resets. The bill climbs. Nothing connects.",
            },
            {
              emoji: "⏰",
              title: "Caught too late.",
              text: "Nobody tracks the slow changes. Conditions worsen quietly. By the time they are caught, prevention is off the table.",
            },
          ].map((beat, i) => (
            <div
              key={i}
              className="rounded-lg border border-border p-4 sm:p-5 hover:bg-muted/50 transition-colors"
            >
              <span className="text-xl mb-2 block">{beat.emoji}</span>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {beat.title}
              </h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed">
                {beat.text}
              </p>
            </div>
          ))}
        </div>

        {/* Timeline or upload prompt */}
        <div className="mt-8 rounded-lg p-4 sm:p-5 border border-border bg-muted/60">
          {totalRecords === 0 ? (
            <button
              onClick={() => navigate("/patient-health-records")}
              className="group flex items-center gap-3 text-primary"
            >
              <Upload className="h-4 w-4" />
              <span className="font-medium text-sm">Upload your first record. Your story starts here.</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative flex items-center gap-0 overflow-x-auto pb-2">
                <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-border" />
                {data.recordDates.map((date, i) => (
                  <div key={i} className="relative flex flex-col items-center shrink-0" style={{ minWidth: "52px" }}>
                    <div className="h-3 w-3 rounded-full z-10 bg-primary" />
                    <span className="mt-1.5 text-[11px] whitespace-nowrap text-muted-foreground">{date}</span>
                  </div>
                ))}
                <div className="relative flex flex-col items-center shrink-0" style={{ minWidth: "52px" }}>
                  <div className="h-4 w-4 rounded-full z-10 bg-primary ring-4 ring-primary/20" />
                  <span className="mt-1.5 text-[11px] font-semibold whitespace-nowrap text-primary">Today</span>
                </div>
              </div>
              <p className="text-[15px] text-foreground">
                {totalRecords} record{totalRecords !== 1 ? "s" : ""} held.{" "}
                <span className="text-primary font-medium">Your story is growing.</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DashboardStory;

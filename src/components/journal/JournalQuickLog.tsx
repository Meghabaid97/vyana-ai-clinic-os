import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Plus, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SymptomLogDialog from "./SymptomLogDialog";
import { symptomById } from "@/lib/symptomCatalog";

interface Props {
  patientId: string | null;
}

interface RecentLog {
  id: string;
  symptom_type: string;
  custom_symptom_name: string | null;
  severity: number;
  logged_at: string;
}

const JournalQuickLog = ({ patientId }: Props) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<RecentLog[]>([]);
  const [todayCount, setTodayCount] = useState(0);

  const load = async () => {
    if (!patientId) return;
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("symptom_logs")
      .select("id, symptom_type, custom_symptom_name, severity, logged_at")
      .eq("patient_id", patientId)
      .order("logged_at", { ascending: false })
      .limit(3);
    setRecent(data || []);
    const { count } = await supabase
      .from("symptom_logs")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", patientId)
      .gte("logged_at", startOfDay.toISOString());
    setTodayCount(count || 0);
  };

  useEffect(() => { void load(); }, [patientId]);

  const labelFor = (l: RecentLog) =>
    l.custom_symptom_name || symptomById(l.symptom_type).label;

  return (
    <section className="px-4 sm:px-5 lg:px-0 pb-3 lg:pb-0">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-primary">Health journal</p>
              <h2 className="text-[17px] sm:text-lg font-bold text-foreground leading-tight mt-0.5">
                How are you feeling today?
              </h2>
              <p className="text-[12.5px] text-muted-foreground mt-1 leading-snug">
                A quick log helps Vyana spot patterns later. Memory, not diagnosis.
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Log a symptom
            </button>
            <button
              onClick={() => navigate("/app/journal")}
              className="inline-flex items-center gap-1 h-10 px-3.5 rounded-full border border-border bg-background text-[12.5px] font-medium text-foreground hover:border-primary/40 transition-colors"
            >
              Journal
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {(recent.length > 0 || todayCount > 0) && (
            <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                {recent.slice(0, 3).map((l) => (
                  <span key={l.id} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span>{symptomById(l.symptom_type).emoji}</span>
                    <span className="truncate max-w-[80px]">{labelFor(l)}</span>
                    <span className="text-[10px] text-muted-foreground/70">·{l.severity}</span>
                  </span>
                ))}
              </div>
              {todayCount > 0 && (
                <span className="text-[11px] font-semibold text-primary shrink-0">
                  {todayCount} today
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <SymptomLogDialog open={open} onClose={() => setOpen(false)} patientId={patientId} onLogged={load} />
    </section>
  );
};

export default JournalQuickLog;

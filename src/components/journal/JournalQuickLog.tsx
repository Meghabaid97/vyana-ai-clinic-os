import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Plus, ArrowRight, Flame, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SymptomLogDialog from "./SymptomLogDialog";
import JournalCadenceSheet from "./JournalCadenceSheet";
import JournalStreakChart from "./JournalStreakChart";
import { symptomById } from "@/lib/symptomCatalog";
import {
  CADENCE_LABEL,
  isStreakStale,
  JournalPreference,
  loadOrCreatePreference,
  recordLogForStreak,
} from "@/lib/journalPreferences";
import { useLanguage } from "@/lib/i18n";

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
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [cadenceOpen, setCadenceOpen] = useState(false);
  const [recent, setRecent] = useState<RecentLog[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [pref, setPref] = useState<JournalPreference | null>(null);
  const [chartKey, setChartKey] = useState(0);

  const load = useCallback(async () => {
    if (!patientId) return;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [{ data }, { count }, p] = await Promise.all([
      supabase
        .from("symptom_logs")
        .select("id, symptom_type, custom_symptom_name, severity, logged_at")
        .eq("patient_id", patientId)
        .order("logged_at", { ascending: false })
        .limit(3),
      supabase
        .from("symptom_logs")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", patientId)
        .gte("logged_at", startOfDay.toISOString()),
      loadOrCreatePreference(patientId),
    ]);
    setRecent(data || []);
    setTodayCount(count || 0);
    setPref(p);
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleLogged = async () => {
    if (patientId) await recordLogForStreak(patientId);
    setChartKey((k) => k + 1);
    await load();
  };

  const labelFor = (l: RecentLog) =>
    l.custom_symptom_name || symptomById(l.symptom_type).label;

  const stale = isStreakStale(pref);
  const streak = pref?.current_streak ?? 0;

  return (
    <section className="px-4 sm:px-5 lg:px-0 pb-3 lg:pb-0">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-primary">{t("journalQuick.eyebrow")}</p>
                <button
                  onClick={() => setCadenceOpen(true)}
                  className="inline-flex items-center gap-1 text-[10.5px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Reminder cadence"
                >
                  <Settings2 className="h-3 w-3" />
                  {pref ? CADENCE_LABEL[pref.cadence] : "Cadence"}
                </button>
              </div>
              <h2 className="text-[17px] sm:text-lg font-bold text-foreground leading-tight mt-0.5">
                {t("journalQuick.title")}
              </h2>
              <p className="text-[12.5px] text-muted-foreground mt-1 leading-snug">
                {t("journalQuick.sub")}
              </p>
            </div>
          </div>

          {/* Streak / nudge row */}
          {streak > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
              <Flame className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11.5px] font-semibold text-primary">
                {streak}-{pref?.cadence === "weekly" ? "week" : "day"} streak
              </span>
              {stale && (
                <span className="text-[10.5px] text-muted-foreground ml-1">
                  · don't lose it
                </span>
              )}
            </div>
          )}
          {streak === 0 && stale && (
            <p className="mt-3 text-[11.5px] text-muted-foreground">
              Start a streak. Even one log builds your story.
            </p>
          )}

          {/* 4-week streak history */}
          <div className="mt-3.5">
            <JournalStreakChart patientId={patientId} refreshKey={chartKey} />
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t("journalQuick.log")}
            </button>
            <button
              onClick={() => navigate("/app/journal")}
              className="inline-flex items-center gap-1 h-10 px-3.5 rounded-full border border-border bg-background text-[12.5px] font-medium text-foreground hover:border-primary/40 transition-colors"
            >
              {t("journalQuick.openJournal")}
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

      <SymptomLogDialog open={open} onClose={() => setOpen(false)} patientId={patientId} onLogged={handleLogged} />
      <JournalCadenceSheet
        open={cadenceOpen}
        onClose={() => setCadenceOpen(false)}
        patientId={patientId}
        onSaved={(p) => setPref(p)}
      />
    </section>
  );
};

export default JournalQuickLog;

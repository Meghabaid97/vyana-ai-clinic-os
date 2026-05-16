import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Check, NotebookPen, Pill, BookOpen, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SymptomLogDialog from "@/components/journal/SymptomLogDialog";

interface Props {
  patientId: string | null;
  patientName?: string;
}

type Mood = { emoji: string; label: string; severity: number; key: string };

const MOODS: Mood[] = [
  { emoji: "😊", label: "Great",   severity: 1, key: "great" },
  { emoji: "😐", label: "Okay",    severity: 3, key: "okay"  },
  { emoji: "😣", label: "Rough",   severity: 6, key: "rough" },
];

const todayKey = (patientId: string) => `vyana-mood-${patientId}-${new Date().toDateString()}`;

const DashboardMoodPill = ({ patientId, patientName }: Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loggedToday, setLoggedToday] = useState<Mood | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);

  // On patient switch, check localStorage for today's mood for THIS patient.
  useEffect(() => {
    if (!patientId) { setLoggedToday(null); return; }
    const raw = localStorage.getItem(todayKey(patientId));
    if (!raw) { setLoggedToday(null); return; }
    const m = MOODS.find(x => x.key === raw);
    setLoggedToday(m || null);
  }, [patientId]);

  const logMood = async (mood: Mood) => {
    if (!patientId || saving) return;
    setSaving(mood.key);
    const { error } = await supabase.from("symptom_logs").insert({
      patient_id: patientId,
      symptom_type: "mood_checkin",
      custom_symptom_name: mood.label,
      severity: mood.severity,
      notes: `Daily mood check-in: ${mood.label}`,
    });
    setSaving(null);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    localStorage.setItem(todayKey(patientId), mood.key);
    setLoggedToday(mood);
    toast({ title: `${mood.emoji} Noted`, description: "Your daily check-in is logged." });
  };

  if (!patientId) return null;

  const firstName = (patientName || "").split(" ")[0];

  return (
    <section className="px-4 sm:px-6 lg:px-0 pt-3 pb-1">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 pb-2.5 flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[10.5px] sm:text-xs font-medium tracking-[0.18em] uppercase text-primary mb-1.5">
              <Heart className="h-3 w-3 fill-primary/30 text-primary" /> Health Journal
            </p>
            <h3 className="text-[17px] sm:text-[19px] font-extrabold leading-[1.15] tracking-[-0.01em] text-foreground">
              {loggedToday
                ? <>Today felt <span className="text-primary">{loggedToday.label.toLowerCase()}</span> {loggedToday.emoji}</>
                : <>How are you feeling today{firstName ? `, ${firstName}` : ""}?</>}
            </h3>
          </div>
          {loggedToday && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary shrink-0">
              <Check className="h-3 w-3" /> Logged
            </span>
          )}
        </div>

        {!loggedToday && (
          <div className="px-4 sm:px-5 pb-3 grid grid-cols-3 gap-2">
            {MOODS.map(m => (
              <button
                key={m.key}
                onClick={() => logMood(m)}
                disabled={!!saving}
                className={`group flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background py-3 transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] disabled:opacity-50 ${saving === m.key ? "border-primary/60 bg-primary/10" : ""}`}
                aria-label={`Feeling ${m.label}`}
              >
                <span className="text-2xl leading-none">{m.emoji}</span>
                <span className="text-[11.5px] font-medium text-foreground">{m.label}</span>
              </button>
            ))}
          </div>
        )}

        {loggedToday && loggedToday.severity >= 3 ? (
          <div className="border-t border-border bg-muted/20 px-4 sm:px-5 py-3">
            <p className="text-[12px] text-muted-foreground mb-2">
              {loggedToday.severity >= 6
                ? "Sorry it's a rough one. Want to capture what's going on? Future-you will thank you."
                : "Anything bothering you today? A quick note now helps Vyana spot patterns."}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => navigate("/app/journal?action=symptom")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2 text-[11.5px] font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <NotebookPen className="h-3.5 w-3.5 text-primary" /> Log symptom
              </button>
              <button
                onClick={() => setVoiceOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2 text-[11.5px] font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <Mic className="h-3.5 w-3.5 text-primary" /> Voice note
              </button>
              <button
                onClick={() => navigate("/app/medications")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2 text-[11.5px] font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <Pill className="h-3.5 w-3.5 text-primary" /> Meds
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setVoiceOpen(true)}
            className="w-full flex items-center justify-center gap-2 border-t border-border bg-muted/30 py-2.5 text-[12px] font-medium text-foreground/80 hover:bg-muted/60 transition-colors"
          >
            <Mic className="h-3.5 w-3.5 text-primary" />
            {loggedToday ? "Add a voice note about today" : "Got more to say? Voice-note journal"}
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      <SymptomLogDialog
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        patientId={patientId}
        autoStartVoice
      />
    </section>
  );
};

export default DashboardMoodPill;

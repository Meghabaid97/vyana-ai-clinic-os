import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Sparkles, FileText, Loader2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SymptomLogDialog from "@/components/journal/SymptomLogDialog";
import { symptomById } from "@/lib/symptomCatalog";
import { summarizeFreshness, symptomWindowStartIso, formatFreshDate, SYMPTOM_WINDOW_DAYS } from "@/lib/symptomFreshness";

interface Log {
  id: string;
  symptom_type: string;
  custom_symptom_name: string | null;
  severity: number;
  duration: string | null;
  body_location: string | null;
  triggers: string[];
  associated_symptoms: string[];
  medications_taken: string[];
  notes: string | null;
  photo_path: string | null;
  logged_at: string;
}

interface Pattern { title: string; detail: string; symptom: string; }
interface VisitPrep {
  summary: string;
  recent_symptoms: { symptom: string; frequency: string; avg_severity: string; notes?: string }[];
  related_medications: string[];
  questions_for_doctor: string[];
}

const SymptomJournal = () => {
  const { toast } = useToast();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [openLog, setOpenLog] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [insightsDisclaimer, setInsightsDisclaimer] = useState("");
  const [generatingPrep, setGeneratingPrep] = useState(false);
  const [prep, setPrep] = useState<VisitPrep | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async (pid: string) => {
    const { data } = await supabase
      .from("symptom_logs")
      .select("*")
      .eq("patient_id", pid)
      .gte("logged_at", symptomWindowStartIso())
      .order("logged_at", { ascending: false })
      .limit(100);
    setLogs((data as Log[]) || []);
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: p } = await supabase
        .from("patients").select("id").eq("user_id", session.user.id).maybeSingle();
      if (p) { setPatientId(p.id); await load(p.id); }
    })();
  }, []);

  const reload = async () => { if (patientId) await load(patientId); };

  const analyze = async (mode: "insights" | "visit_prep") => {
    if (!patientId) return;
    if (mode === "insights") setAnalyzing(true); else setGeneratingPrep(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-symptoms", {
        body: { patientId, mode },
      });
      if (error) throw error;
      if (data?.error === "no_data") {
        toast({ title: "Nothing to analyze yet", description: data.message });
        return;
      }
      if (data?.error) {
        toast({ title: "Couldn't analyze", description: data.error, variant: "destructive" });
        return;
      }
      if (mode === "insights") {
        setPatterns(data.patterns || []);
        setInsightsDisclaimer(data.disclaimer || "");
      } else {
        setPrep(data);
      }
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setAnalyzing(false); setGeneratingPrep(false);
    }
  };

  const deleteLog = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await supabase.from("symptom_logs").delete().eq("id", id);
    void reload();
  };

  const labelFor = (l: Log) => l.custom_symptom_name || symptomById(l.symptom_type).label;

  return (
    <div className="px-4 sm:px-5 lg:px-0 py-4 space-y-5 animate-fade-in">
      {/* Header CTA */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Health Journal</h1>
        </div>
        <Button onClick={() => setOpenLog(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Log
        </Button>
      </div>

      {/* AI Insights */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-primary">Patterns</p>
            <h2 className="text-base font-bold text-foreground">What Vyana noticed</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => analyze("insights")} disabled={analyzing || logs.length === 0}>
            {analyzing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            {patterns.length > 0 ? "Refresh" : "Analyze"}
          </Button>
        </div>
        {patterns.length === 0 ? (
          <p className="text-[12.5px] text-muted-foreground">
            {logs.length === 0 ? "Log a few symptoms first." : "Tap Analyze to see patterns from your logs."}
          </p>
        ) : (
          <div className="space-y-2">
            {patterns.map((p, i) => (
              <div key={i} className="rounded-xl border border-border p-3 bg-muted/30">
                <p className="text-[13px] font-semibold text-foreground">{p.title}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{p.detail}</p>
              </div>
            ))}
            {insightsDisclaimer && (
              <p className="text-[10.5px] text-muted-foreground italic mt-2">{insightsDisclaimer}</p>
            )}
          </div>
        )}
      </section>

      {/* Visit Prep */}
      <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-primary">Doctor visit prep</p>
            <h2 className="text-base font-bold text-foreground">Walk in ready</h2>
          </div>
          <Button size="sm" onClick={() => analyze("visit_prep")} disabled={generatingPrep || logs.length === 0}>
            {generatingPrep ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
            Generate
          </Button>
        </div>
        {!prep ? (
          <p className="text-[12.5px] text-muted-foreground">
            Generate a one-page summary of your recent symptoms, meds, records, and questions to ask.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] text-foreground leading-relaxed">{prep.summary}</p>
            {prep.recent_symptoms?.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">Recent symptoms</p>
                <div className="space-y-1.5">
                  {prep.recent_symptoms.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-[12.5px] rounded-lg bg-background p-2 border border-border">
                      <span className="font-medium text-foreground capitalize">{s.symptom}</span>
                      <span className="text-muted-foreground text-[11.5px]">{s.frequency} · {s.avg_severity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {prep.related_medications?.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">Medications</p>
                <ul className="text-[12.5px] text-foreground space-y-0.5 list-disc pl-5">
                  {prep.related_medications.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}
            {prep.questions_for_doctor?.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">Ask your doctor</p>
                <ul className="text-[12.5px] text-foreground space-y-1 list-decimal pl-5">
                  {prep.questions_for_doctor.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* History */}
      <section>
        {(() => {
          const fresh = summarizeFreshness(logs);
          return (
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <h2 className="text-base font-bold text-foreground">Your logs</h2>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-border bg-muted/40 text-muted-foreground">
                  Last {SYMPTOM_WINDOW_DAYS}d
                </span>
                {logs.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${fresh.isStale ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" : "border-border bg-muted/40 text-muted-foreground"}`}>
                    {fresh.label}{fresh.latestAt ? ` · ${formatFreshDate(fresh.latestAt)}` : ""}
                  </span>
                )}
              </div>
            </div>
          );
        })()}
        {logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-[13px] text-muted-foreground">No entries yet.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpenLog(true)}>
              <Plus className="h-4 w-4 mr-1" /> Log your first symptom
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => {
              const def = symptomById(l.symptom_type);
              const isOpen = expanded === l.id;
              const date = new Date(l.logged_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
              return (
                <div key={l.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : l.id)}
                    className="w-full flex items-center gap-3 p-3 text-left"
                  >
                    <span className="text-xl">{def.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-foreground truncate">{labelFor(l)}</p>
                      <p className="text-[11px] text-muted-foreground">{date}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold text-primary">{l.severity}/10</span>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-1.5 text-[12px] text-muted-foreground border-t border-border pt-2.5">
                      {l.duration && <p><span className="font-medium text-foreground">Duration:</span> {l.duration}</p>}
                      {l.body_location && <p><span className="font-medium text-foreground">Location:</span> {l.body_location}</p>}
                      {l.triggers?.length > 0 && <p><span className="font-medium text-foreground">Triggers:</span> {l.triggers.join(", ")}</p>}
                      {l.associated_symptoms?.length > 0 && <p><span className="font-medium text-foreground">Other symptoms:</span> {l.associated_symptoms.join(", ")}</p>}
                      {l.medications_taken?.length > 0 && <p><span className="font-medium text-foreground">Took:</span> {l.medications_taken.join(", ")}</p>}
                      {l.notes && <p className="italic">"{l.notes}"</p>}
                      <button
                        onClick={() => deleteLog(l.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-destructive mt-2 hover:underline"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <SymptomLogDialog open={openLog} onClose={() => setOpenLog(false)} patientId={patientId} onLogged={reload} />
    </div>
  );
};

export default SymptomJournal;

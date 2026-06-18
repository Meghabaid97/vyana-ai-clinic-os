import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchActivePatient, onActivePatientChange } from "@/lib/activePatient";
import {
  Pill, Plus, Trash2, Clock, Bell, Loader2, ToggleLeft, ToggleRight, FileText, Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";

interface Reminder {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string;
  time_slots: string[];
  is_active: boolean;
  notes: string | null;
  source_record_id: string | null;
  created_at: string;
}

interface ExtractedMed {
  raw: string;              // original line
  name: string;             // cleaned name (no schedule)
  dosage: string | null;    // e.g. "60mg" if found
  schedule: string | null;  // e.g. "0-0-1" if found
  sourceRecordId: string;
  sourceFileName: string;
}

/* ---------- helpers ---------- */
const SCHED_RE = /\(([\d.\sx\-/]+)\)/i;
const DOSE_RE  = /\b(\d+(?:\.\d+)?)\s?(mg|mcg|g|ml|iu|units?)\b/i;

const parseMed = (raw: string) => {
  const dose = raw.match(DOSE_RE);
  const sched = raw.match(SCHED_RE);
  let name = raw
    .replace(SCHED_RE, "")
    .replace(/^(T|Tab|Cap|Inj|Syp|Syrup|Tablet|Capsule|Injection)\.?\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return {
    name,
    dosage: dose ? dose[0] : null,
    schedule: sched ? sched[1].trim() : null,
  };
};

const scheduleToFrequency = (sched: string | null): { frequency: string; times: string[] } => {
  if (!sched) return { frequency: "daily", times: ["08:00"] };
  const parts = sched.split("-").map(p => parseInt(p, 10)).filter(n => !isNaN(n));
  if (parts.length === 3) {
    const slots: string[] = [];
    if (parts[0] > 0) slots.push("08:00");
    if (parts[1] > 0) slots.push("14:00");
    if (parts[2] > 0) slots.push("21:00");
    const active = slots.length;
    if (active === 1) return { frequency: "daily", times: slots };
    if (active === 2) return { frequency: "twice_daily", times: slots };
    if (active === 3) return { frequency: "thrice_daily", times: slots };
  }
  return { frequency: "daily", times: ["08:00"] };
};

const MedicationReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [extracted, setExtracted] = useState<ExtractedMed[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", dosage: "", frequency: "daily", time: "08:00", notes: "" });
  const [saving, setSaving] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    void loadAll();
    const off = onActivePatientChange(() => { setLoading(true); void loadAll(); });
    return () => off();
  }, []);

  const loadAll = async () => {
    const patient = await fetchActivePatient<{ id: string }>("id");
    if (!patient) { setLoading(false); return; }
    setPatientId(patient.id);

    const [{ data: rems }, { data: recs }] = await Promise.all([
      supabase
        .from("medication_reminders")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("health_records")
        .select("id, file_name, medications, uploaded_at")
        .eq("patient_id", patient.id)
        .not("medications", "is", null)
        .order("uploaded_at", { ascending: false }),
    ]);

    setReminders((rems as Reminder[] | null) || []);

    // Flatten + dedupe meds across records, keep most recent source
    const seen = new Map<string, ExtractedMed>();
    for (const rec of (recs as Array<{ id: string; file_name: string; medications: unknown }> | null) || []) {
      const meds = Array.isArray(rec.medications) ? rec.medications : [];
      for (const m of meds) {
        if (typeof m !== "string" || !m.trim()) continue;
        const parsed = parseMed(m);
        const key = parsed.name.toLowerCase();
        if (seen.has(key)) continue;
        seen.set(key, {
          raw: m,
          name: parsed.name,
          dosage: parsed.dosage,
          schedule: parsed.schedule,
          sourceRecordId: rec.id,
          sourceFileName: rec.file_name,
        });
      }
    }
    setExtracted(Array.from(seen.values()));
    setLoading(false);
  };

  /** Map extracted med name → matching active reminder (if any) */
  const reminderByName = useMemo(() => {
    const m = new Map<string, Reminder>();
    for (const r of reminders) m.set(r.medication_name.toLowerCase(), r);
    return m;
  }, [reminders]);

  /** Reminders not coming from any extracted prescription line */
  const manualReminders = useMemo(() => {
    const extractedKeys = new Set(extracted.map(e => e.name.toLowerCase()));
    return reminders.filter(r => !extractedKeys.has(r.medication_name.toLowerCase()));
  }, [reminders, extracted]);

  const toggleExtracted = async (med: ExtractedMed) => {
    if (!patientId) return;
    const existing = reminderByName.get(med.name.toLowerCase());
    setTogglingKey(med.name);
    if (existing) {
      // Remove the reminder entirely
      const { error } = await supabase.from("medication_reminders").delete().eq("id", existing.id);
      if (!error) {
        setReminders(prev => prev.filter(r => r.id !== existing.id));
        toast({ title: t("med.toast.removed") });
      } else {
        toast({ title: t("med.toast.error"), description: error.message, variant: "destructive" });
      }
    } else {
      const sched = scheduleToFrequency(med.schedule);
      const { data, error } = await supabase.from("medication_reminders").insert({
        patient_id: patientId,
        medication_name: med.name,
        dosage: med.dosage,
        frequency: sched.frequency,
        time_slots: sched.times,
        source_record_id: med.sourceRecordId,
        is_active: true,
      }).select().single();
      if (!error && data) {
        setReminders(prev => [data as Reminder, ...prev]);
        toast({ title: t("med.toast.added"), description: t("med.toast.addedDesc", { name: med.name }) });
      } else if (error) {
        toast({ title: t("med.toast.error"), description: error.message, variant: "destructive" });
      }
    }
    setTogglingKey(null);
  };

  const addManualReminder = async () => {
    if (!patientId || !newMed.name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from("medication_reminders").insert({
      patient_id: patientId,
      medication_name: newMed.name.trim(),
      dosage: newMed.dosage.trim() || null,
      frequency: newMed.frequency,
      time_slots: [newMed.time],
      notes: newMed.notes.trim() || null,
    }).select().single();
    if (error) {
      toast({ title: t("med.toast.error"), description: error.message, variant: "destructive" });
    } else if (data) {
      toast({ title: t("med.toast.added"), description: t("med.toast.addedDesc", { name: newMed.name }) });
      setShowAdd(false);
      setNewMed({ name: "", dosage: "", frequency: "daily", time: "08:00", notes: "" });
      setReminders(prev => [data as Reminder, ...prev]);
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from("medication_reminders").update({ is_active: !isActive }).eq("id", id);
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, is_active: !isActive } : r));
  };

  const deleteReminder = async (id: string) => {
    await supabase.from("medication_reminders").delete().eq("id", id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
    toast({ title: t("med.toast.removed") });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasAny = extracted.length > 0 || manualReminders.length > 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <section className="px-5 pt-8 pb-4">
        <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground">
          {t("med.title")}
        </h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed mt-2">
          {t("med.subtitle")}
        </p>
      </section>

      {/* From prescriptions */}
      {extracted.length > 0 && (
        <section className="px-5 pb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
              From your prescriptions
            </h2>
          </div>
          <div className="space-y-2">
            {extracted.map((m) => {
              const linked = reminderByName.get(m.name.toLowerCase());
              const isOn = !!linked && linked.is_active;
              const busy = togglingKey === m.name;
              return (
                <div
                  key={m.name}
                  className={`rounded-xl border bg-card p-4 transition-colors ${isOn ? "border-primary/30" : "border-border"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isOn ? "bg-primary/10" : "bg-muted"}`}>
                      <Pill className={`h-5 w-5 ${isOn ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-foreground">{m.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {m.dosage && <Badge variant="outline" className="text-[10px]">{m.dosage}</Badge>}
                        {m.schedule && (
                          <Badge variant="outline" className="text-[10px]">
                            <Clock className="h-2.5 w-2.5 mr-1" /> {m.schedule}
                          </Badge>
                        )}
                        {linked?.time_slots?.length ? (
                          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                            <Bell className="h-2.5 w-2.5 mr-1" />
                            {linked.time_slots.join(", ")}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-[10.5px] text-muted-foreground flex items-center gap-1 truncate">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="truncate">{m.sourceFileName}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        onClick={() => toggleExtracted(m)}
                        disabled={busy}
                        className="p-1 disabled:opacity-50"
                        aria-label={isOn ? "Disable reminder" : "Enable reminder"}
                      >
                        {busy
                          ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          : isOn
                            ? <ToggleRight className="h-7 w-7 text-primary" />
                            : <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                        }
                      </button>
                      <span className="text-[10px] text-muted-foreground">
                        {isOn ? "Reminder on" : "Set reminder"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Manual reminders */}
      {manualReminders.length > 0 && (
        <section className="px-5 pb-5">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
              Added manually
            </h2>
          </div>
          <div className="space-y-2">
            {manualReminders.map((r) => (
              <div key={r.id} className={`rounded-xl border bg-card p-4 transition-colors ${r.is_active ? "border-primary/20" : "border-border opacity-60"}`}>
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${r.is_active ? "bg-primary/10" : "bg-muted"}`}>
                    <Pill className={`h-5 w-5 ${r.is_active ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground">{r.medication_name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {r.dosage && (
                        <Badge variant="outline" className="text-[10px]">{r.dosage}</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        <Clock className="h-2.5 w-2.5 mr-1" />
                        {r.time_slots.join(", ")}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{t(`med.freq.${({daily:"daily",twice_daily:"twice",thrice_daily:"thrice",weekly:"weekly",as_needed:"asNeeded"} as Record<string,string>)[r.frequency] || "daily"}`)}</Badge>
                    </div>
                    {r.notes && (
                      <p className="text-[11px] text-muted-foreground mt-1.5">{r.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(r.id, r.is_active)} className="p-1.5">
                      {r.is_active
                        ? <ToggleRight className="h-6 w-6 text-primary" />
                        : <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                      }
                    </button>
                    <button onClick={() => deleteReminder(r.id)} className="p-1.5 hover:text-destructive">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add manual CTA (primary orange) — single button */}
      <section className="px-5 pb-6">
        {hasAny ? (
          <Button
            onClick={() => setShowAdd(true)}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1.5" /> {t("med.add")}
          </Button>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-1">{t("med.empty.title")}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Add a medication manually, or upload a prescription on the Records page so Vyana can extract them for you.
            </p>
            <Button
              onClick={() => setShowAdd(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-1.5" /> {t("med.empty.cta")}
            </Button>
          </div>
        )}
      </section>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              {t("med.dialog.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">{t("med.field.name")}</label>
              <Input
                placeholder={t("med.field.namePh")}
                value={newMed.name}
                onChange={(e) => setNewMed((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t("med.field.dosage")}</label>
              <Input
                placeholder={t("med.field.dosagePh")}
                value={newMed.dosage}
                onChange={(e) => setNewMed((p) => ({ ...p, dosage: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">{t("med.field.frequency")}</label>
                <Select value={newMed.frequency} onValueChange={(v) => setNewMed((p) => ({ ...p, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t("med.freq.daily")}</SelectItem>
                    <SelectItem value="twice_daily">{t("med.freq.twice")}</SelectItem>
                    <SelectItem value="thrice_daily">{t("med.freq.thrice")}</SelectItem>
                    <SelectItem value="weekly">{t("med.freq.weekly")}</SelectItem>
                    <SelectItem value="as_needed">{t("med.freq.asNeeded")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t("med.field.time")}</label>
                <Input
                  type="time"
                  value={newMed.time}
                  onChange={(e) => setNewMed((p) => ({ ...p, time: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t("med.field.notes")}</label>
              <Input
                placeholder={t("med.field.notesPh")}
                value={newMed.notes}
                onChange={(e) => setNewMed((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>{t("med.btn.cancel")}</Button>
            <Button onClick={addManualReminder} disabled={saving || !newMed.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              {t("med.btn.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicationReminders;

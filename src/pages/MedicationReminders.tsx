import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Pill, Plus, Trash2, Clock, Bell, Loader2, ToggleLeft, ToggleRight,
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

interface Reminder {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string;
  time_slots: string[];
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

const MedicationReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", dosage: "", frequency: "daily", time: "08:00", notes: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadReminders(); }, []);

  const loadReminders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: patient } = await supabase
      .from("patients").select("id").eq("user_id", session.user.id).maybeSingle();
    if (!patient) { setLoading(false); return; }
    setPatientId(patient.id);

    const { data } = await supabase
      .from("medication_reminders")
      .select("*")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false }) as { data: Reminder[] | null };

    setReminders(data || []);
    setLoading(false);
  };

  const addReminder = async () => {
    if (!patientId || !newMed.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("medication_reminders").insert({
      patient_id: patientId,
      medication_name: newMed.name.trim(),
      dosage: newMed.dosage.trim() || null,
      frequency: newMed.frequency,
      time_slots: [newMed.time],
      notes: newMed.notes.trim() || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reminder added", description: `${newMed.name} reminder set` });
      setShowAdd(false);
      setNewMed({ name: "", dosage: "", frequency: "daily", time: "08:00", notes: "" });
      await loadReminders();
    }
    setSaving(false);
  };

  const toggleReminder = async (id: string, isActive: boolean) => {
    await supabase.from("medication_reminders").update({ is_active: !isActive }).eq("id", id);
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, is_active: !isActive } : r));
  };

  const deleteReminder = async (id: string) => {
    await supabase.from("medication_reminders").delete().eq("id", id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Reminder removed" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <section className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground">
              Medications
            </h1>
            <p className="text-[14px] text-muted-foreground leading-relaxed mt-2">
              Track your medications and set reminders.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAdd(true)}
            className="bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </section>

      {reminders.length === 0 ? (
        <section className="px-5 pb-8">
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-1">No medications tracked</h2>
            <p className="text-sm text-muted-foreground mb-4">Add your medications to set up reminders.</p>
            <Button onClick={() => setShowAdd(true)} variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Add medication
            </Button>
          </div>
        </section>
      ) : (
        <section className="px-5 pb-8 space-y-2">
          {reminders.map((r) => (
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
                    <Badge variant="outline" className="text-[10px]">{r.frequency}</Badge>
                  </div>
                  {r.notes && (
                    <p className="text-[11px] text-muted-foreground mt-1.5">{r.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleReminder(r.id, r.is_active)} className="p-1.5">
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
        </section>
      )}

      {/* Tip */}
      <section className="px-5 pb-6">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-[13px] font-semibold text-foreground">Smart tip</span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Medications extracted from your doctor consultations and health records will appear here automatically in future updates.
          </p>
        </div>
      </section>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Add Medication Reminder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">Medication Name *</label>
              <Input
                placeholder="e.g. Metformin"
                value={newMed.name}
                onChange={(e) => setNewMed((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Dosage</label>
              <Input
                placeholder="e.g. 500mg"
                value={newMed.dosage}
                onChange={(e) => setNewMed((p) => ({ ...p, dosage: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Frequency</label>
                <Select value={newMed.frequency} onValueChange={(v) => setNewMed((p) => ({ ...p, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="twice_daily">Twice daily</SelectItem>
                    <SelectItem value="thrice_daily">Thrice daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="as_needed">As needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Time</label>
                <Input
                  type="time"
                  value={newMed.time}
                  onChange={(e) => setNewMed((p) => ({ ...p, time: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <Input
                placeholder="e.g. Take after meals"
                value={newMed.notes}
                onChange={(e) => setNewMed((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addReminder} disabled={saving || !newMed.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Add Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicationReminders;

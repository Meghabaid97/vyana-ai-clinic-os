import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CADENCE_LABEL, Cadence, JournalPreference, loadOrCreatePreference } from "@/lib/journalPreferences";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string | null;
  onSaved?: (pref: JournalPreference) => void;
}

const CADENCE_OPTIONS: { value: Cadence; hint: string }[] = [
  { value: "daily", hint: "Best if you have chronic conditions or daily meds" },
  { value: "frequent", hint: "A gentle 2 to 3 nudges per week" },
  { value: "weekly", hint: "A single weekly check-in" },
  { value: "off", hint: "No reminders. Log when you feel like it." },
];

const JournalCadenceSheet = ({ open, onClose, patientId, onSaved }: Props) => {
  const [pref, setPref] = useState<JournalPreference | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !patientId) return;
    void loadOrCreatePreference(patientId).then(setPref);
  }, [open, patientId]);

  const update = async (patch: Partial<JournalPreference>) => {
    if (!pref) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("journal_preferences")
      .update(patch)
      .eq("id", pref.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error("Couldn't save preference");
      return;
    }
    const next = data as JournalPreference;
    setPref(next);
    onSaved?.(next);
    toast.success("Preference updated");
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>How often should Vyana check in?</SheetTitle>
          <SheetDescription>
            We don't spam. We just remind you when it actually helps.
          </SheetDescription>
        </SheetHeader>

        {pref && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Auto-adjust cadence</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Vyana picks a smart default based on your meds and conditions.
                </p>
              </div>
              <Switch
                checked={pref.auto_cadence}
                onCheckedChange={(v) => update({ auto_cadence: v })}
                disabled={saving}
              />
            </div>

            <div className={pref.auto_cadence ? "opacity-60 pointer-events-none" : ""}>
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
                Or pick manually
              </p>
              <div className="space-y-2">
                {CADENCE_OPTIONS.map((opt) => {
                  const active = pref.cadence === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => update({ cadence: opt.value })}
                      className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{CADENCE_LABEL[opt.value]}</p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{opt.hint}</p>
                        </div>
                        {active && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default JournalCadenceSheet;

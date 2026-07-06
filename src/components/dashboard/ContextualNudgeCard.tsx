import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { pickContextualNudge, type Nudge } from "@/lib/contextualNudges";
import { logHealthRecordsAccess, assertRecordsBelongToPatient } from "@/lib/healthRecordsAudit";

interface Props {
  patientId: string | null;
  city: string | null;
}

const dismissedKey = (patientId: string, nudgeKey: string) =>
  `vyana-nudge-dismissed-${patientId}-${nudgeKey}`;

const ContextualNudgeCard = ({ patientId, city }: Props) => {
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    setDismissed(false);
    let cancelled = false;
    (async () => {
      // Pull diagnoses from any recent health_records for this patient
      const { data, error } = await supabase
        .from("health_records")
        .select("patient_id, diagnoses")
        .eq("patient_id", patientId)
        .order("uploaded_at", { ascending: false })
        .limit(20);
      if (cancelled) return;
      const safe = assertRecordsBelongToPatient(data ?? [], patientId, "ContextualNudgeCard.load");
      void logHealthRecordsAccess({
        op: "select",
        patientId,
        where: "ContextualNudgeCard.load",
        count: safe.length,
        error,
      });
      const dx: string[] = [];
      for (const row of safe) {
        const arr = (row as { diagnoses: unknown }).diagnoses;
        if (Array.isArray(arr)) {
          for (const d of arr) {
            if (typeof d === "string") dx.push(d);
            else if (d && typeof d === "object" && "name" in d && typeof (d as { name: unknown }).name === "string") {
              dx.push((d as { name: string }).name);
            }
          }
        }
      }
      const n = pickContextualNudge({ diagnoses: dx, city });
      if (!n) { setNudge(null); return; }
      if (localStorage.getItem(dismissedKey(patientId, n.key))) {
        setNudge(null);
        return;
      }
      setNudge(n);
    })();
    return () => { cancelled = true; };
  }, [patientId, city]);

  if (!nudge || dismissed || !patientId) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-0 pt-2 pb-1">
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 flex items-start gap-3">
        <span className="text-xl leading-none mt-0.5">{nudge.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground leading-tight">{nudge.text}</p>
          {nudge.hint && (
            <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug">{nudge.hint}</p>
          )}
        </div>
        <button
          onClick={() => {
            localStorage.setItem(dismissedKey(patientId, nudge.key), "1");
            setDismissed(true);
          }}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground p-1 -mr-1 -mt-0.5"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
};

export default ContextualNudgeCard;

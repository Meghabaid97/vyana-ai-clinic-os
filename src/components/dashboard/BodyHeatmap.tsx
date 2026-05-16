import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface Props {
  patientId: string | null;
}

interface LogRow {
  id: string;
  symptom_type: string;
  custom_symptom_name: string | null;
  severity: number;
  body_location: string | null;
  logged_at: string;
  notes: string | null;
}

// Tappable body zones. Keywords are matched (case-insensitive) against
// symptom_logs.body_location AND symptom_type / custom_symptom_name.
const ZONES: Array<{ id: string; label: string; keywords: string[]; cx: number; cy: number; r: number }> = [
  { id: "head",      label: "Head",         keywords: ["head", "scalp", "forehead", "migraine", "headache"], cx: 100, cy: 32,  r: 22 },
  { id: "eyes",      label: "Eyes / Face",  keywords: ["eye", "vision", "face", "cheek", "jaw"], cx: 100, cy: 50,  r: 12 },
  { id: "throat",    label: "Throat / Neck",keywords: ["throat", "neck", "tonsil", "thyroid"], cx: 100, cy: 70,  r: 12 },
  { id: "chest",     label: "Chest",        keywords: ["chest", "heart", "breath", "lung", "wheeze", "cough", "asthma"], cx: 100, cy: 105, r: 26 },
  { id: "abdomen",   label: "Abdomen",      keywords: ["abdomen", "stomach", "belly", "gut", "nausea", "vomit", "diarr"], cx: 100, cy: 150, r: 24 },
  { id: "pelvis",    label: "Pelvis / Lower back", keywords: ["pelvis", "lower back", "hip", "cycle", "period"], cx: 100, cy: 188, r: 22 },
  { id: "left-arm",  label: "Left arm",     keywords: ["left arm", "left shoulder", "left elbow", "left wrist", "left hand"], cx: 62,  cy: 120, r: 14 },
  { id: "right-arm", label: "Right arm",    keywords: ["right arm", "right shoulder", "right elbow", "right wrist", "right hand"], cx: 138, cy: 120, r: 14 },
  { id: "left-leg",  label: "Left leg",     keywords: ["left leg", "left knee", "left ankle", "left foot"], cx: 86,  cy: 250, r: 16 },
  { id: "right-leg", label: "Right leg",    keywords: ["right leg", "right knee", "right ankle", "right foot"], cx: 114, cy: 250, r: 16 },
  { id: "back",      label: "Back",         keywords: ["back pain", "upper back", "spine"], cx: 100, cy: 130, r: 14 },
];

const matchesZone = (log: LogRow, kws: string[]) => {
  const hay = `${log.body_location || ""} ${log.symptom_type || ""} ${log.custom_symptom_name || ""}`.toLowerCase();
  return kws.some(k => hay.includes(k));
};

const heatColor = (count: number) => {
  if (count === 0) return "transparent";
  if (count < 3)   return "hsl(var(--primary) / 0.18)";
  if (count < 8)   return "hsl(var(--primary) / 0.38)";
  return "hsl(var(--primary) / 0.62)";
};

const BodyHeatmap = ({ patientId }: Props) => {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [openZone, setOpenZone] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) { setLogs([]); return; }
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("symptom_logs")
        .select("id, symptom_type, custom_symptom_name, severity, body_location, logged_at, notes")
        .eq("patient_id", patientId)
        .gte("logged_at", ninetyDaysAgo)
        .order("logged_at", { ascending: false })
        .limit(500);
      if (!cancelled) setLogs((data as LogRow[]) || []);
    })();
    return () => { cancelled = true; };
  }, [patientId]);

  const zoneCounts = useMemo(() => {
    const out: Record<string, LogRow[]> = {};
    for (const z of ZONES) {
      out[z.id] = logs.filter(l => matchesZone(l, z.keywords));
    }
    return out;
  }, [logs]);

  const totalMapped = Object.values(zoneCounts).reduce((s, arr) => s + arr.length, 0);
  const activeZone = openZone ? ZONES.find(z => z.id === openZone) : null;
  const activeLogs = openZone ? zoneCounts[openZone] : [];

  return (
    <section className="pb-5">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h2 className="text-[15px] sm:text-base font-bold text-foreground">Body heatmap</h2>
          <span className="text-[11px] text-muted-foreground">last 90 days</span>
        </div>
        <p className="text-[12.5px] text-muted-foreground mb-4 leading-snug">
          Tap any glowing area to see every symptom logged there.
        </p>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-[12.5px] text-muted-foreground">
            No symptoms logged yet. Use the journal to start building your map.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="mx-auto">
              <svg viewBox="0 0 200 320" className="w-[180px] sm:w-[200px] h-auto" aria-label="Body silhouette">
                {/* Silhouette path — simplified front-facing figure */}
                <g fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1">
                  <circle cx="100" cy="32" r="20" />
                  <path d="M82,52 Q100,46 118,52 L122,76 Q140,82 144,110 L138,160 L132,200 L122,200 L118,150 L114,200 L106,290 L96,290 L92,200 L86,150 L82,200 L72,200 L66,160 L60,110 Q64,82 82,76 Z" />
                  <path d="M62,86 L52,150 L60,158 L70,108 Z" />
                  <path d="M138,86 L148,150 L140,158 L130,108 Z" />
                </g>
                {/* Heat zones */}
                {ZONES.map(z => {
                  const count = zoneCounts[z.id].length;
                  if (count === 0) return null;
                  return (
                    <g key={z.id} className="cursor-pointer" onClick={() => setOpenZone(z.id)}>
                      <circle cx={z.cx} cy={z.cy} r={z.r} fill={heatColor(count)} stroke="hsl(var(--primary))" strokeWidth="1.2" strokeOpacity="0.6" />
                      <text x={z.cx} y={z.cy + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="hsl(var(--foreground))">{count}</text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Most-logged areas
              </p>
              <div className="space-y-1.5">
                {ZONES
                  .map(z => ({ z, n: zoneCounts[z.id].length }))
                  .filter(x => x.n > 0)
                  .sort((a, b) => b.n - a.n)
                  .slice(0, 5)
                  .map(({ z, n }) => (
                    <button
                      key={z.id}
                      onClick={() => setOpenZone(z.id)}
                      className="w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      <span className="text-[13px] font-medium text-foreground">{z.label}</span>
                      <span className="text-[11px] font-semibold text-primary tabular-nums">{n} log{n === 1 ? "" : "s"}</span>
                    </button>
                  ))}
                {totalMapped === 0 && (
                  <p className="text-[12px] text-muted-foreground">
                    Logs exist but none have a body area set. Add a location next time you log.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Sheet open={!!openZone} onOpenChange={(o) => !o && setOpenZone(null)}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{activeZone?.label}</SheetTitle>
            <SheetDescription>
              {activeLogs.length} entr{activeLogs.length === 1 ? "y" : "ies"} in the last 90 days.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2 pb-4">
            {activeLogs.map(l => (
              <div key={l.id} className="rounded-lg border border-border p-3 bg-card">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13.5px] font-semibold text-foreground capitalize">
                    {(l.custom_symptom_name || l.symptom_type || "symptom").replace(/_/g, " ")}
                  </p>
                  <span className="text-[11px] font-semibold text-primary tabular-nums shrink-0">
                    severity {l.severity}/10
                  </span>
                </div>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">
                  {new Date(l.logged_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  {l.body_location ? ` · ${l.body_location}` : ""}
                </p>
                {l.notes && <p className="text-[12px] text-foreground/80 mt-1.5 leading-snug">{l.notes}</p>}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default BodyHeatmap;

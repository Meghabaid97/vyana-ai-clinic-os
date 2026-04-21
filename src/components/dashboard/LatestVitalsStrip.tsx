import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, ArrowDown, Minus, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  patientId: string | null;
}

interface VitalDef {
  key: string;
  label: string;
  unit: string;
  priority: number; // lower = more important
  range?: { low?: number; high?: number };
  decimals?: number;
}

// Clinical-priority order. We pick the top N that the user actually has data for.
const VITAL_DEFS: VitalDef[] = [
  { key: "bp_systolic", label: "BP (sys)", unit: "mmHg", priority: 1, range: { high: 140 }, decimals: 0 },
  { key: "hba1c", label: "HbA1c", unit: "%", priority: 2, range: { high: 6.5 }, decimals: 1 },
  { key: "fasting_blood_sugar", label: "Fasting glucose", unit: "mg/dL", priority: 3, range: { low: 70, high: 126 }, decimals: 0 },
  { key: "ldl", label: "LDL", unit: "mg/dL", priority: 4, range: { high: 160 }, decimals: 0 },
  { key: "total_cholesterol", label: "Cholesterol", unit: "mg/dL", priority: 5, range: { high: 240 }, decimals: 0 },
  { key: "triglycerides", label: "Triglycerides", unit: "mg/dL", priority: 6, range: { high: 200 }, decimals: 0 },
  { key: "creatinine", label: "Creatinine", unit: "mg/dL", priority: 7, range: { high: 1.3 }, decimals: 2 },
  { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", priority: 8, range: { low: 12 }, decimals: 1 },
  { key: "tsh", label: "TSH", unit: "mIU/L", priority: 9, range: { low: 0.4, high: 4.5 }, decimals: 2 },
  { key: "weight", label: "Weight", unit: "kg", priority: 10, decimals: 1 },
  { key: "heart_rate", label: "Heart rate", unit: "bpm", priority: 11, range: { low: 60, high: 100 }, decimals: 0 },
];

interface VitalSeries {
  def: VitalDef;
  values: { value: number; recorded_at: string }[];
  latest: number;
  prior: number | null;
}

const fmt = (v: number, d = 1) => (Number.isInteger(v) ? v.toString() : v.toFixed(d));

const Sparkline = ({ values, status }: { values: number[]; status: "ok" | "warn" }) => {
  if (values.length < 2) {
    return <div className="h-6" />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 64;
  const h = 20;
  const step = w / (values.length - 1);
  const pts = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(" ");
  const stroke = status === "warn" ? "hsl(var(--destructive))" : "hsl(var(--primary))";
  return (
    <svg width={w} height={h} className="block">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const isOutOfRange = (v: number, range?: VitalDef["range"]) => {
  if (!range) return false;
  if (range.high != null && v > range.high) return true;
  if (range.low != null && v < range.low) return true;
  return false;
};

const LatestVitalsStrip = ({ patientId }: Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<VitalSeries[]>([]);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      setSeries([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("vital_history")
        .select("vitals, recorded_at")
        .eq("patient_id", patientId)
        .order("recorded_at", { ascending: false })
        .limit(10);

      if (cancelled) return;
      const rows = (data ?? []) as { vitals: Record<string, number | null>; recorded_at: string }[];

      const built: VitalSeries[] = [];
      for (const def of VITAL_DEFS) {
        const points = rows
          .map((r) => ({ value: r.vitals?.[def.key] as number | null, recorded_at: r.recorded_at }))
          .filter((p): p is { value: number; recorded_at: string } => typeof p.value === "number" && !Number.isNaN(p.value))
          .reverse(); // oldest -> newest for sparkline
        if (points.length === 0) continue;
        built.push({
          def,
          values: points,
          latest: points[points.length - 1].value,
          prior: points.length >= 2 ? points[points.length - 2].value : null,
        });
      }
      built.sort((a, b) => a.def.priority - b.def.priority);
      setSeries(built.slice(0, 6));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [patientId]);

  const tiles = useMemo(() => series, [series]);

  const handleNav = (key: string) => {
    navigate(`/app/trends?vital=${encodeURIComponent(key)}`);
  };

  return (
    <section className="px-4 sm:px-5 pb-5 lg:px-0">
      <div className="flex items-baseline justify-between mb-2.5">
        <h2 className="text-lg font-bold text-foreground leading-tight">
          Your latest <span className="text-primary">vitals</span>
        </h2>
        <button
          onClick={() => navigate("/app/trends")}
          className="text-xs text-primary font-medium shrink-0"
        >
          See all trends
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : tiles.length === 0 ? (
        <button
          onClick={() => navigate("/app/records")}
          className="w-full rounded-xl border border-dashed border-border bg-card p-5 flex items-center gap-3 text-left hover:border-primary/40 transition-colors"
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Upload a report to see your vitals</p>
            <p className="text-xs text-muted-foreground mt-0.5">BP, HbA1c, cholesterol and more, tracked automatically.</p>
          </div>
        </button>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 sm:overflow-visible scrollbar-none">
          {tiles.map(({ def, values, latest, prior }) => {
            const warn = isOutOfRange(latest, def.range);
            const delta = prior != null ? latest - prior : null;
            const dir = delta == null || Math.abs(delta) < 0.0001 ? "flat" : delta > 0 ? "up" : "down";
            const DirIcon = dir === "up" ? ArrowUp : dir === "down" ? ArrowDown : Minus;
            const dirColor = warn
              ? "text-destructive"
              : dir === "flat"
                ? "text-muted-foreground"
                : "text-foreground/60";
            return (
              <button
                key={def.key}
                onClick={() => handleNav(def.key)}
                className={`snap-start shrink-0 w-[44vw] sm:w-auto rounded-xl border p-3 text-left transition-colors hover:border-primary/30 ${
                  warn ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"
                }`}
              >
                <p className="text-[11px] font-medium text-muted-foreground truncate">{def.label}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className={`text-xl font-bold ${warn ? "text-destructive" : "text-foreground"}`}>
                    {fmt(latest, def.decimals ?? 1)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{def.unit}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <Sparkline values={values.map((v) => v.value)} status={warn ? "warn" : "ok"} />
                  <span className={`flex items-center text-[10px] font-medium ${dirColor}`}>
                    <DirIcon className="h-3 w-3" />
                    {delta != null && dir !== "flat" ? Math.abs(delta).toFixed(def.decimals ?? 1) : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default LatestVitalsStrip;

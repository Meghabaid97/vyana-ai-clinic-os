import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, ArrowDown, Minus, Upload, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  vitalStatus,
  normalizeVital,
  formatVital,
  STATUS_TONE,
  STATUS_COPY,
  type VitalStatus,
} from "@/lib/vitalStatus";

interface Props {
  patientId: string | null;
}

interface VitalDef {
  key: string;
  label: string;
  unit: string;
  emoji: string;
  priority: number;
  /** clinical healthy band */
  range?: { low?: number; high?: number };
  /** axis we draw the bar across (so the dot has somewhere to sit) */
  axis: { min: number; max: number };
  decimals?: number;
}

const VITAL_DEFS: VitalDef[] = [
  { key: "bp_systolic", label: "Blood pressure", unit: "mmHg", emoji: "💓", priority: 1, range: { low: 90, high: 130 }, axis: { min: 70, max: 180 }, decimals: 0 },
  { key: "hba1c", label: "HbA1c", unit: "%", emoji: "🩸", priority: 2, range: { high: 6.5 }, axis: { min: 4, max: 12 }, decimals: 1 },
  { key: "fasting_blood_sugar", label: "Fasting sugar", unit: "mg/dL", emoji: "🍚", priority: 3, range: { low: 70, high: 126 }, axis: { min: 50, max: 220 }, decimals: 0 },
  { key: "ldl", label: "LDL", unit: "mg/dL", emoji: "🥚", priority: 4, range: { high: 130 }, axis: { min: 50, max: 220 }, decimals: 0 },
  { key: "total_cholesterol", label: "Cholesterol", unit: "mg/dL", emoji: "🧈", priority: 5, range: { high: 200 }, axis: { min: 100, max: 320 }, decimals: 0 },
  { key: "triglycerides", label: "Triglycerides", unit: "mg/dL", emoji: "🥑", priority: 6, range: { high: 150 }, axis: { min: 50, max: 400 }, decimals: 0 },
  { key: "creatinine", label: "Creatinine", unit: "mg/dL", emoji: "🫘", priority: 7, range: { low: 0.6, high: 1.3 }, axis: { min: 0.3, max: 2.5 }, decimals: 2 },
  { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", emoji: "🩹", priority: 8, range: { low: 12, high: 17 }, axis: { min: 6, max: 20 }, decimals: 1 },
  { key: "tsh", label: "TSH", unit: "mIU/L", emoji: "🦋", priority: 9, range: { low: 0.4, high: 4.5 }, axis: { min: 0, max: 10 }, decimals: 2 },
  { key: "weight", label: "Weight", unit: "kg", emoji: "⚖️", priority: 10, axis: { min: 30, max: 150 }, decimals: 1 },
  { key: "heart_rate", label: "Heart rate", unit: "bpm", emoji: "❤️", priority: 11, range: { low: 60, high: 100 }, axis: { min: 40, max: 160 }, decimals: 0 },
];

interface VitalSeries {
  def: VitalDef;
  values: { value: number; recorded_at: string }[];
  latest: number;
  prior: number | null;
}

const fmt = (key: string, v: number, d = 1) => formatVital(key, v, d);

const Sparkline = ({ values, tone }: { values: number[]; tone: VitalStatus }) => {
  const pathRef = useRef<SVGPolylineElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (values.length < 2) return <div className="h-5" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 56;
  const h = 18;
  const step = w / (values.length - 1);
  const pts = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(" ");
  // approximate path length for dash animation (slightly over true length is fine)
  const approxLen = Math.ceil(w * 1.6);
  return (
    <svg width={w} height={h} className="block opacity-90">
      <polyline
        ref={pathRef}
        points={pts}
        fill="none"
        stroke={STATUS_TONE[tone].stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className={`vital-sparkline-path ${visible ? "is-visible" : ""}`}
        style={{ ["--spark-len" as string]: approxLen }}
      />
    </svg>
  );
};

/** Range bar — shows the healthy band as a tinted segment, with a dot at the user's value. */
const RangeBar = ({
  value,
  axis,
  range,
  status,
}: {
  value: number;
  axis: { min: number; max: number };
  range?: VitalDef["range"];
  status: VitalStatus;
}) => {
  const span = axis.max - axis.min || 1;
  const pct = (n: number) => Math.max(0, Math.min(100, ((n - axis.min) / span) * 100));
  const dot = pct(value);
  const bandLeft = pct(range?.low ?? axis.min);
  const bandRight = pct(range?.high ?? axis.max);
  const bandWidth = Math.max(2, bandRight - bandLeft);
  const tone = STATUS_TONE[status];
  return (
    <div className="relative h-1.5 w-full rounded-full bg-muted">
      {/* healthy band — always sage, regardless of current dot status */}
      <div
        className="absolute top-0 h-1.5 rounded-full bg-status-normal/25"
        style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
      />
      {/* dot */}
      <div
        className={`absolute -top-[3px] h-[12px] w-[12px] rounded-full border-2 border-background ${tone.bar}`}
        style={{ left: `calc(${dot}% - 6px)` }}
      />
    </div>
  );
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
          .map((r) => {
            const raw = r.vitals?.[def.key] as number | null;
            if (typeof raw !== "number" || Number.isNaN(raw)) return null;
            return { value: normalizeVital(def.key, raw), recorded_at: r.recorded_at };
          })
          .filter((p): p is { value: number; recorded_at: string } => p !== null)
          .reverse();
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

  /** Build a friendly headline summarizing today's vitals. */
  const headline = useMemo(() => {
    if (tiles.length === 0) return null;
    const okCount = tiles.filter((t) => vitalStatus(t.latest, t.def.range) === "normal").length;
    const flagged = tiles.find((t) => {
      const s = vitalStatus(t.latest, t.def.range);
      return s === "high" || s === "low";
    });
    const watch = tiles.find((t) => vitalStatus(t.latest, t.def.range) === "watch");
    if (flagged) {
      return { mood: "needs a chat", emoji: flagged.def.emoji, detail: `${flagged.def.label.toLowerCase()} is off-band` };
    }
    if (watch) {
      return { mood: "mostly good", emoji: "👀", detail: `keep an eye on ${watch.def.label.toLowerCase()}` };
    }
    return { mood: "looking great", emoji: "✨", detail: `${okCount} of ${tiles.length} vitals on point` };
  }, [tiles]);

  const handleNav = (key: string) => {
    navigate(`/app/trends?vital=${encodeURIComponent(key)}`);
  };

  return (
    <section className="px-4 sm:px-5 pb-5 lg:px-0">
      {/* Playful headline card */}
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground leading-tight">
          Your vitals are <span className="text-primary">{headline?.mood ?? "checking in"}</span>
        </h2>
        <button
          onClick={() => navigate("/app/trends")}
          className="text-xs text-primary font-medium shrink-0"
        >
          See all trends
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : tiles.length === 0 ? (
        <button
          onClick={() => navigate("/app/records")}
          className="w-full rounded-2xl border border-dashed border-border bg-card p-5 flex items-center gap-3 text-left hover:border-primary/40 transition-colors"
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
        <>
          {headline && (
            <div className="mb-3 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 to-transparent px-4 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-background border border-primary/20 flex items-center justify-center text-lg shrink-0">
                {headline.emoji}
              </div>
              <p className="text-[13px] text-foreground/80 leading-snug">
                <Sparkles className="inline h-3 w-3 text-primary mr-1 -mt-0.5" />
                {headline.detail}.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {tiles.map(({ def, values, latest, prior }) => {
              const status = vitalStatus(latest, def.range);
              const tone = STATUS_TONE[status];
              const delta = prior != null ? latest - prior : null;
              const dir = delta == null || Math.abs(delta) < 0.0001 ? "flat" : delta > 0 ? "up" : "down";
              const DirIcon = dir === "up" ? ArrowUp : dir === "down" ? ArrowDown : Minus;
              return (
                <button
                  key={def.key}
                  onClick={() => handleNav(def.key)}
                  className="group rounded-2xl border border-border bg-card p-3 sm:p-3.5 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-muted flex items-center justify-center text-base sm:text-lg shrink-0">
                      {def.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10.5px] sm:text-[11px] font-medium text-muted-foreground truncate">{def.label}</p>
                        <span
                          aria-hidden
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${tone.bar} ${status !== "normal" ? "vital-status-dot" : ""}`}
                        />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[17px] sm:text-[19px] font-bold text-foreground leading-none">
                          {fmt(def.key, latest, def.decimals ?? 1)}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">{def.unit}</span>
                      </div>
                    </div>
                    <div className="ml-auto shrink-0 self-start pt-0.5">
                      <Sparkline values={values.map((v) => v.value)} tone={status} />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className={`text-[9.5px] sm:text-[10px] font-semibold rounded-full px-1.5 py-0.5 whitespace-nowrap ${tone.chip}`}>
                      {STATUS_COPY[status]}
                    </span>
                    <span className={`ml-auto flex items-center gap-0.5 text-[10px] font-medium ${dir === "flat" ? "text-muted-foreground" : "text-foreground/70"}`}>
                      <DirIcon className="h-3 w-3" />
                      {delta != null && dir !== "flat" ? Math.abs(delta).toFixed(def.decimals ?? 1) : "·"}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <RangeBar value={latest} axis={def.axis} range={def.range} status={status} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Color legend — quietly explains the dot colors used on each tile */}
          <ul
            aria-label="What the colors mean"
            className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10.5px] text-muted-foreground"
          >
            {(["normal", "watch", "high", "low"] as VitalStatus[]).map((s) => (
              <li key={s} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${STATUS_TONE[s].bar}`}
                />
                <span className="capitalize">{s}</span>
                <span className="text-muted-foreground/70">· {STATUS_COPY[s]}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
};

export default LatestVitalsStrip;

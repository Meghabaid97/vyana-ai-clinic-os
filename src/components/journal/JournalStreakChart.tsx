import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  patientId: string | null;
  /** Bumps when a new log is added so the chart refreshes. */
  refreshKey?: number;
}

const DAYS = 28;
const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

const dateKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Compact 4-week journal check-in heatmap.
 * Columns = weeks (oldest left, current week right).
 * Rows = Mon..Sun.
 * A cell is "filled" if at least one symptom_logs row exists for that day.
 */
const JournalStreakChart = ({ patientId, refreshKey }: Props) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = startOfDay(new Date());
      since.setDate(since.getDate() - (DAYS - 1));
      const { data } = await supabase
        .from("symptom_logs")
        .select("logged_at")
        .eq("patient_id", patientId)
        .gte("logged_at", since.toISOString())
        .order("logged_at", { ascending: true });
      if (cancelled) return;
      const map: Record<string, number> = {};
      (data ?? []).forEach((row: { logged_at: string }) => {
        const k = dateKey(new Date(row.logged_at));
        map[k] = (map[k] ?? 0) + 1;
      });
      setCounts(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, refreshKey]);

  // Build a Mon-anchored 4-week grid ending on the current week.
  // Find this week's Monday (oldest Monday = 3 weeks before).
  const today = startOfDay(new Date());
  const dayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - dayOfWeek);
  const firstMonday = new Date(thisMonday);
  firstMonday.setDate(thisMonday.getDate() - 7 * 3); // 4 weeks total

  const weeks: { date: Date; key: string; inFuture: boolean; isToday: boolean; count: number }[][] = [];
  for (let w = 0; w < 4; w++) {
    const week: typeof weeks[number] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(firstMonday);
      date.setDate(firstMonday.getDate() + w * 7 + d);
      const key = dateKey(date);
      week.push({
        date,
        key,
        inFuture: date.getTime() > today.getTime(),
        isToday: date.getTime() === today.getTime(),
        count: counts[key] ?? 0,
      });
    }
    weeks.push(week);
  }

  // Total check-ins shown
  const totalLogs = Object.values(counts).reduce((a, b) => a + b, 0);
  const daysActive = Object.values(counts).filter((c) => c > 0).length;

  const cellClass = (cell: typeof weeks[number][number]) => {
    if (cell.inFuture) return "bg-muted/30";
    if (cell.count === 0) return "bg-muted/60";
    if (cell.count === 1) return "bg-primary/35";
    if (cell.count === 2) return "bg-primary/65";
    return "bg-primary";
  };

  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
          Last 4 weeks
        </p>
        <p className="text-[10.5px] text-muted-foreground">
          {loading ? "…" : `${daysActive} active days · ${totalLogs} logs`}
        </p>
      </div>

      <div className="flex items-start gap-1.5">
        {/* Weekday labels */}
        <div className="flex flex-col gap-[3px] pt-[1px] mr-0.5">
          {WEEKDAY_LABELS.map((l, i) => (
            <span
              key={i}
              className="h-[12px] text-[8.5px] leading-[12px] text-muted-foreground/70 w-2 text-center"
              aria-hidden="true"
            >
              {i % 2 === 0 ? l : ""}
            </span>
          ))}
        </div>

        {/* Week columns */}
        <div className="flex-1 grid grid-cols-4 gap-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell) => (
                <div
                  key={cell.key}
                  title={
                    cell.inFuture
                      ? ""
                      : `${cell.date.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })} · ${cell.count} log${cell.count === 1 ? "" : "s"}`
                  }
                  className={`h-[12px] rounded-[3px] transition-colors ${cellClass(cell)} ${
                    cell.isToday ? "ring-1 ring-primary ring-offset-1 ring-offset-background" : ""
                  }`}
                  aria-label={
                    cell.inFuture
                      ? "Future day"
                      : `${cell.count} log${cell.count === 1 ? "" : "s"} on ${cell.key}`
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-1 text-[9.5px] text-muted-foreground/80">
        <span>Less</span>
        <span className="h-2 w-2 rounded-[2px] bg-muted/60" />
        <span className="h-2 w-2 rounded-[2px] bg-primary/35" />
        <span className="h-2 w-2 rounded-[2px] bg-primary/65" />
        <span className="h-2 w-2 rounded-[2px] bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
};

export default JournalStreakChart;

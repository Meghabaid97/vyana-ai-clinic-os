// Shared freshness helpers for symptom journal data.
// Window: last 90 days. Stale threshold: > 14 days since most recent log.

export const SYMPTOM_WINDOW_DAYS = 90;
export const STALE_AFTER_DAYS = 14;

export function symptomWindowStartIso(days: number = SYMPTOM_WINDOW_DAYS): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export interface FreshnessSummary {
  count: number;
  latestAt: Date | null;
  daysSinceLatest: number | null;
  isStale: boolean;
  label: string; // e.g. "Updated 2d ago", "No logs in 90d"
}

export function summarizeFreshness(
  logs: Array<{ logged_at?: string | null }> | null | undefined,
  windowDays: number = SYMPTOM_WINDOW_DAYS,
): FreshnessSummary {
  const list = (logs ?? []).filter((l) => l?.logged_at);
  const count = list.length;
  if (count === 0) {
    return {
      count: 0,
      latestAt: null,
      daysSinceLatest: null,
      isStale: true,
      label: `No logs in ${windowDays}d`,
    };
  }
  const latestAt = list.reduce<Date>((acc, l) => {
    const d = new Date(l.logged_at as string);
    return d > acc ? d : acc;
  }, new Date(0));
  const daysSinceLatest = Math.floor((Date.now() - latestAt.getTime()) / 86400000);
  const isStale = daysSinceLatest > STALE_AFTER_DAYS;

  let label: string;
  if (daysSinceLatest <= 0) label = "Updated today";
  else if (daysSinceLatest === 1) label = "Updated yesterday";
  else if (daysSinceLatest < 7) label = `Updated ${daysSinceLatest}d ago`;
  else if (daysSinceLatest < 30) label = `Updated ${Math.floor(daysSinceLatest / 7)}w ago`;
  else label = `Updated ${Math.floor(daysSinceLatest / 30)}mo ago`;

  return { count, latestAt, daysSinceLatest, isStale, label };
}

export function formatFreshDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

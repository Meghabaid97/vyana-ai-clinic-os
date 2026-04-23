import { Skeleton } from "@/components/ui/skeleton";

/**
 * Page-level skeleton screens.
 *
 * Each component mirrors the *real* layout of the page it stands in for —
 * same spacing, same card silhouettes — so the swap from skeleton → content
 * doesn't shift layout. Pure presentational, no data deps.
 */

export const RecordsTabSkeleton = () => (
  <div className="space-y-4" aria-label="Loading records" role="status">
    {/* Header card mirror */}
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </div>
    </div>

    {/* Privacy strip mirror */}
    <Skeleton className="h-10 rounded-xl" />

    {/* Tabs row mirror */}
    <div className="flex flex-wrap gap-1 bg-muted/60 p-1 rounded-xl">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-7 flex-1 min-w-[68px] rounded-lg" />
      ))}
    </div>

    {/* Record rows mirror */}
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-3.5">
          <div className="flex items-start gap-3">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
              <div className="flex gap-1.5 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const BriefingSkeleton = () => (
  <div className="animate-fade-in" aria-label="Loading briefing" role="status">
    <section className="px-5 pt-8 pb-4 space-y-2">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-3.5 w-72 max-w-full" />
    </section>
    <section className="px-5 pb-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center space-y-4">
        <Skeleton className="h-14 w-14 rounded-2xl mx-auto" />
        <Skeleton className="h-5 w-48 mx-auto" />
        <Skeleton className="h-3 w-64 mx-auto" />
        <Skeleton className="h-3 w-56 mx-auto" />
        <div className="rounded-lg bg-background/60 border border-border p-3 max-w-xs mx-auto space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 rounded-md max-w-xs mx-auto" />
      </div>
    </section>
  </div>
);

/** Skeleton stand-in for a populated briefing while the AI is generating. */
export const BriefingResultSkeleton = () => (
  <div className="space-y-4 px-5 pb-4" aria-label="Generating briefing" role="status">
    {/* Share row mirror */}
    <div className="flex gap-2">
      <Skeleton className="h-10 flex-1 rounded-md" />
      <Skeleton className="h-10 w-10 rounded-md" />
      <Skeleton className="h-10 w-10 rounded-md" />
    </div>
    {/* 3 sections of varying sizes */}
    {[120, 160, 200].map((h, i) => (
      <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-9/12" />
        <div style={{ height: h - 92 }} />
      </div>
    ))}
  </div>
);

export const TrendsSkeleton = () => (
  <div
    className="animate-fade-in px-4 sm:px-5 pt-4 pb-6 space-y-4"
    aria-label="Loading trends"
    role="status"
  >
    {/* PageHero mirror */}
    <div className="space-y-2">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-3.5 w-72 max-w-full" />
    </div>

    {/* Changes-since-last-visit card */}
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3.5 w-32" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-12" />
        </div>
      ))}
    </div>

    {/* Stats row mirror */}
    <div className="flex gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-xl border border-border bg-card p-3 text-center space-y-1.5"
        >
          <Skeleton className="h-5 w-8 mx-auto" />
          <Skeleton className="h-2.5 w-12 mx-auto" />
        </div>
      ))}
    </div>

    {/* Vital cards grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-8 w-24" />
          {/* Mini sparkline placeholder */}
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

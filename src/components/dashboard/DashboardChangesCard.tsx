import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ArrowUp, ArrowDown, Pill, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Change, computeChangesSinceLastVisit, SAMPLE_CHANGES } from "@/lib/changesSinceLastVisit";

interface Props {
  patientId: string | null;
}

const severityClass = (s: Change["severity"]) => {
  if (s === "alert") return "border-destructive/30 bg-destructive/5";
  if (s === "monitor") return "border-yellow-500/30 bg-yellow-500/5";
  return "border-border bg-card";
};

const ChangeIcon = ({ c }: { c: Change }) => {
  if (c.kind === "vital_up") return <ArrowUp className="h-3.5 w-3.5 text-destructive" />;
  if (c.kind === "vital_down") return <ArrowDown className="h-3.5 w-3.5 text-blue-500" />;
  if (c.kind === "new_med") return <Pill className="h-3.5 w-3.5 text-primary" />;
  return <FileText className="h-3.5 w-3.5 text-primary" />;
};

const DashboardChangesCard = ({ patientId }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const onTrendsPage = location.pathname.startsWith("/app/trends");
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<Change[]>([]);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setChanges(SAMPLE_CHANGES);
      setIsDemo(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await computeChangesSinceLastVisit(patientId);
        if (cancelled) return;
        if (result.length === 0) {
          setChanges(SAMPLE_CHANGES);
          setIsDemo(true);
        } else {
          setChanges(result);
          setIsDemo(false);
        }
      } catch (e) {
        console.error("Changes load error:", e);
        if (!cancelled) {
          setChanges(SAMPLE_CHANGES);
          setIsDemo(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [patientId]);

  return (
    <section className="px-4 sm:px-5 pb-5">
      <div className="flex items-baseline justify-between mb-2.5">
        <h2 className="text-lg font-bold text-foreground leading-tight">
          What changed{" "}
          <span className="text-primary">since your last visit</span>
        </h2>
        {!onTrendsPage && (
          <button
            onClick={() => navigate("/app/trends")}
            className="text-xs text-primary font-medium flex items-center gap-1 shrink-0"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {isDemo && (
        <p className="mb-2.5 text-[11px] text-muted-foreground italic">
          Demo data. Your real changes appear here once you upload reports.
        </p>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {changes.map((c, i) => (
            <button
              key={i}
              onClick={() => !onTrendsPage && navigate("/app/trends")}
              disabled={onTrendsPage}
              className={`w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${onTrendsPage ? "cursor-default" : "hover:border-primary/30"} ${severityClass(c.severity)}`}
            >
              <div className="h-7 w-7 rounded-lg bg-background flex items-center justify-center shrink-0 mt-0.5">
                <ChangeIcon c={c} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground leading-tight">{c.label}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug truncate">{c.detail}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 mt-1">{c.when}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default DashboardChangesCard;

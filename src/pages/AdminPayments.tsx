import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type EventRow = {
  event_name: string;
  properties: any;
  user_id: string | null;
  created_at: string;
};

const RANGES = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
] as const;

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
const fmtINR = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const pct = (a: number, b: number) => (b === 0 ? "—" : `${((a / b) * 100).toFixed(1)}%`);

export default function AdminPayments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[1]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [activeSubs, setActiveSubs] = useState(0);
  const [pastDue, setPastDue] = useState(0);
  const [planMix, setPlanMix] = useState<{ plan: string; cycle: string; count: number }[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth", { replace: true }); return; }
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id);
      const isAdmin = (roles || []).some((r) => r.role === "admin");
      if (!isAdmin) { toast.error("Admin access required"); navigate("/", { replace: true }); return; }
      setAuthorized(true);
    };
    void init();
  }, [navigate]);

  useEffect(() => {
    if (!authorized) return;
    void load();
  }, [authorized, range]);

  const load = async () => {
    setLoading(true);
    try {
      const since = new Date(Date.now() - range.days * 86400_000).toISOString();
      const [{ data: evts }, { data: subs }] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("event_name, properties, user_id, created_at")
          .in("event_name", ["checkout_opened", "payment_succeeded", "payment_failed"])
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(5000),
        supabase
          .from("subscriptions")
          .select("plan, billing_cycle, status")
          .neq("plan", "free"),
      ]);
      setEvents((evts ?? []) as EventRow[]);
      const subRows = (subs ?? []) as any[];
      setActiveSubs(subRows.filter((s) => s.status === "active").length);
      setPastDue(subRows.filter((s) => s.status === "past_due").length);
      const mix: Record<string, number> = {};
      for (const s of subRows) {
        const key = `${s.plan}·${s.billing_cycle ?? "monthly"}`;
        mix[key] = (mix[key] ?? 0) + 1;
      }
      setPlanMix(
        Object.entries(mix).map(([k, count]) => {
          const [plan, cycle] = k.split("·");
          return { plan, cycle, count };
        }).sort((a, b) => b.count - a.count),
      );
    } finally { setLoading(false); }
  };

  const stats = useMemo(() => {
    const opened = events.filter((e) => e.event_name === "checkout_opened").length;
    const succeeded = events.filter((e) => e.event_name === "payment_succeeded").length;
    const failed = events.filter((e) => e.event_name === "payment_failed").length;
    const dismissed = events.filter((e) => e.event_name === "payment_failed" && e.properties?.reason === "dismissed").length;
    const autopaySuccess = events.filter((e) => e.event_name === "payment_succeeded" && (e.properties?.mode ?? "autopay") !== "one_time").length;
    const oneTimeSuccess = events.filter((e) => e.event_name === "payment_succeeded" && e.properties?.mode === "one_time").length;
    const failuresByReason: Record<string, number> = {};
    for (const e of events.filter((e) => e.event_name === "payment_failed")) {
      const k = String(e.properties?.reason ?? "unknown");
      failuresByReason[k] = (failuresByReason[k] ?? 0) + 1;
    }
    return { opened, succeeded, failed, dismissed, autopaySuccess, oneTimeSuccess, failuresByReason };
  }, [events]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/metrics")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Payments funnel</h1>
        <div className="ml-auto flex gap-1 p-1 bg-muted/40 rounded-lg">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-semibold rounded-md ${range.id === r.id ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >{r.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Stat label="Active subscriptions" value={fmt(activeSubs)} />
            <Stat label="Past due" value={fmt(pastDue)} accent={pastDue > 0 ? "destructive" : undefined} />
            <Stat label="Checkouts opened" value={fmt(stats.opened)} />
            <Stat label="Succeeded" value={fmt(stats.succeeded)} />
          </div>

          <Card className="p-4 mb-5">
            <h2 className="text-sm font-bold mb-3">Funnel · last {range.label}</h2>
            <FunnelBar label="Checkout opened" count={stats.opened} total={stats.opened} />
            <FunnelBar label="Payment succeeded" count={stats.succeeded} total={stats.opened} note={`${pct(stats.succeeded, stats.opened)} conversion`} />
            <FunnelBar label="Payment failed / dismissed" count={stats.failed} total={stats.opened} tone="destructive" note={`${stats.dismissed} dismissed`} />
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
              <Stat compact label="AutoPay successes" value={fmt(stats.autopaySuccess)} />
              <Stat compact label="One-time successes" value={fmt(stats.oneTimeSuccess)} />
            </div>
          </Card>

          <Card className="p-4 mb-5">
            <h2 className="text-sm font-bold mb-3">Active plan mix</h2>
            {planMix.length === 0 ? (
              <p className="text-xs text-muted-foreground">No active subscriptions yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {planMix.map((p) => (
                  <li key={`${p.plan}-${p.cycle}`} className="flex items-center justify-between text-[13px]">
                    <span className="capitalize">{p.plan} · {p.cycle}</span>
                    <span className="font-semibold">{fmt(p.count)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-4 mb-5">
            <h2 className="text-sm font-bold mb-3">Failure reasons</h2>
            {Object.keys(stats.failuresByReason).length === 0 ? (
              <p className="text-xs text-muted-foreground">No failures in this window 🎉</p>
            ) : (
              <ul className="space-y-1.5">
                {Object.entries(stats.failuresByReason).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                  <li key={reason} className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">{reason}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-bold mb-3">Recent payment events</h2>
            <div className="text-[12px] divide-y">
              {events.slice(0, 25).map((e, i) => (
                <div key={i} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={e.event_name === "payment_succeeded" ? "default" : e.event_name === "payment_failed" ? "destructive" : "secondary"}>
                        {e.event_name.replace("payment_", "").replace("_", " ")}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(e.created_at).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                      {e.properties?.plan ?? "—"} · {e.properties?.cycle ?? "—"}
                      {e.properties?.mode ? ` · ${e.properties.mode}` : ""}
                      {e.properties?.reason ? ` · ${e.properties.reason}` : ""}
                    </p>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No events in this window.</p>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent, compact }: { label: string; value: string; accent?: "destructive"; compact?: boolean }) {
  return (
    <Card className={compact ? "p-3" : "p-4"}>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-${compact ? "lg" : "2xl"} font-bold mt-1 ${accent === "destructive" ? "text-destructive" : ""}`}>{value}</p>
    </Card>
  );
}

function FunnelBar({ label, count, total, note, tone }: { label: string; count: number; total: number; note?: string; tone?: "destructive" }) {
  const w = total > 0 ? Math.max(2, (count / total) * 100) : 0;
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-foreground/90">{label}</span>
        <span className="font-semibold">{fmt(count)} {note && <span className="text-muted-foreground font-normal">· {note}</span>}</span>
      </div>
      <div className="h-2 bg-muted rounded overflow-hidden">
        <div className={`h-full ${tone === "destructive" ? "bg-destructive" : "bg-primary"}`} style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Funnel = { step: string; count: number };
type Cohort = { day: string; signups: number; activated: number };

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN").format(n);
const pct = (a: number, b: number) =>
  b === 0 ? "—" : `${((a / b) * 100).toFixed(1)}%`;

const AdminMetrics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [signups, setSignups] = useState(0);
  const [docs, setDocs] = useState(0);
  const [briefings, setBriefings] = useState(0);
  const [activeSubs, setActiveSubs] = useState(0);
  const [planMix, setPlanMix] = useState<{ plan: string; count: number }[]>([]);
  const [paywallFunnel, setPaywallFunnel] = useState<Funnel[]>([]);
  const [activationFunnel, setActivationFunnel] = useState<Funnel[]>([]);
  const [retention, setRetention] = useState<{ d: number; pct: string }[]>([]);
  const [ttfu, setTtfu] = useState<number | null>(null);
  const [ttfb, setTtfb] = useState<number | null>(null);
  const [extractionFailRate, setExtractionFailRate] = useState<string>("—");
  const [familyOccupancy, setFamilyOccupancy] = useState<string>("—");
  const [vitalsBreadth, setVitalsBreadth] = useState<string>("—");
  const [recentEvents, setRecentEvents] = useState<
    { event_name: string; created_at: string; properties: unknown }[]
  >([]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      const isAdmin = (roles || []).some((r) => r.role === "admin");
      if (!isAdmin) {
        toast.error("Admin access required");
        navigate("/", { replace: true });
        return;
      }
      setAuthorized(true);
      await loadAll();
      setLoading(false);
    };
    init();
  }, [navigate]);

  const loadAll = async () => {
    // Totals
    const [docsRes, briefingsRes, subsRes, planRes] = await Promise.all([
      supabase.from("health_records").select("id", { count: "exact", head: true }),
      supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_name", "briefing_generated"),
      supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("subscriptions").select("plan").eq("status", "active"),
    ]);
    setDocs(docsRes.count ?? 0);
    setBriefings(briefingsRes.count ?? 0);
    setActiveSubs(subsRes.count ?? 0);

    const mix: Record<string, number> = {};
    (planRes.data ?? []).forEach((r: { plan: string }) => {
      mix[r.plan] = (mix[r.plan] ?? 0) + 1;
    });
    setPlanMix(Object.entries(mix).map(([plan, count]) => ({ plan, count })));

    // Signups (count auth.users via patients-primary as proxy)
    const { count: signupCount } = await supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("is_primary", true);
    setSignups(signupCount ?? 0);

    // Paywall 4-step funnel
    const steps: AnalyticsName[] = [
      "paywall_triggered",
      "paywall_viewed",
      "checkout_opened",
      "payment_succeeded",
    ];
    const funnel: Funnel[] = [];
    for (const step of steps) {
      const { count } = await supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_name", step);
      funnel.push({ step, count: count ?? 0 });
    }
    setPaywallFunnel(funnel);

    // Activation funnel
    const aSteps: AnalyticsName[] = [
      "signup_completed",
      "doc_uploaded",
      "briefing_generated",
      "briefing_shared",
    ];
    const aFunnel: Funnel[] = [];
    for (const step of aSteps) {
      const { count } = await supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_name", step);
      aFunnel.push({ step, count: count ?? 0 });
    }
    setActivationFunnel(aFunnel);

    // TTFU + TTFB via SQL-side join would be ideal; do simple client calc
    const { data: firstDocs } = await supabase
      .from("health_records")
      .select("patient_id, uploaded_at, patients!inner(user_id, created_at)")
      .order("uploaded_at", { ascending: true })
      .limit(500);
    if (firstDocs && firstDocs.length) {
      const byUser = new Map<string, { signup: number; firstDoc: number }>();
      for (const r of firstDocs as unknown as {
        patients: { user_id: string; created_at: string };
        uploaded_at: string;
      }[]) {
        const uid = r.patients.user_id;
        const signup = new Date(r.patients.created_at).getTime();
        const doc = new Date(r.uploaded_at).getTime();
        const cur = byUser.get(uid);
        if (!cur || doc < cur.firstDoc) byUser.set(uid, { signup, firstDoc: doc });
      }
      const mins = [...byUser.values()].map((v) => (v.firstDoc - v.signup) / 60000);
      if (mins.length) {
        const median = mins.sort((a, b) => a - b)[Math.floor(mins.length / 2)];
        setTtfu(Math.round(median));
      }
    }

    // TTFB from events
    const { data: bfEvents } = await supabase
      .from("analytics_events")
      .select("user_id, created_at")
      .eq("event_name", "briefing_generated")
      .order("created_at", { ascending: true })
      .limit(500);
    const { data: signupEvents } = await supabase
      .from("analytics_events")
      .select("user_id, created_at")
      .eq("event_name", "signup_completed")
      .limit(500);
    if (bfEvents && signupEvents) {
      const signupMap = new Map<string, number>();
      signupEvents.forEach((e) =>
        signupMap.set(e.user_id!, new Date(e.created_at).getTime()),
      );
      const mins: number[] = [];
      const seen = new Set<string>();
      for (const e of bfEvents) {
        if (!e.user_id || seen.has(e.user_id)) continue;
        const s = signupMap.get(e.user_id);
        if (s) {
          mins.push((new Date(e.created_at).getTime() - s) / 60000);
          seen.add(e.user_id);
        }
      }
      if (mins.length) {
        const median = mins.sort((a, b) => a - b)[Math.floor(mins.length / 2)];
        setTtfb(Math.round(median));
      }
    }

    // Extraction failure rate
    const { count: totalRecords } = await supabase
      .from("health_records")
      .select("id", { count: "exact", head: true });
    const { count: failedRecords } = await supabase
      .from("health_records")
      .select("id", { count: "exact", head: true })
      .eq("extraction_status", "failed");
    if (totalRecords) {
      setExtractionFailRate(pct(failedRecords ?? 0, totalRecords));
    }

    // Family occupancy on family plan
    const { data: famSubs } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active")
      .eq("plan", "family");
    if (famSubs?.length) {
      const totals: number[] = [];
      for (const s of famSubs) {
        const { count: pc } = await supabase
          .from("patients")
          .select("id", { count: "exact", head: true })
          .eq("user_id", s.user_id);
        totals.push(pc ?? 0);
      }
      const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
      setFamilyOccupancy(`${avg.toFixed(1)} / 6`);
    } else {
      setFamilyOccupancy("0 paid family plans");
    }

    // Vitals breadth — vitals stored as JSONB keys per row
    const { data: vitals } = await supabase
      .from("vital_history")
      .select("patient_id, vitals")
      .limit(5000);
    if (vitals?.length) {
      const byPatient = new Map<string, Set<string>>();
      (vitals as { patient_id: string; vitals: Record<string, unknown> }[]).forEach((v) => {
        if (!byPatient.has(v.patient_id)) byPatient.set(v.patient_id, new Set());
        Object.keys(v.vitals ?? {}).forEach((k) => byPatient.get(v.patient_id)!.add(k));
      });
      const avg =
        [...byPatient.values()].reduce((s, set) => s + set.size, 0) /
        byPatient.size;
      setVitalsBreadth(`${avg.toFixed(1)} / 33`);
    }

    // Retention D30/90/180 (signup vs any recent event)
    const cutoffs = [30, 90, 180];
    const now = Date.now();
    const rows: { d: number; pct: string }[] = [];
    for (const d of cutoffs) {
      const cutoff = new Date(now - d * 24 * 60 * 60 * 1000).toISOString();
      const { data: oldUsers } = await supabase
        .from("patients")
        .select("user_id, created_at")
        .eq("is_primary", true)
        .lt("created_at", cutoff);
      if (!oldUsers?.length) {
        rows.push({ d, pct: "—" });
        continue;
      }
      const userIds = oldUsers.map((u) => u.user_id);
      const { data: returners } = await supabase
        .from("analytics_events")
        .select("user_id")
        .gte("created_at", cutoff)
        .in("user_id", userIds);
      const unique = new Set((returners ?? []).map((r) => r.user_id));
      rows.push({ d, pct: pct(unique.size, oldUsers.length) });
    }
    setRetention(rows);

    // Recent events feed
    const { data: recent } = await supabase
      .from("analytics_events")
      .select("event_name, created_at, properties")
      .order("created_at", { ascending: false })
      .limit(25);
    setRecentEvents(recent ?? []);
  };

  const paywallConversion = useMemo(() => {
    if (paywallFunnel.length < 4) return "—";
    return pct(paywallFunnel[3].count, paywallFunnel[0].count || 1);
  }, [paywallFunnel]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <header className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold">Vyana metrics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              North-star numbers. Auto-refreshes on page load.
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <a href="/admin/observability" className="underline text-primary">Observability →</a>
            <a href="/admin/payments" className="underline text-primary">Payments →</a>
            <a href="/admin/waitlist" className="underline text-primary">Waitlist →</a>
          </div>
        </header>

        {/* Totals strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Signups" value={fmt(signups)} />
          <Stat label="Documents uploaded" value={fmt(docs)} />
          <Stat label="Briefings generated" value={fmt(briefings)} />
          <Stat label="Active Pro subs" value={fmt(activeSubs)} />
        </section>

        {/* Activation */}
        <Section title="Activation funnel">
          <FunnelView rows={activationFunnel} />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Stat label="Median TTFU" value={ttfu == null ? "—" : `${ttfu} min`} />
            <Stat label="Median TTFB" value={ttfb == null ? "—" : `${ttfb} min`} />
          </div>
        </Section>

        {/* Monetization */}
        <Section title="Monetization">
          <FunnelView rows={paywallFunnel} />
          <p className="text-sm text-muted-foreground mt-3">
            Trigger → paid conversion:{" "}
            <span className="font-medium text-foreground">{paywallConversion}</span>
          </p>
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Plan mix</h4>
            <div className="flex flex-wrap gap-2">
              {planMix.length === 0 && (
                <span className="text-sm text-muted-foreground">No active subs yet.</span>
              )}
              {planMix.map((p) => (
                <Badge key={p.plan} variant="secondary">
                  {p.plan}: {p.count}
                </Badge>
              ))}
            </div>
          </div>
        </Section>

        {/* Retention */}
        <Section title="Retention (returned after N days)">
          <div className="grid grid-cols-3 gap-3">
            {retention.map((r) => (
              <Stat key={r.d} label={`D${r.d}`} value={r.pct} />
            ))}
          </div>
        </Section>

        {/* Engagement / quality */}
        <Section title="Engagement & quality">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat label="Family seat occupancy" value={familyOccupancy} />
            <Stat label="Avg vitals tracked" value={vitalsBreadth} />
            <Stat label="Extraction failure rate" value={extractionFailRate} />
          </div>
        </Section>

        {/* Recent events */}
        <Section title="Recent events">
          <div className="divide-y divide-border rounded-md border border-border overflow-hidden">
            {recentEvents.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No events yet. Start instrumenting calls to logEvent().
              </div>
            )}
            {recentEvents.map((e, i) => (
              <div key={i} className="px-4 py-2 text-sm flex items-center justify-between gap-3">
                <span className="font-mono text-xs">{e.event_name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};

type AnalyticsName =
  | "signup_completed"
  | "doc_uploaded"
  | "briefing_generated"
  | "briefing_shared"
  | "paywall_triggered"
  | "paywall_viewed"
  | "checkout_opened"
  | "payment_succeeded";

const Stat = ({ label, value }: { label: string; value: string }) => (
  <Card className="p-4">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="text-2xl font-semibold mt-1">{value}</div>
  </Card>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-medium">{title}</h2>
    <Card className="p-4">{children}</Card>
  </section>
);

const FunnelView = ({ rows }: { rows: Funnel[] }) => {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const prev = i === 0 ? null : rows[i - 1].count;
        const conv = prev ? pct(r.count, prev) : null;
        return (
          <div key={r.step}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-mono text-xs">{r.step}</span>
              <span>
                {fmt(r.count)} {conv && <span className="text-muted-foreground ml-2">({conv})</span>}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminMetrics;

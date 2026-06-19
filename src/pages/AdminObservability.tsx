import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Activity, DollarSign, AlertTriangle, Zap } from "lucide-react";
import { toast } from "sonner";

type FunctionLog = {
  id: string;
  request_id: string | null;
  function_name: string;
  user_id: string | null;
  method: string | null;
  status_code: number | null;
  latency_ms: number | null;
  error: string | null;
  created_at: string;
};

type AiLog = {
  id: string;
  function_name: string;
  user_id: string | null;
  model: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  cost_inr: number | null;
  latency_ms: number | null;
  status: string | null;
  error: string | null;
  created_at: string;
};

type Range = "24h" | "7d" | "30d";

const rangeToHours: Record<Range, number> = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30 };

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
const num = (n: number) => new Intl.NumberFormat("en-IN").format(n);

const AdminObservability = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("24h");
  const [aiLogs, setAiLogs] = useState<AiLog[]>([]);
  const [fnLogs, setFnLogs] = useState<FunctionLog[]>([]);

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
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (!authorized) return;
    void load();
  }, [authorized, range]);

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - rangeToHours[range] * 3600 * 1000).toISOString();
    const [ai, fn] = await Promise.all([
      supabase
        .from("ai_usage_logs")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("function_logs")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(2000),
    ]);
    if (ai.error) toast.error(`AI logs: ${ai.error.message}`);
    if (fn.error) toast.error(`Function logs: ${fn.error.message}`);
    setAiLogs((ai.data ?? []) as AiLog[]);
    setFnLogs((fn.data ?? []) as FunctionLog[]);
    setLoading(false);
  };

  const stats = useMemo(() => {
    const totalCost = aiLogs.reduce((s, l) => s + Number(l.cost_inr ?? 0), 0);
    const totalTokens = aiLogs.reduce((s, l) => s + Number(l.total_tokens ?? 0), 0);
    const totalCalls = aiLogs.length;
    const aiErrors = aiLogs.filter((l) => l.status && l.status !== "ok").length;
    const fnErrors = fnLogs.filter((l) => (l.status_code ?? 0) >= 400).length;
    const fnCalls = fnLogs.length;
    const avgLatency = fnLogs.length
      ? Math.round(fnLogs.reduce((s, l) => s + (l.latency_ms ?? 0), 0) / fnLogs.length)
      : 0;

    const byModel: Record<string, { calls: number; tokens: number; cost: number }> = {};
    for (const l of aiLogs) {
      const k = l.model;
      byModel[k] ??= { calls: 0, tokens: 0, cost: 0 };
      byModel[k].calls += 1;
      byModel[k].tokens += Number(l.total_tokens ?? 0);
      byModel[k].cost += Number(l.cost_inr ?? 0);
    }
    const byFunction: Record<string, { calls: number; cost: number; tokens: number }> = {};
    for (const l of aiLogs) {
      const k = l.function_name;
      byFunction[k] ??= { calls: 0, cost: 0, tokens: 0 };
      byFunction[k].calls += 1;
      byFunction[k].cost += Number(l.cost_inr ?? 0);
      byFunction[k].tokens += Number(l.total_tokens ?? 0);
    }
    const byUser: Record<string, { calls: number; cost: number }> = {};
    for (const l of aiLogs) {
      const k = l.user_id ?? "anonymous";
      byUser[k] ??= { calls: 0, cost: 0 };
      byUser[k].calls += 1;
      byUser[k].cost += Number(l.cost_inr ?? 0);
    }
    return {
      totalCost, totalTokens, totalCalls, aiErrors, fnErrors, fnCalls, avgLatency,
      models: Object.entries(byModel).sort((a, b) => b[1].cost - a[1].cost),
      functions: Object.entries(byFunction).sort((a, b) => b[1].cost - a[1].cost),
      users: Object.entries(byUser).sort((a, b) => b[1].cost - a[1].cost).slice(0, 10),
    };
  }, [aiLogs, fnLogs]);

  const recentErrors = useMemo(
    () => fnLogs.filter((l) => (l.status_code ?? 0) >= 400 || l.error).slice(0, 50),
    [fnLogs],
  );

  if (!authorized) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Observability</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Detailed logs and AI usage costs across all edge functions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["24h", "7d", "30d"] as Range[]).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? "default" : "outline"}
                onClick={() => setRange(r)}
              >
                {r}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => load()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi icon={<DollarSign className="h-4 w-4" />} label="AI cost" value={inr(stats.totalCost)} sub={`${num(stats.totalCalls)} calls`} />
          <Kpi icon={<Zap className="h-4 w-4" />} label="Tokens" value={num(stats.totalTokens)} sub={`${stats.models.length} models`} />
          <Kpi icon={<Activity className="h-4 w-4" />} label="Function calls" value={num(stats.fnCalls)} sub={`${stats.avgLatency} ms avg`} />
          <Kpi icon={<AlertTriangle className="h-4 w-4" />} label="Errors" value={num(stats.fnErrors + stats.aiErrors)} sub={`${stats.fnErrors} fn / ${stats.aiErrors} AI`} />
        </div>

        <Tabs defaultValue="ai">
          <TabsList>
            <TabsTrigger value="ai">AI usage</TabsTrigger>
            <TabsTrigger value="functions">Function logs</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <BreakdownCard
                title="Cost by model"
                rows={stats.models.map(([k, v]) => ({
                  key: k,
                  primary: k,
                  right: inr(v.cost),
                  sub: `${num(v.calls)} calls · ${num(v.tokens)} tok`,
                }))}
              />
              <BreakdownCard
                title="Cost by function"
                rows={stats.functions.map(([k, v]) => ({
                  key: k,
                  primary: k,
                  right: inr(v.cost),
                  sub: `${num(v.calls)} calls · ${num(v.tokens)} tok`,
                }))}
              />
            </div>
            <BreakdownCard
              title="Top users by cost"
              rows={stats.users.map(([k, v]) => ({
                key: k,
                primary: k === "anonymous" ? "Anonymous" : k.slice(0, 8) + "…",
                right: inr(v.cost),
                sub: `${num(v.calls)} calls`,
              }))}
            />
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b text-sm font-medium">Recent AI calls</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <Th>Time</Th><Th>Function</Th><Th>Model</Th>
                      <Th className="text-right">Tokens</Th>
                      <Th className="text-right">Cost</Th>
                      <Th className="text-right">Latency</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiLogs.slice(0, 100).map((l) => (
                      <tr key={l.id} className="border-t">
                        <Td>{new Date(l.created_at).toLocaleString("en-IN")}</Td>
                        <Td className="font-mono">{l.function_name}</Td>
                        <Td className="font-mono text-muted-foreground">{l.model}</Td>
                        <Td className="text-right">{num(l.total_tokens ?? 0)}</Td>
                        <Td className="text-right">{inr(Number(l.cost_inr ?? 0))}</Td>
                        <Td className="text-right">{l.latency_ms ?? "—"} ms</Td>
                        <Td>
                          <Badge variant={l.status === "ok" ? "secondary" : "destructive"}>
                            {l.status ?? "—"}
                          </Badge>
                        </Td>
                      </tr>
                    ))}
                    {aiLogs.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No AI calls in this range yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="functions" className="mt-4">
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b text-sm font-medium">Recent function calls</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <Th>Time</Th><Th>Function</Th><Th>Method</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Latency</Th>
                      <Th>User</Th>
                      <Th>Request id</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {fnLogs.slice(0, 200).map((l) => (
                      <tr key={l.id} className="border-t">
                        <Td>{new Date(l.created_at).toLocaleString("en-IN")}</Td>
                        <Td className="font-mono">{l.function_name}</Td>
                        <Td>{l.method ?? "—"}</Td>
                        <Td>
                          <Badge variant={(l.status_code ?? 0) >= 400 ? "destructive" : "secondary"}>
                            {l.status_code ?? "—"}
                          </Badge>
                        </Td>
                        <Td className="text-right">{l.latency_ms ?? "—"} ms</Td>
                        <Td className="text-muted-foreground">{l.user_id ? l.user_id.slice(0, 8) + "…" : "—"}</Td>
                        <Td className="font-mono text-muted-foreground">{l.request_id?.slice(0, 8) ?? "—"}</Td>
                      </tr>
                    ))}
                    {fnLogs.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No function calls logged yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="mt-4">
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b text-sm font-medium">Recent errors</div>
              <div className="divide-y">
                {recentErrors.map((l) => (
                  <div key={l.id} className="p-4 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="destructive">{l.status_code ?? "ERR"}</Badge>
                      <span className="font-mono">{l.function_name}</span>
                      <span className="text-muted-foreground">{new Date(l.created_at).toLocaleString("en-IN")}</span>
                    </div>
                    {l.error && (
                      <pre className="mt-2 text-xs bg-muted/60 rounded p-2 whitespace-pre-wrap break-words">
                        {l.error}
                      </pre>
                    )}
                  </div>
                ))}
                {recentErrors.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No errors in this range. 🎉
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Kpi = ({
  icon, label, value, sub,
}: { icon: React.ReactNode; label: string; value: string; sub?: string }) => (
  <Card className="p-4">
    <div className="flex items-center gap-2 text-muted-foreground text-xs">
      {icon}<span>{label}</span>
    </div>
    <div className="text-xl md:text-2xl font-semibold mt-1">{value}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </Card>
);

const BreakdownCard = ({
  title, rows,
}: { title: string; rows: { key: string; primary: string; right: string; sub?: string }[] }) => (
  <Card className="p-0 overflow-hidden">
    <div className="px-4 py-3 border-b text-sm font-medium">{title}</div>
    <div className="divide-y">
      {rows.length === 0 && (
        <div className="p-6 text-center text-muted-foreground text-sm">No data yet.</div>
      )}
      {rows.slice(0, 10).map((r) => (
        <div key={r.key} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
          <div className="min-w-0">
            <div className="truncate font-medium">{r.primary}</div>
            {r.sub && <div className="text-xs text-muted-foreground">{r.sub}</div>}
          </div>
          <div className="font-mono text-sm">{r.right}</div>
        </div>
      ))}
    </div>
  </Card>
);

const Th = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>
);
const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-3 py-2 ${className}`}>{children}</td>
);

export default AdminObservability;

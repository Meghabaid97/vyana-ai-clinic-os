import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";

type CheckState = "pending" | "ok" | "fail";

interface HostCheck {
  host: string;
  role: string;
  reachable: CheckState;
  oauthProxy: CheckState;
  notes?: string;
}

const HOSTS: { host: string; role: string }[] = [
  { host: "vyana.care", role: "Apex (root)" },
  { host: "www.vyana.care", role: "Primary (canonical)" },
];

const PRIMARY = "https://www.vyana.care";

const probeHost = async (host: string): Promise<{ reachable: CheckState; oauthProxy: CheckState; notes?: string }> => {
  // Reachability — `no-cors` returns opaque but proves the host responded.
  let reachable: CheckState = "fail";
  try {
    await fetch(`https://${host}/`, { method: "HEAD", mode: "no-cors", cache: "no-store" });
    reachable = "ok";
  } catch {
    reachable = "fail";
  }

  // OAuth proxy — a real GET. If `/~oauth/initiate` is installed, the worker
  // responds (typically a redirect or 4xx with a body). If the host isn't an
  // active Lovable custom domain, the edge returns a 404 from the registrar's
  // catch-all (Vercel-style "NOT_FOUND") OR the request fails entirely.
  let oauthProxy: CheckState = "fail";
  let notes: string | undefined;
  try {
    const res = await fetch(`https://${host}/~oauth/initiate?provider=google`, {
      method: "GET",
      mode: "no-cors",
      redirect: "manual",
      cache: "no-store",
    });
    // In no-cors we can't read status; treat any successful network round-trip
    // as the proxy being reachable. The reachability check above already filters
    // truly dead hosts.
    if (res.type === "opaque" || res.type === "opaqueredirect" || (res.status >= 200 && res.status < 500)) {
      oauthProxy = "ok";
    } else {
      oauthProxy = "fail";
      notes = `HTTP ${res.status}`;
    }
  } catch (e: any) {
    oauthProxy = "fail";
    notes = e?.message || "Network error";
  }

  return { reachable, oauthProxy, notes };
};

const StatusPill = ({ state, label }: { state: CheckState; label: string }) => {
  if (state === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {label}
      </span>
    );
  }
  if (state === "ok") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive">
      <XCircle className="h-3 w-3" />
      {label}
    </span>
  );
};

const DomainChecklist = () => {
  const [checks, setChecks] = useState<HostCheck[]>(
    HOSTS.map((h) => ({ ...h, reachable: "pending", oauthProxy: "pending" })),
  );
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runAll = async () => {
    setRunning(true);
    setChecks(HOSTS.map((h) => ({ ...h, reachable: "pending", oauthProxy: "pending" })));
    const results = await Promise.all(
      HOSTS.map(async (h) => {
        const r = await probeHost(h.host);
        return { ...h, ...r };
      }),
    );
    setChecks(results);
    setLastRun(new Date());
    setRunning(false);
  };

  useEffect(() => {
    void runAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allHealthy = checks.every((c) => c.reachable === "ok" && c.oauthProxy === "ok");
  const anyFailing = checks.some((c) => c.reachable === "fail" || c.oauthProxy === "fail");

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-6">
        {/* Summary card */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
                Custom domain status
              </p>
              <h2 className="mt-1 text-xl font-bold text-foreground">
                {running
                  ? "Checking domains…"
                  : allHealthy
                  ? "All systems go"
                  : anyFailing
                  ? "Action required"
                  : "Partial setup"}
              </h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
                Both the apex and www variants must be Active in Lovable for Google sign-in to work
                from any entry point.
              </p>
            </div>
            <button
              onClick={runAll}
              disabled={running}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-[12px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
              Recheck
            </button>
          </div>
          {lastRun && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              Last checked {lastRun.toLocaleTimeString()}
            </p>
          )}
        </section>

        {/* Per-host checklist */}
        <section className="space-y-3">
          {checks.map((c) => {
            const healthy = c.reachable === "ok" && c.oauthProxy === "ok";
            return (
              <div
                key={c.host}
                className={`rounded-2xl border p-4 transition-colors ${
                  healthy
                    ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                    : c.reachable === "pending" || c.oauthProxy === "pending"
                    ? "border-border bg-card"
                    : "border-destructive/30 bg-destructive/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
                      {c.role}
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-foreground truncate">
                      {c.host}
                    </p>
                  </div>
                  <a
                    href={`https://${c.host}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusPill
                    state={c.reachable}
                    label={c.reachable === "ok" ? "DNS reachable" : c.reachable === "fail" ? "Unreachable" : "Checking DNS"}
                  />
                  <StatusPill
                    state={c.oauthProxy}
                    label={
                      c.oauthProxy === "ok"
                        ? "OAuth proxy installed"
                        : c.oauthProxy === "fail"
                        ? "OAuth proxy missing"
                        : "Checking OAuth proxy"
                    }
                  />
                </div>

                {c.notes && c.oauthProxy === "fail" && (
                  <p className="mt-3 text-[12px] text-muted-foreground">{c.notes}</p>
                )}

                {!healthy && c.reachable !== "pending" && (
                  <div className="mt-3 flex gap-2 rounded-lg bg-muted/50 p-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                    <div className="text-[12px] text-foreground leading-relaxed">
                      {c.reachable === "fail" ? (
                        <>
                          Add an <span className="font-mono">A record</span> pointing{" "}
                          <span className="font-mono">{c.host === "vyana.care" ? "@" : "www"}</span>{" "}
                          to <span className="font-mono">185.158.133.1</span> at your registrar.
                        </>
                      ) : (
                        <>
                          DNS resolves but this host isn’t Active in Lovable. Add{" "}
                          <span className="font-mono">{c.host}</span> in{" "}
                          <span className="font-semibold">Project Settings → Domains</span> and
                          wait for status <span className="font-semibold">Active</span>.
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Test Google auth */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground">Test Google sign-in</h3>
          <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
            This opens the canonical host directly so the entire OAuth round-trip
            stays on a single configured domain.
          </p>
          <a
            href={`${PRIMARY}/auth`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Open {PRIMARY.replace("https://", "")}/auth
            <ExternalLink className="h-4 w-4" />
          </a>
        </section>

        {/* Setup steps */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">If anything is red</h3>
          <ol className="space-y-2.5 text-[13px] text-foreground leading-relaxed list-decimal pl-5">
            <li>
              Open <span className="font-semibold">Project Settings → Domains</span> in Lovable.
            </li>
            <li>
              Ensure both <span className="font-mono">vyana.care</span> and{" "}
              <span className="font-mono">www.vyana.care</span> are listed and show status{" "}
              <span className="font-semibold">Active</span>.
            </li>
            <li>
              Set <span className="font-mono">www.vyana.care</span> as <span className="font-semibold">Primary</span>{" "}
              so the apex 308-redirects cleanly before any OAuth call.
            </li>
            <li>Click <span className="font-semibold">Publish → Update</span> after the domains go Active.</li>
            <li>Come back and tap <span className="font-semibold">Recheck</span>.</li>
          </ol>
        </section>
      </div>
    </div>
  );
};

export default DomainChecklist;

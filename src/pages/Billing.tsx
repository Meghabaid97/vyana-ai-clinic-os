import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { ArrowLeft, Loader2, ExternalLink, ReceiptText, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEntitlements } from "@/hooks/useEntitlements";

const HIDE_PAID_UI = typeof window !== "undefined" && Capacitor.isNativePlatform();

interface Item {
  id: string;
  kind: "subscription" | "one_time";
  status: string;
  amount_inr: number;
  description: string;
  created_at: string;
  short_url?: string | null;
  payment_id?: string | null;
  invoice_id?: string | null;
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}
function fmtINR(n: number) { return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`; }

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const s = status.toLowerCase();
  if (s === "paid" || s === "captured" || s === "active") return "default";
  if (s === "failed" || s === "halted") return "destructive";
  if (s === "issued" || s === "pending" || s === "created") return "secondary";
  return "outline";
}

export default function Billing() {
  const navigate = useNavigate();
  const ent = useEntitlements();
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase.functions.invoke("razorpay-list-invoices");
    if (error) setErr(error.message ?? "Could not load billing history");
    else setItems(((data as any)?.items as Item[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { document.title = "Billing · Vyana"; void load(); }, []);

  const pastDue = ent.status === "past_due";

  return (
    <div className="min-h-[calc(100svh-4rem)] pb-24">
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold">Billing</h1>
        <Button variant="ghost" size="icon" aria-label="Refresh" className="ml-auto" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {pastDue && (
        <div className="mx-5 mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-[13px] font-semibold text-foreground">AutoPay failed</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Your bank couldn't complete the last renewal. Common fixes: low
            balance, daily UPI limit, or a mandate cap below the amount. Subscribe
            again or pay once below to restore Pro immediately.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => navigate("/app/upgrade")}>Re-subscribe</Button>
          </div>
        </div>
      )}

      <div className="px-5 max-w-md mx-auto">
        <div className="rounded-2xl border border-border bg-card p-4 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-muted-foreground">Current plan</p>
              <p className="text-base font-bold capitalize">
                {ent.plan === "free" ? "Free" : `Vyana ${ent.plan}`}
                {ent.plan !== "free" && (ent as any).billing_cycle && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}· {(ent as any).billing_cycle}
                  </span>
                )}
              </p>
              {ent.current_period_end && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {(ent as any).cancel_at_period_end ? "Access until" : "Renews"}{" "}
                  {fmtDate(ent.current_period_end)}
                </p>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/app/upgrade")}>
              Manage plan
            </Button>
          </div>
        </div>

        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <ReceiptText className="h-3.5 w-3.5" /> Payment history
        </h2>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && err && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-[12.5px] text-destructive">
            {err}
          </div>
        )}

        {!loading && !err && items && items.length === 0 && (
          <div className="rounded-xl border border-border bg-muted/20 p-5 text-center">
            <p className="text-[13px] text-muted-foreground">
              No payments yet. Upgrade to start your Vyana Pro story.
            </p>
            <Button size="sm" className="mt-3" onClick={() => navigate("/app/upgrade")}>
              See plans
            </Button>
          </div>
        )}

        {!loading && !err && items && items.length > 0 && (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold truncate">{it.description}</span>
                      <Badge variant={statusVariant(it.status)} className="capitalize text-[10px]">
                        {it.status}
                      </Badge>
                      <span className="text-[10.5px] text-muted-foreground">
                        {it.kind === "subscription" ? "AutoPay" : "One-time"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {fmtDate(it.created_at)}
                      {it.payment_id && <span className="ml-2 font-mono">{it.payment_id.slice(0, 14)}…</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-bold">{fmtINR(it.amount_inr)}</p>
                    {it.short_url && (
                      <a
                        href={it.short_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10.5px] text-primary inline-flex items-center gap-0.5 mt-0.5 hover:underline"
                      >
                        Invoice <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-[11px] text-muted-foreground text-center mt-5">
          Need a GST invoice with your GSTIN? Email us from{" "}
          <button className="underline" onClick={() => navigate("/app/support")}>support</button>.
        </p>
      </div>
    </div>
  );
}

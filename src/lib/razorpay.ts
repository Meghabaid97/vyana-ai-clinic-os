// Razorpay Standard Checkout helper for Vyana plans.
// The amount is derived server-side from { plan, cycle } so the client cannot tamper with pricing.
import { supabase } from "@/integrations/supabase/client";
import type { BillingCycle } from "@/lib/plans";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      return;
    }
    const s = document.createElement("script");
    s.src = CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Razorpay"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export interface PlanCheckoutOptions {
  plan: "individual" | "family";
  cycle: BillingCycle;
  prefill?: { name?: string; email?: string; contact?: string };
  themeColor?: string;
}

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  verified: true;
  plan: "individual" | "family";
  cycle: BillingCycle;
  current_period_end?: string;
}

async function getFunctionErrorMessage(error: any) {
  const fallback = error?.message ?? "Could not create order";
  try {
    const details = await error?.context?.json?.();
    const message = details?.error ?? fallback;
    if (/authentication failed/i.test(message)) {
      return "Razorpay keys are mismatched or invalid. Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET with the matching Test keys, then try again.";
    }
    return message;
  } catch {
    return fallback;
  }
}

function getPaymentFailureMessage(description?: string) {
  const message = description ?? "Payment failed";
  if (/international cards are not supported/i.test(message)) {
    return "Razorpay rejected this card. In Test Mode, use domestic test card 5104 0155 5555 5558, any future expiry, CVV 123, OTP 1234. Or use UPI success@razorpay.";
  }
  return message;
}

export async function startPlanCheckout(opts: PlanCheckoutOptions): Promise<RazorpaySuccess> {
  await loadRazorpayScript();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in to upgrade");

  // Create a Razorpay Subscription (recurring) — this triggers UPI AutoPay mandate UI.
  const { data: subData, error: subErr } = await supabase.functions.invoke(
    "razorpay-create-subscription",
    { body: { plan: opts.plan, cycle: opts.cycle } },
  );
  if (subErr || !subData?.subscription_id) {
    throw new Error(subErr ? await getFunctionErrorMessage(subErr) : "Could not start subscription");
  }

  const { logEvent } = await import("@/lib/analytics");

  return new Promise<RazorpaySuccess>((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: subData.key_id,
      subscription_id: subData.subscription_id,
      name: "Vyana",
      description: `${opts.plan === "family" ? "Family" : "Individual"} plan · ${opts.cycle} · UPI AutoPay`,
      prefill: opts.prefill ?? { email: session.user.email ?? undefined },
      notes: { plan: opts.plan, cycle: opts.cycle },
      theme: { color: opts.themeColor ?? "#0F172A" },
      modal: {
        ondismiss: () => {
          void logEvent("payment_failed", { plan: opts.plan, cycle: opts.cycle, reason: "dismissed" });
          reject(new Error("Payment cancelled"));
        },
      },
      handler: async (response: any) => {
        // For subscriptions, activation happens via webhook (subscription.authenticated / activated / charged).
        // Poll briefly so the UI reflects the new entitlements right away.
        const start = Date.now();
        const POLL_MS = 1500;
        const TIMEOUT_MS = 20_000;
        let activated = false;
        while (Date.now() - start < TIMEOUT_MS) {
          const { data: ent } = await supabase.rpc("get_entitlements");
          if ((ent as any)?.is_pro) {
            activated = true;
            break;
          }
          await new Promise((r) => setTimeout(r, POLL_MS));
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("vyana:entitlements:refresh"));
        }
        void logEvent(activated ? "payment_succeeded" : "payment_pending", {
          plan: opts.plan,
          cycle: opts.cycle,
          subscription_id: subData.subscription_id,
        });
        resolve({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_subscription_id ?? subData.subscription_id,
          razorpay_signature: response.razorpay_signature,
          verified: true,
          plan: opts.plan,
          cycle: opts.cycle,
        });
      },
    });
    rzp.on("payment.failed", (resp: any) => {
      void logEvent("payment_failed", { plan: opts.plan, cycle: opts.cycle, reason: resp?.error?.description ?? "unknown" });
      reject(new Error(getPaymentFailureMessage(resp?.error?.description)));
    });
    void logEvent("checkout_opened", {
      plan: opts.plan,
      cycle: opts.cycle,
      subscription_id: subData.subscription_id,
    });
    rzp.open();
  });
}

// Cancel the active subscription on Razorpay at the end of the current billing cycle.
export async function cancelActiveSubscription(): Promise<void> {
  const { data, error } = await supabase.functions.invoke("razorpay-cancel-subscription");
  if (error || (data as any)?.error) {
    throw new Error((data as any)?.error ?? error?.message ?? "Could not cancel subscription");
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vyana:entitlements:refresh"));
  }
}

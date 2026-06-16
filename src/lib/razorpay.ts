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

  const { data: orderData, error: orderErr } = await supabase.functions.invoke(
    "razorpay-create-order",
    { body: { plan: opts.plan, cycle: opts.cycle, user_id: session.user.id } },
  );
  if (orderErr || !orderData?.order_id) {
    throw new Error(orderErr ? await getFunctionErrorMessage(orderErr) : "Could not create order");
  }

  return new Promise<RazorpaySuccess>((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: orderData.key_id,
      order_id: orderData.order_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Vyana",
      description: `${opts.plan === "family" ? "Family" : "Individual"} plan · ${opts.cycle}`,
      prefill: opts.prefill ?? { email: session.user.email ?? undefined },
      notes: { plan: opts.plan, cycle: opts.cycle },
      theme: { color: opts.themeColor ?? "#0F172A" },
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
      handler: async (response: any) => {
        const { data: verifyData, error: verifyErr } = await supabase.functions.invoke(
          "razorpay-verify-payment",
          { body: response },
        );
        if (verifyErr || !verifyData?.verified) {
          reject(new Error(verifyErr?.message ?? "Signature verification failed"));
          return;
        }
        resolve({
          ...response,
          verified: true,
          plan: opts.plan,
          cycle: opts.cycle,
          current_period_end: verifyData.current_period_end,
        });
      },
    });
    rzp.on("payment.failed", (resp: any) => {
      reject(new Error(getPaymentFailureMessage(resp?.error?.description)));
    });
    rzp.open();
  });
}

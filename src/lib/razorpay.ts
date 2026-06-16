// Razorpay Standard Checkout helper.
// Loads checkout.js on demand, creates an order via edge function, opens the modal,
// and verifies the signature server-side before resolving success.
import { supabase } from "@/integrations/supabase/client";

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

export interface RazorpayCheckoutOptions {
  /** Amount in paise (>= 100). */
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  themeColor?: string;
}

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  verified: true;
}

export async function startRazorpayCheckout(
  opts: RazorpayCheckoutOptions,
): Promise<RazorpaySuccess> {
  await loadRazorpayScript();

  const { data: orderData, error: orderErr } = await supabase.functions.invoke(
    "razorpay-create-order",
    {
      body: {
        amount: opts.amount,
        currency: opts.currency ?? "INR",
        receipt: opts.receipt,
        notes: opts.notes,
      },
    },
  );
  if (orderErr || !orderData?.order_id) {
    throw new Error(orderErr?.message ?? "Could not create order");
  }

  return new Promise<RazorpaySuccess>((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: orderData.key_id,
      order_id: orderData.order_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: opts.name ?? "Vyana",
      description: opts.description,
      prefill: opts.prefill,
      notes: opts.notes,
      theme: { color: opts.themeColor ?? "#0F172A" },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        const { data: verifyData, error: verifyErr } = await supabase.functions.invoke(
          "razorpay-verify-payment",
          { body: response },
        );
        if (verifyErr || !verifyData?.verified) {
          reject(new Error(verifyErr?.message ?? "Signature verification failed"));
          return;
        }
        resolve({ ...response, verified: true });
      },
    });

    rzp.on("payment.failed", (resp: any) => {
      reject(new Error(resp?.error?.description ?? "Payment failed"));
    });

    rzp.open();
  });
}

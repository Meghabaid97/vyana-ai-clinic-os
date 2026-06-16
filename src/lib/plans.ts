// Vyana pricing — keep amounts in sync with supabase/functions/razorpay-create-order/index.ts
export type PlanId = "free" | "individual" | "family";
export type BillingCycle = "monthly" | "yearly";

export interface PlanPricing {
  monthly: number; // paise
  yearly: number;  // paise
}

export const PLAN_PRICES: Record<Exclude<PlanId, "free">, PlanPricing> = {
  individual: { monthly: 9900, yearly: 79900 },
  family:     { monthly: 29900, yearly: 239900 },
};

export const FREE_LIMITS = {
  briefingsLifetime: 1,
  docsLifetime: 5,
  familyMembers: 1,
  freeVitalsCount: 3,
};

export const PLAN_META: Record<Exclude<PlanId, "free">, {
  name: string;
  tagline: string;
  features: string[];
  seats: number;
  highlight?: string;
}> = {
  individual: {
    name: "Individual",
    tagline: "Just for you.",
    seats: 1,
    features: [
      "Unlimited briefings",
      "Unlimited document uploads",
      "Drug interaction checker",
      "Clinical intelligence (ASCVD, eGFR, ADA)",
      "Claim assistant",
      "Unlimited doctor sharing links",
      "Priority Rx reader",
    ],
  },
  family: {
    name: "Family",
    tagline: "Protect up to 6 people.",
    seats: 6,
    highlight: "Most loved",
    features: [
      "Everything in Individual",
      "Up to 6 family members",
      "Combined household timeline",
      "Per-member smart reminders",
      "Emergency family access",
    ],
  },
};

export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees % 1 === 0 ? rupees.toFixed(0) : rupees.toFixed(2)}`;
}

export function yearlyMonthlyEquivalent(paise: number): string {
  return formatINR(Math.round(paise / 12));
}

export function yearlySavingsPct(plan: Exclude<PlanId, "free">): number {
  const m = PLAN_PRICES[plan].monthly * 12;
  const y = PLAN_PRICES[plan].yearly;
  return Math.round(((m - y) / m) * 100);
}

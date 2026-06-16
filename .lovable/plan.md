## Pricing (locked)

- **Individual** — ₹99/mo or ₹799/yr — 1 user, unlimited briefings, unlimited docs, drug interactions, clinical engine, claim assistant, doctor sharing
- **Family** — ₹299/mo or ₹2,399/yr — everything above + up to 6 family members
- **Free** — 1 briefing/month, 5 doc uploads total, 2 family members (self + 1)

## Paywall triggers (v1)

1. **2nd briefing in a month** → show blurred preview + paywall sheet (Individual primary, Family upsell card below)
2. **Adding 2nd family member** → hard gate to Family ₹299 only (Individual hidden/disabled)
3. **6th doc upload** → soft paywall, Individual primary
4. **Drug interactions / Clinical engine / Claim assistant** — Pro-only; lock icon + paywall on click

## Backend

New table `public.subscriptions`:
- `user_id uuid PK references auth.users`
- `plan text check in ('free','individual','family')` default `'free'`
- `status text check in ('active','past_due','canceled','expired')` default `'active'`
- `billing_cycle text check in ('monthly','yearly')` nullable
- `current_period_end timestamptz` nullable
- `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` text nullable
- `created_at`, `updated_at`
- RLS: user can `SELECT` own row; only `service_role` writes. GRANT select to authenticated, all to service_role.

New table `public.usage_counters`:
- `user_id uuid`, `period_month text` (YYYY-MM), `briefings_generated int default 0`, `docs_uploaded_total int default 0`
- PK `(user_id, period_month)` for briefings; docs total tracked from existing records table (count query).
- RLS: user select own; service_role all.

Helper SQL function `public.get_entitlements(_user_id uuid)` returns json `{ plan, status, briefings_remaining, docs_remaining, family_seats_remaining, is_pro }`.

Edge function updates:
- `razorpay-create-order` — accept `{ plan: 'individual'|'family', cycle: 'monthly'|'yearly' }`, derive amount server-side (ignore client amount), set `notes` with plan+cycle.
- `razorpay-verify-payment` — on success, upsert `subscriptions` with plan/cycle/period_end (+1 month or +1 year).

## Frontend

- `src/lib/plans.ts` — pricing constants, plan metadata, formatPrice helpers
- `src/hooks/useEntitlements.ts` — fetches `get_entitlements`, exposes `{ plan, isPro, briefingsRemaining, familySeatsRemaining, refresh }`
- `src/components/paywall/PaywallSheet.tsx` — bottom sheet with Individual + Family cards, monthly/yearly toggle, Razorpay buttons, optional "blurred preview" header slot
- `src/components/paywall/PlanCard.tsx` — single plan card with price, features, CTA
- `src/pages/Upgrade.tsx` at `/app/upgrade` — full comparison table, FAQ, both plans, monthly/yearly toggle
- Wire into:
  - `ClinicalBriefing.tsx` — before `generateBriefing()`, check `briefingsRemaining > 0`; if not, show PaywallSheet with blurred preview
  - `HouseholdSwitcher.tsx` / `AddFamilyMemberSheet.tsx` — before opening add sheet, check `familySeatsRemaining > 0`; else PaywallSheet (Family-only mode)
  - `HealthRecordsTab.tsx` upload action — check `docsRemaining > 0`
- Add `/app/upgrade` route in `App.tsx`

## Out of scope for v1 (note for follow-up)

- Per-feature locks on drug interactions / clinical engine / claim assistant (will gate in v2 once payment loop is validated)
- Razorpay webhooks for cancellations / failed renewals (manual extend in v1; period_end is the source of truth)
- Yearly auto-renewal (one-shot orders, user re-pays)
- Refunds and proration

## File touch list

**Create**
- `supabase/migrations/<ts>_subscriptions_and_usage.sql`
- `src/lib/plans.ts`
- `src/hooks/useEntitlements.ts`
- `src/components/paywall/PaywallSheet.tsx`
- `src/components/paywall/PlanCard.tsx`
- `src/pages/Upgrade.tsx`

**Modify**
- `supabase/functions/razorpay-create-order/index.ts` — plan-based amount
- `supabase/functions/razorpay-verify-payment/index.ts` — upsert subscription
- `src/components/ClinicalBriefing.tsx` — paywall gate + blurred preview
- `src/components/AddFamilyMemberSheet.tsx` (or `HouseholdSwitcher.tsx`) — Family-only gate on 2nd seat
- `src/components/HealthRecordsTab.tsx` — upload count gate
- `src/App.tsx` — `/app/upgrade` route
- `src/components/RazorpayCheckoutButton.tsx` — accept `plan` + `cycle` props instead of raw `amount`

Approve and I'll ship it.
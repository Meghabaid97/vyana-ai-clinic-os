// Razorpay: switch the user's active subscription to a different plan (cycle/tier).
// Uses Razorpay's subscriptions/{id} PATCH which schedules the change at the next cycle by default.
// Body: { plan: 'individual'|'family', cycle: 'monthly'|'yearly', schedule_change_at?: 'now'|'cycle_end' }
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

const PLAN_ENV: Record<string, Record<string, string>> = {
  individual: { monthly: 'RAZORPAY_PLAN_INDIVIDUAL_MONTHLY', yearly: 'RAZORPAY_PLAN_INDIVIDUAL_YEARLY' },
  family:     { monthly: 'RAZORPAY_PLAN_FAMILY_MONTHLY',     yearly: 'RAZORPAY_PLAN_FAMILY_YEARLY' },
};

function jsonErr(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return jsonErr('Razorpay keys not configured', 500);

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return jsonErr('not_authenticated', 401);

    const body = await req.json().catch(() => ({}));
    const plan = String(body?.plan ?? '');
    const cycle = String(body?.cycle ?? '');
    const scheduleChangeAt = body?.schedule_change_at === 'now' ? 'now' : 'cycle_end';
    const envKey = PLAN_ENV[plan]?.[cycle];
    if (!envKey) return jsonErr('plan must be individual|family and cycle must be monthly|yearly', 400);
    const planId = Deno.env.get(envKey);
    if (!planId) return jsonErr(`Razorpay plan id missing: set ${envKey}`, 500);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: sub } = await admin
      .from('subscriptions')
      .select('razorpay_subscription_id, plan, billing_cycle')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sub?.razorpay_subscription_id) {
      return jsonErr('No active recurring subscription to update. Subscribe with UPI AutoPay first.', 400);
    }
    if (sub.plan === plan && sub.billing_cycle === cycle) {
      return jsonErr('Already on this plan and cycle', 400);
    }

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const resp = await fetch(`https://api.razorpay.com/v1/subscriptions/${sub.razorpay_subscription_id}`, {
      method: 'PATCH',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: planId,
        schedule_change_at: scheduleChangeAt,
        customer_notify: 1,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error('Razorpay subscription update error', resp.status, data);
      return jsonErr(data?.error?.description ?? 'Could not switch plan', 500);
    }

    // Record the requested change locally. Webhook will confirm at activation.
    await admin.from('subscriptions').update({
      razorpay_plan_id: planId,
      // We optimistically reflect cycle/plan so the UI flips immediately when scheduled "now".
      ...(scheduleChangeAt === 'now' ? { plan, billing_cycle: cycle } : {}),
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);

    return new Response(JSON.stringify({
      ok: true,
      scheduled_at: scheduleChangeAt,
      next_plan: plan,
      next_cycle: cycle,
      razorpay_subscription_id: sub.razorpay_subscription_id,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('update-subscription error', err);
    return jsonErr((err as Error).message ?? 'Unexpected error', 500);
  }
});

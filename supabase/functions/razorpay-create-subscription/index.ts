// Razorpay: create a recurring Subscription (UPI AutoPay / card / netbanking mandate).
// Body: { plan: 'individual'|'family', cycle: 'monthly'|'yearly' }
// Returns { subscription_id, key_id, plan, cycle }.
// Plan IDs are stored as env secrets so they can be rotated without code changes.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

// total_count = number of billing cycles to charge. 120 = 10 years monthly, 10 = 10 years yearly.
const PLAN_CONFIG: Record<string, Record<string, { envKey: string; totalCount: number }>> = {
  individual: {
    monthly: { envKey: 'RAZORPAY_PLAN_INDIVIDUAL_MONTHLY', totalCount: 120 },
    yearly: { envKey: 'RAZORPAY_PLAN_INDIVIDUAL_YEARLY', totalCount: 10 },
  },
  family: {
    monthly: { envKey: 'RAZORPAY_PLAN_FAMILY_MONTHLY', totalCount: 120 },
    yearly: { envKey: 'RAZORPAY_PLAN_FAMILY_YEARLY', totalCount: 10 },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return jsonErr('Razorpay keys not configured', 500);
    }

    // Auth: require a signed-in user
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) return jsonErr('not_authenticated', 401);

    const body = await req.json().catch(() => ({}));
    const plan = String(body?.plan ?? '');
    const cycle = String(body?.cycle ?? '');
    const planCfg = PLAN_CONFIG[plan]?.[cycle];
    if (!planCfg) return jsonErr('plan must be individual|family and cycle must be monthly|yearly', 400);

    const planId = Deno.env.get(planCfg.envKey);
    if (!planId) {
      return jsonErr(`Razorpay plan id missing: set ${planCfg.envKey} secret`, 500);
    }

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const rzpResp = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: planId,
        total_count: planCfg.totalCount,
        customer_notify: 1,
        notes: { user_id: user.id, plan, cycle, email: user.email ?? '' },
      }),
    });
    const data = await rzpResp.json();
    if (!rzpResp.ok) {
      console.error('Razorpay subscription error', rzpResp.status, data);
      return jsonErr(data?.error?.description ?? 'Razorpay subscription creation failed', 500);
    }

    // Persist pending subscription record (status stays 'free' until webhook activates it)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    await admin.from('subscriptions').upsert({
      user_id: user.id,
      plan: 'free',
      status: 'active',
      billing_cycle: cycle,
      razorpay_subscription_id: data.id,
      razorpay_plan_id: planId,
    }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({
      subscription_id: data.id,
      key_id: RAZORPAY_KEY_ID,
      plan,
      cycle,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('create-subscription error', err);
    return jsonErr((err as Error).message ?? 'Unexpected error', 500);
  }
});

function jsonErr(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

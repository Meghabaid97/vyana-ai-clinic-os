// Razorpay: create order for a Vyana plan.
// Body: { plan: 'individual'|'family', cycle: 'monthly'|'yearly' }
// Amount is derived server-side so the client cannot tamper with pricing.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

// Prices in paise. Keep in sync with src/lib/plans.ts
const PRICE_TABLE: Record<string, Record<string, number>> = {
  individual: { monthly: 9900, yearly: 79900 },
  family: { monthly: 29900, yearly: 239900 },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return new Response(JSON.stringify({ error: 'Razorpay keys not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const plan = String(body?.plan ?? '');
    const cycle = String(body?.cycle ?? '');
    const userId = typeof body?.user_id === 'string' ? body.user_id : null;

    if (!PRICE_TABLE[plan] || !PRICE_TABLE[plan][cycle]) {
      return new Response(
        JSON.stringify({ error: 'plan must be individual|family and cycle must be monthly|yearly' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const amount = PRICE_TABLE[plan][cycle];
    const receipt = `vy_${plan}_${cycle}_${crypto.randomUUID().slice(0, 12)}`;
    const notes: Record<string, string> = { plan, cycle, one_time: 'true' };
    if (userId) notes.user_id = userId;

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const rzpResp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'INR', receipt, notes, payment_capture: 1 }),
    });

    const data = await rzpResp.json();

    if (!rzpResp.ok) {
      const status = rzpResp.status === 401 ? 401 : 500;
      console.error('Razorpay order error', rzpResp.status, data);
      return new Response(
        JSON.stringify({ error: data?.error?.description ?? 'Razorpay order creation failed' }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        order_id: data.id,
        amount: data.amount,
        currency: data.currency,
        receipt: data.receipt,
        key_id: RAZORPAY_KEY_ID,
        plan,
        cycle,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('create-order error', err);
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

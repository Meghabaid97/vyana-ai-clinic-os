// Cancel a Razorpay recurring subscription at the end of the current billing cycle.
// The local DB row is also flagged via cancel_subscription RPC so the UI reflects it immediately.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return j({ error: 'Razorpay keys not configured' }, 500);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) return j({ error: 'not_authenticated' }, 401);

    const { data: row } = await supabase
      .from('subscriptions')
      .select('razorpay_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const subId = row?.razorpay_subscription_id;
    if (subId) {
      const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
      const r = await fetch(`https://api.razorpay.com/v1/subscriptions/${subId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel_at_cycle_end: 1 }),
      });
      const data = await r.json();
      if (!r.ok) {
        console.error('rzp cancel failed', r.status, data);
        // Continue — we still flag locally so the user isn't blocked.
      }
    }

    const { data: rpcRes, error: rpcErr } = await supabase.rpc('cancel_subscription');
    if (rpcErr) return j({ error: rpcErr.message }, 500);
    return j({ ok: true, ...rpcRes });
  } catch (err) {
    console.error('cancel-subscription error', err);
    return j({ error: (err as Error).message ?? 'Unexpected error' }, 500);
  }
});

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

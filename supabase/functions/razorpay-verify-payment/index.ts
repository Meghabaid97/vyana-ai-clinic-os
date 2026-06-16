// Razorpay: verify payment signature and activate the user's subscription.
// HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET) must equal razorpay_signature.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Guardrail: test-mode payments must NEVER grant Pro entitlements unless explicitly allowed.
const ALLOW_TEST_PAYMENTS = (Deno.env.get('ALLOW_TEST_PAYMENTS') ?? '').toLowerCase() === 'true';
const IS_TEST_KEY = !!RAZORPAY_KEY_ID && RAZORPAY_KEY_ID.startsWith('rzp_test_');

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let m = 0;
  for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}

function addInterval(cycle: string): Date {
  const d = new Date();
  if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return new Response(JSON.stringify({ error: 'Razorpay secret not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null) as any;
    const orderId = body?.razorpay_order_id;
    const paymentId = body?.razorpay_payment_id;
    const signature = body?.razorpay_signature;

    if (typeof orderId !== 'string' || !orderId ||
        typeof paymentId !== 'string' || !paymentId ||
        typeof signature !== 'string' || !signature) {
      return new Response(
        JSON.stringify({ error: 'razorpay_order_id, razorpay_payment_id and razorpay_signature are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(RAZORPAY_KEY_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${orderId}|${paymentId}`));
    const expected = toHex(sig);

    if (!timingSafeEqual(expected, signature)) {
      return new Response(JSON.stringify({ verified: false, error: 'Signature mismatch' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Identify caller from JWT
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ verified: true, warning: 'Payment verified but no user; subscription not activated' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch order from Razorpay to get plan + cycle from notes (trusted)
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const orderResp = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    const orderData = await orderResp.json();
    const plan = orderData?.notes?.plan;
    const cycle = orderData?.notes?.cycle;

    if (plan !== 'individual' && plan !== 'family') {
      return new Response(JSON.stringify({ verified: true, warning: 'Unknown plan; not activated' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const safeCycle = cycle === 'yearly' ? 'yearly' : 'monthly';

    // GUARDRAIL: Refuse to activate Pro from test-mode payments unless explicitly allowed.
    if (IS_TEST_KEY && !ALLOW_TEST_PAYMENTS) {
      console.warn('[razorpay-verify-payment] Test-mode payment refused activation', { userId, paymentId, orderId });
      return new Response(JSON.stringify({
        verified: true,
        activated: false,
        test_mode: true,
        warning: 'Test-mode payment verified but Pro not activated. Switch to live Razorpay keys (or set ALLOW_TEST_PAYMENTS=true) to enable test activations.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const periodEnd = addInterval(safeCycle).toISOString();

    const { error: upsertErr } = await admin.from('subscriptions').upsert({
      user_id: userId,
      plan,
      billing_cycle: safeCycle,
      status: 'active',
      current_period_end: periodEnd,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (upsertErr) {
      console.error('subscription upsert failed', upsertErr);
      return new Response(JSON.stringify({ verified: true, error: 'Subscription activation failed', detail: upsertErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      verified: true, activated: true, plan, cycle: safeCycle, current_period_end: periodEnd,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('verify-payment error', err);
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'Unexpected error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

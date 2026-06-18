// Razorpay webhook for subscription lifecycle events.
// Configure in Razorpay Dashboard → Settings → Webhooks with these events:
//   subscription.authenticated, subscription.activated, subscription.charged,
//   subscription.completed, subscription.cancelled, subscription.halted, subscription.paused
// URL: https://<project-ref>.functions.supabase.co/razorpay-webhook
// Secret: RAZORPAY_WEBHOOK_SECRET
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  try {
    if (!WEBHOOK_SECRET) {
      console.error('RAZORPAY_WEBHOOK_SECRET not set');
      return new Response('misconfigured', { status: 500 });
    }

    const raw = await req.text();
    const signature = req.headers.get('x-razorpay-signature') ?? '';

    const expected = await hmacSha256Hex(WEBHOOK_SECRET, raw);
    if (!timingSafeEqual(expected, signature)) {
      console.warn('webhook signature mismatch');
      return new Response('invalid signature', { status: 401 });
    }

    const payload = JSON.parse(raw);
    const event = String(payload?.event ?? '');
    const sub = payload?.payload?.subscription?.entity;
    if (!sub?.id) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no_subscription_entity' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find local subscription by razorpay id
    const { data: existing } = await admin
      .from('subscriptions')
      .select('user_id, plan, billing_cycle')
      .eq('razorpay_subscription_id', sub.id)
      .maybeSingle();

    if (!existing) {
      console.warn('no local subscription for', sub.id);
      return new Response(JSON.stringify({ ok: true, skipped: 'not_found' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const notes = sub.notes ?? {};
    const planName = (notes.plan as string) || existing.plan || 'individual';
    const cycle = (notes.cycle as string) || existing.billing_cycle || 'monthly';

    const periodEndUnix = sub.current_end ?? sub.charge_at ?? null;
    const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null;

    const patch: Record<string, unknown> = {
      razorpay_customer_id: sub.customer_id ?? null,
      razorpay_plan_id: sub.plan_id ?? null,
      updated_at: new Date().toISOString(),
    };

    switch (event) {
      case 'subscription.authenticated':
      case 'subscription.activated':
      case 'subscription.charged':
        patch.plan = planName;
        patch.status = 'active';
        patch.billing_cycle = cycle;
        if (periodEnd) patch.current_period_end = periodEnd;
        patch.cancel_at_period_end = false;
        patch.canceled_at = null;
        break;
      case 'subscription.halted':
      case 'subscription.paused':
        patch.status = 'past_due';
        break;
      case 'subscription.cancelled':
        patch.cancel_at_period_end = true;
        patch.canceled_at = new Date().toISOString();
        // Keep plan active until period_end; expiry sweeper will downgrade.
        break;
      case 'subscription.completed':
        patch.status = 'expired';
        patch.plan = 'free';
        break;
      default:
        // Acknowledge unknown events so Razorpay doesn't retry forever.
        return new Response(JSON.stringify({ ok: true, ignored: event }), {
          headers: { 'Content-Type': 'application/json' },
        });
    }

    const { error } = await admin
      .from('subscriptions')
      .update(patch)
      .eq('razorpay_subscription_id', sub.id);
    if (error) {
      console.error('subscription update failed', error);
      return new Response('db error', { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, event }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('webhook error', err);
    return new Response('error', { status: 500 });
  }
});

async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

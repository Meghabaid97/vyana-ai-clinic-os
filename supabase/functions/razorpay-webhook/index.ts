// Razorpay webhook for subscription lifecycle events.
// Configure in Razorpay Dashboard → Settings → Webhooks with these events:
//   subscription.authenticated, subscription.activated, subscription.charged,
//   subscription.completed, subscription.cancelled, subscription.halted, subscription.paused
// URL: https://<project-ref>.functions.supabase.co/razorpay-webhook
// Secret: RAZORPAY_WEBHOOK_SECRET
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function planLabel(plan: string, cycle: string) {
  const name = plan === 'family' ? 'Vyana Family' : 'Vyana Individual';
  return `${name} · ${cycle === 'yearly' ? 'yearly' : 'monthly'}`;
}

async function userEmailAndName(admin: ReturnType<typeof createClient>, userId: string) {
  const { data: u } = await admin.auth.admin.getUserById(userId);
  const email = u?.user?.email ?? null;
  const { data: p } = await admin
    .from('patients')
    .select('name')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .maybeSingle();
  return { email, name: p?.name ?? u?.user?.user_metadata?.name ?? null };
}

async function sendEmail(templateName: string, recipient: string, data: Record<string, unknown>) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({ templateName, recipientEmail: recipient, templateData: data }),
    });
  } catch (e) {
    console.error('email send failed', templateName, e);
  }
}

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
    const paymentEntity = payload?.payload?.payment?.entity;
    if (!sub?.id) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no_subscription_entity' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: existing } = await admin
      .from('subscriptions')
      .select('user_id, plan, billing_cycle, status')
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

    let sendPastDue = false;
    let sendReceipt = false;

    switch (event) {
      case 'subscription.authenticated':
      case 'subscription.activated':
        patch.plan = planName;
        patch.status = 'active';
        patch.billing_cycle = cycle;
        if (periodEnd) patch.current_period_end = periodEnd;
        patch.cancel_at_period_end = false;
        patch.canceled_at = null;
        break;
      case 'subscription.charged':
        patch.plan = planName;
        patch.status = 'active';
        patch.billing_cycle = cycle;
        if (periodEnd) patch.current_period_end = periodEnd;
        patch.cancel_at_period_end = false;
        patch.canceled_at = null;
        sendReceipt = true;
        break;
      case 'subscription.halted':
      case 'subscription.paused':
        patch.status = 'past_due';
        // Only send dunning email if we're transitioning into past_due
        if (existing.status !== 'past_due') sendPastDue = true;
        break;
      case 'subscription.cancelled':
        patch.cancel_at_period_end = true;
        patch.canceled_at = new Date().toISOString();
        break;
      case 'subscription.completed':
        patch.status = 'expired';
        patch.plan = 'free';
        break;
      default:
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

    // Side-effect emails (fire-and-forget; never block webhook ack)
    if (sendPastDue || sendReceipt) {
      const { email, name } = await userEmailAndName(admin, existing.user_id);
      if (email) {
        if (sendPastDue) {
          const reason = paymentEntity?.error_description ?? null;
          await sendEmail('payment-past-due', email, {
            name, planLabel: planLabel(planName, cycle), reason,
          });
        }
        if (sendReceipt) {
          const amount = paymentEntity?.amount ?? null;
          const paymentId = paymentEntity?.id ?? null;
          await sendEmail('payment-receipt', email, {
            name,
            planLabel: planLabel(planName, cycle),
            amountInr: amount != null ? `₹${(amount / 100).toLocaleString('en-IN')}` : undefined,
            paymentId,
            receiptDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            nextRenewalDate: periodEnd
              ? new Date(periodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : undefined,
            mode: 'autopay',
          });
        }
      }
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

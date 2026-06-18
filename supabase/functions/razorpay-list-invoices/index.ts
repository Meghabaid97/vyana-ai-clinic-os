// Razorpay: list the current user's invoices (subscription renewals) and payments (one-time orders).
// Returns a unified, chronological list for the billing-history page.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

interface Item {
  id: string;
  kind: 'subscription' | 'one_time';
  status: string;
  amount_inr: number;
  description: string;
  created_at: string;
  short_url?: string | null;
  payment_id?: string | null;
  order_id?: string | null;
  invoice_id?: string | null;
}

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

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: sub } = await admin
      .from('subscriptions')
      .select('razorpay_subscription_id, razorpay_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const items: Item[] = [];

    // 1) Subscription invoices (renewals)
    if (sub?.razorpay_subscription_id) {
      const invResp = await fetch(
        `https://api.razorpay.com/v1/invoices?subscription_id=${sub.razorpay_subscription_id}&count=50`,
        { headers: { Authorization: `Basic ${auth}` } },
      );
      const invData = await invResp.json();
      if (invResp.ok && Array.isArray(invData?.items)) {
        for (const inv of invData.items) {
          items.push({
            id: inv.id,
            kind: 'subscription',
            status: inv.status,
            amount_inr: (inv.amount ?? 0) / 100,
            description: inv.description || 'Subscription renewal',
            created_at: new Date((inv.issued_at ?? inv.created_at ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
            short_url: inv.short_url ?? null,
            payment_id: inv.payment_id ?? null,
            order_id: inv.order_id ?? null,
            invoice_id: inv.id,
          });
        }
      } else {
        console.warn('invoice fetch failed', invResp.status, invData);
      }
    }

    // 2) One-time payments by this customer (if we know their customer id)
    if (sub?.razorpay_customer_id) {
      const payResp = await fetch(
        `https://api.razorpay.com/v1/customers/${sub.razorpay_customer_id}/payments?count=50`,
        { headers: { Authorization: `Basic ${auth}` } },
      );
      const payData = await payResp.json();
      if (payResp.ok && Array.isArray(payData?.items)) {
        for (const p of payData.items) {
          // Skip subscription-linked payments (already covered above)
          if (p.invoice_id || p.notes?.one_time !== 'true') continue;
          items.push({
            id: p.id,
            kind: 'one_time',
            status: p.status,
            amount_inr: (p.amount ?? 0) / 100,
            description: p.description || 'One-time plan payment',
            created_at: new Date((p.created_at ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
            payment_id: p.id,
            order_id: p.order_id ?? null,
          });
        }
      }
    }

    items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

    return new Response(JSON.stringify({ items }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('list-invoices error', err);
    return jsonErr((err as Error).message ?? 'Unexpected error', 500);
  }
});

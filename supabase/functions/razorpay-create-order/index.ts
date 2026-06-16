// Razorpay: create order
// Returns { order_id, amount, currency, key_id } for the frontend checkout modal.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Razorpay keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const amount = Number(body?.amount);
    const currency = (body?.currency ?? 'INR').toString();
    const receipt = (body?.receipt ?? `rcpt_${crypto.randomUUID().slice(0, 16)}`).toString();
    const notes = body?.notes && typeof body.notes === 'object' ? body.notes : undefined;

    if (!Number.isFinite(amount) || amount < 100 || !Number.isInteger(amount)) {
      return new Response(
        JSON.stringify({ error: 'amount must be an integer in paise, minimum 100' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const rzpResp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, currency, receipt, notes, payment_capture: 1 }),
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
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('create-order error', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

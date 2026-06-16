// Razorpay: verify payment signature
// HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET) must equal razorpay_signature.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Razorpay secret not configured' }),
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

    const orderId = body?.razorpay_order_id;
    const paymentId = body?.razorpay_payment_id;
    const signature = body?.razorpay_signature;

    if (
      typeof orderId !== 'string' || !orderId ||
      typeof paymentId !== 'string' || !paymentId ||
      typeof signature !== 'string' || !signature
    ) {
      return new Response(
        JSON.stringify({ error: 'razorpay_order_id, razorpay_payment_id and razorpay_signature are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(RAZORPAY_KEY_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${orderId}|${paymentId}`));
    const expected = toHex(sig);

    if (!timingSafeEqual(expected, signature)) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Signature mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ verified: true, razorpay_order_id: orderId, razorpay_payment_id: paymentId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('verify-payment error', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

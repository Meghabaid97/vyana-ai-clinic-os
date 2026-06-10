import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// NOTE: Real UIDAI/ABDM eKYC integration is not yet in place. To avoid giving
// callers a false sense of verification, this endpoint now always returns
// `verified: false` with a clear reason. Previously, a hardcoded mock map of
// 12-digit numbers returned `verified: true` with fabricated identity data —
// that has been removed.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: hasRole } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'doctor'
    });
    if (!hasRole) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Doctor role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { aadhaarNumber } = await req.json();
    if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
      return new Response(
        JSON.stringify({
          verified: false,
          reason: 'invalid_format',
          error: 'Invalid Aadhaar number format. Must be 12 digits.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        verified: false,
        reason: 'verification_unavailable',
        message: 'Aadhaar verification is not yet integrated with UIDAI/ABDM. This endpoint cannot verify identity.'
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[verify-aadhaar] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

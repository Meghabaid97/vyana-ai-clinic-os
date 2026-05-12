import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock Aadhaar data for testing
const mockAadhaarData: Record<string, { name: string; age: number; gender: string; address: string }> = {
  "123456789012": {
    name: "Rahul Sharma",
    age: 35,
    gender: "Male",
    address: "123 MG Road, Bangalore, Karnataka 560001"
  },
  "234567890123": {
    name: "Priya Patel",
    age: 28,
    gender: "Female",
    address: "456 Nehru Street, Mumbai, Maharashtra 400001"
  },
  "345678901234": {
    name: "Amit Kumar",
    age: 45,
    gender: "Male",
    address: "789 Gandhi Nagar, Delhi 110001"
  },
  "456789012345": {
    name: "Sunita Devi",
    age: 52,
    gender: "Female",
    address: "321 Tagore Lane, Kolkata, West Bengal 700001"
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
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

    // Check if user has doctor role
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

    // Validate Aadhaar format (12 digits)
    if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'Invalid Aadhaar number format. Must be 12 digits.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Mock Aadhaar Verification] Verifying: ${aadhaarNumber.substring(0, 4)}****${aadhaarNumber.substring(8)}`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if Aadhaar exists in mock data
    const aadhaarData = mockAadhaarData[aadhaarNumber];

    if (aadhaarData) {
      console.log(`[Mock Aadhaar Verification] Found matching record`);
      return new Response(
        JSON.stringify({
          verified: true,
          data: {
            name: aadhaarData.name,
            age: aadhaarData.age,
            gender: aadhaarData.gender,
          maskedAadhaar: `XXXX-XXXX-${aadhaarNumber.substring(8)}`,
            verificationTimestamp: new Date().toISOString()
          },
          message: "Aadhaar verified successfully"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // For any other 12-digit number, return unverified but allow proceeding
      console.log(`[Mock Aadhaar Verification] No matching record, returning unverified`);
      return new Response(
        JSON.stringify({
          verified: false,
          error: "Aadhaar number not found in records"
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('[Mock Aadhaar Verification] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

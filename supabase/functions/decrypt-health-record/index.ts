import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token)
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const recordIds: string[] = Array.isArray(body?.recordIds) ? body.recordIds : []
    if (recordIds.length === 0 || recordIds.length > 100) {
      return new Response(JSON.stringify({ error: 'recordIds must be 1-100 UUIDs' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: Record<string, { ai_summary: string | null; diagnoses: unknown }> = {}
    for (const id of recordIds) {
      const { data, error } = await supabase.rpc('decrypt_health_record_phi', { _record_id: id })
      if (error) {
        results[id] = { ai_summary: null, diagnoses: null }
        continue
      }
      const row = Array.isArray(data) ? data[0] : data
      results[id] = {
        ai_summary: row?.ai_summary ?? null,
        diagnoses: row?.diagnoses ?? null,
      }
    }

    return new Response(JSON.stringify({ records: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

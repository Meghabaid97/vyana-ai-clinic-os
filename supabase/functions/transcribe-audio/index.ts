import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function checkRateLimit(userId: string, functionName: string, maxPerHour = 50) {
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { data } = await adminClient
    .from('api_usage')
    .select('id')
    .eq('user_id', userId)
    .eq('function_name', functionName)
    .gte('created_at', oneHourAgo);

  if (data && data.length >= maxPerHour) {
    throw new Error('RATE_LIMITED');
  }

  await adminClient.from('api_usage').insert({ user_id: userId, function_name: functionName });
}

function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    chunks.push(bytes);
    position += chunkSize;
  }
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: roleData } = await supabaseClient
      .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'doctor').single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Requires doctor role' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Rate limit: 50 transcriptions per hour
    try {
      await checkRateLimit(user.id, 'transcribe-audio', 50);
    } catch (e) {
      if (e instanceof Error && e.message === 'RATE_LIMITED') {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw e;
    }

    const { audio, language, mixedLanguage } = await req.json();
    
    if (!audio || typeof audio !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid audio data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (audio.length > 33000000) {
      return new Response(JSON.stringify({ error: 'Audio file too large' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing audio transcription for user:', user.id, 'language:', language || 'auto');

    const binaryAudio = processBase64Chunks(audio);
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    
    if (mixedLanguage) {
      const primaryLang = mixedLanguage.split('-')[0];
      formData.append('language', primaryLang);
      const prompts: Record<string, string> = {
        'hi-en': 'This is a medical consultation in Hindi and English. Transcribe both languages accurately.',
        'bn-en': 'This is a medical consultation in Bengali and English. Transcribe both languages accurately.',
        'ta-en': 'This is a medical consultation in Tamil and English. Transcribe both languages accurately.',
        'te-en': 'This is a medical consultation in Telugu and English. Transcribe both languages accurately.',
        'mr-en': 'This is a medical consultation in Marathi and English. Transcribe both languages accurately.',
      };
      formData.append('prompt', prompts[mixedLanguage] || prompts['hi-en']);
    } else if (language && language !== 'auto') {
      formData.append('language', language);
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    return new Response(JSON.stringify({ text: result.text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Transcription error:', error.message);
    return new Response(JSON.stringify({ error: 'Processing failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

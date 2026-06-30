
CREATE TABLE public.ai_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  response JSONB NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (function_name, cache_key)
);

CREATE INDEX ai_cache_expires_at_idx ON public.ai_cache (expires_at);

GRANT ALL ON public.ai_cache TO service_role;

ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- No policies for authenticated/anon — only service_role bypasses RLS.
CREATE POLICY "service role only - no client read"
  ON public.ai_cache FOR SELECT
  TO authenticated
  USING (false);


-- Per-user token-bucket rate limiter for AI-heavy edge functions
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  tokens double precision NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, bucket)
);

GRANT ALL ON public.rate_limit_buckets TO service_role;
-- Intentionally NO grants to anon/authenticated: only edge functions (service_role) touch this.

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- No policies => locked from anon/authenticated. service_role bypasses RLS.

-- Atomic consume function. Returns true if consumed, false if rate-limited.
-- Uses simple continuous-refill token bucket.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  _user_id uuid,
  _bucket text,
  _capacity double precision,
  _refill_per_sec double precision,
  _cost double precision DEFAULT 1
)
RETURNS TABLE(allowed boolean, tokens_remaining double precision, retry_after_sec double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.rate_limit_buckets%ROWTYPE;
  _now timestamptz := now();
  _elapsed double precision;
  _new_tokens double precision;
BEGIN
  INSERT INTO public.rate_limit_buckets(user_id, bucket, tokens, updated_at)
  VALUES (_user_id, _bucket, _capacity, _now)
  ON CONFLICT (user_id, bucket) DO NOTHING;

  SELECT * INTO _row
  FROM public.rate_limit_buckets
  WHERE user_id = _user_id AND bucket = _bucket
  FOR UPDATE;

  _elapsed := GREATEST(0, EXTRACT(EPOCH FROM (_now - _row.updated_at)));
  _new_tokens := LEAST(_capacity, _row.tokens + (_elapsed * _refill_per_sec));

  IF _new_tokens >= _cost THEN
    _new_tokens := _new_tokens - _cost;
    UPDATE public.rate_limit_buckets
       SET tokens = _new_tokens, updated_at = _now
     WHERE user_id = _user_id AND bucket = _bucket;
    RETURN QUERY SELECT true, _new_tokens, 0::double precision;
  ELSE
    UPDATE public.rate_limit_buckets
       SET tokens = _new_tokens, updated_at = _now
     WHERE user_id = _user_id AND bucket = _bucket;
    RETURN QUERY SELECT false, _new_tokens,
      CASE WHEN _refill_per_sec > 0
           THEN (_cost - _new_tokens) / _refill_per_sec
           ELSE 60::double precision END;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(uuid, text, double precision, double precision, double precision) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(uuid, text, double precision, double precision, double precision) TO service_role;

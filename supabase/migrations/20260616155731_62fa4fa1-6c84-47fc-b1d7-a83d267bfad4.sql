
-- 1) subscriptions
CREATE TABLE public.subscriptions (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','individual','family')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','canceled','expired')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly','yearly')),
  current_period_end TIMESTAMPTZ,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) usage_counters
CREATE TABLE public.usage_counters (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_month TEXT NOT NULL, -- YYYY-MM
  briefings_generated INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period_month)
);

GRANT SELECT ON public.usage_counters TO authenticated;
GRANT ALL ON public.usage_counters TO service_role;

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
  ON public.usage_counters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER usage_counters_set_updated_at
  BEFORE UPDATE ON public.usage_counters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) increment_briefing_usage: callable from authenticated client to bump current-month counter
CREATE OR REPLACE FUNCTION public.increment_briefing_usage()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me UUID := auth.uid();
  _period TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  _new_count INT;
BEGIN
  IF _me IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO public.usage_counters (user_id, period_month, briefings_generated)
  VALUES (_me, _period, 1)
  ON CONFLICT (user_id, period_month)
  DO UPDATE SET briefings_generated = public.usage_counters.briefings_generated + 1,
                updated_at = now()
  RETURNING briefings_generated INTO _new_count;

  RETURN _new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_briefing_usage() TO authenticated;

-- 4) get_entitlements
CREATE OR REPLACE FUNCTION public.get_entitlements()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me UUID := auth.uid();
  _period TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  _plan TEXT := 'free';
  _status TEXT := 'active';
  _period_end TIMESTAMPTZ;
  _is_pro BOOLEAN := false;
  _briefings_used INT := 0;
  _docs_used INT := 0;
  _family_count INT := 0;
  _briefings_limit INT := 1;
  _docs_limit INT := 5;
  _family_limit INT := 2;
BEGIN
  IF _me IS NULL THEN
    RETURN jsonb_build_object('plan','free','is_pro',false,'authenticated',false);
  END IF;

  SELECT plan, status, current_period_end
    INTO _plan, _status, _period_end
  FROM public.subscriptions WHERE user_id = _me;

  IF _plan IS NULL THEN _plan := 'free'; END IF;

  -- Expire if past period_end
  IF _plan <> 'free' AND _period_end IS NOT NULL AND _period_end < now() THEN
    _plan := 'free';
    _status := 'expired';
  END IF;

  _is_pro := _plan IN ('individual','family') AND _status = 'active';

  SELECT COALESCE(briefings_generated, 0) INTO _briefings_used
  FROM public.usage_counters WHERE user_id = _me AND period_month = _period;
  IF _briefings_used IS NULL THEN _briefings_used := 0; END IF;

  SELECT count(*) INTO _docs_used
  FROM public.health_records hr
  JOIN public.patients p ON p.id = hr.patient_id
  WHERE p.user_id = _me;

  SELECT count(*) INTO _family_count
  FROM public.patients WHERE user_id = _me;
  -- plus granted-in family
  _family_count := _family_count + (
    SELECT count(*) FROM public.patient_access_grants g
    WHERE g.grantee_user_id = _me AND g.revoked_at IS NULL
  );

  RETURN jsonb_build_object(
    'authenticated', true,
    'plan', _plan,
    'status', _status,
    'is_pro', _is_pro,
    'current_period_end', _period_end,
    'briefings_used', _briefings_used,
    'briefings_limit', CASE WHEN _is_pro THEN NULL ELSE _briefings_limit END,
    'briefings_remaining', CASE WHEN _is_pro THEN NULL ELSE GREATEST(0, _briefings_limit - _briefings_used) END,
    'docs_used', _docs_used,
    'docs_limit', CASE WHEN _is_pro THEN NULL ELSE _docs_limit END,
    'docs_remaining', CASE WHEN _is_pro THEN NULL ELSE GREATEST(0, _docs_limit - _docs_used) END,
    'family_used', _family_count,
    'family_limit', CASE WHEN _plan = 'family' AND _status='active' THEN 6
                         WHEN _plan = 'individual' AND _status='active' THEN 1
                         ELSE _family_limit END,
    'family_remaining', CASE
      WHEN _plan = 'family' AND _status='active' THEN GREATEST(0, 6 - _family_count)
      WHEN _plan = 'individual' AND _status='active' THEN GREATEST(0, 1 - _family_count)
      ELSE GREATEST(0, _family_limit - _family_count)
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_entitlements() TO authenticated;

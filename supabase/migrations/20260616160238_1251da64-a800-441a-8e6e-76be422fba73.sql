
CREATE OR REPLACE FUNCTION public.increment_briefing_usage()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me UUID := auth.uid();
  _new_count INT;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  INSERT INTO public.usage_counters (user_id, period_month, briefings_generated)
  VALUES (_me, 'lifetime', 1)
  ON CONFLICT (user_id, period_month)
  DO UPDATE SET briefings_generated = public.usage_counters.briefings_generated + 1,
                updated_at = now()
  RETURNING briefings_generated INTO _new_count;

  RETURN _new_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_entitlements()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me UUID := auth.uid();
  _plan TEXT := 'free';
  _status TEXT := 'active';
  _period_end TIMESTAMPTZ;
  _is_pro BOOLEAN := false;
  _briefings_used INT := 0;
  _docs_used INT := 0;
  _family_count INT := 0;
  _briefings_limit INT := 1;   -- lifetime
  _docs_limit INT := 5;        -- lifetime
  _family_limit_free INT := 1; -- just you
BEGIN
  IF _me IS NULL THEN
    RETURN jsonb_build_object('plan','free','is_pro',false,'authenticated',false);
  END IF;

  SELECT plan, status, current_period_end INTO _plan, _status, _period_end
  FROM public.subscriptions WHERE user_id = _me;

  IF _plan IS NULL THEN _plan := 'free'; END IF;

  IF _plan <> 'free' AND _period_end IS NOT NULL AND _period_end < now() THEN
    _plan := 'free';
    _status := 'expired';
  END IF;

  _is_pro := _plan IN ('individual','family') AND _status = 'active';

  -- Lifetime briefings used
  SELECT COALESCE(SUM(briefings_generated), 0) INTO _briefings_used
  FROM public.usage_counters WHERE user_id = _me;

  -- Lifetime docs owned across owned patients
  SELECT count(*) INTO _docs_used
  FROM public.health_records hr
  JOIN public.patients p ON p.id = hr.patient_id
  WHERE p.user_id = _me;

  -- Owned + granted patients in household
  SELECT count(*) INTO _family_count FROM public.patients WHERE user_id = _me;
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
    'family_limit', CASE
      WHEN _plan = 'family' AND _status='active' THEN 6
      WHEN _plan = 'individual' AND _status='active' THEN 1
      ELSE _family_limit_free END,
    'family_remaining', CASE
      WHEN _plan = 'family' AND _status='active' THEN GREATEST(0, 6 - _family_count)
      WHEN _plan = 'individual' AND _status='active' THEN GREATEST(0, 1 - _family_count)
      ELSE GREATEST(0, _family_limit_free - _family_count)
    END
  );
END;
$$;

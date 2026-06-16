
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.cancel_subscription()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me UUID := auth.uid();
  _row public.subscriptions%ROWTYPE;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  UPDATE public.subscriptions
     SET cancel_at_period_end = TRUE,
         canceled_at = now(),
         updated_at = now()
   WHERE user_id = _me
   RETURNING * INTO _row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_active_subscription';
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cancel_at_period_end', _row.cancel_at_period_end,
    'current_period_end', _row.current_period_end
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.resume_subscription()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me UUID := auth.uid();
  _row public.subscriptions%ROWTYPE;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  UPDATE public.subscriptions
     SET cancel_at_period_end = FALSE,
         canceled_at = NULL,
         updated_at = now()
   WHERE user_id = _me
   RETURNING * INTO _row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_subscription';
  END IF;

  RETURN jsonb_build_object('ok', true, 'cancel_at_period_end', _row.cancel_at_period_end);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_subscription() TO authenticated;

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
  _cancel_at_period_end BOOLEAN := false;
  _billing_cycle TEXT;
  _is_pro BOOLEAN := false;
  _briefings_used INT := 0;
  _docs_used INT := 0;
  _family_count INT := 0;
  _briefings_limit INT := 1;
  _docs_limit INT := 5;
  _family_limit_free INT := 1;
BEGIN
  IF _me IS NULL THEN
    RETURN jsonb_build_object('plan','free','is_pro',false,'authenticated',false);
  END IF;

  SELECT plan, status, current_period_end, cancel_at_period_end, billing_cycle
    INTO _plan, _status, _period_end, _cancel_at_period_end, _billing_cycle
  FROM public.subscriptions WHERE user_id = _me;

  IF _plan IS NULL THEN _plan := 'free'; END IF;

  IF _plan <> 'free' AND _period_end IS NOT NULL AND _period_end < now() THEN
    _plan := 'free';
    _status := 'expired';
  END IF;

  -- Pro stays active until the paid period ends, even if user has scheduled cancellation.
  _is_pro := _plan IN ('individual','family')
             AND _status = 'active'
             AND (_period_end IS NULL OR _period_end > now());

  SELECT COALESCE(SUM(briefings_generated), 0) INTO _briefings_used
  FROM public.usage_counters WHERE user_id = _me;

  SELECT count(*) INTO _docs_used
  FROM public.health_records hr
  JOIN public.patients p ON p.id = hr.patient_id
  WHERE p.user_id = _me;

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
    'cancel_at_period_end', _cancel_at_period_end,
    'billing_cycle', _billing_cycle,
    'briefings_used', _briefings_used,
    'briefings_limit', CASE WHEN _is_pro THEN NULL ELSE _briefings_limit END,
    'briefings_remaining', CASE WHEN _is_pro THEN NULL ELSE GREATEST(0, _briefings_limit - _briefings_used) END,
    'docs_used', _docs_used,
    'docs_limit', CASE WHEN _is_pro THEN NULL ELSE _docs_limit END,
    'docs_remaining', CASE WHEN _is_pro THEN NULL ELSE GREATEST(0, _docs_limit - _docs_used) END,
    'family_used', _family_count,
    'family_limit', CASE
      WHEN _plan = 'family' AND _is_pro THEN 6
      WHEN _plan = 'individual' AND _is_pro THEN 1
      ELSE _family_limit_free END,
    'family_remaining', CASE
      WHEN _plan = 'family' AND _is_pro THEN GREATEST(0, 6 - _family_count)
      WHEN _plan = 'individual' AND _is_pro THEN GREATEST(0, 1 - _family_count)
      ELSE GREATEST(0, _family_limit_free - _family_count)
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_entitlements() TO authenticated;

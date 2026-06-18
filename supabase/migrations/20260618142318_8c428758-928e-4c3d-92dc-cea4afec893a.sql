
-- Server-side enforcement of free-plan caps for family members and document
-- uploads. Trusts public.get_entitlements() (SECURITY DEFINER) for ground
-- truth so that a non-Pro user cannot bypass quotas via direct REST inserts.

-- ============================================================================
-- patients: enforce family_remaining > 0 before allowing new owned patient row
-- ============================================================================
CREATE OR REPLACE FUNCTION public.enforce_patient_family_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ent jsonb;
  _remaining int;
  _is_pro boolean;
BEGIN
  -- Skip enforcement for service-role / trigger-internal contexts where there
  -- is no authenticated user (e.g. webhook back-fills). User-initiated inserts
  -- always carry auth.uid().
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only enforce for rows owned by the calling user. Inserts that target
  -- another user (already restricted by RLS) are out of scope here.
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RETURN NEW;
  END IF;

  _ent := public.get_entitlements();
  _is_pro := COALESCE((_ent->>'is_pro')::boolean, false);

  -- Pro users on the family plan: trust get_entitlements()'s remaining.
  -- Pro individual + free: same — remaining already reflects per-plan cap.
  _remaining := COALESCE((_ent->>'family_remaining')::int, 0);

  IF _remaining <= 0 THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED: family_remaining'
      USING ERRCODE = 'check_violation',
            HINT = 'Upgrade to Vyana Pro Family to add more family members.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_patient_family_limit_trg ON public.patients;
CREATE TRIGGER enforce_patient_family_limit_trg
  BEFORE INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_patient_family_limit();

-- ============================================================================
-- health_records: enforce docs_remaining > 0 before allowing new uploads
-- ============================================================================
CREATE OR REPLACE FUNCTION public.enforce_health_record_docs_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ent jsonb;
  _remaining int;
  _is_pro boolean;
  _owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only count this insert against the OWNER of the patient, which is the
  -- account whose quota applies. If the inserter is a grantee (family member
  -- with manage permission), their quota is irrelevant for this row.
  SELECT user_id INTO _owner FROM public.patients WHERE id = NEW.patient_id;
  IF _owner IS NULL OR _owner <> auth.uid() THEN
    RETURN NEW;
  END IF;

  _ent := public.get_entitlements();
  _is_pro := COALESCE((_ent->>'is_pro')::boolean, false);
  IF _is_pro THEN
    RETURN NEW;
  END IF;

  _remaining := COALESCE((_ent->>'docs_remaining')::int, 0);
  IF _remaining <= 0 THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED: docs_remaining'
      USING ERRCODE = 'check_violation',
            HINT = 'Upgrade to Vyana Pro for unlimited document uploads.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_health_record_docs_limit_trg ON public.health_records;
CREATE TRIGGER enforce_health_record_docs_limit_trg
  BEFORE INSERT ON public.health_records
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_health_record_docs_limit();

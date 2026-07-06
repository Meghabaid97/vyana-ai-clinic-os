
CREATE TABLE IF NOT EXISTS public.health_records_access_audit (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts                     timestamptz NOT NULL DEFAULT now(),
  op                     text NOT NULL CHECK (op IN ('INSERT','UPDATE','DELETE')),
  auth_uid               uuid,
  patient_id             uuid,
  record_id              uuid,
  patient_owner_user_id  uuid,
  had_grant              boolean NOT NULL DEFAULT false,
  mismatch               boolean NOT NULL DEFAULT false,
  extra                  jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS health_records_access_audit_ts_idx
  ON public.health_records_access_audit (ts DESC);
CREATE INDEX IF NOT EXISTS health_records_access_audit_mismatch_idx
  ON public.health_records_access_audit (mismatch, ts DESC) WHERE mismatch = true;
CREATE INDEX IF NOT EXISTS health_records_access_audit_patient_idx
  ON public.health_records_access_audit (patient_id, ts DESC);
CREATE INDEX IF NOT EXISTS health_records_access_audit_uid_idx
  ON public.health_records_access_audit (auth_uid, ts DESC);

GRANT ALL ON public.health_records_access_audit TO service_role;
REVOKE ALL ON public.health_records_access_audit FROM anon, authenticated, PUBLIC;

ALTER TABLE public.health_records_access_audit ENABLE ROW LEVEL SECURITY;

-- No policies granted to anon/authenticated on purpose. The audit log is
-- write-only from the trigger (SECURITY DEFINER) and readable only by
-- service_role, which bypasses RLS.

CREATE OR REPLACE FUNCTION public.audit_health_records_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_uid          uuid := auth.uid();
  v_patient_id   uuid;
  v_record_id    uuid;
  v_owner        uuid;
  v_has_grant    boolean := false;
  v_mismatch     boolean := false;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_patient_id := OLD.patient_id;
    v_record_id  := OLD.id;
  ELSE
    v_patient_id := NEW.patient_id;
    v_record_id  := NEW.id;
  END IF;

  SELECT p.user_id INTO v_owner
  FROM public.patients p
  WHERE p.id = v_patient_id;

  IF v_uid IS NOT NULL AND v_owner IS NOT NULL AND v_uid <> v_owner THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.patient_access_grants g
      WHERE g.patient_id = v_patient_id
        AND g.grantee_user_id = v_uid
        AND g.revoked_at IS NULL
    ) INTO v_has_grant;
  END IF;

  v_mismatch := (
    v_uid IS NULL
    OR v_owner IS NULL
    OR (v_uid <> v_owner AND NOT v_has_grant)
  );

  INSERT INTO public.health_records_access_audit (
    op, auth_uid, patient_id, record_id, patient_owner_user_id, had_grant, mismatch, extra
  ) VALUES (
    TG_OP, v_uid, v_patient_id, v_record_id, v_owner, v_has_grant, v_mismatch,
    jsonb_build_object('table', TG_TABLE_NAME, 'phase', 'AFTER')
  );

  IF v_mismatch THEN
    RAISE WARNING
      '[hr-audit] MISMATCH op=% auth_uid=% patient_id=% owner=% record_id=%',
      TG_OP, v_uid, v_patient_id, v_owner, v_record_id;
  END IF;

  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.audit_health_records_access() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_audit_health_records_access ON public.health_records;
CREATE TRIGGER trg_audit_health_records_access
AFTER INSERT OR UPDATE OR DELETE ON public.health_records
FOR EACH ROW EXECUTE FUNCTION public.audit_health_records_access();


-- 1) doctor_ratings: require completed appointment before INSERT
DROP POLICY IF EXISTS "Patients can rate doctors after appointments" ON public.doctor_ratings;
CREATE POLICY "Patients can rate doctors after appointments"
ON public.doctor_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'patient'::app_role)
  AND patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.doctor_id = doctor_ratings.doctor_id
      AND a.patient_id = doctor_ratings.patient_id
      AND a.status = 'completed'
  )
);

-- 2) health_records: prevent family grantees from modifying consent_shared_with.
--    Patients (owners) can still change consent. We enforce this via a trigger
--    that rejects updates to consent_shared_with from anyone who is not the
--    patient owner.
CREATE OR REPLACE FUNCTION public.prevent_grantee_consent_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_owner boolean;
BEGIN
  IF NEW.consent_shared_with IS DISTINCT FROM OLD.consent_shared_with THEN
    SELECT EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = NEW.patient_id AND p.user_id = auth.uid()
    ) INTO _is_owner;
    IF NOT _is_owner THEN
      RAISE EXCEPTION 'Only the patient owner can change consent_shared_with'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_health_records_protect_consent ON public.health_records;
CREATE TRIGGER trg_health_records_protect_consent
BEFORE UPDATE OF consent_shared_with ON public.health_records
FOR EACH ROW EXECUTE FUNCTION public.prevent_grantee_consent_change();

-- 3) Revoke EXECUTE on internal SECURITY DEFINER helpers from anon/public.
--    These are called from RLS policies and edge functions (authenticated /
--    service_role), never from anonymous clients.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_can_access_patient(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.doctor_can_access_patient(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_patient_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_has_grant_on_patient(uuid, uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_email() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decrypt_health_record_phi(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.private_phi_key() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.accept_family_invite(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decline_family_invite(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.remove_family_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_support_tickets() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;

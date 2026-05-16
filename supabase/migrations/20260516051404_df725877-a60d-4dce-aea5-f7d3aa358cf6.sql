
-- Helper: is the given user the owner of a patient profile?
CREATE OR REPLACE FUNCTION public.is_patient_owner(_user_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = _patient_id AND p.user_id = _user_id
  );
$$;

-- Helper: does the given user have an active grant on a patient?
CREATE OR REPLACE FUNCTION public.user_has_grant_on_patient(_user_id uuid, _patient_id uuid, _require_manage boolean DEFAULT false)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patient_access_grants g
    WHERE g.patient_id = _patient_id
      AND g.grantee_user_id = _user_id
      AND g.revoked_at IS NULL
      AND (NOT _require_manage OR g.permission = 'manage')
  );
$$;

-- Replace recursive policies on patients
DROP POLICY IF EXISTS "Grantees can view shared patient" ON public.patients;
DROP POLICY IF EXISTS "Grantees with manage can update shared patient" ON public.patients;

CREATE POLICY "Grantees can view shared patient"
ON public.patients FOR SELECT
USING (public.user_has_grant_on_patient(auth.uid(), id, false));

CREATE POLICY "Grantees with manage can update shared patient"
ON public.patients FOR UPDATE
USING (public.user_has_grant_on_patient(auth.uid(), id, true));

-- Replace recursive policies on patient_access_grants
DROP POLICY IF EXISTS "Owner can delete grant" ON public.patient_access_grants;
DROP POLICY IF EXISTS "Owner can revoke grant" ON public.patient_access_grants;
DROP POLICY IF EXISTS "Owner or grantee can view grant" ON public.patient_access_grants;

CREATE POLICY "Owner can delete grant"
ON public.patient_access_grants FOR DELETE
USING (public.is_patient_owner(auth.uid(), patient_id));

CREATE POLICY "Owner can revoke grant"
ON public.patient_access_grants FOR UPDATE
USING (public.is_patient_owner(auth.uid(), patient_id))
WITH CHECK (public.is_patient_owner(auth.uid(), patient_id));

CREATE POLICY "Owner or grantee can view grant"
ON public.patient_access_grants FOR SELECT
USING (grantee_user_id = auth.uid() OR public.is_patient_owner(auth.uid(), patient_id));

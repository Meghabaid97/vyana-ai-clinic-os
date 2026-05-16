
-- Security definer helper: does this doctor have consent/appointment access to a patient?
CREATE OR REPLACE FUNCTION public.doctor_can_access_patient(_doctor_user uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.health_records hr
    WHERE hr.patient_id = _patient_id
      AND _doctor_user = ANY (hr.consent_shared_with)
  ) OR EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.doctor_profiles dp ON dp.id = a.doctor_id
    WHERE a.patient_id = _patient_id
      AND dp.user_id = _doctor_user
  );
$$;

REVOKE EXECUTE ON FUNCTION public.doctor_can_access_patient(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.doctor_can_access_patient(uuid, uuid) TO authenticated;

-- Replace recursive policy on patients
DROP POLICY IF EXISTS "Doctors can view consented patients" ON public.patients;

CREATE POLICY "Doctors can view consented patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role)
  AND public.doctor_can_access_patient(auth.uid(), patients.id)
);


-- 1. Restrict doctor read access to patients table to only those who shared records/appointments
DROP POLICY IF EXISTS "Doctors can view all patients" ON public.patients;

CREATE POLICY "Doctors can view consented patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor'::app_role)
  AND (
    EXISTS (
      SELECT 1 FROM public.health_records hr
      WHERE hr.patient_id = patients.id
        AND auth.uid() = ANY(hr.consent_shared_with)
    )
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patients.id
        AND a.doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
    )
  )
);

-- 2. Lock down doctor_profiles INSERT/UPDATE to verified doctor role
DROP POLICY IF EXISTS "Doctors can insert own profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Doctors can update own profile" ON public.doctor_profiles;

CREATE POLICY "Doctors can insert own profile"
ON public.doctor_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_role(auth.uid(), 'doctor'::app_role)
);

CREATE POLICY "Doctors can update own profile"
ON public.doctor_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND public.has_role(auth.uid(), 'doctor'::app_role)
);

-- 3. Add UPDATE policies for storage buckets
CREATE POLICY "Patients can update own health record files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'health-records'
  AND public.has_role(auth.uid(), 'patient'::app_role)
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'health-records'
  AND public.has_role(auth.uid(), 'patient'::app_role)
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own symptom photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'symptom-photos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'symptom-photos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Add UPDATE policy for doctor_visit_prep
CREATE POLICY "Patients can update own visit prep"
ON public.doctor_visit_prep
FOR UPDATE
TO authenticated
USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
)
WITH CHECK (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);

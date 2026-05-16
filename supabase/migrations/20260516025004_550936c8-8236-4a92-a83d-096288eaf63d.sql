-- Tighten access_requests: invite-token reads now go exclusively through the
-- validate-invite-token edge function (service-role), so the public SELECT
-- policy is unnecessary and exposes every approved applicant's PII.
DROP POLICY IF EXISTS "Anyone can read by valid invite token" ON public.access_requests;

-- Tighten health-records storage: doctors may only read files for records
-- that the patient explicitly shared with them (consent_shared_with).
DROP POLICY IF EXISTS "Patients can view own health-records" ON storage.objects;

CREATE POLICY "Patients can view own health-records"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'health-records'
  AND (
    -- Patients: own folder
    (has_role(auth.uid(), 'patient'::app_role)
      AND (auth.uid())::text = (storage.foldername(name))[1])
    -- Doctors: only files belonging to a health_record explicitly shared with them
    OR (
      has_role(auth.uid(), 'doctor'::app_role)
      AND EXISTS (
        SELECT 1
        FROM public.health_records hr
        WHERE hr.file_path = storage.objects.name
          AND auth.uid() = ANY (hr.consent_shared_with)
      )
    )
  )
);
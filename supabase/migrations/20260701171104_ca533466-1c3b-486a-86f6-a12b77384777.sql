CREATE POLICY "Users can view linked accessible health record files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'health-records'
  AND EXISTS (
    SELECT 1
    FROM public.health_records hr
    WHERE hr.file_path = storage.objects.name
      AND public.user_can_access_patient(auth.uid(), hr.patient_id)
  )
);

CREATE POLICY "Users can update linked accessible health record files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'health-records'
  AND EXISTS (
    SELECT 1
    FROM public.health_records hr
    WHERE hr.file_path = storage.objects.name
      AND public.user_can_access_patient(auth.uid(), hr.patient_id)
  )
)
WITH CHECK (
  bucket_id = 'health-records'
  AND EXISTS (
    SELECT 1
    FROM public.health_records hr
    WHERE hr.file_path = storage.objects.name
      AND public.user_can_access_patient(auth.uid(), hr.patient_id)
  )
);

CREATE POLICY "Users can delete linked accessible health record files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'health-records'
  AND EXISTS (
    SELECT 1
    FROM public.health_records hr
    WHERE hr.file_path = storage.objects.name
      AND public.user_can_access_patient(auth.uid(), hr.patient_id)
  )
);
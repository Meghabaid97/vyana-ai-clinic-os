DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can read by token" ON public.shared_record_links;
DROP POLICY IF EXISTS "Patients can view doctors" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Patients can upload to health-records" ON storage.objects;
CREATE POLICY "Patients can upload to health-records"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'health-records'
    AND has_role(auth.uid(), 'patient'::app_role)
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 1. Remove the broad patient-readable doctor_profiles policy (no booking in consumer pivot)
DROP POLICY IF EXISTS "Patients can view doctor profiles for booking" ON public.doctor_profiles;

-- 2. Remove broken duplicate doctor_ratings SELECT policy
DROP POLICY IF EXISTS "Doctors can view their ratings" ON public.doctor_ratings;

-- 3. Tighten follow_up_reminders INSERT to enforce consultation ownership
DROP POLICY IF EXISTS "Doctors can manage own reminders" ON public.follow_up_reminders;

CREATE POLICY "Doctors can view own reminders"
ON public.follow_up_reminders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor'::app_role)
  AND auth.uid() = doctor_id
);

CREATE POLICY "Doctors can insert reminders for own consultations"
ON public.follow_up_reminders
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'doctor'::app_role)
  AND auth.uid() = doctor_id
  AND consultation_id IN (
    SELECT id FROM public.consultations WHERE doctor_id = auth.uid()
  )
);

CREATE POLICY "Doctors can update own reminders"
ON public.follow_up_reminders
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor'::app_role)
  AND auth.uid() = doctor_id
);

CREATE POLICY "Doctors can delete own reminders"
ON public.follow_up_reminders
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor'::app_role)
  AND auth.uid() = doctor_id
);

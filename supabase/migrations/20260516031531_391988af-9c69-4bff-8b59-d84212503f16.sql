
-- 1. Restrict doctor_profiles SELECT to authenticated role
DROP POLICY IF EXISTS "Doctors can view own profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Users can view own doctor profile" ON public.doctor_profiles;

CREATE POLICY "Doctors can view own profile"
ON public.doctor_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Patients can view doctor profiles for booking"
ON public.doctor_profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'patient'::app_role));

-- 2. Tighten doctor_ratings read access
DROP POLICY IF EXISTS "Anyone authenticated can view ratings" ON public.doctor_ratings;

CREATE POLICY "Patients can view their own ratings"
ON public.doctor_ratings
FOR SELECT
TO authenticated
USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);

CREATE POLICY "Doctors can view ratings on their profile"
ON public.doctor_ratings
FOR SELECT
TO authenticated
USING (
  doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
);

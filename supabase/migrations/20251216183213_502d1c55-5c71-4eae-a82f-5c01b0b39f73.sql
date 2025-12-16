-- Allow users to insert their own role during signup
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow patients to view all doctors for booking appointments
CREATE POLICY "Patients can view doctors"
ON public.doctor_profiles
FOR SELECT
USING (has_role(auth.uid(), 'patient'::app_role));
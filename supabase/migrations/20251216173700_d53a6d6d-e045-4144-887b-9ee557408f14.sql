-- Add RLS policy for patients to view their own consultations by health ID
CREATE POLICY "Patients can view consultations with their health ID"
ON public.consultations
FOR SELECT
USING (
  has_role(auth.uid(), 'patient'::app_role) AND 
  patient_national_health_id IN (
    SELECT national_health_id FROM public.patients WHERE user_id = auth.uid() AND national_health_id IS NOT NULL
  )
);
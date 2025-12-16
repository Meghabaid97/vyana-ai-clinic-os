-- Add soft delete column to consultations
ALTER TABLE public.consultations 
ADD COLUMN is_archived boolean NOT NULL DEFAULT false;

-- Update RLS policies to filter out archived consultations for regular views
DROP POLICY IF EXISTS "Verified doctors can view their own consultations" ON public.consultations;

CREATE POLICY "Verified doctors can view their own active consultations"
ON public.consultations
FOR SELECT
USING (
  auth.uid() = doctor_id 
  AND has_role(auth.uid(), 'doctor'::app_role)
  AND is_archived = false
);

-- Allow doctors to view archived consultations separately if needed
CREATE POLICY "Verified doctors can view their own archived consultations"
ON public.consultations
FOR SELECT
USING (
  auth.uid() = doctor_id 
  AND has_role(auth.uid(), 'doctor'::app_role)
  AND is_archived = true
);
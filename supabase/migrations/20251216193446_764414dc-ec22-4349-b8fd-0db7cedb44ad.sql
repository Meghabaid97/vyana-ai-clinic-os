-- Add location fields to doctor_profiles
ALTER TABLE public.doctor_profiles 
ADD COLUMN IF NOT EXISTS pincode text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Create doctor_ratings table
CREATE TABLE public.doctor_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate ratings for same appointment
ALTER TABLE public.doctor_ratings 
ADD CONSTRAINT unique_appointment_rating UNIQUE (appointment_id);

-- Enable RLS
ALTER TABLE public.doctor_ratings ENABLE ROW LEVEL SECURITY;

-- Patients can create ratings for completed appointments
CREATE POLICY "Patients can rate doctors after appointments"
ON public.doctor_ratings
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'patient'::app_role) AND
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);

-- Patients can view their own ratings
CREATE POLICY "Patients can view own ratings"
ON public.doctor_ratings
FOR SELECT
USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- Doctors can view their ratings
CREATE POLICY "Doctors can view their ratings"
ON public.doctor_ratings
FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role) AND doctor_id = auth.uid());

-- Everyone can view aggregate ratings (for doctor listing)
CREATE POLICY "Anyone authenticated can view ratings"
ON public.doctor_ratings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add location fields to patients table
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS pincode text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;
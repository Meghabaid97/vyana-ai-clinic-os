-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL,
  requested_date DATE NOT NULL,
  requested_time_slot TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  doctor_notes TEXT,
  patient_phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments"
ON public.appointments
FOR SELECT
USING (
  has_role(auth.uid(), 'patient'::app_role) AND
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);

-- Patients can create appointments
CREATE POLICY "Patients can create appointments"
ON public.appointments
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'patient'::app_role) AND
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);

-- Patients can cancel their own pending appointments
CREATE POLICY "Patients can update own appointments"
ON public.appointments
FOR UPDATE
USING (
  has_role(auth.uid(), 'patient'::app_role) AND
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);

-- Doctors can view appointments assigned to them
CREATE POLICY "Doctors can view their appointments"
ON public.appointments
FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND
  doctor_id = auth.uid()
);

-- Doctors can update appointments (approve/reject)
CREATE POLICY "Doctors can update their appointments"
ON public.appointments
FOR UPDATE
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND
  doctor_id = auth.uid()
);

-- Create trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
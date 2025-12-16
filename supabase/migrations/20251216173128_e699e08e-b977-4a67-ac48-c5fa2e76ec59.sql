-- Add 'patient' role to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'patient';

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create patients table to store patient-specific data
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  age INTEGER,
  phone TEXT,
  national_health_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on patients table
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Patients can view their own profile
CREATE POLICY "Patients can view own profile"
ON public.patients
FOR SELECT
USING (auth.uid() = user_id);

-- Patients can update their own profile
CREATE POLICY "Patients can update own profile"
ON public.patients
FOR UPDATE
USING (auth.uid() = user_id);

-- Patients can insert their own profile
CREATE POLICY "Patients can insert own profile"
ON public.patients
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Doctors can view all patients
CREATE POLICY "Doctors can view all patients"
ON public.patients
FOR SELECT
USING (public.has_role(auth.uid(), 'doctor'));

-- Create follow-up reminders table
CREATE TABLE public.follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  patient_phone TEXT NOT NULL,
  reminder_date DATE NOT NULL,
  reminder_message TEXT NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  doctor_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;

-- Doctors can manage their own reminders
CREATE POLICY "Doctors can manage own reminders"
ON public.follow_up_reminders
FOR ALL
USING (public.has_role(auth.uid(), 'doctor') AND auth.uid() = doctor_id)
WITH CHECK (public.has_role(auth.uid(), 'doctor') AND auth.uid() = doctor_id);

-- Create trigger for updated_at on patients
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
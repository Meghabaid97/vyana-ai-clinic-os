-- Create consultations table
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_national_health_id TEXT NOT NULL,
  audio_transcription TEXT NOT NULL,
  fhir_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Create policies for doctors to manage their own consultations
CREATE POLICY "Doctors can view their own consultations"
  ON public.consultations
  FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can create their own consultations"
  ON public.consultations
  FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own consultations"
  ON public.consultations
  FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own consultations"
  ON public.consultations
  FOR DELETE
  USING (auth.uid() = doctor_id);
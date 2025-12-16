-- Create storage bucket for health records
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'health-records', 
  'health-records', 
  false, 
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);

-- Create health_records table
CREATE TABLE public.health_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  ai_summary TEXT,
  consent_shared_with UUID[], -- Array of doctor_ids who have consent
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

-- Patients can manage their own health records
CREATE POLICY "Patients can view own health records"
ON public.health_records
FOR SELECT
USING (
  has_role(auth.uid(), 'patient'::app_role) AND
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);

CREATE POLICY "Patients can insert own health records"
ON public.health_records
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'patient'::app_role) AND
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);

CREATE POLICY "Patients can update own health records"
ON public.health_records
FOR UPDATE
USING (
  has_role(auth.uid(), 'patient'::app_role) AND
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);

CREATE POLICY "Patients can delete own health records"
ON public.health_records
FOR DELETE
USING (
  has_role(auth.uid(), 'patient'::app_role) AND
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);

-- Doctors can view health records shared with them
CREATE POLICY "Doctors can view shared health records"
ON public.health_records
FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND
  auth.uid() = ANY(consent_shared_with)
);

-- Storage policies for health-records bucket
CREATE POLICY "Patients can upload to health-records"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'health-records' AND
  has_role(auth.uid(), 'patient'::app_role)
);

CREATE POLICY "Patients can view own health-records"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'health-records' AND
  (
    (has_role(auth.uid(), 'patient'::app_role) AND auth.uid()::text = (storage.foldername(name))[1])
    OR
    has_role(auth.uid(), 'doctor'::app_role)
  )
);

CREATE POLICY "Patients can delete own health-records"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'health-records' AND
  has_role(auth.uid(), 'patient'::app_role) AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add trigger for updated_at
CREATE TRIGGER update_health_records_updated_at
BEFORE UPDATE ON public.health_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
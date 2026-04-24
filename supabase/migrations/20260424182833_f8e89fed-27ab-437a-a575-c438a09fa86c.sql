-- Symptom logs
CREATE TABLE public.symptom_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  symptom_type TEXT NOT NULL,
  custom_symptom_name TEXT,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 10),
  duration TEXT,
  body_location TEXT,
  triggers JSONB NOT NULL DEFAULT '[]'::jsonb,
  associated_symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
  medications_taken JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  photo_path TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_symptom_logs_patient_logged ON public.symptom_logs(patient_id, logged_at DESC);
CREATE INDEX idx_symptom_logs_type ON public.symptom_logs(patient_id, symptom_type);

ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own symptom logs"
ON public.symptom_logs FOR SELECT
USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Patients can insert own symptom logs"
ON public.symptom_logs FOR INSERT
WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Patients can update own symptom logs"
ON public.symptom_logs FOR UPDATE
USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Patients can delete own symptom logs"
ON public.symptom_logs FOR DELETE
USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE TRIGGER update_symptom_logs_updated_at
BEFORE UPDATE ON public.symptom_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Doctor visit prep summaries
CREATE TABLE public.doctor_visit_prep (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  summary TEXT NOT NULL,
  questions_for_doctor JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_medications JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
  date_range_start DATE,
  date_range_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_visit_prep_patient ON public.doctor_visit_prep(patient_id, created_at DESC);

ALTER TABLE public.doctor_visit_prep ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own visit prep"
ON public.doctor_visit_prep FOR SELECT
USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Patients can insert own visit prep"
ON public.doctor_visit_prep FOR INSERT
WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Patients can delete own visit prep"
ON public.doctor_visit_prep FOR DELETE
USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

-- Symptom photo storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('symptom-photos', 'symptom-photos', false);

CREATE POLICY "Users can view own symptom photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'symptom-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own symptom photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'symptom-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own symptom photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'symptom-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
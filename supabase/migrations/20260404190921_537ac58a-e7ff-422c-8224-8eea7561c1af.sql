
CREATE TABLE public.vital_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  health_record_id UUID NOT NULL REFERENCES public.health_records(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_file_name TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium',
  vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vital_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own vital history" ON public.vital_history
  FOR SELECT TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Patients can insert own vital history" ON public.vital_history
  FOR INSERT TO authenticated
  WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Patients can delete own vital history" ON public.vital_history
  FOR DELETE TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE INDEX idx_vital_history_patient ON public.vital_history(patient_id);
CREATE INDEX idx_vital_history_record ON public.vital_history(health_record_id);


CREATE TABLE public.medication_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily',
  time_slots TEXT[] NOT NULL DEFAULT ARRAY['08:00'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  source_record_id UUID REFERENCES public.health_records(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own medication reminders" ON public.medication_reminders
  FOR SELECT TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Patients can insert own medication reminders" ON public.medication_reminders
  FOR INSERT TO authenticated
  WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Patients can update own medication reminders" ON public.medication_reminders
  FOR UPDATE TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Patients can delete own medication reminders" ON public.medication_reminders
  FOR DELETE TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE TABLE public.shared_record_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  is_used BOOLEAN NOT NULL DEFAULT false,
  recipient_name TEXT,
  recipient_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_record_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own shared links" ON public.shared_record_links
  FOR SELECT TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Patients can create shared links" ON public.shared_record_links
  FOR INSERT TO authenticated
  WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can read by token" ON public.shared_record_links
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE INDEX idx_medication_reminders_patient ON public.medication_reminders(patient_id);
CREATE INDEX idx_shared_record_links_token ON public.shared_record_links(token);
CREATE INDEX idx_shared_record_links_patient ON public.shared_record_links(patient_id);

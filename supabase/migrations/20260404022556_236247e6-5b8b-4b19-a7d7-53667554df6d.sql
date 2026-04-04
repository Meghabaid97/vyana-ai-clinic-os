
-- Emergency contacts table
CREATE TABLE public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  relationship TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Patients can manage their own emergency contacts
CREATE POLICY "Patients can view own emergency contacts"
  ON public.emergency_contacts FOR SELECT
  USING (has_role(auth.uid(), 'patient'::app_role) AND patient_id IN (
    SELECT id FROM public.patients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Patients can insert own emergency contacts"
  ON public.emergency_contacts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'patient'::app_role) AND patient_id IN (
    SELECT id FROM public.patients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Patients can update own emergency contacts"
  ON public.emergency_contacts FOR UPDATE
  USING (has_role(auth.uid(), 'patient'::app_role) AND patient_id IN (
    SELECT id FROM public.patients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Patients can delete own emergency contacts"
  ON public.emergency_contacts FOR DELETE
  USING (has_role(auth.uid(), 'patient'::app_role) AND patient_id IN (
    SELECT id FROM public.patients WHERE user_id = auth.uid()
  ));

-- Emergency access log table
CREATE TABLE public.emergency_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emergency_contact_id UUID NOT NULL REFERENCES public.emergency_contacts(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT
);

ALTER TABLE public.emergency_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view access logs"
  ON public.emergency_access_logs FOR SELECT
  USING (has_role(auth.uid(), 'patient'::app_role) AND patient_id IN (
    SELECT id FROM public.patients WHERE user_id = auth.uid()
  ));

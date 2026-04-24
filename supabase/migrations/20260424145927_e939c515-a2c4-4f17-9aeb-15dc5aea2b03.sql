ALTER TABLE public.health_records
ADD COLUMN IF NOT EXISTS document_type text,
ADD COLUMN IF NOT EXISTS important_findings jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS medications jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allergies jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS diagnoses jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS extracted_vitals jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_confidence text;

CREATE INDEX IF NOT EXISTS idx_health_records_document_type ON public.health_records(document_type);
CREATE INDEX IF NOT EXISTS idx_health_records_important_findings ON public.health_records USING GIN(important_findings);
CREATE INDEX IF NOT EXISTS idx_health_records_medications ON public.health_records USING GIN(medications);
CREATE INDEX IF NOT EXISTS idx_health_records_diagnoses ON public.health_records USING GIN(diagnoses);
CREATE INDEX IF NOT EXISTS idx_health_records_extracted_vitals ON public.health_records USING GIN(extracted_vitals);
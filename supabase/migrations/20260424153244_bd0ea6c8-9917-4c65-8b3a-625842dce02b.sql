ALTER TABLE public.health_records
ADD COLUMN IF NOT EXISTS radiology_modality TEXT,
ADD COLUMN IF NOT EXISTS radiology_body_part TEXT,
ADD COLUMN IF NOT EXISTS radiology_study_date DATE,
ADD COLUMN IF NOT EXISTS radiology_impression JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS radiology_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS radiology_provider TEXT,
ADD COLUMN IF NOT EXISTS radiology_upload_kind TEXT NOT NULL DEFAULT 'standard';

CREATE INDEX IF NOT EXISTS idx_health_records_radiology_modality
ON public.health_records (radiology_modality)
WHERE category = 'radiology_imaging';

CREATE INDEX IF NOT EXISTS idx_health_records_radiology_study_date
ON public.health_records (radiology_study_date)
WHERE category = 'radiology_imaging';
-- Add unique constraints on phone and national_health_id (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_phone_unique ON public.patients (phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_health_id_unique ON public.patients (national_health_id) WHERE national_health_id IS NOT NULL;
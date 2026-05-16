-- Enforce uniqueness on patient phone and ABHA Health ID.
-- Use partial unique indexes so NULL / empty values are allowed during onboarding,
-- but any non-empty value must be globally unique.

CREATE UNIQUE INDEX IF NOT EXISTS patients_phone_unique_idx
  ON public.patients (phone)
  WHERE phone IS NOT NULL AND btrim(phone) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS patients_national_health_id_unique_idx
  ON public.patients (national_health_id)
  WHERE national_health_id IS NOT NULL AND btrim(national_health_id) <> '';
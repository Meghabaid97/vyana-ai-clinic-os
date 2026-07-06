ALTER TABLE public.health_records
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill owner_user_id from the authenticated storage folder when available.
UPDATE public.health_records hr
SET owner_user_id = split_part(hr.file_path, '/', 1)::uuid
WHERE hr.owner_user_id IS NULL
  AND hr.file_path ~ '^[0-9a-fA-F-]{36}/'
  AND split_part(hr.file_path, '/', 1) ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

-- Fallback for legacy rows whose file path does not contain an account folder.
UPDATE public.health_records hr
SET owner_user_id = p.user_id
FROM public.patients p
WHERE hr.patient_id = p.id
  AND hr.owner_user_id IS NULL;

-- Repair existing rows where the storage object is under one account folder but the
-- database row points at another account's patient profile.
WITH ranked_patients AS (
  SELECT
    id,
    user_id,
    row_number() OVER (PARTITION BY user_id ORDER BY is_primary DESC, created_at ASC) AS rn
  FROM public.patients
), mismatched AS (
  SELECT
    hr.id AS record_id,
    split_part(hr.file_path, '/', 1)::uuid AS path_owner_user_id,
    target.id AS target_patient_id
  FROM public.health_records hr
  JOIN public.patients current_patient ON current_patient.id = hr.patient_id
  JOIN ranked_patients target
    ON target.user_id = split_part(hr.file_path, '/', 1)::uuid
   AND target.rn = 1
  WHERE hr.file_path ~ '^[0-9a-fA-F-]{36}/'
    AND split_part(hr.file_path, '/', 1) ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    AND current_patient.user_id IS DISTINCT FROM split_part(hr.file_path, '/', 1)::uuid
)
UPDATE public.health_records hr
SET patient_id = m.target_patient_id,
    owner_user_id = m.path_owner_user_id
FROM mismatched m
WHERE hr.id = m.record_id;

-- Ensure owner_user_id matches the owning account for any remaining legacy row.
UPDATE public.health_records hr
SET owner_user_id = p.user_id
FROM public.patients p
WHERE hr.patient_id = p.id
  AND hr.owner_user_id IS DISTINCT FROM p.user_id;

ALTER TABLE public.health_records
  ALTER COLUMN owner_user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_health_records_owner_user_id
  ON public.health_records(owner_user_id, uploaded_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_health_record_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _patient_owner uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF _uid IS NOT NULL THEN
      NEW.owner_user_id := _uid;
    ELSIF NEW.owner_user_id IS NULL THEN
      RAISE EXCEPTION 'health record owner is required';
    END IF;

    SELECT p.user_id INTO _patient_owner
    FROM public.patients p
    WHERE p.id = NEW.patient_id;

    IF _patient_owner IS NULL THEN
      RAISE EXCEPTION 'health record patient profile was not found';
    END IF;

    IF NEW.owner_user_id IS DISTINCT FROM _patient_owner THEN
      RAISE EXCEPTION 'health record owner must match the patient profile owner';
    END IF;

    IF _uid IS NOT NULL AND split_part(COALESCE(NEW.file_path, ''), '/', 1) IS DISTINCT FROM _uid::text THEN
      RAISE EXCEPTION 'health record file path must be owned by the signed-in user';
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Authenticated clients can edit metadata, but cannot move a record between
    -- accounts/profiles or point it at another account's storage object.
    IF _uid IS NOT NULL THEN
      NEW.owner_user_id := OLD.owner_user_id;
      NEW.patient_id := OLD.patient_id;
      NEW.file_path := OLD.file_path;
    END IF;

    SELECT p.user_id INTO _patient_owner
    FROM public.patients p
    WHERE p.id = NEW.patient_id;

    IF _patient_owner IS NULL THEN
      RAISE EXCEPTION 'health record patient profile was not found';
    END IF;

    IF NEW.owner_user_id IS DISTINCT FROM _patient_owner THEN
      RAISE EXCEPTION 'health record owner must match the patient profile owner';
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_health_record_owner ON public.health_records;
CREATE TRIGGER trg_enforce_health_record_owner
BEFORE INSERT OR UPDATE ON public.health_records
FOR EACH ROW
EXECUTE FUNCTION public.enforce_health_record_owner();

DROP POLICY IF EXISTS "Patients can view own health records" ON public.health_records;
DROP POLICY IF EXISTS "Patients can insert own health records" ON public.health_records;
DROP POLICY IF EXISTS "Patients can update own health records" ON public.health_records;
DROP POLICY IF EXISTS "Patients can delete own health records" ON public.health_records;
DROP POLICY IF EXISTS "Doctors can view shared health records" ON public.health_records;
DROP POLICY IF EXISTS "Grantees can view shared health_records" ON public.health_records;
DROP POLICY IF EXISTS "Grantees can insert shared health_records" ON public.health_records;
DROP POLICY IF EXISTS "Grantees can update shared health_records" ON public.health_records;
DROP POLICY IF EXISTS "Grantees can delete shared health_records" ON public.health_records;

CREATE POLICY "Owners can view their health records"
ON public.health_records
FOR SELECT
TO authenticated
USING (
  owner_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = health_records.patient_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Shared users can view granted health records"
ON public.health_records
FOR SELECT
TO authenticated
USING (
  owner_user_id <> auth.uid()
  AND public.user_has_grant_on_patient(auth.uid(), patient_id, false)
);

CREATE POLICY "Owners can create health records"
ON public.health_records
FOR INSERT
TO authenticated
WITH CHECK (
  owner_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = health_records.patient_id
      AND p.user_id = auth.uid()
  )
  AND split_part(COALESCE(file_path, ''), '/', 1) = auth.uid()::text
);

CREATE POLICY "Owners can update their health records"
ON public.health_records
FOR UPDATE
TO authenticated
USING (
  owner_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = health_records.patient_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  owner_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = health_records.patient_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete their health records"
ON public.health_records
FOR DELETE
TO authenticated
USING (
  owner_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = health_records.patient_id
      AND p.user_id = auth.uid()
  )
);
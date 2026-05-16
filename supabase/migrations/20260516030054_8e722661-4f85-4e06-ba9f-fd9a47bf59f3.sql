
-- Phase 2: Hash ABHA ID + encrypt ai_summary/diagnoses at rest
-- Uses pgcrypto. Encryption key stored in Vault.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Encryption key management (Vault)
-- ============================================================
-- Insert a key into vault if not exists. Key name: 'phi_field_key_v1'
DO $$
DECLARE
  _key_id uuid;
BEGIN
  SELECT id INTO _key_id FROM vault.secrets WHERE name = 'phi_field_key_v1';
  IF _key_id IS NULL THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(32), 'base64'),
      'phi_field_key_v1',
      'AES-256 key for PHI field-level encryption (ai_summary, diagnoses, ABHA)'
    );
  END IF;
END $$;

-- Helper: fetch the active key (SECURITY DEFINER so trigger/proxy can read vault)
CREATE OR REPLACE FUNCTION private_phi_key()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = vault, public
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'phi_field_key_v1' LIMIT 1;
$$;
REVOKE ALL ON FUNCTION private_phi_key() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 2. ABHA hashing on patients
-- ============================================================
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS national_health_id_hash text,
  ADD COLUMN IF NOT EXISTS national_health_id_encrypted bytea;

CREATE OR REPLACE FUNCTION public.sync_abha_hash_and_encrypted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _key text;
BEGIN
  IF NEW.national_health_id IS NULL OR length(trim(NEW.national_health_id)) = 0 THEN
    NEW.national_health_id_hash := NULL;
    NEW.national_health_id_encrypted := NULL;
    RETURN NEW;
  END IF;

  -- SHA-256 hash for lookups + uniqueness
  NEW.national_health_id_hash := encode(
    extensions.digest(regexp_replace(NEW.national_health_id, '\s+', '', 'g'), 'sha256'),
    'hex'
  );

  -- AES-encrypted ciphertext (for future cut-over of plaintext column)
  _key := private_phi_key();
  IF _key IS NOT NULL THEN
    NEW.national_health_id_encrypted := extensions.pgp_sym_encrypt(NEW.national_health_id, _key);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_abha_hash ON public.patients;
CREATE TRIGGER trg_sync_abha_hash
  BEFORE INSERT OR UPDATE OF national_health_id ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.sync_abha_hash_and_encrypted();

-- Backfill existing rows
UPDATE public.patients
  SET national_health_id = national_health_id
  WHERE national_health_id IS NOT NULL
    AND (national_health_id_hash IS NULL OR national_health_id_encrypted IS NULL);

-- Unique constraint on hash (replaces need for uniqueness on raw value)
CREATE UNIQUE INDEX IF NOT EXISTS patients_national_health_id_hash_unique
  ON public.patients (national_health_id_hash)
  WHERE national_health_id_hash IS NOT NULL;

-- ============================================================
-- 3. health_records: encrypt ai_summary + diagnoses
-- ============================================================
ALTER TABLE public.health_records
  ADD COLUMN IF NOT EXISTS ai_summary_encrypted bytea,
  ADD COLUMN IF NOT EXISTS diagnoses_encrypted bytea;

CREATE OR REPLACE FUNCTION public.encrypt_health_record_phi()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _key text;
BEGIN
  _key := private_phi_key();
  IF _key IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.ai_summary IS NOT NULL AND length(NEW.ai_summary) > 0 THEN
    NEW.ai_summary_encrypted := extensions.pgp_sym_encrypt(NEW.ai_summary, _key);
  ELSE
    NEW.ai_summary_encrypted := NULL;
  END IF;

  IF NEW.diagnoses IS NOT NULL AND NEW.diagnoses::text <> '[]' THEN
    NEW.diagnoses_encrypted := extensions.pgp_sym_encrypt(NEW.diagnoses::text, _key);
  ELSE
    NEW.diagnoses_encrypted := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_encrypt_health_record_phi ON public.health_records;
CREATE TRIGGER trg_encrypt_health_record_phi
  BEFORE INSERT OR UPDATE OF ai_summary, diagnoses ON public.health_records
  FOR EACH ROW EXECUTE FUNCTION public.encrypt_health_record_phi();

-- Backfill
UPDATE public.health_records
  SET ai_summary = ai_summary
  WHERE (ai_summary IS NOT NULL AND ai_summary_encrypted IS NULL)
     OR (diagnoses IS NOT NULL AND diagnoses::text <> '[]' AND diagnoses_encrypted IS NULL);

-- ============================================================
-- 4. Decrypt RPC for read-proxy (called by edge function only)
-- ============================================================
CREATE OR REPLACE FUNCTION public.decrypt_health_record_phi(_record_id uuid)
RETURNS TABLE(ai_summary text, diagnoses jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _key text;
  _row public.health_records%ROWTYPE;
  _ai text;
  _dx jsonb;
BEGIN
  SELECT * INTO _row FROM public.health_records WHERE id = _record_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'record not found';
  END IF;

  -- Authorization: owner-patient OR doctor in consent_shared_with
  IF NOT (
    EXISTS (SELECT 1 FROM public.patients p WHERE p.id = _row.patient_id AND p.user_id = auth.uid())
    OR (auth.uid() = ANY(_row.consent_shared_with))
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  _key := private_phi_key();

  IF _row.ai_summary_encrypted IS NOT NULL AND _key IS NOT NULL THEN
    _ai := extensions.pgp_sym_decrypt(_row.ai_summary_encrypted, _key);
  ELSE
    _ai := _row.ai_summary;
  END IF;

  IF _row.diagnoses_encrypted IS NOT NULL AND _key IS NOT NULL THEN
    _dx := extensions.pgp_sym_decrypt(_row.diagnoses_encrypted, _key)::jsonb;
  ELSE
    _dx := _row.diagnoses;
  END IF;

  RETURN QUERY SELECT _ai, _dx;
END;
$$;

REVOKE ALL ON FUNCTION public.decrypt_health_record_phi(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrypt_health_record_phi(uuid) TO authenticated;

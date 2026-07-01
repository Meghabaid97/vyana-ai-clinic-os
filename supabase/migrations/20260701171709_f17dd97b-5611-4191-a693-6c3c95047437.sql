
-- Integrity check log table
CREATE TABLE public.integrity_check_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  scanned_records int NOT NULL DEFAULT 0,
  scanned_symptom_photos int NOT NULL DEFAULT 0,
  missing_health_files int NOT NULL DEFAULT 0,
  missing_symptom_files int NOT NULL DEFAULT 0,
  repaired_health_files int NOT NULL DEFAULT 0,
  repaired_symptom_files int NOT NULL DEFAULT 0,
  orphan_health_objects int NOT NULL DEFAULT 0,
  orphan_symptom_objects int NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'running',
  error text
);

GRANT SELECT ON public.integrity_check_runs TO authenticated;
GRANT ALL ON public.integrity_check_runs TO service_role;

ALTER TABLE public.integrity_check_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view integrity runs"
  ON public.integrity_check_runs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add nullable extraction_status marker value 'missing_file' handled at app-level (text column, no enum change needed).

-- Add a status column to health_records already exists (extraction_status text). No schema change.

-- Schedule the integrity check daily at 03:15 UTC
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'storage-integrity-check') THEN
    PERFORM cron.schedule(
      'storage-integrity-check',
      '15 3 * * *',
      $cron$
      SELECT net.http_post(
        url := 'https://gnfaxcdapizhfqloiajn.supabase.co/functions/v1/storage-integrity-check',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Lovable-Context', 'cron',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key')
        ),
        body := '{"source":"cron"}'::jsonb
      );
      $cron$
    );
  END IF;
END $$;

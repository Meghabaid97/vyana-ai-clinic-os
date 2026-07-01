
CREATE TABLE public.integrity_check_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.integrity_check_runs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  entity text NOT NULL,           -- e.g. 'health_records', 'symptom_logs', 'storage:health-records'
  entity_id text NOT NULL,        -- row id or storage path
  action text NOT NULL,           -- 'repaired' | 'flagged_missing' | 'orphan_object' | 'verified_ok' | 'repair_failed'
  patient_id uuid,
  owner_user_id uuid,
  bucket text,
  old_path text,
  new_path text,
  visibility_check text,          -- 'ok' | 'failed' | 'skipped'
  visibility_error text,
  notes jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_integrity_events_run ON public.integrity_check_events(run_id);
CREATE INDEX idx_integrity_events_entity ON public.integrity_check_events(entity, entity_id);

GRANT SELECT ON public.integrity_check_events TO authenticated;
GRANT ALL ON public.integrity_check_events TO service_role;

ALTER TABLE public.integrity_check_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view integrity events"
  ON public.integrity_check_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));


CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_id uuid,
  event_name text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_analytics_events_name_time ON public.analytics_events (event_name, created_at DESC);
CREATE INDEX idx_analytics_events_user_time ON public.analytics_events (user_id, created_at DESC);

GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own events"
  ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all events"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own events"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE public.api_usage
  ADD COLUMN IF NOT EXISTS tokens int,
  ADD COLUMN IF NOT EXISTS cost_inr numeric(10,4),
  ADD COLUMN IF NOT EXISTS latency_ms int;

ALTER TABLE public.health_records
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS extraction_status text DEFAULT 'pending';

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS signup_source text;

-- DPDPA 2023 compliance: consent ledger + data principal rights

-- ============ consent_log ============
CREATE TABLE IF NOT EXISTS public.consent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_type text NOT NULL, -- 'data_processing' | 'marketing' | 'doctor_sharing' | 'emergency_access' | 'terms_of_service' | 'privacy_policy'
  policy_version text NOT NULL DEFAULT 'v1.0',
  granted boolean NOT NULL DEFAULT true,
  granted_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  ip_address text,
  user_agent text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consent_log_user_id_idx ON public.consent_log (user_id);
CREATE INDEX IF NOT EXISTS consent_log_type_idx ON public.consent_log (consent_type);

ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent records"
  ON public.consent_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent records"
  ON public.consent_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consent records"
  ON public.consent_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ data_export_requests ============
CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | processing | completed | failed
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  export_file_path text,
  error_message text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS data_export_requests_user_id_idx ON public.data_export_requests (user_id);

ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own export requests"
  ON public.data_export_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own export requests"
  ON public.data_export_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all export requests"
  ON public.data_export_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ data_deletion_requests ============
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | confirmed | completed | cancelled
  requested_at timestamptz NOT NULL DEFAULT now(),
  scheduled_for timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  completed_at timestamptz,
  cancelled_at timestamptz,
  reason text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS data_deletion_requests_user_id_idx ON public.data_deletion_requests (user_id);

ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion requests"
  ON public.data_deletion_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deletion requests"
  ON public.data_deletion_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own deletion requests"
  ON public.data_deletion_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'cancelled'));

CREATE POLICY "Admins can view all deletion requests"
  ON public.data_deletion_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
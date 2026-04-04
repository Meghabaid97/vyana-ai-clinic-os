
-- 1. Create api_usage table for rate limiting
CREATE TABLE public.api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_usage_user_time ON public.api_usage(user_id, function_name, created_at);

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.api_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own usage" ON public.api_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Fix notifications insert policy - restrict to authenticated users inserting for themselves
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated users can insert own notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

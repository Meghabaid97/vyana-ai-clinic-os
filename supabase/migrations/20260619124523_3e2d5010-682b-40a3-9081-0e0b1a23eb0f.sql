
-- Observability tables for function logs and AI usage tracking

CREATE TABLE public.function_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT,
  function_name TEXT NOT NULL,
  user_id UUID,
  method TEXT,
  status_code INTEGER,
  latency_ms INTEGER,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.function_logs TO authenticated;
GRANT ALL ON public.function_logs TO service_role;
ALTER TABLE public.function_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read function logs" ON public.function_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_function_logs_created_at ON public.function_logs (created_at DESC);
CREATE INDEX idx_function_logs_function_name ON public.function_logs (function_name, created_at DESC);
CREATE INDEX idx_function_logs_status ON public.function_logs (status_code) WHERE status_code >= 400;

CREATE TABLE public.ai_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT,
  function_name TEXT NOT NULL,
  user_id UUID,
  provider TEXT,
  model TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_inr NUMERIC(12,4) DEFAULT 0,
  latency_ms INTEGER,
  status TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_usage_logs TO authenticated;
GRANT ALL ON public.ai_usage_logs TO service_role;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read ai usage logs" ON public.ai_usage_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs (created_at DESC);
CREATE INDEX idx_ai_usage_logs_user ON public.ai_usage_logs (user_id, created_at DESC);
CREATE INDEX idx_ai_usage_logs_function ON public.ai_usage_logs (function_name, created_at DESC);
CREATE INDEX idx_ai_usage_logs_model ON public.ai_usage_logs (model, created_at DESC);

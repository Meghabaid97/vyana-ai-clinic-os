-- Support tickets table with 30-day auto-expiry for review
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days')
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tickets
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id AND length(trim(subject)) > 0 AND length(trim(message)) > 0 AND length(subject) <= 200 AND length(message) <= 5000);

CREATE POLICY "Users can update own tickets"
  ON public.support_tickets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tickets"
  ON public.support_tickets FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view/manage all tickets for review
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all tickets"
  ON public.support_tickets FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for cleanup queries
CREATE INDEX idx_support_tickets_expires_at ON public.support_tickets(expires_at);
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);

-- Cleanup function for expired tickets (call from a scheduled job or manually)
CREATE OR REPLACE FUNCTION public.cleanup_expired_support_tickets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.support_tickets WHERE expires_at < now();
END;
$$;
-- Add next visit date for pre-visit prep notifications
ALTER TABLE public.patients 
  ADD COLUMN IF NOT EXISTS next_visit_date date,
  ADD COLUMN IF NOT EXISTS last_app_open_at timestamptz DEFAULT now();

-- Index for cron scans
CREATE INDEX IF NOT EXISTS idx_patients_next_visit_date ON public.patients(next_visit_date) WHERE next_visit_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_last_app_open ON public.patients(last_app_open_at);

-- Helper index for notifications dedupe
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_entity 
  ON public.notifications(user_id, type, related_entity_id, created_at DESC);

-- Enable realtime on notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
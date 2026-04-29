ALTER TABLE public.health_records
  ADD COLUMN IF NOT EXISTS imaging_discussion_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS imaging_discussion_disclaimer text;
-- Add household / family fields to patients
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS relationship text NOT NULL DEFAULT 'Self',
  ADD COLUMN IF NOT EXISTS avatar_emoji text NOT NULL DEFAULT '👤',
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- Backfill: mark the earliest patient row per user as primary + Self
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY user_id ORDER BY created_at ASC) AS rn
  FROM public.patients
)
UPDATE public.patients p
SET is_primary = true,
    relationship = 'Self',
    avatar_emoji = '👤'
FROM ranked r
WHERE p.id = r.id AND r.rn = 1;

-- Enforce: exactly one primary per user
CREATE UNIQUE INDEX IF NOT EXISTS patients_one_primary_per_user
  ON public.patients (user_id)
  WHERE is_primary = true;

-- Helpful index for switcher queries
CREATE INDEX IF NOT EXISTS patients_user_id_idx ON public.patients (user_id);
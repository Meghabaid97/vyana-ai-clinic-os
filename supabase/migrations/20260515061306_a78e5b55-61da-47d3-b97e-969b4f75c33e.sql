ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

DROP POLICY IF EXISTS "Anyone can join early access" ON public.early_access_signups;

CREATE POLICY "Anyone can join early access"
ON public.early_access_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(trim(email)) BETWEEN 5 AND 320
  AND full_name IS NOT NULL
  AND length(trim(full_name)) BETWEEN 1 AND 120
  AND role IS NOT NULL
  AND preferred_language IS NOT NULL
);
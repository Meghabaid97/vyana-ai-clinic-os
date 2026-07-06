ALTER TABLE public.health_records
  ALTER COLUMN owner_user_id SET DEFAULT auth.uid();

REVOKE EXECUTE ON FUNCTION public.enforce_health_record_owner() FROM PUBLIC, anon, authenticated;
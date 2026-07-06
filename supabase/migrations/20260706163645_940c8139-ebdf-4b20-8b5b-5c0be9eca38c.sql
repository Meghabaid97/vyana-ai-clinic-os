DO $$
DECLARE
  _constraint_name text;
BEGIN
  SELECT conname INTO _constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.health_records'::regclass
    AND contype = 'f'
    AND pg_get_constraintdef(oid) ILIKE '%owner_user_id%auth.users%'
  LIMIT 1;

  IF _constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.health_records DROP CONSTRAINT %I', _constraint_name);
  END IF;
END $$;
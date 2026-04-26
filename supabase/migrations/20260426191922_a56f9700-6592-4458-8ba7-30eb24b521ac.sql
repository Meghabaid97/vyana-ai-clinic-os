
-- 1. Delete the orphan auth account that leaked in
DELETE FROM auth.users WHERE email = 'vyana.care@gmail.com' AND id NOT IN (SELECT user_id FROM public.user_roles UNION SELECT user_id FROM public.patients WHERE user_id IS NOT NULL);

-- 2. Server-side gated-beta signup gate
-- Blocks any new auth.users row whose email is NOT on the approved invite list.
-- To disable when going live: DROP TRIGGER gated_beta_signup_gate ON auth.users;
CREATE OR REPLACE FUNCTION public.enforce_gated_beta_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _approved boolean;
  _email text;
BEGIN
  _email := lower(trim(NEW.email));

  -- Allow if no email (shouldn't happen, but defensive)
  IF _email IS NULL OR _email = '' THEN
    RETURN NEW;
  END IF;

  -- Allow if this email already exists as an approved access_request
  SELECT EXISTS (
    SELECT 1 FROM public.access_requests
    WHERE lower(trim(email)) = _email
      AND status = 'approved'
  ) INTO _approved;

  IF _approved THEN
    RETURN NEW;
  END IF;

  -- Reject — no invite on file
  RAISE EXCEPTION 'gated_beta: signup blocked. Email % is not on the approved invite list.', _email
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS gated_beta_signup_gate ON auth.users;
CREATE TRIGGER gated_beta_signup_gate
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_gated_beta_signup();

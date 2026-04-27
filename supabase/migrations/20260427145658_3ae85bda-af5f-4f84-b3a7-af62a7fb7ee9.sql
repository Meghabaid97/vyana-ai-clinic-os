-- Allow Google identity linking for existing users.
-- The gated_beta trigger was blocking auth.users INSERTs for emails that
-- already had an account via email/invite, because Supabase sometimes
-- creates a new auth.users row when an OAuth identity is added for an
-- email that doesn't yet have a matching identity.
--
-- Fix: skip the gate if the email already exists in auth.users (i.e. this
-- is an existing user adding a new sign-in method, not a brand-new signup).

CREATE OR REPLACE FUNCTION public.enforce_gated_beta_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _approved boolean;
  _email text;
  _existing_count int;
BEGIN
  _email := lower(trim(NEW.email));

  -- Allow if no email (defensive)
  IF _email IS NULL OR _email = '' THEN
    RETURN NEW;
  END IF;

  -- Allow if a user with this email already exists (identity linking /
  -- re-auth case — not a brand new signup).
  SELECT count(*) INTO _existing_count
  FROM auth.users
  WHERE lower(trim(email)) = _email
    AND id <> NEW.id;

  IF _existing_count > 0 THEN
    RETURN NEW;
  END IF;

  -- Allow if this email exists as an approved access_request
  SELECT EXISTS (
    SELECT 1 FROM public.access_requests
    WHERE lower(trim(email)) = _email
      AND status = 'approved'
  ) INTO _approved;

  IF _approved THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'gated_beta: signup blocked. Email % is not on the approved invite list.', _email
    USING ERRCODE = 'check_violation';
END;
$function$;
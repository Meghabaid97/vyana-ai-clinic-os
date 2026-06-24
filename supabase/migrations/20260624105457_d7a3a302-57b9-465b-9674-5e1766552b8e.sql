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
  _provider text;
  _providers text;
BEGIN
  _email := lower(trim(NEW.email));

  -- Allow if no email (defensive)
  IF _email IS NULL OR _email = '' THEN
    RETURN NEW;
  END IF;

  -- Bypass allowlist for Apple Sign In: identity provider is "apple" OR
  -- email is a Hide-My-Email private relay address (unique per app, so an
  -- allowlist can never match it structurally).
  IF _email LIKE '%@privaterelay.appleid.com' THEN
    RETURN NEW;
  END IF;

  BEGIN
    _provider := NEW.raw_app_meta_data->>'provider';
    _providers := NEW.raw_app_meta_data->>'providers';
  EXCEPTION WHEN OTHERS THEN
    _provider := NULL;
    _providers := NULL;
  END;

  IF _provider = 'apple' OR (_providers IS NOT NULL AND _providers LIKE '%apple%') THEN
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
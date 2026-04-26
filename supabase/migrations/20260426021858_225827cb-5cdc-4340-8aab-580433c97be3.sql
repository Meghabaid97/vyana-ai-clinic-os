CREATE OR REPLACE FUNCTION public.get_access_request_by_token(_token uuid)
RETURNS TABLE (
  email text,
  name text,
  status text,
  token_used_at timestamptz,
  token_expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email, name, status, token_used_at, token_expires_at
  FROM public.access_requests
  WHERE invite_token = _token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_access_request_by_token(uuid) TO anon, authenticated;
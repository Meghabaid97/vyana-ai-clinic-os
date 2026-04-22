-- access_requests table
CREATE TABLE public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  city text,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  invite_token uuid UNIQUE,
  token_expires_at timestamptz,
  token_used_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_requests_email ON public.access_requests(email);
CREATE INDEX idx_access_requests_status ON public.access_requests(status);
CREATE INDEX idx_access_requests_token ON public.access_requests(invite_token) WHERE invite_token IS NOT NULL;

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a request (public form)
CREATE POLICY "Anyone can submit access request"
  ON public.access_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND invite_token IS NULL
    AND approved_at IS NULL
    AND approved_by IS NULL
    AND length(trim(name)) > 0
    AND length(trim(email)) > 0
    AND length(name) <= 200
    AND length(email) <= 320
    AND length(coalesce(city,'')) <= 200
    AND length(coalesce(reason,'')) <= 1000
  );

-- Admins see all
CREATE POLICY "Admins can view all access requests"
  ON public.access_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins update (approve/deny)
CREATE POLICY "Admins can update access requests"
  ON public.access_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone (anon during signup) can look up by valid token
CREATE POLICY "Anyone can read by valid invite token"
  ON public.access_requests FOR SELECT
  TO anon, authenticated
  USING (
    invite_token IS NOT NULL
    AND status = 'approved'
  );

-- Allow marking token as used during signup (token-gated UPDATE)
-- We restrict via a SECURITY DEFINER function instead to avoid update-anything risk.
CREATE OR REPLACE FUNCTION public.consume_invite_token(_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.access_requests%ROWTYPE;
BEGIN
  SELECT * INTO _row FROM public.access_requests WHERE invite_token = _token;
  IF NOT FOUND THEN RETURN false; END IF;
  IF _row.status <> 'approved' THEN RETURN false; END IF;
  IF _row.token_used_at IS NOT NULL THEN RETURN false; END IF;
  IF _row.token_expires_at IS NOT NULL AND _row.token_expires_at < now() THEN RETURN false; END IF;
  UPDATE public.access_requests
    SET token_used_at = now(), updated_at = now()
    WHERE id = _row.id;
  RETURN true;
END;
$$;

-- updated_at trigger
CREATE TRIGGER trg_access_requests_updated_at
BEFORE UPDATE ON public.access_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant admin role to mbaid@wharton.upenn.edu
INSERT INTO public.user_roles (user_id, role)
VALUES ('62abe20a-cf6b-46df-a92c-07f76b933648', 'admin')
ON CONFLICT DO NOTHING;
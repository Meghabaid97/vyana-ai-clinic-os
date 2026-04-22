-- Early access waitlist for pre-YC traction
CREATE TABLE public.early_access_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  preferred_language text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT early_access_email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT early_access_name_len CHECK (char_length(trim(full_name)) BETWEEN 1 AND 120),
  CONSTRAINT early_access_role_allowed CHECK (role IN ('patient','caregiver','doctor','investor','other')),
  CONSTRAINT early_access_lang_allowed CHECK (preferred_language IN ('English','Hindi','Tamil','Telugu','Bengali'))
);

CREATE UNIQUE INDEX early_access_email_unique ON public.early_access_signups (lower(email));

ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon visitors) can join the waitlist
CREATE POLICY "Anyone can join early access"
  ON public.early_access_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read the list (protect the lead list)
CREATE POLICY "Admins can view signups"
  ON public.early_access_signups
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete signups"
  ON public.early_access_signups
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
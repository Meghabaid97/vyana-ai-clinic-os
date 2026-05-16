
-- Helper that returns current user's email without exposing auth.users to RLS
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(email)::text FROM auth.users WHERE id = auth.uid();
$$;

-- Replace recursive policy that referenced auth.users directly
DROP POLICY IF EXISTS "Invitee can view invites by email" ON public.family_invites;

CREATE POLICY "Invitee can view invites by email"
ON public.family_invites
FOR SELECT
TO authenticated
USING (
  invitee_email IS NOT NULL
  AND lower(invitee_email) = public.current_user_email()
);

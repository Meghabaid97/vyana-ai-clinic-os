-- Enable realtime for family sharing tables so both inviter and invitee
-- get live updates when invites are accepted, grants are added/revoked,
-- or shared patient profiles are edited.

ALTER TABLE public.patient_access_grants REPLICA IDENTITY FULL;
ALTER TABLE public.family_invites REPLICA IDENTITY FULL;
ALTER TABLE public.patients REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_access_grants;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.family_invites;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
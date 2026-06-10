-- Restore EXECUTE for functions invoked from RLS policies.
-- RLS predicates run as the calling role, so authenticated must be able to
-- execute these helpers even though they are SECURITY DEFINER.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.user_can_access_patient(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_patient_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_grant_on_patient(uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.doctor_can_access_patient(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;
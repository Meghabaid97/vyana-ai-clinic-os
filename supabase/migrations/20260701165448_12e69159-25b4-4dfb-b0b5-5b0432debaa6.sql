
-- RLS policies reference these SECURITY DEFINER helpers. Without EXECUTE for
-- authenticated, PostgREST returns 403 on every table whose policies call
-- them, which surfaced as "no data" and consent appearing withdrawn.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.user_can_access_patient(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_patient_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_grant_on_patient(uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.doctor_can_access_patient(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_entitlements() TO authenticated;

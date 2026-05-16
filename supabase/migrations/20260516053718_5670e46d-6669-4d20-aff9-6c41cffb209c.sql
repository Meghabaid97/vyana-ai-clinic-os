
-- RLS helper functions: revoke from PUBLIC/anon, keep authenticated
REVOKE EXECUTE ON FUNCTION public.current_user_email() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_patient_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_can_access_patient(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_has_grant_on_patient(uuid, uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.doctor_can_access_patient(uuid, uuid) FROM PUBLIC, anon;

-- Token lookup RPCs: ensure anon CAN call them (used by pre-auth landing pages)
GRANT EXECUTE ON FUNCTION public.get_family_invite_by_token(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_access_request_by_token(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.consume_invite_token(uuid) TO anon;


-- Revoke EXECUTE on internal helpers from anon/authenticated/public.
-- These are only meant to be called by RLS policies, triggers, or edge functions
-- running with the service role key.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.user_can_access_patient(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.user_has_grant_on_patient(uuid, uuid, boolean) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_patient_owner(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.doctor_can_access_patient(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.current_user_email() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.decrypt_health_record_phi(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_grantee_consent_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.encrypt_health_record_phi() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_abha_hash_and_encrypted() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.private_phi_key() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_journal_cadence() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_gated_beta_signup() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_support_tickets() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

-- User-facing RPCs — keep callable:
-- accept_family_invite, decline_family_invite, remove_family_member (authenticated)
-- consume_invite_token, get_access_request_by_token, get_family_invite_by_token (anon + authenticated; invite landing pages run pre-signin)
-- These are intentionally NOT revoked.

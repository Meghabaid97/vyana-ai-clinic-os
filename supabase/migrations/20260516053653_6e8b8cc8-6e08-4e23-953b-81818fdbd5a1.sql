
-- Pure trigger functions: no caller EXECUTE required
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_journal_cadence() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_health_record_phi() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_abha_hash_and_encrypted() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_gated_beta_signup() FROM PUBLIC, anon, authenticated;

-- Critical: PHI master-key accessor — only the database itself should call this
REVOKE EXECUTE ON FUNCTION public.private_phi_key() FROM PUBLIC, anon, authenticated;

-- Email queue plumbing: only service_role / internal jobs
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_support_tickets() FROM PUBLIC, anon, authenticated;

-- PHI decrypt: signed-in users only (function has internal authorization check)
REVOKE EXECUTE ON FUNCTION public.decrypt_health_record_phi(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrypt_health_record_phi(uuid) TO authenticated;

-- Family invite RPCs: signed-in users only
REVOKE EXECUTE ON FUNCTION public.accept_family_invite(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_family_invite(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.decline_family_invite(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decline_family_invite(uuid) TO authenticated;

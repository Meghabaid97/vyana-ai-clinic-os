
-- Helpers that should ONLY be invoked by triggers or by service_role.
-- Revoke EXECUTE from PUBLIC, anon, and authenticated.
DO $$
DECLARE
  fn text;
  trigger_only text[] := ARRAY[
    'handle_new_user()',
    'update_updated_at_column()',
    'validate_journal_cadence()',
    'enforce_patient_family_limit()',
    'enforce_health_record_docs_limit()',
    'guard_patient_national_health_id()',
    'encrypt_health_record_phi()',
    'sync_abha_hash_and_encrypted()',
    'prevent_grantee_consent_change()',
    'enforce_gated_beta_signup()',
    'private_phi_key()',
    'cleanup_expired_support_tickets()',
    'move_to_dlq(text,text,bigint,jsonb)',
    'enqueue_email(text,jsonb)',
    'read_email_batch(text,integer,integer)',
    'delete_email(text,bigint)',
    'current_user_email()',
    'doctor_can_access_patient(uuid,uuid)',
    'user_can_access_patient(uuid,uuid)',
    'user_has_grant_on_patient(uuid,uuid,boolean)',
    'is_patient_owner(uuid,uuid)',
    'has_role(uuid,app_role)',
    'decrypt_health_record_phi(uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY trigger_only LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'skip missing fn %', fn;
    END;
  END LOOP;
END $$;

-- User-callable RPCs: keep accessible to signed-in users only.
DO $$
DECLARE
  fn text;
  user_rpcs text[] := ARRAY[
    'accept_family_invite(uuid)',
    'decline_family_invite(uuid)',
    'remove_family_member(uuid)',
    'cancel_subscription()',
    'resume_subscription()',
    'get_entitlements()',
    'increment_briefing_usage()',
    'get_family_invite_by_token(uuid)',
    'get_access_request_by_token(uuid)',
    'consume_invite_token(uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY user_rpcs LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', fn);
      EXECUTE format('GRANT  EXECUTE ON FUNCTION public.%s TO authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'skip missing rpc %', fn;
    END;
  END LOOP;
END $$;

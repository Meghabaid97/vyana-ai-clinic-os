CREATE OR REPLACE FUNCTION public.remove_family_member(_patient_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _grant public.patient_access_grants%ROWTYPE;
  _invite public.family_invites%ROWTYPE;
BEGIN
  IF _me IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO _grant
  FROM public.patient_access_grants
  WHERE patient_id = _patient_id
    AND revoked_at IS NULL
    AND (
      grantee_user_id = _me
      OR public.is_patient_owner(_me, patient_id)
    )
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'active_family_link_not_found';
  END IF;

  IF _grant.source_invite_id IS NOT NULL THEN
    SELECT * INTO _invite
    FROM public.family_invites
    WHERE id = _grant.source_invite_id;
  END IF;

  UPDATE public.patient_access_grants
  SET revoked_at = now()
  WHERE revoked_at IS NULL
    AND (
      id = _grant.id
      OR (
        _grant.source_invite_id IS NOT NULL
        AND source_invite_id = _grant.source_invite_id
      )
      OR (
        _grant.source_invite_id IS NOT NULL
        AND _invite.id IS NOT NULL
        AND patient_id IN (_invite.accepted_patient_id, _patient_id)
        AND grantee_user_id IN (_invite.inviter_user_id, _invite.accepted_by_user_id)
      )
    );

  IF _grant.source_invite_id IS NOT NULL THEN
    UPDATE public.family_invites
    SET status = 'revoked'
    WHERE id = _grant.source_invite_id
      AND status = 'accepted';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_family_member(uuid) TO authenticated;
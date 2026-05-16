-- =========================================================
-- 1. family_invites: invite link a user sends to an adult
-- =========================================================
CREATE TABLE public.family_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id UUID NOT NULL,
  invitee_name TEXT NOT NULL,
  invitee_email TEXT,
  invitee_phone TEXT,
  relationship TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '👤',
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  permission TEXT NOT NULL DEFAULT 'manage' CHECK (permission IN ('view','manage')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','revoked','expired')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by_user_id UUID,
  accepted_patient_id UUID,
  CHECK (invitee_email IS NOT NULL OR invitee_phone IS NOT NULL),
  CHECK (length(trim(invitee_name)) BETWEEN 1 AND 120)
);

CREATE INDEX idx_family_invites_inviter ON public.family_invites(inviter_user_id, status);
CREATE INDEX idx_family_invites_token   ON public.family_invites(token);
CREATE INDEX idx_family_invites_email   ON public.family_invites(lower(invitee_email)) WHERE invitee_email IS NOT NULL;

ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviter can view own invites"
  ON public.family_invites FOR SELECT TO authenticated
  USING (inviter_user_id = auth.uid());

CREATE POLICY "Inviter can create invites"
  ON public.family_invites FOR INSERT TO authenticated
  WITH CHECK (inviter_user_id = auth.uid());

CREATE POLICY "Inviter can revoke own invites"
  ON public.family_invites FOR UPDATE TO authenticated
  USING (inviter_user_id = auth.uid())
  WITH CHECK (inviter_user_id = auth.uid());

CREATE POLICY "Invitee can view invites by email"
  ON public.family_invites FOR SELECT TO authenticated
  USING (
    invitee_email IS NOT NULL
    AND lower(invitee_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- =========================================================
-- 2. patient_access_grants: who can access whose profile
-- =========================================================
CREATE TABLE public.patient_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  grantee_user_id UUID NOT NULL,
  permission TEXT NOT NULL DEFAULT 'manage' CHECK (permission IN ('view','manage')),
  source_invite_id UUID REFERENCES public.family_invites(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (patient_id, grantee_user_id)
);

CREATE INDEX idx_pag_grantee ON public.patient_access_grants(grantee_user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_pag_patient ON public.patient_access_grants(patient_id)      WHERE revoked_at IS NULL;

ALTER TABLE public.patient_access_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or grantee can view grant"
  ON public.patient_access_grants FOR SELECT TO authenticated
  USING (
    grantee_user_id = auth.uid()
    OR patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  );

CREATE POLICY "Owner can revoke grant"
  ON public.patient_access_grants FOR UPDATE TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()))
  WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Owner can delete grant"
  ON public.patient_access_grants FOR DELETE TO authenticated
  USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

-- Inserts ONLY via accept_family_invite (no INSERT policy).

-- =========================================================
-- 3. Helper used by all patient-scoped RLS policies
-- =========================================================
CREATE OR REPLACE FUNCTION public.user_can_access_patient(_user_id UUID, _patient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = _patient_id AND p.user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.patient_access_grants g
    WHERE g.patient_id = _patient_id
      AND g.grantee_user_id = _user_id
      AND g.revoked_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_can_access_patient(UUID, UUID) TO authenticated;

-- =========================================================
-- 4. accept_family_invite: atomic accept flow
-- =========================================================
CREATE OR REPLACE FUNCTION public.accept_family_invite(_token UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _inv public.family_invites%ROWTYPE;
  _me  UUID := auth.uid();
  _my_email TEXT;
  _patient_id UUID;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT email INTO _my_email FROM auth.users WHERE id = _me;

  SELECT * INTO _inv FROM public.family_invites WHERE token = _token;
  IF NOT FOUND THEN RAISE EXCEPTION 'invite_not_found'; END IF;

  IF _inv.status <> 'pending' THEN
    RAISE EXCEPTION 'invite_%', _inv.status;
  END IF;

  IF _inv.expires_at < now() THEN
    UPDATE public.family_invites SET status='expired' WHERE id=_inv.id;
    RAISE EXCEPTION 'invite_expired';
  END IF;

  IF _inv.inviter_user_id = _me THEN
    RAISE EXCEPTION 'cannot_accept_own_invite';
  END IF;

  IF _inv.invitee_email IS NOT NULL
     AND lower(_inv.invitee_email) <> lower(COALESCE(_my_email,'')) THEN
    RAISE EXCEPTION 'email_mismatch';
  END IF;

  -- Find or create the accepter's own primary profile
  SELECT id INTO _patient_id
    FROM public.patients
    WHERE user_id = _me AND is_primary = true
    LIMIT 1;

  IF _patient_id IS NULL THEN
    INSERT INTO public.patients (user_id, name, is_primary, relationship, avatar_emoji)
    VALUES (_me, COALESCE(NULLIF(trim(_inv.invitee_name),''),'Me'), true, 'Self', '👤')
    RETURNING id INTO _patient_id;
  END IF;

  -- Grant the inviter access to the accepter's profile
  INSERT INTO public.patient_access_grants (patient_id, grantee_user_id, permission, source_invite_id)
  VALUES (_patient_id, _inv.inviter_user_id, _inv.permission, _inv.id)
  ON CONFLICT (patient_id, grantee_user_id)
    DO UPDATE SET revoked_at = NULL, permission = EXCLUDED.permission;

  UPDATE public.family_invites
    SET status='accepted', accepted_at=now(),
        accepted_by_user_id=_me, accepted_patient_id=_patient_id
    WHERE id=_inv.id;

  RETURN _patient_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_family_invite(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.decline_family_invite(_token UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _inv public.family_invites%ROWTYPE;
  _me  UUID := auth.uid();
  _my_email TEXT;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT email INTO _my_email FROM auth.users WHERE id = _me;

  SELECT * INTO _inv FROM public.family_invites WHERE token = _token;
  IF NOT FOUND THEN RAISE EXCEPTION 'invite_not_found'; END IF;
  IF _inv.status <> 'pending' THEN RAISE EXCEPTION 'invite_%', _inv.status; END IF;

  IF _inv.invitee_email IS NOT NULL
     AND lower(_inv.invitee_email) <> lower(COALESCE(_my_email,'')) THEN
    RAISE EXCEPTION 'email_mismatch';
  END IF;

  UPDATE public.family_invites
    SET status='declined', accepted_at=now(), accepted_by_user_id=_me
    WHERE id=_inv.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decline_family_invite(UUID) TO authenticated;

-- =========================================================
-- 5. Lookup invite by token (public, but only safe fields)
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_family_invite_by_token(_token UUID)
RETURNS TABLE(
  invitee_name TEXT,
  relationship TEXT,
  avatar_emoji TEXT,
  permission TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ,
  message TEXT,
  inviter_name TEXT,
  invitee_email TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    fi.invitee_name,
    fi.relationship,
    fi.avatar_emoji,
    fi.permission,
    fi.status,
    fi.expires_at,
    fi.message,
    COALESCE(
      (SELECT name FROM public.patients WHERE user_id = fi.inviter_user_id AND is_primary = true LIMIT 1),
      'A family member'
    ) AS inviter_name,
    fi.invitee_email
  FROM public.family_invites fi
  WHERE fi.token = _token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_family_invite_by_token(UUID) TO anon, authenticated;

-- =========================================================
-- 6. Extend RLS on all patient-scoped tables for grantees
-- =========================================================
-- patients: grantee can SELECT and (if manage) UPDATE
CREATE POLICY "Grantees can view shared patient"
  ON public.patients FOR SELECT TO authenticated
  USING (id IN (
    SELECT patient_id FROM public.patient_access_grants
    WHERE grantee_user_id = auth.uid() AND revoked_at IS NULL
  ));

CREATE POLICY "Grantees with manage can update shared patient"
  ON public.patients FOR UPDATE TO authenticated
  USING (id IN (
    SELECT patient_id FROM public.patient_access_grants
    WHERE grantee_user_id = auth.uid() AND permission='manage' AND revoked_at IS NULL
  ))
  WITH CHECK (id IN (
    SELECT patient_id FROM public.patient_access_grants
    WHERE grantee_user_id = auth.uid() AND permission='manage' AND revoked_at IS NULL
  ));

-- health_records
CREATE POLICY "Grantees can view shared health_records"
  ON public.health_records FOR SELECT TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can insert shared health_records"
  ON public.health_records FOR INSERT TO authenticated
  WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can update shared health_records"
  ON public.health_records FOR UPDATE TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id))
  WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can delete shared health_records"
  ON public.health_records FOR DELETE TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id));

-- symptom_logs
CREATE POLICY "Grantees can view shared symptom_logs"
  ON public.symptom_logs FOR SELECT TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can insert shared symptom_logs"
  ON public.symptom_logs FOR INSERT TO authenticated
  WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can update shared symptom_logs"
  ON public.symptom_logs FOR UPDATE TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id))
  WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can delete shared symptom_logs"
  ON public.symptom_logs FOR DELETE TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id));

-- medication_reminders
CREATE POLICY "Grantees can view shared meds"
  ON public.medication_reminders FOR SELECT TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can insert shared meds"
  ON public.medication_reminders FOR INSERT TO authenticated
  WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can update shared meds"
  ON public.medication_reminders FOR UPDATE TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id))
  WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can delete shared meds"
  ON public.medication_reminders FOR DELETE TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id));

-- vital_history
CREATE POLICY "Grantees can view shared vital_history"
  ON public.vital_history FOR SELECT TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can insert shared vital_history"
  ON public.vital_history FOR INSERT TO authenticated
  WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can delete shared vital_history"
  ON public.vital_history FOR DELETE TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id));

-- journal_preferences
CREATE POLICY "Grantees can view shared journal_prefs"
  ON public.journal_preferences FOR SELECT TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can insert shared journal_prefs"
  ON public.journal_preferences FOR INSERT TO authenticated
  WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can update shared journal_prefs"
  ON public.journal_preferences FOR UPDATE TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id))
  WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id));

-- emergency_contacts
CREATE POLICY "Grantees can view shared emergency_contacts"
  ON public.emergency_contacts FOR SELECT TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can insert shared emergency_contacts"
  ON public.emergency_contacts FOR INSERT TO authenticated
  WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can update shared emergency_contacts"
  ON public.emergency_contacts FOR UPDATE TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id))
  WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can delete shared emergency_contacts"
  ON public.emergency_contacts FOR DELETE TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id));

-- doctor_visit_prep
CREATE POLICY "Grantees can view shared visit_prep"
  ON public.doctor_visit_prep FOR SELECT TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can insert shared visit_prep"
  ON public.doctor_visit_prep FOR INSERT TO authenticated
  WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can delete shared visit_prep"
  ON public.doctor_visit_prep FOR DELETE TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id));

-- shared_record_links
CREATE POLICY "Grantees can view shared record links"
  ON public.shared_record_links FOR SELECT TO authenticated
  USING (public.user_can_access_patient(auth.uid(), patient_id));
CREATE POLICY "Grantees can create shared record links"
  ON public.shared_record_links FOR INSERT TO authenticated
  WITH CHECK (public.user_can_access_patient(auth.uid(), patient_id));
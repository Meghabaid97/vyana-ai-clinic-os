
-- Fix 1: Restrict doctor_can_access_patient to consent only (patient-only app, drop appointment auto-access)
CREATE OR REPLACE FUNCTION public.doctor_can_access_patient(_doctor_user uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.health_records hr
    WHERE hr.patient_id = _patient_id
      AND _doctor_user = ANY (hr.consent_shared_with)
  );
$function$;

-- Fix 3: Add realtime household broadcast policy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='realtime' AND c.relname='messages') THEN
    EXECUTE 'DROP POLICY IF EXISTS "household_channel_self_only" ON realtime.messages';
    EXECUTE $p$CREATE POLICY "household_channel_self_only" ON realtime.messages
      FOR SELECT TO authenticated
      USING (realtime.topic() = 'household:' || auth.uid()::text)$p$;
  END IF;
END $$;

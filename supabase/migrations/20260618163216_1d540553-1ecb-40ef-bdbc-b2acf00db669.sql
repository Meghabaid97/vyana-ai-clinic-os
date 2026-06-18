
-- Fix 1: doctor_profiles SELECT policy — require doctor or admin role
DROP POLICY IF EXISTS "Doctors can view own profile" ON public.doctor_profiles;
CREATE POLICY "Doctors can view own profile"
ON public.doctor_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  AND (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Fix 2: Prevent patients from freely setting/changing national_health_id to arbitrary values.
-- Validation: must be 14 numeric digits; once set, only admin/service_role may change it.
CREATE OR REPLACE FUNCTION public.guard_patient_national_health_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    is_admin := has_role(auth.uid(), 'admin'::app_role);
  END IF;

  -- Allow service role / admin without checks
  IF is_admin OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.national_health_id IS NOT NULL THEN
    IF NEW.national_health_id !~ '^[0-9]{14}$' THEN
      RAISE EXCEPTION 'national_health_id must be exactly 14 digits';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.national_health_id IS NOT NULL
     AND OLD.national_health_id IS DISTINCT FROM NEW.national_health_id THEN
    RAISE EXCEPTION 'national_health_id cannot be changed once set; contact support';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_patient_national_health_id ON public.patients;
CREATE TRIGGER trg_guard_patient_national_health_id
BEFORE INSERT OR UPDATE OF national_health_id ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.guard_patient_national_health_id();

-- Create doctor_profiles table
CREATE TABLE public.doctor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  medical_license_number TEXT,
  specialization TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  phone TEXT,
  years_of_experience INTEGER,
  qualification TEXT,
  is_profile_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for doctor profiles
CREATE POLICY "Doctors can view own profile"
ON public.doctor_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert own profile"
ON public.doctor_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update own profile"
ON public.doctor_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_doctor_profiles_updated_at
BEFORE UPDATE ON public.doctor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix the handle_new_user function to NOT auto-assign doctor role
-- Instead, we'll handle role assignment in the app after signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Don't auto-assign role, let the app handle it based on signup type
  RETURN new;
END;
$$;

-- Recreate trigger (but now it does nothing for roles)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
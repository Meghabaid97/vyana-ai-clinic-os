-- Add availability settings to doctor_profiles
ALTER TABLE public.doctor_profiles 
ADD COLUMN IF NOT EXISTS availability_days text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
ADD COLUMN IF NOT EXISTS availability_start_time text DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS availability_end_time text DEFAULT '17:00',
ADD COLUMN IF NOT EXISTS max_appointments_per_day integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS appointment_duration_minutes integer DEFAULT 30;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- System can insert notifications (via edge functions or triggers)
CREATE POLICY "Service role can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);
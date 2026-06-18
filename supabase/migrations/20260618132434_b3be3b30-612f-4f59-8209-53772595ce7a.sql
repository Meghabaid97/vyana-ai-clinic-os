
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id text,
  ADD COLUMN IF NOT EXISTS razorpay_customer_id text,
  ADD COLUMN IF NOT EXISTS razorpay_plan_id text;

CREATE INDEX IF NOT EXISTS subscriptions_razorpay_subscription_id_idx
  ON public.subscriptions (razorpay_subscription_id);

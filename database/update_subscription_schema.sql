-- Add subscription tracking columns to the profiles table

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'school')),
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
ADD COLUMN IF NOT EXISTS quizzes_created_this_month integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_cycle_start timestamp with time zone DEFAULT now();

-- Create a function to reset quiz counts monthly (would be triggered by a cron job in a real backend)
CREATE OR REPLACE FUNCTION reset_monthly_quiz_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET quizzes_created_this_month = 0,
      billing_cycle_start = now()
  WHERE billing_cycle_start < now() - interval '1 month';
END;
$$ LANGUAGE plpgsql;


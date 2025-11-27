-- Add missing columns to existing notifications table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS related_user_name TEXT;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

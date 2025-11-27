-- Student Profile Management - Database Schema
-- Run this in your Supabase SQL Editor

-- Create student_details table for teacher-added information
CREATE TABLE IF NOT EXISTS public.student_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone TEXT,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_student_teacher UNIQUE(student_id, teacher_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_details_student ON student_details(student_id);
CREATE INDEX IF NOT EXISTS idx_student_details_teacher ON student_details(teacher_id);

-- Enable RLS
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Teachers can view their student details"
ON public.student_details
FOR SELECT
TO authenticated
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert their student details"
ON public.student_details
FOR INSERT
TO authenticated
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their student details"
ON public.student_details
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their student details"
ON public.student_details
FOR DELETE
TO authenticated
USING (teacher_id = auth.uid());

-- Verify table creation
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'student_details' 
ORDER BY ordinal_position;

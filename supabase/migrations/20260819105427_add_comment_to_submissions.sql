-- Add comment and graded_at columns to submissions table
ALTER TABLE public.submissions ADD COLUMN comment TEXT;
ALTER TABLE public.submissions ADD COLUMN graded_at TIMESTAMP WITH TIME ZONE;

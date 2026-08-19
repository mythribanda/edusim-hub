-- Add reactions column to class_posts table
ALTER TABLE public.class_posts ADD COLUMN reactions JSONB NOT NULL DEFAULT '{}'::jsonb;

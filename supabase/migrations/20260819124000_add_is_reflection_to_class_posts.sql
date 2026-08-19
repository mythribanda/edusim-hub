-- Add is_reflection column to class_posts table
ALTER TABLE public.class_posts ADD COLUMN is_reflection BOOLEAN NOT NULL DEFAULT FALSE;

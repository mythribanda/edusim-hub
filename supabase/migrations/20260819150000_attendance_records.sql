-- Migration: attendance_records
-- Adds subject, faculty_id, and an explicit status ENUM to the existing attendance table.
-- Idempotent: uses IF NOT EXISTS / IF EXISTS guards throughout.
-- Timestamp: 20260819150000

-- 1. Add subject column
ALTER TABLE public.attendance
    ADD COLUMN IF NOT EXISTS subject VARCHAR(200);

-- 2. Add faculty_id FK
ALTER TABLE public.attendance
    ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Rename / normalise status to an explicit check constraint
--    (existing rows already store text values so we leave the column type as text
--     but enforce the ENUM values via a check constraint)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'attendance'
          AND constraint_name = 'chk_attendance_status'
    ) THEN
        ALTER TABLE public.attendance
            ADD CONSTRAINT chk_attendance_status
            CHECK (status IN ('present', 'absent', 'late'));
    END IF;
END
$$;

-- 4. Add marked_by as a VARCHAR (teacher name string) alongside the existing UUID FK
--    The original marked_by column is a UUID FK; add a separate varchar for display.
ALTER TABLE public.attendance
    ADD COLUMN IF NOT EXISTS marked_by_name VARCHAR(200);

-- 5. Useful composite index for class + date queries
CREATE INDEX IF NOT EXISTS idx_attendance_class_date
    ON public.attendance (class_id, date);

-- 6. Index on faculty_id for teacher-scoped queries
CREATE INDEX IF NOT EXISTS idx_attendance_faculty_id
    ON public.attendance (faculty_id);

-- 7. Enable RLS (idempotent)
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

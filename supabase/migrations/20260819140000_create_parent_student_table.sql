-- Create parent_student table
CREATE TABLE public.parent_student (
    parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    PRIMARY KEY (parent_id, student_id)
);

-- Indexing
CREATE INDEX idx_parent_student_parent ON public.parent_student(parent_id);
CREATE INDEX idx_parent_student_student ON public.parent_student(student_id);

-- Create tutor_request_logs table
CREATE TABLE public.tutor_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tier VARCHAR(50) NOT NULL,
    model_used VARCHAR(255) NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing
CREATE INDEX idx_tutor_request_logs_student_id ON public.tutor_request_logs(student_id);
CREATE INDEX idx_tutor_request_logs_created_at ON public.tutor_request_logs(created_at);

-- Row Level Security
ALTER TABLE public.tutor_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins full access to tutor logs"
    ON public.tutor_request_logs
    FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

CREATE POLICY "Allow students to view their own logs"
    ON public.tutor_request_logs
    FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Allow inserts from authenticated users"
    ON public.tutor_request_logs
    FOR INSERT
    WITH CHECK (auth.uid() = student_id);

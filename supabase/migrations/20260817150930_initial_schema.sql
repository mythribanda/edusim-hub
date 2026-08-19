-- Create custom types / enums
CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin', 'teacher', 'student', 'parent');
CREATE TYPE public.age_tier AS ENUM ('primary', 'middle', 'high_school', 'university');

-- 1. Create users table (linked to auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role public.user_role NOT NULL,
    age_tier public.age_tier NOT NULL,
    class_id UUID,
    institution_id UUID,
    board TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create modules table
CREATE TABLE public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    tier_min public.age_tier NOT NULL,
    subject TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create assets table
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    svg_content TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}'::text[],
    tier_allowed TEXT[] NOT NULL DEFAULT '{}'::text[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create assignments table
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    class_id UUID NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    instructions TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create submissions table
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    score NUMERIC,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create session_events table
CREATE TABLE public.session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create requested indexes on class_id, institution_id, student_id
CREATE INDEX idx_users_class_id ON public.users(class_id);
CREATE INDEX idx_users_institution_id ON public.users(institution_id);
CREATE INDEX idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX idx_submissions_student_id ON public.submissions(student_id);
CREATE INDEX idx_session_events_student_id ON public.session_events(student_id);

-- Helper functions for RLS to bypass row recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.user_role SECURITY DEFINER AS $$
    SELECT role FROM public.users WHERE id = user_id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.get_user_class_id(user_id UUID)
RETURNS UUID SECURITY DEFINER AS $$
    SELECT class_id FROM public.users WHERE id = user_id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.get_user_institution_id(user_id UUID)
RETURNS UUID SECURITY DEFINER AS $$
    SELECT institution_id FROM public.users WHERE id = user_id;
$$ LANGUAGE sql;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY select_users ON public.users
    FOR SELECT USING (
        auth.uid() = id OR
        (public.get_user_role(auth.uid()) = 'teacher' AND class_id = public.get_user_class_id(auth.uid())) OR
        (public.get_user_role(auth.uid()) IN ('admin', 'superadmin') AND institution_id = public.get_user_institution_id(auth.uid()))
    );

CREATE POLICY manage_users_admin ON public.users
    FOR ALL USING (
        public.get_user_role(auth.uid()) IN ('admin', 'superadmin') AND institution_id = public.get_user_institution_id(auth.uid())
    );

CREATE POLICY manage_users_teacher ON public.users
    FOR ALL USING (
        public.get_user_role(auth.uid()) = 'teacher' AND class_id = public.get_user_class_id(auth.uid())
    );

CREATE POLICY update_users_self ON public.users
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RLS Policies for modules
CREATE POLICY select_modules ON public.modules
    FOR SELECT USING (
        created_by = auth.uid() OR
        (public.get_user_role(auth.uid()) = 'teacher' AND public.get_user_class_id(created_by) = public.get_user_class_id(auth.uid())) OR
        (public.get_user_role(auth.uid()) IN ('admin', 'superadmin') AND public.get_user_institution_id(created_by) = public.get_user_institution_id(auth.uid()))
    );

CREATE POLICY insert_modules ON public.modules
    FOR INSERT WITH CHECK (
        public.get_user_role(auth.uid()) IN ('teacher', 'admin', 'superadmin')
    );

CREATE POLICY update_delete_modules ON public.modules
    FOR ALL USING (
        created_by = auth.uid() OR
        (public.get_user_role(auth.uid()) IN ('admin', 'superadmin') AND public.get_user_institution_id(created_by) = public.get_user_institution_id(auth.uid()))
    );

-- RLS Policies for assets
CREATE POLICY select_assets ON public.assets
    FOR SELECT USING (true);

CREATE POLICY manage_assets ON public.assets
    FOR ALL USING (
        public.get_user_role(auth.uid()) IN ('admin', 'superadmin')
    );

-- RLS Policies for assignments
CREATE POLICY select_assignments ON public.assignments
    FOR SELECT USING (
        (public.get_user_role(auth.uid()) = 'student' AND class_id = public.get_user_class_id(auth.uid())) OR
        (public.get_user_role(auth.uid()) = 'teacher' AND class_id = public.get_user_class_id(auth.uid())) OR
        (public.get_user_role(auth.uid()) IN ('admin', 'superadmin') AND public.get_user_institution_id(created_by) = public.get_user_institution_id(auth.uid()))
    );

CREATE POLICY insert_assignments ON public.assignments
    FOR INSERT WITH CHECK (
        public.get_user_role(auth.uid()) IN ('teacher', 'admin', 'superadmin')
    );

CREATE POLICY update_delete_assignments ON public.assignments
    FOR ALL USING (
        created_by = auth.uid() OR
        (public.get_user_role(auth.uid()) IN ('admin', 'superadmin') AND public.get_user_institution_id(created_by) = public.get_user_institution_id(auth.uid()))
    );

-- RLS Policies for submissions
CREATE POLICY select_submissions ON public.submissions
    FOR SELECT USING (
        student_id = auth.uid() OR
        (public.get_user_role(auth.uid()) = 'teacher' AND public.get_user_class_id(student_id) = public.get_user_class_id(auth.uid())) OR
        (public.get_user_role(auth.uid()) IN ('admin', 'superadmin') AND public.get_user_institution_id(student_id) = public.get_user_institution_id(auth.uid()))
    );

CREATE POLICY insert_submissions ON public.submissions
    FOR INSERT WITH CHECK (
        student_id = auth.uid() AND
        public.get_user_role(auth.uid()) = 'student'
    );

CREATE POLICY update_submissions ON public.submissions
    FOR UPDATE USING (
        student_id = auth.uid() OR
        (public.get_user_role(auth.uid()) = 'teacher' AND public.get_user_class_id(student_id) = public.get_user_class_id(auth.uid())) OR
        (public.get_user_role(auth.uid()) IN ('admin', 'superadmin') AND public.get_user_institution_id(student_id) = public.get_user_institution_id(auth.uid()))
    ) WITH CHECK (
        -- If student updating, they cannot modify the score
        (public.get_user_role(auth.uid()) = 'student' AND student_id = auth.uid() AND (score IS NOT DISTINCT FROM score)) OR
        public.get_user_role(auth.uid()) IN ('teacher', 'admin', 'superadmin')
    );

-- RLS Policies for session_events
CREATE POLICY select_session_events ON public.session_events
    FOR SELECT USING (
        student_id = auth.uid() OR
        (public.get_user_role(auth.uid()) = 'teacher' AND public.get_user_class_id(student_id) = public.get_user_class_id(auth.uid())) OR
        (public.get_user_role(auth.uid()) IN ('admin', 'superadmin') AND public.get_user_institution_id(student_id) = public.get_user_institution_id(auth.uid()))
    );

CREATE POLICY insert_session_events ON public.session_events
    FOR INSERT WITH CHECK (
        student_id = auth.uid()
    );

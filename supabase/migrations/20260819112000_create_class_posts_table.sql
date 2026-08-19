-- Create class_posts table
CREATE TABLE public.class_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.class_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_class_posts_class_id ON public.class_posts(class_id);
CREATE INDEX idx_class_posts_author_id ON public.class_posts(author_id);
CREATE INDEX idx_class_posts_parent_id ON public.class_posts(parent_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.class_posts ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow access to users in the same class, or admins/superadmins in the same institution
CREATE POLICY select_class_posts ON public.class_posts
    FOR SELECT USING (
        (public.get_user_role(auth.uid()) = 'student' AND class_id = public.get_user_class_id(auth.uid())) OR
        (public.get_user_role(auth.uid()) = 'teacher' AND class_id = public.get_user_class_id(auth.uid())) OR
        (public.get_user_role(auth.uid()) IN ('admin', 'superadmin') AND public.get_user_institution_id(auth.uid()) = public.get_user_institution_id(author_id))
    );

-- Insert policy: Teachers can post to their own class. Students (middle tier and above) can post replies.
CREATE POLICY insert_class_posts ON public.class_posts
    FOR INSERT WITH CHECK (
        (public.get_user_role(auth.uid()) = 'teacher' AND class_id = public.get_user_class_id(auth.uid()) AND author_id = auth.uid()) OR
        (
            public.get_user_role(auth.uid()) = 'student' AND 
            class_id = public.get_user_class_id(auth.uid()) AND 
            author_id = auth.uid() AND
            parent_id IS NOT NULL AND
            (SELECT age_tier FROM public.users WHERE id = auth.uid()) IN ('middle', 'high_school', 'university')
        ) OR
        (public.get_user_role(auth.uid()) IN ('admin', 'superadmin'))
    );

-- Manage policy: Only authors or admins/superadmins can update or delete
CREATE POLICY manage_class_posts ON public.class_posts
    FOR ALL USING (
        auth.uid() = author_id OR
        public.get_user_role(auth.uid()) IN ('admin', 'superadmin')
    );

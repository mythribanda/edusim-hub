-- Create tutor_cached_answers table
CREATE TABLE public.tutor_cached_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_hash VARCHAR(64) NOT NULL UNIQUE,
    age_tier VARCHAR(50) NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing
CREATE INDEX idx_tutor_cached_answers_hash ON public.tutor_cached_answers(question_hash);

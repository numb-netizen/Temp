-- MCQ bank for the future live-exam page.
-- Subjects and chapters mirror the site's tracker (data-subject / data-chapter),
-- so a question is always tied to exactly one chapter that exists on the site.
-- Questions are written/reviewed in the Google Sheet and synced here.
-- Visitors (anon) can read ONLY questions a teacher has marked verified;
-- drafts and rejected questions are private. Nobody but the service role can write.

CREATE TABLE public.mcq_subjects (
  key text PRIMARY KEY CHECK (key ~ '^[a-z0-9-]{2,30}$'),
  name_bn text NOT NULL CHECK (char_length(name_bn) BETWEEN 1 AND 80),
  stream text NOT NULL CHECK (stream IN ('common', 'science', 'humanities', 'commerce')),
  sort smallint NOT NULL
);

CREATE TABLE public.mcq_chapters (
  subject text NOT NULL REFERENCES public.mcq_subjects(key) ON UPDATE CASCADE,
  chapter_no integer NOT NULL CHECK (chapter_no >= 0),
  name_bn text NOT NULL CHECK (char_length(name_bn) BETWEEN 1 AND 160),
  paper smallint CHECK (paper IS NULL OR paper IN (1, 2)),
  sort integer NOT NULL,
  PRIMARY KEY (subject, chapter_no)
);

CREATE TABLE public.mcq_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9-]+-[0-9]{3}-[0-9]{3}$'),
  subject text NOT NULL,
  chapter_no integer NOT NULL,
  stem text NOT NULL CHECK (char_length(btrim(stem)) BETWEEN 3 AND 600),
  option_a text NOT NULL CHECK (char_length(btrim(option_a)) BETWEEN 1 AND 200),
  option_b text NOT NULL CHECK (char_length(btrim(option_b)) BETWEEN 1 AND 200),
  option_c text NOT NULL CHECK (char_length(btrim(option_c)) BETWEEN 1 AND 200),
  option_d text NOT NULL CHECK (char_length(btrim(option_d)) BETWEEN 1 AND 200),
  correct text NOT NULL CHECK (correct IN ('a', 'b', 'c', 'd')),
  explanation text CHECK (explanation IS NULL OR char_length(explanation) <= 800),
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  source text NOT NULL CHECK (source IN ('ai_draft', 'teacher', 'board')),
  source_note text CHECK (source_note IS NULL OR char_length(source_note) <= 200),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'verified', 'rejected')),
  verified_by text CHECK (verified_by IS NULL OR char_length(verified_by) <= 80),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (subject, chapter_no) REFERENCES public.mcq_chapters(subject, chapter_no) ON UPDATE CASCADE,
  CONSTRAINT mcq_options_distinct CHECK (
    btrim(option_a) <> btrim(option_b) AND btrim(option_a) <> btrim(option_c) AND btrim(option_a) <> btrim(option_d)
    AND btrim(option_b) <> btrim(option_c) AND btrim(option_b) <> btrim(option_d) AND btrim(option_c) <> btrim(option_d)),
  CONSTRAINT mcq_verified_has_reviewer CHECK (status <> 'verified' OR (verified_at IS NOT NULL AND verified_by IS NOT NULL))
);
CREATE INDEX mcq_questions_live_idx ON public.mcq_questions (subject, chapter_no) WHERE status = 'verified';

ALTER TABLE public.mcq_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_questions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mcq_subjects, public.mcq_chapters, public.mcq_questions FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.mcq_subjects, public.mcq_chapters TO anon, authenticated;
CREATE POLICY mcq_subjects_public_read ON public.mcq_subjects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY mcq_chapters_public_read ON public.mcq_chapters FOR SELECT TO anon, authenticated USING (true);

-- Reviewer names, internal notes and timestamps stay private.
GRANT SELECT (id, code, subject, chapter_no, stem, option_a, option_b, option_c, option_d, correct, explanation, difficulty)
  ON public.mcq_questions TO anon, authenticated;
CREATE POLICY mcq_questions_public_read_verified ON public.mcq_questions FOR SELECT TO anon, authenticated
  USING (status = 'verified');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcq_subjects, public.mcq_chapters, public.mcq_questions TO service_role;

NOTIFY pgrst, 'reload schema';

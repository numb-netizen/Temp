-- Live MCQ test on the Bangla 1st paper page (site/mcq-test.html).
-- Visitors may now also read unverified AI-draft questions, but only for subject 'bangla'.
-- The page labels every question as an AI draft that a teacher has not checked yet.
--  * Rejected questions are never readable (status must be 'draft' here, or 'verified' via the old policy).
--  * The column GRANT from 20261118120000_mcq_bank.sql is unchanged, so source, source_note, status and
--    reviewer columns stay private; visitors get stem, options, correct answer, explanation and difficulty.
--  * Permissive policies are OR-ed: verified questions of every subject stay readable as before.
CREATE POLICY mcq_questions_public_read_bangla_drafts ON public.mcq_questions FOR SELECT TO anon, authenticated
  USING (subject = 'bangla' AND status = 'draft');

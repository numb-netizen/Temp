-- Private staging queue. Only the service role can read or modify its rows.
CREATE TABLE public.feedback_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  issue_number integer CHECK (issue_number IS NULL OR issue_number > 0)
);
CREATE INDEX feedback_queue_pending_idx ON public.feedback_queue (created_at, id) WHERE issue_number IS NULL;
ALTER TABLE public.feedback_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.feedback_queue FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.feedback_queue TO service_role;

-- Global limit (including concurrent requests). It reduces abuse but cannot prevent
-- a malicious visitor exhausting the shared quota; it is not a CAPTCHA.
CREATE FUNCTION public.enqueue_feedback(p_title text, p_body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE new_id uuid;
BEGIN
  IF p_title IS NULL OR p_body IS NULL OR char_length(btrim(p_title)) NOT BETWEEN 1 AND 120
     OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'invalid_feedback' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(1833307521);
  IF (SELECT count(*) FROM public.feedback_queue WHERE created_at > now() - interval '1 hour') >= 5 THEN
    RAISE EXCEPTION 'feedback_rate_limit' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.feedback_queue(title,body) VALUES (btrim(p_title),btrim(p_body)) RETURNING id INTO new_id;
  RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.enqueue_feedback(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_feedback(text,text) TO service_role;
NOTIFY pgrst, 'reload schema';

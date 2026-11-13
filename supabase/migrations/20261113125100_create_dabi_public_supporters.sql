-- This table stores names that people explicitly choose to publish.
-- Anonymous clients may read names and add a name, but cannot modify or delete rows.
CREATE TABLE public.dabi_public_supporters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CONSTRAINT dabi_name_valid CHECK (char_length(name) BETWEEN 1 AND 80 AND name = btrim(name) AND name !~ '[[:cntrl:]]'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX dabi_public_supporters_created_at_idx ON public.dabi_public_supporters (created_at DESC, id DESC);
ALTER TABLE public.dabi_public_supporters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.dabi_public_supporters FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, name, created_at) ON public.dabi_public_supporters TO anon, authenticated;
GRANT INSERT (name) ON public.dabi_public_supporters TO anon, authenticated;
CREATE POLICY dabi_supporters_public_read ON public.dabi_public_supporters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY dabi_supporters_public_insert ON public.dabi_public_supporters FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Optional roll numbers are writable by the public but readable only by
-- privileged project administrators, not anon/authenticated API clients.
ALTER TABLE public.dabi_public_supporters
  ADD COLUMN roll_no text CONSTRAINT dabi_roll_no_valid
  CHECK (roll_no IS NULL OR roll_no ~ '^[0-9০-৯]{1,20}$');
REVOKE SELECT (roll_no) ON public.dabi_public_supporters FROM PUBLIC, anon, authenticated;
GRANT INSERT (roll_no) ON public.dabi_public_supporters TO anon, authenticated;
NOTIFY pgrst, 'reload schema';

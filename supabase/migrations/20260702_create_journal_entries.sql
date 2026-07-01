-- Journal entries table for the AI Memory Journal feature
CREATE TABLE public.journal_entries (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_text        text NOT NULL,
  summary_text    text,
  mood            text,
  input_method    text NOT NULL DEFAULT 'text',
  created_at      timestamptz DEFAULT now() NOT NULL,
  summarized_at   timestamptz
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Seniors can CRUD their own entries
CREATE POLICY "seniors_select_own"       ON public.journal_entries FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "seniors_insert_own"       ON public.journal_entries FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "seniors_update_own"       ON public.journal_entries FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "seniors_delete_own"       ON public.journal_entries FOR DELETE  USING (auth.uid() = user_id);

-- Caregivers can SELECT entries for linked seniors (read-only)
CREATE POLICY "caregivers_select_linked" ON public.journal_entries FOR SELECT  USING (
  EXISTS (
    SELECT 1 FROM public.caregiver_senior_connections
    WHERE caregiver_id = auth.uid()
      AND senior_id = journal_entries.user_id
      AND status = 'accepted'
  )
);

CREATE INDEX idx_journal_entries_user_created ON public.journal_entries(user_id, created_at DESC);

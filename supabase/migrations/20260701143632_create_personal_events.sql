CREATE TABLE IF NOT EXISTS public.personal_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  senior_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text,
  notes text,
  recurrence text,
  reminders_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.personal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personal events"
  ON public.personal_events
  FOR SELECT
  USING (
    auth.uid() = caregiver_id OR 
    auth.uid() = senior_id
  );

CREATE POLICY "Caregivers can insert personal events"
  ON public.personal_events
  FOR INSERT
  WITH CHECK (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can update personal events"
  ON public.personal_events
  FOR UPDATE
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can delete personal events"
  ON public.personal_events
  FOR DELETE
  USING (auth.uid() = caregiver_id);

CREATE TABLE public.memory_capsules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  senior_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  trigger_date date NOT NULL,
  is_viewed boolean DEFAULT false NOT NULL
);

ALTER TABLE public.memory_capsules ENABLE ROW LEVEL SECURITY;

-- Seniors can view their own capsules if trigger_date <= today
CREATE POLICY "Seniors can view their own capsules" ON public.memory_capsules
  FOR SELECT
  USING (auth.uid() = senior_id AND trigger_date <= CURRENT_DATE);

-- Seniors can update their own capsules (e.g. to mark as viewed)
CREATE POLICY "Seniors can update their own capsules" ON public.memory_capsules
  FOR UPDATE
  USING (auth.uid() = senior_id AND trigger_date <= CURRENT_DATE)
  WITH CHECK (auth.uid() = senior_id AND trigger_date <= CURRENT_DATE);

-- Caregivers can manage capsules they created
CREATE POLICY "Caregivers can manage capsules they created" ON public.memory_capsules
  FOR ALL
  USING (auth.uid() = caregiver_id);

CREATE TABLE public.memory_capsule_items (
  capsule_id uuid NOT NULL REFERENCES public.memory_capsules(id) ON DELETE CASCADE,
  memory_file_id bigint NOT NULL REFERENCES public.memory_files(id) ON DELETE CASCADE,
  PRIMARY KEY (capsule_id, memory_file_id)
);

ALTER TABLE public.memory_capsule_items ENABLE ROW LEVEL SECURITY;

-- Seniors can view items for their capsules
CREATE POLICY "Seniors can view their capsule items" ON public.memory_capsule_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memory_capsules
      WHERE id = memory_capsule_items.capsule_id AND senior_id = auth.uid() AND trigger_date <= CURRENT_DATE
    )
  );

-- Caregivers can manage items for capsules they created
CREATE POLICY "Caregivers can manage capsule items they created" ON public.memory_capsule_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.memory_capsules
      WHERE id = memory_capsule_items.capsule_id AND caregiver_id = auth.uid()
    )
  );
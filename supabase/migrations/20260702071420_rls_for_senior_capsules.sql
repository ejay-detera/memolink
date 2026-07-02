-- Add insert policy for seniors on memory_capsules
CREATE POLICY "Seniors can insert their own capsules" ON public.memory_capsules
  FOR INSERT
  WITH CHECK (auth.uid() = senior_id);

-- Allow caregivers to view any capsule in the senior's vault
CREATE POLICY "Caregivers can view capsules for connected seniors" ON public.memory_capsules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM caregiver_senior_connections csc
      WHERE csc.caregiver_id = auth.uid() AND csc.senior_id = memory_capsules.senior_id AND csc.status = 'accepted'
    )
  );

-- Add insert policy for seniors on memory_capsule_items
CREATE POLICY "Seniors can insert their own capsule items" ON public.memory_capsule_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memory_capsules
      WHERE id = capsule_id AND senior_id = auth.uid()
    )
  );

-- Allow caregivers to view items for any capsule in the senior's vault
CREATE POLICY "Caregivers can view capsule items for connected seniors" ON public.memory_capsule_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memory_capsules mc
      JOIN caregiver_senior_connections csc ON csc.senior_id = mc.senior_id
      WHERE mc.id = memory_capsule_items.capsule_id 
        AND csc.caregiver_id = auth.uid() 
        AND csc.status = 'accepted'
    )
  );

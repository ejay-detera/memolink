-- Caregivers can SELECT appointments for connected seniors
CREATE POLICY "caregivers_select_appointments" 
  ON public.medical_appointments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.caregiver_senior_connections
      WHERE caregiver_id = auth.uid() 
        AND senior_id = medical_appointments.senior_id 
        AND status = 'accepted'
    )
  );

-- Caregivers can manage appointments for connected seniors
CREATE POLICY "caregivers_manage_appointments" 
  ON public.medical_appointments FOR ALL USING (
    auth.uid() = caregiver_id
  );

-- Caregivers can SELECT routines for connected seniors
CREATE POLICY "caregivers_select_routines" 
  ON public.routines FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.caregiver_senior_connections
      WHERE caregiver_id = auth.uid() 
        AND senior_id = routines.user_id 
        AND status = 'accepted'
    )
  );

-- Caregivers can manage routines for connected seniors
CREATE POLICY "caregivers_manage_routines"
  ON public.routines FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.caregiver_senior_connections
      WHERE caregiver_id = auth.uid()
        AND senior_id = routines.user_id
        AND status = 'accepted'
    )
  );

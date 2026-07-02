-- Create Medications Table
CREATE TABLE IF NOT EXISTS public.medications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  senior_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  dosage text NOT NULL,
  instructions text,
  times text[] DEFAULT '{}'::text[] NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  start_date date,
  end_date date,
  schedule_type text DEFAULT 'scheduled' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create Medication Logs Table
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id uuid REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'taken' NOT NULL,
  logged_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Medications
CREATE POLICY "Seniors can view their own medications"
  ON public.medications FOR SELECT USING (auth.uid() = senior_id);

CREATE POLICY "Seniors can manage their own medications"
  ON public.medications FOR ALL USING (auth.uid() = senior_id);

CREATE POLICY "Caregivers can view connected seniors' medications"
  ON public.medications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.caregiver_senior_connections
      WHERE (caregiver_id = auth.uid() AND senior_id = medications.senior_id AND status = 'accepted')
    )
  );

CREATE POLICY "Caregivers can manage connected seniors' medications"
  ON public.medications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.caregiver_senior_connections
      WHERE (caregiver_id = auth.uid() AND senior_id = medications.senior_id AND status = 'accepted')
    )
  );

-- RLS Policies for Logs
CREATE POLICY "Users can view logs for their medications"
  ON public.medication_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.medications
      WHERE medications.id = medication_logs.medication_id 
      AND (
        medications.senior_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.caregiver_senior_connections
          WHERE caregiver_id = auth.uid() AND senior_id = medications.senior_id AND status = 'accepted'
        )
      )
    )
  );

CREATE POLICY "Users can insert logs for their medications"
  ON public.medication_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medications
      WHERE medications.id = medication_id 
      AND (
        medications.senior_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.caregiver_senior_connections
          WHERE caregiver_id = auth.uid() AND senior_id = medications.senior_id AND status = 'accepted'
        )
      )
    )
  );

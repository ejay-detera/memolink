export type PersonalEvent = {
  id: string;
  caregiver_id: string;
  senior_id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  recurrence: string | null;
  reminders_enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PersonalEventUpdate = Partial<Omit<PersonalEvent, 'id' | 'created_at' | 'updated_at'>>;

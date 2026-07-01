/**
 * Journal entry type definitions for the AI Memory Journal feature.
 */

/** Shape of a row in the `public.journal_entries` table. */
export type JournalEntry = {
  id: string;
  user_id: string;
  raw_text: string;
  summary_text: string | null;
  mood: string | null;
  input_method: 'text' | 'voice';
  created_at: string;
  summarized_at: string | null;
};

/** Insert params — omits server-generated fields. */
export type JournalEntryInsert = {
  user_id: string;
  raw_text: string;
  mood?: string | null;
  input_method: 'text' | 'voice';
};

/** Mood options for the mood picker UI. */
export type MoodOption = {
  key: string;
  label: string;
  emoji: string;
};

/** Pre-defined mood options. */
export const MOOD_OPTIONS: MoodOption[] = [
  { key: 'happy', label: 'Happy', emoji: '😊' },
  { key: 'okay', label: 'Okay', emoji: '😌' },
  { key: 'sad', label: 'Sad', emoji: '😔' },
  { key: 'frustrated', label: 'Frustrated', emoji: '😤' },
  { key: 'tired', label: 'Tired', emoji: '😴' },
];

/** Date filter options for the journal list. */
export type DateFilter = 'today' | 'week' | 'month' | 'all';

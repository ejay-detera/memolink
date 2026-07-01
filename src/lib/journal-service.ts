/**
 * Journal Service — data access and Gemini summarization for the AI Memory Journal.
 *
 * All journal CRUD goes through this module. The Gemini integration is isolated
 * in `summarizeEntry()` so it can be reused by the future Conversational Memory
 * Assistant feature.
 */

import { supabase } from '@/lib/supabase';
import type { JournalEntry, JournalEntryInsert, DateFilter } from '@/types/journal';

// ---------------------------------------------------------------------------
// Gemini Summarization via Edge Function
// ---------------------------------------------------------------------------

/**
 * Call Gemini API via Supabase Edge Function to generate a plain-language summary of journal text.
 * Returns the summary string on success, or null on failure.
 */
export async function generateSummary(rawText: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('summarize-journal', {
      body: { rawText },
    });

    if (error) {
      console.warn('[JournalService] Edge Function error:', error.message || error);
      return null;
    }

    if (data?.error) {
      console.warn('[JournalService] Edge Function returned error:', data.error, data.details);
      return null;
    }

    return data?.summary || null;
  } catch (error) {
    console.warn('[JournalService] Failed to invoke edge function:', error);
    return null;
  }
}

/**
 * Invoke summarization for a specific journal entry and persist the result.
 * This is fire-and-forget safe — failures don't throw, they just log.
 */
export async function summarizeEntry(entryId: string, rawText: string): Promise<void> {
  const summary = await generateSummary(rawText);

  if (summary) {
    const { error } = await supabase
      .from('journal_entries')
      .update({
        summary_text: summary,
        summarized_at: new Date().toISOString(),
      })
      .eq('id', entryId);

    if (error) {
      console.warn('[JournalService] Failed to persist summary:', error);
    }
  }
}

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

/**
 * Create a new journal entry and trigger summarization in the background.
 * Returns the created entry (without summary — that arrives async).
 */
export async function createEntry(
  params: JournalEntryInsert,
): Promise<{ data: JournalEntry | null; error: string | null }> {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: params.user_id,
      raw_text: params.raw_text,
      mood: params.mood ?? null,
      input_method: params.input_method,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  // Fire-and-forget: summarize in the background
  summarizeEntry(data.id, data.raw_text).catch(() => {});

  return { data: data as JournalEntry, error: null };
}

/**
 * Fetch journal entries for a user (senior viewing their own entries).
 * Supports date filtering and pagination-ready ordering.
 */
export async function fetchEntries(
  userId: string,
  dateFilter: DateFilter = 'all',
): Promise<{ data: JournalEntry[]; error: string | null }> {
  let query = supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Apply date filter
  if (dateFilter !== 'all') {
    const now = new Date();
    let fromDate: Date;

    switch (dateFilter) {
      case 'today':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        fromDate = new Date(now);
        fromDate.setMonth(now.getMonth() - 1);
        break;
    }

    query = query.gte('created_at', fromDate!.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as JournalEntry[], error: null };
}

/**
 * Fetch journal summaries for a specific senior (caregiver view).
 * RLS ensures only linked caregivers can read these.
 */
export async function fetchEntriesForSenior(
  seniorId: string,
): Promise<{ data: JournalEntry[]; error: string | null }> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', seniorId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as JournalEntry[], error: null };
}

/**
 * Delete a journal entry. RLS ensures only the owner can delete.
 */
export async function deleteEntry(
  entryId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', entryId);

  return { error: error?.message ?? null };
}

/**
 * Retry summarization for an entry that failed previously.
 */
export async function retrySummarization(
  entryId: string,
  rawText: string,
): Promise<{ success: boolean }> {
  const summary = await generateSummary(rawText);

  if (!summary) {
    return { success: false };
  }

  const { error } = await supabase
    .from('journal_entries')
    .update({
      summary_text: summary,
      summarized_at: new Date().toISOString(),
    })
    .eq('id', entryId);

  return { success: !error };
}

/**
 * Sync all pending summaries (triggered on app open).
 * Invokes the retry-pending-summaries edge function.
 */
export async function syncPendingSummaries(): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('retry-pending-summaries');
    if (error) {
      console.warn('[JournalService] Failed to sync pending summaries:', error.message || error);
    }
  } catch (error) {
    console.warn('[JournalService] Error invoking retry edge function:', error);
  }
}

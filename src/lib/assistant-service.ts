import { supabase } from '@/lib/supabase';

export async function askAssistant(
  question: string,
  userId: string,
  userRole: 'senior' | 'caregiver',
  seniorId?: string,
): Promise<{ answer: string; intent: string } | null> {
  try {
    const { data, error } = await supabase.functions.invoke('assistant-query', {
      body: { question, userId, userRole, seniorId },
    });

    if (error) {
      console.warn('[AssistantService] Edge Function error:', error.message || error);
      return { answer: "I'm having trouble connecting right now. Please try again later.", intent: 'unknown' };
    }

    if (data?.error) {
      console.warn('[AssistantService] Edge Function returned error:', data.error);
      return { answer: "I'm having trouble understanding. Let's try another question.", intent: 'unknown' };
    }

    return {
      answer: data?.answer || "I couldn't find an answer for that.",
      intent: data?.intent || 'unknown',
    };
  } catch (error) {
    console.warn('[AssistantService] Failed to invoke assistant-query edge function:', error);
    return { answer: "Something went wrong. Please check your connection.", intent: 'unknown' };
  }
}

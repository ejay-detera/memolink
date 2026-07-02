import { supabase } from '@/lib/supabase';

export type AssistantThread = {
  id: string;
  senior_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type AssistantMessage = {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export async function createThread(seniorId: string, title: string = 'New Conversation'): Promise<AssistantThread | null> {
  const { data, error } = await supabase
    .from('assistant_threads')
    .insert({ senior_id: seniorId, title })
    .select()
    .single();

  if (error) {
    console.error('Error creating thread:', error);
    return null;
  }
  return data;
}

export async function getThreads(seniorId: string): Promise<AssistantThread[]> {
  const { data, error } = await supabase
    .from('assistant_threads')
    .select('*')
    .eq('senior_id', seniorId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching threads:', error);
    return [];
  }
  return data || [];
}

export async function getMessages(threadId: string): Promise<AssistantMessage[]> {
  const { data, error } = await supabase
    .from('assistant_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return data || [];
}

export async function saveMessage(threadId: string, role: 'user' | 'assistant', content: string): Promise<AssistantMessage | null> {
  const { data, error } = await supabase
    .from('assistant_messages')
    .insert({ thread_id: threadId, role, content })
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    return null;
  }
  
  // Update thread updated_at
  await supabase
    .from('assistant_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', threadId);

  return data;
}

export async function renameThread(threadId: string, title: string): Promise<void> {
  await supabase
    .from('assistant_threads')
    .update({ title })
    .eq('id', threadId);
}

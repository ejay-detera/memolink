import { supabase } from './supabase';

export async function verifyAcceptedConnection(
  caregiverId: string,
  seniorId: string
): Promise<{ valid: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('caregiver_senior_connections')
    .select('id, status')
    .eq('caregiver_id', caregiverId)
    .eq('senior_id', seniorId)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Connection not found.' };
  }
  if (data.status !== 'accepted') {
    return { valid: false, error: 'You no longer have access to this senior\'s data.' };
  }
  
  return { valid: true };
}

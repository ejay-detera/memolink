import { useState, useCallback } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type Capsule = Database['public']['Tables']['memory_capsules']['Row'];
export type CapsuleItem = Database['public']['Tables']['memory_capsule_items']['Row'];
export type MemoryFile = Database['public']['Tables']['memory_files']['Row'];

export type CapsuleWithItems = Capsule & {
  items: (CapsuleItem & { memory_file: MemoryFile })[];
};

export function useCapsules(seniorId: string | null) {
  const { user, userRole } = useAuth();
  const [capsules, setCapsules] = useState<CapsuleWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCapsules = useCallback(async () => {
    if (!user) return;
    
    // For seniors, fetch their own capsules. 
    // For caregivers, fetch capsules for the selected seniorId.
    const targetSeniorId = userRole === 'senior' ? user.id : seniorId;
    
    if (!targetSeniorId) {
      setCapsules([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // We need to fetch capsules and their items, and for each item, the associated memory file.
      // Because Supabase JS can do nested selects if relationships are defined:
      let query = supabase
        .from('memory_capsules')
        .select(`
          *,
          memory_capsule_items (
            capsule_id,
            memory_file_id,
            memory_files (*)
          )
        `)
        .eq('senior_id', targetSeniorId)
        .order('trigger_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform response to match CapsuleWithItems
      const formattedCapsules = (data || []).map(c => ({
        ...c,
        items: (c.memory_capsule_items || []).map((item: any) => ({
          capsule_id: item.capsule_id,
          memory_file_id: item.memory_file_id,
          memory_file: item.memory_files,
        }))
      })) as CapsuleWithItems[];

      setCapsules(formattedCapsules);
    } catch (error) {
      console.error('Error fetching capsules:', error);
    } finally {
      setLoading(false);
    }
  }, [user, userRole, seniorId]);

  const createCapsule = async (
    title: string, 
    message: string, 
    triggerDate: string, 
    fileIds: number[] | string[], 
    targetSeniorId: string
  ) => {
    if (!user) return null;
    try {
      // 1. Insert the capsule
      const { data: capsule, error: capsuleError } = await supabase
        .from('memory_capsules')
        .insert({
          title,
          message,
          trigger_date: triggerDate,
          senior_id: targetSeniorId,
          caregiver_id: user.id,
          is_viewed: false,
        })
        .select()
        .single();

      if (capsuleError) throw capsuleError;

      // 2. Insert items
      if (fileIds.length > 0) {
        const itemsToInsert = fileIds.map(fileId => ({
          capsule_id: capsule.id,
          memory_file_id: Number(fileId),
        }));
        
        const { error: itemsError } = await supabase
          .from('memory_capsule_items')
          .insert(itemsToInsert);
          
        if (itemsError) throw itemsError;
      }

      await fetchCapsules();
      return capsule;
    } catch (error) {
      console.error('Error creating capsule:', error);
      return null;
    }
  };
  
  const markAsViewed = async (capsuleId: string) => {
    try {
      const { error } = await supabase
        .from('memory_capsules')
        .update({ is_viewed: true })
        .eq('id', capsuleId);
        
      if (error) throw error;
      
      // Update local state
      setCapsules(prev => 
        prev.map(c => c.id === capsuleId ? { ...c, is_viewed: true } : c)
      );
    } catch (error) {
      console.error('Error marking capsule as viewed:', error);
    }
  };

  return {
    capsules,
    loading,
    fetchCapsules,
    createCapsule,
    markAsViewed
  };
}

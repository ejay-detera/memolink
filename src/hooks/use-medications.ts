import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

export type Medication = {
  id: string;
  senior_id: string;
  name: string;
  dosage: string;
  instructions: string | null;
  times: string[];
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  schedule_type: 'scheduled' | 'as_needed';
  created_at: string;
};

export type MedicationLog = {
  id: string;
  medication_id: string;
  status: 'taken' | 'skipped';
  logged_at: string;
};

export type SeniorProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export function useMedications(activeSeniorId?: string | null) {
  const { user, userRole } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<Record<string, MedicationLog[]>>({});
  const [connectedSeniors, setConnectedSeniors] = useState<SeniorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Target senior is either the active selected senior (for caregivers) or the logged-in user
  const targetSeniorId = userRole === 'caregiver' ? activeSeniorId : user?.id;

  // 1. Fetch connected seniors (for caregivers)
  const fetchSeniors = useCallback(async () => {
    if (userRole !== 'caregiver' || !user) {
      setConnectedSeniors([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('caregiver_senior_connections')
        .select('profiles!caregiver_senior_connections_senior_id_fkey(id, first_name, last_name, avatar_url)')
        .eq('caregiver_id', user.id)
        .eq('status', 'accepted');
      
      if (error) throw error;
      
      const list = (data || [])
        .map((d: any) => {
          const prof = d.profiles;
          if (!prof) return null;
          const profile = Array.isArray(prof) ? prof[0] : prof;
          return {
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url
          };
        })
        .filter(Boolean) as SeniorProfile[];

      setConnectedSeniors(list);
    } catch (err) {
      console.error('Error fetching connected seniors:', err);
    }
  }, [user, userRole]);

  // 2. Fetch medications and logs
  const fetchMedData = useCallback(async () => {
    if (!targetSeniorId) {
      setMedications([]);
      setLogs({});
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data: meds, error: medErr } = await supabase
        .from('medications')
        .select('*')
        .eq('senior_id', targetSeniorId)
        .order('name', { ascending: true });

      if (medErr) throw medErr;
      setMedications(meds || []);

      // Get logs for the current day
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Fetch logs for these medications
      const medIds = meds?.map(m => m.id) || [];
      if (medIds.length === 0) {
        setLogs({});
        return;
      }

      const { data: logsData, error: logsErr } = await supabase
        .from('medication_logs')
        .select('*')
        .in('medication_id', medIds)
        .gte('logged_at', todayStart.toISOString());

      if (logsErr) throw logsErr;

      const logsMap: Record<string, MedicationLog[]> = {};
      logsData?.forEach((log: MedicationLog) => {
        if (!logsMap[log.medication_id]) logsMap[log.medication_id] = [];
        logsMap[log.medication_id].push(log);
      });
      setLogs(logsMap);
    } catch (err) {
      console.error('Error fetching medication data:', err);
    } finally {
      setLoading(false);
    }
  }, [targetSeniorId]);

  useEffect(() => {
    fetchSeniors();
  }, [fetchSeniors]);

  useEffect(() => {
    fetchMedData();
  }, [fetchMedData]);

  // Actions
  const saveMedication = async (
    id: string | null,
    name: string,
    dosage: string,
    instructions: string,
    times: string[],
    startDate: string | null = null,
    endDate: string | null = null,
    scheduleType: 'scheduled' | 'as_needed' = 'scheduled'
  ) => {
    if (!targetSeniorId) return false;
    try {
      if (id) {
        const { error } = await supabase
          .from('medications')
          .update({ 
            name: name.trim(), 
            dosage: dosage.trim(), 
            instructions: instructions.trim() || null, 
            times,
            start_date: startDate,
            end_date: endDate,
            schedule_type: scheduleType
          })
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('medications')
          .insert({ 
            senior_id: targetSeniorId, 
            name: name.trim(), 
            dosage: dosage.trim(), 
            instructions: instructions.trim() || null, 
            times,
            start_date: startDate,
            end_date: endDate,
            schedule_type: scheduleType
          });
        if (error) throw error;
      }
      await fetchMedData();
      return true;
    } catch (err) {
      console.error('Failed to save medication:', err);
      return false;
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      const { error } = await supabase.from('medications').delete().eq('id', id);
      if (error) throw error;
      await fetchMedData();
      return true;
    } catch (err) {
      console.error('Failed to delete medication:', err);
      return false;
    }
  };

  const logAdherence = async (medicationId: string, status: 'taken' | 'skipped') => {
    try {
      // Delete existing log for today if we are changing it
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      await supabase
        .from('medication_logs')
        .delete()
        .eq('medication_id', medicationId)
        .gte('logged_at', todayStart.toISOString());

      const { error } = await supabase
        .from('medication_logs')
        .insert({ medication_id: medicationId, status });
      if (error) throw error;
      await fetchMedData();
      return true;
    } catch (err) {
      console.error('Failed to log adherence:', err);
      return false;
    }
  };

  return {
    medications,
    logs,
    connectedSeniors,
    loading,
    saveMedication,
    deleteMedication,
    logAdherence,
    refresh: fetchMedData
  };
}

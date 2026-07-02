import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';
import type { Medication, MedicationLog } from './use-medications';
import type { MedicalAppointment } from '@/types/appointment';
import type { JournalEntry } from '@/types/journal';

export type ConnectedSenior = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export type MedProgress = {
  taken: number;
  total: number;
  nextMed: Medication | null;
  nextTime: string;
};

export type ActivityItem = {
  id: string;
  type: 'journal' | 'medication';
  title: string;
  description: string;
  timestamp: string;
};

export function useCaregiverDashboard() {
  const { user, userRole } = useAuth();
  
  const [connectedSeniors, setConnectedSeniors] = useState<ConnectedSenior[]>([]);
  const [selectedSeniorId, setSelectedSeniorId] = useState<string | null>(null);
  
  const [medProgress, setMedProgress] = useState<MedProgress>({ taken: 0, total: 0, nextMed: null, nextTime: '' });
  const [nextAppointment, setNextAppointment] = useState<MedicalAppointment | null>(null);
  const [recentJournals, setRecentJournals] = useState<Pick<JournalEntry, 'id' | 'summary_text' | 'mood' | 'created_at'>[]>([]);
  const [vaultStats, setVaultStats] = useState<{ folders: number; files: number }>({ folders: 0, files: 0 });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  
  const [loading, setLoading] = useState(true);

  const fetchConnectedSeniors = useCallback(async () => {
    if (!user || userRole !== 'caregiver') return;
    try {
      const { data, error } = await supabase
        .from('caregiver_senior_connections')
        .select(`
          senior_id,
          profiles!caregiver_senior_connections_senior_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq('caregiver_id', user.id)
        .eq('status', 'accepted');

      if (error) throw error;
      
      const parsed = (data || []).map((d: any) => d.profiles);
      setConnectedSeniors(parsed);
      
      if (parsed.length > 0 && !selectedSeniorId) {
        setSelectedSeniorId(parsed[0].id);
      } else if (parsed.length === 0) {
        setSelectedSeniorId(null);
      }
    } catch (err) {
      console.error('Error fetching seniors:', err);
    }
  }, [user, userRole, selectedSeniorId]);

  useEffect(() => {
    fetchConnectedSeniors();
  }, [fetchConnectedSeniors]);

  const loadDashboardData = useCallback(async () => {
    if (!selectedSeniorId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      // 1. Fetch Medication Progress
      const { data: meds } = await supabase
        .from('medications')
        .select('*')
        .eq('senior_id', selectedSeniorId)
        .eq('is_active', true);

      let totalDoses = 0;
      let takenDoses = 0;
      let nextMed: Medication | null = null;
      let nextTime = '';
      
      if (meds && meds.length > 0) {
        const medIds = meds.map(m => m.id);
        const { data: logs } = await supabase
          .from('medication_logs')
          .select('*')
          .in('medication_id', medIds)
          .gte('logged_at', todayStart.toISOString());
          
        totalDoses = meds.reduce((acc, med) => acc + (med.times?.length || 0), 0);
        takenDoses = (logs || []).filter(l => l.status === 'taken').length;
        
        // Find next med
        const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        for (const med of meds) {
          if (med.times) {
            for (const time of med.times) {
              if (time >= nowTime) {
                if (!nextTime || time < nextTime) {
                  nextTime = time;
                  nextMed = med as Medication;
                }
              }
            }
          }
        }
      }
      setMedProgress({ taken: takenDoses, total: totalDoses, nextMed, nextTime });

      // 2. Fetch Next Appointment
      const { data: appts } = await supabase
        .from('medical_appointments')
        .select('*')
        .eq('senior_id', selectedSeniorId)
        .gte('appointment_date', todayStart.toISOString().split('T')[0])
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(1);
        
      setNextAppointment(appts && appts.length > 0 ? appts[0] : null);

      // 3. Fetch Recent Journals
      const { data: journals } = await supabase
        .from('journal_entries')
        .select('id, summary_text, mood, created_at')
        .eq('user_id', selectedSeniorId)
        .order('created_at', { ascending: false })
        .limit(3);
        
      setRecentJournals(journals || []);

      // 4. Fetch Vault Stats
      const { count: foldersCount } = await supabase
        .from('memory_folders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', selectedSeniorId);
        
      const { data: userFolders } = await supabase
        .from('memory_folders')
        .select('id')
        .eq('user_id', selectedSeniorId);
        
      let filesCount = 0;
      if (userFolders && userFolders.length > 0) {
        const folderIds = userFolders.map(f => f.id);
        const { count: fCount } = await supabase
          .from('memory_files')
          .select('*', { count: 'exact', head: true })
          .in('folder_id', folderIds);
        filesCount = fCount || 0;
      }
      setVaultStats({ folders: foldersCount || 0, files: filesCount });
      
      // 5. Compute Recent Activity
      const activity: ActivityItem[] = [];
      if (journals) {
        journals.forEach(j => {
          activity.push({
            id: `journal-${j.id}`,
            type: 'journal',
            title: 'New Journal Entry',
            description: j.summary_text ? j.summary_text.substring(0, 50) + '...' : 'Entry summary pending.',
            timestamp: j.created_at
          });
        });
      }
      // Sort and take latest 3
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activity.slice(0, 3));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSeniorId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const selectedSenior = connectedSeniors.find(s => s.id === selectedSeniorId) || null;

  return {
    connectedSeniors,
    selectedSeniorId,
    setSelectedSeniorId,
    selectedSenior,
    medProgress,
    nextAppointment,
    recentJournals,
    vaultStats,
    recentActivity,
    loading,
    refresh: loadDashboardData
  };
}

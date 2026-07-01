import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, useColorScheme, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@expo/ui/community/datetime-picker';

import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { MedicalAppointment } from '@/types/appointment';

type ConnectedSenior = {
  id: string;
  first_name: string;
  last_name: string;
};

type FetchedAppointment = MedicalAppointment & {
  profiles: {
    first_name: string;
    last_name: string;
  };
};

export default function AppointmentsList() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const router = useRouter();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<FetchedAppointment[]>([]);
  const [seniors, setSeniors] = useState<ConnectedSenior[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchName, setSearchName] = useState('');
  const [selectedSeniorId, setSelectedSeniorId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch connected seniors for the filter
  useEffect(() => {
    const fetchSeniors = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('caregiver_senior_connections')
        .select(`
          senior_id,
          profiles!caregiver_senior_connections_senior_id_fkey(id, first_name, last_name)
        `)
        .eq('caregiver_id', user.id)
        .eq('status', 'accepted');
        
      if (data) {
        const mapped = data.map((d: any) => ({
          id: d.profiles.id,
          first_name: d.profiles.first_name,
          last_name: d.profiles.last_name
        }));
        setSeniors(mapped);
      }
    };
    fetchSeniors();
  }, [user]);

  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    let query = supabase
      .from('medical_appointments')
      .select(`
        *,
        profiles!medical_appointments_senior_id_fkey(first_name, last_name)
      `)
      .eq('caregiver_id', user.id)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (selectedSeniorId) {
      query = query.eq('senior_id', selectedSeniorId);
    }
    
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      query = query.eq('appointment_date', dateString);
    }
    
    if (searchName.trim()) {
      // Search by title or doctor name
      query = query.or(`title.ilike.%${searchName.trim()}%,doctor_name.ilike.%${searchName.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching appointments:', error);
    } else {
      setAppointments(data as unknown as FetchedAppointment[]);
    }
    
    setLoading(false);
  }, [user, searchName, selectedSeniorId, selectedDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Format TIME (HH:MM:SS) to 12h format
  const formatTimeStr = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  const renderItem = ({ item }: { item: FetchedAppointment }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff') }]}
      onPress={() => router.push(`/appointments/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateBox}>
          <Text style={[styles.dateMonth, { color: colors.primary }]}>
            {new Date(item.appointment_date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
          </Text>
          <Text style={[styles.dateDay, { color: colors.text }]}>
            {new Date(item.appointment_date).getDate()}
          </Text>
        </View>
        <View style={styles.cardMain}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.cardTime, { color: colors.text + '80' }]}>
            {formatTimeStr(item.start_time)} - {formatTimeStr(item.end_time)}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="person" size={14} color={colors.text + '80'} />
          <Text style={[styles.footerText, { color: colors.text + '80' }]}>
            {item.profiles.first_name} {item.profiles.last_name}
          </Text>
        </View>
        {item.doctor_name && (
          <View style={styles.footerItem}>
            <Ionicons name="medical" size={14} color={colors.text + '80'} />
            <Text style={[styles.footerText, { color: colors.text + '80' }]} numberOfLines={1}>
              Dr. {item.doctor_name}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Medical Appointments</Text>
        <View style={styles.placeholderRight} />
      </View>

      <View style={styles.filtersContainer}>
        {/* Search Input */}
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff') }]}>
          <Ionicons name="search" size={20} color={colors.text + '80'} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search title or doctor..."
            placeholderTextColor={colors.text + '50'}
            value={searchName}
            onChangeText={setSearchName}
          />
        </View>

        {/* Date Filter */}
        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.dateFilter, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff') }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.text + '80'} />
            <Text style={[styles.dateFilterText, { color: selectedDate ? colors.primary : colors.text }]}>
              {selectedDate ? selectedDate.toLocaleDateString() : 'Any Date'}
            </Text>
          </TouchableOpacity>
          {selectedDate && (
            <TouchableOpacity onPress={() => setSelectedDate(null)} style={styles.clearDate}>
              <Ionicons name="close-circle" size={20} color={colors.text + '80'} />
            </TouchableOpacity>
          )}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}

        {/* Senior Filter Chips */}
        {seniors.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            <TouchableOpacity 
              style={[
                styles.chip, 
                { backgroundColor: selectedSeniorId === null ? colors.primary : (colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff')) }
              ]}
              onPress={() => setSelectedSeniorId(null)}
            >
              <Text style={{ color: selectedSeniorId === null ? '#fff' : colors.text }}>All Seniors</Text>
            </TouchableOpacity>
            
            {seniors.map(senior => (
              <TouchableOpacity 
                key={senior.id}
                style={[
                  styles.chip, 
                  { backgroundColor: selectedSeniorId === senior.id ? colors.primary : (colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff')) }
                ]}
                onPress={() => setSelectedSeniorId(senior.id)}
              >
                <Text style={{ color: selectedSeniorId === senior.id ? '#fff' : colors.text }}>
                  {senior.first_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={appointments}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchAppointments}
        refreshing={loading}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-clear-outline" size={48} color={colors.text + '40'} />
              <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                No medical appointments found.
              </Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/appointments/add')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholderRight: {
    width: 40,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  dateFilterText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  clearDate: {
    marginLeft: 12,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    marginRight: 12,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateDay: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardMain: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000020',
    paddingTop: 12,
    gap: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerText: {
    marginLeft: 6,
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
});

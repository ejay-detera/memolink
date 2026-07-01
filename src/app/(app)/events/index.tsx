import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, useColorScheme, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@expo/ui/community/datetime-picker';

import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { PersonalEvent } from '@/types/event';

type ConnectedSenior = {
  id: string;
  first_name: string;
  last_name: string;
};

type FetchedEvent = PersonalEvent & {
  profiles: {
    first_name: string;
    last_name: string;
  };
};

export default function EventsList() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const router = useRouter();
  const { user } = useAuth();

  const [events, setEvents] = useState<FetchedEvent[]>([]);
  const [seniors, setSeniors] = useState<ConnectedSenior[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeniorId, setSelectedSeniorId] = useState<string | null>(null);
  
  // Date Filter
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchSeniors = useCallback(async () => {
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
  }, [user]);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('personal_events')
      .select(`
        *,
        profiles!personal_events_senior_id_fkey(first_name, last_name)
      `)
      .eq('caregiver_id', user.id)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (selectedSeniorId) {
      query = query.eq('senior_id', selectedSeniorId);
    }

    if (filterDate) {
      const tzoffset = filterDate.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(filterDate.getTime() - tzoffset)).toISOString().slice(0, -1);
      const dateString = localISOTime.split('T')[0];
      query = query.eq('event_date', dateString);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching personal events:', error);
    } else {
      let filteredData = data as unknown as FetchedEvent[];
      if (searchQuery.trim() !== '') {
        const lowerQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter(event => 
          event.title.toLowerCase().includes(lowerQuery)
        );
      }
      setEvents(filteredData);
    }
    setLoading(false);
  }, [user, selectedSeniorId, filterDate, searchQuery]);

  useEffect(() => {
    fetchSeniors();
  }, [fetchSeniors]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchSeniors(), fetchEvents()]);
    setRefreshing(false);
  }, [fetchSeniors, fetchEvents]);

  const formatTimeStr = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  const renderItem = ({ item }: { item: FetchedEvent }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff') }]}
      onPress={() => router.push(`/events/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateBox}>
          <Text style={[styles.dateMonth, { color: colors.primary }]}>
            {new Date(item.event_date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
          </Text>
          <Text style={[styles.dateDay, { color: colors.text }]}>
            {new Date(item.event_date).getDate()}
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
        {item.recurrence && (
          <View style={styles.footerItem}>
            <Ionicons name="repeat" size={14} color={colors.text + '80'} />
            <Text style={[styles.footerText, { color: colors.text + '80' }]} numberOfLines={1}>
              {item.recurrence}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff') }]}>
          <Ionicons name="search" size={20} color={colors.text + '80'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search events..."
            placeholderTextColor={colors.text + '50'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text + '50'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.dateFilterContainer}>
          <TouchableOpacity 
            style={[styles.dateFilterBtn, filterDate && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color={filterDate ? colors.primary : colors.text + '80'} />
            <Text style={[styles.dateFilterText, { color: filterDate ? colors.primary : colors.text }]}>
              {filterDate ? filterDate.toLocaleDateString() : 'All Dates'}
            </Text>
          </TouchableOpacity>
          {filterDate && (
            <TouchableOpacity onPress={() => setFilterDate(null)} style={styles.clearDateBtn}>
              <Ionicons name="close" size={18} color={colors.text + '80'} />
            </TouchableOpacity>
          )}
        </View>

        {showDatePicker && (
          <DateTimePicker
            mode="date"
            value={filterDate || new Date()}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setFilterDate(date);
            }}
            display="default"
          />
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seniorFilters}>
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              !selectedSeniorId && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setSelectedSeniorId(null)}
          >
            <Text style={{ color: !selectedSeniorId ? '#fff' : colors.text, fontSize: 13 }}>All Seniors</Text>
          </TouchableOpacity>
          
          {seniors.map(senior => (
            <TouchableOpacity 
              key={senior.id}
              style={[
                styles.filterChip, 
                selectedSeniorId === senior.id && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setSelectedSeniorId(senior.id)}
            >
              <Text style={{ color: selectedSeniorId === senior.id ? '#fff' : colors.text, fontSize: 13 }}>
                {senior.first_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={[styles.center, { flex: 1 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={[styles.center, { flex: 1, marginTop: 40 }]}>
              <Ionicons name="calendar-outline" size={48} color={colors.text + '40'} />
              <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                No personal events found.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/events/add')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000020',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00000020',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dateFilterText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  clearDateBtn: {
    marginLeft: 8,
    padding: 4,
  },
  seniorFilters: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00000020',
    marginRight: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#00000008',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardMain: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000010',
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  footerText: {
    fontSize: 13,
    marginLeft: 4,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
});

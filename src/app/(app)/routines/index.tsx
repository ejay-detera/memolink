import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Routine } from '@/types/routine';

export default function RoutinesList() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoutines = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .order('start_time', { ascending: true });
      
    if (error) {
      console.error('Error fetching routines:', error);
    } else {
      setRoutines(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const renderRoutineItem = ({ item }: { item: Routine }) => (
    <View style={[styles.routineCard, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff') }]}>
      <View style={styles.routineHeader}>
        <Text style={[styles.routineTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.routineTime, { color: colors.primary }]}>
          {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
        </Text>
      </View>
      <Text style={[styles.routineCategory, { color: colors.text + '80' }]}>
        {item.category || 'General'} • {item.recurrence}
      </Text>
      {item.description ? (
        <Text style={[styles.routineDescription, { color: colors.text }]} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      
      {item.notifications_enabled && (
        <View style={styles.notificationBadge}>
          <Ionicons name="notifications" size={12} color={colors.primary} />
          <Text style={[styles.notificationText, { color: colors.primary }]}>Reminder On</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>All Routines</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/routines/add')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Routine</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : routines.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="sunny-outline" size={64} color={colors.text + '40'} />
          <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
            No routines found.{'\n'}Add one to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(item) => item.id}
          renderItem={renderRoutineItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchRoutines}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  routineCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  routineTime: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  routineCategory: {
    fontSize: 13,
    marginBottom: 8,
  },
  routineDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00000010', // slightly visible background
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notificationText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

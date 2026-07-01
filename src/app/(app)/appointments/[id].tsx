import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { MedicalAppointment } from '@/types/appointment';

type FetchedAppointment = MedicalAppointment & {
  profiles: {
    first_name: string;
    last_name: string;
  };
};

export default function ViewAppointment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [appointment, setAppointment] = useState<FetchedAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchAppointment = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('medical_appointments')
      .select(`
        *,
        profiles!medical_appointments_senior_id_fkey(first_name, last_name)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching appointment:', error);
      Alert.alert('Error', 'Failed to load appointment details.');
      router.back();
    } else {
      setAppointment(data as unknown as FetchedAppointment);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchAppointment();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment? This action cannot be undone.',
      [
        { text: 'Keep', style: 'cancel' },
        { 
          text: 'Cancel Appointment', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { error } = await supabase
              .from('medical_appointments')
              .delete()
              .eq('id', id);
            
            setDeleting(false);
            
            if (error) {
              console.error('Error deleting appointment:', error);
              Alert.alert('Error', 'Failed to cancel appointment.');
            } else {
              Alert.alert('Success', 'Appointment cancelled successfully.');
              router.back();
            }
          }
        }
      ]
    );
  };

  const formatTimeStr = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!appointment) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <Stack.Screen 
        options={{
          title: 'Appointment Details',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push(`/appointments/edit?id=${id}`)}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
          )
        }} 
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff') }]}>
          <Text style={[styles.title, { color: colors.text }]}>{appointment.title}</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="person" size={20} color={colors.primary} style={styles.icon} />
            <View>
              <Text style={[styles.label, { color: colors.text + '80' }]}>Senior</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {appointment.profiles.first_name} {appointment.profiles.last_name}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={20} color={colors.primary} style={styles.icon} />
            <View>
              <Text style={[styles.label, { color: colors.text + '80' }]}>Date</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {new Date(appointment.appointment_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time" size={20} color={colors.primary} style={styles.icon} />
            <View>
              <Text style={[styles.label, { color: colors.text + '80' }]}>Time</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {formatTimeStr(appointment.start_time)} - {formatTimeStr(appointment.end_time)}
              </Text>
            </View>
          </View>

          {appointment.doctor_name && (
            <View style={styles.detailRow}>
              <Ionicons name="medical" size={20} color={colors.primary} style={styles.icon} />
              <View>
                <Text style={[styles.label, { color: colors.text + '80' }]}>Doctor / Provider</Text>
                <Text style={[styles.value, { color: colors.text }]}>{appointment.doctor_name}</Text>
              </View>
            </View>
          )}

          {appointment.location && (
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color={colors.primary} style={styles.icon} />
              <View>
                <Text style={[styles.label, { color: colors.text + '80' }]}>Location</Text>
                <Text style={[styles.value, { color: colors.text }]}>{appointment.location}</Text>
              </View>
            </View>
          )}

          {appointment.notes && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text" size={20} color={colors.primary} style={styles.icon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.text + '80' }]}>Notes</Text>
                <Text style={[styles.value, { color: colors.text, marginTop: 4, lineHeight: 22 }]}>
                  {appointment.notes}
                </Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.deleteButton, deleting && { opacity: 0.7 }]}
          onPress={handleDelete}
          disabled={deleting}
        >
          <Ionicons name="trash-outline" size={20} color="#ff3b30" style={{ marginRight: 8 }} />
          <Text style={styles.deleteButtonText}>{deleting ? 'Cancelling...' : 'Cancel Appointment'}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingRight: 20,
  },
  icon: {
    marginRight: 16,
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff3b30',
    marginBottom: 40,
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
});

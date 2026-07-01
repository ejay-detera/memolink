import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, ScrollView, useColorScheme, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { Picker } from '@react-native-picker/picker';

import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { AppointmentInsert } from '@/types/appointment';

type ConnectedSenior = {
  id: string;
  first_name: string;
  last_name: string;
};

export default function AddAppointment() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user } = useAuth();

  const [seniors, setSeniors] = useState<ConnectedSenior[]>([]);
  
  // Form State
  const [selectedSeniorId, setSelectedSeniorId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [appointmentDate, setAppointmentDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date(new Date().setHours(9, 0, 0, 0)));
  const [endTime, setEndTime] = useState<Date>(new Date(new Date().setHours(10, 0, 0, 0)));
  const [location, setLocation] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [notes, setNotes] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Picker visibility for Android
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

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
        
      if (data && data.length > 0) {
        const mapped = data.map((d: any) => ({
          id: d.profiles.id,
          first_name: d.profiles.first_name,
          last_name: d.profiles.last_name
        }));
        setSeniors(mapped);
        setSelectedSeniorId(mapped[0].id); // Auto-select first
      }
    };
    fetchSeniors();
  }, [user]);

  const formatTimeStr = (d: Date) => {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:00`;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an appointment title');
      return;
    }
    if (!selectedSeniorId) {
      Alert.alert('Error', 'Please select a senior');
      return;
    }

    setLoading(true);
    
    const dateString = appointmentDate.toISOString().split('T')[0];

    const newAppointment: AppointmentInsert = {
      senior_id: selectedSeniorId,
      caregiver_id: user!.id,
      title: title.trim(),
      appointment_date: dateString,
      start_time: formatTimeStr(startTime),
      end_time: formatTimeStr(endTime),
      location: location.trim() || null,
      doctor_name: doctorName.trim() || null,
      notes: notes.trim() || null,
      reminders_enabled: remindersEnabled,
    };

    const { error } = await supabase
      .from('medical_appointments')
      .insert(newAppointment);

    setLoading(false);

    if (error) {
      console.error('Error saving appointment:', error);
      Alert.alert('Error', 'Failed to save appointment.');
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Select Senior *</Text>
          {seniors.length === 0 ? (
            <Text style={{ color: colors.text + '80', fontStyle: 'italic' }}>
              No seniors connected. Add a senior first.
            </Text>
          ) : (
            <View style={[styles.input, { padding: 0, overflow: 'hidden', backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff') }]}>
              <Picker
                selectedValue={selectedSeniorId}
                onValueChange={(itemValue) => setSelectedSeniorId(itemValue)}
                style={{ color: colors.text, margin: -8 }}
                dropdownIconColor={colors.text}
              >
                {seniors.map(senior => (
                  <Picker.Item 
                    key={senior.id} 
                    label={`${senior.first_name} ${senior.last_name}`} 
                    value={senior.id} 
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff'), color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Cardiologist Checkup"
            placeholderTextColor={colors.text + '50'}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Date *</Text>
          <TouchableOpacity 
            style={[styles.input, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff'), justifyContent: 'center' }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: colors.text }}>
              {appointmentDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              mode="date"
              value={appointmentDate}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setAppointmentDate(date);
              }}
              display="default"
            />
          )}
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Start Time *</Text>
            <TouchableOpacity 
              style={[styles.input, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff'), justifyContent: 'center' }]}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={{ color: colors.text }}>
                {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                mode="time"
                value={startTime}
                onChange={(event, date) => {
                  setShowStartPicker(false);
                  if (date) setStartTime(date);
                }}
                display="default"
              />
            )}
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>End Time *</Text>
            <TouchableOpacity 
              style={[styles.input, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff'), justifyContent: 'center' }]}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={{ color: colors.text }}>
                {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                mode="time"
                value={endTime}
                onChange={(event, date) => {
                  setShowEndPicker(false);
                  if (date) setEndTime(date);
                }}
                display="default"
              />
            )}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Doctor / Provider</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff'), color: colors.text }]}
            value={doctorName}
            onChangeText={setDoctorName}
            placeholder="e.g. Dr. Smith"
            placeholderTextColor={colors.text + '50'}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Location</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff'), color: colors.text }]}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. 123 Main St, Clinic Room 4"
            placeholderTextColor={colors.text + '50'}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Notes / Description</Text>
          <TextInput
            style={[
              styles.input, 
              styles.textArea, 
              { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff'), color: colors.text }
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="What to bring, special instructions..."
            placeholderTextColor={colors.text + '50'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.formGroup, styles.switchGroup]}>
          <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Enable Reminders</Text>
          <Switch
            value={remindersEnabled}
            onValueChange={setRemindersEnabled}
            trackColor={{ false: '#767577', true: colors.primary + '80' }}
            thumbColor={remindersEnabled ? colors.primary : '#f4f3f4'}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Appointment'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#00000010',
    minHeight: 48,
  },
  textArea: {
    height: 100,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00000010',
    marginRight: 10,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000020',
  },
  footer: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000020',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

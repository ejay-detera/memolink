import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Switch, 
  TouchableOpacity, 
  ScrollView, 
  useColorScheme,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@expo/ui/community/datetime-picker';

import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { RoutineInsert } from '@/types/routine';

export default function AddRoutine() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().setHours(8, 0, 0, 0)));
  const [endDate, setEndDate] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Exercise');
  const [customCategory, setCustomCategory] = useState('');
  const [recurrence, setRecurrence] = useState('Daily');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const formatTime = (d: Date) => {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:00`;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a routine title');
      return;
    }

    setLoading(true);
    
    const finalCategory = selectedCategory === 'Other' ? customCategory.trim() : selectedCategory;

    const newRoutine: RoutineInsert = {
      title: title.trim(),
      start_time: formatTime(startDate),
      end_time: formatTime(endDate),
      description: description.trim() || null,
      category: finalCategory || null,
      recurrence,
      notifications_enabled: notificationsEnabled,
    };

    const { error } = await supabase
      .from('routines')
      .insert(newRoutine);

    setLoading(false);

    if (error) {
      console.error('Error saving routine:', error);
      Alert.alert('Error', 'Failed to save routine. Check time format (HH:MM).');
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff'), color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Morning Walk"
            placeholderTextColor={colors.text + '50'}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Start Time *</Text>
            <TouchableOpacity 
              style={[styles.input, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff'), justifyContent: 'center' }]}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={{ color: colors.text }}>
                {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            
            {showStartPicker && (
              <DateTimePicker
                mode="time"
                value={startDate}
                onChange={(event, date) => {
                  setShowStartPicker(false);
                  if (date) setStartDate(date);
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
                {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            
            {showEndPicker && (
              <DateTimePicker
                mode="time"
                value={endDate}
                onChange={(event, date) => {
                  setShowEndPicker(false);
                  if (date) setEndDate(date);
                }}
                display="default"
              />
            )}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          <View style={styles.chipContainer}>
            {['Exercise', 'Meals', 'Hygiene', 'Medical', 'Other'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.chip,
                  { backgroundColor: selectedCategory === option ? colors.primary : (colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff')) }
                ]}
                onPress={() => setSelectedCategory(option)}
              >
                <Text style={{ color: selectedCategory === option ? '#fff' : colors.text }}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedCategory === 'Other' && (
            <TextInput
              style={[styles.input, { marginTop: 12, backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff'), color: colors.text }]}
              value={customCategory}
              onChangeText={setCustomCategory}
              placeholder="Enter custom category..."
              placeholderTextColor={colors.text + '50'}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Recurrence</Text>
          <View style={styles.chipContainer}>
            {['Daily', 'Weekly', 'Weekdays'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.chip,
                  { backgroundColor: recurrence === option ? colors.primary : (colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff')) }
                ]}
                onPress={() => setRecurrence(option)}
              >
                <Text style={{ color: recurrence === option ? '#fff' : colors.text }}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[
              styles.input, 
              styles.textArea, 
              { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff'), color: colors.text }
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Additional details..."
            placeholderTextColor={colors.text + '50'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.formGroup, styles.switchGroup]}>
          <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Enable Reminders</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#767577', true: colors.primary + '80' }}
            thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Routine'}</Text>
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
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48, // matching text input roughly
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
  },
  textArea: {
    height: 100,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00000010',
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

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  ScrollView, 
  Pressable, 
  Text, 
  View, 
  TextInput, 
  StyleSheet, 
  useColorScheme, 
  Alert, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, Rounded } from '@/constants/theme';
import { FormButton } from '@/components/ui/form-button';
import type { Medication } from '@/hooks/use-medications';

const DOSAGE_UNITS = ['mg', 'mcg', 'g', 'ml', 'tablet', 'capsule', 'other'];

type MedicationFormModalProps = {
  visible: boolean;
  onClose: () => void;
  medication: Medication | null; // if editing
  onSave: (
    id: string | null,
    name: string,
    dosage: string,
    instructions: string,
    times: string[],
    startDate: string | null,
    endDate: string | null,
    scheduleType: 'scheduled' | 'as_needed'
  ) => Promise<boolean>;
  onRedirectToAll: () => void;
};

export function MedicationFormModal({
  visible,
  onClose,
  medication,
  onSave,
  onRedirectToAll,
}: MedicationFormModalProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [name, setName] = useState('');
  const [dosageValue, setDosageValue] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mg');
  const [customUnit, setCustomUnit] = useState('');
  const [dosageDropdownOpen, setDosageDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleType, setScheduleType] = useState<'scheduled' | 'as_needed'>('scheduled');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [times, setTimes] = useState<string[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      if (medication) {
        setName(medication.name);
        setInstructions(medication.instructions || '');
        setScheduleType(medication.schedule_type);
        setTimes(medication.times);
        setStartDate(medication.start_date);
        setEndDate(medication.end_date);

        // Parse structured dosage
        const parts = medication.dosage.split(' ');
        const val = parts[0] || '';
        const unit = parts.slice(1).join(' ') || 'mg';
        setDosageValue(val);
        if (DOSAGE_UNITS.includes(unit)) {
          setDosageUnit(unit);
          setCustomUnit('');
        } else {
          setDosageUnit('other');
          setCustomUnit(unit);
        }
      } else {
        setName('');
        setDosageValue('');
        setDosageUnit('mg');
        setCustomUnit('');
        setInstructions('');
        setScheduleType('scheduled');
        setStartDate(null);
        setEndDate(null);
        setTimes(['08:00']);
      }
    }
  }, [visible, medication]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter the Medication Name. This field is required.');
      return;
    }
    if (!dosageValue.trim()) {
      Alert.alert('Missing Field', 'Please enter the Dosage Amount. This field is required.');
      return;
    }

    if (/[a-zA-Z]/.test(dosageValue)) {
      Alert.alert('Invalid Input', 'Dosage amount must contain numbers only (no alphabetical characters).');
      return;
    }

    const parsedDosage = parseFloat(dosageValue);
    if (isNaN(parsedDosage) || parsedDosage <= 0) {
      Alert.alert('Invalid Dosage', 'Dosage amount must be greater than 0.');
      return;
    }

    if (scheduleType === 'scheduled' && times.length === 0) {
      Alert.alert('Missing Field', 'Please add at least one Scheduled Time for this medication.');
      return;
    }

    const finalUnit = dosageUnit === 'other' ? customUnit.trim() : dosageUnit;
    if (dosageUnit === 'other' && !finalUnit) {
      Alert.alert('Missing Field', 'Please enter the custom unit label (e.g. sprays).');
      return;
    }

    const formattedDosage = `${dosageValue} ${finalUnit}`;

    setSaving(true);
    const success = await onSave(
      medication ? medication.id : null,
      name,
      formattedDosage,
      instructions,
      scheduleType === 'scheduled' ? times : [],
      startDate,
      endDate,
      scheduleType
    );
    setSaving(false);

    if (success) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;

      const isTodayActive = scheduleType === 'scheduled' && 
                            (!startDate || todayStr >= startDate) && 
                            (!endDate || todayStr <= endDate);

      if (scheduleType === 'as_needed' || !isTodayActive) {
        onRedirectToAll();
      }
      onClose();
    } else {
      Alert.alert('Save Failed', 'Could not save the medication settings. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.outline }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {medication ? 'Edit Medication' : 'Add Medication'}
          </Text>
          <Pressable onPress={onClose} style={styles.modalCloseBtn} disabled={saving}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1, padding: Spacing.four }} keyboardShouldPersistTaps="handled">
          {/* Medication Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Medication Name <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput 
              style={[styles.input, { borderColor: colors.outline, color: colors.text }]} 
              value={name} 
              onChangeText={setName} 
              placeholder="e.g. Lisinopril"
              placeholderTextColor={colors.outline}
              editable={!saving}
            />
          </View>

          {/* Schedule Type Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Schedule Type <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <View style={[styles.formSegmentContainer, { backgroundColor: colors.surfaceContainer }]}>
              <Pressable 
                onPress={() => setScheduleType('scheduled')} 
                style={[styles.segmentBtn, scheduleType === 'scheduled' && { backgroundColor: colors.background }]}
                disabled={saving}
              >
                <Text style={{ color: scheduleType === 'scheduled' ? colors.primary : colors.textSecondary, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
                  Scheduled
                </Text>
              </Pressable>
              <Pressable 
                onPress={() => {
                  setScheduleType('as_needed');
                  onRedirectToAll();
                }} 
                style={[styles.segmentBtn, scheduleType === 'as_needed' && { backgroundColor: colors.background }]}
                disabled={saving}
              >
                <Text style={{ color: scheduleType === 'as_needed' ? colors.primary : colors.textSecondary, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
                  As Needed
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Dosage Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Dosage <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
              <TextInput 
                style={[styles.input, { borderColor: colors.outline, color: colors.text, flex: 1, marginTop: 0 }]} 
                value={dosageValue} 
                onChangeText={setDosageValue} 
                keyboardType="numeric" 
                placeholder="e.g. 500" 
                placeholderTextColor={colors.outline}
                editable={!saving}
              />
              
              <Pressable 
                onPress={() => setDosageDropdownOpen(true)}
                style={[styles.dropdownTrigger, { borderColor: colors.outline, backgroundColor: colors.surfaceContainer }]}
                disabled={saving}
              >
                <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>{dosageUnit}</Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {dosageUnit === 'other' && (
              <TextInput 
                style={[styles.input, { borderColor: colors.outline, color: colors.text, marginTop: 8 }]} 
                value={customUnit} 
                onChangeText={setCustomUnit} 
                placeholder="Type custom unit (e.g. drops)" 
                placeholderTextColor={colors.outline}
                editable={!saving}
              />
            )}
          </View>

          {/* Date Pickers (Optional Start/End Dates) - Stacked vertically */}
          {scheduleType === 'scheduled' && (
            <View style={{ gap: Spacing.three, marginBottom: Spacing.four }}>
              <View>
                <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
                {Platform.OS === 'web' ? (
                  <input 
                    type="date"
                    value={startDate || ''}
                    disabled={saving}
                    onChange={(e: any) => setStartDate(e.target.value || null)}
                    style={styles.webDateInput}
                  />
                ) : (
                  <>
                    <Pressable 
                      style={[styles.dropdownTrigger, { borderColor: colors.outline, backgroundColor: colors.surfaceContainer }]}
                      onPress={() => setShowStartDatePicker(true)}
                      disabled={saving}
                    >
                      <Text style={{ color: colors.text, fontSize: 14 }}>{startDate || 'Select Start Date'}</Text>
                      <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    </Pressable>
                    {showStartDatePicker && (
                      <DateTimePicker
                        value={startDate ? new Date(startDate + 'T00:00:00') : new Date()}
                        mode="date"
                        display="calendar"
                        onValueChange={(event, d) => {
                          setShowStartDatePicker(false);
                          if (d) {
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const dayVal = String(d.getDate()).padStart(2, '0');
                            setStartDate(`${y}-${m}-${dayVal}`);
                          }
                        }}
                        onDismiss={() => setShowStartDatePicker(false)}
                      />
                    )}
                  </>
                )}
              </View>

              <View>
                <Text style={[styles.label, { color: colors.text }]}>End Date</Text>
                {Platform.OS === 'web' ? (
                  <input 
                    type="date"
                    value={endDate || ''}
                    disabled={saving}
                    onChange={(e: any) => setEndDate(e.target.value || null)}
                    style={styles.webDateInput}
                  />
                ) : (
                  <>
                    <Pressable 
                      style={[styles.dropdownTrigger, { borderColor: colors.outline, backgroundColor: colors.surfaceContainer }]}
                      onPress={() => setShowEndDatePicker(true)}
                      disabled={saving}
                    >
                      <Text style={{ color: colors.text, fontSize: 14 }}>{endDate || 'Select End Date'}</Text>
                      <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    </Pressable>
                    {showEndDatePicker && (
                      <DateTimePicker
                        value={endDate ? new Date(endDate + 'T00:00:00') : new Date()}
                        mode="date"
                        display="calendar"
                        onValueChange={(event, d) => {
                          setShowEndDatePicker(false);
                          if (d) {
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const dayVal = String(d.getDate()).padStart(2, '0');
                            setEndDate(`${y}-${m}-${dayVal}`);
                          }
                        }}
                        onDismiss={() => setShowEndDatePicker(false)}
                      />
                    )}
                  </>
                )}
              </View>
            </View>
          )}

          {/* Scheduled Times - Only show if scheduled */}
          {scheduleType === 'scheduled' && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Scheduled Times</Text>
              <View style={{ gap: Spacing.two, marginTop: 6 }}>
                {times.map((t, idx) => (
                  <View key={idx} style={styles.timeRow}>
                    <Text style={{ fontSize: 16, color: colors.text, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>{t}</Text>
                    <Pressable onPress={() => setTimes(times.filter((_, i) => i !== idx))} disabled={saving}>
                      <Ionicons name="remove-circle" size={22} color={colors.error} />
                    </Pressable>
                  </View>
                ))}
              </View>

              {Platform.OS === 'web' ? (
                <input
                  type="time"
                  disabled={saving}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    if (val) {
                      setTimes([...times, val].sort());
                    }
                  }}
                  style={{
                    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
                    fontSize: 16,
                    color: colors.text,
                    borderColor: colors.outline,
                    backgroundColor: colors.surfaceContainer,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderRadius: Rounded.md,
                    padding: 12,
                    marginTop: 10,
                    width: '100%',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                />
              ) : (
                <>
                  <Pressable 
                    onPress={() => setShowTimePicker(true)} 
                    style={[styles.timeBtn, { borderColor: colors.primary }]}
                    disabled={saving}
                  >
                    <Ionicons name="alarm-outline" size={20} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>Add Time Slot</Text>
                  </Pressable>

                  {showTimePicker && (
                    <DateTimePicker
                      value={new Date()}
                      mode="time"
                      display={Platform.OS === 'android' ? 'clock' : 'spinner'}
                      onValueChange={(event, date) => {
                        setShowTimePicker(false);
                        if (date) {
                          const hh = String(date.getHours()).padStart(2, '0');
                          const mm = String(date.getMinutes()).padStart(2, '0');
                          setTimes([...times, `${hh}:${mm}`].sort());
                        }
                      }}
                      onDismiss={() => setShowTimePicker(false)}
                    />
                  )}
                </>
              )}
            </View>
          )}

          {/* Instructions */}
          <View style={[styles.formGroup, { marginBottom: 40 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Instructions</Text>
            <TextInput 
              style={[styles.input, styles.textArea, { borderColor: colors.outline, color: colors.text }]} 
              value={instructions} 
              onChangeText={setInstructions} 
              placeholder="Type instructions here..." 
              placeholderTextColor={colors.outline}
              multiline={true}
              numberOfLines={5}
              editable={!saving}
            />
          </View>

          {/* Save Buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.two, marginBottom: 60 }}>
            <FormButton title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} disabled={saving} />
            <FormButton title="Save" onPress={handleSave} style={{ flex: 1 }} loading={saving} disabled={saving} />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Dosage Unit Dropdown List Modal */}
      <Modal visible={dosageDropdownOpen} transparent={true} animationType="fade" onRequestClose={() => setDosageDropdownOpen(false)}>
        <Pressable style={styles.modalOverlaySmall} onPress={() => setDosageDropdownOpen(false)}>
          <View style={[styles.modalContentSmall, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.modalTitleSmall, { color: colors.text }]}>Select Dosage Unit</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {DOSAGE_UNITS.map(unit => (
                <Pressable 
                  key={unit}
                  onPress={() => {
                    setDosageUnit(unit);
                    setDosageDropdownOpen(false);
                  }}
                  style={[styles.dropdownItem, dosageUnit === unit && { backgroundColor: colors.surfaceContainer }]}
                >
                  <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>{unit}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
  modalCloseBtn: {
    padding: 4,
  },
  formGroup: {
    marginBottom: Spacing.four,
  },
  label: {
    fontSize: 14,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: Rounded.md,
    padding: 12,
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    marginTop: 4,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 110,
  },
  formSegmentContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Rounded.md,
    marginTop: 4,
    width: '100%',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Rounded.sm,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: Rounded.sm,
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Rounded.md,
    padding: 12,
    marginTop: 10,
  },
  webDateInput: {
    borderWidth: 1,
    borderColor: '#737781',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    fontSize: 15,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    backgroundColor: '#efeded',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  modalOverlaySmall: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalContentSmall: {
    borderRadius: Rounded.lg,
    padding: Spacing.four,
  },
  modalTitleSmall: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 18,
    marginBottom: Spacing.three,
    textAlign: 'center',
  },
  dropdownItem: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});

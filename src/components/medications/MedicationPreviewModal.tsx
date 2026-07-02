import React from 'react';
import { Modal, ScrollView, Pressable, Text, View, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Rounded } from '@/constants/theme';
import { FormButton } from '@/components/ui/form-button';
import type { Medication } from '@/hooks/use-medications';

type MedicationPreviewModalProps = {
  visible: boolean;
  onClose: () => void;
  medication: Medication | null;
  logs: Record<string, { logged_at: string; status: string }[]>;
  onEdit: (med: Medication) => void;
  onDelete: (id: string) => void;
  onToggleAdherence: (medId: string, isTaken: boolean) => void;
};

const formatTimeStr = (timeStr: string) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${m} ${ampm}`;
};

const formatDateStr = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export function MedicationPreviewModal({
  visible,
  onClose,
  medication,
  logs,
  onEdit,
  onDelete,
  onToggleAdherence,
}: MedicationPreviewModalProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  if (!medication) return null;

  const isTaken = logs[medication.id]?.some(l => l.status === 'taken');

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.outline }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Medication Detail</Text>
          <Pressable onPress={onClose} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1, padding: Spacing.four }}>
          <View style={[styles.previewDetailCard, { backgroundColor: colors.surfaceContainer }]}>
            <Ionicons name="medkit" size={48} color={colors.primary} style={{ alignSelf: 'center', marginBottom: Spacing.two }} />
            <Text style={[styles.previewMedName, { color: colors.text }]}>{medication.name}</Text>
            <Text style={[styles.previewMedDosage, { color: colors.primary }]}>{medication.dosage}</Text>
            
            <View style={[styles.divider, { backgroundColor: colors.outline + '40' }]} />
            
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Schedule Pattern</Text>
            <Text style={[styles.previewValue, { color: colors.text }]}>
              {medication.schedule_type === 'as_needed' ? 'Take As Needed (PRN)' : 'Scheduled'}
            </Text>

            {medication.schedule_type === 'scheduled' && (
              <>
                <Text style={[styles.previewLabel, { color: colors.textSecondary, marginTop: Spacing.three }]}>Daily Scheduled Times</Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>{medication.times.map(formatTimeStr).join(', ')}</Text>
              </>
            )}

            {(medication.start_date || medication.end_date) && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.three }}>
                {medication.start_date && (
                  <View>
                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Start Date</Text>
                    <Text style={[styles.previewValue, { color: colors.text }]}>{formatDateStr(medication.start_date)}</Text>
                  </View>
                )}
                {medication.end_date && (
                  <View>
                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>End Date</Text>
                    <Text style={[styles.previewValue, { color: colors.text }]}>{formatDateStr(medication.end_date)}</Text>
                  </View>
                )}
              </View>
            )}

            {medication.instructions && (
              <>
                <Text style={[styles.previewLabel, { color: colors.textSecondary, marginTop: Spacing.three }]}>Instructions</Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>{medication.instructions}</Text>
              </>
            )}

            {/* Adherence Checkoff inside Preview */}
            <Text style={[styles.previewLabel, { color: colors.textSecondary, marginTop: Spacing.three }]}>Adherence Status</Text>
            <Pressable 
              onPress={() => onToggleAdherence(medication.id, !!isTaken)}
              style={[
                styles.takenBtn, 
                { 
                  backgroundColor: isTaken ? colors.secondary : colors.surfaceContainer,
                  alignSelf: 'flex-start',
                  marginTop: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 10
                }
              ]}
            >
              <Ionicons 
                name={isTaken ? "checkmark-circle" : "ellipse-outline"} 
                size={20} 
                color={isTaken ? '#fff' : colors.textSecondary} 
              />
              <Text style={{ color: isTaken ? '#fff' : colors.text, fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 14 }}>
                {isTaken ? 'Taken' : 'Mark Taken'}
              </Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: Spacing.five, marginBottom: 40 }}>
            <FormButton title="Edit" onPress={() => onEdit(medication)} style={{ flex: 1, backgroundColor: '#2e7d32' }} />
            <FormButton title="Delete" onPress={() => onDelete(medication.id)} style={{ flex: 1, backgroundColor: '#d32f2f' }} />
          </View>
        </ScrollView>
      </SafeAreaView>
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
  previewDetailCard: {
    borderRadius: Rounded.lg,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  previewMedName: {
    fontSize: 24,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    textAlign: 'center',
  },
  previewMedDosage: {
    fontSize: 18,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.three,
  },
  previewLabel: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  previewValue: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 16,
  },
  takenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Rounded.full,
  },
});

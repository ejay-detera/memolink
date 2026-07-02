import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { FAB } from '@/components/ui/FAB';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MaxContentWidth, Rounded, Shadows, Spacing } from '@/constants/theme';
import { useBottomSpace } from '@/hooks/use-bottom-space';
import { useMedications, type Medication } from '@/hooks/use-medications';

// Refactored sub-components
import { MedicationFormModal } from '@/components/medications/MedicationFormModal';
import { MedicationPreviewModal } from '@/components/medications/MedicationPreviewModal';

const formatTimeStr = (timeStr: string) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${m} ${ampm}`;
};

export default function SeniorMedicationsScreen() {
  const scheme = 'light';
  const colors = Colors[scheme];
  const bottomSpace = useBottomSpace();

  const { medications, logs, loading, saveMedication, deleteMedication, logAdherence } = useMedications(null);

  // Filter mode: 'today' | 'all'
  const [filterMode, setFilterMode] = useState<'today' | 'all'>('today');

  // Preview Modal States
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMed, setPreviewMed] = useState<Medication | null>(null);

  // Form States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  const handleOpenAdd = () => {
    setEditingMed(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (med: Medication) => {
    setEditingMed(med);
    setModalVisible(true);
    setPreviewVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Medication', 'Are you sure you want to permanently delete this medication?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMedication(id);
          setPreviewVisible(false);
        }
      }
    ]);
  };

  const handleToggleAdherence = (medId: string, isCurrentlyTaken: boolean) => {
    if (isCurrentlyTaken) {
      if (Platform.OS === 'web') {
        if (window.confirm('Are you sure you want to unmark this medication as taken?')) {
          logAdherence(medId, 'skipped');
        }
      } else {
        Alert.alert(
          'Unmark Taken',
          'Are you sure you want to unmark this medication as taken?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Unmark', style: 'destructive', onPress: () => logAdherence(medId, 'skipped') }
          ]
        );
      }
    } else {
      logAdherence(medId, 'taken');
    }
  };

  // Next dose calculations for banner
  const getNextDoseInfo = () => {
    if (medications.length === 0) return null;
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    let nextMed: Medication | null = null;
    let nextTimeStr = '';
    let minDiff = Infinity;

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    for (const med of medications) {
      // Filter out as-needed and inactive schedule ranges
      if (med.schedule_type === 'as_needed') continue;
      if (med.start_date && todayStr < med.start_date) continue;
      if (med.end_date && todayStr > med.end_date) continue;

      for (const t of med.times) {
        const [hh, mm] = t.split(':').map(Number);
        const targetMin = hh * 60 + mm;
        let diff = targetMin - currentMin;
        if (diff < 0) {
          diff += 24 * 60; // Next day
        }
        if (diff < minDiff) {
          minDiff = diff;
          nextMed = med;
          nextTimeStr = t;
        }
      }
    }

    if (nextMed) {
      return { med: nextMed, time: nextTimeStr, diff: minDiff };
    }
    return null;
  };

  const formatTimeDiff = (diff: number) => {
    if (diff < 60) {
      return `${diff} min`;
    }
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    if (mins === 0) {
      return `${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
    }
    return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ${mins} min`;
  };

  const nextDose = getNextDoseInfo();

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;
  const todayMeds = medications.filter(med => {
    if (med.schedule_type === 'as_needed') return false;
    if (med.start_date && todayStr < med.start_date) return false;
    if (med.end_date && todayStr > med.end_date) return false;
    return true;
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Section Header */}
        <View style={styles.header}>
          <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 28 }}>
            Medications
          </ThemedText>
        </View>

        {/* Segmented Filter */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceContainer }]}>
          <Pressable
            onPress={() => setFilterMode('today')}
            style={[styles.segmentBtn, filterMode === 'today' && { backgroundColor: colors.background }]}
          >
            <ThemedText style={[styles.segmentText, { color: filterMode === 'today' ? colors.primary : colors.textSecondary }]}>
              Today
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setFilterMode('all')}
            style={[styles.segmentBtn, filterMode === 'all' && { backgroundColor: colors.background }]}
          >
            <ThemedText style={[styles.segmentText, { color: filterMode === 'all' ? colors.primary : colors.textSecondary }]}>
              All Medications
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSpace + 100 }]} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : medications.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="medkit-outline" size={64} color={colors.outline} />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>No Medications</ThemedText>
            </View>
          ) : filterMode === 'today' ? (
            // TODAY SCHEDULE MODE
            <>
              {nextDose && (
                <View style={[styles.banner, { backgroundColor: colors.tertiary }]}>
                  <Ionicons name="notifications-outline" size={24} color={colors.background} />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ color: colors.background, fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 18 }}>
                      Next Dose in {formatTimeDiff(nextDose.diff)}
                    </ThemedText>
                    <ThemedText style={{ color: colors.background, fontSize: 16, fontFamily: 'AtkinsonHyperlegibleNext-Regular' }}>
                      {nextDose.med.name} ({nextDose.med.dosage}) at {formatTimeStr(nextDose.time)}
                    </ThemedText>
                  </View>
                </View>
              )}

              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Today's Routine</ThemedText>
              {todayMeds.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="medkit-outline" size={64} color={colors.outline} />
                  <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>No Medications</ThemedText>
                </View>
              ) : (
                <View style={{ gap: Spacing.three, marginTop: Spacing.two }}>
                  {todayMeds.map((med, index) => {
                    const isTaken = logs[med.id]?.some(l => l.status === 'taken');
                    return (
                      <Animated.View key={med.id} entering={FadeInDown.delay(index * 100).springify()}>
                        <Card style={[styles.card, { backgroundColor: colors.backgroundElement, ...Shadows.card, borderWidth: 0 }]}>
                          <Pressable onPress={() => { setPreviewMed(med); setPreviewVisible(true); }}>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: Spacing.two }}>
                                <ThemedText style={[styles.medName, { color: colors.text }]}>{med.name} ({med.dosage})</ThemedText>
                                {med.instructions && (
                                  <ThemedText style={{ color: colors.textSecondary, fontFamily: 'AtkinsonHyperlegibleNext-Regular', fontSize: 14 }}>
                                    {med.instructions}
                                  </ThemedText>
                                )}
                                <ThemedText style={[styles.medTimes, { color: colors.primary }]}>
                                  Times: {med.times.map(formatTimeStr).join(', ')}
                                </ThemedText>
                              </View>
                              <Pressable
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleToggleAdherence(med.id, isTaken);
                                }}
                                style={[styles.takenBtn, { backgroundColor: isTaken ? colors.secondary : colors.surfaceContainer }]}
                              >
                                <Ionicons
                                  name={isTaken ? "checkmark-circle" : "ellipse-outline"}
                                  size={18}
                                  color={isTaken ? '#fff' : colors.textSecondary}
                                />
                                <ThemedText style={{ color: isTaken ? '#fff' : colors.text, fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 13 }}>
                                  {isTaken ? 'Taken' : 'Mark Taken'}
                                </ThemedText>
                              </Pressable>
                            </View>
                          </Pressable>
                        </Card>
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            // ALL MEDICATIONS LIST MODE
            <>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Medication Inventory</ThemedText>
              <View style={{ gap: Spacing.three, marginTop: Spacing.two }}>
                {medications.map((med, index) => (
                  <Animated.View key={med.id} entering={FadeInDown.delay(index * 100).springify()}>
                    <Card style={[styles.card, { backgroundColor: colors.backgroundElement, ...Shadows.card, borderWidth: 0 }]}>
                      <Pressable onPress={() => { setPreviewMed(med); setPreviewVisible(true); }}>
                        <View style={styles.row}>
                          <View style={{ flex: 1, marginRight: Spacing.two }}>
                            <ThemedText style={[styles.medName, { color: colors.text }]}>{med.name} ({med.dosage})</ThemedText>
                            {med.instructions && (
                              <ThemedText style={{ color: colors.textSecondary, fontFamily: 'AtkinsonHyperlegibleNext-Regular', fontSize: 14 }}>
                                {med.instructions}
                              </ThemedText>
                            )}
                            <ThemedText style={[styles.medTimes, { color: colors.primary }]}>
                              {med.schedule_type === 'as_needed' ? 'As Needed' : `Times: ${med.times.map(formatTimeStr).join(', ')}`}
                            </ThemedText>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={colors.outline} />
                        </View>
                      </Pressable>
                    </Card>
                  </Animated.View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
        <FAB onPress={handleOpenAdd} iconName="add" disableRotation={true} />
      </SafeAreaView>

      <MedicationPreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        medication={previewMed}
        logs={logs}
        onEdit={(med) => {
          setPreviewVisible(false);
          handleOpenEdit(med);
        }}
        onDelete={handleDelete}
        onToggleAdherence={handleToggleAdherence}
      />

      <MedicationFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        medication={editingMed}
        onSave={saveMedication}
        onRedirectToAll={() => setFilterMode('all')}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    padding: 4,
    borderRadius: Rounded.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Rounded.sm,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    marginBottom: Spacing.two,
    marginTop: Spacing.four,
  },
  card: {
    padding: Spacing.four,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Rounded.lg,
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medName: {
    fontSize: 18,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    marginBottom: 4,
  },
  medTimes: {
    fontSize: 13,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  takenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Rounded.full,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    marginTop: Spacing.two,
  },
});

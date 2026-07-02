import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { FormButton } from '@/components/ui/form-button';
import { Colors, Rounded, Spacing } from '@/constants/theme';
import { useMedications, type Medication } from '@/hooks/use-medications';

// Refactored sub-components
import { MedicationFormModal } from '@/components/medications/MedicationFormModal';
import { MedicationPreviewModal } from '@/components/medications/MedicationPreviewModal';

export default function CaregiverMedicationsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [activeSeniorId, setActiveSeniorId] = useState<string | null>(null);
  const { medications, logs, connectedSeniors, loading, saveMedication, deleteMedication, logAdherence } = useMedications(activeSeniorId);

  // Dynamic Date and Time for header
  const [currentDateTime, setCurrentDateTime] = useState('');
  useEffect(() => {
    const updateDateTime = () => {
      const date = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      setCurrentDateTime(date.toLocaleString('en-US', options));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-select first senior
  useEffect(() => {
    if (connectedSeniors.length > 0 && !activeSeniorId) {
      setActiveSeniorId(connectedSeniors[0].id);
    }
  }, [connectedSeniors, activeSeniorId]);

  const activeSenior = connectedSeniors.find(s => s.id === activeSeniorId);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>

        {/* Header Block without Back Button */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>Medications</Text>
            <Text style={[styles.dateTimeText, { color: colors.textSecondary }]}>{currentDateTime}</Text>
          </View>
        </View>

        {/* Senior Switcher */}
        {connectedSeniors.length > 0 && (
          <View style={styles.switcher}>
            <Text style={[styles.switcherLabel, { color: colors.textSecondary }]}>Select Senior:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcherScroll}>
              {connectedSeniors.map(senior => (
                <Pressable
                  key={senior.id}
                  onPress={() => setActiveSeniorId(senior.id)}
                  style={[
                    styles.pill,
                    { backgroundColor: activeSeniorId === senior.id ? colors.primary : colors.surfaceContainer }
                  ]}
                >
                  <Text style={{
                    color: activeSeniorId === senior.id ? '#fff' : colors.text,
                    fontFamily: 'AtkinsonHyperlegibleNext-Bold'
                  }}>
                    {senior.first_name} {senior.last_name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Segmented Filter */}
        {activeSeniorId && (
          <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceContainer }]}>
            <Pressable
              onPress={() => setFilterMode('today')}
              style={[styles.segmentBtn, filterMode === 'today' && { backgroundColor: colors.background }]}
            >
              <Text style={[styles.segmentText, { color: filterMode === 'today' ? colors.primary : colors.textSecondary }]}>
                Today
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterMode('all')}
              style={[styles.segmentBtn, filterMode === 'all' && { backgroundColor: colors.background }]}
            >
              <Text style={[styles.segmentText, { color: filterMode === 'all' ? colors.primary : colors.textSecondary }]}>
                All Medications
              </Text>
            </Pressable>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {activeSenior && (
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.three }]}>
              {activeSenior.first_name}'s Medications
            </Text>
          )}

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : !activeSeniorId ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={64} color={colors.outline} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Connected Seniors</Text>
            </View>
          ) : medications.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="medkit-outline" size={64} color={colors.outline} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Medications</Text>
              <FormButton title="Add Medication" onPress={handleOpenAdd} style={{ marginTop: Spacing.four, width: 220 }} />
            </View>
          ) : filterMode === 'today' ? (
            // TODAY COMPLIANCE LIST
            <>
              {todayMeds.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="medkit-outline" size={64} color={colors.outline} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Medications</Text>
                </View>
              ) : (
                <View style={{ gap: Spacing.three, marginTop: Spacing.two }}>
                  {todayMeds.map((med, index) => {
                    const isTaken = logs[med.id]?.some(l => l.status === 'taken');
                    return (
                      <Animated.View key={med.id} entering={FadeInRight.delay(index * 100)}>
                        <Card style={styles.card}>
                          <Pressable onPress={() => { setPreviewMed(med); setPreviewVisible(true); }}>
                            <View style={styles.row}>
                              <View style={{ flex: 1, marginRight: Spacing.two }}>
                                <Text style={[styles.medName, { color: colors.text }]}>{med.name} ({med.dosage})</Text>
                                {med.instructions && (
                                  <Text style={{ color: colors.textSecondary, fontFamily: 'AtkinsonHyperlegibleNext-Regular', fontSize: 14 }}>
                                    {med.instructions}
                                  </Text>
                                )}
                                <Text style={[styles.medTimes, { color: colors.primary }]}>
                                  Times: {med.times.join(', ')}
                                </Text>
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
                                <Text style={{ color: isTaken ? '#fff' : colors.text, fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 13 }}>
                                  {isTaken ? 'Taken' : 'Mark Taken'}
                                </Text>
                              </Pressable>
                            </View>
                          </Pressable>
                        </Card>
                      </Animated.View>
                    );
                  })}
                </View>
              )}
              <FormButton title="Add Medication" onPress={handleOpenAdd} style={{ marginTop: Spacing.three }} />
            </>
          ) : (
            // ALL CATALOG LIST
            <View style={{ gap: Spacing.three, marginTop: Spacing.two }}>
              {medications.map((med, index) => (
                <Animated.View key={med.id} entering={FadeInRight.delay(index * 100)}>
                  <Card style={styles.card}>
                    <Pressable onPress={() => { setPreviewMed(med); setPreviewVisible(true); }}>
                      <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: Spacing.two }}>
                          <Text style={[styles.medName, { color: colors.text }]}>{med.name} ({med.dosage})</Text>
                          {med.instructions && (
                            <Text style={{ color: colors.textSecondary, fontFamily: 'AtkinsonHyperlegibleNext-Regular', fontSize: 14 }}>
                              {med.instructions}
                            </Text>
                          )}
                          <Text style={[styles.medTimes, { color: colors.primary }]}>
                            {med.schedule_type === 'as_needed' ? 'As Needed' : `Times: ${med.times.join(', ')}`}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.outline} />
                      </View>
                    </Pressable>
                  </Card>
                </Animated.View>
              ))}
              <FormButton title="Add Medication" onPress={handleOpenAdd} style={{ marginTop: Spacing.three }} />
            </View>
          )}
        </ScrollView>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  title: {
    fontSize: 32,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
  dateTimeText: {
    fontSize: 14,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    marginTop: 2,
  },
  switcher: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  switcherLabel: {
    fontSize: 12,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  switcherScroll: {
    gap: Spacing.two,
  },
  pill: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 8,
    borderRadius: Rounded.full,
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
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    marginBottom: Spacing.two,
  },
  card: {
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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

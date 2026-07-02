import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MaxContentWidth, Rounded, Shadows, Spacing } from '@/constants/theme';
import { useBottomSpace } from '@/hooks/use-bottom-space';
import { useCaregiverDashboard, type ConnectedSenior } from '@/hooks/use-caregiver-dashboard';

// ---------------------------------------------------------------------------
// Senior Selector
// ---------------------------------------------------------------------------

function SeniorSelector({
  seniors,
  selectedId,
  onSelect,
  colors,
}: {
  seniors: ConnectedSenior[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={styles.selectorContainer}>
      <FlatList
        data={seniors}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.selectorList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = item.id === selectedId;
          return (
            <Pressable
              onPress={() => onSelect(item.id)}
              style={[
                styles.seniorPill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surfaceContainer,
                  borderColor: isSelected ? colors.primary : 'transparent',
                  borderWidth: 2,
                },
              ]}
            >
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.background }]}>
                  <ThemedText style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>
                    {(item.first_name?.[0] || '') + (item.last_name?.[0] || '')}
                  </ThemedText>
                </View>
              )}
              <ThemedText
                style={{
                  color: isSelected ? '#ffffff' : colors.textSecondary,
                  fontWeight: isSelected ? 'bold' : 'normal',
                }}
              >
                {item.first_name}
              </ThemedText>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

export default function CaregiverDashboard() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const bottomSpace = useBottomSpace();
  
  const {
    connectedSeniors,
    selectedSeniorId,
    setSelectedSeniorId,
    selectedSenior,
    medProgress,
    nextAppointment,
    vaultStats,
    recentActivity,
    loading
  } = useCaregiverDashboard();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 32 }}>
            Dashboard
          </ThemedText>
        </View>

        {loading && !selectedSeniorId ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : connectedSeniors.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="people-outline" size={64} color={colors.outline} />
            <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.four, paddingHorizontal: Spacing.six }}>
              You don't have any connected seniors yet. Go to the Seniors tab to send an invitation.
            </ThemedText>
          </View>
        ) : (
          <>
            <SeniorSelector
              seniors={connectedSeniors}
              selectedId={selectedSeniorId}
              onSelect={setSelectedSeniorId}
              colors={colors}
            />

            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSpace + 100 }]}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <Animated.View entering={FadeInDown}>
                  {/* Row 1: Stats Bento */}
                  <View style={[styles.bentoContainer, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
                    {/* Medication Progress */}
                    <View style={[styles.bentoCard, { backgroundColor: colors.backgroundElement }, isLargeScreen && { flex: 1.4 }]}>
                      <View style={styles.cardWatermark}>
                        <Ionicons name="medkit" size={120} color="rgba(0,0,0,0.03)" />
                      </View>
                      <View style={{ zIndex: 1 }}>
                        <ThemedText style={[styles.labelLg, { color: colors.textSecondary }]}>Medications Taken Today</ThemedText>
                        <ThemedText style={[styles.displayLg, { color: colors.primary }]}>
                          {medProgress.taken}/{medProgress.total > 0 ? medProgress.total : '-'} <ThemedText style={[styles.displayLgSubtitle, { color: colors.text }]}>Doses</ThemedText>
                        </ThemedText>
                        <View style={styles.progressBarContainer}>
                          <View style={[styles.progressBarFill, { width: `${medProgress.total > 0 ? (medProgress.taken / medProgress.total) * 100 : 0}%`, backgroundColor: colors.secondary }]} />
                        </View>
                      </View>
                      <View style={styles.medsConfirmedRow}>
                        {medProgress.nextMed ? (
                          <>
                            <Ionicons name="time" size={20} color={colors.secondary} />
                            <ThemedText style={[styles.medsConfirmedText, { color: colors.secondary }]}>Next dose: {medProgress.nextMed.name} at {medProgress.nextTime}</ThemedText>
                          </>
                        ) : medProgress.total > 0 && medProgress.taken === medProgress.total ? (
                          <>
                            <Ionicons name="checkmark-circle" size={20} color={colors.secondary} />
                            <ThemedText style={[styles.medsConfirmedText, { color: colors.secondary }]}>All doses confirmed for today</ThemedText>
                          </>
                        ) : (
                          <>
                            <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
                            <ThemedText style={[styles.medsConfirmedText, { color: colors.textSecondary }]}>No upcoming doses</ThemedText>
                          </>
                        )}
                      </View>
                    </View>

                    {/* Next Appointment */}
                    <View style={[styles.bentoCard, { backgroundColor: colors.primary }, isLargeScreen && { flex: 1 }]}>
                      <ThemedText style={[styles.labelLg, { color: 'rgba(255,255,255,0.8)' }]}>Next Appointment</ThemedText>
                      
                      {nextAppointment ? (
                        <>
                          <ThemedText style={[styles.appointmentTitle, { color: '#ffffff' }]}>
                            {new Date(nextAppointment.appointment_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {nextAppointment.start_time.substring(0,5)}
                          </ThemedText>
                          <View style={[styles.appointmentDetailBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                            <Ionicons name="calendar" size={20} color="#ffffff" />
                            <View style={{ marginLeft: 8, flex: 1 }}>
                              <ThemedText style={[styles.badgeLabel, { color: '#ffffff' }]}>{nextAppointment.title}</ThemedText>
                              <ThemedText style={[styles.badgeSub, { color: '#ffffff' }]}>{nextAppointment.doctor_name || nextAppointment.location || 'No details provided'}</ThemedText>
                            </View>
                          </View>
                          <Pressable 
                            style={[styles.appointmentButton, { backgroundColor: colors.background }]}
                            onPress={() => {
                              if (nextAppointment.location) {
                                Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(nextAppointment.location)}`);
                              }
                            }}
                          >
                            <Ionicons name="map" size={20} color={colors.primary} />
                            <ThemedText style={[styles.appointmentButtonText, { color: colors.primary }]}>Get Directions</ThemedText>
                          </Pressable>
                        </>
                      ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: Spacing.four }}>
                          <Ionicons name="calendar-outline" size={48} color="rgba(255,255,255,0.5)" />
                          <ThemedText style={{ color: '#ffffff', opacity: 0.8, marginTop: Spacing.two }}>No upcoming appointments</ThemedText>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Row 2: Activity & Actions */}
                  <View style={[styles.bentoContainer, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
                    {/* Recent Activity Log */}
                    <View style={[styles.bentoCard, { backgroundColor: colors.backgroundElement }, isLargeScreen && { flex: 1.4 }]}>
                      <View style={styles.activityHeader}>
                        <ThemedText style={[styles.headlineMd, { color: colors.text }]}>Recent Activity Log</ThemedText>
                        <Pressable onPress={() => router.push('/journal')}>
                          <ThemedText style={[styles.viewAllText, { color: colors.primary }]}>View All</ThemedText>
                        </Pressable>
                      </View>

                      {recentActivity.length > 0 ? (
                        recentActivity.map((item, index) => (
                          <View key={item.id}>
                            <View style={styles.activityItem}>
                              <View style={[styles.activityIconCircle, { backgroundColor: item.type === 'journal' ? colors.primary + '20' : colors.secondary + '20' }]}>
                                <Ionicons name={item.type === 'journal' ? 'book-outline' : 'medkit-outline'} size={24} color={item.type === 'journal' ? colors.primary : colors.secondary} />
                              </View>
                              <View style={styles.activityContent}>
                                <View style={styles.activityTitleRow}>
                                  <ThemedText style={[styles.activityTitle, { color: colors.text }]}>{selectedSenior?.first_name} {item.title}</ThemedText>
                                  <ThemedText style={[styles.activityTime, { color: colors.textSecondary }]}>
                                    {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </ThemedText>
                                </View>
                                <ThemedText style={[styles.activityDesc, { color: colors.textSecondary }]}>"{item.description}"</ThemedText>
                              </View>
                            </View>
                            {index < recentActivity.length - 1 && <View style={[styles.divider, { backgroundColor: colors.outline }]} />}
                          </View>
                        ))
                      ) : (
                        <View style={{ alignItems: 'center', padding: Spacing.four }}>
                          <ThemedText style={{ color: colors.textSecondary }}>No recent activity to display.</ThemedText>
                        </View>
                      )}
                    </View>

                    {/* Quick Actions & Status */}
                    <View style={[styles.bentoContainer, { flexDirection: 'column', flex: isLargeScreen ? 1 : undefined }]}>
                      <View style={[styles.bentoCard, { backgroundColor: colors.surfaceContainer }]}>
                        <ThemedText style={[styles.headlineMd, { marginBottom: Spacing.three, color: colors.text }]}>Quick Actions</ThemedText>
                        <Pressable style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.outline }]} onPress={() => router.push('/routines')}>
                          <Ionicons name="calendar-outline" size={20} color={colors.text} />
                          <ThemedText style={[styles.actionButtonText, { color: colors.text }]}>Manage Schedule</ThemedText>
                        </Pressable>
                        <Pressable style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.outline }]} onPress={() => router.push('/medications')}>
                          <Ionicons name="medical-outline" size={20} color={colors.text} />
                          <ThemedText style={[styles.actionButtonText, { color: colors.text }]}>Update Meds</ThemedText>
                        </Pressable>
                        <Pressable style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.outline }]} onPress={() => router.push('/vault')}>
                          <Ionicons name="cloud-upload-outline" size={20} color={colors.text} />
                          <ThemedText style={[styles.actionButtonText, { color: colors.text }]}>Upload Photos</ThemedText>
                        </Pressable>
                      </View>

                      <View style={[styles.bentoCard, { borderWidth: 2, borderColor: colors.secondary + '40', backgroundColor: colors.backgroundElement }]}>
                        <View style={styles.connectionHeader}>
                          <Ionicons name="folder-open" size={20} color={colors.secondary} />
                          <ThemedText style={[styles.connectionTitle, { color: colors.secondary }]}>Vault Storage</ThemedText>
                        </View>
                        <ThemedText style={[styles.connectionStatus, { color: colors.text }]}>
                          {vaultStats.folders} Folders
                        </ThemedText>
                        <View style={styles.connectionFooter}>
                          <ThemedText style={[styles.connectionFooterText, { color: colors.textSecondary }]}>Total Files</ThemedText>
                          <ThemedText style={[styles.connectionFooterTime, { color: colors.textSecondary }]}>{vaultStats.files}</ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              )}
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorContainer: {
    marginBottom: Spacing.three,
  },
  selectorList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  seniorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.three,
    paddingLeft: 6,
    paddingVertical: 6,
    borderRadius: Rounded.full,
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  bentoContainer: {
    gap: Spacing.four,
    marginBottom: Spacing.four,
  },
  bentoCard: {
    borderRadius: Rounded.lg,
    padding: Spacing.four,
    ...(Platform.select<any>({
      ios: Shadows.card,
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    })),
    position: 'relative',
    overflow: 'hidden',
  },
  cardWatermark: {
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.8,
  },
  labelLg: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 16,
    marginBottom: 8,
  },
  displayLg: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 40,
  },
  displayLgSubtitle: {
    fontSize: 24,
    fontWeight: 'normal',
    opacity: 0.7,
  },
  progressBarContainer: {
    width: '100%',
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  medsConfirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  medsConfirmedText: {
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
  appointmentTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 28,
    marginBottom: 16,
  },
  appointmentDetailBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: Rounded.md,
  },
  badgeLabel: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  badgeSub: {
    fontSize: 14,
    opacity: 0.9,
  },
  appointmentButton: {
    marginTop: 24,
    height: 48,
    borderRadius: Rounded.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appointmentButtonText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headlineMd: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 22,
  },
  viewAllText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  activityItem: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  activityIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 18,
    flexShrink: 1,
    marginRight: 8,
  },
  activityTime: {
    fontSize: 14,
    opacity: 0.6,
  },
  activityDesc: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 4,
  },
  divider: {
    height: 1,
    opacity: 0.2,
  },
  actionButton: {
    height: 56,
    borderWidth: 2,
    borderRadius: Rounded.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  connectionTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  connectionStatus: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 24,
  },
  connectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  connectionFooterText: {
    fontSize: 16,
  },
  connectionFooterTime: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
});

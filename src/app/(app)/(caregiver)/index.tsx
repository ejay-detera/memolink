import React from 'react';
import { StyleSheet, View, ScrollView, Platform, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, MaxContentWidth, Shadows } from '@/constants/theme';

export default function CaregiverDashboard() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  
  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Row 1: Stats Bento */}
        <View style={[styles.bentoContainer, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
          {/* Medication Progress */}
          <View style={[styles.bentoCard, isLargeScreen && { flex: 1.4 }]}>
            <View style={styles.cardWatermark}>
              <Ionicons name="medkit" size={120} color="rgba(0,0,0,0.03)" />
            </View>
            <View style={{ zIndex: 1 }}>
              <ThemedText style={styles.labelLg}>Medications Taken Today</ThemedText>
              <ThemedText style={styles.displayLg}>
                2/3 <ThemedText style={styles.displayLgSubtitle}>Doses</ThemedText>
              </ThemedText>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: '66%' }]} />
              </View>
            </View>
            <View style={styles.medsConfirmedRow}>
              <Ionicons name="checkmark-circle" size={20} color="#316e52" />
              <ThemedText style={styles.medsConfirmedText}>Morning and Noon doses confirmed</ThemedText>
            </View>
          </View>

          {/* Next Appointment */}
          <View style={[styles.bentoCard, styles.appointmentCard, isLargeScreen && { flex: 1 }]}>
            <ThemedText style={[styles.labelLg, { color: 'rgba(255,255,255,0.8)' }]}>Next Appointment</ThemedText>
            <ThemedText style={styles.appointmentTitle}>Tomorrow 2 PM</ThemedText>
            
            <View style={styles.appointmentDetailBadge}>
              <Ionicons name="calendar" size={20} color="#ffffff" />
              <View style={{ marginLeft: 8 }}>
                <ThemedText style={styles.badgeLabel}>Routine Checkup</ThemedText>
                <ThemedText style={styles.badgeSub}>Dr. Aris Thorne - Cardiology</ThemedText>
              </View>
            </View>
            
            <Pressable style={styles.appointmentButton}>
              <Ionicons name="map" size={20} color={Colors.light.primary} />
              <ThemedText style={styles.appointmentButtonText}>Get Directions</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Row 2: Activity & Actions */}
        <View style={[styles.bentoContainer, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
          {/* Recent Activity Log */}
          <View style={[styles.bentoCard, isLargeScreen && { flex: 1.4 }]}>
            <View style={styles.activityHeader}>
              <ThemedText style={styles.headlineMd}>Recent Activity Log</ThemedText>
              <Pressable>
                <ThemedText style={styles.viewAllText}>View All</ThemedText>
              </Pressable>
            </View>

            {/* Item 1 */}
            <View style={styles.activityItem}>
              <View style={[styles.activityIconCircle, { backgroundColor: '#ffdbc8' }]}>
                <Ionicons name="book-outline" size={24} color="#753400" />
              </View>
              <View style={styles.activityContent}>
                <View style={styles.activityTitleRow}>
                  <ThemedText style={styles.activityTitle}>Arthur added a journal entry</ThemedText>
                  <ThemedText style={styles.activityTime}>15m ago</ThemedText>
                </View>
                <ThemedText style={styles.activityDesc}>"Feeling energetic today. Enjoyed the garden views..."</ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Item 2 */}
            <View style={styles.activityItem}>
              <View style={[styles.activityIconCircle, { backgroundColor: '#b1f0ce' }]}>
                <Ionicons name="checkmark-done" size={24} color="#002114" />
              </View>
              <View style={styles.activityContent}>
                <View style={styles.activityTitleRow}>
                  <ThemedText style={styles.activityTitle}>Arthur took his morning meds</ThemedText>
                  <ThemedText style={styles.activityTime}>8:02 AM</ThemedText>
                </View>
                <ThemedText style={styles.activityDesc}>Statin and Vitamin D doses confirmed via MemoLink Smart Box.</ThemedText>
              </View>
            </View>
          </View>

          {/* Quick Actions & Status (on large screens this is the 2nd column) */}
          <View style={[styles.bentoContainer, { flexDirection: 'column', flex: isLargeScreen ? 1 : undefined }]}>
            <View style={[styles.bentoCard, styles.actionsCard]}>
              <ThemedText style={[styles.headlineMd, { marginBottom: Spacing.three }]}>Quick Actions</ThemedText>
              <Pressable style={styles.actionButton}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.light.text} />
                <ThemedText style={styles.actionButtonText}>Add Appointment</ThemedText>
              </Pressable>
              <Pressable style={styles.actionButton}>
                <Ionicons name="medical-outline" size={20} color={Colors.light.text} />
                <ThemedText style={styles.actionButtonText}>Update Meds</ThemedText>
              </Pressable>
              <Pressable style={styles.actionButton}>
                <Ionicons name="cloud-upload-outline" size={20} color={Colors.light.text} />
                <ThemedText style={styles.actionButtonText}>Upload Photos</ThemedText>
              </Pressable>
            </View>

            <View style={[styles.bentoCard, styles.connectionCard]}>
              <View style={styles.connectionHeader}>
                <View style={styles.pulsingDot} />
                <ThemedText style={styles.connectionTitle}>Connection Status</ThemedText>
              </View>
              <ThemedText style={styles.connectionStatus}>Device Online</ThemedText>
              <View style={styles.connectionFooter}>
                <ThemedText style={styles.connectionFooterText}>Last sync</ThemedText>
                <ThemedText style={styles.connectionFooterTime}>5 mins ago</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Shared Memories Banner */}
        <View style={styles.bannerContainer}>
          <LinearGradient
            colors={['rgba(0,54,107,0.1)', 'rgba(0,54,107,0.8)']}
            style={styles.bannerGradient}
          >
            <ThemedText style={styles.bannerTitle}>Shared Memories</ThemedText>
            <ThemedText style={styles.bannerDesc}>
              Keep the connection strong. Share photos and voice notes directly to Arthur's MemoLink device.
            </ThemedText>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab}>
        <Ionicons name="add" size={32} color="#ffffff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbf9f8',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  bentoContainer: {
    gap: Spacing.four,
    marginBottom: Spacing.four,
  },
  bentoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
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
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  displayLg: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 40,
    color: '#00366b', // primary
  },
  displayLgSubtitle: {
    fontSize: 24,
    fontWeight: 'normal',
    color: Colors.light.text,
    opacity: 0.7,
  },
  progressBarContainer: {
    width: '100%',
    height: 16,
    backgroundColor: '#eae8e7',
    borderRadius: 8,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2c694e', // secondary
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
    color: '#316e52',
  },
  appointmentCard: {
    backgroundColor: '#1b4d89', // primary-container
  },
  appointmentTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 28,
    color: '#ffffff',
    marginBottom: 16,
  },
  appointmentDetailBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 12,
  },
  badgeLabel: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  badgeSub: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  appointmentButton: {
    marginTop: 24,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appointmentButtonText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
    color: '#00366b',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e2e2',
  },
  headlineMd: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 22,
  },
  viewAllText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
    color: Colors.light.primary,
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
    fontSize: 18,
    color: Colors.light.text,
  },
  activityTime: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    opacity: 0.6,
  },
  activityDesc: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e4e2e2',
  },
  actionsCard: {
    backgroundColor: '#f5f3f3', // surface-container-low
  },
  actionButton: {
    height: 56,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#c3c6d1', // outline-variant
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
    color: Colors.light.text,
  },
  connectionCard: {
    borderWidth: 2,
    borderColor: 'rgba(44,105,78,0.2)', // secondary/20
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2c694e', // secondary
  },
  connectionTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
    color: '#2c694e',
  },
  connectionStatus: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 24,
    color: Colors.light.text,
  },
  connectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  connectionFooterText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  connectionFooterTime: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  bannerContainer: {
    height: 200,
    borderRadius: 32,
    overflow: 'hidden',
    marginTop: Spacing.four,
    backgroundColor: '#a7c8ff', // placeholder bg
  },
  bannerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 32,
  },
  bannerTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 32,
    color: '#ffffff',
  },
  bannerDesc: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    maxWidth: '80%',
  },
  fab: {
    position: 'absolute',
    bottom: 112,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#00366b', // primary
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.select<any>({
      ios: Shadows.card,
      android: { elevation: 6 },
      web: { boxShadow: '0 8px 24px rgba(0,54,107,0.3)' },
    })),
    zIndex: 40,
    borderWidth: 2,
    borderColor: '#1b4d89',
  }
});

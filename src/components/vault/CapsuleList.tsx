import React from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { CapsuleWithItems } from '@/hooks/use-capsules';
import { Ionicons } from '@expo/vector-icons';
import { format, isPast, isToday, parseISO, startOfDay } from 'date-fns';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';

interface CapsuleListProps {
  capsules: CapsuleWithItems[];
  loading: boolean;
}

export function CapsuleList({ capsules, loading }: CapsuleListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { userRole } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textSecondary }}>Loading capsules...</Text>
      </View>
    );
  }

  if (capsules.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="gift-outline" size={64} color={colors.outline} />
        <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No Memory Capsules</Text>
        <Text style={[styles.emptyStateSub, { color: colors.outline }]}>Create a capsule to surprise your loved one on a special date.</Text>
      </View>
    );
  }

  // Separate into upcoming and past
  const today = startOfDay(new Date());
  
  const upcoming = capsules.filter(c => {
    const triggerDate = startOfDay(parseISO(c.trigger_date));
    return triggerDate >= today;
  });
  
  const past = capsules.filter(c => {
    const triggerDate = startOfDay(parseISO(c.trigger_date));
    return triggerDate < today;
  });

  const renderCapsule = (capsule: CapsuleWithItems) => {
    const isReady = isToday(parseISO(capsule.trigger_date)) || isPast(parseISO(capsule.trigger_date));
    
    // Allow navigation if ready, or if the user is a caregiver (they created it)
    const canView = isReady || userRole === 'caregiver';
    const Wrapper = canView ? TouchableOpacity : View;
    
    return (
      <Wrapper 
        key={capsule.id} 
        style={[styles.capsuleCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline }]}
        onPress={canView ? () => router.push(`/capsules/${capsule.id}` as any) : undefined}
      >
        <View style={styles.capsuleHeader}>
          <Text style={[styles.capsuleTitle, { color: colors.text }]}>{capsule.title}</Text>
          <View style={[styles.dateBadge, { backgroundColor: isReady ? colors.primary + '20' : colors.surfaceContainer }]}>
            <Ionicons name={isReady ? "calendar-clear" : "calendar-outline"} size={14} color={isReady ? colors.primary : colors.textSecondary} />
            <Text style={[styles.dateText, { color: isReady ? colors.primary : colors.textSecondary }]}>
              {format(parseISO(capsule.trigger_date), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>
        {capsule.message ? (
          <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
            "{capsule.message}"
          </Text>
        ) : null}
        <View style={styles.capsuleFooter}>
          <View style={styles.itemsCount}>
            <Ionicons name="images-outline" size={16} color={colors.outline} />
            <Text style={[styles.itemsText, { color: colors.outline }]}>
              {capsule.items.length} {capsule.items.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
          {capsule.is_viewed && (
            <View style={styles.viewedBadge}>
              <Ionicons name="checkmark-done" size={16} color={colors.secondary} />
              <Text style={[styles.viewedText, { color: colors.secondary }]}>Viewed</Text>
            </View>
          )}
        </View>
      </Wrapper>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {upcoming.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Upcoming Capsules</Text>
          {upcoming.map(renderCapsule)}
        </View>
      )}
      
      {past.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Past Capsules</Text>
          {past.map(renderCapsule)}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five * 2,
    gap: Spacing.two,
  },
  emptyStateText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  emptyStateSub: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.five,
  },
  sectionTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.three,
  },
  capsuleCard: {
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  capsuleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  capsuleTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 18,
    flex: 1,
    marginRight: Spacing.two,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  dateText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 12,
  },
  message: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: Spacing.three,
  },
  capsuleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  itemsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemsText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 14,
  },
  viewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewedText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 12,
  },
});

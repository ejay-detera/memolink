/**
 * Senior Journal List — tab screen showing all journal entries.
 *
 * Displays entries in reverse chronological order with summary previews,
 * mood indicators, and date filtering. Tap an entry to see the full text.
 * FAB button navigates to the create screen.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { HeaderActions } from '@/components/ui/header-actions';
import { Colors, Spacing, MaxContentWidth, Rounded, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useBottomSpace } from '@/hooks/use-bottom-space';
import { fetchEntries } from '@/lib/journal-service';
import type { JournalEntry, DateFilter } from '@/types/journal';
import { MOOD_OPTIONS } from '@/types/journal';

// ---------------------------------------------------------------------------
// Date filter pills
// ---------------------------------------------------------------------------

const FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

function FilterBar({
  active,
  onSelect,
  colors,
}: {
  active: DateFilter;
  onSelect: (f: DateFilter) => void;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={styles.filterRow}>
      {FILTERS.map((f) => {
        const isActive = f.key === active;
        return (
          <Pressable
            key={f.key}
            onPress={() => onSelect(f.key)}
            style={[
              styles.filterPill,
              {
                backgroundColor: isActive ? colors.primary : colors.surfaceContainer,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.filterLabel,
                { color: isActive ? '#ffffff' : colors.textSecondary },
              ]}
            >
              {f.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Entry card
// ---------------------------------------------------------------------------

function getMoodEmoji(moodKey: string | null): string | null {
  if (!moodKey) return null;
  return MOOD_OPTIONS.find((m) => m.key === moodKey)?.emoji ?? null;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = today.getTime() - entryDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (diffDays === 0) return `Today at ${timeStr}`;
  if (diffDays === 1) return `Yesterday at ${timeStr}`;
  if (diffDays < 7) {
    return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${timeStr}`;
  }
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function EntryCard({
  entry,
  index,
  colors,
}: {
  entry: JournalEntry;
  index: number;
  colors: (typeof Colors)['light'];
}) {
  const emoji = getMoodEmoji(entry.mood);
  const hasSummary = !!entry.summary_text;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <Pressable
        onPress={() => router.push(`/journal/${entry.id}`)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.backgroundElement,
            ...Shadows.card,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {/* Header row: date + mood */}
        <View style={styles.cardHeader}>
          <ThemedText style={[styles.cardDate, { color: colors.textSecondary }]}>
            {formatDate(entry.created_at)}
          </ThemedText>
          {emoji && <ThemedText style={styles.cardMood}>{emoji}</ThemedText>}
        </View>

        {/* Summary or placeholder */}
        <ThemedText
          style={[
            styles.cardSummary,
            !hasSummary && { color: colors.outline, fontStyle: 'italic' },
          ]}
          numberOfLines={3}
        >
          {hasSummary ? entry.summary_text : 'Summarizing…'}
        </ThemedText>

        {/* Input method indicator */}
        {entry.input_method === 'voice' && (
          <View style={styles.voiceBadge}>
            <SymbolView name="mic.fill" size={14} tintColor={colors.outline} />
            <ThemedText style={[styles.voiceLabel, { color: colors.outline }]}>
              Voice
            </ThemedText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function SeniorJournalScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user } = useAuth();
  const bottomSpace = useBottomSpace();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const loadEntries = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const { data } = await fetchEntries(user.id, dateFilter);
      setEntries(data);

      setLoading(false);
      setRefreshing(false);
    },
    [user, dateFilter],
  );

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const renderItem = useCallback(
    ({ item, index }: { item: JournalEntry; index: number }) => (
      <EntryCard entry={item} index={index} colors={colors} />
    ),
    [colors],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.titleRow}>
          <ThemedText
            style={{
              fontFamily: 'AtkinsonHyperlegibleNext-Bold',
              fontSize: 32,
            }}
          >
            My Journal
          </ThemedText>
        </Animated.View>

        {/* Filter bar */}
        <FilterBar active={dateFilter} onSelect={setDateFilter} colors={colors} />

        {/* Entry list */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.centered}>
            <SymbolView name="book.closed" size={64} tintColor={colors.outline} />
            <ThemedText
              style={{
                color: colors.textSecondary,
                fontSize: 18,
                textAlign: 'center',
                marginTop: Spacing.three,
                paddingHorizontal: Spacing.four,
              }}
            >
              No journal entries yet.{'\n'}Tap the button below to write your first entry!
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomSpace + 80 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadEntries(true)}
                tintColor={colors.primary}
              />
            }
          />
        )}

        {/* FAB */}
        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <Pressable
            onPress={() => router.push('/journal/create')}
            style={({ pressed }) => [
              styles.fab,
              {
                backgroundColor: colors.primary,
                bottom: bottomSpace,
                transform: [{ scale: pressed ? 0.92 : 1 }],
              },
            ]}
          >
            <SymbolView name="plus" size={28} tintColor="#ffffff" weight="bold" />
            <ThemedText style={styles.fabLabel}>Write Entry</ThemedText>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  headerRow: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  titleRow: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    marginBottom: Spacing.three,
  },

  // Filter bar
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  filterPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Rounded.full,
    minHeight: Spacing.touchTarget,
    justifyContent: 'center',
  },
  filterLabel: {
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },

  // Card
  card: {
    borderRadius: Rounded.lg,
    padding: Spacing.four,
    marginBottom: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  cardDate: {
    fontSize: 14,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
  },
  cardMood: {
    fontSize: 24,
  },
  cardSummary: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
  },
  voiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.two,
  },
  voiceLabel: {
    fontSize: 12,
  },

  // Empty / loading
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    height: 60,
    borderRadius: Rounded.full,
    ...Shadows.card,
  },
  fabLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
});

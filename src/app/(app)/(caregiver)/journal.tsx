/**
 * Caregiver Journal Screen
 *
 * Read-only view of linked seniors' journal entries.
 * Includes a senior selector at the top, and displays a chronological
 * list of summaries for the selected senior.
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, MaxContentWidth, Rounded, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useBottomSpace } from '@/hooks/use-bottom-space';
import { fetchEntriesForSenior } from '@/lib/journal-service';
import { supabase } from '@/lib/supabase';
import type { JournalEntry } from '@/types/journal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConnectedSenior = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

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
                  color: isSelected ? colors.primary : colors.textSecondary,
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

// ---------------------------------------------------------------------------
// Entry Card
// ---------------------------------------------------------------------------

function CaregiverEntryCard({
  entry,
  index,
  colors,
}: {
  entry: JournalEntry;
  index: number;
  colors: (typeof Colors)['light'];
}) {
  const date = new Date(entry.created_at);
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={() => router.push(`/journal/${entry.id}`)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.backgroundElement,
            ...Shadows.card,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <ThemedText style={[styles.cardDate, { color: colors.textSecondary }]}>
              {dateStr} at {timeStr}
            </ThemedText>
          </View>
          {entry.mood && (
            <View style={styles.moodBadge}>
              <ThemedText style={{ fontSize: 12, textTransform: 'capitalize' }}>
                {entry.mood}
              </ThemedText>
            </View>
          )}
        </View>

        <ThemedText
          style={[
            styles.cardSummary,
            !entry.summary_text && { color: colors.outline, fontStyle: 'italic' },
          ]}
          numberOfLines={4}
        >
          {entry.summary_text ? entry.summary_text : 'Summary pending or not available.'}
        </ThemedText>

        <View style={styles.cardFooter}>
          <ThemedText style={[styles.readMore, { color: colors.primary }]}>
            Read full entry →
          </ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function CaregiverJournalScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user } = useAuth();
  const bottomSpace = useBottomSpace();

  const [seniors, setSeniors] = useState<ConnectedSenior[]>([]);
  const [selectedSeniorId, setSelectedSeniorId] = useState<string | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  
  const [loadingSeniors, setLoadingSeniors] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Load connected seniors
  useEffect(() => {
    async function loadSeniors() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('caregiver_senior_connections')
        .select(`
          senior_id,
          profiles!caregiver_senior_connections_senior_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq('caregiver_id', user.id)
        .eq('status', 'accepted');

      if (!error && data) {
        const parsed = data.map((d: any) => d.profiles);
        setSeniors(parsed);
        if (parsed.length > 0) {
          setSelectedSeniorId(parsed[0].id);
        }
      }
      setLoadingSeniors(false);
    }
    
    loadSeniors();
  }, [user]);

  // 2. Load entries for selected senior
  const loadEntries = useCallback(async (isRefresh = false) => {
    if (!selectedSeniorId) return;
    
    if (isRefresh) setRefreshing(true);
    else setLoadingEntries(true);

    const { data } = await fetchEntriesForSenior(selectedSeniorId);
    setEntries(data);

    setLoadingEntries(false);
    setRefreshing(false);
  }, [selectedSeniorId]);

  useEffect(() => {
    if (selectedSeniorId) {
      loadEntries();
    }
  }, [selectedSeniorId, loadEntries]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 28 }}>
            Journals
          </ThemedText>
        </View>

        {/* State: Loading Seniors */}
        {loadingSeniors ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : seniors.length === 0 ? (
          // State: No Seniors
          <View style={styles.centered}>
            <Ionicons name="people-outline" size={64} color={colors.outline} />
            <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 16 }}>
              You don't have any connected seniors yet.
            </ThemedText>
          </View>
        ) : (
          // State: Loaded
          <>
            <SeniorSelector
              seniors={seniors}
              selectedId={selectedSeniorId}
              onSelect={setSelectedSeniorId}
              colors={colors}
            />

            {loadingEntries ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : entries.length === 0 ? (
              <View style={styles.centered}>
                <Ionicons name="book-outline" size={48} color={colors.outline} />
                <ThemedText style={{ color: colors.textSecondary, marginTop: 16 }}>
                  No journal entries found.
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={entries}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: bottomSpace }]}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <CaregiverEntryCard entry={item} index={index} colors={colors} />
                )}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => loadEntries(true)}
                    tintColor={colors.primary}
                  />
                }
              />
            )}
          </>
        )}

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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    marginBottom: Spacing.two,
  },

  // Selector
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

  // List
  listContent: {
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },

  // Card
  card: {
    padding: Spacing.four,
    borderRadius: Rounded.lg,
    marginBottom: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardDate: {
    fontSize: 14,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
  moodBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardSummary: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.three,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: Spacing.two,
    alignItems: 'flex-end',
  },
  readMore: {
    fontSize: 14,
    fontWeight: '600',
  },
});

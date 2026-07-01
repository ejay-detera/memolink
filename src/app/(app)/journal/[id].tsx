/**
 * Journal Entry Detail — view a single journal entry.
 *
 * Shows the full raw text, the Gemini summary (or a retry button if it failed),
 * mood, input method, and timestamp. Includes a delete button for the owner.
 * If accessed by a caregiver, it operates in read-only mode (delete disabled).
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Rounded, Shadows, MaxContentWidth } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { deleteEntry, retrySummarization } from '@/lib/journal-service';
import { supabase } from '@/lib/supabase';
import type { JournalEntry } from '@/types/journal';
import { MOOD_OPTIONS } from '@/types/journal';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMoodEmoji(moodKey: string | null): string | null {
  if (!moodKey) return null;
  return MOOD_OPTIONS.find((m) => m.key === moodKey)?.emoji ?? null;
}

function formatFullDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function JournalEntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user, userRole } = useAuth();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Caregivers get read-only mode
  const isReadOnly = userRole === 'caregiver';

  const loadEntry = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Detail] Failed to load entry:', error);
      Alert.alert('Error', 'Could not load the entry.');
      router.back();
      return;
    }

    setEntry(data as JournalEntry);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const handleRetrySummary = async () => {
    if (!entry) return;
    setRetrying(true);
    const { success } = await retrySummarization(entry.id, entry.raw_text);
    setRetrying(false);

    if (success) {
      loadEntry(); // reload to get the new summary
    } else {
      Alert.alert('Summarization Failed', 'Please try again later.');
    }
  };

  const handleDelete = () => {
    if (!entry) return;
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { error } = await deleteEntry(entry.id);
            if (error) {
              setDeleting(false);
              Alert.alert('Error', 'Failed to delete the entry.');
            } else {
              router.back();
            }
          },
        },
      ],
    );
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (loading || !entry) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: 'Entry' }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  const emoji = getMoodEmoji(entry.mood);

  return (
    <>
      <Stack.Screen
        options={{
          title: new Date(entry.created_at).toLocaleDateString(),
          headerRight: () =>
            !isReadOnly ? (
              <Pressable
                onPress={handleDelete}
                disabled={deleting}
                style={({ pressed }) => ({
                  opacity: pressed || deleting ? 0.5 : 1,
                  padding: 8,
                })}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <SymbolView name="trash" size={24} tintColor={colors.error} />
                )}
              </Pressable>
            ) : null,
        }}
      />

      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header / Meta */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
              <View>
                <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
                  {formatFullDate(entry.created_at)}
                </ThemedText>
                <View style={styles.metaRow}>
                  {emoji && <ThemedText style={styles.emoji}>{emoji}</ThemedText>}
                  {entry.input_method === 'voice' && (
                    <View style={styles.voiceBadge}>
                      <SymbolView name="mic.fill" size={14} tintColor={colors.outline} />
                      <ThemedText style={[styles.voiceLabel, { color: colors.outline }]}>
                        Voice
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>

            {/* Summary Card */}
            <Animated.View entering={FadeInDown.delay(200)}>
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: colors.surfaceContainer },
                ]}
              >
                <View style={styles.summaryHeader}>
                  <SymbolView name="sparkles" size={18} tintColor={colors.primary} />
                  <ThemedText style={[styles.summaryTitle, { color: colors.primary }]}>
                    AI Summary
                  </ThemedText>
                </View>
                
                {entry.summary_text ? (
                  <ThemedText style={styles.summaryText}>
                    {entry.summary_text}
                  </ThemedText>
                ) : (
                  <View style={styles.summaryError}>
                    <ThemedText style={{ color: colors.textSecondary, marginBottom: 8 }}>
                      Summary generation is pending or failed.
                    </ThemedText>
                    {!isReadOnly && (
                      <Pressable
                        onPress={handleRetrySummary}
                        disabled={retrying}
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                      >
                        {retrying ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <ThemedText style={{ color: '#ffffff', fontWeight: 'bold' }}>
                            Retry Summarization
                          </ThemedText>
                        )}
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Raw Text */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Full Entry
              </ThemedText>
              <ThemedText style={styles.rawText}>
                {entry.raw_text}
              </ThemedText>
            </Animated.View>

          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateText: {
    fontSize: 18,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    marginBottom: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  emoji: {
    fontSize: 24,
  },
  voiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voiceLabel: {
    fontSize: 14,
  },

  // Summary
  summaryCard: {
    padding: Spacing.four,
    borderRadius: Rounded.lg,
    ...Shadows.card,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.two,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
  summaryError: {
    marginTop: Spacing.one,
  },
  retryButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Rounded.md,
    alignSelf: 'flex-start',
  },

  // Raw text
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  rawText: {
    fontSize: 20,
    lineHeight: 32,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
  },
});

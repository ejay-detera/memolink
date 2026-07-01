/**
 * Create Journal Entry — senior-facing screen for writing/recording entries.
 *
 * Features:
 * - Large accessible text input
 * - Voice-to-text via expo-speech-recognition (dev build) with graceful fallback
 * - Mood picker (5 emoji options)
 * - Auto-save draft to AsyncStorage (debounced 3s)
 * - On save: insert entry → pop back → fire summarization in background
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, Rounded, Shadows, MaxContentWidth } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { createEntry } from '@/lib/journal-service';
import { MOOD_OPTIONS } from '@/types/journal';

// ---------------------------------------------------------------------------
// Speech recognition — graceful import
// ---------------------------------------------------------------------------

let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;

try {
  const sr = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = sr.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = sr.useSpeechRecognitionEvent;
} catch {
  // expo-speech-recognition not available (e.g., Expo Go)
}

const SPEECH_AVAILABLE = !!ExpoSpeechRecognitionModule;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DRAFT_KEY = 'journal_draft';
const DRAFT_MOOD_KEY = 'journal_draft_mood';
const DEBOUNCE_MS = 3000;

// ---------------------------------------------------------------------------
// Mood picker
// ---------------------------------------------------------------------------

function MoodPicker({
  selected,
  onSelect,
  colors,
}: {
  selected: string | null;
  onSelect: (key: string | null) => void;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={styles.moodRow}>
      {MOOD_OPTIONS.map((mood) => {
        const isActive = selected === mood.key;
        return (
          <Pressable
            key={mood.key}
            onPress={() => onSelect(isActive ? null : mood.key)}
            style={[
              styles.moodButton,
              {
                backgroundColor: isActive
                  ? colors.primary + '18'
                  : colors.surfaceContainer,
                borderColor: isActive ? colors.primary : 'transparent',
                borderWidth: 2,
              },
            ]}
          >
            <ThemedText style={styles.moodEmoji}>{mood.emoji}</ThemedText>
            <ThemedText
              style={[
                styles.moodLabel,
                { color: isActive ? colors.primary : colors.textSecondary },
              ]}
            >
              {mood.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function CreateJournalScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [usedVoice, setUsedVoice] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pulse animation for mic button
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (isListening) {
      pulseOpacity.value = withRepeat(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulseOpacity.value = 0;
    }
  }, [isListening]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // -----------------------------------------------------------------------
  // Speech recognition events (only if available)
  // -----------------------------------------------------------------------

  if (SPEECH_AVAILABLE && useSpeechRecognitionEvent) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSpeechRecognitionEvent('result', (event: any) => {
      // The transcript is nested: results[resultIndex][alternativeIndex].transcript
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setText((prev) => {
          const separator = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
          return prev + separator + transcript;
        });
        setUsedVoice(true);
      }
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSpeechRecognitionEvent('end', () => {
      setIsListening(false);
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSpeechRecognitionEvent('error', (event: any) => {
      console.warn('[Speech] Error:', event.error);
      setIsListening(false);
    });
  }

  // -----------------------------------------------------------------------
  // Draft auto-save / restore
  // -----------------------------------------------------------------------

  useEffect(() => {
    (async () => {
      const [savedDraft, savedMood] = await Promise.all([
        AsyncStorage.getItem(DRAFT_KEY),
        AsyncStorage.getItem(DRAFT_MOOD_KEY),
      ]);
      if (savedDraft) setText(savedDraft);
      if (savedMood) setMood(savedMood);
    })();
  }, []);

  useEffect(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current);

    draftTimer.current = setTimeout(async () => {
      if (text.trim()) {
        await AsyncStorage.setItem(DRAFT_KEY, text);
      } else {
        await AsyncStorage.removeItem(DRAFT_KEY);
      }
      if (mood) {
        await AsyncStorage.setItem(DRAFT_MOOD_KEY, mood);
      } else {
        await AsyncStorage.removeItem(DRAFT_MOOD_KEY);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [text, mood]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleVoiceToggle = useCallback(async () => {
    if (!SPEECH_AVAILABLE) {
      Alert.alert(
        'Voice Not Available',
        'Voice input requires a development build. It is not supported in Expo Go.',
      );
      return;
    }

    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    } else {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert('Permission Needed', 'Please grant microphone access to use voice input.');
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        continuous: false,
      });
      setIsListening(true);
    }
  }, [isListening]);

  const handleSave = useCallback(async () => {
    if (!text.trim()) {
      Alert.alert('Empty Entry', 'Please write or say something before saving.');
      return;
    }
    if (!user) return;

    Keyboard.dismiss();
    setSaving(true);

    const { error } = await createEntry({
      user_id: user.id,
      raw_text: text.trim(),
      mood,
      input_method: usedVoice ? 'voice' : 'text',
    });

    setSaving(false);

    if (error) {
      Alert.alert('Save Failed', error);
      return;
    }

    // Clear drafts
    await Promise.all([
      AsyncStorage.removeItem(DRAFT_KEY),
      AsyncStorage.removeItem(DRAFT_MOOD_KEY),
    ]);

    router.back();
  }, [text, mood, usedVoice, user]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <>
      <Stack.Screen options={{ title: 'New Entry', headerBackTitle: 'Journal' }} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Text input */}
            <Animated.View entering={FadeInDown.delay(100)}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceContainer,
                    borderColor: colors.outline + '30',
                  },
                ]}
                placeholder="What happened today? Write anything you'd like to remember…"
                placeholderTextColor={colors.outline}
                value={text}
                onChangeText={setText}
                multiline
                textAlignVertical="top"
                autoFocus
                scrollEnabled={false}
              />
            </Animated.View>

            {/* Voice input button */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.voiceSection}>
              <Pressable
                onPress={handleVoiceToggle}
                style={({ pressed }) => [
                  styles.voiceButton,
                  {
                    backgroundColor: isListening ? colors.error : colors.primary,
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.voicePulse,
                    {
                      backgroundColor: isListening ? colors.error : colors.primary,
                    },
                    pulseStyle,
                  ]}
                />
                <Ionicons
                  name={isListening ? 'stop' : 'mic'}
                  size={28}
                  color="#ffffff"
                />
              </Pressable>
              <ThemedText
                style={[styles.voiceHint, { color: colors.textSecondary }]}
              >
                {isListening ? 'Listening… tap to stop' : 'Tap to speak'}
              </ThemedText>
            </Animated.View>

            {/* Mood picker */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <ThemedText
                style={{
                  fontFamily: 'AtkinsonHyperlegibleNext-Bold',
                  fontSize: 18,
                  marginBottom: Spacing.two,
                }}
              >
                How are you feeling? (optional)
              </ThemedText>
              <MoodPicker selected={mood} onSelect={setMood} colors={colors} />
            </Animated.View>
          </ScrollView>

          {/* Save button */}
          <Animated.View entering={FadeInUp.delay(400)} style={styles.saveWrapper}>
            <Pressable
              onPress={handleSave}
              disabled={saving || !text.trim()}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor:
                    saving || !text.trim()
                      ? colors.outline + '40'
                      : colors.primary,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              {saving ? (
                <ThemedText style={styles.saveLabel}>Saving…</ThemedText>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                  <ThemedText style={styles.saveLabel}>Save Entry</ThemedText>
                </>
              )}
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      <Modal visible={saving} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Saving Entry…</ThemedText>
        </View>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.four,
  },

  // Text input
  textInput: {
    minHeight: 200,
    borderRadius: Rounded.lg,
    padding: Spacing.four,
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    borderWidth: 1,
  },

  // Voice
  voiceSection: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  voiceButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  voicePulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    transform: [{ scale: 1.4 }],
  },
  voiceHint: {
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
  },

  // Mood
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Rounded.md,
    minHeight: Spacing.touchTarget,
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodLabel: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
  },

  // Save
  saveWrapper: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 60,
    borderRadius: Rounded.lg,
    ...Shadows.card,
  },
  saveLabel: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
  fabLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    marginTop: Spacing.three,
  },
});

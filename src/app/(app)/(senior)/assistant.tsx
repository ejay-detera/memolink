/* eslint-disable react-hooks/immutability */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useColorScheme, View, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, Modal } from 'react-native';
import Animated, { Easing, FadeInLeft, FadeInRight, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useBottomSpace } from '@/hooks/use-bottom-space';
import { askAssistant } from '@/lib/assistant-service';
import { createThread, getThreads, getMessages, saveMessage, AssistantThread, AssistantMessage } from '@/lib/assistant-history-service';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ChatBubble({ text, isAi, isThinking }: { text: string, isAi: boolean, isThinking?: boolean }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Animated.View
      entering={isAi ? FadeInLeft.duration(300) : FadeInRight.duration(300)}
      style={[
        styles.chatBubble,
        isAi
          ? { backgroundColor: colors.backgroundElement, alignSelf: 'flex-start', borderBottomLeftRadius: 4 }
          : { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 }
      ]}>
      {isThinking ? (
        <View style={{ flexDirection: 'row', gap: 4, padding: 4 }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }}>Thinking...</ThemedText>
        </View>
      ) : (
        <ThemedText style={{ color: isAi ? colors.text : colors.background, fontSize: 18, fontFamily: 'AtkinsonHyperlegibleNext-Regular' }}>
          {text}
        </ThemedText>
      )}
    </Animated.View>
  );
}

export default function AssistantScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const bottomSpace = useBottomSpace();

  const { user, userRole } = useAuth();
  const firstName = user?.user_metadata?.first_name || 'there';

  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Array<{ id: string; text: string; isAi: boolean }>>([
    { id: '1', text: `Hello ${firstName}! I'm your memory assistant. You can type or ask me about your schedule, medications, journal, or memories.`, isAi: true }
  ]);

  // History state
  const [threads, setThreads] = useState<AssistantThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  // Load threads on mount
  useEffect(() => {
    if (user?.id) {
      loadThreads();
    }
  }, [user?.id]);

  const loadThreads = async () => {
    if (!user?.id) return;
    const loadedThreads = await getThreads(user.id);
    setThreads(loadedThreads);
  };

  const loadThreadMessages = async (threadId: string) => {
    setCurrentThreadId(threadId);
    setIsHistoryVisible(false);
    const msgs = await getMessages(threadId);
    if (msgs.length > 0) {
      setMessages(msgs.map(m => ({ id: m.id, text: m.content, isAi: m.role === 'assistant' })));
    } else {
      setMessages([{ id: '1', text: `Hello ${firstName}! How can I help you today?`, isAi: true }]);
    }
    scrollToEnd();
  };

  const startNewChat = () => {
    setCurrentThreadId(null);
    setMessages([{ id: '1', text: `Hello ${firstName}! I'm your memory assistant. You can type or ask me about your schedule, medications, journal, or memories.`, isAi: true }]);
    setIsHistoryVisible(false);
  };

  // Pulse animation values
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(withTiming(1.5, { duration: 1000, easing: Easing.out(Easing.ease) }), -1, false);
      pulseOpacity.value = withRepeat(withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) }), -1, false);
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 0;
    }
  }, [isListening]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const scrollToEnd = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleStartListening = async () => {
    alert("Voice input requires a native development build. Please run 'npx expo run:android' or 'npx expo run:ios' in your terminal, then uncomment the speech code in assistant.tsx.");
    return;
  };

  const handleSendMessage = async (query: string) => {
    if (!query.trim()) return;
    
    Keyboard.dismiss();
    setInputText('');

    // Add user bubble immediately
    setMessages(prev => [...prev, { id: Date.now().toString(), text: query, isAi: false }]);
    scrollToEnd();
    setIsThinking(true);

    // Save logic
    let threadId = currentThreadId;
    if (!threadId && user?.id) {
      // Auto-name thread based on first query
      const title = query.length > 30 ? query.substring(0, 30) + '...' : query;
      const newThread = await createThread(user.id, title);
      if (newThread) {
        threadId = newThread.id;
        setCurrentThreadId(threadId);
        loadThreads();
      }
    }

    if (threadId) {
      await saveMessage(threadId, 'user', query);
    }
    
    // Call Edge Function via Service
    const result = await askAssistant(query, user!.id, userRole || 'senior');
    
    const aiAnswer = result?.answer ?? "I'm sorry, I couldn't understand that. Could you try asking in a different way?";
    
    if (threadId) {
      await saveMessage(threadId, 'assistant', aiAnswer);
    }

    setIsThinking(false);
    setMessages(prev => [...prev, { 
      id: (Date.now() + 1).toString(), 
      text: aiAnswer, 
      isAi: true 
    }]);
    scrollToEnd();
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header Bar with History Button */}
      <View style={[styles.header, { borderBottomColor: colors.outline }]}>
        <ThemedText style={styles.headerTitle}>Assistant</ThemedText>
        <Pressable onPress={() => setIsHistoryVisible(true)} style={styles.historyBtn}>
          <Ionicons name="time-outline" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>

          {/* Chat History */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}
          >
            {messages.map(msg => (
              <ChatBubble key={msg.id} text={msg.text} isAi={msg.isAi} />
            ))}
            {isThinking && <ChatBubble text="" isAi={true} isThinking={true} />}
          </ScrollView>

          {/* Input Area */}
          <View style={[styles.inputArea, { borderTopColor: colors.outline, paddingBottom: bottomSpace + Spacing.two }]}>

            {!isListening && (
              <Animated.View entering={FadeInUp.delay(500)} style={styles.suggestionsRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
                  <Pressable
                    style={[styles.suggestionChip, { backgroundColor: colors.surfaceContainer }]}
                    onPress={() => handleSendMessage('Did I take my meds today?')}
                  >
                    <ThemedText style={{ color: colors.primary, fontSize: 14, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
                      Did I take my meds?
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.suggestionChip, { backgroundColor: colors.surfaceContainer }]}
                    onPress={() => handleSendMessage('What is my schedule today?')}
                  >
                    <ThemedText style={{ color: colors.primary, fontSize: 14, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
                      My schedule?
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.suggestionChip, { backgroundColor: colors.surfaceContainer }]}
                    onPress={() => handleSendMessage('What is my morning routine?')}
                  >
                    <ThemedText style={{ color: colors.primary, fontSize: 14, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
                      Morning routine?
                    </ThemedText>
                  </Pressable>
                </ScrollView>
              </Animated.View>
            )}

            <View style={styles.inputRow}>
              <View style={[styles.textInputContainer, { backgroundColor: colors.surfaceContainer }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder={isListening ? "Listening..." : "Type or speak..."}
                  placeholderTextColor={colors.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => handleSendMessage(inputText)}
                  returnKeyType="send"
                />
              </View>

              <View style={styles.voiceButtonWrapper}>
                <Animated.View style={[styles.pulseRing, { backgroundColor: colors.primary }, pulseStyle]} />
                <AnimatedPressable
                  style={[styles.voiceButton, { backgroundColor: isListening ? colors.error : colors.primary }, buttonStyle]}
                  onPressIn={() => buttonScale.value = withSpring(0.9)}
                  onPressOut={() => buttonScale.value = withSpring(1)}
                  onPress={handleStartListening}
                >
                  <Ionicons name={isListening ? "radio" : "mic"} color={colors.background} size={24} />
                </AnimatedPressable>
              </View>

              {inputText.length > 0 && !isListening && (
                <Pressable 
                  style={[styles.sendButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleSendMessage(inputText)}
                >
                  <Ionicons name="send" color={colors.background} size={20} />
                </Pressable>
              )}
            </View>

          </View>

        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* History Modal */}
      <Modal visible={isHistoryVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsHistoryVisible(false)}>
        <ThemedView style={{ flex: 1 }}>
          <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.outline }]}>
              <ThemedText style={styles.modalTitle}>Chat History</ThemedText>
              <Pressable onPress={() => setIsHistoryVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: Spacing.four, gap: Spacing.three }}>
              <Pressable 
                style={[styles.historyItem, { backgroundColor: colors.primary }]}
                onPress={startNewChat}
              >
                <Ionicons name="add" size={24} color={colors.background} />
                <ThemedText style={{ color: colors.background, fontSize: 18, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>New Conversation</ThemedText>
              </Pressable>

              {threads.map(thread => (
                <Pressable 
                  key={thread.id}
                  style={[styles.historyItem, { backgroundColor: colors.surfaceContainer }]}
                  onPress={() => loadThreadMessages(thread.id)}
                >
                  <Ionicons name="chatbubbles-outline" size={24} color={colors.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <ThemedText numberOfLines={1} style={{ color: colors.text, fontSize: 16, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
                      {thread.title}
                    </ThemedText>
                    <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }}>
                      {new Date(thread.created_at).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </Modal>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
  historyBtn: {
    padding: Spacing.two,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.three,
  },
  chatBubble: {
    padding: Spacing.three,
    borderRadius: Rounded.lg,
    maxWidth: '85%',
  },
  inputArea: {
    padding: Spacing.four,
    borderTopWidth: 1,
  },
  suggestionsRow: {
    marginBottom: Spacing.three,
  },
  suggestionChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Rounded.full,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  textInputContainer: {
    flex: 1,
    borderRadius: Rounded.full,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  textInput: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 16,
    padding: 0,
  },
  voiceButtonWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Rounded.lg,
  },
});

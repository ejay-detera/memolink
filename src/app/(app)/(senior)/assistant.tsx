/* eslint-disable react-hooks/immutability */
import { StyleSheet, View, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInUp, FadeInLeft, FadeInRight, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSpring } from 'react-native-reanimated';
import { useEffect, useState, useRef } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, MaxContentWidth, Rounded } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useMedications } from '@/hooks/use-medications';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ChatBubble({ text, isAi }: { text: string, isAi: boolean }) {
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
      <ThemedText style={{ color: isAi ? colors.text : colors.background, fontSize: 18, fontFamily: 'AtkinsonHyperlegibleNext-Regular' }}>
        {text}
      </ThemedText>
    </Animated.View>
  );
}

export default function AssistantScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  const { user } = useAuth();
  const firstName = user?.user_metadata?.first_name || 'there';

  const { medications, logs, loading } = useMedications(null);

  const [isListening, setIsListening] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<Array<{ id: string; text: string; isAi: boolean }>>([
    { id: '1', text: `Hello ${firstName}! What would you like help remembering today?`, isAi: true }
  ]);

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

  const getMedicationStatusText = () => {
    if (loading) return "Let me check your file records...";
    if (medications.length === 0) {
      return "You do not have any medications registered in your list right now. You or your caregiver can add them under the Medications tab!";
    }

    const takenMeds: string[] = [];
    const pendingMeds: string[] = [];

    medications.forEach(med => {
      const isTaken = logs[med.id]?.some(l => l.status === 'taken');
      if (isTaken) {
        takenMeds.push(`${med.name} (${med.dosage})`);
      } else {
        pendingMeds.push(`${med.name} (${med.dosage})`);
      }
    });

    let status = "";
    if (takenMeds.length > 0) {
      status += `So far today, you have taken: ${takenMeds.join(', ')}.\n\n`;
    }
    if (pendingMeds.length > 0) {
      status += `You still have these scheduled doses pending: ${pendingMeds.join(', ')}.`;
    } else {
      status += "Fantastic! You are all caught up on your medications for today!";
    }
    return status;
  };

  const getNextMedicationText = () => {
    if (loading) return "Checking your schedules...";
    if (medications.length === 0) {
      return "You have no active medications scheduled.";
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let nextMed = null;
    let minDiff = Infinity;
    let nextTimeStr = '';

    medications.forEach(med => {
      const takenToday = logs[med.id]?.some(l => l.status === 'taken');
      if (takenToday) return;

      med.times.forEach(timeStr => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const medMinutes = hours * 60 + minutes;
        const diff = medMinutes - currentMinutes;

        if (diff > 0 && diff < minDiff) {
          minDiff = diff;
          nextMed = med;
          nextTimeStr = timeStr;
        }
      });
    });

    if (nextMed) {
      return `Your next medication is ${(nextMed as any).name} (${(nextMed as any).dosage}) due at ${nextTimeStr} (in ${Math.round(minDiff)} minutes).`;
    }

    return "You have taken all your scheduled medications, or there are no more upcoming doses scheduled for today.";
  };

  const handleSuggestionClick = (query: string) => {
    const userMsg = { id: Date.now().toString(), text: query, isAi: false };
    setMessages(prev => [...prev, userMsg]);
    scrollToEnd();

    // AI thinking state simulation
    setTimeout(() => {
      let aiText = "I'm sorry, I'm still learning how to help with that. Try asking about your medications!";
      
      if (query === 'Did I take my meds?' || query === 'What medicine should I take now?') {
        aiText = getMedicationStatusText();
      } else if (query === 'When is my next medication?') {
        aiText = getNextMedicationText();
      }

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: aiText, isAi: true }]);
      scrollToEnd();
    }, 800);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
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
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputArea, { borderTopColor: colors.outline }]}>
          
          <Animated.View entering={FadeInUp.delay(500)} style={styles.suggestionsRow}>
            <Pressable 
              style={[styles.suggestionChip, { backgroundColor: colors.surfaceContainer }]}
              onPress={() => handleSuggestionClick('Did I take my meds?')}
            >
              <ThemedText style={{ color: colors.primary, fontSize: 15, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
                Did I take my meds?
              </ThemedText>
            </Pressable>
            <Pressable 
              style={[styles.suggestionChip, { backgroundColor: colors.surfaceContainer }]}
              onPress={() => handleSuggestionClick('When is my next medication?')}
            >
              <ThemedText style={{ color: colors.primary, fontSize: 15, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
                Next Med time?
              </ThemedText>
            </Pressable>
          </Animated.View>

          <View style={styles.voiceControls}>
            <View style={styles.voiceButtonWrapper}>
              <Animated.View style={[styles.pulseRing, { backgroundColor: colors.primary }, pulseStyle]} />
              <AnimatedPressable 
                style={[styles.voiceButton, { backgroundColor: colors.primary }, buttonStyle]}
                onPressIn={() => buttonScale.value = withSpring(0.9)}
                onPressOut={() => buttonScale.value = withSpring(1)}
                onPress={() => {
                  if (!isListening) {
                    setIsListening(true);
                    setTimeout(() => {
                      setIsListening(false);
                      handleSuggestionClick('What medicine should I take now?');
                    }, 2000);
                  } else {
                    setIsListening(false);
                  }
                }}
              >
                <SymbolView name={isListening ? "waveform" : "mic.fill"} tintColor={colors.background} size={40} />
              </AnimatedPressable>
            </View>
            <ThemedText style={{ marginTop: Spacing.two, color: colors.textSecondary, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
              {isListening ? "Listening..." : "Tap to Speak"}
            </ThemedText>
          </View>

        </View>

      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
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
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
    justifyContent: 'center',
  },
  suggestionChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Rounded.full,
  },
  voiceControls: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  voiceButtonWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
});

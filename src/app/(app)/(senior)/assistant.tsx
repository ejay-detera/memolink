/* eslint-disable react-hooks/immutability */
import { StyleSheet, View, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInUp, FadeInLeft, FadeInRight, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSpring } from 'react-native-reanimated';
import { useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, MaxContentWidth, Rounded } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ChatBubble({ text, isAi, delay }: { text: string, isAi: boolean, delay: number }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  return (
    <Animated.View 
      entering={isAi ? FadeInLeft.delay(delay) : FadeInRight.delay(delay)}
      style={[
        styles.chatBubble, 
        isAi ? { backgroundColor: colors.backgroundElement, alignSelf: 'flex-start', borderBottomLeftRadius: 4 } : { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 }
      ]}>
      <ThemedText style={{ color: isAi ? colors.text : colors.background, fontSize: 18 }}>
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

  const [isListening, setIsListening] = useState(false);
  
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Chat History */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ChatBubble isAi={true} text={`Hello ${firstName}! What would you like help remembering today?`} delay={100} />
          <ChatBubble isAi={false} text="When is my next doctor's appointment?" delay={800} />
          <ChatBubble isAi={true} text="Your next appointment is with Dr. Smith today at 2:30 PM. Should I remind you 30 minutes before?" delay={1600} />
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputArea, { borderTopColor: colors.outline }]}>
          
          <Animated.View entering={FadeInUp.delay(2000)} style={styles.suggestionsRow}>
            <View style={[styles.suggestionChip, { backgroundColor: colors.backgroundElement }]}>
              <ThemedText style={{ color: colors.primary, fontSize: 16 }}>Did I take my meds?</ThemedText>
            </View>
            <View style={[styles.suggestionChip, { backgroundColor: colors.backgroundElement }]}>
              <ThemedText style={{ color: colors.primary, fontSize: 16 }}>Call my son</ThemedText>
            </View>
          </Animated.View>

          <View style={styles.voiceControls}>
            <View style={styles.voiceButtonWrapper}>
              <Animated.View style={[styles.pulseRing, { backgroundColor: colors.primary }, pulseStyle]} />
              <AnimatedPressable 
                style={[styles.voiceButton, { backgroundColor: colors.primary }, buttonStyle]}
                onPressIn={() => buttonScale.value = withSpring(0.9)}
                onPressOut={() => buttonScale.value = withSpring(1)}
                onPress={() => setIsListening(!isListening)}
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

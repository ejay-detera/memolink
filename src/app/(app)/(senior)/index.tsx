import { StyleSheet, View, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useState } from 'react';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import { HeaderActions } from '@/components/ui/header-actions';
import { useAuth } from '@/hooks/use-auth';

// Mood button component with animation
function MoodButton({ icon, label, selected, onPress }: { icon: any, label: string, selected: boolean, onPress: () => void }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  return (
    <Animated.View style={[{ alignItems: 'center', gap: Spacing.one }, selected && { transform: [{ scale: 1.1 }] }]}>
      <SymbolView 
        name={icon} 
        size={48} 
        tintColor={selected ? colors.primary : colors.outline} 
        weight={selected ? 'bold' : 'regular'}
      />
      <ThemedText style={{ color: selected ? colors.primary : colors.textSecondary, fontSize: 16 }} onPress={onPress}>
        {label}
      </ThemedText>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  const { user } = useAuth();
  const [mood, setMood] = useState<string | null>(null);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const firstName = user?.user_metadata?.first_name || 'there';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <HeaderActions />
          
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <ThemedText type="subtitle" style={{ color: colors.textSecondary }}>{today}</ThemedText>
            <ThemedText type="title" style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 32 }}>
              Good Morning, {firstName}
            </ThemedText>
          </Animated.View>

          {/* Mood Check-in */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.moodSection}>
            <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 20, marginBottom: Spacing.three }}>
              How are you feeling today?
            </ThemedText>
            <View style={styles.moodRow}>
              <MoodButton icon="face.smiling" label="Good" selected={mood === 'good'} onPress={() => setMood('good')} />
              <MoodButton icon="face.expressionless" label="Okay" selected={mood === 'okay'} onPress={() => setMood('okay')} />
              <MoodButton icon="face.expressionless" label="Not Great" selected={mood === 'bad'} onPress={() => setMood('bad')} />
            </View>
          </Animated.View>

          {/* Schedule */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <SectionHeader title="Today's Schedule" />
            
            <Card index={0}>
              <View style={styles.scheduleRow}>
                <View>
                  <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 18 }}>Morning Meds</ThemedText>
                  <ThemedText style={{ color: colors.textSecondary }}>9:00 AM</ThemedText>
                </View>
                <StatusChip status="done" label="Taken" />
              </View>
            </Card>

            <Card index={1}>
              <View style={styles.scheduleRow}>
                <View>
                  <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 18 }}>Doctor Appointment</ThemedText>
                  <ThemedText style={{ color: colors.textSecondary }}>Dr. Smith • 2:30 PM</ThemedText>
                </View>
                <StatusChip status="alert" label="Upcoming" />
              </View>
            </Card>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <SectionHeader title="Quick Actions" />
            
            <View style={styles.quickActions}>
              <PrimaryButton 
                title="Talk to AI Assistant" 
                icon={<SymbolView name="waveform.circle" tintColor={colors.background} />}
                onPress={() => router.push('/assistant')}
                style={{ marginBottom: Spacing.three }}
              />
              <PrimaryButton 
                title="View Memories" 
                icon={<SymbolView name="photo.stack" tintColor={colors.background} />}
                onPress={() => router.push('/vault')}
                style={{ marginBottom: Spacing.three, backgroundColor: colors.secondary, borderColor: colors.secondary }}
              />
              <PrimaryButton 
                title="Call Caregiver" 
                icon={<SymbolView name="phone.fill" tintColor={colors.background} />}
                onPress={() => router.push('/(app)/(caregiver)' as any)}
                style={{ marginBottom: Spacing.three, backgroundColor: colors.tertiary, borderColor: colors.tertiary }}
              />
            </View>
          </Animated.View>

        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: Spacing.five,
  },
  moodSection: {
    marginBottom: Spacing.four,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActions: {
    marginTop: Spacing.two,
  },
});

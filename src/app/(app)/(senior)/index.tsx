import { supabase } from '@/lib/supabase';
import { MedicalAppointment } from '@/types/appointment';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Colors, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useBottomSpace } from '@/hooks/use-bottom-space';

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
  const bottomSpace = useBottomSpace();
  const [mood, setMood] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<MedicalAppointment[]>([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('medical_appointments')
        .select('*')
        .eq('senior_id', user.id)
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5);

      if (data) setAppointments(data);
    };

    fetchAppointments();
  }, [user]);

  const formatTimeStr = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const firstName = user?.user_metadata?.first_name || 'there';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSpace }]} showsVerticalScrollIndicator={false}>

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
            <SectionHeader title="Upcoming Appointments" />

            {appointments.length === 0 ? (
              <ThemedText style={{ color: colors.textSecondary, fontStyle: 'italic', paddingVertical: Spacing.two }}>
                You have no upcoming appointments.
              </ThemedText>
            ) : (
              appointments.map((apt, index) => (
                <Card key={apt.id} index={index}>
                  <View style={styles.scheduleRow}>
                    <View style={{ flex: 1, paddingRight: Spacing.two }}>
                      <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 18 }} numberOfLines={1}>
                        {apt.title}
                      </ThemedText>
                      <ThemedText style={{ color: colors.textSecondary }} numberOfLines={1}>
                        {isToday(apt.appointment_date)
                          ? 'Today'
                          : new Date(apt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        } • {formatTimeStr(apt.start_time)}
                        {apt.doctor_name && ` • Dr. ${apt.doctor_name}`}
                      </ThemedText>
                    </View>
                    <StatusChip status="alert" label="Upcoming" />
                  </View>
                </Card>
              ))
            )}
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
                title="My Caregivers"
                icon={<SymbolView name="heart.text.square.fill" tintColor={colors.background} />}
                onPress={() => router.push('/caregivers')}
                style={{ marginBottom: Spacing.three, backgroundColor: colors.tertiary, borderColor: colors.tertiary }}
              />

              <Pressable
                onPress={() => signOut()}
                style={({ pressed }) => [
                  styles.logoutBtn,
                  {
                    borderColor: colors.error,
                    backgroundColor: pressed ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                  }
                ]}
              >
                <Ionicons name="log-out-outline" size={22} color={colors.error} />
                <ThemedText style={{ color: colors.error, fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 18 }}>
                  Log Out
                </ThemedText>
              </Pressable>
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
  logoutBtn: {
    minHeight: Spacing.touchTarget,
    borderRadius: Rounded.default,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
});

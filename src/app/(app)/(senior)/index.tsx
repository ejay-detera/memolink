import { supabase } from '@/lib/supabase';
import { MedicalAppointment } from '@/types/appointment';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, useColorScheme, View, ActivityIndicator } from 'react-native';
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
import { useCapsules } from '@/hooks/use-capsules';
import { isPast, isToday, parseISO } from 'date-fns';

const isIOS = Platform.OS === 'ios';

// Mood button component with animation
function MoodButton({ iconIOS, iconOther, label, selected, onPress }: { iconIOS: any, iconOther: any, label: string, selected: boolean, onPress: () => void }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Animated.View style={[{ alignItems: 'center', gap: Spacing.one }, selected && { transform: [{ scale: 1.1 }] }]}>
      <Pressable onPress={onPress} style={{ alignItems: 'center', gap: Spacing.one }}>
        {isIOS ? (
          <SymbolView
            name={iconIOS}
            size={48}
            tintColor={selected ? colors.primary : colors.outline}
            weight={selected ? 'bold' : 'regular'}
          />
        ) : (
          <Ionicons
            name={iconOther}
            size={48}
            color={selected ? colors.primary : colors.outline}
          />
        )}
        <ThemedText style={{ color: selected ? colors.primary : colors.textSecondary, fontSize: 16 }}>
          {label}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const { user } = useAuth();
  const bottomSpace = useBottomSpace();
  const [mood, setMood] = useState<string | null>(null);
  const [moodMessage, setMoodMessage] = useState<string | null>(null);
  const [isMoodLoading, setIsMoodLoading] = useState(false);
  const [appointments, setAppointments] = useState<MedicalAppointment[]>([]);

  const { capsules } = useCapsules(null);

  const handleMoodSelect = async (selectedMood: string) => {
    if (mood === selectedMood) return; // Ignore if already selected
    
    setMood(selectedMood);
    setMoodMessage(null);
    setIsMoodLoading(true);

    try {
      if (!user) return;
      
      const moodText = selectedMood === 'good' ? 'good' 
                     : selectedMood === 'okay' ? 'just okay' 
                     : 'not great';
                     
      const { data, error } = await supabase.functions.invoke('assistant-query', {
        body: { 
          question: `I am feeling ${moodText} today. Can you give me a very short, warm, and uplifting 1-2 sentence message?`, 
          userId: user.id, 
          userRole: 'senior' 
        }
      });
      
      if (error) throw error;
      if (data?.answer) {
        setMoodMessage(data.answer);
      }
    } catch (err) {
      console.error('Error fetching mood message:', err);
      setMoodMessage("I'm so glad you checked in today. No matter how you feel, I'm here for you!");
    } finally {
      setIsMoodLoading(false);
    }
  };

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

  // Find newly triggered capsules
  const availableCapsules = capsules.filter(c => {
    const d = parseISO(c.trigger_date);
    return (isToday(d) || isPast(d)) && !c.is_viewed;
  });

  const formatTimeStr = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  const isAppointmentToday = (dateStr: string) => {
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
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle" style={{ color: colors.textSecondary }}>{today}</ThemedText>
              <ThemedText type="title" style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 32 }}>
                Good Morning, {firstName}
              </ThemedText>
            </View>
            <Pressable onPress={() => router.push('./notifications' as any)} style={styles.notificationBell}>
              <Ionicons name="notifications-outline" size={28} color={colors.text} />
            </Pressable>
          </Animated.View>

          {/* Mood Check-in */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.moodSection}>
            <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 20, marginBottom: Spacing.three }}>
              How are you feeling today?
            </ThemedText>
            <View style={styles.moodRow}>
              <MoodButton iconIOS="face.smiling" iconOther="happy-outline" label="Good" selected={mood === 'good'} onPress={() => handleMoodSelect('good')} />
              <MoodButton iconIOS="face.expressionless" iconOther="remove-circle-outline" label="Okay" selected={mood === 'okay'} onPress={() => handleMoodSelect('okay')} />
              <MoodButton iconIOS="face.dashed" iconOther="sad-outline" label="Not Great" selected={mood === 'bad'} onPress={() => handleMoodSelect('bad')} />
            </View>

            {(isMoodLoading || moodMessage) && (
              <Animated.View entering={FadeInDown} style={[styles.moodMessageContainer, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline }]}>
                {isMoodLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ padding: Spacing.three }} />
                ) : (
                  <ThemedText style={{ fontSize: 16, color: colors.text, textAlign: 'center', lineHeight: 24 }}>
                    {moodMessage}
                  </ThemedText>
                )}
              </Animated.View>
            )}
          </Animated.View>

          {/* New Capsules Banner */}
          {availableCapsules.length > 0 && (
            <Animated.View entering={FadeInDown.delay(250)} style={{ marginBottom: Spacing.four }}>
              {availableCapsules.map((cap, index) => (
                <Pressable
                  key={cap.id}
                  onPress={() => router.push(`/capsules/${cap.id}` as any)}
                  style={({ pressed }) => [
                    styles.capsuleBanner,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                      transform: [{ scale: pressed ? 0.98 : 1 }]
                    }
                  ]}
                >
                  <View style={styles.capsuleBannerContent}>
                    <View style={styles.capsuleIconContainer}>
                      <SymbolView name="gift.fill" tintColor={colors.primary} size={28} />
                    </View>
                    <View style={{ flex: 1, paddingLeft: Spacing.three }}>
                      <ThemedText style={{ color: colors.background, fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 18 }}>
                        New Memory Capsule!
                      </ThemedText>
                      <ThemedText style={{ color: colors.background, opacity: 0.9 }}>
                        {cap.title}
                      </ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.background} />
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          )}

          {/* Schedule */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
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
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <SectionHeader title="Quick Actions" />

            <View style={styles.quickActions}>
              <PrimaryButton
                title="Talk to AI Assistant"
                icon={isIOS ? <SymbolView name="waveform.circle" tintColor={colors.background} /> : <Ionicons name="mic-circle" size={24} color={colors.background} />}
                onPress={() => router.push('/assistant')}
                style={{ marginBottom: Spacing.three }}
              />
              <PrimaryButton
                title="View Memories"
                icon={isIOS ? <SymbolView name="photo.stack" tintColor={colors.background} /> : <Ionicons name="images" size={24} color={colors.background} />}
                onPress={() => router.push('/vault')}
                style={{ marginBottom: Spacing.three, backgroundColor: colors.secondary, borderColor: colors.secondary }}
              />
              <PrimaryButton
                title="My Caregivers"
                icon={isIOS ? <SymbolView name="heart.text.square.fill" tintColor={colors.background} /> : <Ionicons name="heart" size={24} color={colors.background} />}
                onPress={() => router.push('/caregivers')}
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
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  notificationBell: {
    padding: Spacing.two,
    backgroundColor: '#00000005',
    borderRadius: Rounded.full,
  },
  moodSection: {
    marginBottom: Spacing.four,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  moodMessageContainer: {
    marginTop: Spacing.four,
    padding: Spacing.four,
    borderRadius: Rounded.lg,
    borderWidth: 1,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActions: {
    marginTop: Spacing.two,
  },
  capsuleBanner: {
    flexDirection: 'row',
    borderRadius: Rounded.lg,
    padding: Spacing.three,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  capsuleBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  capsuleIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: Spacing.two,
    borderRadius: Rounded.md,
  },
});

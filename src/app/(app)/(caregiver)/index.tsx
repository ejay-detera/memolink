import { StyleSheet, View, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, Spacing, MaxContentWidth, Rounded } from '@/constants/theme';
import { HeaderActions } from '@/components/ui/header-actions';
import { useAuth } from '@/hooks/use-auth';

function CaregiverCard({ name, relation, phone, index }: { name: string, relation: string, phone: string, index: number }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  return (
    <Card index={index}>
      <View style={styles.caregiverRow}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <SymbolView name="person.fill" tintColor={colors.background} size={24} />
        </View>
        <View style={styles.caregiverInfo}>
          <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 20 }}>{name}</ThemedText>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 16 }}>{relation} • {phone}</ThemedText>
        </View>
        <SymbolView name="phone.fill" tintColor={colors.primary} size={28} />
      </View>
    </Card>
  );
}

function ActivityLogItem({ time, title, description, icon, index }: { time: string, title: string, description: string, icon: any, index: number }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  return (
    <Animated.View entering={FadeInLeft.delay(300 + index * 100)} style={styles.activityRow}>
      <View style={[styles.activityIcon, { backgroundColor: colors.surfaceContainer }]}>
        <SymbolView name={icon} tintColor={colors.primary} size={20} />
      </View>
      <View style={styles.activityInfo}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 18 }}>{title}</ThemedText>
          <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }}>{time}</ThemedText>
        </View>
        <ThemedText style={{ color: colors.textSecondary, fontSize: 16 }}>{description}</ThemedText>
      </View>
    </Animated.View>
  );
}

export default function CaregiverScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  const { user } = useAuth();
  const firstName = user?.user_metadata?.first_name || 'Your care recipient';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <HeaderActions />
          
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <ThemedText type="title" style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 32 }}>
              Care Team
            </ThemedText>
          </Animated.View>

          {/* Primary Caregiver */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <CaregiverCard index={0} name="Michael (Son)" relation="Primary Contact" phone="555-0123" />
            
            <PrimaryButton 
              title="Share Access" 
              icon={<SymbolView name="square.and.arrow.up" tintColor={colors.primary} />}
              style={{ backgroundColor: colors.backgroundElement, borderColor: colors.outline, marginTop: Spacing.two }}
            />
          </Animated.View>

          {/* Recent Activity */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <SectionHeader title="Recent Activity" />
            
            <View style={styles.activityList}>
              <ActivityLogItem 
                index={0}
                time="2 hrs ago" 
                title="Medication Taken" 
                description={`${firstName} logged Metformin (500mg)`} 
                icon="pill.fill" 
              />
              <ActivityLogItem 
                index={1}
                time="Yesterday" 
                title="Mood Check-in" 
                description={`${firstName} reported feeling 'Good'`} 
                icon="face.smiling" 
              />
              <ActivityLogItem 
                index={2}
                time="Yesterday" 
                title="Memory Added" 
                description="Added 2 photos from 'Botanical Gardens'" 
                icon="photo.stack" 
              />
            </View>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: Spacing.four,
  },
  caregiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caregiverInfo: {
    flex: 1,
  },
  activityList: {
    gap: Spacing.four,
  },
  activityRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
    justifyContent: 'center',
  },
});

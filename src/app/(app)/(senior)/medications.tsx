import { StyleSheet, View, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInRight, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { FAB } from '@/components/ui/FAB';
import { useBottomSpace } from '@/hooks/use-bottom-space';
import { Colors, Spacing, MaxContentWidth, Rounded } from '@/constants/theme';

export default function MedicationsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const bottomSpace = useBottomSpace();
  
  const pulseOpacity = useSharedValue(0.7);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.7, { duration: 800 })
      ),
      -1,
      true
    );
  }, [pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSpace + 80 }]} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <ThemedText type="title" style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 32 }}>
              Medications
            </ThemedText>
          </Animated.View>

          {/* Banner */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <Animated.View style={[styles.banner, { backgroundColor: colors.tertiary }, pulseStyle]}>
              <SymbolView name="bell.badge.fill" tintColor={colors.background} size={24} />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ color: colors.background, fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 18 }}>Next Dose in 45 min</ThemedText>
                <ThemedText style={{ color: colors.background, fontSize: 16 }}>Lisinopril (10mg)</ThemedText>
              </View>
            </Animated.View>
          </Animated.View>

          <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 24, marginTop: Spacing.four, marginBottom: Spacing.three }}>
            Today
          </ThemedText>

          {/* List */}
          <Animated.View entering={FadeInRight.delay(300)}>
            <Card>
              <View style={styles.medRow}>
                <View style={styles.medInfo}>
                  <SymbolView name="pill.fill" tintColor={colors.primary} size={28} />
                  <View style={{ flex: 1, paddingRight: Spacing.two }}>
                    <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 18 }}>Metformin (500mg)</ThemedText>
                    <ThemedText style={{ color: colors.textSecondary }}>Take with breakfast</ThemedText>
                  </View>
                </View>
                <StatusChip status="done" label="Taken" />
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInRight.delay(400)}>
            <Card>
              <View style={styles.medRow}>
                <View style={styles.medInfo}>
                  <SymbolView name="pill.fill" tintColor={colors.primary} size={28} />
                  <View style={{ flex: 1, paddingRight: Spacing.two }}>
                    <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 18 }}>Lisinopril (10mg)</ThemedText>
                    <ThemedText style={{ color: colors.textSecondary }}>Take before lunch</ThemedText>
                  </View>
                </View>
                <StatusChip status="alert" label="Pending" />
              </View>
            </Card>
          </Animated.View>
          
          <Animated.View entering={FadeInRight.delay(500)}>
            <Card>
              <View style={styles.medRow}>
                <View style={styles.medInfo}>
                  <SymbolView name="pill.fill" tintColor={colors.primary} size={28} />
                  <View style={{ flex: 1, paddingRight: Spacing.two }}>
                    <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 18 }}>Atorvastatin (20mg)</ThemedText>
                    <ThemedText style={{ color: colors.textSecondary }}>Take before bed</ThemedText>
                  </View>
                </View>
                <StatusChip status="pending" label="8:00 PM" />
              </View>
            </Card>
          </Animated.View>

        </ScrollView>

        <FAB style={{ bottom: bottomSpace + Spacing.four }} />

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
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: Spacing.four,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Rounded.lg,
    gap: Spacing.three,
  },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
});

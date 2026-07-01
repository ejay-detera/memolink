/* eslint-disable react-hooks/immutability */
import { StyleSheet, View, ScrollView, Pressable, useWindowDimensions, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInDown, FadeIn, useSharedValue, withSpring } from 'react-native-reanimated';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FAB } from '@/components/ui/FAB';
import { Colors, Spacing, MaxContentWidth, Rounded } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FilterChip({ icon, label, selected, onPress }: { icon: any, label: string, selected: boolean, onPress: () => void }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  const scale = useSharedValue(selected ? 1.05 : 1);
  
  return (
    <AnimatedPressable 
      onPress={() => {
        scale.value = withSpring(1.05);
        onPress();
      }}
      onPressOut={() => scale.value = withSpring(selected ? 1.05 : 1)}
      style={[
        styles.filterChip, 
        { backgroundColor: selected ? colors.primary : colors.backgroundElement, transform: [{ scale }] }
      ]}>
      <SymbolView name={icon} tintColor={selected ? colors.background : colors.text} size={20} />
      <ThemedText style={{ color: selected ? colors.background : colors.text, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

function PhotoCard({ date, location, title, index }: { date: string, location: string, title: string, index: number }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { width } = useWindowDimensions();
  
  // Create a 2-column grid layout with spacing
  const cardWidth = Math.min((width - Spacing.four * 2 - Spacing.three) / 2, (MaxContentWidth - Spacing.three) / 2);

  return (
    <Animated.View entering={FadeIn.delay(200 + index * 60)} style={[styles.photoCard, { width: cardWidth, backgroundColor: colors.backgroundElement }]}>
      <View style={[styles.imagePlaceholder, { backgroundColor: colors.surfaceContainer }]}>
        <SymbolView name="play.circle.fill" tintColor={colors.background} size={32} />
      </View>
      <View style={styles.photoInfo}>
        <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }}>{date}</ThemedText>
        <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 16 }} numberOfLines={1}>{title}</ThemedText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <SymbolView name="mappin" tintColor={colors.textSecondary} size={12} />
          <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }} numberOfLines={1}>{location}</ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

export default function VaultScreen() {
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();
  const firstName = user?.user_metadata?.first_name || 'My';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <ThemedText type="title" style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 32 }}>
              Memory Vault
            </ThemedText>
          </Animated.View>

          {/* Filters */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.filtersWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
              <FilterChip icon="photo.stack" label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
              <FilterChip icon="figure.2.and.child.holdinghands" label="Family" selected={filter === 'family'} onPress={() => setFilter('family')} />
              <FilterChip icon="mappin" label="Places" selected={filter === 'places'} onPress={() => setFilter('places')} />
            </ScrollView>
          </Animated.View>

          {/* Photo Grid */}
          <View style={styles.photoGrid}>
            <PhotoCard index={0} date="May 2023" title={`${firstName}'s Wedding`} location="Botanical Gardens" />
            <PhotoCard index={1} date="Dec 2022" title="Christmas Dinner" location="Home" />
            <PhotoCard index={2} date="Aug 2021" title="Beach Trip" location="Sandy Shores" />
            <PhotoCard index={3} date="Jan 2019" title="Skiing" location="Snowy Mountains" />
          </View>

        </ScrollView>

        <FAB />

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
    paddingBottom: Spacing.six + 80, // Extra padding for FAB
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: Spacing.four,
  },
  filtersWrapper: {
    marginHorizontal: -Spacing.four, // Bleed out of the padding
    marginBottom: Spacing.four,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Rounded.full,
    gap: Spacing.two,
    minHeight: 40,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  photoCard: {
    borderRadius: Rounded.lg,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  imagePlaceholder: {
    height: 120,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInfo: {
    padding: Spacing.three,
  },
});

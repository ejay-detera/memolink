import { StyleSheet, View, useColorScheme } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '../themed-text';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      {onSeeAll && (
        <View style={styles.seeAll}>
          <ThemedText style={{ color: colors.primary }}>See All</ThemedText>
          <SymbolView name="chevron.right" tintColor={colors.primary} size={16} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
    marginTop: Spacing.four,
  },
  title: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 24,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});

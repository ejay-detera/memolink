import { StyleSheet, View, useColorScheme } from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, { Keyframe, Easing } from 'react-native-reanimated';

import { Colors, Rounded, Spacing } from '@/constants/theme';
import { ThemedText } from '../themed-text';

type Status = 'pending' | 'done' | 'alert';

interface StatusChipProps {
  status: Status;
  label: string;
}

export function StatusChip({ status, label }: StatusChipProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  let bgColor: string = colors.surfaceContainer;
  let fgColor: string = colors.text;
  let iconName = 'clock.fill';

  if (status === 'done') {
    bgColor = colors.secondary;
    fgColor = colors.background;
    iconName = 'checkmark.circle.fill';
  } else if (status === 'alert') {
    bgColor = colors.error;
    fgColor = colors.background;
    iconName = 'bell.badge.fill';
  }

  const bounceKeyframe = new Keyframe({
    0: { transform: [{ scale: 1 }] },
    50: { transform: [{ scale: 1.1 }] },
    100: { transform: [{ scale: 1 }], easing: Easing.elastic(1) },
  });

  return (
    <Animated.View
      entering={bounceKeyframe.duration(400)}
      style={[
        styles.chip,
        { backgroundColor: bgColor }
      ]}>
      <SymbolView name={iconName as any} tintColor={fgColor} size={20} />
      <ThemedText style={[styles.text, { color: fgColor }]}>{label}</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderRadius: Rounded.full,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  text: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
});

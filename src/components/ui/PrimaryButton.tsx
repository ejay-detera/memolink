/* eslint-disable react-hooks/immutability */
import { Pressable, StyleSheet, ViewStyle, StyleProp, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Colors, Rounded, Spacing } from '@/constants/theme';
import { ThemedText } from '../themed-text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

export function PrimaryButton({ title, onPress, style, icon }: PrimaryButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.96);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: colors.primary,
          borderColor: colors.outline,
        },
        animatedStyle,
        style,
      ]}>
      {icon}
      <ThemedText style={[styles.text, { color: colors.background }]}>{title}</ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: Spacing.touchTarget,
    borderRadius: Rounded.default,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  text: {
    fontSize: 18,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
});

/**
 * FormButton — full-width CTA button with loading state and press animation.
 *
 * Variants:
 *   - primary (default): filled background, white text
 *   - outline: transparent background, primary border + text
 *
 * Matches Stitch design: border-bottom press effect, 56px touch target.
 */

import { ActivityIndicator, Pressable, Text, useColorScheme, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Colors, Spacing, Rounded, Typography } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FormButtonProps = {
  /** Button label text. */
  title: string;
  /** Press handler. */
  onPress: () => void;
  /** Whether the button shows a loading spinner. */
  loading?: boolean;
  /** Whether the button is disabled. */
  disabled?: boolean;
  /** Visual variant. */
  variant?: 'primary' | 'outline';
  /** Optional style overrides on the outer container. */
  style?: ViewStyle;
};

export function FormButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: FormButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const translateY = useSharedValue(0);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const isPrimary = variant === 'primary';

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => {
        translateY.value = withTiming(2, { duration: 80 });
      }}
      onPressOut={() => {
        translateY.value = withTiming(0, { duration: 80 });
      }}
      style={[
        {
          height: Spacing.touchTarget,
          borderRadius: Rounded.md,
          borderCurve: 'continuous',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: Spacing.two,
          backgroundColor: isPrimary ? colors.primary : 'transparent',
          borderWidth: isPrimary ? 0 : 2,
          borderColor: isPrimary ? undefined : colors.primary,
          borderBottomWidth: isPrimary ? 4 : 2,
          borderBottomColor: isPrimary
            ? (scheme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)')
            : colors.primary,
          opacity: isDisabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? colors.background : colors.primary}
          size="small"
        />
      ) : (
        <Text
          style={{
            ...Typography.labelLg,
            color: isPrimary ? '#ffffff' : colors.primary,
            letterSpacing: 0.04 * 18,
          }}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}

import { StyleSheet, ViewProps, useColorScheme } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Rounded, Shadows, Spacing } from '@/constants/theme';

interface CardProps extends ViewProps {
  index?: number;
}

export function Card({ style, children, index = 0, ...rest }: CardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={[
        styles.card,
        { backgroundColor: colors.backgroundElement },
        Shadows.card,
        style,
      ]}
      {...rest}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Rounded.lg,
    padding: Spacing.four,
    marginBottom: Spacing.three,
  },
});

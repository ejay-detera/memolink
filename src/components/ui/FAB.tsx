/* eslint-disable react-hooks/immutability */
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

import { Colors, Shadows } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FABProps {
  onPress?: () => void;
  iconName?: string;
}

export function FAB({ onPress, iconName = 'plus' }: FABProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <AnimatedPressable
      onPress={() => {
        rotation.value = withSpring(rotation.value === 0 ? 45 : 0);
        onPress?.();
      }}
      style={[
        styles.fab,
        { backgroundColor: colors.primary },
        Shadows.card,
      ]}>
      <Animated.View style={animatedStyle}>
        <SymbolView name={iconName as any} tintColor={colors.background} size={32} weight="bold" />
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});

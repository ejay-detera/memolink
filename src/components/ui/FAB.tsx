/* eslint-disable react-hooks/immutability */
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Colors, Shadows } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FABProps {
  onPress?: () => void;
  iconName?: string;
  disableRotation?: boolean;
}

export function FAB({ onPress, iconName = 'plus', disableRotation = false }: FABProps) {
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
        if (!disableRotation) {
          rotation.value = withSpring(rotation.value === 0 ? 45 : 0);
        }
        onPress?.();
      }}
      style={[
        styles.fab,
        { backgroundColor: colors.primary },
        Shadows.card,
      ]}>
      <Animated.View style={animatedStyle}>
        {Platform.OS === 'ios' ? (
          <SymbolView name={iconName as any} tintColor={colors.background} size={32} weight="bold" />
        ) : (
          <Ionicons name={iconName === 'plus' ? 'add' : (iconName as any)} color={colors.background} size={32} />
        )}
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

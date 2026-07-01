import { useEffect } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

function AnimatedBlob({
  color,
  size,
  top,
  right,
  bottom,
  left,
  driftX,
  driftY,
  duration,
  opacity,
}: {
  color: string;
  size: number;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  driftX: number;
  driftY: number;
  duration: number;
  opacity: number;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(driftX, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    translateY.value = withRepeat(
      withTiming(driftY, { duration: duration * 1.1, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [driftX, driftY, duration, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top,
          right,
          bottom,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
        },
        animatedStyle,
      ]}
    />
  );
}

export function AuthBackground() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Blob A: top-right, primary, gently down-left */}
      <AnimatedBlob
        color={colors.primary}
        size={240}
        top={-60}
        right={-80}
        opacity={0.07}
        driftX={-30}
        driftY={20}
        duration={12000}
      />

      {/* Blob B: top-right cluster, secondary, down-right slightly faster */}
      <AnimatedBlob
        color={colors.secondary}
        size={160}
        top={80}
        right={-40}
        opacity={0.08}
        driftX={20}
        driftY={30}
        duration={8000}
      />

      {/* Blob C: bottom-left, primary, slowly up-right */}
      <AnimatedBlob
        color={colors.primary}
        size={300}
        bottom={-100}
        left={-80}
        opacity={0.05}
        driftX={40}
        driftY={-30}
        duration={14000}
      />

      {/* Blob D: bottom-right, secondary, quickly up-left */}
      <AnimatedBlob
        color={colors.secondary}
        size={120}
        bottom={100}
        right={20}
        opacity={0.07}
        driftX={-25}
        driftY={-40}
        duration={9000}
      />
    </View>
  );
}

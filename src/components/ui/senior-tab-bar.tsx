import React from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { Colors, Typography, Shadows } from '@/constants/theme';

const TABS = [
  { name: 'Home', path: '/(app)/(senior)', match: '/', icon: 'home' as const, outlineIcon: 'home-outline' as const },
  { name: 'Assistant', path: '/(app)/(senior)/assistant', match: '/assistant', icon: 'mic' as const, outlineIcon: 'mic-outline' as const },
  { name: 'Meds', path: '/(app)/(senior)/medications', match: '/medications', icon: 'medkit' as const, outlineIcon: 'medkit-outline' as const },
  { name: 'Vault', path: '/(app)/(senior)/vault', match: '/vault', icon: 'images' as const, outlineIcon: 'images-outline' as const },
  { name: 'Journal', path: '/(app)/(senior)/journal', match: '/journal', icon: 'book' as const, outlineIcon: 'book-outline' as const },
];

function TabButton({ tab, isActive, onPress, colors }: { tab: typeof TABS[0], isActive: boolean, onPress: () => void, colors: any }) {
  // Use colors that match the primary theme for seniors
  const activeContainer = colors.primary + '20'; // light blue/primary bg
  const onActiveContainer = colors.primary;

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withSpring(isActive ? activeContainer : 'transparent', { damping: 15, stiffness: 150 }),
      transform: [{ scale: withSpring(isActive ? 1.05 : 1, { damping: 15, stiffness: 150 }) }],
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isActive ? 1.15 : 1, { damping: 15, stiffness: 200 }) }],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tabButton,
        Platform.OS === 'web' && { outlineStyle: 'none' } as any
      ]}
    >
      <Animated.View style={[styles.tabIndicator, animatedIndicatorStyle]}>
        <Animated.View style={animatedIconStyle}>
          <Ionicons
            name={isActive ? tab.icon : tab.outlineIcon}
            size={24}
            color={isActive ? onActiveContainer : colors.outline}
          />
        </Animated.View>
        <Text
          style={{
            ...Typography.labelLg,
            fontSize: 10,
            marginTop: 2,
            color: isActive ? onActiveContainer : colors.outline,
            fontWeight: isActive ? 'bold' : 'normal',
          }}
          numberOfLines={1}
        >
          {tab.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function SeniorTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colors = Colors.light;

  return (
    <BlurView 
      intensity={80}
      tint="light"
      style={[styles.container, { bottom: (insets.bottom || 0) + 24 }]}
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.match;
        return (
          <TabButton
            key={tab.name}
            tab={tab}
            isActive={isActive}
            colors={colors}
            onPress={() => {
              if (!isActive) {
                router.push(tab.path as any);
              }
            }}
          />
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)',
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 8,
    overflow: 'hidden',
    ...(Platform.select<any>({
      ios: Shadows.card,
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.1)' },
    })),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 20,
    minHeight: 48,
    width: '100%',
  },
});

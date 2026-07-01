/**
 * RolePicker — two tappable cards for selecting Senior or Caregiver role.
 *
 * Visual treatment:
 *   - Senior: tertiary accent (#7e3900 / #ffaa76), person icon
 *   - Caregiver: secondary accent (#2c694e / #aeeecb), people icon
 *   - Selected state: filled background with checkmark, scale animation
 */

import { Pressable, Text, View, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Colors, Spacing, Rounded, Typography } from '@/constants/theme';
import type { AppRole } from '@/types/auth';

type RolePickerProps = {
  /** Currently selected role. */
  value: AppRole | null;
  /** Called when the user taps a role card. */
  onChange: (role: AppRole) => void;
};

const ROLES: { key: AppRole; label: string; description: string; icon: string }[] = [
  {
    key: 'senior',
    label: "I'm a Senior",
    description: 'Get help remembering your schedule, meds, and memories.',
    icon: 'sf:person.fill',
  },
  {
    key: 'caregiver',
    label: "I'm a Caregiver",
    description: 'Manage schedules, medications, and memories for your loved one.',
    icon: 'sf:person.2.fill',
  },
];

function RoleCard({
  role,
  selected,
  onPress,
}: {
  role: (typeof ROLES)[number];
  selected: boolean;
  onPress: () => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const isSenior = role.key === 'senior';
  const accent = isSenior ? colors.tertiary : colors.secondary;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={() => {
          scale.value = withSpring(1, { damping: 12 });
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 12 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12 });
        }}
        style={{
          borderWidth: 2,
          borderColor: selected ? accent : colors.outline,
          borderRadius: Rounded.lg,
          borderCurve: 'continuous',
          padding: Spacing.three,
          gap: Spacing.two,
          backgroundColor: selected
            ? (isSenior
                ? (scheme === 'dark' ? 'rgba(255,170,118,0.15)' : 'rgba(126,57,0,0.08)')
                : (scheme === 'dark' ? 'rgba(174,238,203,0.15)' : 'rgba(44,105,78,0.08)'))
            : colors.backgroundElement,
          minHeight: 160,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={role.label}
      >
        {/* Icon */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: Rounded.full,
            backgroundColor: selected ? accent : colors.surfaceContainer,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={role.icon}
            style={{ width: 28, height: 28 }}
            tintColor={selected ? (scheme === 'dark' ? '#000' : '#fff') : (colors.outline as string)}
          />
        </View>

        {/* Label */}
        <Text
          style={{
            ...Typography.labelLg,
            color: selected ? accent : colors.text,
            textAlign: 'center',
          }}
        >
          {role.label}
        </Text>

        {/* Description */}
        <Text
          style={{
            ...Typography.bodyMd,
            fontSize: 14,
            lineHeight: 20,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          {role.description}
        </Text>

        {/* Checkmark */}
        {selected && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Image
              source="sf:checkmark.circle.fill"
              style={{ width: 24, height: 24 }}
              tintColor={accent as string}
            />
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function RolePicker({ value, onChange }: RolePickerProps) {
  return (
    <View
      style={{ flexDirection: 'row', gap: Spacing.three }}
      accessibilityRole="radiogroup"
      accessibilityLabel="Choose your role"
    >
      {ROLES.map((role) => (
        <RoleCard
          key={role.key}
          role={role}
          selected={value === role.key}
          onPress={() => onChange(role.key)}
        />
      ))}
    </View>
  );
}

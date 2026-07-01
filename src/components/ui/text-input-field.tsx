/**
 * TextInputField — accessible form input with label, error display,
 * and optional password toggle.
 *
 * Matches the MemoLink design system: Atkinson Hyperlegible font,
 * 56px touch targets, Rounded.lg corners, themed border transitions.
 */

import { useState } from 'react';
import { View, TextInput, Text, Pressable, useColorScheme, Platform } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';

import { Colors, Spacing, Rounded, Typography } from '@/constants/theme';

type TextInputFieldProps = {
  /** Visible label above the input. */
  label: string;
  /** Validation error message — shown below the input in error color. */
  error?: string;
  /** Whether to render as a password field with toggle. */
  isPassword?: boolean;
  /** Whether this field is required. */
  required?: boolean;
} & Omit<TextInputProps, 'style'>;

export function TextInputField({
  label,
  error,
  isPassword = false,
  required = false,
  ...inputProps
}: TextInputFieldProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // 0 = unfocused, 1 = focused
  const progress = useSharedValue(0);

  // We want to force the progress to 1 immediately if there's an error,
  // or smoothly animate it on focus change.
  // Actually, we can use separate values or just re-calculate styles based on props + focus.
  // But doing it with Reanimated `progress` is smoother for focus/blur.
  
  // Update progress on focus/blur
  const handleFocus = (e: any) => {
    setIsFocused(true);
    progress.value = withTiming(1, { duration: 200 });
    inputProps.onFocus?.(e);
  };
  
  const handleBlur = (e: any) => {
    setIsFocused(false);
    progress.value = withTiming(0, { duration: 200 });
    inputProps.onBlur?.(e);
  };

  const outlineColor = `rgba(115, 119, 129, 0.35)`; // colors.outline @ 35%
  const focusFillColor = `rgba(17, 71, 131, 0.06)`; // colors.primary @ 6%
  const errorFillColor = `rgba(186, 26, 26, 0.04)`; // colors.error @ 4%

  const animatedContainerStyle = useAnimatedStyle(() => {
    if (error) {
      return {
        borderColor: colors.error,
        backgroundColor: errorFillColor,
        borderWidth: 2,
      };
    }
    return {
      borderColor: interpolateColor(progress.value, [0, 1], [outlineColor, colors.primary]),
      backgroundColor: interpolateColor(progress.value, [0, 1], [colors.surfaceContainer, focusFillColor]),
      borderWidth: interpolate(progress.value, [0, 1], [1.5, 2]),
    };
  }, [error, colors]);

  const iconColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.outline;

  return (
    <View style={{ gap: 6 }}>
      {/* Label (Above) */}
      <Text
        style={{
          fontFamily: 'AtkinsonHyperlegibleNext-Bold',
          fontSize: 16,
          lineHeight: 24,
          color: error ? colors.error : colors.text,
        }}
      >
        {label}
        {required && <Text style={{ color: colors.primary }}> *</Text>}
      </Text>

      {/* Input wrapper */}
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            height: Spacing.touchTarget,
            borderRadius: Rounded.lg, // 16px instead of 12px
            paddingHorizontal: Spacing.three,
            borderCurve: 'continuous',
          },
          animatedContainerStyle,
        ]}
      >
        <TextInput
          {...inputProps}
          secureTextEntry={isPassword && !isPasswordVisible}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={colors.outline}
          autoCapitalize={inputProps.autoCapitalize ?? 'none'}
          style={[{
            flex: 1,
            ...Typography.bodyLg,
            color: colors.text,
            height: '100%',
          }, Platform.OS === 'web' && { outlineStyle: 'none' }] as any}
          accessibilityLabel={label}
        />

        {/* Password visibility toggle */}
        {isPassword && (
          <Pressable
            onPress={() => setIsPasswordVisible((v) => !v)}
            hitSlop={12}
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={24}
              color={iconColor as string}
            />
          </Pressable>
        )}
      </Animated.View>

      {/* Error message */}
      {error ? (
        <Text
          style={{
            ...Typography.bodyMd,
            fontSize: 14,
            lineHeight: 20,
            color: colors.error,
          }}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

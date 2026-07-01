/**
 * TextInputField — accessible form input with label, error display,
 * and optional password toggle.
 *
 * Matches the MemoLink design system: Atkinson Hyperlegible font,
 * 56px touch targets, Rounded.md corners, themed border transitions.
 */

import { useState } from 'react';
import { View, TextInput, Text, Pressable, type TextInputProps, useColorScheme } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';

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

  const borderColor = error
    ? colors.error
    : isFocused
      ? colors.primary
      : colors.outline;

  return (
    <View style={{ gap: Spacing.one }}>
      {/* Label */}
      <Text
        style={{
          ...Typography.bodyMd,
          color: error ? colors.error : colors.textSecondary,
        }}
      >
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>

      {/* Input wrapper */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: Spacing.touchTarget,
          borderWidth: 2,
          borderColor,
          borderRadius: Rounded.md,
          backgroundColor: colors.backgroundElement,
          paddingHorizontal: Spacing.three,
          borderCurve: 'continuous',
        }}
      >
        <TextInput
          {...inputProps}
          secureTextEntry={isPassword && !isPasswordVisible}
          onFocus={(e) => {
            setIsFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            inputProps.onBlur?.(e);
          }}
          placeholderTextColor={colors.outline}
          autoCapitalize={inputProps.autoCapitalize ?? 'none'}
          style={{
            flex: 1,
            ...Typography.bodyLg,
            color: colors.text,
            height: '100%',
          }}
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
              color={colors.outline as string}
            />
          </Pressable>
        )}
      </View>

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

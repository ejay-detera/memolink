import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { TextInputField } from '@/components/ui/text-input-field';
import { FormButton } from '@/components/ui/form-button';
import { AuthBackground } from '@/components/ui/auth-background';
import { Colors, Spacing, Typography, Rounded, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function ResetPasswordScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { updatePassword } = useAuth();
  const router = useRouter();

  const handleUpdate = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const result = await updatePassword(password);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Update Failed', result.error ?? 'Unknown error occurred');
    } else {
      Alert.alert('Success', 'Your password has been updated successfully', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthBackground />

      <KeyboardAvoidingView
        style={{ flex: 1, zIndex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: Spacing.four,
            paddingBottom: Spacing.four,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            style={{ alignItems: 'center', marginBottom: Spacing.five }}
          >
            <View
              style={{
                width: 90,
                height: 90,
                borderRadius: 22,
                backgroundColor: 'rgba(255,255,255,0.95)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: Spacing.three,
                ...Shadows.card,
                shadowOpacity: 0.1,
                shadowRadius: 16,
                elevation: 5,
                borderWidth: 1,
                borderColor: 'rgba(17, 71, 131, 0.08)',
              }}
            >
              <Image
                source={require('../../../assets/public/memolink-icon.png')}
                style={{ width: 70, height: 70 }}
                contentFit="contain"
              />
            </View>
            <Text style={{ ...Typography.headlineMd, color: colors.text }}>
              Set New Password
            </Text>
            <Text
              style={{
                ...Typography.bodyMd,
                color: colors.textSecondary,
                marginTop: Spacing.one,
                textAlign: 'center',
              }}
            >
              Please enter your new password below
            </Text>
          </Animated.View>

          {/* Card */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(200)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.93)',
              borderRadius: Rounded.xl,
              padding: Spacing.four,
              borderWidth: 1,
              borderColor: 'rgba(17, 71, 131, 0.08)',
              ...Shadows.card,
              shadowOpacity: 0.12,
              shadowRadius: 28,
              elevation: 6,
              gap: Spacing.four,
            }}
          >
            <TextInputField
              label="New Password"
              placeholder="Enter new password"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoComplete="password-new"
              required
            />

            <TextInputField
              label="Confirm Password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              autoComplete="password-new"
              required
            />

            <FormButton
              title="Update Password"
              onPress={handleUpdate}
              loading={isLoading}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

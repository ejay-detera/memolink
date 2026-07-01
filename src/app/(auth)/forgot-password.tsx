import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, useColorScheme } from 'react-native';
import { Link, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { TextInputField } from '@/components/ui/text-input-field';
import { FormButton } from '@/components/ui/form-button';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function ForgotPasswordScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    const result = await resetPassword(email);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Reset Failed', result.error ?? 'Unknown error occurred');
    } else {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: Spacing.four }}>
        <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center', gap: Spacing.four }}>
          <Image source="sf:paperplane.fill" style={{ width: 80, height: 80 }} tintColor={colors.primary as string} />
          <Text style={{ ...Typography.displayLg, color: colors.text, textAlign: 'center' }}>Check your email</Text>
          <Text style={{ ...Typography.bodyLg, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.four }}>
            We've sent password reset instructions to {email}.
          </Text>
          <FormButton 
            title="Back to Login" 
            onPress={() => router.replace('/(auth)/login')} 
            style={{ width: '100%' }}
          />
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1, 
            padding: Spacing.four,
            justifyContent: 'center'
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ marginBottom: Spacing.six }}>
            <Text style={{ ...Typography.displayLg, color: colors.text }}>Reset Password</Text>
            <Text style={{ ...Typography.bodyLg, color: colors.textSecondary, marginTop: Spacing.two }}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ gap: Spacing.four }}>
            <TextInputField
              label="Email"
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              required
            />

            <FormButton
              title="Send Reset Link"
              onPress={handleReset}
              loading={isLoading}
              style={{ marginTop: Spacing.two }}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={{ marginTop: Spacing.six, alignItems: 'center' }}>
            <Link href="/(auth)/login" asChild>
              <Text style={{ ...Typography.labelLg, color: colors.primary }}>
                Return to Login
              </Text>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

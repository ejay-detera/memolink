import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, useColorScheme } from 'react-native';
import { Link, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { TextInputField } from '@/components/ui/text-input-field';
import { FormButton } from '@/components/ui/form-button';
import { AuthBackground } from '@/components/ui/auth-background';
import { Colors, Spacing, Typography, Rounded, Shadows } from '@/constants/theme';
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
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          padding: Spacing.four,
        }}
      >
        <AuthBackground />
        
        <View style={{ alignItems: 'center', gap: Spacing.four, zIndex: 1 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(255,255,255,0.95)',
              alignItems: 'center',
              justifyContent: 'center',
              ...Shadows.card,
            }}
          >
            <Image
              source={require('../../../assets/public/memolink-icon.png')}
              style={{ width: 72, height: 72 }}
              contentFit="contain"
            />
          </View>
          <Text
            style={{
              ...Typography.headlineLg,
              color: colors.text,
              textAlign: 'center',
            }}
          >
            Check your email
          </Text>
          <Text
            style={{
              ...Typography.bodyLg,
              color: colors.textSecondary,
              textAlign: 'center',
              marginBottom: Spacing.four,
            }}
          >
            We've sent password reset instructions to{'\n'}
            <Text style={{ color: colors.primary, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
              {email}
            </Text>
          </Text>
          <FormButton
            title="Back to Login"
            onPress={() => router.replace('/(auth)/login')}
            style={{ width: '100%' }}
          />
        </View>
      </SafeAreaView>
    );
  }

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
            <Image
              source={require('../../../assets/public/memolink-icon.png')}
              style={{ width: 72, height: 72, marginBottom: Spacing.three }}
              contentFit="contain"
            />
            <Text style={{ ...Typography.headlineMd, color: colors.text }}>
              Reset Password
            </Text>
            <Text
              style={{
                ...Typography.bodyMd,
                color: colors.textSecondary,
                marginTop: Spacing.one,
                textAlign: 'center',
              }}
            >
              Enter your email and we'll send you a reset link
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
            />
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(500).delay(300)}
            style={{ marginTop: Spacing.five, alignItems: 'center' }}
          >
            <Link href="/(auth)/login" asChild>
              <Text style={{ ...Typography.labelLg, color: colors.primary, fontSize: 18 }}>
                ← Return to Login
              </Text>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

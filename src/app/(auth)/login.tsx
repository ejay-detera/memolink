import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, useColorScheme } from 'react-native';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextInputField } from '@/components/ui/text-input-field';
import { FormButton } from '@/components/ui/form-button';
import { AuthBackground } from '@/components/ui/auth-background';
import { Colors, Spacing, Typography, Rounded, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    setIsLoading(true);
    const result = await signIn(email, password);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error ?? 'Unknown error occurred');
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
          {/* Logo section */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            style={{ alignItems: 'center', marginBottom: Spacing.five }}
          >
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 28,
                backgroundColor: 'rgba(255,255,255,0.95)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: Spacing.three,
                ...Shadows.card,
                shadowOpacity: 0.12,
                shadowRadius: 20,
                elevation: 6,
                borderWidth: 1,
                borderColor: 'rgba(17, 71, 131, 0.08)',
              }}
            >
              <Image
                source={require('../../../assets/public/memolink-icon.png')}
                style={{ width: 88, height: 88 }}
                contentFit="contain"
              />
            </View>
            <Text style={{ ...Typography.headlineMd, color: colors.text, letterSpacing: -0.5 }}>
              Welcome back
            </Text>
            <Text
              style={{
                ...Typography.bodyMd,
                color: colors.textSecondary,
                marginTop: Spacing.one,
                textAlign: 'center',
              }}
            >
              Sign in to MemoLink AI to continue
            </Text>
          </Animated.View>

          {/* Card */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(200)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.93)',
              borderRadius: Rounded.xl,
              padding: Spacing.four,
              paddingBottom: Spacing.five,
              borderWidth: 1,
              borderColor: 'rgba(17, 71, 131, 0.1)',
              ...Shadows.card,
              shadowOpacity: 0.12,
              shadowRadius: 28,
              elevation: 6,
              gap: Spacing.four,
            }}
          >
            <TextInputField
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              required
            />

            <TextInputField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoComplete="password"
              required
            />

            <Link href="/(auth)/forgot-password" asChild>
              <Text
                style={{
                  ...Typography.bodyMd,
                  color: colors.primary,
                  alignSelf: 'flex-end',
                  marginTop: -Spacing.two,
                }}
              >
                Forgot password?
              </Text>
            </Link>

            <FormButton
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              style={{ marginTop: Spacing.one }}
            />
          </Animated.View>

          {/* Divider */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(300)}
            style={{ marginTop: Spacing.five, alignItems: 'center' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.four }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.outline, opacity: 0.25 }} />
              <Text style={{ ...Typography.bodyMd, color: colors.textSecondary, fontSize: 13 }}>
                New to MemoLink?
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.outline, opacity: 0.25 }} />
            </View>

            <Link href="/(auth)/signup" asChild>
              <Text
                style={{
                  ...Typography.labelLg,
                  color: colors.primary,
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  paddingHorizontal: Spacing.four,
                  paddingVertical: Spacing.two + 2,
                  borderRadius: Rounded.md,
                  overflow: 'hidden',
                }}
              >
                Create an account
              </Text>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

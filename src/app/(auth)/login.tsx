import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, useColorScheme } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextInputField } from '@/components/ui/text-input-field';
import { FormButton } from '@/components/ui/form-button';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

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
    // Success is handled by the auth provider listener directing the user
  };

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
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ alignItems: 'center', marginBottom: Spacing.six }}>
            {/* Minimal logo representation for now */}
            <View style={{ 
              width: 80, height: 80, borderRadius: 20, 
              backgroundColor: colors.primary, 
              alignItems: 'center', justifyContent: 'center',
              marginBottom: Spacing.four
            }}>
              <Image 
                source="sf:brain.head.profile" 
                style={{ width: 48, height: 48 }} 
                tintColor="#ffffff" 
              />
            </View>
            <Text style={{ ...Typography.displayLg, color: colors.text }}>
              Welcome back
            </Text>
            <Text style={{ ...Typography.bodyLg, color: colors.textSecondary, marginTop: Spacing.two, textAlign: 'center' }}>
              Sign in to MemoLink AI to continue
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ gap: Spacing.four }}>
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
                  ...Typography.labelLg, 
                  color: colors.primary, 
                  alignSelf: 'flex-end',
                  marginTop: -Spacing.two
                }}
              >
                Forgot password?
              </Text>
            </Link>

            <FormButton
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              style={{ marginTop: Spacing.two }}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={{ marginTop: Spacing.six, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.outline, opacity: 0.3 }} />
              <Text style={{ ...Typography.bodyMd, color: colors.textSecondary }}>OR</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.outline, opacity: 0.3 }} />
            </View>

            <View style={{ flexDirection: 'row', marginTop: Spacing.four }}>
              <Text style={{ ...Typography.bodyLg, color: colors.textSecondary }}>
                Don't have an account?{' '}
              </Text>
              <Link href="/(auth)/signup" asChild>
                <Text style={{ ...Typography.labelLg, color: colors.primary }}>
                  Sign Up
                </Text>
              </Link>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

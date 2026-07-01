import { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import Animated, { FadeInDown, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { TextInputField } from '@/components/ui/text-input-field';
import { FormButton } from '@/components/ui/form-button';
import { RolePicker } from '@/components/ui/role-picker';
import { AuthBackground } from '@/components/ui/auth-background';
import { Colors, Spacing, Typography, Rounded, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import type { AppRole } from '@/types/auth';

export default function SignupScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();

  const handleNextStep = () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
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
    setStep(2);
  };

  const handleSignup = async () => {
    if (!role) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    setIsLoading(true);
    const result = await signUp({
      email,
      password,
      firstName,
      middleName: middleName || undefined,
      lastName,
      phone: phone || undefined,
      role,
    });
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Signup Failed', result.error ?? 'Unknown error occurred');
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
        
        <View
          style={{
            alignItems: 'center',
            gap: Spacing.four,
            paddingHorizontal: Spacing.three,
            zIndex: 1,
          }}
        >
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
            style={{ ...Typography.headlineLg, color: colors.text, textAlign: 'center' }}
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
            We've sent a verification link to{' '}
            <Text style={{ color: colors.primary, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
              {email}
            </Text>
            .{'\n'}Please click the link to verify your account before logging in.
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
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo header */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.two,
              marginTop: Spacing.four,
              marginBottom: Spacing.four,
            }}
          >
            <Image
              source={require('../../../assets/public/memolink-icon.png')}
              style={{ width: 40, height: 40 }}
              contentFit="contain"
            />
            <Text
              style={{
                ...Typography.headlineMd,
                color: colors.primary,
                letterSpacing: -0.5,
              }}
            >
              MemoLink AI
            </Text>
          </Animated.View>

          {/* Step indicator */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(150)}
            style={{
              flexDirection: 'row',
              gap: Spacing.two,
              marginBottom: Spacing.four,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.primary,
              }}
            />
            <View
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: step === 2 ? colors.primary : `${colors.primary}30`,
              }}
            />
          </Animated.View>

          {step === 1 ? (
            <Animated.View
              key="step1"
              entering={SlideInRight.duration(300)}
              exiting={SlideOutLeft.duration(300)}
              style={{ gap: Spacing.four }}
            >
              <View style={{ marginBottom: Spacing.two }}>
                <Text style={{ ...Typography.headlineMd, color: colors.text }}>
                  Create Account
                </Text>
                <Text
                  style={{
                    ...Typography.bodyMd,
                    color: colors.textSecondary,
                    marginTop: Spacing.one,
                  }}
                >
                  Step 1 of 2 — Your details
                </Text>
              </View>

              {/* Card */}
              <View
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
                  label="First Name"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoComplete="name-given"
                  required
                />

                <TextInputField
                  label="Middle Name"
                  placeholder="Optional"
                  value={middleName}
                  onChangeText={setMiddleName}
                  autoComplete="name-middle"
                />

                <TextInputField
                  label="Last Name"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoComplete="name-family"
                  required
                />

                <TextInputField
                  label="Email"
                  placeholder="Enter your email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoComplete="email"
                  required
                />

                <TextInputField
                  label="Phone Number"
                  placeholder="Optional"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />

                <TextInputField
                  label="Password"
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  autoComplete="password-new"
                  required
                />

                <TextInputField
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                  autoComplete="password-new"
                  required
                />
              </View>

              <FormButton
                title="Continue →"
                onPress={handleNextStep}
                style={{ marginTop: Spacing.two }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginTop: Spacing.two,
                }}
              >
                <Text style={{ ...Typography.bodyMd, color: colors.textSecondary }}>
                  Already have an account?{' '}
                </Text>
                <Link href="/(auth)/login" asChild>
                  <Text style={{ ...Typography.labelLg, color: colors.primary, fontSize: 18 }}>
                    Log In
                  </Text>
                </Link>
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              key="step2"
              entering={SlideInRight.duration(300)}
              exiting={SlideOutLeft.duration(300)}
              style={{ gap: Spacing.four, flex: 1 }}
            >
              <View style={{ marginBottom: Spacing.two }}>
                <Text style={{ ...Typography.headlineMd, color: colors.text }}>
                  Choose Your Role
                </Text>
                <Text
                  style={{
                    ...Typography.bodyMd,
                    color: colors.textSecondary,
                    marginTop: Spacing.one,
                  }}
                >
                  Step 2 of 2 — How will you use MemoLink?
                </Text>
              </View>

              <RolePicker value={role} onChange={setRole} />

              <View style={{ flex: 1 }} />

              <FormButton
                title="Create Account"
                onPress={handleSignup}
                loading={isLoading}
              />

              <FormButton
                title="Back"
                onPress={() => setStep(1)}
                variant="outline"
                disabled={isLoading}
              />
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

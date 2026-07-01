import { useState } from 'react';
import { Text, KeyboardAvoidingView, Platform, ScrollView, Alert, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextInputField } from '@/components/ui/text-input-field';
import { FormButton } from '@/components/ui/form-button';
import { Colors, Spacing, Typography } from '@/constants/theme';
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
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    }
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
            justifyContent: 'center'
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ marginBottom: Spacing.six }}>
            <Text style={{ ...Typography.displayLg, color: colors.text }}>Set New Password</Text>
            <Text style={{ ...Typography.bodyLg, color: colors.textSecondary, marginTop: Spacing.two }}>
              Please enter your new password below.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ gap: Spacing.four }}>
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
              style={{ marginTop: Spacing.two }}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

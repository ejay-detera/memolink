import { useState } from 'react';
import { View, StyleSheet, ScrollView, useColorScheme, ActivityIndicator, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextInputField } from '@/components/ui/text-input-field';

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user } = useAuth();
  
  const [uploading, setUploading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const firstName = user?.user_metadata?.first_name || 'User';

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from library');
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);
      if (!user) return;

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`
        });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl }
      });

      if (updateError) throw updateError;
      
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (updatingProfile) return;
    try {
      setUpdatingProfile(true);
      const { error } = await supabase.auth.updateUser({
        data: { phone }
      });
      if (error) throw error;
      
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone })
          .eq('id', user.id);
        if (profileError) throw profileError;
      }
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (updatingPassword || !password || !confirmPassword) return;
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setUpdatingPassword(true);
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      Alert.alert('Success', 'Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={{ padding: Spacing.two, marginLeft: -Spacing.two, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="chevron-back" color={colors.primary} size={28} />
          </Pressable>
          <ThemedText style={{ fontSize: 20, fontFamily: 'AtkinsonHyperlegibleNext-Bold', flex: 1, textAlign: 'center', marginRight: 44 }}>
            Profile Settings
          </ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Pressable onPress={pickImage} style={[styles.avatarContainer, { borderColor: colors.outline }]}>
              {uploading ? (
                <ActivityIndicator color={colors.primary} size="large" />
              ) : avatarUrl ? (
                <Image source={avatarUrl} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <SymbolView name="person.circle.fill" tintColor={colors.primary} size={80} />
              )}
              <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                <SymbolView name="camera.fill" tintColor={colors.background} size={14} />
              </View>
            </Pressable>
            <ThemedText style={{ marginTop: Spacing.three, fontSize: 24, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
              {firstName}
            </ThemedText>
            <ThemedText style={{ color: colors.textSecondary, marginTop: Spacing.one }}>
              {user?.email}
            </ThemedText>
          </View>

          <View style={{ height: 1, backgroundColor: colors.outline, marginVertical: Spacing.six }} />

          {/* Personal Info Section */}
          <View style={styles.section}>
            <ThemedText style={{ fontSize: 20, fontFamily: 'AtkinsonHyperlegibleNext-Bold', marginBottom: Spacing.four }}>
              Personal Info
            </ThemedText>
            
            <View style={{ marginBottom: Spacing.four }}>
              <TextInputField
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
            
            <PrimaryButton 
              title={updatingProfile ? "Updating..." : "Update Profile"} 
              onPress={handleUpdateProfile} 
            />
          </View>

          <View style={{ height: 1, backgroundColor: colors.outline, marginVertical: Spacing.six }} />

          {/* Security Section */}
          <View style={styles.section}>
            <ThemedText style={{ fontSize: 20, fontFamily: 'AtkinsonHyperlegibleNext-Bold', marginBottom: Spacing.four }}>
              Change Password
            </ThemedText>
            
            <View style={{ marginBottom: Spacing.three }}>
              <TextInputField
                label="New Password"
                value={password}
                onChangeText={setPassword}
                isPassword
                autoCapitalize="none"
              />
            </View>
            
            <View style={{ marginBottom: Spacing.four }}>
              <TextInputField
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                autoCapitalize="none"
              />
            </View>
            
            <PrimaryButton 
              title={updatingPassword ? "Updating..." : "Update Password"} 
              onPress={handleUpdatePassword} 
            />
          </View>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  section: {
    marginBottom: Spacing.four,
  }
});

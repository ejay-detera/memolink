import { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, ActivityIndicator, Alert, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, MaxContentWidth, Shadows } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextInputField } from '@/components/ui/text-input-field';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(base64), {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

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
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || Spacing.four }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" color="#00366b" size={28} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>
          Profile Settings
        </ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Pressable onPress={pickImage} style={styles.avatarContainer}>
            {uploading ? (
              <ActivityIndicator color="#00366b" size="large" />
            ) : avatarUrl ? (
              <Image source={avatarUrl} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Ionicons name="person-circle" color="#e4e2e2" size={120} />
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" color="#ffffff" size={16} />
            </View>
          </Pressable>
          <ThemedText style={styles.userName}>
            {firstName}
          </ThemedText>
          <ThemedText style={styles.userEmail}>
            {user?.email}
          </ThemedText>
        </View>

        {/* Personal Info Bento Card */}
        <View style={styles.bentoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={24} color="#00366b" />
            <ThemedText style={styles.cardTitle}>Personal Info</ThemedText>
          </View>
          
          <View style={{ marginBottom: Spacing.four }}>
            <TextInputField
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
          
          <PrimaryButton 
            title={updatingProfile ? "Updating..." : "Save Changes"} 
            onPress={handleUpdateProfile} 
          />
        </View>

        {/* Security Bento Card */}
        <View style={styles.bentoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed-outline" size={24} color="#00366b" />
            <ThemedText style={styles.cardTitle}>Security</ThemedText>
          </View>
          
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fbf9f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    backgroundColor: '#ffffff',
    ...(Platform.select<any>({
      ios: Shadows.card,
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    })),
    zIndex: 10,
  },
  backButton: {
    padding: Spacing.two, 
    marginLeft: -Spacing.two, 
    width: 44, 
    height: 44, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {} as any),
  },
  headerTitle: {
    fontSize: 20, 
    fontFamily: 'AtkinsonHyperlegibleNext-Bold', 
    color: '#00366b',
    flex: 1, 
    textAlign: 'center'
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.six,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...(Platform.select<any>({
      ios: Shadows.card,
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    })),
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00366b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fbf9f8',
  },
  userName: {
    marginTop: Spacing.three, 
    fontSize: 28, 
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    color: '#00366b',
  },
  userEmail: {
    color: '#4e617a', 
    fontSize: 16,
    marginTop: 4,
  },
  bentoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    ...(Platform.select<any>({
      ios: Shadows.card,
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    })),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#f0eded',
  },
  cardTitle: {
    fontSize: 20, 
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    color: '#00366b',
  }
});

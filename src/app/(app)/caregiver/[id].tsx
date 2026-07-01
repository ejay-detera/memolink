import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, useColorScheme, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { Colors } from '@/constants/theme';

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export default function CaregiverProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error fetching caregiver profile:', error);
        Alert.alert('Error', 'Failed to load profile.');
        router.back();
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    
    if (id) {
      fetchProfile();
    }
  }, [id, router]);

  const handleRemove = () => {
    Alert.alert(
      'Remove Caregiver',
      `Are you sure you want to remove ${profile?.first_name} as your caregiver?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            setRemoving(true);
            const { error } = await supabase
              .from('caregiver_senior_connections')
              .delete()
              .eq('senior_id', user.id)
              .eq('caregiver_id', id);

            setRemoving(false);
            
            if (error) {
              console.error('Error removing connection:', error);
              Alert.alert('Error', 'Failed to remove caregiver.');
            } else {
              Alert.alert('Success', 'Caregiver removed.');
              router.back();
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Caregiver Profile</Text>
        <View style={styles.placeholderRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            {profile.avatar_url ? (
               <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                {(profile.first_name?.[0] || '') + (profile.last_name?.[0] || '')}
              </Text>
            )}
          </View>
          
          <Text style={[styles.name, { color: colors.text }]}>
            {profile.first_name} {profile.last_name}
          </Text>
          <Text style={[styles.roleLabel, { color: colors.text + '80' }]}>Caregiver</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff') }]}>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color={colors.text + '80'} style={styles.infoIcon} />
              <View>
                <Text style={[styles.infoLabel, { color: colors.text + '80' }]}>Email</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{profile.email || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.removeButton, { backgroundColor: '#ff3b30' }, removing && { opacity: 0.7 }]}
          onPress={handleRemove}
          disabled={removing}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" style={styles.removeIcon} />
          <Text style={styles.removeButtonText}>{removing ? 'Removing...' : 'Remove Caregiver'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholderRight: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: 100,
    height: 100,
  },
  avatarInitials: {
    fontWeight: 'bold',
    fontSize: 36,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleLabel: {
    fontSize: 16,
  },
  infoSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  removeIcon: {
    marginRight: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

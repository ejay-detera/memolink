import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { Colors } from '@/constants/theme';

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string;
};

type ConnectionItem = Profile & { connection_id: string };

export default function SeniorCaregiversPage() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user } = useAuth();
  const router = useRouter();

  const [pendingInvitations, setPendingInvitations] = useState<ConnectionItem[]>([]);
  const [connectedCaregivers, setConnectedCaregivers] = useState<ConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    // Fetch all connections where senior_id is current user
    const { data, error } = await supabase
      .from('caregiver_senior_connections')
      .select(`
        id,
        status,
        caregiver_id,
        profiles!caregiver_senior_connections_caregiver_id_fkey(id, first_name, last_name, avatar_url, email, role)
      `)
      .eq('senior_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching caregivers:', error);
    } else if (data) {
      const pending: ConnectionItem[] = [];
      const connected: ConnectionItem[] = [];
      
      data.forEach((conn: any) => {
        const item = {
          connection_id: conn.id,
          ...conn.profiles
        };
        if (conn.status === 'pending') {
          pending.push(item);
        } else if (conn.status === 'accepted') {
          connected.push(item);
        }
      });
      
      setPendingInvitations(pending);
      setConnectedCaregivers(connected);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleAccept = async (connectionId: string) => {
    const { error } = await supabase
      .from('caregiver_senior_connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId);
      
    if (error) {
      console.error('Error accepting:', error);
      Alert.alert('Error', 'Failed to accept invitation.');
    } else {
      fetchConnections();
    }
  };

  const handleReject = async (connectionId: string) => {
    const { error } = await supabase
      .from('caregiver_senior_connections')
      .delete()
      .eq('id', connectionId);
      
    if (error) {
      console.error('Error rejecting:', error);
      Alert.alert('Error', 'Failed to reject invitation.');
    } else {
      fetchConnections();
    }
  };

  const renderPendingItem = ({ item }: { item: ConnectionItem }) => (
    <View style={[styles.pendingCard, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff') }]}>
      <View style={styles.profileInfo}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
          {item.avatar_url ? (
             <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <Text style={[styles.avatarInitials, { color: colors.primary }]}>
              {(item.first_name?.[0] || '') + (item.last_name?.[0] || '')}
            </Text>
          )}
        </View>
        <View style={styles.nameContainer}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {item.first_name} {item.last_name}
          </Text>
          <Text style={[styles.profileRole, { color: colors.text + '80' }]}>Wants to connect</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item.connection_id)}
        >
          <Text style={styles.rejectButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.primary }]}
          onPress={() => handleAccept(item.connection_id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConnectedItem = ({ item }: { item: ConnectionItem }) => (
    <TouchableOpacity 
      style={[styles.connectedCard, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff') }]}
      onPress={() => router.push(`/caregiver/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
        {item.avatar_url ? (
           <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <Text style={[styles.avatarInitials, { color: colors.primary }]}>
            {(item.first_name?.[0] || '') + (item.last_name?.[0] || '')}
          </Text>
        )}
      </View>
      <View style={styles.nameContainer}>
        <Text style={[styles.profileName, { color: colors.text }]}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={[styles.profileRole, { color: colors.text + '80' }]}>Caregiver</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text + '40'} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Caregivers</Text>
      </View>

      <FlatList
        data={connectedCaregivers}
        keyExtractor={item => item.connection_id}
        renderItem={renderConnectedItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchConnections}
        refreshing={loading}
        ListHeaderComponent={
          <>
            {pendingInvitations.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Pending Invitations ({pendingInvitations.length})
                </Text>
                {pendingInvitations.map(item => (
                  <React.Fragment key={item.connection_id}>
                    {renderPendingItem({ item })}
                  </React.Fragment>
                ))}
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: pendingInvitations.length ? 16 : 0 }]}>
              My Caregivers
            </Text>
            
            {!loading && connectedCaregivers.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="medical-outline" size={48} color={colors.text + '40'} />
                <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                  You don&apos;t have any caregivers connected yet. Ask them to search for your name to send an invite!
                </Text>
              </View>
            )}
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  pendingCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatar: {
    width: 48,
    height: 48,
  },
  avatarInitials: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  nameContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileRole: {
    fontSize: 13,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: '#00000010',
  },
  rejectButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  acceptButton: {
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  connectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    lineHeight: 22,
  },
});

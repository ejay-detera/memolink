import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, FlatList, Alert, Modal, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { Colors, Spacing, Rounded, MaxContentWidth, Shadows } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from 'react-native';

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
  
  // Terms & Conditions Modal state
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionItem | null>(null);

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
    <View style={[styles.pendingCard, { backgroundColor: colors.backgroundElement }]}>
      <View style={styles.profileInfo}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
          {item.avatar_url ? (
             <Image source={item.avatar_url} style={styles.avatar} contentFit="cover" />
          ) : (
            <ThemedText style={[styles.avatarInitials, { color: colors.primary }]}>
              {(item.first_name?.[0] || '') + (item.last_name?.[0] || '')}
            </ThemedText>
          )}
        </View>
        <View style={styles.nameContainer}>
          <ThemedText style={[styles.profileName, { color: colors.text }]}>
            {item.first_name} {item.last_name}
          </ThemedText>
          <ThemedText style={[styles.profileRole, { color: colors.textSecondary }]}>Wants to connect</ThemedText>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <Pressable 
          style={[styles.actionButton, styles.rejectButton, { backgroundColor: colors.surfaceContainer }]}
          onPress={() => handleReject(item.connection_id)}
        >
          <ThemedText style={[styles.rejectButtonText, { color: colors.text }]}>Decline</ThemedText>
        </Pressable>
        <Pressable 
          style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setSelectedConnection(item);
            setTermsModalVisible(true);
          }}
        >
          <ThemedText style={[styles.acceptButtonText, { color: '#ffffff' }]}>Accept</ThemedText>
        </Pressable>
      </View>
    </View>
  );

  const renderConnectedItem = ({ item }: { item: ConnectionItem }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.connectedCard, 
        { backgroundColor: colors.backgroundElement },
        pressed && { opacity: 0.8 }
      ]}
      onPress={() => router.push(`/caregiver/${item.id}`)}
    >
      <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
        {item.avatar_url ? (
           <Image source={item.avatar_url} style={styles.avatar} contentFit="cover" />
        ) : (
          <ThemedText style={[styles.avatarInitials, { color: colors.primary }]}>
            {(item.first_name?.[0] || '') + (item.last_name?.[0] || '')}
          </ThemedText>
        )}
      </View>
      <View style={styles.nameContainer}>
        <ThemedText style={[styles.profileName, { color: colors.text }]}>
          {item.first_name} {item.last_name}
        </ThemedText>
        <ThemedText style={[styles.profileRole, { color: colors.textSecondary }]}>Caregiver</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.outline} />
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: colors.text }]}>Caregivers</ThemedText>
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
                  <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                    Pending Invitations ({pendingInvitations.length})
                  </ThemedText>
                  {pendingInvitations.map(item => (
                    <React.Fragment key={item.connection_id}>
                      {renderPendingItem({ item })}
                    </React.Fragment>
                  ))}
                </View>
              )}

              <ThemedText style={[styles.sectionTitle, { color: colors.text, marginTop: pendingInvitations.length ? Spacing.four : 0 }]}>
                My Caregivers
              </ThemedText>
              
              {!loading && connectedCaregivers.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="medical-outline" size={48} color={colors.outline} />
                  <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                    You don&apos;t have any caregivers connected yet. Ask them to search for your name to send an invite!
                  </ThemedText>
                </View>
              )}
            </>
          }
        />

        {/* TERMS & CONDITIONS ACCEPTANCE MODAL */}
        <Modal
          visible={termsModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setTermsModalVisible(false);
            setSelectedConnection(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.backgroundElement }]}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Caregiver Access Terms</ThemedText>
              
              <ThemedText style={[styles.modalDesc, { color: colors.textSecondary }]}>
                By accepting <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold', color: colors.text }}>{selectedConnection?.first_name} {selectedConnection?.last_name}</ThemedText> as your caregiver, you agree to grant them permissions to:
              </ThemedText>

              <View style={styles.termsList}>
                <View style={styles.termsItem}>
                  <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} style={{ marginTop: 2 }} />
                  <ThemedText style={[styles.termsText, { color: colors.text }]}>
                    <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>Access Memory Vault:</ThemedText> View and create folders, and upload photos, videos, and documents to your vault.
                  </ThemedText>
                </View>
                <View style={styles.termsItem}>
                  <Ionicons name="medical-outline" size={22} color={colors.primary} style={{ marginTop: 2 }} />
                  <ThemedText style={[styles.termsText, { color: colors.text }]}>
                    <ThemedText style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>Add Medication & Schedule:</ThemedText> Create and modify routines, medication times, and calendar appointments.
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={[styles.modalWarning, { color: colors.error }]}>
                Make sure you trust this person before granting them access to your data.
              </ThemedText>

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalBtn, styles.modalCancelBtn, { borderColor: colors.outline }]}
                  onPress={() => {
                    setTermsModalVisible(false);
                    setSelectedConnection(null);
                  }}
                >
                  <ThemedText style={[styles.modalCancelText, { color: colors.text }]}>Decline</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, styles.modalAcceptBtn, { backgroundColor: colors.primary }]}
                  onPress={async () => {
                    if (selectedConnection) {
                      await handleAccept(selectedConnection.connection_id);
                      setTermsModalVisible(false);
                      setSelectedConnection(null);
                    }
                  }}
                >
                  <ThemedText style={[styles.modalAcceptText, { color: '#ffffff' }]}>Agree & Accept</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  title: {
    fontSize: 32,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  section: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    marginBottom: Spacing.three,
  },
  pendingCard: {
    padding: Spacing.four,
    borderRadius: Rounded.lg,
    marginBottom: Spacing.three,
    ...(Shadows.card as any),
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
    overflow: 'hidden',
  },
  avatar: {
    width: 48,
    height: 48,
  },
  avatarInitials: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 18,
  },
  nameContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
  profileRole: {
    fontSize: 14,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
  },
  rejectButtonText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  acceptButton: {
  },
  acceptButtonText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  connectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Rounded.lg,
    marginBottom: Spacing.three,
    ...(Shadows.card as any),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    marginTop: Spacing.four,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.four,
    fontSize: 16,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    borderRadius: Rounded.lg,
    padding: Spacing.five,
    ...(Shadows.card as any),
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    marginBottom: Spacing.three,
  },
  modalDesc: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: Spacing.four,
  },
  termsList: {
    gap: Spacing.three,
    marginBottom: Spacing.five,
  },
  termsItem: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  termsText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  modalWarning: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: Spacing.five,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    borderWidth: 1,
  },
  modalAcceptBtn: {
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
  modalAcceptText: {
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
});

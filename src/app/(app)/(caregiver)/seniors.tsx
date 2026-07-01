import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, useColorScheme, ActivityIndicator, Alert, Image } from 'react-native';
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
  role: string;
};

export default function CaregiverSeniorsPage() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [connectedSeniors, setConnectedSeniors] = useState<(Profile & { connection_id: string })[]>([]);
  const [pendingSeniorIds, setPendingSeniorIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    // Fetch all connections
    const { data, error } = await supabase
      .from('caregiver_senior_connections')
      .select(`
        id,
        status,
        senior_id,
        profiles!caregiver_senior_connections_senior_id_fkey(id, first_name, last_name, avatar_url, role)
      `)
      .eq('caregiver_id', user.id);

    if (error) {
      console.error('Error fetching connected seniors:', error);
    } else if (data) {
      const connected: any[] = [];
      const pending = new Set<string>();
      
      data.forEach((conn: any) => {
        if (conn.status === 'accepted') {
          connected.push({ connection_id: conn.id, ...conn.profiles });
        } else if (conn.status === 'pending') {
          pending.add(conn.senior_id);
        }
      });
      
      setConnectedSeniors(connected);
      setPendingSeniorIds(pending);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    
    // Exact match on first_name OR last_name for users with role 'senior'
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role')
      .eq('role', 'senior')
      .or(`first_name.ilike.${searchQuery.trim()},last_name.ilike.${searchQuery.trim()}`);

    if (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to search for seniors.');
    } else {
      // Filter out those we've already connected to
      const myConnectionIds = new Set(connectedSeniors.map(s => s.id));
      const filteredData = (data || []).filter(p => !myConnectionIds.has(p.id));
      setSearchResults(filteredData);
    }
    setIsSearching(false);
  };

  const handleInvite = async (seniorId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('caregiver_senior_connections')
      .insert({
        caregiver_id: user.id,
        senior_id: seniorId,
        status: 'pending'
      });

    if (error) {
      // Postgres unique constraint error code is usually '23505'
      if (error.code === '23505') {
        Alert.alert('Info', 'You have already sent an invitation to this senior or are already connected.');
      } else {
        console.error('Invite error:', error);
        Alert.alert('Error', 'Failed to send invitation.');
      }
    } else {
      Alert.alert('Success', 'Invitation sent successfully!');
      // Update pending set so UI updates instantly
      setPendingSeniorIds(prev => new Set(prev).add(seniorId));
    }
  };

  const renderSearchResult = ({ item }: { item: Profile }) => {
    const isPending = pendingSeniorIds.has(item.id);
    
    return (
      <View style={[styles.searchResultItem, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff') }]}>
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
          <Text style={[styles.profileName, { color: colors.text }]}>
            {item.first_name} {item.last_name}
          </Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.inviteButton, 
            { backgroundColor: isPending ? colors.text + '20' : colors.primary }
          ]}
          onPress={() => handleInvite(item.id)}
          disabled={isPending}
        >
          <Text style={[styles.inviteButtonText, isPending && { color: colors.text + '80' }]}>
            {isPending ? 'Invited' : 'Invite'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderConnectedSenior = ({ item }: { item: Profile & { connection_id: string } }) => (
    <TouchableOpacity 
      style={[styles.gridItem, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff') }]}
      onPress={() => router.push(`/senior/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.gridAvatar, { backgroundColor: colors.primary + '20' }]}>
        {item.avatar_url ? (
           <Image source={{ uri: item.avatar_url }} style={styles.gridAvatarImage} />
        ) : (
          <Text style={[styles.gridAvatarInitials, { color: colors.primary }]}>
            {(item.first_name?.[0] || '') + (item.last_name?.[0] || '')}
          </Text>
        )}
      </View>
      <Text style={[styles.gridName, { color: colors.text }]} numberOfLines={1}>
        {item.first_name}
      </Text>
      <Text style={[styles.gridLastName, { color: colors.text + '80' }]} numberOfLines={1}>
        {item.last_name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Seniors</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: colors.backgroundElement || (scheme === 'dark' ? '#1c1c1e' : '#ffffff') }]}>
            <Ionicons name="search" size={20} color={colors.text + '80'} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by exact first or last name"
              placeholderTextColor={colors.text + '50'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: colors.primary }]} 
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>Find</Text>
          </TouchableOpacity>
        </View>

        {isSearching && <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />}

        {searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Search Results</Text>
            <FlatList
              data={searchResults}
              keyExtractor={item => item.id}
              renderItem={renderSearchResult}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 200 }}
            />
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>My Seniors</Text>
        
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
        ) : connectedSeniors.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.text + '40'} />
            <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
              You haven&apos;t connected with any seniors yet. Use the search bar above to invite them.
            </Text>
          </View>
        ) : (
          <FlatList
            data={connectedSeniors}
            keyExtractor={item => item.connection_id}
            renderItem={renderConnectedSenior}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContainer}
            onRefresh={fetchConnections}
            refreshing={loading}
          />
        )}
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchButton: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 10,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchResultsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
  },
  avatarInitials: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '500',
  },
  inviteButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItem: {
    width: '48%',
    aspectRatio: 0.85,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  gridAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  gridAvatarImage: {
    width: 70,
    height: 70,
  },
  gridAvatarInitials: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  gridName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridLastName: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
});

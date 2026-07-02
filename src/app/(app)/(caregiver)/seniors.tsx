import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TextInput, Pressable, FlatList, ActivityIndicator, Alert, ScrollView, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { Colors, Spacing, Rounded, MaxContentWidth, Shadows } from '@/constants/theme';
import { useBottomSpace } from '@/hooks/use-bottom-space';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from 'react-native';

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
  const bottomSpace = useBottomSpace();
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
      <View style={[styles.searchResultItem, { backgroundColor: colors.backgroundElement }]}>
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
          <ThemedText style={[styles.profileName, { color: colors.text }]}>
            {item.first_name} {item.last_name}
          </ThemedText>
        </View>
        <Pressable 
          style={[
            styles.inviteButton, 
            { backgroundColor: isPending ? colors.surfaceContainer : colors.primary }
          ]}
          onPress={() => handleInvite(item.id)}
          disabled={isPending}
        >
          <ThemedText style={[styles.inviteButtonText, { color: isPending ? colors.textSecondary : '#ffffff' }]}>
            {isPending ? 'Invited' : 'Invite'}
          </ThemedText>
        </Pressable>
      </View>
    );
  };

  const renderConnectedSenior = ({ item }: { item: Profile & { connection_id: string } }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.gridItem, 
        { backgroundColor: colors.backgroundElement },
        pressed && { opacity: 0.8 }
      ]}
      onPress={() => router.push(`/senior/${item.id}`)}
    >
      <View style={[styles.gridAvatar, { backgroundColor: colors.primary + '20' }]}>
        {item.avatar_url ? (
           <Image source={item.avatar_url} style={styles.gridAvatarImage} contentFit="cover" />
        ) : (
          <ThemedText style={[styles.gridAvatarInitials, { color: colors.primary }]}>
            {(item.first_name?.[0] || '') + (item.last_name?.[0] || '')}
          </ThemedText>
        )}
      </View>
      <ThemedText style={[styles.gridName, { color: colors.text }]} numberOfLines={1}>
        {item.first_name}
      </ThemedText>
      <ThemedText style={[styles.gridLastName, { color: colors.textSecondary }]} numberOfLines={1}>
        {item.last_name}
      </ThemedText>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: colors.text }]}>Seniors</ThemedText>
        </View>

        <ScrollView 
          contentContainerStyle={[styles.content, { paddingBottom: bottomSpace + Spacing.five }]} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchConnections} tintColor={colors.primary} />
          }
        >
          <View style={styles.searchSection}>
            <View style={[styles.searchBar, { backgroundColor: colors.backgroundElement }]}>
              <Ionicons name="search" size={20} color={colors.outline} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search by exact first or last name"
                placeholderTextColor={colors.outline}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>
            <Pressable 
              style={[styles.searchButton, { backgroundColor: colors.primary }]} 
              onPress={handleSearch}
            >
              <ThemedText style={styles.searchButtonText}>Find</ThemedText>
            </Pressable>
          </View>

          {isSearching && <ActivityIndicator style={{ marginTop: Spacing.four }} color={colors.primary} />}

          {searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Search Results</ThemedText>
              <FlatList
                data={searchResults}
                keyExtractor={item => item.id}
                renderItem={renderSearchResult}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 250 }}
                scrollEnabled={true}
                nestedScrollEnabled={true}
              />
            </View>
          )}

          <ThemedText style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.five }]}>My Seniors</ThemedText>
          
          {loading ? (
            <ActivityIndicator style={{ marginTop: Spacing.four }} color={colors.primary} />
          ) : connectedSeniors.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={colors.outline} />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                You haven&apos;t connected with any seniors yet. Use the search bar above to invite them.
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={connectedSeniors}
              keyExtractor={item => item.connection_id}
              renderItem={renderConnectedSenior}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </ScrollView>
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
  content: {
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.three,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
  },
  searchButton: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    borderRadius: Rounded.md,
    marginLeft: Spacing.two,
  },
  searchButtonText: {
    color: '#fff',
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  searchResultsContainer: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    marginBottom: Spacing.three,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Rounded.lg,
    marginBottom: Spacing.two,
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
    marginRight: Spacing.three,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
  },
  avatarInitials: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  profileName: {
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
  },
  inviteButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Rounded.full,
  },
  inviteButtonText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.four,
    fontSize: 16,
    lineHeight: 22,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  gridItem: {
    width: '48%',
    aspectRatio: 0.85,
    borderRadius: Rounded.lg,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Shadows.card as any),
  },
  gridAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
    overflow: 'hidden',
  },
  gridAvatarImage: {
    width: 70,
    height: 70,
  },
  gridAvatarInitials: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 24,
  },
  gridName: {
    fontSize: 18,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    textAlign: 'center',
  },
  gridLastName: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
});
